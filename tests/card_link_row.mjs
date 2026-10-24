import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app = readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
assert.ok(!app.includes("t('Статья в Википедии')"), 'duplicate Wikipedia/Wikidata card link row must be absent');
assert.ok(app.includes("t('Из Википедии')"), 'article extract remains');
console.log('Duplicate card link row absent');
