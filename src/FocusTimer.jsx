import React,{useState,useEffect,useRef}from'react';
import{FOCUS_PHASES,nextPhase,phaseSeconds,clockText,loadTodayCount,bumpTodayCount}from'../lib/focus-timer.js';
export default function FocusTimer(){
 const day=new Date().toISOString().slice(0,10);
 const[phase,P]=useState('work'),[left,L]=useState(phaseSeconds('work')),[running,R]=useState(false),[done,D]=useState(0),[today,T]=useState(()=>loadTodayCount(null,day)),[sound,S]=useState(true);
 const audio=useRef(null);
 useEffect(()=>{if(!running)return;const id=setInterval(()=>L(v=>Math.max(0,v-1)),1000);return()=>clearInterval(id)},[running]);
 useEffect(()=>{if(left>0)return;chime();const wasWork=phase==='work',newDone=wasWork?done+1:done;if(wasWork){D(newDone);T(bumpTodayCount(null,day))}const next=nextPhase(phase,done);P(next);L(phaseSeconds(next));R(false)},[left]);
 useEffect(()=>()=>{audio.current?.close?.()},[]);
 function chime(){if(!sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio.current=audio.current||new AC();const ctx=audio.current;ctx.resume?.();[880,660].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.05,ctx.currentTime+i*.25);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.25+.4);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.25);o.stop(ctx.currentTime+i*.25+.4)})}catch{}}
 function pick(p){R(false);P(p);L(phaseSeconds(p))}
 return <section className="focus-timer" aria-label="Focus timer">
  <div className="focus-head"><strong>Focus timer</strong><span role="status">{today} focus {today===1?'session':'sessions'} finished today on this device</span></div>
  <div className="focus-face"><small>{FOCUS_PHASES[phase].label.toUpperCase()}</small><b>{clockText(left)}</b></div>
  <div className="study-controls">
   <button className="primary" onClick={()=>R(!running)}>{running?'Pause':left===phaseSeconds(phase)?'Start':'Resume'}</button>
   <button disabled={phase==='work'&&left===phaseSeconds('work')&&!running} onClick={()=>{R(false);L(phaseSeconds(phase))}}>Restart this {phase==='work'?'focus':'break'}</button>
   <button onClick={()=>pick(phase==='work'?'short':'work')}>Skip to {phase==='work'?'a break':'focus'}</button>
   <label className="image-flip"><input type="checkbox" checked={sound} onChange={e=>S(e.target.checked)}/> End chime</label>
  </div>
  <p>25-minute focus, 5-minute break, and a 15-minute break after every 4 focus sessions. The timer runs only while this panel is open; leaving the page stops it. Session counts are stored on this device. A finished phase waits for you to start the next one - nothing auto-starts.</p>
 </section>;
}
