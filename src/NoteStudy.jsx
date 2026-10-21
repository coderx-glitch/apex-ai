import React,{useState}from'react';
import{parseStudyCards,practiceSummary,studyMarkdown}from'../lib/note-study.js';
import{buildQuiz,gradeQuiz,loadReview,saveReview,scheduleReview,dueCardIds,nextDueLabel}from'../lib/study-tools.js';
import FocusTimer from'./FocusTimer.jsx';
export default function NoteStudy({note,onExport,onClose}){
 const[text,T]=useState(note.content||''),[cards,C]=useState([]),[index,I]=useState(0),[revealed,R]=useState(false),[ratings,S]=useState({}),[error,E]=useState('');
 const[mode,M]=useState('cards'),[quiz,Q]=useState(null),[picks,PK]=useState({}),[checked,CK]=useState(false),[store,ST]=useState({}),[dueOnly,DUE]=useState(false);
 const card=cards[index],summary=practiceSummary(cards,ratings),dueIds=dueCardIds(cards,store,Date.now()),result=quiz?gradeQuiz(quiz,picks):null;
 function start(e,onlyDue){e?.preventDefault();E('');try{let next=parseStudyCards(text);const saved=loadReview(note.id);ST(saved);if(onlyDue){const ids=dueCardIds(next,saved,Date.now());next=next.filter(c=>ids.includes(c.id));if(!next.length)throw Error('No card is due right now. The next review is '+(nextDueLabel(saved)||'later')+'. Practice the full deck instead.')}C(next);I(0);R(false);S({});Q(null);PK({});CK(false);M('cards');DUE(!!onlyDue)}catch(err){E(err.message)}}
 function move(next){I(next);R(false)}
 function rate(cardId,rating){S({...ratings,[cardId]:rating});const next=scheduleReview(store,cardId,rating,Date.now());ST(next);saveReview(note.id,next)}
 function startQuiz(){E('');try{Q(buildQuiz(cards));PK({});CK(false);M('quiz')}catch(err){E(err.message)}}
 return <section className="note-study" aria-label="Local flashcard practice"><div className="study-heading"><h3>Practice your notes</h3><button onClick={onClose}>Close practice</button></div>
 <p>No AI or network request. Answers come from your text, not fact-checking. Your note is unchanged. Flashcard ratings set the next review time for this note on this device only: needs practice → 10 minutes, got it → a growing gap (1, 3, 7, then 30 days).</p>
 <details className="focus-box"><summary>Focus timer for this study session</summary><FocusTimer/></details>
 {!cards.length?<form onSubmit={start}><label>Review flashcard lines<textarea aria-label="Flashcard lines" maxLength={100000} rows={8} value={text} onChange={e=>T(e.target.value)} placeholder={'What powers a solar panel? :: Sunlight\nWhat is an orbit? :: A path around another object'}/></label><p>One Question :: Answer per line, up to 40 cards. Edit this copy before starting. Remove headings and other lines. A second :: stays in the answer.</p><button className="primary">Start reviewed practice</button></form>:
 <>{dueIds.length>0&&<p role="status">{dueIds.length} of {cards.length} cards are due for review now.<button className="subtle" onClick={e=>start(e,true)}>Practice due cards only</button></p>}
 <div className="note-tabs" role="tablist" aria-label="Practice mode"><button role="tab" aria-selected={mode==='cards'} className={mode==='cards'?'chosen':''} onClick={()=>M('cards')}>Flashcards</button><button role="tab" aria-selected={mode==='quiz'} className={mode==='quiz'?'chosen':''} onClick={startQuiz}>Quiz me</button></div>
 {mode==='cards'?<>
 <div className="study-progress" role="status">Card {index+1} of {cards.length} · {summary.got} got it · {summary.missed} need practice · {summary.unrated} unrated</div>
 <div className="study-face"><small>QUESTION</small><h4>{card.question}</h4>{revealed?<div className="study-answer"><small>YOUR ANSWER</small><p>{card.answer}</p></div>:<p className="study-hidden">Think of your answer before revealing.</p>}</div>
 <div className="study-controls"><button onClick={()=>R(!revealed)}>{revealed?'Hide answer':'Reveal answer'}</button><button disabled={!revealed} aria-pressed={ratings[card.id]==='again'} onClick={()=>rate(card.id,'again')}>Needs practice</button><button disabled={!revealed} aria-pressed={ratings[card.id]==='got'} onClick={()=>rate(card.id,'got')}>Got it</button></div>
 <p>Self-ratings only. APEX does not grade your answer. Retry keeps only missed cards in the current deck; Edit deck copy returns to all reviewed lines.</p>
 <div className="study-controls"><button disabled={index===0} onClick={()=>move(index-1)}>Previous card</button><button disabled={index===cards.length-1} onClick={()=>move(index+1)}>Next card</button><button disabled={!summary.missed} onClick={()=>{C(cards.filter(c=>ratings[c.id]==='again'));S({});move(0)}}>Retry missed cards</button></div>
 {summary.unrated===0&&<p role="status">All cards rated. Review your answers or retry the cards you marked for practice.</p>}
 </>:<>
 <p>Multiple-choice questions are built on this device from your Q::A lines. The three wrong options are answers from your other cards, so a quiz needs at least 4 cards with different answers. No AI generation, no fact-checking.</p>
 {quiz&&<>{quiz.map((q,qi)=><fieldset key={q.id} className="quiz-question"><legend>{qi+1}. {q.question}</legend>{q.options.map(opt=><label key={opt} className={'quiz-option'+(checked?opt===q.answer?' quiz-correct':picks[q.id]===opt?' quiz-wrong':'':'')}><input type="radio" name={q.id} disabled={checked} checked={picks[q.id]===opt} onChange={()=>PK({...picks,[q.id]:opt})}/> {opt}</label>)}</fieldset>)}
 <div className="study-controls">{!checked?<button className="primary" disabled={result.answered<quiz.length} onClick={()=>CK(true)}>Check answers ({result.answered}/{quiz.length} answered)</button>:<><p role="status" className="quiz-score">You scored {result.correct} of {result.total}. Wrong options were your own other answers - no outside knowledge was used.</p><button onClick={startQuiz}>New shuffle</button><button onClick={()=>M('cards')}>Back to flashcards</button></>}</div></>}
 </>}
 <div className="study-controls"><button onClick={()=>onExport('apex-flashcards.md',studyMarkdown(note.title||'Study notes',cards))}>Download current deck</button><button onClick={()=>{C([]);S({});R(false);Q(null);CK(false)}}>Edit deck copy</button></div>
 </>}{error&&<p role="alert" className="error">{error}</p>}</section>;
}
