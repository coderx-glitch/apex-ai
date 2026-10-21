import React,{useEffect,useRef,useState}from'react';
import{newStickDash,stickDashStep,newKarate,karateStep,karatePunch}from'../lib/stickman-games.js';
function stickman(x,cx,cy,scale,pose){
  x.strokeStyle='#f5efe0';x.lineWidth=3*scale;x.lineCap='round';x.fillStyle='#f5efe0';
  const head=(hx,hy)=>{x.beginPath();x.arc(hx,hy,7*scale,0,7);x.stroke()};
  if(pose==='slide'){x.beginPath();x.moveTo(cx-14*scale,cy);x.lineTo(cx+8*scale,cy-8*scale);x.stroke();head(cx+16*scale,cy-12*scale);
    x.beginPath();x.moveTo(cx+2*scale,cy-6*scale);x.lineTo(cx+22*scale,cy);x.moveTo(cx+2*scale,cy-6*scale);x.lineTo(cx-18*scale,cy-2*scale);x.stroke()}
  else if(pose==='jump'){head(cx,cy-34*scale);x.beginPath();x.moveTo(cx,cy-27*scale);x.lineTo(cx,cy-10*scale);x.stroke();
    x.beginPath();x.moveTo(cx,cy-10*scale);x.lineTo(cx-10*scale,cy+2*scale);x.moveTo(cx,cy-10*scale);x.lineTo(cx+10*scale,cy);x.moveTo(cx,cy-24*scale);x.lineTo(cx-11*scale,cy-32*scale);x.moveTo(cx,cy-24*scale);x.lineTo(cx+11*scale,cy-30*scale);x.stroke()}
  else if(pose==='bonk'){head(cx,cy-30*scale);x.beginPath();x.moveTo(cx,cy-23*scale);x.lineTo(cx,cy-6*scale);x.stroke();
    x.beginPath();x.moveTo(cx,cy-6*scale);x.lineTo(cx-9*scale,cy+4*scale);x.moveTo(cx,cy-6*scale);x.lineTo(cx+9*scale,cy+4*scale);x.moveTo(cx,cy-20*scale);x.lineTo(cx-12*scale,cy-26*scale);x.moveTo(cx,cy-20*scale);x.lineTo(cx+12*scale,cy-26*scale);x.stroke();
    x.font='bold '+(11*scale)+'px sans-serif';x.fillText('*',cx-14*scale,cy-42*scale);x.fillText('*',cx+9*scale,cy-46*scale)}
  else{const t=Date.now()/130,sw=Math.sin(t)*8*scale;head(cx,cy-32*scale);
    x.beginPath();x.moveTo(cx,cy-25*scale);x.lineTo(cx,cy-8*scale);x.stroke();
    x.beginPath();x.moveTo(cx,cy-8*scale);x.lineTo(cx-8*scale+sw,cy+5*scale);x.moveTo(cx,cy-8*scale);x.lineTo(cx+8*scale-sw,cy+5*scale);
    x.moveTo(cx,cy-22*scale);x.lineTo(cx-9*scale-sw,cy-14*scale);x.moveTo(cx,cy-22*scale);x.lineTo(cx+9*scale+sw,cy-14*scale);x.stroke()}}
export default function StickmanGames({kind,onComplete,sound}){
  const canvas=useRef(),state=useRef(kind==='stick-karate'?newKarate():newStickDash()),raf=useRef(),last=useRef(0),active=useRef(false),done=useRef(false),callbacks=useRef();callbacks.current={onComplete,sound};
  const[mode,M]=useState('ready'),[hud,H]=useState(state.current);
  function draw(s){const x=canvas.current?.getContext('2d');if(!x)return;const w=640,h=360,ground=h-46;
    const bg=x.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#1b2a24');bg.addColorStop(1,'#0c1512');x.fillStyle=bg;x.fillRect(0,0,w,h);
    x.strokeStyle='#7fae8c';x.lineWidth=3;x.beginPath();x.moveTo(0,ground);x.lineTo(w,ground);x.stroke();
    if(kind==='stick-dash'){const px=70,py=ground-s.y*120;
      for(const o of s.obstacles){const ox=o.x*56+40;if(o.kind==='spike'){x.fillStyle='#e8b04a';x.beginPath();x.moveTo(ox,ground);x.lineTo(ox+11,ground-26);x.lineTo(ox+22,ground);x.fill()}
        else{x.strokeStyle='#d98a8a';x.lineWidth=3;x.beginPath();x.arc(ox+10,ground-72,9,0,7);x.stroke();x.beginPath();x.moveTo(ox+2,ground-72);x.lineTo(ox-8,ground-78);x.moveTo(ox+18,ground-72);x.lineTo(ox+28,ground-78);x.stroke()}}
      stickman(x,px,py,1,s.over?'bonk':s.slide>0?'slide':s.y>0?'jump':'run')}
    else{stickman(x,w/2,ground,1.2,state.current.bonk&&!state.current.boards.length?'bonk':'run');
      for(const b of s.boards){const bx=b.side==='left'?w/2-b.pos*(w/2-40):w/2+b.pos*(w/2-40);const by=ground-56;
        x.save();x.translate(bx,by);x.rotate(b.pos*2*(b.side==='left'?1:-1));x.fillStyle='#c9a06a';x.fillRect(-22,-7,44,14);x.strokeStyle='#7a5a34';x.strokeRect(-22,-7,44,14);x.restore()}
      if(s.swing){const sx=s.swing==='left'?w/2-46:w/2+46;x.strokeStyle='#ffd085';x.lineWidth=5;x.beginPath();x.moveTo(w/2,ground-34);x.lineTo(sx,ground-44);x.stroke()}}}
  useEffect(()=>{function loop(ts){const dt=Math.min(.05,(ts-last.current)/1000||1/60);last.current=ts;
      if(active.current){state.current=kind==='stick-karate'?karateStep(state.current,dt):stickDashStep(state.current,inputRef.current,dt);inputRef.current={};
        if(kind==='stick-karate'&&state.current.swing)setTimeout(()=>{if(state.current)state.current={...state.current,swing:'',bonk:''}},180);
        if(state.current.over&&active.current){active.current=false;done.current=true;M('over');callbacks.current.sound?.('over');
          callbacks.current.onComplete(kind==='stick-karate'?'stick-karate':'stick-dash',state.current.score,false)}}
      draw(state.current);if(state.current&&(Math.floor(ts/150)!==Math.floor(hudAt.current/150))){hudAt.current=ts;H({...state.current})}
      raf.current=requestAnimationFrame(loop)}
    const inputRef={current:{}};inputKeys.current=inputRef;
    raf.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf.current)},[kind]);
  const inputKeys=useRef({current:{}});const hudAt=useRef(0);
  useEffect(()=>{function keys(e){if(!active.current)return;
      if(kind==='stick-dash'){if(e.key===' '||e.key==='ArrowUp'){inputKeys.current.current.jump=true;e.preventDefault()}if(e.key==='ArrowDown'){inputKeys.current.current.slide=true;e.preventDefault()}}
      else{if(e.key==='ArrowLeft'){state.current=karatePunch(state.current,'left');callbacks.current.sound?.('move')}if(e.key==='ArrowRight'){state.current=karatePunch(state.current,'right');callbacks.current.sound?.('move')}}}
    window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys)},[kind]);
  function start(){state.current=kind==='stick-karate'?newKarate():newStickDash();done.current=false;active.current=true;M('playing');callbacks.current.sound?.('start');H({...state.current})}
  const dash=kind==='stick-dash';
  return <div className="stickman-game">
    <canvas ref={canvas} width="640" height="360" role="img" aria-label={dash?'Stickman Dash game field':'Stickman Karate game field'}/>
    <div className="game-toolbar" role="status">{dash?<>Distance score: {hud.score||0}{state.current.over?' · '+state.current.hit:''}</>:<>Boards broken: {hud.score||0} · Lives: {'♥'.repeat(Math.max(0,hud.lives??3))}{state.current.over?' · Match over':''}</>}</div>
    {mode!=='playing'?<button className="primary" onClick={start}>{mode==='over'?'Play again':'Start game'}</button>
      :dash?<div className="stickman-controls"><button onPointerDown={()=>{inputKeys.current.current.jump=true}}>Jump</button><button onPointerDown={()=>{inputKeys.current.current.slide=true}}>Slide</button></div>
      :<div className="stickman-controls"><button onClick={()=>{state.current=karatePunch(state.current,'left')}}>Punch left</button><button onClick={()=>{state.current=karatePunch(state.current,'right')}}>Punch right</button></div>}
    <p className="game-rules">{dash?'One stickman, two moves. Space or Jump to clear spikes, ArrowDown or Slide to duck birds. Speed keeps rising.':'Boards fly in from both sides. Punch the matching side when a board reaches the stickman. Three clean misses end the match. Arrow keys work too.'}</p>
  </div>}
