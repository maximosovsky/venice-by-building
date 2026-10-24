import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('web/index.html','utf8');
const header=html.match(/<header class="masthead">([\s\S]*?)<\/header>/)[1];
assert.ok(!header.includes('class="byline"'),'remove masthead subtitle');
assert.ok(fs.readFileSync('web/styles.css','utf8').includes('translate(5cm, -50px)'),'apply requested wordmark translation');
console.log('PASS subtitle removed and requested wordmark shift');
