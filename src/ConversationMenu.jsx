import React,{useState,useRef,useEffect}from'react';
export default function ConversationMenu({chat,busy,onDelete}){
 const[open,S]=useState(false),ref=useRef();
 useEffect(()=>{if(!open)return;function close(e){if(!ref.current?.contains(e.target))S(false)}document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[open]);
 return <div className="conversation-menu" ref={ref} onKeyDown={e=>{if(e.key==='Escape'){S(false);ref.current?.querySelector('button')?.focus()}}}>
 <button type="button" className="conversation-dots" disabled={busy} aria-label={'Options for '+chat.title} aria-expanded={open} onClick={()=>S(v=>!v)}>⋯</button>
 {open&&<div className="conversation-menu-items"><button type="button" disabled={busy} onClick={()=>{S(false);onDelete(chat)}}>Delete conversation</button></div>}
 </div>
}
