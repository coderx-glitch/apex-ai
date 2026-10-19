import React,{useEffect,useRef,useState}from'react';
import{BOT_LEVELS,runProgram,CODE_QUIZ,quizCheck}from'../lib/code-games.js';
const CMD_LABEL={forward:'forward','left':'turn left','right':'turn right'};
function BotMaze({onComplete,sound}){
  const[level,LV]=useState(0),[program,P]=useState([]),[openLoop,OL]=useState(null),[run,R]=useState(null),[step,ST]=useState(0),[won,W]=useState(0),[msg,MS]=useState('Build a program, then Run it.');
  const timer=useRef(),lv=BOT_LEVELS[Math.min(level,BOT_LEVELS.length-1)];
  useEffect(()=>()=>clearInterval(timer.current),[]);
  function add(cmd){if(run)return;if(openLoop){if(openLoop.body.length>=8)return;OL({...openLoop,body:[...openLoop.body,cmd]})}else{if(program.length>=16)return;P([...program,cmd])}MS('')}
  function startLoop(n){if(run||openLoop||program.length>=16)return;OL({repeat:n,body:[]});MS('Loop opened: next commands go inside it. Close the loop to continue.')}
  function closeLoop(){if(!openLoop)return;if(!openLoop.body.length){OL(null);MS('Empty loop removed.')}else{P([...program,openLoop]);OL(null)}MS('')}
  function undo(){if(run)return;if(openLoop){OL({...openLoop,body:openLoop.body.slice(0,-1)})}else{const last=program.at(-1);if(last&&typeof last==='object'&&last.repeat){OL(last);P(program.slice(0,-1))}else P(program.slice(0,-1))}}
  function clearAll(){if(run)return;P([]);OL(null);R(null);ST(0);MS('Program cleared.')}
  function runIt(){if(run)return;let full=program;if(openLoop){if(!openLoop.body.length){MS('Close or fill the open loop first.');return}full=[...program,openLoop]}
    const r=runProgram(lv.grid,full);if(r.error){MS(r.error);return}
    R(r);ST(0);sound?.('start');
    timer.current=setInterval(()=>{ST(i=>{const next=i+1;if(next>=r.trace.length){clearInterval(timer.current);
        if(r.won){const points=(level+1)*100;const total=won+points;W(total);onComplete('bot-maze',total,true);MS('Goal reached. The bot ran your program exactly as written.');sound?.('score')}
        else if(r.crashed){MS('The bot hit a wall. Real programs crash too - change the commands and run again.');sound?.('hit')}
        else MS('The program ended before the goal. Add or reorder commands and run again.')}
      return Math.min(next,r.trace.length-1)})},280)}
  const cur=run?run.trace[step]:null;
  function cell(x,y){if(cur&&cur.x===x&&cur.y===y)return cur.crash?'💥':cur.dir;return lv.grid[y]?.[x]==='#'?'⬛':lv.grid[y]?.[x]==='X'?(cur&&run?.won&&step>=run.trace.length-1?'🏆':'🚩'):''}
  const gridW=lv.grid[0].length;
  return <div className="bot-maze">
    <div className="bot-maze-top"><strong>Level {level+1} of {BOT_LEVELS.length}: {lv.name}</strong><span>Tip: {lv.hint}</span></div>
    <div className="bot-grid" role="img" aria-label="Bot maze grid" style={{gridTemplateColumns:'repeat('+gridW+',2rem)'}}>
      {lv.grid.map((row,y)=>[...row].map((ch,x)=><span key={x+'-'+y} className={'bot-cell'+(ch==='#'?' wall':'')+(ch==='X'?' goal':'')}>{cell(x,y)}</span>))}
    </div>
    <div className="bot-program" aria-label="Your program"><strong>Program:</strong>{program.length||openLoop?null:' (empty)'}
      <ol>{program.map((c,i)=><li key={i}>{typeof c==='object'&&c.repeat?<>loop ×{c.repeat}: {c.body.map(b=>CMD_LABEL[b]).join(', ')}</>:CMD_LABEL[c]}</li>)}
        {openLoop&&<li className="bot-open-loop">loop ×{openLoop.repeat}: {openLoop.body.map(b=>CMD_LABEL[b]).join(', ')||'…'} (open)</li>}</ol></div>
    <div className="bot-palette">
      <button disabled={!!run} onClick={()=>add('forward')}>forward</button>
      <button disabled={!!run} onClick={()=>add('left')}>turn left</button>
      <button disabled={!!run} onClick={()=>add('right')}>turn right</button>
      {[2,3,4,7].map(n=><button key={n} disabled={!!run||!!openLoop} onClick={()=>startLoop(n)}>loop ×{n}</button>)}
      {openLoop&&<button disabled={!!run} onClick={closeLoop}>close loop</button>}
      <button disabled={!!run} onClick={undo}>Undo</button>
      <button disabled={!!run} onClick={clearAll}>Clear</button>
      <button className="primary" disabled={!!run||(!program.length&&!openLoop)} onClick={runIt}>Run program</button>
    </div>
    <p role="status">{msg}</p>
    <div className="bot-level-nav">{level+1<BOT_LEVELS.length&&<button disabled={!!run} onClick={()=>{LV(level+1);P([]);OL(null);R(null);ST(0);MS('New level. Build a fresh program.')}}>Next level</button>}
      {level>0&&<button disabled={!!run} onClick={()=>{LV(level-1);P([]);OL(null);R(null);ST(0);MS('')}}>Previous level</button>}
      <span>Total score: {won}</span></div>
    <p className="game-rules">This is real programming: the bot follows your commands exactly, in order, even when they are wrong. Loops repeat a group of commands. Five hand-made levels.</p>
  </div>}
function CodeQuiz({onComplete,sound}){
  const[i,I]=useState(0),[picked,PK]=useState(null),[score,SC]=useState(0),[done,D]=useState(false);
  const q=CODE_QUIZ[i];
  function pick(c){if(picked!==null)return;PK(c);const ok=quizCheck(q,c);if(ok)SC(s=>s+1);sound?.(ok?'score':'hit');
    if(i+1===CODE_QUIZ.length){D(true);const final=score+(ok?1:0);onComplete('code-quiz',final*50,final>=6)}}
  return <div className="code-quiz">
    {!done?<><div className="bot-maze-top"><strong>Question {i+1} of {CODE_QUIZ.length}</strong><span>Score: {score}</span></div>
      <pre className="quiz-code"><code>{q.code}</code></pre>
      <div className="quiz-choices">{q.choices.map((c,ci)=><button key={ci} disabled={picked!==null} aria-pressed={picked===ci} className={picked!==null?(ci===q.answer?'quiz-right':picked===ci?'quiz-wrong':''):''} onClick={()=>pick(ci)}>{c}</button>)}</div>
      {picked!==null&&<p role="status">{picked===q.answer?'Correct. ':'Not quite. '}The answer is "{q.choices[q.answer]}". {q.why}</p>}
      {picked!==null&&<button className="primary" onClick={()=>{I(i+1);PK(null)}}>{i+1===CODE_QUIZ.length?'See results':'Next question'}</button>}</>:
      <div className="quiz-results"><h3>You read {score} of {CODE_QUIZ.length} snippets correctly.</h3>
      <p>{score>=6?'Strong code reading. The explanations covered variables, strings, loops, arrays, conditions and remainders.':score>=4?'Good start. Replay and read each explanation - they teach the exact rule used.':'Tricky round. Replay and read the explanations; every answer explains the rule behind it.'}</p>
      <button className="primary" onClick={()=>{I(0);PK(null);SC(0);D(false)}}>Play again</button></div>}
    <p className="game-rules">Short hand-written snippets in a JavaScript-like style. Pick what the code prints. Every answer comes with a plain-language explanation.</p>
  </div>}
export default function CodeGames({kind,onComplete,sound}){return kind==='code-quiz'?<CodeQuiz onComplete={onComplete} sound={sound}/>:<BotMaze onComplete={onComplete} sound={sound}/>}
