import{useEffect,useState}from'react';
import{Globe,RefreshCw,Unlink,Plus}from'lucide-react';
import{SERVICES,connectionState,saveConnection,dropConnection,dropGroup,serviceSetup,googleClientId,githubClientId}from'../lib/connections.js';
import{connectGoogle,revokeGoogle,calendarUpcoming,calendarAdd,gmailLatest}from'../lib/google-connect.js';

const GITHUB_CALLBACK=()=>location.origin+'/github-callback.html';

async function githubPreview(token){const u=await(await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'}})).json();if(!u||!u.login)throw new Error('GitHub session expired. Connect again.');const r=await(await fetch('https://api.github.com/user/repos?per_page=3&sort=updated&affiliation=owner',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'}})).json();return{title:'@'+u.login,items:(Array.isArray(r)?r:[]).map(x=>({head:x.full_name,sub:x.description||(x.private?'Private repository':'Public repository')}))}}

function Card({storageKey,service,onChange}){
 const[state,setState]=useState(()=>connectionState(storageKey,service.id));
 const[busy,setBusy]=useState(false),[err,setErr]=useState(''),[preview,setPreview]=useState(null);
 const[notionToken,setNotionToken]=useState('');
 const[event,setEvent]=useState({summary:'',date:'',start:'',end:''});
 const setup=serviceSetup(service.id);
 const google=service.group==='google'?connectionState(storageKey,'google-token'):null;
 const token=service.group==='google'?(google&&google.token):state.token;
 const connected=!!token;
 useEffect(()=>{setState(connectionState(storageKey,service.id))},[storageKey,service.id,connected]);
 async function load(){if(!token)return;setBusy(true);setErr('');try{if(service.id==='google-calendar'){const items=await calendarUpcoming(token,3);setPreview({title:'Next events',items:items.map(e=>({head:e.summary,sub:e.start}))})}else if(service.id==='gmail'){const items=await gmailLatest(token,3);setPreview({title:'Latest inbox',items:items.map(m=>({head:m.subject,sub:m.from}))})}else if(service.id==='github'){setPreview(await githubPreview(token))}else if(service.id==='notion'){const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'notion',action:'search',token})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Notion search failed.');setPreview({title:'Shared pages',items:(d.pages||[]).map(p=>({head:p.title,sub:p.url?'Shared with integration':''}))})}}catch(e){setErr(e.message||'Could not load.');if(e.code==='expired')disconnect()}finally{setBusy(false)}}
 useEffect(()=>{if(connected)load()},[connected,storageKey,service.id]);
 function disconnect(){if(service.group==='google'){revokeGoogle(token);dropConnection(storageKey,'google-token')}else dropConnection(storageKey,service.id);setPreview(null);setState(connectionState(storageKey,service.id));onChange()}
 async function connect(){setErr('');setBusy(true);try{if(service.group==='google'){const r=await connectGoogle(googleClientId());saveConnection(storageKey,'google-token',{token:r.token,scope:r.scope,account:'Google account'});setState(connectionState(storageKey,service.id));onChange()}else if(service.id==='github'){const w=window.open('https://github.com/login/oauth/authorize?client_id='+encodeURIComponent(githubClientId())+'&redirect_uri='+encodeURIComponent(GITHUB_CALLBACK())+'&scope='+encodeURIComponent('read:user repo'),'apex-github','width=640,height=720');if(!w)throw new Error('Popup blocked. Allow popups for this site and try again.');const code=await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('GitHub sign-in window closed before finishing. Nothing was connected.')),180000);function onMsg(e){if(e.origin!==location.origin||!e.data||e.data.type!=='apex-github-callback')return;clearTimeout(t);window.removeEventListener('message',onMsg);if(e.data.error)rej(new Error('GitHub sign-in was not completed. Nothing was connected.'));else res(e.data.code)}window.addEventListener('message',onMsg)});const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'github',code,redirectUri:GITHUB_CALLBACK()})});const d=await r.json();if(!r.ok)throw new Error(d.error||'GitHub connect failed.');saveConnection(storageKey,'github',{token:d.token,scope:d.scope||''});setState(connectionState(storageKey,'github'));onChange()}else if(service.id==='notion'){const t=notionToken.trim();if(!t){setErr('Paste the integration token first.');setBusy(false);return}const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'notion',action:'verify',token:t})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Notion connect failed.');saveConnection(storageKey,'notion',{token:t,workspace:d.workspace});setNotionToken('');setState(connectionState(storageKey,'notion'));onChange()}}catch(e){setErr(e.message||'Connect failed.')}finally{setBusy(false)}}
 async function addEvent(){setErr('');if(!event.summary||!event.date||!event.start||!event.end){setErr('Event needs a title, date, start and end time.');return}setBusy(true);try{await calendarAdd(token,{summary:event.summary,description:'Added from APEX',start:event.date+'T'+event.start+':00',end:event.date+'T'+event.end+':00'});setEvent({summary:'',date:'',start:'',end:''});load()}catch(e){setErr(e.message||'Could not add the event.')}finally{setBusy(false)}}
 return<div className="connection-card">
  <Globe size={23}/><strong>{service.name}</strong>
  <small>{service.about}</small>
  {!setup.ready&&<span className="badge">{setup.reason}</span>}
  {setup.ready&&!connected&&service.id==='notion'&&<>
   <input type="password" placeholder="Paste Notion integration token" value={notionToken} onChange={e=>setNotionToken(e.target.value)} aria-label="Notion integration token"/>
   <button disabled={busy} onClick={connect}>{busy?'Checking...':'Connect'}</button>
   <small>Create an integration at notion.so/my-integrations and share pages with it.</small>
  </>}
  {setup.ready&&!connected&&service.id!=='notion'&&<button disabled={busy} onClick={connect}>{busy?'Opening...':'Connect '+service.name}</button>}
  {connected&&<>
   <span className="badge">Connected{service.id==='notion'&&state.workspace?' - '+state.workspace:''}</span>
   <div className="connection-actions"><button disabled={busy} onClick={load} aria-label="Refresh"><RefreshCw size={14}/> Refresh</button><button disabled={busy} onClick={disconnect} aria-label="Disconnect"><Unlink size={14}/> Disconnect</button></div>
   {preview&&<div className="connection-preview"><strong>{preview.title}</strong>{preview.items.length===0&&<small>Nothing to show yet.</small>}{preview.items.map((it,i)=><div key={i} className="connection-item"><span>{it.head}</span><small>{it.sub}</small></div>)}</div>}
   {service.id==='google-calendar'&&<div className="connection-add"><input placeholder="Event title" value={event.summary} onChange={e=>setEvent({...event,summary:e.target.value})} aria-label="Event title"/><input type="date" value={event.date} onChange={e=>setEvent({...event,date:e.target.value})} aria-label="Event date"/><input type="time" value={event.start} onChange={e=>setEvent({...event,start:e.target.value})} aria-label="Start time"/><input type="time" value={event.end} onChange={e=>setEvent({...event,end:e.target.value})} aria-label="End time"/><button disabled={busy} onClick={addEvent}><Plus size={14}/> Add to calendar</button></div>}
  </>}
  {err&&<p className="error-text" role="alert">{err}</p>}
 </div>
}

export default function Connections({storageKey}){
 const[,setStamp]=useState(0);
 const bump=()=>setStamp(x=>x+1);
 return<><p className="page-description">Optional connectors. Tokens stay on this device and are only sent to the service they came from. Disconnect removes them from this browser.</p>
 <div className="connection-grid">{SERVICES.map(s=><Card key={s.id} storageKey={storageKey} service={s} onChange={bump}/>)}</div>
 <div className="info-row" style={{marginTop:16}}>Media is available separately: free image generation, experimental free APEX AI motion and local slideshow videos. Paid video remains locked.</div></>
}
