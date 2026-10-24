import assert from 'node:assert/strict';
import fs from 'node:fs';
assert.ok(fs.readFileSync('web/index.html','utf8').includes('class="venice-arms" src="img/Venice-1642.png"'), 'masthead must use the supplied emblem');
assert.deepEqual(fs.readFileSync('web/img/Venice-1642.png'),fs.readFileSync('Venice-1642.png'),'preserve supplied image');
console.log('PASS supplied masthead emblem, unchanged source bytes');
