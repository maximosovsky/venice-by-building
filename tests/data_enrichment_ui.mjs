import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const moduleURL=new URL('../web/data-enrichment.js',import.meta.url);
test('additive enrichment module exists',()=>assert.ok(existsSync(moduleURL),'missing requested enrichment feature'));
if(existsSync(moduleURL)) {
 const {queryAddressRecords,safeSourceURL,recordsForGid,historyChunks,declaredCount,installDataEnrichment,catalogCounts,queryHistoryRecords,DATA_URLS,verifyRenderGuard,guardAssociations}=await import(moduleURL);
 test('deployment URLs never request local-only prepared assets',()=>{for(const url of Object.values(DATA_URLS))assert.ok(url.startsWith('data/enrichment-public/'));});
 test('real WebCrypto hashes fail closed and preserve independent address search',async()=>{
  const bytes=new TextEncoder().encode('actual render');
  const digest=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
  const guard={attrs_sha256:digest,config_sha256:digest};
  const fetchData=async()=>({ok:true,arrayBuffer:async()=>bytes.buffer});
  assert.equal(typeof verifyRenderGuard,'function');
  assert.equal(await verifyRenderGuard({render_guard:guard},{fetchData}),true);
  const stale={schema:1,record_count:42,by_gid:{0:[{id:'wrong'}]},records:[{id:'independent',gid:0}],render_guard:{...guard,attrs_sha256:'0'.repeat(64)}};
  assert.equal(await verifyRenderGuard(stale,{fetchData}),false);
  const safe=await guardAssociations(stale,{fetchData});
  assert.deepEqual(recordsForGid(safe,0),[]);
  assert.equal(declaredCount(safe),42);
  assert.equal(safe.records[0].gid,null);
  assert.equal(stale.records[0].gid,0,'guard must not mutate source');
  assert.equal(await verifyRenderGuard({}, {fetchData}),false);
  assert.equal(await verifyRenderGuard({render_guard:guard},{fetchData:async()=>{throw Error('offline');}}),false);
 });
 test('production schemas reconcile exact source counts and every published chunk',()=>{
  const read=name=>JSON.parse(readFileSync(new URL('../web/data/enrichment-public/'+name,import.meta.url),'utf8'));
  const a=read('addresses.json'),e=read('building-evidence.json'),b=read('bridge-characteristics.json'),h=read('history-registers.json');
  assert.equal(declaredCount(a),31623);assert.equal(catalogCounts(e).descriptions,929);assert.equal(catalogCounts(e).vprg,5662);assert.equal(catalogCounts(e).styles,449);
  assert.equal(declaredCount(b),328);const gid=Object.keys(b.by_gid)[0];assert.ok(recordsForGid(b,gid)[0].material);
  assert.equal(declaredCount(h),98613);assert.equal(h.datasets.length,5);assert.equal(h.published_record_count,98613);assert.equal(catalogCounts(e).links,5371);
  for(const dataset of h.datasets){let count=0;const ids=new Set();for(const chunk of historyChunks(h,dataset.id)){assert.ok(chunk.url.startsWith('data/enrichment-public/history-registers/'));const envelope=read(chunk.url.slice('data/enrichment-public/'.length));assert.equal(envelope.schema,1);count+=envelope.records.length;for(const r of envelope.records)ids.add(r.record_id);}assert.equal(count,dataset.record_count);assert.equal(ids.size,count);}
 });
 test('published evidence carries the verbatim source prose, never a withheld placeholder',()=>{
  const e=JSON.parse(readFileSync(new URL('../web/data/enrichment-public/building-evidence.json',import.meta.url),'utf8'));
  const descriptions=e.source_catalog.descriptions;
  assert.equal(descriptions.filter(r=>r.text).length,929);
  assert.ok(descriptions.every(r=>r.text_withheld===false));
  assert.ok(descriptions.some(r=>/Convento/.test(r.text)),'real Italian prose is published');
  const vprg=e.source_catalog.vprg;
  assert.ok(vprg.some(r=>(r.note||r.state)&&/./.test(r.note||r.state)));
 });
 test('published bridge characteristics keep the surveyed footprint geometry',()=>{
  const b=JSON.parse(readFileSync(new URL('../web/data/enrichment-public/bridge-characteristics.json',import.meta.url),'utf8'));
  assert.equal(Object.keys(b.by_bridge_id).length,328);
  assert.equal(b.geometry_frame.crs,'EPSG:32633');
  const withGeometry=Object.values(b.by_bridge_id).filter(r=>Array.isArray(r.geometry_local)&&r.geometry_local.length);
  assert.ok(withGeometry.length>0);
  assert.ok(withGeometry.every(r=>r.geometry_local.every(part=>part.every(ring=>ring.every(([x,z])=>Number.isFinite(x)&&Number.isFinite(z))))));
 });
 test('real bridge gid references resolve municipal record, not reference stub',()=>{
  const record={material:{code:'03',label:'muratura'}};
  assert.deepEqual(recordsForGid({by_gid:{11164:{bridge_id:'d1',osm_id:1}},by_bridge_id:{d1:record}},11164),[record]);
 });
 test('catalog exposes source populations separately from matched groups',()=>{
  assert.equal(typeof catalogCounts,'function');
  assert.deepEqual(catalogCounts({source_catalog:{descriptions:[{},{}],vprg:[{}],styles:[]},by_gid:{2:{}}}),{records:3,groups:1,descriptions:2,vprg:1,styles:0,links:0});
  assert.equal(declaredCount({by_bridge_id:{a:{},b:{}}}),2);
  assert.equal(declaredCount({by_gid:{1:{}}}),null,'groups are not source records');
 });
 test('legacy files and canonical chunks resolve web data paths once',()=>{
  assert.deepEqual(historyChunks({datasets:[{id:'a',files:['history-registers/a-000.json']}]},'a'),[{url:'data/history-registers/a-000.json'}]);
  assert.equal(historyChunks({datasets:[{id:'a',chunks:[{url:'data/history-registers/a-000.json'}]}]},'a')[0].url,'data/history-registers/a-000.json');
 });
 test('history filters real nested original attributes and districts',()=>{
  assert.equal(typeof queryHistoryRecords,'function');
  const records=[{record_id:'0',attributes:{FIRST_N:'Giovanni',DISTRICT:'San Marco'}},{record_id:'1',attributes:{FIRST_N:'Maria',sestiere:'San Polo'}}];
  assert.deepEqual(queryHistoryRecords(records,'giovanni',{area:'San Marco'}),[records[0]]);
  assert.deepEqual(queryHistoryRecords(records,'',{area:'San Polo'}),[records[1]]);
 });
 const addresses={schema:1,records:[{id:'a',label:'San Marco',number:'12',letter:'A',sestiere:'San Marco',gid:0,x:2,z:3},{id:'b',label:'Cannaregio',number:12,letter:null,sestiere:'Cannaregio',gid:null,x:4,z:5}],by_gid:{0:['a']}};
 test('address search preserves original fields, null identity and gid zero',()=>{
  assert.equal(queryAddressRecords(addresses,'san marco 12 a')[0].id,'a');
  assert.equal(queryAddressRecords(addresses,'CANNARÉGIO')[0].gid,null);
  assert.equal(queryAddressRecords(addresses,'').length,0);
  assert.equal(recordsForGid(addresses,0)[0].id,'a');
 });
 test('by_gid supports IDs, indices, inline objects and catalog keys without proximity joins',()=>{
  assert.equal(recordsForGid({...addresses,by_gid:{0:[0]}},0)[0].id,'a');
  assert.deepEqual(recordsForGid({by_gid:{0:{note:'originale'}}},0),[{note:'originale'}]);
  assert.deepEqual(recordsForGid({record_catalog:{p:{id:'p'}},by_gid:{0:['p']}},0),[{id:'p'}]);
  assert.deepEqual(recordsForGid(addresses,999),[]);
 });
 test('unsafe sheet and source links cannot become executable URLs',()=>{
  for(const value of ['javascript:alert(1)','data:text/html,evil','//evil.test','file:///secret',null])assert.equal(safeSourceURL(value),null);
  assert.equal(safeSourceURL('https://example.org/scheda?id=1'),'https://example.org/scheda?id=1');
 });
 test('historical manifests retain real counts and lazy chunk descriptors',()=>{
  assert.equal(declaredCount({record_count:42}),42);assert.equal(declaredCount({}),null);
  assert.equal(historyChunks({datasets:[{id:'1740',year:1740,chunks:[{url:'data/history/1740-0.json',record_count:2}]}]},'1740')[0].url,'data/history/1740-0.json');
 });
 test('every published register population stays downloadable and countable',()=>{
  const read=name=>JSON.parse(readFileSync(new URL('../web/data/enrichment-public/'+name,import.meta.url),'utf8'));
  const h=read('history-registers.json');
  const byId=Object.fromEntries(h.datasets.map(d=>[d.id,d]));
  assert.equal(historyChunks(h,'register-1740').length,32);
  assert.equal(historyChunks(h,'commercial-1857').length,5);
  assert.equal(historyChunks(h,'parcels-1808').length,10);
  assert.equal(byId['register-1740'].publication.published_record_count,32361);
  assert.equal(byId['commercial-1857'].publication.published_record_count,5883);
  assert.equal(catalogCounts({source_catalog:{vprg:[{url:['https://example.org/a','https://example.org/b']},{url:'javascript:bad'}]}}).links,1);
 });
 test('real browser shows published prose, register records and fail-closed guards',async()=>{
  const {chromium}=await import('playwright');
  const {createServer}=await import('node:http');
  const web=new URL('../web/',import.meta.url),requests=[];
  const html=`<!doctype html><meta charset="utf-8"><div id="dock"><article class="b-card"><footer>Existing credit</footer></article></div><script type="module">
   import {installDataEnrichment} from '/data-enrichment.js';let view='building';
   window.api=installDataEnrichment({dockLive:document.querySelector('#dock'),getDockView:()=>view,fetchData:url=>fetch(url+(location.search.includes('bad')?'?bad=1':''))});window.ready=true;
  </script>`;
  const server=createServer((req,res)=>{
   const url=new URL(req.url,'http://localhost');requests.push(url.pathname);
   if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
   const path=url.pathname.slice(1);
   const allowed=['data-enrichment.js','data-enrichment.css','data/attrs.bin','data/venezia.json'].includes(path)||path.startsWith('data/enrichment-public/');
   if(!allowed){res.writeHead(404).end();return;}
   try{let bytes=readFileSync(new URL(path,web));if(url.searchParams.has('bad')&&Object.values(DATA_URLS).includes(path)){const data=JSON.parse(bytes);data.render_guard.attrs_sha256='0'.repeat(64);bytes=Buffer.from(JSON.stringify(data));}
    res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.json')?'application/json':'application/octet-stream');res.end(bytes);
   }catch{res.writeHead(404).end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
   browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const root=`http://127.0.0.1:${server.address().port}/`;
   const e=JSON.parse(readFileSync(new URL(DATA_URLS.evidence,web)));
   const gid=Object.keys(e.by_gid).find(g=>e.by_gid[g].descriptions.length&&e.by_gid[g].vprg.length);
   assert.ok(gid,'production fixture has description and VPRG associations');
   await page.goto(root);await page.waitForFunction(()=>window.ready);
   await page.evaluate(g=>api.enrichCard(g),gid);
   const card=page.locator('.data-enrichment-card');
   const text=await card.textContent();
   assert.ok(!/Text withheld/.test(text),'published prose must not be replaced by a withheld notice');
   assert.ok((await card.locator('.de-record p').first().textContent()).length>40,'verbatim Italian description rendered');
   assert.ok(await card.locator('a[href^="https://www.comune.venezia.it"]').count()>0);
   assert.equal(await card.locator('[data-de-guard]').count(),0);
   const history=JSON.parse(readFileSync(new URL(DATA_URLS.history,web)));
   const historyGid=Object.keys(history.by_gid)[0];
   await page.evaluate(g=>api.enrichCard(g),historyGid);
   await page.locator('[data-de-card-history]').click();
   await page.waitForFunction(()=>{const b=document.querySelector('[data-de-card-history-list]');return b&&b.children.length>0;});
   assert.ok(await page.locator('[data-de-card-history-list] > li.de-record').count()>0,'register records load into the card');
   await page.goto(root+'?bad=1');await page.waitForFunction(()=>window.ready);await page.evaluate(g=>api.enrichCard(g),gid);
   assert.equal(await page.locator('[data-de-guard]').count(),4);
   assert.equal(await page.locator('.data-enrichment-card section').count(),0,'wrong hashes must not display any associated record');
   assert.equal(requests.filter(p=>['/data/addresses.json','/data/building-evidence.json','/data/bridge-characteristics.json','/data/history-registers.json'].includes(p)).length,0);
   assert.deepEqual(errors,[]);
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
 });
 test('address loader is shared and retries after network failure, not fake zero',async()=>{
  let count=0;
  const api=installDataEnrichment({dockLive:null,getDockView:()=>null,pickText:o=>o.en,onLang:()=>{},fetchData:async()=>{count++;if(count===1)throw Error('offline');return {ok:true,json:async()=>addresses};}});
  await assert.rejects(api.queryAddresses('marco'),/offline/);
  const [a,b]=await Promise.all([api.queryAddresses('marco'),api.queryAddresses('12')]);assert.equal(count,2);assert.equal(a.length,1);assert.equal(b.length,2);api.dispose();
 });
}