export function isChunkFailure(error){return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (?:CSS )?chunk|Unable to preload CSS|Expected a (?:JavaScript-or-Wasm )?module script|module script.*MIME|strict MIME type/i.test(String(error?.message||error));}
export async function retryToolImport(importer,{attempts=3,delay=ms=>new Promise(r=>setTimeout(r,ms))}={}){for(let n=0;n<attempts;n++){try{return await importer()}catch(error){if(!isChunkFailure(error)||n===attempts-1)throw error;await delay(500*(n+1))}}}

// Vite can wrap a shared chunk's component in a namespace export. A retry
// imports the raw chunk rather than Vite's normal namespace projection.
export function normalizeToolModule(module){
  if(module&&typeof module==='object'&&'default'in module)return module;
  const candidate=module?.C??Object.values(module||{})[0];
  if(candidate&&typeof candidate==='object'&&'default'in candidate)return candidate;
  if(typeof candidate==='function')return{default:candidate};
  throw Error('This tool module did not export a usable component. Try loading the latest version.');
}
