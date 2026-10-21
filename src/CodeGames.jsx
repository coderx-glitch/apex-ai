import React,{useEffect,useRef,useState}from'react';
import{BOT_LEVELS,runProgram,CODE_QUIZ,quizCheck,BUG_HUNT,bugCheck,CODE_FILL,fillCheck,TRACE_VAR,traceCheck,ARRANGE_LINES,arrangeCheck}from'../lib/code-games.js';
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
function BugHunt({onComplete,sound}){
  const[i,I]=useState(0),[picked,PK]=useState(null),[score,SC]=useState(0),[done,D]=useState(false),[tries,T]=useState(0);
  const q=BUG_HUNT[i];
  function pick(li){if(picked!==null)return;const ok=bugCheck(q,li);sound?.(ok?'score':'hit');
    if(ok){PK(li);const gained=Math.max(0,2-tries);const final=score+(gained>0?1:0);SC(final);
      if(i+1===BUG_HUNT.length){D(true);onComplete('bug-hunt',final*50,final>=6)}}
    else{T(tries+1);PK(li);setTimeout(()=>{PK(null)},700)}}
  function next(){I(i+1);PK(null);T(0)}
  return <div className="code-quiz">
    {!done?<><div className="bot-maze-top"><strong>Bug {i+1} of {BUG_HUNT.length}</strong><span>Score: {score}</span></div>
      <p className="bug-goal" role="status">{q.goal}</p>
      <div className="quiz-code bug-lines" role="group" aria-label="Code lines - tap the buggy one">
        {q.lines.map((ln,li)=><button key={li} className={'bug-line'+(picked!==null?(li===q.answer?' quiz-right':picked===li?' quiz-wrong':''):'')} onClick={()=>pick(li)}><code>{ln}</code></button>)}
      </div>
      {picked===q.answer&&<p role="status">Found it. Line {q.answer+1}: {q.why}</p>}
      {picked===q.answer&&<button className="primary" onClick={next}>{i+1===BUG_HUNT.length?'See results':'Next bug'}</button>}
      {picked!==null&&picked!==q.answer&&<p role="status">Not that line - look again. Two free taps per bug.</p>}</>:
      <div className="quiz-results"><h3>You found {score} of {BUG_HUNT.length} bugs.</h3>
      <p>{score>=6?'Sharp eyes. These were the classic beginner bugs: off-by-one loops, assignment in conditions, text math, wrong indexes and missing returns.':score>=4?'Good round. Replay and read each explanation - every bug is a rule you will meet again.':'Tough round. Replay and read the explanations; they name the exact rule each bug breaks.'}</p>
      <button className="primary" onClick={()=>{I(0);PK(null);SC(0);D(false);T(0)}}>Play again</button></div>}
    <p className="game-rules">Each snippet is hand-written and does one thing wrong. Tap the line that causes it. First or second tap scores; later taps still show the answer.</p>
  </div>}
function CodeFill({onComplete,sound}){
  const[i,I]=useState(0),[picked,PK]=useState(null),[score,SC]=useState(0),[done,D]=useState(false);
  const q=CODE_FILL[i];
  function pick(c){if(picked!==null)return;PK(c);const ok=fillCheck(q,c);if(ok)SC(s=>s+1);sound?.(ok?'score':'hit');
    if(i+1===CODE_FILL.length){D(true);const final=score+(ok?1:0);onComplete('code-fill',final*50,final>=6)}}
  return <div className="code-quiz">
    {!done?<><div className="bot-maze-top"><strong>Snippet {i+1} of {CODE_FILL.length}</strong><span>Score: {score}</span></div>
      <pre className="quiz-code"><code>{q.code}</code></pre>
      <p className="bug-goal">It should run so it {q.prints}. What fills the blank?</p>
      <div className="quiz-choices">{q.choices.map((c,ci)=><button key={ci} disabled={picked!==null} aria-pressed={picked===ci} className={picked!==null?(ci===q.answer?'quiz-right':picked===ci?'quiz-wrong':''):''} onClick={()=>pick(ci)}>{c}</button>)}</div>
      {picked!==null&&<p role="status">{picked===q.answer?'Correct. ':'Not quite. '}The blank needs "{q.choices[q.answer]}". {q.why}</p>}
      {picked!==null&&<button className="primary" onClick={()=>{I(i+1);PK(null)}}>{i+1===CODE_FILL.length?'See results':'Next snippet'}</button>}</>:
      <div className="quiz-results"><h3>You completed {score} of {CODE_FILL.length} snippets.</h3>
      <p>{score>=6?'Solid. You read the goal and reasoned backwards to the missing piece - that is real debugging skill.':score>=4?'Good start. Replay and read each reason - they cover strings, loops, indexes, operators and comparisons.':'Tricky round. Replay slowly and say out loud what each line must do before picking.'}</p>
      <button className="primary" onClick={()=>{I(0);PK(null);SC(0);D(false)}}>Play again</button></div>}
    <p className="game-rules">One blank per snippet, four candidates. Pick the piece that makes the code print the shown result. Every answer explains itself.</p>
  </div>}
function TraceVar({onComplete,sound}){
  const[i,I]=useState(0),[picked,PK]=useState(null),[score,SC]=useState(0),[done,D]=useState(false);
  const q=TRACE_VAR[i];
  function pick(c){if(picked!==null)return;PK(c);const ok=traceCheck(q,c);if(ok)SC(s=>s+1);sound?.(ok?'score':'hit');
    if(i+1===TRACE_VAR.length){D(true);const final=score+(ok?1:0);onComplete('trace-var',final*50,final>=6)}}
  return <div className="code-quiz">
    {!done?<><div className="bot-maze-top"><strong>Snippet {i+1} of {TRACE_VAR.length}</strong><span>Score: {score}</span></div>
      <pre className="quiz-code"><code>{q.code}</code></pre>
      <p className="bug-goal">After this runs, what is <strong>{q.ask}</strong>?</p>
      <div className="quiz-choices">{q.choices.map((c,ci)=><button key={ci} disabled={picked!==null} aria-pressed={picked===ci} className={picked===null?'':(ci===q.answer?'quiz-right':picked===ci?'quiz-wrong':'')} onClick={()=>pick(ci)}>{c}</button>)}</div>
      {picked!==null&&<p role="status">{picked===q.answer?'Correct. ':'Not quite. '}{q.why}</p>}
      {picked!==null&&<button className="primary" onClick={()=>{I(i+1);PK(null)}}>{i+1===TRACE_VAR.length?'See results':'Next snippet'}</button>}</>:
      <div className="quiz-results"><h3>You traced {score} of {TRACE_VAR.length} variables.</h3>
      <p>{score>=6?'Sharp eyes. You stepped through each line instead of guessing - that is exactly how debugging works.':score>=4?'Good start. Replay and write the value on paper after every line - tracing by hand builds the habit.':'Tricky round. Go slow: say the new value out loud after each line, then answer.'}</p>
      <button className="primary" onClick={()=>{I(0);PK(null);SC(0);D(false)}}>Play again</button></div>}
    <p className="game-rules">Read the code line by line, keep the variable in your head, then call its final value. Every answer walks through the steps.</p>
  </div>}
function ArrangeLines({onComplete,sound}){
  const shuffled=p=>{const idx=p.lines.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]]}return idx};
  const[i,I]=useState(0),[pool,PL]=useState(()=>shuffled(ARRANGE_LINES[0])),[built,BL]=useState([]),[checked,CK]=useState(false),[solved,SV]=useState(0),[done,D]=useState(false);
  const pz=ARRANGE_LINES[i];
  function addLine(li){if(checked&&arrangeCheck(pz,built))return;BL(b=>[...b,li]);PL(pl=>pl.filter(x=>x!==li));CK(false)}
  function undo(){const last=built[built.length-1];if(last===undefined)return;BL(b=>b.slice(0,-1));PL(pl=>[...pl,last]);CK(false)}
  function next(){if(i+1===ARRANGE_LINES.length){D(true);onComplete('arrange-lines',(solved+1)*60,solved+1>=4)}else{I(i+1);PL(shuffled(ARRANGE_LINES[i+1]));BL([]);CK(false)}}
  const right=arrangeCheck(pz,built);
  return <div className="code-quiz">
    {!done?<><div className="bot-maze-top"><strong>Program {i+1} of {ARRANGE_LINES.length}</strong><span>Fixed: {solved}</span></div>
      <p className="bug-goal">This program {pz.goal} - but the lines got shuffled. Tap them in an order that runs.</p>
      <pre className="quiz-code"><code>{built.map(li=>pz.lines[li]).join('\n')||'// tap lines below to build the program'}</code></pre>
      <div className="bot-palette">{pool.map(li=><button key={li} onClick={()=>addLine(li)}>{pz.lines[li]}</button>)}</div>
      <div className="game-buttons"><button onClick={undo} disabled={!built.length}>Undo line</button><button onClick={()=>{BL([]);PL(shuffled(pz));CK(false)}}>Reshuffle</button><button className="primary" disabled={built.length!==pz.lines.length} onClick={()=>{CK(true);if(right){SV(x=>x+1);sound?.('score')}else sound?.('hit')}}>Check order</button></div>
      {checked&&!right&&built.length===pz.lines.length&&<p role="status">Not the right order yet - it would not {pz.goal} like this. Undo a line and rethink what must come first.</p>}
      {right&&<p role="status">It runs. The order is exactly what the goal needed.</p>}
      {right&&<button className="primary" onClick={next}>{i+1===ARRANGE_LINES.length?'See results':'Next program'}</button>}</>:
      <div className="quiz-results"><h3>You rebuilt {solved} of {ARRANGE_LINES.length} programs.</h3>
      <p>{solved>=4?'Solid. Ordering lines means understanding what depends on what - real program thinking.':'Keep practicing: ask which line every other line relies on, and put that one first.'}</p>
      <button className="primary" onClick={()=>{I(0);PL(shuffled(ARRANGE_LINES[0]));BL([]);CK(false);SV(0);D(false)}}>Play again</button></div>}
    <p className="game-rules">Tap lines from the pool to build the program top to bottom. Check runs the order against the goal; wrong orders explain themselves, nothing is hidden.</p>
  </div>}
export default function CodeGames({kind,onComplete,sound}){return kind==='code-quiz'?<CodeQuiz onComplete={onComplete} sound={sound}/>:kind==='bug-hunt'?<BugHunt onComplete={onComplete} sound={sound}/>:kind==='code-fill'?<CodeFill onComplete={onComplete} sound={sound}/>:kind==='trace-var'?<TraceVar onComplete={onComplete} sound={sound}/>:kind==='arrange-lines'?<ArrangeLines onComplete={onComplete} sound={sound}/>:<BotMaze onComplete={onComplete} sound={sound}/>}
