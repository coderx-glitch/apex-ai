import{validateProjects}from'./projects.js';
import{validateResearch}from'./research.js';
import{memoryDetails}from'./memory-details.js';
import{noteDetails}from'./note-details.js';
import{taskDetails}from'./task-details.js';
const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
export function validateWorkspace(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Choose an APEX workspace JSON export.');
 for(const key of ['chats','memory','notes','tasks','activity'])if(!Array.isArray(value[key]))throw Error('Backup is missing '+key+'. No changes were made.');
 if(!value.chats.length||value.chats.length>500)throw Error('Backup must contain 1 to 500 conversations.');
 const item=x=>{if(!x||typeof x!=='object'||typeof x.id!=='string')throw Error('Backup contains an invalid item.');return{id:text(x.id,100),title:text(x.title,500),content:text(x.content,100000),created:text(x.created,60),done:!!x.done,due:text(x.due,30),notified:!!x.notified}};
 const projects=validateProjects(value.projects);const chats=value.chats.map(c=>{if(!c||typeof c.id!=='string'||!Array.isArray(c.messages)||c.messages.length>2000)throw Error('Backup contains an invalid conversation.');if(c.projectId!==undefined&&(typeof c.projectId!=='string'||c.projectId.length>100))throw Error('Invalid conversation project ID.');if(c.pinned!==undefined&&typeof c.pinned!=='boolean'||c.archived!==undefined&&typeof c.archived!=='boolean')throw Error('Invalid conversation organization settings.');return{id:text(c.id,100),pinned:!!c.pinned,archived:!!c.archived,projectId:c.projectId||'',title:text(c.title,500)||'Conversation',summary:text(c.summary,30000),summarizedUntil:Number.isInteger(c.summarizedUntil)?Math.max(0,Math.min(c.summarizedUntil,c.messages.length)):0,messages:c.messages.map(m=>{if(!m||!['user','assistant'].includes(m.role))throw Error('Backup contains an invalid message.');return{id:text(m.id,100)||crypto.randomUUID(),role:m.role,...(m.role==='assistant'&&m.engine==='local-calculator'?{engine:'local-calculator'}:{}),content:text(m.content,100000),error:text(m.error,2000),sources:Array.isArray(m.sources)?m.sources.filter(s=>s&&/^https?:\/\//i.test(s.url)).slice(0,100).map(s=>({title:text(s.title,1000),url:text(s.url,4000)})):[]}})}});
 for(const key of ['notes','tasks','memory'])if(value[key].length>5000)throw Error('Backup contains too many '+key+'.');
 const activity=value.activity.slice(0,300).map(a=>({id:text(a.id,100)||crypto.randomUUID(),time:text(a.time,60),action:text(a.action,500),result:text(a.result,5000),level:['green','yellow','red'].includes(a.level)?a.level:'yellow'}));
 const db={chats,projects,research:validateResearch(value.research),notes:value.notes.map(x=>({...item(x),...noteDetails(x)})),tasks:value.tasks.map(x=>({...item(x),...taskDetails(x)})),memory:value.memory.map(x=>({...item(x),...memoryDetails(x)})),activity,memoryEnabled:value.memoryEnabled!==false};
 for(const key of ['chats','notes','tasks','memory'])if(new Set(db[key].map(x=>x.id)).size!==db[key].length)throw Error('Backup contains duplicate IDs.');
 return db;
}
export function matchesSearch(item,query){const q=query.trim().toLowerCase();return !q||[item.title,item.content,...(item.tags||[]),...(item.subtasks||[]).map(t=>t.title),...(item.messages||[]).map(m=>m.content)].join(' ').toLowerCase().includes(q)}
export function taskState(item,at=new Date()){return item.done?'completed':item.due&&!isNaN(new Date(item.due))&&new Date(item.due)<at?'overdue':'open'}
