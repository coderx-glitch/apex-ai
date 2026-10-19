// Notes -> PDF. Text is drawn with the device's own fonts onto page images
// (works for Hindi + English), then embedded with pdf-lib. Honest trade-off:
// the PDF shows the note exactly, but its text is not selectable.
import{PDFDocument}from'pdf-lib';
const PW=794,PH=1123,M=56,LH=26,TITLE_LH=34,MAXP=40;
export function wrapNoteLines(ctx,title,text){
  const lines=[];const maxW=PW-2*M;
  ctx.font='700 21px system-ui,"Nirmala UI","Mangal",sans-serif';
  for(const raw of String(title||'Note').split('\n')){let line='';for(const word of raw.split(/\s+/)){const t=line?line+' '+word:word;if(ctx.measureText(t).width>maxW&&line){lines.push({text:line,title:true});line=word}else line=t}lines.push({text:line,title:true})}
  lines.push({text:'',gap:true});
  ctx.font='400 15px system-ui,"Nirmala UI","Mangal",sans-serif';
  for(const raw of String(text||'').split('\n')){if(!raw.trim()){lines.push({text:'',gap:true});continue}let line='';for(const word of raw.split(/\s+/)){const t=line?line+' '+word:word;if(ctx.measureText(t).width>maxW&&line){lines.push({text:line});line=word}else line=t}lines.push({text:line})}
  return lines;
}
export function paginate(lines){const perTitle=Math.floor((PH-2*M)/TITLE_LH);const usable=PH-2*M;const pages=[[]];let y=0;for(const ln of lines){const h=ln.title?TITLE_LH:ln.gap?LH*0.6:LH;if(y+h>usable&&pages[pages.length-1].length){pages.push([]);y=0}pages[pages.length-1].push(ln);y+=h}return pages.slice(0,MAXP);}
export async function noteToPdfBlob(title,text){
  const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');
  const pages=paginate(wrapNoteLines(ctx,title,text));
  const doc=await PDFDocument.create();
  for(const lines of pages){
    canvas.width=PW;canvas.height=PH;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,PW,PH);ctx.fillStyle='#1a1a1a';
    let y=M;for(const ln of lines){if(ln.title)ctx.font='700 21px system-ui,"Nirmala UI","Mangal",sans-serif';else ctx.font='400 15px system-ui,"Nirmala UI","Mangal",sans-serif';if(ln.text)ctx.fillText(ln.text,M,y+(ln.title?TITLE_LH*0.72:LH*0.72));y+=ln.title?TITLE_LH:ln.gap?LH*0.6:LH}
    const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.92));
    const img=await doc.embedJpg(await blob.arrayBuffer());
    const page=doc.addPage([595.28,841.89]);page.drawImage(img,{x:0,y:0,width:595.28,height:841.89});
  }
  const bytes=await doc.save();
  return{blob:new Blob([bytes],{type:'application/pdf'}),pages:pages.length,capped:pages.length===MAXP};
}
