import{tagsFromText}from'./task-details.js';
export const NOTE_VERSION_LIMIT=5;
export function noteDetails(value){
 if(value.tags!==undefined&&(!Array.isArray(value.tags)||value.tags.length>10||value.tags.some(t=>typeof t!=='string'||t.length>30)))throw Error('Invalid note tags.');
 if(value.versions!==undefined&&(!Array.isArray(value.versions)||value.versions.length>NOTE_VERSION_LIMIT))throw Error('Invalid note versions.');
 const versions=(value.versions||[]).map(v=>{if(!v||typeof v.id!=='string'||!v.id||v.id.length>100||typeof v.title!=='string'||v.title.length>500||typeof v.content!=='string'||v.content.length>100000||typeof v.savedAt!=='string'||v.savedAt.length>60||!Number.isFinite(Date.parse(v.savedAt)))throw Error('Invalid note snapshot.');return{id:v.id,title:v.title,content:v.content,savedAt:v.savedAt}});
 if(new Set(versions.map(v=>v.id)).size!==versions.length)throw Error('Duplicate note snapshot IDs.');
 return{tags:tagsFromText((value.tags||[]).join(',')),versions};
}
export function snapshotNote(note,uid,at){const history=note.versions||[];if(history[0]?.title===(note.title||'')&&history[0]?.content===(note.content||''))return history;return[{id:uid(),title:note.title||'',content:note.content||'',savedAt:at},...history].slice(0,NOTE_VERSION_LIMIT)}
export function restoreNote(note,id,uid,at){const selected=(note.versions||[]).find(v=>v.id===id);if(!selected)throw Error('Snapshot not found.');return{title:selected.title,content:selected.content,versions:snapshotNote(note,uid,at)}}
export function duplicateNotes(notes){const groups=new Map(),result=new Map();for(const n of notes){const key=String(n.content||'').trim();if(!key)continue;const group=groups.get(key)||[];group.push(n);groups.set(key,group)}for(const group of groups.values())if(group.length>1)for(const n of group)result.set(n.id,group.filter(x=>x.id!==n.id).map(x=>({id:x.id,title:x.title||'Untitled note'})));return result}
