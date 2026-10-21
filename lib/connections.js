// Device-local connector store. Tokens stay in this browser's local storage and
// are only ever sent to the provider they came from (Google, GitHub, Notion).
const keyOf=s=>s+'-connections';
export const SERVICES=[
{id:'google-calendar',name:'Google Calendar',group:'google',about:'See upcoming events and add new ones from APEX.'},
{id:'gmail',name:'Gmail',group:'google',about:'Latest inbox subjects and senders. Read only, nothing is sent.'},
{id:'github',name:'GitHub',group:'github',about:'Your repositories and recent pushes.'},
{id:'notion',name:'Notion',group:'notion',about:'Search the pages you shared with the integration.'}];
export function readConnections(storageKey){try{const d=JSON.parse(localStorage.getItem(keyOf(storageKey)));return d&&typeof d==='object'&&!Array.isArray(d)?d:{}}catch{return{}}}
export function connectionState(storageKey,id){const d=readConnections(storageKey)[id];return d&&typeof d.token==='string'&&d.token?{connected:true,...d}:{connected:false}}
export function saveConnection(storageKey,id,patch){const d=readConnections(storageKey);d[id]={...(d[id]&&typeof d[id]==='object'?d[id]:{}),...patch,updatedAt:Date.now()};try{localStorage.setItem(keyOf(storageKey),JSON.stringify(d))}catch{}return d[id]}
export function dropConnection(storageKey,id){const d=readConnections(storageKey);delete d[id];try{localStorage.setItem(keyOf(storageKey),JSON.stringify(d))}catch{}}
export function dropGroup(storageKey,group){const d=readConnections(storageKey);let touched=false;for(const id of Object.keys(d)){const g=id==='google-token'?'google':(SERVICES.find(s=>s.id===id)||{}).group;if(g===group){delete d[id];touched=true}}if(touched)try{localStorage.setItem(keyOf(storageKey),JSON.stringify(d))}catch{}}
export function googleClientId(){return(typeof import.meta!=='undefined'&&import.meta.env&&import.meta.env.VITE_GOOGLE_CLIENT_ID)||''}
export function githubClientId(){return(typeof import.meta!=='undefined'&&import.meta.env&&import.meta.env.VITE_GITHUB_CLIENT_ID)||''}
export function serviceSetup(id){const s=SERVICES.find(x=>x.id===id);if(!s)return{ready:false,reason:'Unknown connector.'};if(s.group==='google')return googleClientId()?{ready:true}:{ready:false,reason:'Google app registration is pending. Connect will work once it is added.'};if(s.group==='github')return githubClientId()?{ready:true}:{ready:false,reason:'GitHub OAuth app registration is pending. Connect will work once it is added.'};return{ready:true}}
