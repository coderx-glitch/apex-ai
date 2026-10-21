// Keeps a long-open tab working across new releases. Old tabs point at old hashed files that no longer exist.
// 1) We notice a new release (poll + on focus) and reload silently while the tab is hidden.
// 2) If a tool still fails to load, we reload once into the latest release (draft is kept in sessionStorage).
const KEY='apex-auto-reload-at',DRAFT='apex-chat-draft';
const entry=html=>{const m=String(html).match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);return m?m[0]:null};
const mine=()=>{const s=[...document.scripts].map(x=>x.getAttribute('src')||'').find(x=>/\/assets\/index-[A-Za-z0-9_-]+\.js/.test(x));return s?s.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)[0]:null};
export async function latestEntry(){try{const r=await fetch('/index.html?v='+Date.now(),{cache:'no-store'});if(!r.ok)return null;return entry(await r.text())}catch{return null}}
function recentlyReloaded(){try{return Date.now()-Number(sessionStorage.getItem(KEY)||0)<45000}catch{return false}}
export function reloadLatest(){try{sessionStorage.setItem(KEY,String(Date.now()))}catch{}location.reload()}
export async function isStale(){const a=mine(),b=await latestEntry();return !!(a&&b&&a!==b)}
// Returns true when a reload was started.
export async function recoverFromStale(){if(recentlyReloaded())return false;if(await isStale()){reloadLatest();return true}return false}
export function loadDraft(){try{return sessionStorage.getItem(DRAFT)||''}catch{return ''}}
export function saveDraft(t){try{t?sessionStorage.setItem(DRAFT,t):sessionStorage.removeItem(DRAFT)}catch{}}
let started=false;
export function startVersionWatch(){if(started||typeof document==='undefined')return;started=true;
 const check=async()=>{if(recentlyReloaded())return;if(await isStale()){if(document.hidden)reloadLatest();else window.__apexStale=true}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&window.__apexStale&&!recentlyReloaded())reloadLatest();else if(!document.hidden)check()});
 setInterval(check,5*60*1000);setTimeout(check,30000)}
