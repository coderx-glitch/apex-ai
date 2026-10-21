import{authorize,json}from'../lib/security.js';
import{rateLimit}from'../lib/limits.js';
// Owner-only bridge to the Gemini Files API. Whole files never fit in one
// serverless request, so the browser sends small chunks and we forward each
// one to Google's resumable upload session. Free tier: 2 GB per file, files
// auto-delete after 48 hours. Nothing is stored on this server between calls.
const MAX_FILE=400*1024*1024,MAX_CHUNK=4200000;
const MIMES=/^(image\/(png|jpeg|webp)|video\/(mp4|mpeg|mov|avi|webm|wmv|3gpp|quicktime)|audio\/(aac|flac|mp3|mpa|mpeg|mpga|mp4|opus|pcm|wav|webm|x-m4a)|application\/pdf|text\/(plain|csv|markdown))$/;
const UPLOAD_BASE='https://generativelanguage.googleapis.com/upload/v1beta/files',API_BASE='https://generativelanguage.googleapis.com/v1beta/';
function bad(res,msg,status=400){return json(res,status,{error:msg})}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return json(res,405,{error:'POST required'});
  if(!authorize(req))return bad(res,'Large-file AI upload needs the owner sign-in. Guests can attach small images in chat.',403);
  if(!rateLimit(req))return bad(res,'Too many requests. Try again in a minute.',429);
  const key=process.env.GEMINI_API_KEY;if(!key)return bad(res,'Gemini is not configured. Add a server-side API key.',503);
  const{action}=req.body||{};
  try{
    if(action==='start'){
      const{name,mime,size}=req.body;
      if(typeof name!=='string'||!name||name.length>180)return bad(res,'File name missing.');
      if(!MIMES.test(mime||''))return bad(res,'This file type is not accepted by the free AI storage. Supported: images, video, audio, PDF, text.');
      if(!Number.isFinite(size)||size<1||size>MAX_FILE)return bad(res,'Limit: 400 MB per file for AI upload.');
      const r=await fetch(UPLOAD_BASE+'?key='+key,{method:'POST',headers:{'X-Goog-Upload-Protocol':'resumable','X-Goog-Upload-Command':'start','X-Goog-Upload-Header-Content-Length':String(size),'X-Goog-Upload-Header-Content-Type':mime,'Content-Type':'application/json'},body:JSON.stringify({file:{display_name:name.slice(0,160)}})});
      if(!r.ok)throw Object.assign(Error('Google refused the upload start.'),{status:r.status,detail:await r.text()});
      const uploadUrl=r.headers.get('x-goog-upload-url');if(!uploadUrl)throw Error('Google returned no upload session.');
      return json(res,200,{uploadUrl});
    }
    if(action==='chunk'){
      const{uploadUrl,offset,data,final}=req.body;
      if(typeof uploadUrl!=='string'||!uploadUrl.startsWith('https://generativelanguage.googleapis.com/'))return bad(res,'Upload session invalid. Start again.');
      if(!Number.isInteger(offset)||offset<0)return bad(res,'Upload offset invalid. Start again.');
      if(typeof data!=='string'||!data||data.length>MAX_CHUNK)return bad(res,'Chunk too large or empty.');
      const bytes=Buffer.from(data,'base64');if(!bytes.length)return bad(res,'Chunk could not be decoded.');
      const r=await fetch(uploadUrl,{method:'PUT',headers:{'Content-Length':String(bytes.length),'X-Goog-Upload-Offset':String(offset),'X-Goog-Upload-Command':final?'upload, finalize':'upload'},body:bytes});
      if(!r.ok)throw Object.assign(Error('Google refused an upload chunk.'),{status:r.status,detail:await r.text()});
      if(!final)return json(res,200,{received:offset+bytes.length});
      const done=await r.json(),file=done?.file||{};
      if(!file.name||!file.uri)throw Error('Google finished the upload but returned no file handle.');
      return json(res,200,{file:file.name,uri:file.uri,state:file.state||'PROCESSING',mime:file.mimeType});
    }
    if(action==='status'){
      const{file}=req.body;
      if(typeof file!=='string'||!/^files\/[a-z0-9-]+$/i.test(file))return bad(res,'File handle invalid.');
      const r=await fetch(API_BASE+file+'?key='+key);
      if(!r.ok)throw Object.assign(Error('Google could not report the file state.'),{status:r.status,detail:await r.text()});
      const f=await r.json();
      return json(res,200,{state:f.state||'PROCESSING',uri:f.uri,mime:f.mimeType,error:f.error?.message||null});
    }
    return bad(res,'Unknown upload action.');
  }catch(e){
    console.error('file_upload_failed',e.status||'unknown');
    const quota=e.status===429;
    return bad(res,(quota?'Free AI storage is busy right now. Try again shortly.':(e.detail?'Google error: '+String(e.detail).slice(0,220):e.message)||'Upload failed.'),quota?429:502);
  }
}
