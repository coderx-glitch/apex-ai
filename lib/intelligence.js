// APEX Intelligence Center: real, local, explainable. No AI is used to build the profile.
// Every pattern carries: label (KNOWN counted fact, INFERRED pattern from counts, UNKNOWN missing data),
// source, confidence (0-1, from sample size only), observedAt (when computed), lastObserved (newest item date), status.
const STOP=new Set('the a an and or but if then of to in on at for with from by is are was were be been being it this that these those i me my we you your he she they them his her our their what which who whom how why when where can could would should will shall may might do does did done have has had not no yes just also very so as about into over under again more most some any all each than too out up down off me please give make tell show write create need want get use using like help hai hain kya kaise kaun mera meri mere aap tum ko ka ki ke se me par aur ya nahi'.split(' '));
const conf=n=>Math.round(Math.min(.95,n/(n+6))*100)/100;
const newest=list=>{let m='';for(const x of list){const d=String(x.created||x.time||'');if(d>m)m=d}return m||null};
export function buildProfile(db={},stats={},now=new Date()){
 const at=now.toISOString(),out=[];const tasks=db.tasks||[],notes=db.notes||[],chats=db.chats||[],memory=db.memory||[],projects=db.projects||[];
 const add=p=>out.push({status:'unreviewed',observedAt:at,...p});
 const done=tasks.filter(t=>t.done).length,overdue=tasks.filter(t=>!t.done&&t.due&&!isNaN(new Date(t.due))&&new Date(t.due)<now).length,open=tasks.length-done;
 if(tasks.length)add({id:'tasks-counts',label:'KNOWN',title:'Task counts',claim:tasks.length+' tasks saved: '+done+' done, '+open+' open, '+overdue+' overdue.',source:'Tasks tool (counted)',confidence:1,lastObserved:newest(tasks)});
 else add({id:'tasks-none',label:'UNKNOWN',title:'Task habits',claim:'No tasks saved yet, so nothing can be said about how you plan or finish work.',source:'Tasks tool (empty)',confidence:0,lastObserved:null});
 if(tasks.length>=5){const r=done/tasks.length;add({id:'completion-rate',label:'INFERRED',title:'Task completion',claim:'You have finished about '+Math.round(r*100)+'% of the tasks you saved.',source:done+' of '+tasks.length+' tasks marked done',confidence:conf(tasks.length),lastObserved:newest(tasks)})}
 if(tasks.length>=5&&overdue>=2&&overdue/Math.max(1,open)>=.3)add({id:'overdue-pattern',label:'INFERRED',title:'Tasks tend to run late',claim:overdue+' of your '+open+' open tasks are past their due date.',source:'Due dates vs today',confidence:conf(overdue+open),lastObserved:newest(tasks)});
 const tag={};for(const n of notes)for(const t of n.tags||[])tag[t]=(tag[t]||0)+1;const topTags=Object.entries(tag).sort((a,b)=>b[1]-a[1]).slice(0,5);
 if(notes.length)add({id:'notes-counts',label:'KNOWN',title:'Notes',claim:notes.length+' notes saved'+(topTags.length?'. Most used tags: '+topTags.map(([t,c])=>t+' ('+c+')').join(', ')+'.':'.'),source:'Notes tool (counted)',confidence:1,lastObserved:newest(notes)});
 const words={};let userMsgs=0;for(const c of chats)for(const m of c.messages||[])if(m.role==='user'){userMsgs++;for(const w of String(m.content||'').toLowerCase().match(/[a-z][a-z+#.]{3,}/g)||[])if(!STOP.has(w))words[w]=(words[w]||0)+1}
 const topWords=Object.entries(words).filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,6);
 if(userMsgs>=5&&topWords.length)add({id:'chat-topics',label:'INFERRED',title:'Topics you ask about most',claim:topWords.map(([w,c])=>w+' ('+c+')').join(', ')+'. Counted from your own messages; this is word frequency, not a judgement about you.',source:userMsgs+' of your chat messages',confidence:conf(userMsgs),lastObserved:null});
 else add({id:'chat-topics-unknown',label:'UNKNOWN',title:'Topics you ask about most',claim:'Not enough chat history yet (need at least 5 of your messages with repeated words).',source:userMsgs+' messages so far',confidence:0,lastObserved:null});
 if(projects.length)add({id:'projects',label:'KNOWN',title:'Projects',claim:projects.length+' project'+(projects.length>1?'s':'')+': '+projects.slice(0,5).map(p=>p.title||p.name).filter(Boolean).join(', ')+'.',source:'Projects tool (counted)',confidence:1,lastObserved:newest(projects)});
 const prefs=memory.filter(m=>m&&!m.paused).slice(0,8);
 if(prefs.length)add({id:'memory-items',label:'KNOWN',title:'Things you asked APEX to remember',claim:prefs.map(m=>String(m.title||m.content).slice(0,80)).join(' | '),source:'Memory tool (written or approved by you)',confidence:1,lastObserved:newest(memory)});
 else add({id:'goals-unknown',label:'UNKNOWN',title:'Your goals and preferences',claim:'APEX does not know your goals yet. Add them in Memory (for example "I am learning cybersecurity") and they will appear here as KNOWN.',source:'Memory tool (empty)',confidence:0,lastObserved:null});
 if((stats.played||0)>0)add({id:'games',label:'KNOWN',title:'Games',claim:stats.played+' games played, '+(stats.wins||0)+' wins, '+(stats.tokens||0)+' tokens, '+(stats.games||[]).length+' different games tried.',source:'Games tool (counted)',confidence:1,lastObserved:null});
 return out}
export function applyStatus(patterns,statusMap={}){return patterns.map(p=>({...p,status:statusMap[p.id]||p.status})).filter(p=>p.status!=='rejected')}
export function profileSummary(patterns){return{known:patterns.filter(p=>p.label==='KNOWN').length,inferred:patterns.filter(p=>p.label==='INFERRED').length,unknown:patterns.filter(p=>p.label==='UNKNOWN').length}}
