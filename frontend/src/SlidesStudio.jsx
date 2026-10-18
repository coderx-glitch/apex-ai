import React,{useState} from 'react';
import {Plus,Trash2,ArrowUp,ArrowDown,Download,Presentation} from 'lucide-react';

// Turns a typed or pasted outline into a real .pptx on this device.
// No AI drafting here: the content is always the user's own text.
const uid=()=>crypto.randomUUID();

function parseOutline(topic,text){
  const slides=[];
  if(topic.trim())slides.push({id:uid(),kind:'title',title:topic.trim().slice(0,120),bullets:[]});
  let cur=null;
  for(const raw of text.split('\n')){
    const line=raw.trimEnd();
    if(!line.trim())continue;
    const head=line.match(/^\s*#{1,3}\s+(.+)/)||line.match(/^\s*(?:slide\s+\d+[:.]\s*)(.+)/i);
    if(head){cur={id:uid(),kind:'content',title:head[1].trim().slice(0,120),bullets:[]};slides.push(cur);continue}
    const bullet=line.replace(/^\s*[-*•\d+.]\s*/,'').trim();
    if(!bullet)continue;
    if(!cur){cur={id:uid(),kind:'content',title:'Points',bullets:[]};slides.push(cur)}
    if(cur.bullets.length<8)cur.bullets.push(bullet.slice(0,200));
  }
  return slides.slice(0,30);
}

export default function SlidesStudio({onLog}){
  const[topic,T]=useState(''),[outline,O]=useState(''),[slides,S]=useState([]),[busy,B]=useState(false),[error,E]=useState(''),[done,D]=useState('');

  function build(){const s=parseOutline(topic,outline);if(!s.length){E('Write a topic or paste an outline first. Nothing created.');return}E('');D('');S(s)}

  async function download(){
    if(!slides.length||busy)return;B(true);E('');D('');
    try{
      const{default:PptxGenJS}=await import('pptxgenjs');
      const p=new PptxGenJS();
      p.defineLayout({name:'WIDE',width:10,height:5.625});p.layout='WIDE';
      p.author='APEX AI';p.title=slides[0]?.title||'Presentation';
      for(const s of slides){
        const slide=p.addSlide();
        slide.background={color:'F7F4EC'};
        slide.addShape('rect',{x:0,y:0,w:10,h:0.16,fill:{color:'253A30'}});
        if(s.kind==='title'){
          slide.addText(s.title,{x:0.6,y:2.0,w:8.8,h:1.4,fontFace:'Georgia',fontSize:36,color:'253A30',align:'center'});
          slide.addShape('line',{x:3.6,y:3.5,w:2.8,h:0,line:{color:'C9A25E',width:2}});
          slide.addText('Made with APEX AI',{x:0.6,y:4.6,w:8.8,h:0.4,fontFace:'Georgia',fontSize:12,color:'5B685A',align:'center',italic:true});
        }else{
          slide.addText(s.title,{x:0.5,y:0.4,w:9,h:0.8,fontFace:'Georgia',fontSize:24,color:'253A30'});
          slide.addShape('line',{x:0.55,y:1.25,w:2.2,h:0,line:{color:'C9A25E',width:2}});
          if(s.bullets.length)slide.addText(s.bullets.map(b=>({text:b,options:{bullet:{code:'25C6'},fontSize:16,color:'253A30',fontFace:'Calibri',breakLine:true,paraSpaceAfter:10}})),{x:0.7,y:1.6,w:8.6,h:3.6,valign:'top'});
        }
      }
      const name=(slides[0]?.title||'presentation').replace(/[^\w\u0900-\u097F -]/g,'').trim().slice(0,60)||'presentation';
      await p.writeFile({fileName:name+'.pptx'});
      D('Downloaded '+name+'.pptx · '+slides.length+' slides. Open in PowerPoint, Google Slides or Impress to edit further.');
      onLog?.('Slides downloaded',slides.length+' slides exported as a real .pptx on this device. No upload, no AI request.');
    }catch(e){E('The presentation file could not be created on this device. Nothing was uploaded or sent.')}
    finally{B(false)}
  }

  return <section className="page">
    <div className="page-title"><div><div className="eyebrow">APEX / SLIDES STUDIO</div><h1>Slides</h1></div><Presentation size={25}/></div>
    <p className="page-description">Type a topic and paste your points - one heading per slide, one line per bullet. Edit every slide below, then download a real .pptx. Everything stays on this device. APEX does not write the content for you in this version, so nothing is made up.</p>
    <div className="settings-card">
      <h3>Outline</h3>
      <label>Topic or presentation title<input aria-label="Presentation topic" maxLength={120} value={topic} onChange={e=>T(e.target.value)} placeholder="e.g. Smart City project"/></label>
      <label>Points (use # for a new slide, - for a bullet)<textarea aria-label="Outline" rows={7} value={outline} onChange={e=>O(e.target.value)} placeholder={'# Problem\n- cities waste energy\n- data sits unused\n\n# Our idea\n- sensors on every streetlight'}/></label>
      <button className="primary" onClick={build}>Prepare slides</button>
      <small>{slides.length?slides.length+' slides ready. Edit any title or bullet below.':'Headings become slides, lines become bullets. Up to 30 slides.'}</small>
    </div>
    {slides.length>0&&<div className="settings-card">
      <h3>Edit slides</h3>
      {slides.map((s,i)=><div className="info-row" key={s.id} style={{display:'block'}}>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
          <small>{i+1} · {s.kind==='title'?'Title slide':'Content slide'}</small>
          <span style={{flex:1}}/>
          <button className="subtle" aria-label={'Move slide '+(i+1)+' up'} disabled={i===0} onClick={()=>S(a=>{const b=[...a];[b[i-1],b[i]]=[b[i],b[i-1]];return b})}><ArrowUp size={13}/></button>
          <button className="subtle" aria-label={'Move slide '+(i+1)+' down'} disabled={i===slides.length-1} onClick={()=>S(a=>{const b=[...a];[b[i],b[i+1]]=[b[i+1],b[i]];return b})}><ArrowDown size={13}/></button>
          <button className="subtle delete" aria-label={'Delete slide '+(i+1)} onClick={()=>S(a=>a.filter(x=>x.id!==s.id))}><Trash2 size={13}/></button>
        </div>
        <input className="editable-title" aria-label={'Slide '+(i+1)+' title'} maxLength={120} value={s.title} onChange={e=>S(a=>a.map(x=>x.id===s.id?{...x,title:e.target.value}:x))}/>
        {s.kind==='content'&&<textarea aria-label={'Slide '+(i+1)+' bullets'} rows={Math.min(6,Math.max(2,s.bullets.length+1))} value={s.bullets.join('\n')} onChange={e=>S(a=>a.map(x=>x.id===s.id?{...x,bullets:e.target.value.split('\n').map(l=>l.trim()).filter(Boolean).slice(0,8)}:x))}/>}
      </div>)}
      <button className="subtle" onClick={()=>S(a=>[...a,{id:uid(),kind:'content',title:'New slide',bullets:[]}].slice(0,30))}><Plus size={14}/> Add slide</button>
      <button className="primary" disabled={busy} onClick={download}><Download size={15}/>{busy?'Preparing file…':'Download .pptx'}</button>
      {done&&<p role="status" className="access-notice">{done}</p>}
    </div>}
    {error&&<p role="alert" className="error">{error}</p>}
  </section>;
}
