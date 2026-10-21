// Cinematic effects controller. Tiny: 1 overlay, 1 cursor light (desktop only), 1 post-login curtain.
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduced){
const weak=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=2;const coarse=matchMedia('(pointer:coarse)').matches,H=document.documentElement.classList;if(weak)H.add('cin-lite');else if(!coarse&&(navigator.hardwareConcurrency||8)>=6)H.add('cin-3d');
const el=(c,h)=>{const d=document.createElement('div');d.className=c;if(h)d.innerHTML=h;d.setAttribute('aria-hidden','true');document.body.appendChild(d);return d};
const start=()=>{
 el('cin-fx','<i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="flare"></i>');
  
 const probe=()=>{if(!H.contains('cin-3d')||window.__cinNoProbe)return;let n=0,t0=performance.now();const f=x=>{n++;if(n<45)requestAnimationFrame(f);else if((x-t0)/n>34){H.remove('cin-3d');H.add('cin-lite');document.querySelector('.cin-glass')?.remove()}};requestAnimationFrame(f)};
 let glass=null,tq=false,tev;const tilt=e=>{tev=e;if(tq)return;tq=true;requestAnimationFrame(()=>{tq=false;const card=document.querySelector('.access-card'),st=document.querySelector('.access-story');if(!card)return;const nx=tev.clientX/innerWidth-.5,ny=tev.clientY/innerHeight-.5;card.style.setProperty('--ry',(-3+nx*7).toFixed(2)+'deg');card.style.setProperty('--rx',(-ny*5).toFixed(2)+'deg');if(st){st.style.setProperty('--px',(-nx*12).toFixed(1)+'px');st.style.setProperty('--py',(-ny*7).toFixed(1)+'px')}})};
 const intro=()=>{if(H.contains('cin-3d')){glass=el('cin-glass','<i class="g1"></i><i class="g2"></i><i class="g3"></i>');addEventListener('pointermove',tilt,{passive:true});setTimeout(probe,2200)};const bb=el('cin-bars');let sw;if(!weak)sw=el('cin-sweep');setTimeout(()=>{bb.remove();sw&&sw.remove()},3600)};

 let was=!!document.querySelector('.access-shell'),t=0;let shown=false;const tick=()=>{if(shown)return;if(document.querySelector('.access-shell')&&!document.getElementById('boot')){shown=true;intro()}else setTimeout(tick,200)};tick();
 setInterval(()=>{if(document.hidden)return;const now=!!document.querySelector('.access-shell');if(now&&!shown&&!document.getElementById('boot')){shown=true;intro()}if(!now&&shown){shown=false;glass&&glass.remove();glass=null;removeEventListener('pointermove',tilt)}if(was&&!now){const k=el('cin-curtain');const bb=el('cin-bars');setTimeout(()=>bb.remove(),1700);setTimeout(()=>k.remove(),1100)}was=now},400)};
if(document.body)start();else addEventListener('DOMContentLoaded',start)}
