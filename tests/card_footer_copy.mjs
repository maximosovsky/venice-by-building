import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('web/app.js','utf8');
assert.ok(app.includes('${photoCredit}</article>'),'photo credit must be last content in card');
assert.ok(!app.includes('<section class="sources">'),'cards must not contain sources section');
assert.ok(app.includes("L.id !== 'works' && L.caveat"),'bridge caveat must not render');
console.log('Card footer and removed bridge copy PASS');
