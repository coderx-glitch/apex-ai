export function providerError(error,provider='gemini'){const s=Number(error.status||error.code),raw=String(error.message||'');let detail;try{detail=JSON.parse(raw)}catch{}const entries=detail?.error?.details||error.details||[];const retry=entries.find?.(e=>String(e['@type']||'').endsWith('RetryInfo'))?.retryDelay;const seconds=typeof retry==='string'?Math.ceil(parseFloat(retry)):null;
const label='APEX AI service';
if(s===401)return{kind:'key',message:label+' API key rejected. Check the server-side connection. No action was completed.'};
if(s===429||raw.includes('RESOURCE_EXHAUSTED'))return{kind:'quota',retryAfter:seconds&&seconds<=86400?seconds:null,message:label+' is busy right now because the free shared allowance is used up for the moment'+(seconds&&seconds<=86400?'. Please try again in about '+(seconds<60?seconds+' seconds':Math.ceil(seconds/60)+' minutes'):'. Please try again in a minute')+'. Your notes, tasks and memory still work. Nothing was lost.'};
if(s===404)return{kind:'model',message:'Selected model unavailable. No action was completed.'};
if(s===403)return{kind:'access',message:'Provider access denied. Check project permissions and billing. No action was completed.'};
if(raw.includes('API_KEY_INVALID')||raw.includes('API key not valid'))return{kind:'key',message:'API key rejected. No action was completed.'};
return{kind:'connection',message:'Provider connection failed. No action was completed.'}}

// Browser fetch failures surface as raw TypeErrors; give a calm honest message.
export function friendlyRequestError(error){const msg=String(error?.message||error||'');if(/failed to fetch|networkerror|load failed|network request failed/i.test(msg))return'No connection to the APEX service. Check your internet connection and try again. Nothing was sent.';return msg||'Something went wrong. Nothing was sent.'}
