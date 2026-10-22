// Starts the main engine now and the backup engine after ms if no text has arrived yet.
// The first one to produce text wins; the other is cancelled. Nothing is shown before then.
export async function* hedge(makeMain,makeBackup,ms,onCancel){
  const runs=[makeMain,makeBackup].map(make=>({make,it:null,pending:null,buf:[],dead:false,err:null}));
  const start=r=>{if(r.it)return;r.it=r.make()[Symbol.asyncIterator]();r.pending=r.it.next().then(v=>({r,v}),e=>({r,e}))};
  start(runs[0]);
  let timer=null,timerFired=false;const tp=new Promise(res=>{timer=setTimeout(()=>{timerFired=true;res({timer:true})},ms)});
  let winner=null,lastErr=null;
  try{
    while(!winner){
      const live=runs.filter(r=>r.pending&&!r.dead);
      if(!live.length){if(!runs[1].it){start(runs[1]);continue}break}
      const got=await Promise.race([...live.map(r=>r.pending),...(timerFired?[]:[tp])]);
      if(got.timer){start(runs[1]);continue}
      const{r}=got;
      if(got.e){r.dead=true;r.pending=null;lastErr=got.e;if(!runs[1].it)start(runs[1]);continue}
      if(got.v.done){r.dead=true;r.pending=null;if(!runs[1].it)start(runs[1]);continue}
      r.buf.push(got.v.value);
      if(got.v.value?.type==='delta'){winner=r;break}
      r.pending=r.it.next().then(v=>({r,v}),e=>({r,e}));
    }
    clearTimeout(timer);
    if(!winner)throw lastErr||Object.assign(new Error('No engine answered'),{status:502});
    for(const o of runs)if(o!==winner&&o.it){try{onCancel?.(o===runs[0]?'main':'backup')}catch{}o.pending?.catch?.(()=>{});o.it.return?.().catch?.(()=>{})}
    for(const ev of winner.buf)yield ev;
    for(;;){const v=await winner.it.next();if(v.done)return;yield v.value}
  }finally{clearTimeout(timer)}
}
