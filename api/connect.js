import{json,authorize}from'../lib/security.js';import{PLAN_PRICES,TOKEN_PACKS,createPaymentRequest,paymentStatus,claimGrant,listPendingPayments,decidePayment}from'../lib/payments.js';import{rateLimit}from'../lib/limits.js';import{parseProviders}from'../lib/plugins.js';
const NOTION='https://api.notion.com/v1';
async function githubExchange(req,res){const id=process.env.GITHUB_CLIENT_ID,secret=process.env.GITHUB_CLIENT_SECRET;if(!id||!secret)return json(res,503,{error:'GitHub connection is not configured on this deployment yet.'});const body=req.body||{};const code=body.code,redirectUri=body.redirectUri;if(typeof code!=='string'||code.length<10||code.length>200)return json(res,400,{error:'Invalid GitHub sign-in code.'});if(typeof redirectUri!=='string'||!redirectUri.startsWith('https://'))return json(res,400,{error:'Invalid redirect address.'});try{const r=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({client_id:id,client_secret:secret,code,redirect_uri:redirectUri})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.access_token)return json(res,502,{error:'GitHub did not accept the sign-in code. Try connecting again.'});return json(res,200,{token:d.access_token,scope:d.scope||''})}catch(e){return json(res,502,{error:'Could not reach GitHub. Check the network and try again.'})}}
async function notionCall(token,path,body){const r=await fetch(NOTION+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Notion-Version':'2022-06-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(r.status===401){const e=new Error('Notion rejected that token. Check it and paste again.');e.status=401;throw e}if(!r.ok){const e=new Error('Notion request failed ('+r.status+').');e.status=502;throw e}return r.json()}
async function notionRoute(req,res){const body=req.body||{};const token=body.token;if(typeof token!=='string'||!/^(ntn_|secret_)[A-Za-z0-9]{20,}$/.test(token))return json(res,400,{error:'Paste the Notion integration token. It starts with ntn_ or secret_.'});const action=body.action||'verify';try{if(action==='verify'){const d=await notionCall(token,'/users/me');return json(res,200,{workspace:(d.bot&&d.bot.owner&&d.bot.owner.workspace_name)||d.name||'Notion'})}if(action==='search'){const query=typeof body.query==='string'?body.query.slice(0,200):'';const d=await notionCall(token,'/search',{query,page_size:5});const pages=(d.results||[]).map(p=>{const props=p.properties||{};const t=props.title||props.Name||props.Title;const text=t&&Array.isArray(t.title)?t.title.map(x=>x.plain_text||'').join(''):'';return{title:text||'(untitled page)',url:p.url||''}});return json(res,200,{pages})}return json(res,400,{error:'Unknown Notion action.'})}catch(e){return json(res,e.status||502,{error:e.message})}}
async function pluginsRoute(req,res){
 const body=req.body||{};const kind=body.kind,q=typeof body.q==='string'?body.q.trim().slice(0,120):'';
 const fetchJson=async(url,opts)=>{const r=await fetch(url,{...opts,signal:AbortSignal.timeout(12000)});const d=await r.json().catch(()=>null);if(!r.ok||!d)throw Object.assign(new Error('The free service did not answer ('+r.status+'). Try again shortly.'),{status:502});return d};
 try{
 if(kind==='news'){
  const key=process.env.GNEWS_API_KEY;if(!key)return json(res,503,{error:'News is not set up yet. The owner adds one free GNews key on the server and it starts working - no change needed on your side.'});
  const path=q?'search?q='+encodeURIComponent(q)+'&lang=en&max=10':'top-headlines?lang=en&country=in&max=10';
  return json(res,200,await fetchJson('https://gnews.io/api/v4/'+path+'&apikey='+key));
 }
 if(kind==='movies'){
  const key=process.env.TMDB_API_KEY;if(!key)return json(res,503,{error:'Movies & TV is not set up yet. The owner adds one free TMDB key on the server and it starts working.'});
  if(q.length<2)return json(res,400,{error:'Type a movie or show name first.'});
  const bearer=key.startsWith('eyJ');const auth=bearer?{headers:{Authorization:'Bearer '+key}}:undefined;const d=await fetchJson('https://api.themoviedb.org/3/search/multi?query='+encodeURIComponent(q)+'&include_adult=false&language=en-US&page=1'+(bearer?'':'&api_key='+key),auth);
  const top=(d.results||[]).filter(r=>r.media_type==='movie'||r.media_type==='tv').slice(0,3);
  const providers={};
  await Promise.all(top.map(async r=>{try{const p=await fetchJson('https://api.themoviedb.org/3/'+r.media_type+'/'+r.id+'/watch/providers'+(bearer?'':'?api_key='+key),auth);const parsed=parseProviders(p,'IN');if(parsed)providers[r.media_type+'-'+r.id]=parsed}catch{}}));
  return json(res,200,{results:d.results||[],providers});
 }
 if(kind==='music'){
  if(q.length<2)return json(res,400,{error:'Type a song, artist or album first.'});
  const id=process.env.SPOTIFY_CLIENT_ID,secret=process.env.SPOTIFY_CLIENT_SECRET;
  if(id&&secret){
   try{
    const tokenRes=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64')},body:'grant_type=client_credentials',signal:AbortSignal.timeout(12000)});
    const token=await tokenRes.json().catch(()=>({}));
    if(tokenRes.ok&&token.access_token){
     const d=await fetchJson('https://api.spotify.com/v1/search?type=track&limit=10&q='+encodeURIComponent(q),{headers:{Authorization:'Bearer '+token.access_token}});
     return json(res,200,{source:'spotify',tracks:((d.tracks&&d.tracks.items)||[]).slice(0,10).map(t=>({name:t.name||'',artists:(t.artists||[]).map(a=>a.name).join(', '),album:(t.album&&t.album.name)||'',url:(t.external_urls&&t.external_urls.spotify)||'',image:((t.album&&t.album.images)||[])[1]?.url||((t.album&&t.album.images)||[])[0]?.url||'',preview:t.preview_url||''})).filter(t=>t.name&&t.url)});
    }
   }catch{}
  }
  try{
   const dz=await fetchJson('https://api.deezer.com/search?limit=12&q='+encodeURIComponent(q));
   const tracks=((dz&&!dz.error&&dz.data)||[]).slice(0,12).map(r=>({name:r.title||'',artists:(r.artist&&r.artist.name)||'',album:(r.album&&r.album.title)||'',url:r.link||'',image:(r.album&&r.album.cover_medium)||'',preview:r.preview||''})).filter(t=>t.name&&t.url);
   if(tracks.length)return json(res,200,{source:'deezer',tracks});
  }catch{}
  const d=await fetchJson('https://itunes.apple.com/search?media=music&limit=12&term='+encodeURIComponent(q));
  return json(res,200,{source:'itunes',tracks:(d.results||[]).slice(0,12).map(r=>({name:r.trackName||'',artists:r.artistName||'',album:r.collectionName||'',url:r.trackViewUrl||'',image:r.artworkUrl100||'',preview:r.previewUrl||''})).filter(t=>t.name&&t.url)});
 }
 if(kind==='stt'){
  const key=process.env.GROQ_API_KEY;if(!key)return json(res,503,{error:'Voice notes are not set up yet. The owner adds a free Groq key on the server and they start working.'});
  const audio=typeof body.audio==='string'?body.audio:'';
  if(audio.length<100)return json(res,400,{error:'The recording was empty. Try again and speak a little longer.'});
  if(audio.length>9000000)return json(res,400,{error:'That voice note is too long. Keep it under about two minutes.'});
  let bytes;try{bytes=Buffer.from(audio,'base64')}catch{return json(res,400,{error:'The recording could not be read. Try again.'})}
  const mime=typeof body.mime==='string'&&/^[a-z0-9\/;+.-]+$/i.test(body.mime)?body.mime.slice(0,60):'audio/webm';
  const ext=mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':mime.includes('wav')?'wav':'webm';
  const form=new FormData();form.append('file',new Blob([bytes],{type:mime}),'note.'+ext);form.append('model','whisper-large-v3-turbo');form.append('response_format','json');
  const r=await fetch('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:AbortSignal.timeout(45000)});
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d||typeof d.text!=='string')return json(res,502,{error:'Transcription failed ('+r.status+'). Try again shortly.'});
  return json(res,200,{text:d.text.trim()});
 }
 if(kind==='tts'){
  const key=process.env.ELEVENLABS_API_KEY;if(!key)return json(res,503,{error:'Spoken replies are not set up yet. The owner adds a free ElevenLabs key on the server.'});
  const text=(typeof body.text==='string'?body.text:'').trim().slice(0,800);
  if(!text)return json(res,400,{error:'Nothing to speak.'});
  const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL',{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json',Accept:'audio/mpeg'},body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.5,similarity_boost:0.7}}),signal:AbortSignal.timeout(45000)});
  if(!r.ok)return json(res,502,{error:'Spoken reply failed ('+r.status+'). The free monthly voice quota may be over.'});
  const buf=Buffer.from(await r.arrayBuffer());
  return json(res,200,{audio:buf.toString('base64'),mime:'audio/mpeg'});
 }
 if(kind==='youtube'){
  const key=process.env.YOUTUBE_API_KEY;if(!key)return json(res,503,{error:'YouTube search is not set up yet. The owner adds a free YouTube Data key on the server.'});
  if(q.length<2)return json(res,400,{error:'Type something to search first.'});
  return json(res,200,await fetchJson('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&safeSearch=strict&q='+encodeURIComponent(q)+'&key='+key));
 }
 if(kind==='nasa'){
  const key=process.env.NASA_API_KEY;if(!key)return json(res,503,{error:'The space tab is not set up yet. The owner adds a free NASA key on the server.'});
  const which=body.which==='neows'?'neows':'apod';
  try{if(which==='apod'){const ok=d=>d&&d.date&&d.explanation&&d.url&&!/nasa-logo|\/themes\//i.test(d.url);let d=null;for(let i=0;i<3&&!ok(d);i++){try{if(i)await new Promise(r=>setTimeout(r,400));const r=await fetch('https://api.nasa.gov/planetary/apod?api_key='+key,{signal:AbortSignal.timeout(2500)});d=r.ok?await r.json().catch(()=>null):null}catch{d=null}}const pick=x=>({title:x.title,date:x.date,explanation:x.explanation,url:x.url,media_type:x.media_type,copyright:x.copyright});if(ok(d)){globalThis.__apodLast=pick(d);return json(res,200,globalThis.__apodLast)}const last=globalThis.__apodLast;if(last)return json(res,200,{...last,saved:true});return json(res,503,{error:'The daily space photo is unavailable from NASA right now. No substitute image is shown. Try Asteroids today instead.'})}const d=await fetchJson('https://api.nasa.gov/neo/rest/v1/feed/today?api_key='+key);return json(res,200,{element_count:d.element_count,near_earth_objects:Object.fromEntries(Object.entries(d.near_earth_objects||{}).map(([day,list])=>[day,list.map(n=>({name:n.name,estimated_diameter:n.estimated_diameter,close_approach_data:n.close_approach_data,is_potentially_hazardous_asteroid:n.is_potentially_hazardous_asteroid}))]))})}catch{return json(res,503,{error:'NASA is not responding right now. Nothing has been loaded. Try again later.'})}
 }
 if(kind==='pixabay'){
  const key=process.env.PIXABAY_API_KEY;if(!key)return json(res,503,{error:'Stock search is not set up yet. The owner adds a free Pixabay key on the server.'});
  if(q.length<2)return json(res,400,{error:'Type something to search first.'});
  const video=body.video===true;
  const url=video?'https://pixabay.com/api/videos/?key='+key+'&per_page=12&safesearch=true&q='+encodeURIComponent(q):'https://pixabay.com/api/?key='+key+'&per_page=12&image_type=photo&safesearch=true&q='+encodeURIComponent(q);
  return json(res,200,await fetchJson(url));
 }
 if(kind==='pixabay-image'){
  const key=process.env.PIXABAY_API_KEY;if(!key)return json(res,503,{error:'Stock search is not set up yet.'});
  const target=typeof body.url==='string'?body.url:'';
  if(!/^https:\/\/(cdn\.)?pixabay\.com\//.test(target))return json(res,400,{error:'Only Pixabay image addresses are fetched.'});
  const r=await fetch(target,{headers:{Referer:'https://pixabay.com/','User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'},signal:AbortSignal.timeout(15000)});
  if(!r.ok)return json(res,502,{error:'The image could not be fetched ('+r.status+').'});
  const buf=Buffer.from(await r.arrayBuffer());
  if(buf.length>3000000)return json(res,400,{error:'That image is too large to mirror.'});
  return json(res,200,{data:buf.toString('base64'),mime:r.headers.get('content-type')||'image/jpeg'});
 }
 if(kind==='wikipedia'){
  const ua={'User-Agent':'APEX-AI-Student-Project/1.0 (https://apex-ai-three-sigma.vercel.app; learning project, low volume)','Api-User-Agent':'APEX-AI-Student-Project/1.0'};
  if(body.which==='summary'){const title=typeof body.title==='string'?body.title.trim().slice(0,200):'';if(!title)return json(res,400,{error:'Pick an article first.'});
   return json(res,200,await fetchJson('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(title),{headers:ua}))}
  if(q.length<2)return json(res,400,{error:'Type a topic first, 2+ letters.'});
  return json(res,200,await fetchJson('https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=8&srsearch='+encodeURIComponent(q),{headers:ua}))}
 return json(res,400,{error:'Unknown plugin kind.'});
 }catch(e){return json(res,e.status||502,{error:e.message||'Plugin request failed.'})}
}

const UPI_ID=process.env.APEX_UPI_ID||'9289199355@fam',UPI_NAME=process.env.APEX_UPI_NAME||'Aabhas Gupta';
async function paymentRoute(req,res){const body=req.body||{},action=body.action||'';
 if(action==='config')return json(res,200,{upiId:UPI_ID,upiName:UPI_NAME,plans:PLAN_PRICES,packs:TOKEN_PACKS,mode:'manual'});
 if(action==='create'){try{const {kind,id,upiRef,buyer}=body;const store=await listPendingPayments().catch(()=>[]);const mine=store.filter(r=>r.buyer===String(buyer||''));if(mine.length>=3)return json(res,429,{error:'You already have 3 payment requests waiting. Wait for a decision before submitting more.'});const out=await createPaymentRequest({kind,id,upiRef,buyer});return json(res,200,out)}catch(e){return json(res,400,{error:e.message})}}
 if(action==='status'){try{return json(res,200,await paymentStatus(body.requestId,body.buyer))}catch(e){return json(res,404,{error:e.message})}}
 if(action==='claim'){try{return json(res,200,await claimGrant(body.requestId,body.buyer))}catch(e){return json(res,404,{error:e.message})}}
 if(action==='list'){if(!authorize(req))return json(res,401,{error:'Owner code required.'});try{return json(res,200,{pending:await listPendingPayments()})}catch{return json(res,503,{error:'Could not load the payment list. No approvals changed. Refresh the list to retry.'})}}
 if(action==='decide'){if(!authorize(req))return json(res,401,{error:'Owner code required.'});if(typeof body.approve!=='boolean')return json(res,400,{error:'approve must be true or false.'});try{return json(res,200,await decidePayment(body.requestId,body.approve))}catch(e){return json(res,404,{error:e.message})}}
 return json(res,400,{error:'Unknown payment action.'})}

export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return json(res,405,{error:'POST required'});if(!rateLimit(req))return json(res,429,{error:'Too many requests. Try again in a minute.'});const provider=(req.body&&req.body.provider)||'';if(provider==='github')return githubExchange(req,res);if(provider==='notion')return notionRoute(req,res);if(provider==='plugins')return pluginsRoute(req,res);if(provider==='payment')return paymentRoute(req,res);return json(res,400,{error:'Unknown connector. Use provider github or notion.'})}
