// Isolated contract fixture; never writes or substitutes production data.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
assert.ok(existsSync('web/data-enrichment.js'),'missing requested enrichment feature');
// The fixture serves its own render assets so the real WebCrypto guard can be exercised end to end.
const ATTRS=Buffer.from('fixture attrs'),CONFIG=Buffer.from('{"attrStride":56}');
const guard={attrs_sha256:createHash('sha256').update(ATTRS).digest('hex'),config_sha256:createHash('sha256').update(CONFIG).digest('hex')};
const fixtures={
 'enrichment-public/addresses.json':{schema:1,render_guard:guard,records:[{id:'a',label:'San Marco',number:12,letter:'A',sestiere:'San Marco',gid:0,x:2,z:3,match:{method:'within'}}],by_gid:{0:['a']}},
 'enrichment-public/building-evidence.json':{schema:1,render_guard:guard,by_gid:{0:{descriptions:[{text:'Palazzo originale <script>evil()</script>',source_id:'municipal',source_url:'https://example.org/source',match:{method:'overlap'}},{text:'DO NOT PUBLISH',text_withheld:true,language:'it'}],vprg:[{note:'Nota italiana',state:'schedato',sheet:'1',url:'javascript:alert(1)',source_url:'https://example.org/source'}],styles:[{style:'Gothic',typology:'Church'}]}},source_catalog:{descriptions:[{},{}],vprg:[{}],styles:[{}]}},
 'enrichment-public/bridge-characteristics.json':{schema_version:1,render_guard:guard,by_gid:{0:{bridge_id:'bridge-a',osm_id:1}},by_bridge_id:{'bridge-a':{id:'bridge-a',material:{code:'03',label:'muratura'},purpose:{code:'04',label:'pedonale'},type:{code:null,label:null},length_m:12,width_m:null,dimensions_method:'derived, not surveyed span',geometry_local:[[[[0,0],[4,0],[4,-2],[0,-2],[0,0]]]],source:{key:'municipal',layer:'PONTE'}}},source:{key:'municipal',portal_url:'https://example.org/bridge',license:null},publication:{geometry_available:true}},
 'enrichment-public/history-registers.json':{schema:1,render_guard:guard,record_count:3,datasets:[{id:'register-1740',year:1740,record_count:2,files:['history-registers/register-1740-000.json']},{id:'register-1808',year:1808,record_count:1,chunks:[{url:'data/enrichment-public/history-registers/register-1808-000.json'}]}],by_gid:{0:[{record_id:'p1',dataset_id:'register-1740',file:'history-registers/register-1740-000.json',offset:0,identity:false},{record_id:'p3',dataset_id:'register-1808',file:'history-registers/register-1808-000.json',offset:0,identity:false}]},publication:{status:'published_on_operator_authorization_rights_unestablished'}},
 'enrichment-public/history-registers/register-1740-000.json':{schema:1,records:[{record_id:'p1',dataset_id:'register-1740',year:1740,attributes:{owner:'Giovanni',parcel:'P. 12',sestiere:'San Marco'}},{record_id:'p2',dataset_id:'register-1740',year:1740,attributes:{owner:'Maria',parcel:'P. 13',sestiere:'San Polo'}}]},
 'enrichment-public/history-registers/register-1808-000.json':{schema:1,records:[{record_id:'p3',dataset_id:'register-1808',year:1808,label:'Anna · particella 1 · San Marco',text:'uid: "p3"\nowner: "Anna"',attributes:{owner:'Anna',parcel:'P. 1',sestiere:'San Marco'}}]}
};
const requests=[];
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><body class="docked"><nav class="bar"></nav><aside class="dock" aria-label="Details"><div id="dock-live"><article class="b-card"><img class="photo"><dl class="facts"><dt>Existing fact</dt></dl><footer class="b-photo-credit">Existing credit</footer></article></div></aside><script type="module">
import {installDataEnrichment} from '/data-enrichment.js';let view='building',language='en',change;window.fly=[];
window.api=installDataEnrichment({dockLive:document.querySelector('#dock-live'),getDockView:()=>view,aimFly:(...a)=>fly.push(a),pickText:o=>typeof o==='string'?o:o[language],onLang:cb=>{change=cb;}});
window.lang=l=>{language=l;change();};
window.card=()=>{view='building';document.querySelector('#dock-live').innerHTML='<article class="b-card"><p>Other card</p></article>';};window.ready=true;</script>`;
const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;requests.push(path);if(path==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(path==='/data/attrs.bin'){res.setHeader('Content-Type','application/octet-stream');res.end(ATTRS);return;}
 if(path==='/data/venezia.json'){res.setHeader('Content-Type','application/json');res.end(CONFIG);return;}
 if(path.startsWith('/data/')){const data=fixtures[path.slice(6)];if(!data){res.writeHead(404).end();return;}res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));return;}
 if(['/data-enrichment.js','/data-enrichment.css','/styles.css'].includes(path)){res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(readFileSync(resolve('web',path.slice(1))));return;}res.writeHead(404).end();});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,timeout:15000});
try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.ready);
 // Race: asynchronous enrichment must not touch a replacement card.
 await page.evaluate(()=>{window.pending=api.enrichCard(0);card();});await page.evaluate(()=>pending);
 assert.equal(await page.locator('.data-enrichment-card').count(),0);
 await page.reload();await page.waitForFunction(()=>window.ready);await page.evaluate(()=>api.enrichCard(0));
 assert.equal(await page.locator('.photo').count(),1);assert.equal(await page.locator('.facts').count(),1);assert.equal(await page.locator('script').count(),1);
 const text=await page.locator('.data-enrichment-card').textContent();
 assert.match(text,/Palazzo originale <script>evil\(\)<\/script>/);
 assert.match(text,/12 A/);
 assert.match(text,/12 m/);
 assert.match(text,/muratura/);assert.match(text,/pedonale/);
 assert.match(text,/derived, not surveyed span/);
 assert.equal(await page.locator('a[href="https://example.org/bridge"]').count(),1,'top-level municipal source provenance must resolve');
 assert.match(text,/Nota italiana/);
 assert.match(text,/schedato/);
 assert.match(text,/Text withheld/);assert.doesNotMatch(text,/DO NOT PUBLISH/);
 assert.match(text,/Gothic/);
 assert.match(text,/source.*language.*unknown/i);
 await page.evaluate(()=>api.focusAddress({x:2,z:3}));
 assert.deepEqual(await page.evaluate(()=>fly[0]),[2,3,420],'host aimFly requires finite flight distance');
 assert.equal(await page.locator('a[href^="javascript:"]').count(),0);
 assert.ok(await page.locator('.b-photo-credit').evaluate(e=>e.previousElementSibling.classList.contains('data-enrichment-card')),'credit remains last');
 assert.equal(requests.filter(p=>p.includes('/history-registers/')).length,0,'card stays lazy until the reader asks');
 await page.locator('[data-de-card-history]').click();
 await page.waitForFunction(()=>document.querySelector('[data-de-card-history-list]')?.children.length===2);
 const records=await page.locator('[data-de-card-history-list]').textContent();
 assert.match(records,/Giovanni/);assert.match(records,/Anna/);
 assert.match(records,/P\. 12/);
 assert.equal(await page.locator('[data-de-card-history]').count(),0,'the button yields to the loaded records');
 await page.evaluate(()=>lang('ru'));await page.waitForFunction(()=>document.querySelector('.data-enrichment-card h3')?.textContent.includes('Данные'));
 await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('.data-enrichment-card').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({fixtureOnly:true,raceSafe:true,lazyChunks:true,publishedProseShown:true,registerRecordsInCard:true,languages:['en','ru'],pageErrors:errors,'requests:chunks':requests.filter(p=>p.includes('/history-registers/')).length}));
}finally{await browser.close();await new Promise(r=>server.close(r));}