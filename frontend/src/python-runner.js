// Client handle for the Pyodide worker. One engine per page; cancel terminates
// the worker so a stuck or looping script stops immediately.
let worker=null,job=null;
export function pythonEngineStatus(){return worker?'loaded-or-loading':'idle'}
export function runPython(code,{onStatus=()=>{},onStdout=()=>{},onStderr=()=>{}}={}){
  if(typeof code!=='string'||!code.trim())return{promise:Promise.reject(new Error('Nothing to run.')),cancel:()=>{}};
  if(job)job.cancel();
  worker=new Worker('/py-runner.js',{type:'module'});
  const id='run-'+Date.now();
  const promise=new Promise((resolve,reject)=>{
    const w=worker;
    w.onmessage=e=>{const m=e.data||{};
      if(m.type==='status')onStatus(m.text);
      if(m.type==='stdout')onStdout(m.text);
      if(m.type==='stderr')onStderr(m.text);
      if(m.id!==id)return;
      if(m.type==='done'){cleanup();resolve(m.result||'')}
      if(m.type==='error'){cleanup();reject(new Error(m.text||'Python run failed.'))}};
    w.onerror=e=>{cleanup();reject(new Error(e.message||'Python engine failed to start.'))};
    function cleanup(){if(worker===w)worker=null;w.terminate();job=null}
    job={cancel:()=>{const c=cleanup;c();reject(new Error('Stopped. The Python worker was terminated.'))}};
    w.postMessage({id,code});
  });
  return{promise,cancel:()=>job?.cancel()}
}
export function stopPython(){job?.cancel()}
