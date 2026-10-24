// Isolated contract fixture; never writes or substitutes production data.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
assert.ok(existsSync('web/data-enrichment.js'),'missing requested enrichment feature');
const fixtures={
 'addresses.json':{schema:1,records:[{id:'a',label:'San Marco',number:12,letter:'A',sestiere:'San Marco',gid:0,x:2,z:3,match:{method:'within'}}],by_gid:{0:['a']}},
 'building-evidence.json':{schema:1,by_gid:{0:{descriptions:[{text:'Palazzo originale <script>evil()</script>',source_id:'municipal',source_url:'https://example.org/source',match:{method:'overlap'}},{text:'DO NOT PUBLISH',text_withheld:true,language:'it'}],vprg:[{note:'Nota italiana',state:'schedato',sheet:'1',url:'javascript:alert(1)',source_url:'https://example.org/source'}],styles:[{style:'Gothic',typology:'Church'}]}},source_catalog:{descriptions:[{},{}],vprg:[{}],styles:[{}]}},
 'bridge-characteristics.json':{schema_version:1,by_gid:{0:{bridge_id:'bridge-a',osm_id:1}},by_bridge_id:{'bridge-a':{id:'bridge-a',material:{code:'03',label:'muratura'},purpose:{code:'04',label:'pedonale'},type:{code:null,label:null},length_m:12,width_m:null,dimensions_method:'derived, not surveyed span',source:{key:'municipal',layer:'PONTE'}}},source:{key:'municipal',portal_url:'https://example.org/bridge',license:null},publication:{actual_geometry:'blocked_pending_municipal_license'}},
 'history-registers.json':{schema:1,record_count:3,datasets:[{id:'1740',year:1740,record_count:2,files:['history/1740-0.json'],license:{redistribution_allowed:false,status:'blocked_pending_rights_confirmation'}},{id:'1808',year:1808,record_count:1,chunks:[{url:'data/history/1808-0.json',record_count:1}]}],by_gid:{0:[{record_id:'p1',dataset_id:'1740',file:'history/1740-0.json',offset:0,identity:false}]},publication:{status:'local_only_rights_blocked',public_release_allowed:false}},
 'history/1740-0.json':[{record_id:'p1',dataset_id:'1740',year:1740,attributes:{owner:'Giovanni',parcel:'P. 12',sestiere:'San Marco'}},{record_id:'p2',dataset_id:'1740',year:1740,attributes:{owner:'Maria',parcel:'P. 13',sestiere:'San Polo'}}],
 'history/1808-0.json':{schema:1,records:[{id:'p3',dataset_id:'1808',year:1808,owner:'Anna',parcel:'P. 1',sestiere:'San Marco'}]}
};
const requests=[];let indexUnavailable=false,slowIndex=false;
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><body class="docked"><nav class="bar"><button class="data-open" data-no-i18n>Data and registers</button></nav><aside class="dock" aria-label="Details"><div id="dock-live"><article class="b-card"><img class="photo"><dl class="facts"><dt>Existing fact</dt></dl><footer class="b-photo-credit">Existing credit</footer></article></div></aside><script type="module">
import {installDataEnrichment} from '/data-enrichment.js';let view='building',language='en',change;window.fly=[];
window.api=installDataEnrichment({dockLive:document.querySelector('#dock-live'),getDockView:()=>view,openDock:(v,h)=>{view=v;document.querySelector('#dock-live').innerHTML=h;},aimFly:(...a)=>fly.push(a),pickText:o=>typeof o==='string'?o:o[language],onLang:cb=>{change=cb;}});
window.lang=l=>{language=l;change();};document.querySelector('.data-open').onclick=()=>api.showData();window.card=()=>{view='building';document.querySelector('#dock-live').innerHTML='<article class="b-card"><p>Other card</p></article>';};window.ready=true;</script>`;
const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;requests.push(path);if(path==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(path.startsWith('/data/')){if(path==='/data/history-registers.json'&&indexUnavailable){res.writeHead(503).end();return;}const data=fixtures[path.slice(6)];if(!data){res.writeHead(404).end();return;}res.setHeader('Content-Type','application/json');setTimeout(()=>res.end(JSON.stringify(data)),path==='/data/history-registers.json'&&slowIndex?800:30);return;}
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
 assert.match(await page.locator('.data-enrichment-card').textContent(),/Palazzo originale <script>evil\(\)<\/script>/);
 assert.match(await page.locator('.data-enrichment-card').textContent(),/12 A/);
 assert.match(await page.locator('.data-enrichment-card').textContent(),/12 m/);
 assert.match(await page.locator('.data-enrichment-card').textContent(),/derived, not surveyed span/);
 assert.equal(await page.locator('a[href="https://example.org/bridge"]').count(),1,'top-level municipal source provenance must resolve');
 assert.match(await page.locator('.data-enrichment-card').textContent(),/Nota italiana/);
 assert.match(await page.locator('.data-enrichment-card').textContent(),/schedato/);
 assert.match(await page.locator('.data-enrichment-card').textContent(),/Text withheld/);assert.doesNotMatch(await page.locator('.data-enrichment-card').textContent(),/DO NOT PUBLISH/);
 assert.match(await page.locator('.data-enrichment-card').textContent(),/Gothic/);
 assert.match(await page.locator('.data-enrichment-card').textContent(),/source.*language.*unknown/i);
 await page.evaluate(()=>api.focusAddress({x:2,z:3}));
 assert.deepEqual(await page.evaluate(()=>fly[0]),[2,3,420],'host aimFly requires finite flight distance');
 assert.equal(await page.locator('a[href^="javascript:"]').count(),0);
 assert.ok(await page.locator('.b-photo-credit').evaluate(e=>e.previousElementSibling.classList.contains('data-enrichment-card')),'credit remains last');
 assert.equal(requests.filter(p=>p.includes('/history/')).length,0,'card and manifest stay lazy');
 await page.evaluate(()=>api.enrichCard(0));assert.equal(await page.locator('.data-enrichment-card').count(),1);
 await page.locator('.data-open').click();await page.waitForSelector('[data-de-dataset]');
 assert.equal(requests.filter(p=>p.includes('/history/')).length,0);
 await page.locator('[data-de-dataset]').selectOption('1740');await page.waitForFunction(()=>document.querySelector('[data-de-status]').textContent.includes('2 / 2'));
 assert.equal(requests.filter(p=>p.includes('1808-0')).length,0);
 await page.locator('[data-de-search]').fill('Giovanni');await page.waitForFunction(()=>document.querySelector('[data-de-results]').textContent.includes('Giovanni'));
 assert.doesNotMatch(await page.locator('[data-de-results]').textContent(),/Maria/);
 await page.locator('[data-de-search]').fill('');await page.locator('[data-de-area]').selectOption('San Polo');
 assert.match(await page.locator('[data-de-results]').textContent(),/Maria/);assert.doesNotMatch(await page.locator('[data-de-results]').textContent(),/Giovanni/);
 assert.match(await page.locator('.data-enrichment-page').textContent(),/blocked_pending_rights_confirmation/);
 assert.match(await page.locator('.data-enrichment-page').textContent(),/not.*identity/i);
 indexUnavailable=true;await page.reload();await page.waitForFunction(()=>window.ready);await page.evaluate(()=>api.showData());
 assert.match(await page.locator('[data-de-catalog="history"]').textContent(),/count unknown/);
 assert.doesNotMatch(await page.locator('[data-de-catalog="history"] summary').textContent(),/0 Records/);
 indexUnavailable=false;await page.locator('[data-de-catalog="history"] summary').click();await page.locator('[data-de-catalog-retry="history"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-de-dataset]').options.length===3);
 slowIndex=true;await page.reload();await page.waitForFunction(()=>window.ready);await page.evaluate(()=>{window.pending=api.enrichCard(0);});
 await page.waitForFunction(()=>document.querySelector('.data-enrichment-card')?.textContent.includes('12 A'));assert.match(await page.locator('.data-enrichment-card').textContent(),/12 A/);
 assert.equal(await page.evaluate(()=>!!document.querySelector('[data-de-card-loading]')),true,'ready sections appear while history index remains pending');
 await page.evaluate(()=>pending);slowIndex=false;
 await page.evaluate(()=>api.showData());
 await page.evaluate(()=>lang('ru'));assert.match(await page.locator('.data-enrichment-page').textContent(),/Данные/);
 await page.evaluate(()=>lang('it'));assert.match(await page.locator('.data-enrichment-page').textContent(),/Dati/);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('.data-enrichment-page').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({fixtureOnly:true,raceSafe:true,lazyChunks:true,filters:true,languages:['en','ru','it'],pageErrors:errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
