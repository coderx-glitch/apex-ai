import test from 'node:test';import assert from 'node:assert/strict';import*as a from '../lib/auto-reference.js';
test('live detect',()=>{assert.equal(a.live('What is the weather in Delhi today?').q,'Delhi');assert.equal(a.live('USD to INR rate?').id,'currency');assert.equal(a.live('tell me a story'),null)});
