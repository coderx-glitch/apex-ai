import React,{useState,useEffect} from'react';
import{PLANS,savePlan,planRank}from'../lib/plans.js';import BuyWithUPI from'./BuyWithUPI.jsx';
// Tokens are earned by finishing games or approved manual UPI requests.
// Plan unlocks remain local to this device. Plan locks are device-local:
// they show or hide app features; they never change the real server-side AI
// quota, which stays the shared Free allowance for every guest.
const OWNER_KEY='apex-owner-plan';
export function greetingFor(date=new Date()){const h=date.getHours();return h>=5&&h<12?'Good morning':h<17&&h>=12?'Good afternoon':h>=17&&h<21?'Good evening':'Good night'}
function ownerPlan(){try{const id=localStorage.getItem(OWNER_KEY);return PLANS.some(p=>p.id===id)?id:'pro'}catch{return'pro'}}
function OwnerPlans(){const[active,A]=useState(ownerPlan),[greet,G]=useState(null);
 useEffect(()=>{if(!greet)return;const t=setTimeout(()=>G(null),4600);return()=>clearTimeout(t)},[greet]);
 function pick(p){try{localStorage.setItem(OWNER_KEY,p.id)}catch{}A(p.id);G({hello:greetingFor(),plan:p.name,n:Date.now()})}
 return <div className="plans-page owner-plans"><section className="media-intro"><h2>Switch to any plan</h2></section>
 <div className="plan-grid owner-plan-grid">{PLANS.map(p=><button key={p.id} type="button" className={'plan-card owner-plan-card'+(active===p.id?' plan-active':'')} aria-pressed={active===p.id} onClick={()=>pick(p)}><h3>{p.name}</h3><p className="plan-tag">{p.tag}</p><span className="plan-state">{active===p.id?'Current':'Switch to '+p.name}</span></button>)}</div>
 {greet&&<div key={greet.n} className="plan-greet" role="status" aria-live="polite" onClick={()=>G(null)}><div className="plan-greet-card"><p className="plan-greet-hello">{greet.hello}</p><p className="plan-greet-welcome">Welcome to <strong>{greet.plan}</strong> version of this APEX AI</p></div></div>}
 </div>}
export default function Plans({guestLimits,plan,tokens,isOwner=false,token='',storageKey,onPlan,onSpend,onAddTokens,onLog}){
 const[error,E]=useState('');const[note,N]=useState('');
 const rank=planRank(isOwner?'pro':plan);
 function unlock(p){
  E('');N('');
  if(isOwner){N('Owner access already includes every feature. No tokens needed.');return}
  if(planRank(p.id)<=rank){N(p.name+' is already active on this device.');return}
  try{
   if(tokens<p.cost)throw Error('Not enough tokens yet: '+p.name+' needs '+p.cost+', you have '+tokens+'. Finish games to earn more.');
   onSpend(p.cost);
   savePlan(p.id);onPlan(p.id);
   N(p.name+' unlocked on this device. '+p.cost+' tokens spent. Features marked [live] switch on now.');
   onLog?.('Plan unlocked',p.name+' · '+p.cost+' tokens spent on this device.');
  }catch(e){E(e.message)}
 }
 if(isOwner)return <OwnerPlans/>;
 return <div className="plans-page"><section className="media-intro"><span className="eyebrow">APEX PLANS</span><h2>Plans & tokens</h2><p>Tokens are an in-app currency earned by playing games. You can also buy plans or tokens with UPI below - every UPI purchase is verified manually by the owner before anything unlocks.</p></section>
 <p className="plans-honest" role="note"><strong>Honest status:</strong> tokens and plan locks live on this device only - they are not synced, encrypted or tamper-proof, and they never raise the real server-side AI allowance{' '}{guestLimits?`(${guestLimits.visitorDay} per visitor/day, ${guestLimits.ipDay} per IP/day, ${guestLimits.globalDay} shared/day)`:'(the shared guest quota)'}{'. '}Features marked <strong>[live]</strong> really switch on or off. Features marked <strong>[preview]</strong> are design previews of what the tier would include; they are not built into the guest path yet. The owner access code always unlocks everything.</p>
 <div className="plan-wallet" role="status"><strong>Your wallet: {isOwner?'owner · unlimited':tokens+' tokens'}</strong><span>Earn 10-75 tokens per finished game (win and score bonuses). Stored on this device.</span></div>
 {error&&<p role="alert" className="error">{error}</p>}{note&&<p role="status" className="access-notice">{note}</p>}
 <div className="plan-grid">{PLANS.map(p=>{
  const active=isOwner||planRank(p.id)<=rank;
  return <article key={p.id} className={'plan-card'+(active?' plan-active':'')}>
   <header><h3>{p.name}</h3><span className="plan-cost">{p.cost===0?'0 tokens':p.cost+' tokens'}</span></header>
   <p className="plan-tag">{p.tag}</p>{p.id==='pro'&&<p className="plan-preview-warning">HD AI, Studio combo and Deep Research are not available yet. Cash Pro purchases are paused. Token unlock currently adds browser upscale only.</p>}
   <ul>{p.features.map(f=><li key={f}>{f}</li>)}</ul>
   {isOwner?<p className="plan-state">Included with owner access</p>:active?<p className="plan-state">Active on this device</p>:<button className="primary" disabled={tokens<p.cost} onClick={()=>unlock(p)}>{tokens<p.cost?'Need '+(p.cost-tokens)+' more tokens':'Unlock for '+p.cost+' tokens'}</button>}
  </article>})}</div>
 <BuyWithUPI storageKey={storageKey} isOwner={isOwner} token={token} onPlan={onPlan} onAddTokens={onAddTokens} onLog={onLog}/>
 <section className="settings-card"><h3>What each lock really does</h3>
  <ul className="plan-matrix">
   <li><strong>[live] Research mode with sources</strong> - the Research option in chat appears from Go. Locked below Go.</li>
   <li><strong>[live] Hey APEX voice trigger</strong> - appears from Go.</li>
   <li><strong>[preview] Voice replies, backup-engine priority, larger uploads</strong> - Plus design preview; not switched by plan yet.</li>
   <li><strong>[live] Browser upscale</strong> - Pro unlocks 2x/4x interpolation with a light sharpen in Media, Edit image. It is not AI super-resolution.</li><li><strong>[preview] HD AI generation, APEX Studio combo, Deep Research</strong> - Pro design preview; these are not switched on by a purchase yet. Standard image tools stay free.</li>
  </ul>
  <p>Games, notes, tasks, plugins and every local tool stay fully open on every plan. Plans never remove a working free feature you already have; locks only gate the extras listed above.</p>
 </section>
 </div>
}
