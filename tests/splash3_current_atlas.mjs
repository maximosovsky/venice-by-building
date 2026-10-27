// splash3 is the current atlas document with only its isolated entry animation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const web=new URL('../web/',import.meta.url);
const main=fs.readFileSync(new URL('index.html',web),'utf8').replace(/\r\n/g,'\n');
const expected=main
 .replace('<link rel="stylesheet" href="splash.css">','<link rel="stylesheet" href="splash.css">\n<link rel="stylesheet" href="splash-variants.css">')
 .replace('<body>','<body class="splash-variant-3">')
 .replace('<script defer src="splash.js"></script>','<script defer src="splash3-emblem.js"></script>\n<script defer src="splash-variants.js"></script>');
const actual=fs.readFileSync(new URL('splash3.html',web),'utf8').replace(/\r\n/g,'\n');
assert.equal(actual,expected,'splash3 must match current index except for isolated splash wiring');
console.log('PASS splash3 matches current atlas HTML; only splash wiring differs');
