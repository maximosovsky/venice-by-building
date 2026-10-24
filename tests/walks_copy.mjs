import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const app = readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
const walks = app.slice(app.indexOf('function showWalks()'), app.indexOf("document.querySelector('.walks-open').onclick"));
assert.ok(!walks.includes('Five short routes through the city'), 'remove obsolete riddle introduction');
assert.ok(!walks.includes('Your suns:'), 'remove obsolete aggregate score');
assert.ok(walks.includes('${bridgeRoute.listHTML()}'));
assert.ok(walks.includes('${churchRoute.listHTML()}'));
console.log('Routes copy contract passed');
