// One voice at a time. Every spoken reply (server voice, browser voice, Voice orb) claims a turn here.
// A claim for the same text within 90 s is refused, so one answer can never be read out twice.
let seq=0,cur=null,last={key:'',at:0},speaking=false;
const notify=()=>{try{window.dispatchEvent(new CustomEvent('apex-speech',{detail:speaking}))}catch{}};
const done=t=>{if(t===seq){speaking=false;cur=null;notify()}};
export function stopSpeech(){seq++;try{window.speechSynthesis?.cancel()}catch{}if(cur){try{cur.pause()}catch{}cur=null}if(speaking){speaking=false;notify()}}
export function claimSpeech(text){const key=String(text||'').replace(/[#*`>|_]/g,'').replace(/\s+/g,' ').trim().slice(0,200);if(!key)return null;const now=Date.now();if(last.key===key&&now-last.at<90000)return null;last={key,at:now};stopSpeech();speaking=true;notify();return seq}
export function playAudio(src,token,onend){if(token!==seq)return;const a=new Audio(src);cur=a;const end=()=>{done(token);onend?.()};a.onended=end;a.onerror=end;a.play().catch(end)}
export function speakBrowser(text,lang,token,onend){if(token!==seq)return;if(!window.speechSynthesis){done(token);onend?.();return}const u=new SpeechSynthesisUtterance(String(text).slice(0,2000));if(lang)u.lang=lang;u.onend=()=>{done(token);onend?.()};u.onerror=()=>{done(token);onend?.('error')};window.speechSynthesis.speak(u)}
export const isSpeaking=()=>speaking;
