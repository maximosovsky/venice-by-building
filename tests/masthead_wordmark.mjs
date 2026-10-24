import assert from 'node:assert/strict';
import fs from 'node:fs';
assert.ok(fs.readFileSync('web/index.html','utf8').includes('src="img/Venetia-Venecia.png"'),'masthead wordmark must use supplied image');
assert.deepEqual(fs.readFileSync('web/img/Venetia-Venecia.png'),fs.readFileSync('Venetia-Venecia.png'));
console.log('PASS supplied title image');
