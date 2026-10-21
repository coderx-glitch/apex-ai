// APEX Rooms: shared rooms (6-letter code) with a shared AI chat and a live quiz battle.
// State lives in Firestore (the same free Spark project used for the demo quota); clients poll this endpoint.
import crypto from'node:crypto';
import{initializeApp,cert,getApps}from'firebase-admin/app';
import{getFirestore}from'firebase-admin/firestore';
import{geminiStream,groqStream}from'./providers.js';
const ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789',ROOM_TTL=24*3600e3,MAX_MEMBERS=12,PER_Q=15000,REVEAL=4500,MAX_AI=80;
const fail=(status,message)=>Object.assign(Error(message),{status});
function db(){let app=getApps().find(a=>a.name==='apex-rooms');if(!app){const cfg=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||'null');if(!cfg?.project_id)throw fail(503,'Rooms storage is not configured.');app=initializeApp({credential:cert(cfg)},'apex-rooms')}return getFirestore(app)}
const clean=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const okCode=c=>/^[A-Z2-9]{6}$/.test(c)&&![...c].some(x=>!ALPHABET.includes(x));
const okId=i=>/^[a-f0-9]{32}$/.test(String(i||''));
const pidOf=id=>crypto.createHash('sha256').update(id).digest('hex').slice(0,8);
async function aiText(prompt){let t='';try{for await(const e of geminiStream({messages:[{role:'user',content:prompt}],mode:'chat',memory:[],summary:'',workspace:'',guest:true})){if(e.type==='delta')t+=e.text}}catch(e){if(!t&&process.env.GROQ_API_KEY){try{for await(const e of groqStream({messages:[{role:'user',content:prompt}],mode:'chat',memory:[],summary:'',workspace:''})){if(e.type==='delta')t+=e.text}}catch{}}if(!t)throw fail(503,'The AI is busy or out of free quota right now. Try again in a minute.')}
if(!t.trim())throw fail(503,'The AI gave an empty answer. Try again.');return t.trim()}
function parseQuiz(text,n){const m=String(text).match(/\[[\s\S]*\]/);if(!m)return null;let a;try{a=JSON.parse(m[0])}catch{return null}if(!Array.isArray(a))return null;const out=[];for(const x of a){if(!x||typeof x.q!=='string'||!Array.isArray(x.options)||x.options.length!==4||!Number.isInteger(x.answer)||x.answer<0||x.answer>3)continue;const opts=x.options.map(o=>clean(o,80));if(opts.some(o=>!o)||new Set(opts).size!==4)continue;out.push({q:clean(x.q,200),options:opts,answer:x.answer})}return out.length>=Math.min(3,n)?out.slice(0,n):null}
const active=(r,now)=>Object.entries(r.members).filter(([,m])=>now-m.seen<25000).map(([id])=>id);
function advance(r,now){const q=r.quiz;if(!q)return false;let ch=false;
if(q.status==='loading'&&now-q.loadStart>55000){r.quiz=null;r.quizError='Quiz creation timed out. Try again.';return true}
if(q.status==='active'){const ids=active(r,now),all=ids.length>0&&ids.every(id=>q.answers[id]);if(all||now>=q.qEnd){q.status='reveal';q.revealEnd=now+REVEAL;ch=true}}
if(q.status==='reveal'&&now>=q.revealEnd){if(q.idx+1<q.qs.length){q.idx++;q.status='active';q.qStart=now;q.qEnd=now+PER_Q;q.answers={};}else q.status='done';ch=true}
return ch}
function view(r,id,now){const me=r.members[id],members=Object.entries(r.members).map(([mid,m])=>({pid:pidOf(mid),name:m.name,score:(r.quiz?.scores?.[mid])||0,online:now-m.seen<25000}));
const out={code:r.code,v:r.v,now,you:pidOf(id),members,chat:r.chat.slice(-60),aiBusy:!!r.aiBusy&&now-r.aiBusy<45000,error:r.quizError||null};const q=r.quiz;
if(q){const pub={status:q.status,topic:q.topic,total:q.qs?.length||0,idx:q.idx||0};if(q.status==='active'||q.status==='reveal'){const cur=q.qs[q.idx];pub.q=cur.q;pub.options=cur.options;pub.qEnd=q.qEnd;pub.answered=Object.keys(q.answers).map(pidOf);pub.myChoice=q.answers[id]?.choice??null;if(q.status==='reveal'){pub.answer=cur.answer;pub.picks=Object.fromEntries(Object.entries(q.answers).map(([k,v])=>[pidOf(k),v.choice]))}}out.quiz=pub}
return out}
async function load(tx,ref,now){const s=await tx.get(ref);if(!s.exists)throw fail(404,'Room not found. Check the code.');const r=s.data();if(now-r.createdAt>ROOM_TTL)throw fail(410,'This room has expired.');return r}
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');
try{const store=db(),now=Date.now();
if(req.method==='GET'){const code=clean(req.query.code,6).toUpperCase(),id=String(req.query.id||''),since=Number(req.query.since)||0;if(!okCode(code)||!okId(id))throw fail(400,'Bad request.');const ref=store.collection('apex_rooms').doc(code);
let snap=await ref.get();if(!snap.exists)throw fail(404,'Room not found. Check the code.');let r=snap.data();if(!r.members[id])throw fail(403,'Join this room first.');
const stale=now-r.members[id].seen>15000,adv=JSON.parse(JSON.stringify(r));const changed=advance(adv,now);
if(stale||changed){r=await store.runTransaction(async tx=>{const x=await load(tx,ref,now);if(!x.members[id])throw fail(403,'Join this room first.');if(now-x.members[id].seen>15000){x.members[id].seen=now;x.v++}if(advance(x,now))x.v++;tx.set(ref,x);return x})}
if(since&&since===r.v&&!(r.quiz&&(r.quiz.status==='active'||r.quiz.status==='reveal')))return res.status(200).json({unchanged:true,v:r.v,now});
return res.status(200).json(view(r,id,now))}
if(req.method!=='POST')throw fail(405,'GET or POST only.');
const b=req.body&&typeof req.body==='object'?req.body:{},action=clean(b.action,20);
if(action==='create'){const id=String(b.id||'');if(!okId(id))throw fail(400,'Bad request.');const name=clean(b.name,20)||'Player';
for(let i=0;i<8;i++){const code=Array.from(crypto.randomBytes(6),x=>ALPHABET[x%ALPHABET.length]).join('');const ref=store.collection('apex_rooms').doc(code);
const made=await store.runTransaction(async tx=>{const s=await tx.get(ref);if(s.exists)return null;const r={code,createdAt:now,v:1,members:{[id]:{name,seen:now}},chat:[{k:'sys',text:name+' created the room.',ts:now}],quiz:null,aiCount:0,aiBusy:0};tx.set(ref,r);return r});
if(made)return res.status(200).json(view(made,id,now))}throw fail(503,'Could not create a room. Try again.')}
const code=clean(b.code,6).toUpperCase(),id=String(b.id||'');if(!okCode(code)||!okId(id))throw fail(400,'Check the 6-letter code.');const ref=store.collection('apex_rooms').doc(code);
if(action==='join'){const name=clean(b.name,20)||'Player';const r=await store.runTransaction(async tx=>{const x=await load(tx,ref,now);if(!x.members[id]){if(Object.keys(x.members).length>=MAX_MEMBERS)throw fail(409,'This room is full (12 players).');x.members[id]={name,seen:now};x.chat.push({k:'sys',text:name+' joined.',ts:now});x.chat=x.chat.slice(-120)}else x.members[id].seen=now;x.v++;tx.set(ref,x);return x});return res.status(200).json(view(r,id,now))}
const pre=await ref.get();if(!pre.exists)throw fail(404,'Room not found. Check the code.');if(!pre.data().members[id])throw fail(403,'Join this room first.');
if(action==='say'){const text=clean(b.text,500);if(!text)throw fail(400,'Type a message.');const r=await store.runTransaction(async tx=>{const x=await load(tx,ref,now);const m=x.members[id];if(!m)throw fail(403,'Join this room first.');x.chat.push({k:'user',pid:pidOf(id),name:m.name,text,ts:now});x.chat=x.chat.slice(-120);m.seen=now;x.v++;tx.set(ref,x);return x});return res.status(200).json(view(r,id,now))}
if(action==='ask'){const text=clean(b.text,500);if(!text)throw fail(400,'Ask something.');
const ctx=await store.runTransaction(async tx=>{const x=await load(tx,ref,now);const m=x.members[id];if(!m)throw fail(403,'Join this room first.');if(x.aiBusy&&now-x.aiBusy<45000)throw fail(429,'The AI is answering someone else. Wait a moment.');if((x.aiCount||0)>=MAX_AI)throw fail(429,'This room used its AI allowance (80 questions).');
x.chat.push({k:'user',pid:pidOf(id),name:m.name,text,ts:now,toAi:true});x.chat=x.chat.slice(-120);x.aiBusy=now;m.seen=now;x.v++;tx.set(ref,x);return{name:m.name,chat:x.chat.slice(-40)}});
let answer,err=null;try{const transcript=ctx.chat.map(c=>c.k==='ai'?'APEX AI: '+c.text:c.k==='user'?c.name+(c.toAi?' (to AI)':'')+': '+c.text:'').filter(Boolean).join('\n');
answer=await aiText('You are APEX AI inside a shared room where several people chat together. Everyone sees your replies. Use the room transcript below as memory of what each person asked. Address the person who just asked by name when helpful. Be accurate and concise; if unsure, say so. Do not invent facts.\n\nRoom transcript:\n'+transcript+'\n\nAnswer '+ctx.name+"'s latest question now.")}catch(e){err=e}
const r=await store.runTransaction(async tx=>{const x=await load(tx,ref,Date.now());x.aiBusy=0;if(answer){x.chat.push({k:'ai',name:'APEX AI',text:String(answer).slice(0,3000),ts:Date.now()});x.aiCount=(x.aiCount||0)+1}else x.chat.push({k:'sys',text:err?.message||'The AI could not answer.',ts:Date.now()});x.chat=x.chat.slice(-120);x.v++;tx.set(ref,x);return x});return res.status(200).json(view(r,id,Date.now()))}
if(action==='quiz_start'){const topic=clean(b.topic,60);if(topic.length<2)throw fail(400,'Pick a quiz topic.');const n=Math.min(8,Math.max(3,Number(b.count)||5));
await store.runTransaction(async tx=>{const x=await load(tx,ref,now);if(!x.members[id])throw fail(403,'Join this room first.');if(x.quiz&&['loading','active','reveal'].includes(x.quiz.status))throw fail(409,'A quiz is already running.');x.quiz={status:'loading',topic,loadStart:now,qs:[],idx:0,answers:{},scores:{}};x.quizError=null;x.chat.push({k:'sys',text:x.members[id].name+' is starting a quiz on "'+topic+'".',ts:now});x.v++;tx.set(ref,x)});
let qs=null,err=null;try{for(let i=0;i<2&&!qs;i++){const t=await aiText('Write a multiple-choice quiz of exactly '+n+' questions about: '+topic+'.\nRules: factual and unambiguous, one clearly correct answer, 4 distinct options each under 60 characters, medium difficulty. Reply with ONLY a JSON array, no markdown, in this shape: [{"q":"...","options":["a","b","c","d"],"answer":0}] where answer is the index 0-3 of the correct option.');qs=parseQuiz(t,n)}if(!qs)err='The AI could not make a clean quiz. Try another topic.'}catch(e){err=e.message}
const r=await store.runTransaction(async tx=>{const x=await load(tx,ref,Date.now());if(!x.quiz||x.quiz.status!=='loading')return x;const t=Date.now();if(qs){x.quiz={status:'active',topic,qs,idx:0,qStart:t,qEnd:t+PER_Q,answers:{},scores:Object.fromEntries(Object.keys(x.members).map(k=>[k,0]))};x.chat.push({k:'sys',text:'Quiz started: '+qs.length+' questions. Go!',ts:t})}else{x.quiz=null;x.quizError=err;}x.v++;tx.set(ref,x);return x});return res.status(200).json(view(r,id,Date.now()))}
if(action==='quiz_answer'){const choice=Number(b.choice);if(!Number.isInteger(choice)||choice<0||choice>3)throw fail(400,'Bad choice.');const r=await store.runTransaction(async tx=>{const x=await load(tx,ref,now);const m=x.members[id];if(!m)throw fail(403,'Join this room first.');m.seen=now;advance(x,now);const q=x.quiz;if(q&&q.status==='active'&&now<q.qEnd&&!q.answers[id]){q.answers[id]={choice,t:now};const cur=q.qs[q.idx];if(choice===cur.answer){q.scores[id]=(q.scores[id]||0)+100+Math.round(50*Math.max(0,q.qEnd-now)/PER_Q)}advance(x,now)}x.v++;tx.set(ref,x);return x});return res.status(200).json(view(r,id,now))}
if(action==='quiz_reset'){const r=await store.runTransaction(async tx=>{const x=await load(tx,ref,now);if(!x.members[id])throw fail(403,'Join this room first.');if(x.quiz&&x.quiz.status!=='done'&&x.quiz.status!=='loading'&&x.quiz.status!=='idle')throw fail(409,'The quiz is still running.');x.quiz=null;x.quizError=null;x.v++;tx.set(ref,x);return x});return res.status(200).json(view(r,id,now))}
throw fail(400,'Unknown action.')}
catch(e){const status=e.status||500;if(status===500)console.error('rooms',String(e.message||e).slice(0,200));res.status(status).json({error:status===500?'Rooms hit a server error. Try again.':e.message})}}
