export const QUIZ_MIN_CARDS=4;
export const REVIEW_STEPS_MINUTES=[10,1440,4320,10080,43200];
export function shuffleCopy(items,rng){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function buildQuiz(cards,rng=Math.random){
 if(!Array.isArray(cards)||cards.length<QUIZ_MIN_CARDS)throw Error('A multiple-choice quiz needs at least '+QUIZ_MIN_CARDS+' cards. The wrong options are answers from your other cards.');
 const answers=new Set(cards.map(c=>c.answer));
 if(answers.size<QUIZ_MIN_CARDS)throw Error('A quiz needs at least '+QUIZ_MIN_CARDS+' different answers. Some cards repeat the same answer.');
 return cards.map(card=>{
  const others=shuffleCopy(cards.filter(c=>c.id!==card.id&&c.answer!==card.answer),rng);
  const wrong=[];for(const c of others){if(!wrong.includes(c.answer))wrong.push(c.answer);if(wrong.length===3)break}
  const options=shuffleCopy([card.answer,...wrong],rng);
  return{id:card.id,question:card.question,answer:card.answer,options};
 });
}
export function gradeQuiz(questions,picks){
 let correct=0,answered=0;
 for(const q of questions){const pick=picks[q.id];if(pick===undefined||pick===null||pick==='')continue;answered++;if(pick===q.answer)correct++}
 return{total:questions.length,correct,answered};
}
export function reviewKey(noteId){return'apex-review-'+String(noteId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)}
export function loadReview(noteId,storage){
 try{const raw=(storage||localStorage).getItem(reviewKey(noteId));if(!raw)return{};
  const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return{};
  const clean={};for(const[id,rec]of Object.entries(parsed)){if(rec&&Number.isInteger(rec.step)&&rec.step>=0&&rec.step<REVIEW_STEPS_MINUTES.length&&typeof rec.due==='string'&&!Number.isNaN(Date.parse(rec.due)))clean[id]={step:rec.step,due:rec.due}}
  return clean;
 }catch{return{}}
}
export function saveReview(noteId,store,storage){
 try{(storage||localStorage).setItem(reviewKey(noteId),JSON.stringify(store));return true}catch{return false}
}
export function scheduleReview(store,cardId,rating,now){
 const current=store&&store[cardId];
 const step=rating==='again'?0:current?Math.min(current.step+1,REVIEW_STEPS_MINUTES.length-1):1;
 return{...store,[cardId]:{step,due:new Date(now+REVIEW_STEPS_MINUTES[step]*60000).toISOString()}};
}
export function dueCardIds(cards,store,now){
 return cards.filter(c=>{const rec=store[c.id];return rec!==undefined&&Date.parse(rec.due)<=now}).map(c=>c.id);
}
export function nextDueLabel(store){
 const times=Object.values(store).map(r=>Date.parse(r.due)).filter(t=>!Number.isNaN(t));
 if(!times.length)return'';
 const next=Math.min(...times),diff=next-Date.now();
 if(diff<=0)return'now';
 if(diff<3600000)return'in '+Math.max(1,Math.round(diff/60000))+' min';
 if(diff<86400000)return'in '+Math.round(diff/3600000)+' h';
 return'in '+Math.round(diff/86400000)+' d';
}
