import test from 'node:test';import assert from 'node:assert/strict';
import{cacheKey,cacheGet,cacheSet,cacheClear}from'../lib/answer-cache.js';
const q=(c,x={})=>({mode:'chat',provider:'gemini',messages:[{role:'user',content:c}],...x});
test('two visitors: workspace/reference/live context is never shared',()=>{cacheClear();
 const a=q('Explain the main idea of my project',{workspace:{note:'visitor A secret'}});
 assert.equal(cacheKey(a),null);
 assert.equal(cacheKey(q('What is a stack in programming?\n\nReference excerpt: A-only text')),null);
 assert.equal(cacheKey(q('What is a stack in programming?\n\nLive data: x')),null);
 assert.equal(cacheKey(q('What is a stack in programming?',{evidencePacket:{a:1}})),null);
 const k=cacheKey(q('What is a stack in programming?'));assert.ok(k);cacheSet(k,'A stack is a last in first out structure used in programming and more.');
 assert.ok(cacheGet(cacheKey(q('What is a stack in programming?'))));
 assert.equal(cacheGet(cacheKey(q('What is a stack in programming?',{workspace:{x:1}}))),null);});
test('punctuation and mode/provider kept in key',()=>{
 assert.notEqual(cacheKey(q('Explain C language')),cacheKey(q('Explain C++ language')));
 assert.notEqual(cacheKey(q('Explain recursion please')),cacheKey(q('Explain recursion please',{provider:'openai'})));
 assert.equal(cacheKey(q('Explain recursion please',{mode:'research'})),null);});
