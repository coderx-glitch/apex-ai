import test from'node:test';import assert from'node:assert/strict';import{hedge}from'../lib/hedge.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const gen=(ms,tag,fail)=>async function*(){await sleep(ms);if(fail)throw Object.assign(new Error('x'),{status:429});yield{type:'model',model:tag};yield{type:'delta',text:tag};yield{type:'done'}};
const run=async(a,b,ms)=>{const o=[];for await(const e of hedge(a,b,ms))o.push(e);return o};
test('fast main wins, backup never starts',async()=>{let b=0;const o=await run(gen(10,'A'),()=>{b++;return gen(0,'B')()},200);assert.equal(b,0);assert.equal(o.find(e=>e.type==='delta').text,'A')});
test('slow main loses to backup',async()=>{const t=Date.now();const o=await run(gen(2000,'A'),gen(20,'B'),100);assert.equal(o.find(e=>e.type==='delta').text,'B');assert.ok(Date.now()-t<800)});
test('failing main starts backup immediately',async()=>{const t=Date.now();const o=await run(gen(10,'A',true),gen(10,'B'),5000);assert.equal(o.find(e=>e.type==='delta').text,'B');assert.ok(Date.now()-t<500)});
test('both fail throws',async()=>{await assert.rejects(run(gen(5,'A',true),gen(5,'B',true),50))});
