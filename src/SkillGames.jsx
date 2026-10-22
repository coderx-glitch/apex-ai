import React,{useEffect,useRef,useState}from'react';import GlideGame from'./GlideGame.jsx';
import{TYPING_PASSAGES,typingResult,rhythmGrade,makePath,pathRound,makeOddGrid}from'../lib/skill-games.js';
function TypingSprint({onComplete,sound}){
  const[pi,PI]=useState(()=>Math.floor(Math.random()*TYPING_PASSAGES.length));
  const[typed,TY]=useState(''),[start,ST]=useState(0),[now,NW]=useState(0),[done,D]=useState(null);
  const tick=useRef();
  const target=TYPING_PASSAGES[pi];
  useEffect(()=>()=>clearInterval(tick.current),[]);
  function change(v){if(done)return;const val=v.slice(0,target.length);
    if(!start&&val.length){ST(Date.now());NW(Date.now());tick.current=setInterval(()=>NW(Date.now()),500)}
    TY(val);
    if(val.length===target.length){clearInterval(tick.current);const elapsed=start?Date.now()-start:1;const r=typingResult(target,val,elapsed);D(r);sound?.(r.accuracy>=95?'score':'hit');onComplete('typing-sprint',r.wpm,r.wpm>=30&&r.accuracy>=95)}}
  function again(){clearInterval(tick.current);TY('');ST(0);NW(0);D(null);PI((pi+1)%TYPING_PASSAGES.length)}
  const elapsed=start&&!done?Math.max(0,now-start):0;
  return <div className="code-quiz typing-game">
    <div className="bot-maze-top"><strong>Type the passage exactly</strong><span>{done?'Done':start?Math.floor(elapsed/1000)+'s':'Timer starts on your first key'}</span></div>
    <p className="quiz-code typing-target">{target}</p>
    <textarea className="typing-box" rows={3} placeholder="Start typing here…" value={typed} disabled={!!done} onChange={e=>change(e.target.value)} aria-label="Type the passage here"/>
    {done&&<div className="quiz-results"><h3>{done.wpm} words per minute · {done.accuracy}% accurate</h3>
      <p>{done.accuracy<95?'Speed counts, but accuracy slipped under 95%. Slow down a touch and let your eyes lead your fingers.':done.wpm>=40?'Fast and clean. That is genuine touch-typing pace.':done.wpm>=30?'Solid everyday speed with clean accuracy. Keep practicing to push past 40.':'Accurate but unhurried. Repetition builds speed - run it again.'}</p>
      <p className="game-rules">Measured honestly: {done.correct} correct characters in {Math.round((now-start)/1000)||1}s. WPM = correct characters ÷ 5 ÷ minutes, the standard formula.</p>
      <button className="primary" onClick={again}>Next passage</button></div>}
    <p className="game-rules">Six hand-written passages, picked at random. Timing runs on this device only; nothing is uploaded. Win needs 30+ WPM at 95%+ accuracy.</p>
  </div>}
function RhythmPulse({onComplete,sound}){
  const BEATS=12,GAP=1000;
  const[t0,S0]=useState(0),[taps,TP]=useState([]),[done,D]=useState(false),[beat,B]=useState(0);
  const timer=useRef();
  useEffect(()=>()=>clearInterval(timer.current),[]);
  function start(){const t=performance.now();S0(t);TP([]);D(false);B(0);
    timer.current=setInterval(()=>B(b=>b+1),GAP);sound?.('start')}
  function tap(){if(!t0||done)return;const t=performance.now(),rel=t-t0,bi=Math.round(rel/GAP),off=rel-bi*GAP;
    const g=rhythmGrade(off);TP(a=>{const next=[...a,{off:Math.round(off),grade:g}];
      if(next.length===BEATS){clearInterval(timer.current);D(true);const total=next.reduce((s,x)=>s+x.grade.points,0);sound?.(total>=600?'score':'hit');onComplete('rhythm-pulse',total,total>=600)}
      return next});sound?.(g.points>=50?'score':'move')}
  const total=taps.reduce((s,x)=>s+x.grade.points,0),avg=taps.length?Math.round(taps.reduce((s,x)=>s+Math.abs(x.off),0)/taps.length):0;
  return <div className="code-quiz rhythm-game">
    <div className="bot-maze-top"><strong>Tap exactly on each flash</strong><span>{t0?taps.length+' / '+BEATS+' taps':'Not started'}</span></div>
    <div className="rhythm-stage"><div className={t0&&!done?'rhythm-ring beat':'rhythm-ring'} key={beat} aria-hidden="true"><span>{t0&&!done?(beat%BEATS)+1:'•'}</span></div></div>
    {!t0||done?<button className="primary rhythm-tap" onClick={start}>{t0?'Restart 12 beats':'Start the pulse'}</button>
      :<button className="primary rhythm-tap" onClick={tap}>Tap on the flash</button>}
    {taps.length>0&&!done&&<p role="status">Last tap: {taps[taps.length-1].grade.name} ({taps[taps.length-1].off>0?'+':''}{taps[taps.length-1].off} ms)</p>}
    {done&&<div className="quiz-results"><h3>{total} points · average {avg} ms off the beat</h3>
      <p>{total>=900?'Metronome-grade timing.':total>=600?'Steady hand. Under 180 ms average is solid musical timing.':total>=300?'You are chasing the flash - listen for the rhythm and tap with it, not after it.':'Watch the ring instead of reacting to it: the flash comes once per second, so feel the count.'}</p>
      <p className="game-rules">Scoring per tap: ±90 ms Perfect (100), ±180 ms Good (50), ±280 ms Close (20). Measured with this device clock, input delay included.</p></div>}
    <p className="game-rules">The ring flashes once per second, twelve beats. Tap the button (or keep rhythm in your head between flashes). No camera, no uploads.</p>
  </div>}
function PathMemory({onComplete,sound}){
  const[round,RD]=useState(0),[path,PT]=useState([]),[phase,PH]=useState('idle'),[lit,LI]=useState(-1),[pos,PO]=useState(0),[strikes,SK]=useState(0),[cells,CE]=useState(0),[over,OV]=useState(false);
  const timers=useRef([]);
  useEffect(()=>()=>{timers.current.forEach(clearTimeout)},[]);
  const{size,length}=pathRound(round);
  function begin(){timers.current.forEach(clearTimeout);timers.current=[];
    const p=makePath(length,size);PT(p);PO(0);LI(-1);PH('show');sound?.('start');
    p.forEach((cell,k)=>{timers.current.push(setTimeout(()=>LI(cell),500+k*550));timers.current.push(setTimeout(()=>LI(-1),500+k*550+420))});
    timers.current.push(setTimeout(()=>PH('input'),500+p.length*550))}
  function press(cell){if(phase!=='input'||over)return;
    if(cell===path[pos]){const np=pos+1;PO(np);CE(c=>c+1);sound?.('move');
      if(np===path.length){sound?.('score');
        if(round>=7){end(false,cells+1)}else{PH('idle');RD(round+1)}}}
    else{const sk=strikes+1;SK(sk);sound?.('hit');
      if(sk>=3)end(true,cells)}}
  function end(fail,finalCells){OV(true);PH('idle');timers.current.forEach(clearTimeout);
    onComplete('path-memory',finalCells*10,fail?round>=4:round>=7)}
  const roundsCleared=round;
  return <div className="code-quiz path-game">
    <div className="bot-maze-top"><strong>Round {round+1} · path of {length}</strong><span>Strikes: {strikes} / 3 · cells banked: {cells}</span></div>
    <div className="path-grid" style={{gridTemplateColumns:'repeat('+size+',56px)'}} role="group" aria-label="Memory grid">
      {Array.from({length:size*size},(_,c)=><button key={c} className={'path-cell'+(lit===c?' lit':'')+(phase==='input'&&path.slice(0,pos).includes(c)?' done':'')} onClick={()=>press(c)} aria-label={'Grid cell '+(c+1)}/>)}
    </div>
    {phase==='idle'&&!over&&<button className="primary" onClick={begin}>{cells||round?'Start round '+(round+1):'Watch the path'}</button>}
    {phase==='show'&&<p role="status">Watch the path light up…</p>}
    {phase==='input'&&<p role="status">Now redraw it: cell {pos+1} of {path.length}.</p>}
    {over&&<div className="quiz-results"><h3>{roundsCleared} rounds cleared · {cells} cells recalled</h3>
      <p>{roundsCleared>=6?'Exceptional spatial memory - long paths stayed put.':roundsCleared>=4?'Strong recall. Chunking the path into shapes is the trick.':'Paths grow one cell per round. Say the turns to yourself ("right, down, down") to anchor them.'}</p>
      <button className="primary" onClick={()=>{RD(0);PT([]);PO(0);SK(0);CE(0);OV(false);PH('idle')}}>Play again</button></div>}
    <p className="game-rules">The path glows cell by cell; then tap the cells in the same order. Three wrong cells end the run. Paths are random walks, never crossing themselves.</p>
  </div>}
function OddOneOut({onComplete,sound}){
  const[round,RD]=useState(0),[grid,GR]=useState(()=>makeOddGrid(0)),[strikes,SK]=useState(0),[over,OV]=useState(false),[left,LE]=useState(10);
  const timer=useRef(),roundRef=useRef(0);
  useEffect(()=>()=>clearInterval(timer.current),[]);
  useEffect(()=>{if(over)return;LE(10);clearInterval(timer.current);
    timer.current=setInterval(()=>LE(l=>{if(l<=1){clearInterval(timer.current);strike();return 10}return l-1}),1000);
    return()=>clearInterval(timer.current)},[round,over]);
  function strike(){const sk=strikes+1;SK(sk);sound?.('hit');if(sk>=3){OV(true);clearInterval(timer.current);onComplete('odd-one-out',round*100,round>=8)}}
  function press(c){if(over)return;
    if(c===grid.index){sound?.('score');const nr=round+1;RD(nr);GR(makeOddGrid(nr))}
    else strike()}
  return <div className="code-quiz odd-game">
    <div className="bot-maze-top"><strong>Round {round+1} · {grid.size}×{grid.size}</strong><span>Strikes: {strikes} / 3 · {left}s left</span></div>
    <div className="odd-grid" style={{gridTemplateColumns:'repeat('+grid.size+',56px)'}} role="group" aria-label="Color grid - find the different tile">
      {Array.from({length:grid.cells},(_,c)=><button key={c} className="odd-cell" style={{background:c===grid.index?grid.odd:grid.base}} onClick={()=>press(c)} aria-label={'Tile '+(c+1)}/>)}
    </div>
    {over&&<div className="quiz-results"><h3>{round} rounds cleared</h3>
      <p>{round>=8?'Excellent shade discrimination - the last grids were nearly identical.':round>=4?'Good eye. The shade gap shrinks every round, so trust your first instinct.':'Early rounds teach the trick: scan for the tile that feels lighter, not a different color.'}</p>
      <button className="primary" onClick={()=>{RD(0);GR(makeOddGrid(0));SK(0);OV(false)}}>Play again</button></div>}
    <p className="game-rules">One tile is a slightly lighter shade of the same hue. Ten seconds per round; a wrong tile or a timeout costs a strike. Shade gap shrinks as rounds climb.</p>
  </div>}
export default function SkillGames({kind,onComplete,sound}){return kind==='glide-gap'?<GlideGame onComplete={onComplete} sound={sound}/>:kind==='rhythm-pulse'?<RhythmPulse onComplete={onComplete} sound={sound}/>:kind==='path-memory'?<PathMemory onComplete={onComplete} sound={sound}/>:kind==='odd-one-out'?<OddOneOut onComplete={onComplete} sound={sound}/>:<TypingSprint onComplete={onComplete} sound={sound}/>}
