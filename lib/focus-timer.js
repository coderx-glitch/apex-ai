export const FOCUS_PHASES={work:{label:'Focus',minutes:25},short:{label:'Short break',minutes:5},long:{label:'Long break',minutes:15}};
export function nextPhase(phase,doneWork){
 if(phase==='work')return(doneWork+1)%4===0?'long':'short';
 return'work';
}
export function phaseSeconds(phase){const p=FOCUS_PHASES[phase];if(!p)throw Error('Unknown focus phase.');return p.minutes*60}
export function clockText(totalSeconds){const s=Math.max(0,Math.round(totalSeconds));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
export function loadTodayCount(storage,day){
 try{const raw=(storage||localStorage).getItem('apex-focus-today');if(!raw)return 0;
  const parsed=JSON.parse(raw);if(!parsed||parsed.day!==day||!Number.isInteger(parsed.count)||parsed.count<0)return 0;
  return parsed.count;
 }catch{return 0}
}
export function bumpTodayCount(storage,day){
 const next=loadTodayCount(storage,day)+1;
 try{(storage||localStorage).setItem('apex-focus-today',JSON.stringify({day,count:next}))}catch{}
 return next;
}
