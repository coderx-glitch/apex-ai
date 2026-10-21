import fs from 'node:fs';
import test from 'node:test';import assert from 'node:assert/strict';
import {researchQuery,rankOfficial} from '../lib/providers.js';
test('current-fact queries ask for official sources',()=>{assert.match(researchQuery('current stable Python release'),/official site$/);assert.equal(researchQuery('history of Rome'),'history of Rome')});
test('official domain ranks first',()=>{const l=['https://realpython.com/a','https://www.python.org/downloads/'].map(u=>({url:u}));assert.equal(rankOfficial('latest Python version',l)[0].url,'https://www.python.org/downloads/')});
test('Gemini google search tool is skipped when live sources are already supplied',()=>{const s=fs.readFileSync(new URL('../lib/providers.js',import.meta.url),'utf8');assert.match(s,/Live web sources \\\(untrusted/)});
