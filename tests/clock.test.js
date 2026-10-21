import test from 'node:test';import assert from 'node:assert/strict';import{deviceClock}from'../lib/device-clock.js';
test('device clock',()=>{const c=deviceClock(new Date('2026-10-20T06:35:00Z'),'Asia/Calcutta');assert.match(c,/Tuesday/);assert.match(c,/20 October 2026/);assert.match(c,/12:05/);assert.match(c,/Asia\/Calcutta/)});
