// Promoted engraving entry: /splash3 is now an exact alias of the main atlas.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const web=new URL('../web/',import.meta.url);
const main=fs.readFileSync(new URL('index.html',web),'utf8').replace(/\r\n/g,'\n');
const actual=fs.readFileSync(new URL('splash3.html',web),'utf8').replace(/\r\n/g,'\n');
assert.equal(actual,main,'splash3 alias must match the complete promoted main document');
assert.ok(main.includes('<body class="splash-variant-3">'));
assert.ok(main.includes('<link rel="stylesheet" href="splash.css">\n<link rel="stylesheet" href="splash-variants.css">'));
assert.ok(main.includes('<script defer src="reveal.js"></script>\n<script defer src="splash3-emblem.js"></script>\n<script defer src="splash-variants.js?v=ships-ready-1"></script>\n<script defer src="draggable-emblem.js"></script>'));
assert.ok(!main.includes('<script defer src="splash.js'));
assert.ok(main.includes('<img class="venice-arms" src="img/Venice-1642.png"'));
assert.doesNotMatch(main,/href=["'](?:https:\/\/venice-by-building\.vercel\.app)?\/ru\/?["']/,'Russian entry remains unlinked');
const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
assert.ok(config.rewrites.some(r=>r.source==='/ru(/)?'&&r.destination==='/'),'Russian entry uses the same promoted atlas without a redirect');
assert.ok(config.headers.some(h=>h.source==='/ru(/)?'&&h.headers.some(v=>v.key==='X-Robots-Tag'&&v.value==='noindex, nofollow')));
console.log('PASS promoted variant3 wiring, exact splash3 alias, unlinked/noindex Russian entry');
