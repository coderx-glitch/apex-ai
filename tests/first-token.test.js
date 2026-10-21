import test from 'node:test';import assert from 'node:assert/strict';
import{withFirstToken}from'../lib/first-token.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('slow first token gives up',async()=>{async function*slow(){await sleep(300);yield{type:'delta',text:'x'}}let gave=false;await assert.rejects(async()=>{for await(const _ of withFirstToken(slow(),50,()=>{gave=true}));},e=>e.slow===true&&e.status===504);assert.ok(gave)});
test('fast stream passes through and later gaps allowed',async()=>{async function*fast(){yield{type:'model'};yield{type:'delta',text:'a'};await sleep(120);yield{type:'delta',text:'b'}}const out=[];for await(const e of withFirstToken(fast(),50))out.push(e.type);assert.deepEqual(out,['model','delta','delta'])});
