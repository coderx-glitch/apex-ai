// Preserve sign-in and payment recovery records. A clear is local only;
// it never deletes the owner's server-side payment audit records.
export function shouldClearKey(key){return key.startsWith('apex-')&&!['apex-access','apex-entry','apex-buyer-id','apex-payment-requests'].includes(key)}
export async function clearDevice(host=globalThis){
 for(const store of [host.localStorage,host.sessionStorage]){
  for(const key of Object.keys(store))if(shouldClearKey(key))store.removeItem(key);
 }
 if(host.caches){for(const key of await host.caches.keys())await host.caches.delete(key)}
}
