import assert from 'node:assert/strict';
import fs from 'node:fs';
assert.ok(fs.readFileSync('web/index.html','utf8').includes('class="venice-arms" src="img/LYMPG.jpg"'), 'masthead must use the supplied emblem');
assert.deepEqual(fs.readFileSync('web/img/LYMPG.jpg'),fs.readFileSync('LYMPG.jpg'),'preserve supplied image');
console.log('PASS supplied masthead emblem, unchanged source bytes');
