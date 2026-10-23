import React,{useEffect,useRef,useState}from'react';
// Glide Gap: an original one-button gap game. Press Space, click or tap to flap.
const W=480,H=640,GAP=185,PW=64,SPEED=155,GRAV=1500,FLAP=-440,BEST_KEY='apex-glide-best';
const readBest=()=>{try{return Number(localStorage.getItem(BEST_KEY))||0}catch{return 0}};
const fresh=()=>({y:H/2-20,v:0,pipes:[],dist:0,score:0,over:false,started:false,t:0,flash:0,spawn:0,parts:[],shake:0,trail:0});
export default function GlideGame({onComplete,sound}){
  const canvas=useRef(),st=useRef(fresh()),raf=useRef(),last=useRef(0),cb=useRef();cb.current={onComplete,sound};
  const[handOn,HO]=useState(()=>{try{return localStorage.getItem('apex-glide-hand')!=='off'}catch{return true}}),[sig,SIG]=useState(false),handRef=useRef(true);handRef.current=handOn;const[phase,PH]=useState('ready'),[score,SC]=useState(0),[best,BS]=useState(readBest);
  const burstRef=useRef(()=>{}),phaseRef=useRef('ready'),handY=useRef(null),handAt=useRef(0);phaseRef.current=phase;
  function flap(){const s=st.current;if(s.over)return;if(!s.started){s.started=true;s.spawn=0;PH('play')}s.v=FLAP;burstRef.current(80,s.y+10,7,'#d4ff61',90,.45);cb.current.sound?.('move')}
  function restart(){st.current=fresh();SC(0);PH('ready')}
  function end(){const s=st.current;if(s.over)return;s.over=true;s.flash=1;s.shake=1;burstRef.current(96,s.y,28,'#ff8a6b',240,.8);const b=Math.max(readBest(),s.score);try{localStorage.setItem(BEST_KEY,String(b))}catch{}BS(b);PH('over');cb.current.sound?.(s.score>=10?'score':'hit');cb.current.onComplete('glide-gap',s.score,s.score>=10)}
  useEffect(()=>{
    const key=e=>{if(e.code==='Space'||e.code==='ArrowUp'||e.key==='w'||e.key==='W'){e.preventDefault();if(phaseRef.current==='over'){if(!e.repeat)restart()}else if(!e.repeat)flap()}};
    window.addEventListener('keydown',key);
    const hand=({detail:d})=>{const k=d&&d.kind||'none';if(!handRef.current){SIG(false);return}if(k==='none'||!Number.isFinite(d.y)){SIG(false);return}handY.current=d.y;handAt.current=performance.now();SIG(true);if(phaseRef.current==='ready'){const s=st.current;if(!s.over){s.started=true;s.spawn=0;PH('play')}}};
    window.addEventListener('apex-hand-frame',hand);
    const c=canvas.current,x=c.getContext('2d');
    function step(dt){const s=st.current;s.t+=dt;for(const q of s.parts){q.l-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=260*dt}s.parts=s.parts.filter(q=>q.l>0);if(s.shake>0)s.shake=Math.max(0,s.shake-dt*2.5);if(s.flash>0)s.flash=Math.max(0,s.flash-dt*3);
      if(!s.started){s.y=H/2-20+Math.sin(s.t*3.2)*9;return}
      if(s.over){s.v+=GRAV*dt;s.y=Math.min(H-26,s.y+s.v*dt);return}
      if(handRef.current&&performance.now()-handAt.current<500){const target=40+handY.current*(H-128);s.y+=(target-s.y)*Math.min(1,dt*14);s.v=0}else{s.v+=GRAV*dt;s.y+=s.v*dt}s.dist+=SPEED*dt;s.trail-=dt;if(s.trail<=0){s.trail=.05;s.parts.push({x:80,y:s.y+2,vx:-60,vy:0,l:.35,m:.35,c:'#bfe85a',r:2.2})}
      const level=Math.min(1,s.score/40),spd=SPEED*(1+level*.35);
      s.spawn-=spd*dt;
      if(s.spawn<=0){const gap=GAP-level*20,top=70+Math.random()*(H-140-gap-60);s.pipes.push({x:W+20,top,gap,passed:false});s.spawn=250}
      for(const p of s.pipes){p.x-=spd*dt;if(!p.passed&&p.x+PW<96){p.passed=true;s.score++;SC(s.score);burstRef.current(96,s.y,10,'#e6ff8f',120,.5);cb.current.sound?.('score')}}
      s.pipes=s.pipes.filter(p=>p.x>-PW-10);
      const bx=96,r=15;
      if(s.y-r<0){s.y=r;s.v=0}
      if(s.y+r>H-48)return end();
      for(const p of s.pipes){if(bx+r>p.x+4&&bx-r<p.x+PW-4&&(s.y-r<p.top+2||s.y+r>p.top+p.gap-2))return end()}}
    const hill=(off,base,amp,col,sp,seed)=>{x.fillStyle=col;x.beginPath();x.moveTo(0,H);for(let i=0;i<=W;i+=8){const u=i+off*sp;x.lineTo(i,base-amp*(.55*Math.sin(u*.011+seed)+.3*Math.sin(u*.027+seed*2.1)+.15*Math.sin(u*.06+seed*3)))}x.lineTo(W,H);x.closePath();x.fill()};
    const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#0a1424');sky.addColorStop(.55,'#12304a');sky.addColorStop(1,'#1d5a63');
    const stars=Array.from({length:46},(_,i)=>({x:(i*97)%W,y:(i*53)%300,r:i%5?1:1.8,ph:i*1.7}));
    const clouds=[{x:60,y:140,w:90,sp:.12},{x:300,y:210,w:120,sp:.08},{x:430,y:100,w:70,sp:.16}];
    function burst(px,py,n,col,spd,life){const s=st.current;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=spd*(.3+Math.random());s.parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:life*(.6+Math.random()*.6),m:life,c:col,r:1.5+Math.random()*2.5})}}
    burstRef.current=burst;
    function draw(){const s=st.current,sx=s.shake>0?(Math.random()-.5)*s.shake*10:0,sy=s.shake>0?(Math.random()-.5)*s.shake*10:0;x.save();x.translate(sx,sy);
      x.fillStyle=sky;x.fillRect(-12,-12,W+24,H+24);
      for(const q of stars){x.globalAlpha=.35+.45*Math.abs(Math.sin(s.t*1.4+q.ph));x.fillStyle='#e6f3ff';x.fillRect(q.x,q.y,q.r,q.r)}x.globalAlpha=1;
      const sg=x.createRadialGradient(380,170,6,380,170,120);sg.addColorStop(0,'rgba(212,255,97,.55)');sg.addColorStop(1,'rgba(212,255,97,0)');x.fillStyle=sg;x.fillRect(240,30,280,280);x.fillStyle='#e9ffb0';x.beginPath();x.arc(380,170,22,0,7);x.fill();
      x.fillStyle='rgba(190,225,240,.14)';for(const c of clouds){const cx=((c.x-s.dist*c.sp)%(W+200)+(W+200))%(W+200)-100;x.beginPath();x.ellipse(cx,c.y,c.w/2,12,0,0,7);x.ellipse(cx-c.w*.2,c.y-8,c.w*.25,12,0,0,7);x.ellipse(cx+c.w*.18,c.y-6,c.w*.22,10,0,0,7);x.fill()}
      hill(s.dist,H-150,90,'#10283a',.12,1);hill(s.dist,H-110,70,'#0f3a45',.25,4);hill(s.dist,H-78,46,'#0d4a4a',.45,7);
      for(const p of s.pipes){const body=x.createLinearGradient(p.x,0,p.x+PW,0);body.addColorStop(0,'#1f6b52');body.addColorStop(.35,'#49b98a');body.addColorStop(.65,'#2f8f6c');body.addColorStop(1,'#17503e');x.fillStyle=body;x.fillRect(p.x,0,PW,p.top);x.fillRect(p.x,p.top+p.gap,PW,H-48-p.top-p.gap);
        x.fillStyle='rgba(255,255,255,.14)';x.fillRect(p.x+8,0,5,p.top);x.fillRect(p.x+8,p.top+p.gap,5,H-48-p.top-p.gap);
        x.fillStyle='rgba(0,0,0,.18)';for(let yy=14;yy<p.top;yy+=34)x.fillRect(p.x,yy,PW,2);for(let yy=p.top+p.gap+34;yy<H-48;yy+=34)x.fillRect(p.x,yy,PW,2);
        const cap=(cy)=>{const g=x.createLinearGradient(p.x,0,p.x+PW,0);g.addColorStop(0,'#a8d93f');g.addColorStop(.5,'#e6ff8f');g.addColorStop(1,'#a8d93f');x.fillStyle=g;x.beginPath();x.roundRect(p.x-5,cy,PW+10,14,5);x.fill()};cap(p.top-14);cap(p.top+p.gap)}
      const gg=x.createLinearGradient(0,H-48,0,H);gg.addColorStop(0,'#1a3040');gg.addColorStop(1,'#0e1a24');x.fillStyle=gg;x.fillRect(0,H-48,W,48);x.fillStyle='#d4ff61';x.fillRect(0,H-48,W,3);x.fillStyle='rgba(212,255,97,.35)';for(let i=0;i<14;i++){const gx=((i*44-s.dist)%(W+44)+(W+44))%(W+44)-22;x.beginPath();x.moveTo(gx,H-45);x.lineTo(gx+18,H-45);x.lineTo(gx+6,H-30);x.lineTo(gx-12,H-30);x.fill()}
      for(const q of s.parts){x.globalAlpha=Math.max(0,q.l/q.m);x.fillStyle=q.c;x.beginPath();x.arc(q.x,q.y,q.r*Math.max(.3,q.l/q.m),0,7);x.fill()}x.globalAlpha=1;
      const ang=Math.max(-.55,Math.min(1.1,s.v/600)),flapPh=s.started&&!s.over?Math.sin(s.t*24):0.3;x.save();x.translate(96,s.y);x.rotate(ang);
      const aura=x.createRadialGradient(0,0,2,0,0,34);aura.addColorStop(0,'rgba(212,255,97,.28)');aura.addColorStop(1,'rgba(212,255,97,0)');x.fillStyle=aura;x.fillRect(-36,-36,72,72);
      x.fillStyle='#8fbf2e';x.beginPath();x.moveTo(-8,0);x.quadraticCurveTo(-30,-4-flapPh*5,-36,8+flapPh*6);x.quadraticCurveTo(-22,6,-8,6);x.fill();
      const bd=x.createLinearGradient(0,-16,0,16);bd.addColorStop(0,'#f1ffb5');bd.addColorStop(1,'#a6d936');x.fillStyle=bd;x.beginPath();x.moveTo(24,1);x.quadraticCurveTo(8,-18,-14,-12);x.quadraticCurveTo(-20,0,-14,12);x.quadraticCurveTo(8,18,24,1);x.fill();
      x.fillStyle='#ffb347';x.beginPath();x.moveTo(24,1);x.lineTo(34,5);x.lineTo(22,7);x.fill();
      x.fillStyle='#fff';x.beginPath();x.arc(10,-4,4.4,0,7);x.fill();x.fillStyle='#0a0f16';x.beginPath();x.arc(11.2,-4,2.2,0,7);x.fill();
      x.fillStyle='#5f9a1a';x.beginPath();x.moveTo(-4,-2);x.quadraticCurveTo(-18,-22+flapPh*14,-32,-14+flapPh*20);x.quadraticCurveTo(-16,-4,-4,4);x.fill();x.restore();
      if(handRef.current&&performance.now()-handAt.current<500){const ty=40+handY.current*(H-128);x.fillStyle='#d4ff61';x.beginPath();x.moveTo(W-4,ty);x.lineTo(W-18,ty-8);x.lineTo(W-18,ty+8);x.closePath();x.fill();x.globalAlpha=.25;x.fillRect(W-19,40,1,H-128);x.globalAlpha=1}
      x.fillStyle='rgba(8,14,20,.4)';x.beginPath();x.roundRect(W/2-34,34,68,60,14);x.fill();x.fillStyle='#f2fbf7';x.font='bold 44px sans-serif';x.textAlign='center';x.fillText(String(s.score),W/2,82);
      const vg=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.35)');x.fillStyle=vg;x.fillRect(-12,-12,W+24,H+24);
      if(s.flash>0){x.fillStyle='rgba(255,255,255,'+(s.flash*.4)+')';x.fillRect(-12,-12,W+24,H+24)}x.restore()}
    function loop(t){const dt=Math.min(.033,(t-(last.current||t))/1000);last.current=t;if(!document.hidden)step(dt);draw();raf.current=requestAnimationFrame(loop)}
    raf.current=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener('keydown',key);window.removeEventListener('apex-hand-frame',hand)}},[]);
  const onPointer=e=>{e.preventDefault();phase==='over'?null:flap()};
  return <div className="code-quiz glide-game" style={{maxWidth:480,margin:'0 auto'}}>
    <div className="bot-maze-top"><strong>Glide Gap</strong><span>Score {score} · Best {best}</span></div>
    <div style={{position:'relative'}}>
      <canvas ref={canvas} width={W} height={H} onPointerDown={onPointer} role="img" aria-label="Glide Gap game. Press space or click to flap and pass through the gaps." style={{width:'100%',maxHeight:'68vh',aspectRatio:W+'/'+H,borderRadius:16,border:'1px solid rgba(255,255,255,.12)',cursor:'pointer',touchAction:'manipulation',display:'block',background:'#0a0f16'}}/>
      {phase==='ready'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',pointerEvents:'none'}}><div style={{textAlign:'center',color:'#e8f2ef',textShadow:'0 2px 10px #000'}}><p style={{fontSize:20,fontWeight:700,margin:0}}>Press Space or click to flap</p><p style={{opacity:.8,margin:'6px 0 0'}}>Slip through the gaps. Do not touch the pillars or the ground.</p></div></div>}
      {phase==='over'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(5,9,14,.62)',borderRadius:16}}><div style={{textAlign:'center',color:'#e8f2ef'}}><h3 style={{margin:0,fontSize:26}}>{score>=10?'Nice run':'Run over'}</h3><p style={{margin:'8px 0 14px'}}>Score {score} · Best {best}</p><button className="primary" onClick={restart}>Play again (Space)</button></div></div>}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',margin:'10px 0 0'}}><button type="button" className="secondary" aria-pressed={handOn} onClick={()=>{const v=!handOn;HO(v);try{localStorage.setItem('apex-glide-hand',v?'on':'off')}catch{}}}>Hand control: {handOn?'on':'off'}</button><span style={{opacity:.8,fontSize:13}}>{!handOn?'Keyboard, click and tap still work.':sig?'Hand seen. Move your hand up and down; the bird follows.':'Start camera gestures in Controls, then move your hand up and down; the bird follows. Video stays on this device.'}</span></div>
    <p className="game-rules">Space, Up arrow, W, click or tap to flap. Each pillar passed is one point; gaps narrow slowly as you score. 10 points counts as a win. With camera gestures on, your hand height steers the bird directly. Keyboard and click still work. Best score is saved on this device only.</p>
  </div>}
