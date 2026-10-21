// APEX plans are unlocked with tokens earned by playing games. Everything is
// stored on this device (localStorage); nothing is synced, encrypted or
// tamper-proof. Plan locks hide or show app features on this device only.
// They never change the real server-side AI quota, and they are not payment.
export const PLANS=[
 {id:'free',name:'Free',cost:0,tag:'Everyone starts here',features:['Assistant chat + Reasoning mode','Notes, tasks, documents, converters','All games + token rewards','Plugins library + Wikipedia','Voice notes with on-device transcription','Image tools: resize, crop, filters, background removal','Public image demo (shared free quota)']},
 {id:'go',name:'Go',cost:150,tag:'For daily research',features:['Everything in Free','Research mode with live sources','Hey APEX voice trigger']},
 {id:'plus',name:'Plus',cost:400,tag:'For heavy users',features:['Everything in Go','Voice replies (read-aloud answers)','Fast backup engine priority','Larger chat uploads']},
 {id:'pro',name:'Pro',cost:800,tag:'The full studio',features:['Everything in Plus','HD image generation (1024px) + one-click upscale','APEX Studio combo: prompt to script + image + voice','Deep Research (longer, multi-source answers)']}];
// Which features each plan really switches on this device today.
// Anything not listed here is a design preview, labeled as such in the UI.
const GATES={research:'go',heyapex:'go',voiceReply:'plus',groqPriority:'plus',bigUploads:'plus',hdImage:'pro',upscale:'pro',studioCombo:'pro',deepResearch:'pro'};
const ORDER=['free','go','plus','pro'];
const KEY='apex-plan';
export function currentPlan(){try{const id=localStorage.getItem(KEY);return PLANS.some(p=>p.id===id)?id:'free'}catch{return'free'}}
export function savePlan(id){if(!PLANS.some(p=>p.id===id))throw Error('Unknown plan');try{localStorage.setItem(KEY,id)}catch{}return id}
export function planRank(id){return ORDER.indexOf(id)}
export function canUse(feature,planId=currentPlan(),owner=false){if(owner)return true;const need=GATES[feature];if(!need)return true;return planRank(planId)>=planRank(need)}
export function gateFor(feature){return GATES[feature]||null}
export function unlockWithTokens(planId,tokens){const plan=PLANS.find(p=>p.id===planId);if(!plan)throw Error('Unknown plan');if(tokens<plan.cost)throw Error('Not enough tokens yet. Finish games to earn more.');return{spent:plan.cost}}
