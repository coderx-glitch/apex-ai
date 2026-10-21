import React from'react';
export function Letters({text,off=0}){let n=off;return text.split(' ').map((w,wi)=><React.Fragment key={wi}><b className="cw" aria-hidden="true">{[...w].map((ch,i)=><i className="cl" key={i} data-n={n++}>{ch}</i>)}</b>{wi<text.split(' ').length-1?' ':null}</React.Fragment>)}
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let timer=0,t2=0;
export function burstText(e){const h1=e.currentTarget,hit=e.target.closest?.('.cl');if(reduced())return;const letters=[...h1.querySelectorAll('.cl')];if(!letters.length)return;
const ref=(hit||letters[Math.floor(letters.length/2)]).getBoundingClientRect(),ox=ref.left+ref.width/2,oy=ref.top+ref.height/2,small=innerWidth<700;
clearTimeout(timer);clearTimeout(t2);h1.classList.remove('settle');h1.classList.add('floating');
letters.forEach((l,i)=>{const r=l.getBoundingClientRect(),dx=r.left+r.width/2-ox,dy=r.top+r.height/2-oy,d=Math.hypot(dx,dy)||1,m=(small?46:70)/(1+d/110),rnd=()=>Math.random()-.5;
l.style.transition='transform .55s cubic-bezier(.2,.9,.25,1)';
l.style.transform='translate3d('+(dx/d*m+rnd()*12).toFixed(0)+'px,'+(dy/d*m-10-Math.random()*16).toFixed(0)+'px,'+(30+Math.random()*(small?30:60)).toFixed(0)+'px) rotateX('+(rnd()*34).toFixed(0)+'deg) rotateY('+(rnd()*34).toFixed(0)+'deg) rotateZ('+(rnd()*14).toFixed(0)+'deg)';l.style.setProperty('--bd',(i%7)*.08+'s')});
timer=setTimeout(()=>{h1.classList.add('settle');letters.forEach(l=>{l.style.transition='transform .8s cubic-bezier(.3,.9,.3,1)';l.style.transform=''});t2=setTimeout(()=>{h1.classList.remove('floating','settle');letters.forEach(l=>{l.style.transition=''})},1000)},1100)}
