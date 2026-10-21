// Resolve the browser getter inside each operation, so a denied getter follows
// the same protective recovery path as a denied read/write. Never fake a save.
export function browserStorage(kind,host=globalThis){return{getItem:key=>host[kind].getItem(key),setItem:(key,value)=>host[kind].setItem(key,value),removeItem:key=>host[kind].removeItem(key)}}
export const localStore=browserStorage('localStorage');
export function sessionAccess(host=globalThis){const fallback=new Map();let failed=false;return{get unavailable(){return failed},get(key){if(fallback.has(key))return fallback.get(key);try{return host.sessionStorage.getItem(key)}catch{failed=true;return null}},set(key,value){fallback.set(key,value);try{host.sessionStorage.setItem(key,value);return true}catch{failed=true;return false}},remove(key){fallback.set(key,null);try{host.sessionStorage.removeItem(key);return true}catch{failed=true;return false}}}}
