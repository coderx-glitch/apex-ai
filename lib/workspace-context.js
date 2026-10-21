import{memoryContext}from'./memory-details.js';
// Search the current workspace locally before sending a bounded evidence packet.
// Project chats stay project-scoped. Private chat sends no saved workspace data.
export function workspaceContext(db,chat,files,query,{privateMode=false,isOwner=false,budget=6000}={}){
 if(privateMode)return JSON.stringify({scope:'private chat',checked:[],limitation:'Saved workspace not inspected or sent in private mode.'});
 const project=chat?.projectId?(db.projects||[]).find(p=>p.id===chat.projectId):null;
 const scope=chat?.projectId?'project '+(project?.title||'missing project'):'general workspace';
 const rows=[],counts={},checked=[];const add=(source,items)=>{checked.push(source);counts[source]=items.length;for(const item of items)rows.push({source,...item})};
 const shape=x=>({id:x.id,title:x.title||'',text:x.content||'',...(x.due?{due:x.due}:{}),...(x.done!==undefined?{done:!!x.done}:{})});
 const root=chat?.projectId?project||{}:db;
 add('notes',(root.notes||[]).map(shape));add('tasks',(root.tasks||[]).map(shape));
 add('projects',(chat?.projectId?(project?[project]:[]):db.projects||[]).map(shape));
 if(!chat?.projectId){add('project notes',(db.projects||[]).flatMap(p=>(p.notes||[]).map(x=>({...shape(x),project:p.title.slice(0,120)}))));add('project tasks',(db.projects||[]).flatMap(p=>(p.tasks||[]).map(x=>({...shape(x),project:p.title.slice(0,120)}))))}
 const memories=isOwner&&db.memoryEnabled?memoryContext(root.memory||[]).items:[];add('eligible memory',memories.map(shape));
 add('conversations',(db.chats||[]).filter(c=>!chat?.projectId||c.projectId===chat.projectId).map(c=>({id:c.id,title:c.title,text:(c.messages||[]).map(m=>m.role+': '+m.content).join('\n'),archived:!!c.archived})));
 add('staged uploads',(files||[]).map(f=>({title:f.name,text:f.pages?.map(p=>'p. '+p.page+': '+p.text).join('\n')||'Image/media staged; no extracted text available.'})));
 if(!chat?.projectId)add('saved sources',(db.research||[]).map(x=>({id:x.id,title:x.title,text:[x.excerpt,x.supports,x.uncertainty].filter(Boolean).join('\n'),url:x.url,publishedOn:x.publishedOn,checkedOn:x.checkedOn,verification:'User-saved source; not independently verified.'})));
 const terms=[...new Set(String(query||'').toLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu)||[])].slice(0,80);
 const ranked=rows.map((r,i)=>({r,i,score:terms.reduce((n,t)=>n+(r.title.toLowerCase().includes(t)?5:0)+(r.text.toLowerCase().includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score||a.i-b.i);
 const evidence=[];let used=0;for(const{r,score}of ranked){const text=r.text;let start=0;if(score){const positions=terms.map(t=>text.toLowerCase().indexOf(t)).filter(n=>n>=0);if(positions.length)start=Math.max(0,Math.min(...positions)-150)}const excerpt={...r,text:text.slice(start,start+850),excerptOnly:text.length>850};const size=JSON.stringify(excerpt).length;if(used+size>budget)continue;evidence.push(excerpt);used+=size}
 const packet={scope,checked,counts,selected:evidence.length,omitted:rows.length-evidence.length,limitations:['Local keyword search, not exhaustive file or repository access.','Evidence is bounded excerpts; omitted records may contain answers.',...(!isOwner||!db.memoryEnabled?['Saved memory excluded: owner memory is off or unavailable.']:[])],evidence};while(JSON.stringify(packet).length>17500&&packet.evidence.length){packet.evidence.pop();packet.selected--;packet.omitted++}return JSON.stringify(packet);
}
