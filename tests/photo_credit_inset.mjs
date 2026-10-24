import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const css=readFileSync(new URL('../web/styles.css',import.meta.url),'utf8');
assert.match(css,/\.b-photo-credit\s*\{[^}]*margin:\s*14px 24px 0/,'desktop photo attribution aligns with card facts');
assert.match(css,/@media[^]*\.b-photo-credit\s*\{[^}]*margin:\s*12px 18px 0/,'mobile photo attribution aligns with card facts');
console.log('Photo credit inset contract passed');
