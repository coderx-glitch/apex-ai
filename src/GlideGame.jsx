import React,{useEffect,useRef,useState}from'react';
// Glide Gap: an original one-button gap game. Press Space, click or tap to flap.
const W=480,H=640,GAP=170,PW=64,SPEED=170,GRAV=1500,FLAP=-440,BEST_KEY='apex-glide-best';
const readBest=()=>{try{return Number(localStorage.getItem(BEST_KEY))||0}catch{return 0}};
const fresh=()=>({y:H/2-20,v:0,pipes:[],dist:0,score:0,over:false,started:false,t:0,flash:0,spawn:0});
export default function GlideGame({onComplete,sound}){
  const canvas=useRef(),st=useRef(fresh()),raf=useRef(),last=useRef(0),cb=useRef();cb.current={onComplete,sound};
  const[phase,PH]=useState('ready'),[score,SC]=useState(0),[best,BS]=useState(readBest);
  const phaseRef=useRef('ready');phaseRef.current=phase;
  function flap(){const s=st.current;if(s.over)return;if(!s.started){s.started=true;s.spawn=0;PH('play')}s.v=FLAP;cb.current.sound?.('move')}
  function restart(){st.current=fresh();SC(0);PH('ready')}
  function end(){const s=st.current;if(s.over)return;s.over=true;s.flash=1;const b=Math.max(readBest(),s.score);try{localStorage.setItem(BEST_KEY,String(b))}catch{}BS(b);PH('over');cb.current.sound?.(s.score>=10?'score':'hit');cb.current.onComplete('glide-gap',s.score,s.score>=10)}
  useEffect(()=>{
    const key=e=>{if(e.code==='Space'||e.code==='ArrowUp'||e.key==='w'||e.key==='W'){e.preventDefault();if(phaseRef.current==='over'){if(!e.repeat)restart()}else if(!e.repeat)flap()}};
    window.addEventListener('keydown',key);
    const c=canvas.current,x=c.getContext('2d');
    function step(dt){const s=st.current;s.t+=dt;if(s.flash>0)s.flash=Math.max(0,s.flash-dt*3);
      if(!s.started){s.y=H/2-20+Math.sin(s.t*3.2)*9;return}
      if(s.over){s.v+=GRAV*dt;s.y=Math.min(H-26,s.y+s.v*dt);return}
      s.v+=GRAV*dt;s.y+=s.v*dt;s.dist+=SPEED*dt;
      const level=Math.min(1,s.score/40),spd=SPEED*(1+level*.35);
      s.spawn-=spd*dt;
      if(s.spawn<=0){const gap=GAP-level*28,top=70+Math.random()*(H-140-gap-60);s.pipes.push({x:W+20,top,gap,passed:false});s.spawn=250}
      for(const p of s.pipes){p.x-=spd*dt;if(!p.passed&&p.x+PW<96){p.passed=true;s.score++;SC(s.score);cb.current.sound?.('score')}}
      s.pipes=s.pipes.filter(p=>p.x>-PW-10);
      const bx=96,r=15;
      if(s.y-r<0){s.y=r;s.v=0}
      if(s.y+r>H-48)return end();
      for(const p of s.pipes){if(bx+r>p.x+4&&bx-r<p.x+PW-4&&(s.y-r<p.top+2||s.y+r>p.top+p.gap-2))return end()}}
    function draw(){const s=st.current;
      const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0c1a22');g.addColorStop(1,'#0a0f16');x.fillStyle=g;x.fillRect(0,0,W,H);
      for(let i=0;i<40;i++){const sx=((i*97)-s.dist*(.08+(i%3)*.04))%W,sy=(i*53)%(H-120);x.fillStyle=i%4?'#a9c8ed44':'#d4ff6155';x.fillRect(((sx%W)+W)%W,sy,i%4?1.5:2.5,i%4?1.5:2.5)}
      x.fillStyle='#0f1c26';for(let i=0;i<7;i++){const hx=((i*110-s.dist*.25)%(W+110)+(W+110))%(W+110)-55,hh=60+((i*37)%50);x.beginPath();x.moveTo(hx-70,H-48);x.lineTo(hx,H-48-hh);x.lineTo(hx+70,H-48);x.fill()}
      for(const p of s.pipes){const gr=x.createLinearGradient(p.x,0,p.x+PW,0);gr.addColorStop(0,'#2b5a3a');gr.addColorStop(.5,'#3f8a56');gr.addColorStop(1,'#2b5a3a');x.fillStyle=gr;x.fillRect(p.x,0,PW,p.top);x.fillRect(p.x,p.top+p.gap,PW,H-48-p.top-p.gap);x.fillStyle='#d4ff61';x.fillRect(p.x-4,p.top-12,PW+8,12);x.fillRect(p.x-4,p.top+p.gap,PW+8,12)}
      x.fillStyle='#16222c';x.fillRect(0,H-48,W,48);x.fillStyle='#d4ff61';x.fillRect(0,H-48,W,3);x.fillStyle='#233644';for(let i=0;i<14;i++){const gx=((i*44-s.dist)%(W+44)+(W+44))%(W+44)-22;x.fillRect(gx,H-34,24,4)}
      const ang=Math.max(-.5,Math.min(1.1,s.v/600));x.save();x.translate(96,s.y);x.rotate(ang);
      x.fillStyle='#d4ff61';x.beginPath();x.moveTo(20,0);x.lineTo(-14,-14);x.lineTo(-8,0);x.lineTo(-14,14);x.closePath();x.fill();
      x.fillStyle='#0a0f16';x.beginPath();x.arc(6,-2,2.6,0,7);x.fill();
      x.strokeStyle='#d4ff61';x.lineWidth=3;x.lineCap='round';const w=s.started&&!s.over?Math.sin(s.t*22)*7:3;x.beginPath();x.moveTo(-6,3);x.lineTo(-18,3+w);x.stroke();x.restore();
      x.fillStyle='#e8f2ef';x.font='bold 46px sans-serif';x.textAlign='center';x.globalAlpha=.9;x.fillText(String(s.score),W/2,78);x.globalAlpha=1;
      if(s.flash>0){x.fillStyle='rgba(255,255,255,'+(s.flash*.35)+')';x.fillRect(0,0,W,H)}}
    function loop(t){const dt=Math.min(.033,(t-(last.current||t))/1000);last.current=t;if(!document.hidden)step(dt);draw();raf.current=requestAnimationFrame(loop)}
    raf.current=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener('keydown',key)}},[]);
  const onPointer=e=>{e.preventDefault();phase==='over'?null:flap()};
  return <div className="code-quiz glide-game" style={{maxWidth:480,margin:'0 auto'}}>
    <div className="bot-maze-top"><strong>Glide Gap</strong><span>Score {score} · Best {best}</span></div>
    <div style={{position:'relative'}}>
      <canvas ref={canvas} width={W} height={H} onPointerDown={onPointer} role="img" aria-label="Glide Gap game. Press space or click to flap and pass through the gaps." style={{width:'100%',maxHeight:'68vh',aspectRatio:W+'/'+H,borderRadius:16,border:'1px solid rgba(255,255,255,.12)',cursor:'pointer',touchAction:'manipulation',display:'block',background:'#0a0f16'}}/>
      {phase==='ready'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',pointerEvents:'none'}}><div style={{textAlign:'center',color:'#e8f2ef',textShadow:'0 2px 10px #000'}}><p style={{fontSize:20,fontWeight:700,margin:0}}>Press Space or click to flap</p><p style={{opacity:.8,margin:'6px 0 0'}}>Slip through the gaps. Do not touch the pillars or the ground.</p></div></div>}
      {phase==='over'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(5,9,14,.62)',borderRadius:16}}><div style={{textAlign:'center',color:'#e8f2ef'}}><h3 style={{margin:0,fontSize:26}}>{score>=10?'Nice run':'Run over'}</h3><p style={{margin:'8px 0 14px'}}>Score {score} · Best {best}</p><button className="primary" onClick={restart}>Play again (Space)</button></div></div>}
    </div>
    <p className="game-rules">Space, Up arrow, W, click or tap to flap. Each pillar passed is one point; gaps narrow slowly as you score. 10 points counts as a win. Best score is saved on this device only.</p>
  </div>}
