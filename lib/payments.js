// Manual UPI payments. There is no gateway API here: the buyer pays to the
// owner's UPI ID and submits the UTR/reference. NOTHING unlocks until the
// owner approves the request from the owner-only list. Duplicate UTRs are
// rejected. No fake "paid" states anywhere in this flow.
import {getApps,initializeApp,cert} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';

export const PLAN_PRICES={go:{inr:99,tokens:150,label:'Go plan'},plus:{inr:249,tokens:400,label:'Plus plan'},pro:{inr:449,tokens:800,label:'Pro plan'}};
export const TOKEN_PACKS={t100:{inr:79,tokens:100,label:'100 tokens'},t300:{inr:229,tokens:300,label:'300 tokens'},t700:{inr:499,tokens:700,label:'700 tokens'}};

export function priceFor(kind,id){
 const table=kind==='plan'?PLAN_PRICES:kind==='tokens'?TOKEN_PACKS:null;
 if(!table)throw Error('Choose plan or tokens.');
 const item=Object.hasOwn(table,id)?table[id]:null;
 if(!item)throw Error('Unknown purchase item.');
 return {kind,id,...item};
}
export function validUpiRef(ref){
 const v=String(ref||'').replace(/\s+/g,'');
 if(!/^[A-Za-z0-9]{6,22}$/.test(v))throw Error('Enter the UTR / UPI reference number from your payment app (6-22 letters or digits).');
 return v;
}
export function validBuyer(id){
 const v=String(id||'').trim();
 if(!/^[A-Za-z0-9-]{6,80}$/.test(v))throw Error('Missing buyer identity. Reload the app and retry.');
 return v;
}
export function newRequest({kind,id,upiRef,buyer}){
 const item=priceFor(kind,id);
 return {kind,id,upiRef:validUpiRef(upiRef),buyer:validBuyer(buyer),inr:item.inr,tokens:item.tokens,plan:kind==='plan'?id:null,status:'pending',createdAt:new Date().toISOString()};
}
function db(){
 let app=getApps().find(a=>a.name==='apex-quota');
 if(!app){const config=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||'null');if(!config?.project_id)throw Error('Payment store is not configured.');app=initializeApp({credential:cert(config)},'apex-quota')}
 return getFirestore(app);
}
export function assertNewPurchaseAvailable(kind,id){if(kind==='plan'&&id==='pro')throw Error('New cash Pro purchases are paused while HD AI, Studio combo and Deep Research are not available. Existing approvals and owner access are unchanged.')}
export async function createPaymentRequest(input){
 assertNewPurchaseAvailable(input.kind,input.id);
 const req=newRequest(input),store=db(),utrRef=store.collection('apex_payment_utrs').doc(req.upiRef.toLowerCase()),reqRef=store.collection('apex_payment_requests').doc();
 return await store.runTransaction(async tx=>{
  const dup=await tx.get(utrRef);
  if(dup.exists)throw Error('This UTR/reference was already submitted. If you already paid, wait for approval - do not resubmit.');
  tx.set(utrRef,{requestId:reqRef.id,createdAt:req.createdAt});
  tx.set(reqRef,req);
  return {requestId:reqRef.id,status:'pending'};
 },{maxAttempts:5});
}
export async function paymentStatus(requestId,buyer){
 if(!/^[A-Za-z0-9]{10,40}$/.test(String(requestId||'')))throw Error('Unknown payment request.');
 const store=db(),snap=await store.collection('apex_payment_requests').doc(requestId).get();
 if(!snap.exists)throw Error('Unknown payment request.');
 const d=snap.data();
 if(d.buyer!==validBuyer(buyer))throw Error('Payment request belongs to another browser.');
 const out={status:d.status,kind:d.kind,id:d.id,inr:d.inr,tokens:d.tokens,plan:d.plan};
 if(d.status==='approved')out.grant=paymentGrant(d);
 return out;
}
export function paymentGrant(d){return {kind:d.kind,id:d.id,tokens:d.kind==='tokens'?d.tokens:0,plan:d.kind==='plan'?d.plan:null}}
// A receipt can be read repeatedly by its browser. Local application stores the
// receipt ID together with the wallet, so a lost response can be retried safely.
export async function claimGrant(requestId,buyer){return paymentStatus(requestId,buyer)}
export async function listPendingPayments(){
 const store=db(),snap=await store.collection('apex_payment_requests').where('status','==','pending').limit(200).get();
 return snap.docs.map(d=>({requestId:d.id,...d.data()})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function decidePayment(requestId,approve){
 if(!/^[A-Za-z0-9]{10,40}$/.test(String(requestId||'')))throw Error('Unknown payment request.');
 const store=db(),ref=store.collection('apex_payment_requests').doc(requestId);
 return await store.runTransaction(async tx=>{
  const snap=await tx.get(ref);
  if(!snap.exists)throw Error('Unknown payment request.');
  const d=snap.data();
  if(d.status!=='pending')return {status:d.status,unchanged:true};
  const status=approve?'approved':'rejected';
  tx.update(ref,{status,decidedAt:new Date().toISOString()});
  return {status};
 },{maxAttempts:5});
}
