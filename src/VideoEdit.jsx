import React,{useState,useRef,useEffect}from'react';
import{VIDEO_MAX_BYTES,MAX_CLIPS,VIDEO_FILTERS,parseTimecode,formatSeconds,clampTrim,checkTotal}from'../lib/video-edit.js';
import{recordingType}from'./slideshow.js';
async function readDuration(video){
 if(Number.isFinite(video.duration)&&video.duration>0)return video.duration;
 // MediaRecorder-made WebM (including APEX slideshow exports) has no duration header. Seeking far past the end makes the browser clamp to the real length.
 video.currentTime=1e7;
 await new Promise(res=>{video.onseeked=()=>res();setTimeout(res,5000)});
 return video.duration;
}
function drawFrame(ctx,video,filter,W,H){
 ctx.save();ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 if(filter!=='none')ctx.filter=filter;
 const scale=Math.min(W/video.videoWidth,H/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale;
 ctx.drawImage(video,(W-w)/2,(H-h)/2,w,h);ctx.restore();
}
export default function VideoEdit(){
 const[clips,C]=useState([]),[filter,F]=useState('none'),[busy,B]=useState(false),[progress,PR]=useState(0),[error,E]=useState(''),[output,O]=useState(null),[notice,N]=useState('');
 const canvas=useRef(null),abort=useRef(null),alive=useRef(true),clipsRef=useRef([]);clipsRef.current=clips;
 useEffect(()=>()=>{for(const clip of clipsRef.current)URL.revokeObjectURL(clip.url)},[]);
 useEffect(()=>()=>{if(output?.url)URL.revokeObjectURL(output.url)},[output]);
 const supported=Boolean(recordingType());
 useEffect(()=>()=>{alive.current=false;abort.current?.abort()},[]);
 async function addClip(e){
  const file=e.target.files[0];e.target.value='';E('');N('');O(null);
  if(!file)return;
  if(clips.length>=MAX_CLIPS){E('Join up to '+MAX_CLIPS+' clips in one go. Export this result, then start again to add more.');return}
  if(!/^video\//.test(file.type)){E('Choose a video file your browser can play (WebM, and MP4 on most browsers).');return}
  if(file.size>VIDEO_MAX_BYTES){E('Video file limit: 100 MB per clip. Trim larger files in smaller parts.');return}
  const url=URL.createObjectURL(file);
  try{
   const video=document.createElement('video');video.preload='metadata';video.src=url;
   await new Promise((res,rej)=>{video.onloadedmetadata=res;video.onerror=()=>rej(Error('This video could not be read. The format may be unsupported by this browser.'))});
   const duration=await readDuration(video);
   if(!Number.isFinite(duration)||duration<=0)throw Error('This video length could not be read.');
   if(!alive.current){URL.revokeObjectURL(url);return}
   C(list=>[...list,{id:crypto.randomUUID(),url,name:file.name,duration,width:video.videoWidth,height:video.videoHeight,start:'0',end:formatSeconds(duration)}]);
  }catch(err){URL.revokeObjectURL(url);E(err.message)}
 }
 function setTrim(id,field,value){C(list=>list.map(c=>c.id===id?{...c,[field]:value}:c));O(null)}
 function removeClip(id){C(list=>{const clip=list.find(c=>c.id===id);if(clip)URL.revokeObjectURL(clip.url);return list.filter(c=>c.id!==id)});O(null)}
 async function process(){
  if(!clips.length||busy)return;E('');N('');O(null);PR(0);
  let plan;
  try{plan=clips.map(c=>{const t=clampTrim(parseTimecode(c.start),parseTimecode(c.end),c.duration);return{...c,...t}});checkTotal(plan)}catch(err){E(err.message);return}
  const cv=canvas.current,ctx=cv.getContext('2d');
  if(!ctx){E('Canvas is unavailable in this browser.');return}
  if(filter!=='none'&&!('filter' in ctx)){E('This browser cannot apply canvas filters. Choose "No filter" or try current Chrome or Edge.');return}
  B(true);abort.current=new AbortController();const signal=abort.current.signal;
  let actx=null,audioDest=null,audioNote='',stream=null,recorder=null,stopped;const videos=[];
  const stop=()=>{for(const video of videos){video.pause();video.removeAttribute('src');video.load()}if(recorder&&recorder.state!=='inactive')recorder.stop();stream?.getTracks().forEach(t=>t.stop())};
  signal.addEventListener('abort',stop,{once:true});
  try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){actx=new AC();await actx.resume();audioDest=actx.createMediaStreamDestination()}else audioNote='Audio capture is unavailable in this browser, so the export is silent.'}catch{audioNote='Audio could not be captured in this browser, so the export is silent.'}
  try{
   const first=plan[0];
   const W=Math.max(2,Math.floor(Math.min(1280,first.width)/2)*2),H=Math.max(2,Math.round(W*first.height/first.width/2)*2);
   cv.width=W;cv.height=H;
   const type=recordingType();
   const total=checkTotal(plan);let elapsed=0;
   const chunks=[];
   for(const clip of plan){
    if(signal.aborted)throw Error('Processing stopped.');
    if(recorder?.state==='recording')recorder.pause();
    const video=document.createElement('video');videos.push(video);video.src=clip.url;video.playsInline=true;video.preload='auto';
    await new Promise((res,rej)=>{video.oncanplay=res;video.onerror=()=>rej(Error('Could not load '+clip.name+' for processing.'))});
    if(audioDest){try{actx.createMediaElementSource(video).connect(audioDest)}catch{audioNote='Sound could not be captured for at least one clip. Review the exported audio before using it.'}}
    video.currentTime=clip.start;
    await new Promise(res=>{video.onseeked=res;setTimeout(res,4000)});
    if(signal.aborted)throw Error('Processing stopped.');
    drawFrame(ctx,video,filter,W,H);
    if(!recorder){
   const tracks=[...cv.captureStream(30).getVideoTracks(),...(audioDest?audioDest.stream.getAudioTracks():[])];
   stream=new MediaStream(tracks);
   recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:4000000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   stopped=new Promise((res,rej)=>{recorder.onstop=res;recorder.onerror=()=>rej(Error('Browser video recording failed. No file was created.'))});
    }
    if(recorder.state==='inactive')recorder.start(250);else recorder.resume();
    await video.play();
    await new Promise((resolve,reject)=>{
     const tick=()=>{
      if(signal.aborted){video.pause();reject(Error('Processing stopped.'));return}
      drawFrame(ctx,video,filter,W,H);
      const kept=Math.min(video.currentTime,clip.end)-clip.start;
      PR(Math.round((elapsed+Math.max(0,kept))/total*100));
      if(video.currentTime>=clip.end-0.02||video.ended){video.pause();resolve();return}
      requestAnimationFrame(tick);
     };
     requestAnimationFrame(tick);
    });
    elapsed+=clip.end-clip.start;
   }
   recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
   const blob=new Blob(chunks,{type:recorder.mimeType});
   if(!blob.size)throw Error('Browser returned an empty recording.');
   if(!alive.current)return;
   O({url:URL.createObjectURL(blob),size:blob.size,ext:recorder.mimeType.startsWith('video/mp4')?'mp4':'webm',seconds:total});
   N('Finished in real time. '+(audioNote||'Original sound is kept.'));
  }catch(err){if(alive.current)E(err.message||'Processing failed.')}finally{signal.removeEventListener('abort',stop);stop();if(actx)try{await actx.close()}catch{};if(alive.current)B(false)}
 }
 return <section className="settings-card video-edit"><div className="video-heading"><h3>Cut & join video</h3><span className="permission green">Browser only · no upload</span></div>
 <p>Trim one clip or join two clips end to end, with an optional visual filter. Runs fully on this device: no upload, no AI, no quota. Export re-encodes in real time - a 1-minute result takes about 1 minute while this tab stays visible. Keep up to 120 seconds per clip and 4 minutes total. Output is {supported?'a WebM/MP4 file this browser can encode':'not available - this browser cannot record video'}.</p>
 {!supported&&<p role="alert">This browser cannot export canvas video. Try current Chrome or Edge on desktop.</p>}
 <fieldset disabled={busy}>
  <div className="video-actions"><label className="subtle">Add video clip<input aria-label="Add video clip" type="file" accept="video/*" onChange={addClip}/></label>
  <label>Visual filter<select aria-label="Visual filter" value={filter} onChange={e=>{F(e.target.value);O(null)}}>{VIDEO_FILTERS.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label></div>
  {clips.map((c,i)=><div className="video-slide" key={c.id}>
   <video src={c.url} controls muted playsInline style={{width:180,maxWidth:'100%'}}/>
   <div><strong>Clip {i+1}: {c.name}</strong><p>{formatSeconds(c.duration)} · {c.width}×{c.height}</p>
   <label>Keep from<input aria-label={'Clip '+(i+1)+' start'} value={c.start} onChange={e=>setTrim(c.id,'start',e.target.value)} placeholder="0 or 0:00"/></label>
   <label>Keep until<input aria-label={'Clip '+(i+1)+' end'} value={c.end} onChange={e=>setTrim(c.id,'end',e.target.value)} placeholder={formatSeconds(c.duration)}/></label>
   <div className="video-actions"><button aria-label={'Remove clip '+(i+1)} onClick={()=>removeClip(c.id)}>Remove</button></div></div>
  </div>)}
  {clips.length>0&&<button className="primary" disabled={busy} onClick={process}>{busy?'Processing locally… '+progress+'%':clips.length===2?'Join and export clips':'Trim and export clip'}</button>}
  {busy&&<p role="status">Processing in real time: {progress}%. Keep this tab visible.</p>}
 </fieldset>
 {busy&&<button className="subtle" onClick={()=>abort.current?.abort()}>Cancel video export</button>}
 <canvas ref={canvas} hidden/>
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {output&&<figure className="image-tool-output"><video src={output.url} controls playsInline style={{maxWidth:'100%'}}/><figcaption>{formatSeconds(output.seconds)} · {output.ext.toUpperCase()} · {(output.size/1048576).toFixed(2)} MB</figcaption><a className="subtle" href={output.url} download={'apex-edit.'+output.ext}>Download edited video</a><p>Preview and download are the same encoded file. Held only in this page session; save it before leaving Media.</p></figure>}
 </section>;
}
