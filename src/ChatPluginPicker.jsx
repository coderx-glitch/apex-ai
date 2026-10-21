import React,{useState}from'react';
import{Plug,X}from'lucide-react';
import{CHAT_PLUGINS}from'../lib/chat-plugins.js';
export default function ChatPluginPicker({value,onChange,busy}){
 const[open,O]=useState(false);
 const add=p=>{if(value.some(c=>c.id===p.id)){O(false);return}onChange([...value,{id:p.id,name:p.name,query:''}]);O(false)};
 return <>
  {value.length>0&&<div className="file-chips plugin-chips">{value.map(c=><span key={c.id} className="plugin-chip"><Plug size={13}/>{c.name}<input aria-label={c.name+' query'} placeholder={(CHAT_PLUGINS.find(p=>p.id===c.id)||{}).hint||'search terms'} value={c.query} onChange={e=>onChange(value.map(x=>x.id===c.id?{...x,query:e.target.value}:x))} disabled={busy}/><button aria-label={'Remove '+c.name} onClick={()=>onChange(value.filter(x=>x.id!==c.id))}><X size={12}/></button></span>)}</div>}
  <div className="plugin-picker-wrap">
   <button type="button" aria-label="Attach live data from a plugin" title="Attach live data (weather, news, YouTube, NASA...) to your message" disabled={busy} onClick={()=>O(!open)}><Plug size={18}/></button>
   {open&&<div className="plugin-picker" role="menu" aria-label="Live data plugins">
    <p>Attach live data to this message. APEX fetches it first, then answers with it.</p>
    {CHAT_PLUGINS.map(p=><button key={p.id} role="menuitem" disabled={value.some(c=>c.id===p.id)} onClick={()=>add(p)}><strong>{p.name}</strong><small>{p.hint}{p.keyless?' · no key needed':''}</small></button>)}
   </div>}
  </div>
 </>;
}
