import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const highlight=readFileSync('web/church-building-highlight.js','utf8');
const app=readFileSync('web/app.js','utf8');
assert.ok(highlight.includes("color: '#436817'"),'church full volumes must use Venezia green');
assert.ok(app.includes("churchBuildingHighlight.setSourceVisible('bridges-tab', m === MODE.layers)"),'Bridges tab enables churches independently of Walks');
console.log('Venezia green and Bridges tab wiring PASS');
