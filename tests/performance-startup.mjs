import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const calls=[];
let release;
const held=new Promise(r=>release=r);
globalThis.fetch=async url=>{calls.push(String(url)); if(url==='data/venezia.json') {await held;return new Response(JSON.stringify({packs:['pack0.bin','pack1.bin']}));} return new Response(url.endsWith('.json')?'[]':new Uint8Array([1,2,3]));};
const modulePath=new URL('../web/startup-resources.js',import.meta.url);
assert.equal(await fs.access(modulePath).then(()=>true,()=>false),true,'shared early resource loader must exist');
const {fetchBin,fetchJSON,preloadShips}=await import(modulePath);
assert(calls.includes('data/land.bin'),'ground starts before config resolves');
assert(calls.includes('data/wiki.json'),'lookup starts early');
preloadShips(['models/test.glb']);
assert(calls.includes('models/test.glb'),'ship bytes start early');
release();await fetchJSON('data/venezia.json');await new Promise(r=>setTimeout(r,0));
assert(calls.includes('data/pack0.bin'),'packs start immediately after config');
const [a,b]=await Promise.all([fetchBin('data/land.bin'),fetchBin('data/land.bin')]);assert.equal(a,b);assert.equal(calls.filter(x=>x==='data/land.bin').length,1);
for(const name of ['index','splash1','splash2','splash3']) {const html=await fs.readFile(new URL('../web/'+name+'.html',import.meta.url),'utf8');assert.match(html,/rel="modulepreload" href="vendor\/three.module.js"/);assert.match(html,/src="startup-resources.js"/);}
for(const file of ['splash.js','splash-variants.js']) {const splash=await fs.readFile(new URL('../web/'+file,import.meta.url),'utf8');assert.match(splash,/getEntriesByType\('resource'\)/,'splash must account for resources that finish before its fetch hook');}
const config=JSON.parse(await fs.readFile(new URL('../vercel.json',import.meta.url)));for(const rule of config.headers)if(rule.headers.some(h=>h.value.includes('immutable')))assert.match(rule.source,/assets\/.*[a-f0-9]/,'immutable cache must constrain hash URLs');
console.log('PASS startup concurrency, shared bytes, head preload, safe cache');
