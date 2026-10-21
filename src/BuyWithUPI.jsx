import React,{useState,useEffect}from'react';
import{savePlan,currentPlan,planRank}from'../lib/plans.js';
// Manual UPI purchases. The buyer pays the owner's UPI ID with any UPI app
// and pastes the UTR / reference number. NOTHING unlocks automatically:
// every request waits for the owner's manual approval, and only then does
// this device claim the grant. Duplicate UTRs are rejected by the server.
function buyerId(){let v=null;try{v=localStorage.getItem('apex-buyer-id')}catch{}if(!v){v='buyer-'+Array.from(crypto.getRandomValues(new Uint8Array(9))).map(b=>b.toString(16).padStart(2,'0')).join('');try{localStorage.setItem('apex-buyer-id',v)}catch{}}return v}
function loadReqs(){try{return JSON.parse(localStorage.getItem('apex-payment-requests')||'[]')}catch{return[]}}
async function call(body,token){const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({provider:'payment',...body})});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.error||('The payment server returned an error (status '+r.status+'). Wait a few seconds and try once more.'));return d}
export default function BuyWithUPI({isOwner=false,token='',onPlan,onAddTokens,onLog,storageKey}){
 const[config,CFG]=useState(null),[error,E]=useState(''),[note,N]=useState('');
 const[item,I]=useState('plan:go'),[utr,UTR]=useState(''),[busy,B]=useState(false);
 const[requests,R]=useState(loadReqs);
 const[pending,P]=useState(null),[ownerBusy,OB]=useState(false);
 function saveReqs(next){R(next);try{localStorage.setItem('apex-payment-requests',JSON.stringify(next))}catch{}}
 useEffect(()=>{call({action:'config'}).then(CFG).catch(()=>E('Could not load payment details. Check your connection.'))},[]);
 // claim approved grants for this device's pending requests
 useEffect(()=>{
  let alive=true,running=false;
  async function poll(){
   if(running)return;running=true;
   const pendingReqs=loadReqs().filter(r=>r.status==='pending');
   for(const r of pendingReqs){
    try{
     const d=await call({action:'claim',requestId:r.requestId,buyer:buyerId()});
     if(!alive)return;
     if(d.status==='approved'&&d.grant){
      const key=storageKey+'-games';
      const wallet=JSON.parse(localStorage.getItem(key)||'{}');
      const applied=wallet.paymentReceipts||[];
      if(!applied.includes(r.requestId)){
       wallet.tokens=(Number(wallet.tokens)||0)+(d.grant.kind==='tokens'?d.grant.tokens:0);
       wallet.paymentReceipts=[...applied,r.requestId];
       localStorage.setItem(key,JSON.stringify(wallet));
      }
      if(d.grant.plan&&planRank(d.grant.plan)>planRank(currentPlan())){savePlan(d.grant.plan);onPlan?.(d.grant.plan)}
      onAddTokens?.(0);
      saveReqs(loadReqs().map(x=>x.requestId===r.requestId?{...x,status:'approved'}:x));
      N('Payment approved: '+(d.grant.plan?d.grant.plan+' plan':d.grant.tokens+' tokens')+' is now active on this device.');
      onLog?.('Payment approved',r.label+' · UTR '+r.upiRef);
     }else if(d.status==='rejected'||(d.status==='approved'&&d.alreadyClaimed)){
      saveReqs(loadReqs().map(x=>x.requestId===r.requestId?{...x,status:d.status}:x));
     }
    }catch{}
   }
   running=false;
  }
  poll();const t=setInterval(poll,15000);return()=>{alive=false;clearInterval(t)};
 },[storageKey]);
 async function loadPending(){OB(true);E('');try{const d=await call({action:'list'},token);P(d.pending||[])}catch(e){E(e.message)}finally{OB(false)}}
 useEffect(()=>{if(isOwner&&token)loadPending()},[isOwner,token]);
 async function submit(){
  E('');N('');
  if(item==='plan:pro'){E('New cash Pro purchases are paused until the advertised extras work. Do not pay for Pro now.');return}
  const[kind,id]=item.split(':');
  const clean=utr.replace(/\s+/g,'');
  if(!/^[A-Za-z0-9]{6,22}$/.test(clean)){E('Enter the UTR number exactly as your payment app shows it - 6 to 22 letters or digits, no spaces. It looks like 328419205511.');return}
  B(true);
  try{
   const d=await call({action:'create',kind,id,upiRef:clean,buyer:buyerId()});
   saveReqs([...loadReqs(),{requestId:d.requestId,kind,id,upiRef:clean,inr:sel?.inr,label:sel?.label,status:'pending',createdAt:new Date().toISOString()}]);
   UTR('');
   N('Payment request sent. Status: waiting for the owner to verify your UPI payment. This is manual - nothing unlocks until he confirms it in his UPI app.');
  }catch(e){E(e.message)}finally{B(false)}
 }
 async function decide(requestId,approve){
  OB(true);E('');
  try{await call({action:'decide',requestId,approve},token);await loadPending();N(approve?'Approved. The buyer\'s device unlocks on its next check (within about 15 seconds).':'Request rejected.')}
  catch(e){E(e.message)}finally{OB(false)}
 }
 const sel=(()=>{const[kind,id]=item.split(':');const table=kind==='plan'?config?.plans:config?.packs;const it=table?.[id];return it?{kind,id,...it}:null})();
 return <section className="settings-card buy-upi"><h3>Buy with UPI</h3>
  <p><strong>Manual verification, no automatic unlock.</strong> Pay with any UPI app, paste your UTR / reference number below, and your purchase unlocks only after the owner personally confirms the payment in his UPI app. This can take some time. Duplicate references are blocked; payment authenticity is checked by the owner, not automatically.</p>
  {error&&<p role="alert" className="error">{error}</p>}{note&&<p role="status" className="access-notice">{note}</p>}
  {isOwner&&<div className="upi-owner"><h4>Owner: pending payment requests</h4>
   <p className="upi-owner-hint">You are signed in as the owner. Buyer requests appear below - verify each payment in your UPI app first, then Approve or Reject.</p>
   <button className="subtle" disabled={ownerBusy} onClick={loadPending}>{ownerBusy?'Checking…':'Refresh list'}</button>
   {!pending&&<p role="status">{ownerBusy?'Loading pending payment requests…':'Pending list not loaded. Press Refresh list.'}</p>}
   {pending&&(pending.length?<ul>{pending.map(r=><li key={r.requestId} className="upi-req"><strong>{r.kind==='plan'?r.plan+' plan':r.tokens+' tokens'}</strong> · ₹{r.inr} · UTR <code>{r.upiRef}</code> · buyer <code>{r.buyer}</code> · {r.createdAt?.slice(0,16).replace('T',' ')} UTC <button className="primary" disabled={ownerBusy} onClick={()=>decide(r.requestId,true)}>Approve (verify payment received first)</button> <button className="danger" disabled={ownerBusy} onClick={()=>decide(r.requestId,false)}>Reject</button></li>)}</ul>:<p>No pending requests.</p>)}
  </div>}
  {config?<>
   <div className="upi-pay-box">
    <img src="/upi-qr.png" alt={'UPI QR code paying '+config.upiName} width="180" height="180"/>
    <div><p><strong>{config.upiName}</strong></p><p className="upi-id">{config.upiId}</p><p>Scan the QR or pay to this UPI ID from any UPI app.</p></div>
   </div>
   <p className="upi-pro-paused"><strong>Do not pay for Pro now.</strong> New cash Pro requests are paused while HD AI, Studio combo and Deep Research are not available. Existing approvals, owner access and local upscale stay unchanged.</p><label>What are you buying?<select aria-label="Purchase item" value={item} disabled={busy} onChange={e=>I(e.target.value)}>
    <optgroup label="Plans">{Object.entries(config.plans||{}).map(([id,p])=><option key={id} value={'plan:'+id} disabled={id==='pro'}>{p.label}{id==='pro'?' (cash purchases paused)':''} - ₹{p.inr} ({p.tokens} tokens worth of features)</option>)}</optgroup>
    <optgroup label="Token packs">{Object.entries(config.packs||{}).map(([id,p])=><option key={id} value={'tokens:'+id}>{p.label} - ₹{p.inr}</option>)}</optgroup>
   </select></label>
   {sel&&<p className="upi-amount"><strong>Amount to pay: ₹{sel.inr}</strong> - pay exactly this amount so the owner can match your payment.</p>}
   <label>UTR / UPI reference number<input aria-label="UTR or UPI reference number" value={utr} disabled={busy} onChange={e=>UTR(e.target.value)} placeholder="12-digit number from your payment app" maxLength={22}/></label>
   <button className="primary" disabled={busy} onClick={submit}>{busy?'Sending…':'Submit for owner verification'}</button>
   {requests.length>0&&<div className="upi-my-requests"><h4>Your payment requests</h4><ul>{requests.slice().reverse().map(r=><li key={r.requestId} className={'upi-req upi-'+r.status}><strong>{r.label||r.id}</strong> · ₹{r.inr} · UTR {r.upiRef} · {r.status==='pending'?'waiting for owner approval':r.status}</li>)}</ul></div>}
  </>:!error&&<p role="status">Loading payment details…</p>}

 </section>
}
