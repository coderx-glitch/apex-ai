import React,{useState,useEffect,useRef}from'react';
import{newLudo,rollDice,legalMoves,applyMove,botPick,tokenCell,TRACK_COORDS,HOME_COORDS,BASE_COORDS,COLORS}from'../lib/ludo.js';
const FILL={red:'#e05555',green:'#4caf7d',yellow:'#e0b545',blue:'#5b8def'};
const SAFE_CELLS=new Set([0,8,13,21,26,34,39,47]);
export default function LudoGame({onComplete,sound}){
  const[bots,SB]=useState(3),[st,S]=useState(null),[dice,D]=useState(null),[moves,SM]=useState([]),[busy,BUSY]=useState(false),[done,DN]=useState(false);
  const timer=useRef();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function start(n){clearTimeout(timer.current);S(newLudo(n));D(null);SM([]);DN(false);BUSY(false)}
  // bots move through an effect so every path - moves, passes, extra rolls - drives the turn order the same way
  useEffect(()=>{
    if(st&&(st.turn==='red'||st.winner))BUSY(false);
    if(!st||st.winner||st.turn==='red'||done)return;
    BUSY(true);
    timer.current=setTimeout(()=>botTurn(st),800);
    return()=>clearTimeout(timer.current);
  },[st]);
  function roll(){
    if(!st||st.turn!=='red'||dice!==null||st.winner)return;
    const d=rollDice();D(d);sound?.('move');
    const mv=legalMoves(st,'red',d);SM(mv);
    if(!mv.length){
      const s=JSON.parse(JSON.stringify(st));
      s.log.push('You rolled '+d+' - no legal move.');
      const i=s.players.indexOf('red');s.turn=s.players[(i+1)%s.players.length];
      timer.current=setTimeout(()=>{S(s);D(null);SM([])},1200);
    }
  }
  function playToken(idx){
    if(busy||st.turn!=='red'||!moves.includes(idx))return;
    const s=JSON.parse(JSON.stringify(st));
    const ev=applyMove(s,'red',idx,dice);sound?.(ev.some(e=>e.includes('captures'))?'score':'move');
    D(null);SM([]);
    if(s.winner){S(s);endGame(s)}else S(s);
  }
  function botTurn(s){
    if(s.winner){endGame(s);return}
    const c=s.turn;
    const d=rollDice();
    const mv=legalMoves(s,c,d);
    const pick=mv.length?botPick(s,c,d):-1;
    const ns=JSON.parse(JSON.stringify(s));
    ns.dice=d;
    if(pick>=0){applyMove(ns,c,pick,d);sound?.('move')}
    else ns.log.push(c+' rolled '+d+' - no legal move.');
    D(null);
    if(ns.winner){S(ns);endGame(ns);return}
    S(ns);
  }
  function endGame(s){
    DN(true);BUSY(false);
    const win=s.winner==='red';
    onComplete('ludo',win?100:20,win);sound?.(win?'score':'over');
  }
  if(!st)return <section className="board-game ludo-game"><h4>Ludo</h4><p>The classic race: roll a six to enter, capture rivals, bring all four tokens home. You are Red.</p><div className="game-buttons">{[1,2,3].map(n=><button key={n} className="primary" onClick={()=>start(n)}>Play vs {n} bot{n>1?'s':''}</button>)}</div><p className="game-help">Local bots only - no online players. Dice are random on this device; nothing is uploaded.</p></section>;
  // build cell map
  const cellOf={};
  st.players.forEach(c=>{st.tokens[c].forEach((steps,i)=>{
    let coord=null;
    if(steps<0)coord=BASE_COORDS[c][i];
    else if(steps>55)coord=null; // finished: shown in center
    else if(steps>50)coord=HOME_COORDS[c][steps-51];
    else coord=TRACK_COORDS[tokenCell(c,steps)];
    if(coord){const k=coord[0]+','+coord[1];(cellOf[k]=cellOf[k]||[]).push({c,i})}
  })});
  const cells=[];
  for(let r=0;r<15;r++)for(let cc=0;cc<15;cc++){
    const k=r+','+cc;const toks=cellOf[k]||[];
    let cls='ludo-cell blank';
    const trackIdx=TRACK_COORDS.findIndex(([tr,tc])=>tr===r&&tc===cc);
    if(trackIdx>=0){cls='ludo-cell track'+(SAFE_CELLS.has(trackIdx)?' safe':'')}
    for(const col of COLORS){if(HOME_COORDS[col].some(([hr,hc])=>hr===r&&hc===cc))cls='ludo-cell home-'+col}
    if(r>=1&&r<=4&&cc>=1&&cc<=4)cls='ludo-cell yard red';if(r>=1&&r<=4&&cc>=10&&cc<=13)cls='ludo-cell yard green';
    if(r>=10&&r<=13&&cc>=10&&cc<=13)cls='ludo-cell yard yellow';if(r>=10&&r<=13&&cc>=1&&cc<=4)cls='ludo-cell yard blue';
    if(r===7&&cc===7)cls='ludo-cell center-home';
    cells.push(<div key={k} className={cls}>{trackIdx>=0&&SAFE_CELLS.has(trackIdx)?'★':''}{toks.map((t,ti)=><button key={ti} className={'ludo-token '+t.c+(st.turn==='red'&&t.c==='red'&&moves.includes(t.i)?' movable':'')} disabled={!(st.turn==='red'&&t.c==='red'&&moves.includes(t.i))} onClick={()=>playToken(t.i)} aria-label={t.c+' token '+(t.i+1)}/>)}</div>);
  }
  const finished=st.players.map(c=>[c,st.tokens[c].filter(x=>x===56).length]);
  return <section className="board-game ludo-game">
    <div className="bot-maze-top"><strong>{st.winner?(st.winner==='red'?'You win!':st.winner+' wins.'):(st.turn==='red'?'Your turn (Red)':st.turn+' is playing…')}</strong><span>{finished.map(([c,n])=>c+' '+n+'/4').join(' · ')}</span></div>
    <div className="ludo-board" role="grid" aria-label="Ludo board">{cells}</div>
    <div className="game-buttons">
      <button className="primary" onClick={roll} disabled={st.turn!=='red'||dice!==null||busy||!!st.winner}>{dice!==null&&st.turn==='red'?'Rolled '+dice:'Roll dice'}</button>
      {st.turn==='red'&&dice!==null&&moves.length>0&&<span className="ludo-hint">Tap a glowing token to move {dice}.</span>}
      <button onClick={()=>{if(confirm('Start over? This game is not saved.'))start(st.players.length-1)}}>New game</button>
    </div>
    <p className="chess-history" aria-live="polite">{st.log.slice(-4).join(' ')}</p>
    <p className="game-help">Classic rules: a six enters a token; sixes, captures and reaching home earn another roll; exact roll needed to finish. Safe star cells cannot be captured. All local - dice and bots run on this device only.</p>
  </section>
}
