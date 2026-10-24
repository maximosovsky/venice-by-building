// Real Venice app and real emitted datasets; optional argv[2] deployed URL.
// No substitute payloads. Only the dedicated failure test returns HTTP 503.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('web'),remote=process.argv[2];
const server=remote?null:createServer((req,res)=>{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const f=path===root?resolve(root,'index.html'):path;res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[extname(f)]||'application/octet-stream');res.end(readFileSync(f));}catch{res.writeHead(404).end();}});
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=new URL(remote||`http://127.0.0.1:${server.address().port}/`).href;
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],missing=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});page.on('request',r=>requests.push(r.url()));
 await page.goto(base+'?lang=en',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>!!window.__dbg&&typeof document.querySelector('.data-open')?.onclick==='function',null,{timeout:120000});
 const paths=await page.evaluate(async()=> (await import('./data-enrichment.js')).DATA_URLS);
 const get=async k=>{const r=await page.request.get(new URL(paths[k],base).href);assert.equal(r.status(),200);return r.json();};
 const addresses=await get('addresses'),evidence=await get('evidence'),bridges=await get('bridges'),history=await get('history');
 assert.equal(addresses.records.length,31623);assert.equal(evidence.source_catalog.descriptions.length,929);assert.equal(evidence.source_catalog.vprg.filter(r=>r.url).length,5371);assert.equal(bridges.record_count,328);assert.equal(history.record_count,98613);
 await page.locator('.walks-open').click();await page.waitForSelector('[data-bridge-route-open]');await page.waitForSelector('[data-church-route-open]');
 const routesBefore=await page.locator('.route').allTextContents();
 await page.locator('.data-open').click();await page.waitForFunction(()=>document.querySelector('[data-de-catalog="history"] summary')?.textContent.includes('98613')).catch(async e=>{console.error(await page.locator('#dock-live').textContent(),errors);throw e;});
 assert.equal(await page.locator('.data-open').getAttribute('aria-pressed'),'true');
 assert.match(await page.locator('[data-de-catalog="addresses"] summary').textContent(),/31623/);
 assert.match(await page.locator('[data-de-catalog="evidence"]').textContent(),/929/);
 assert.match(await page.locator('[data-de-catalog="bridges"] summary').textContent(),/328/);
 const chunkRequests=()=>requests.filter(u=>/\/history-registers\//.test(new URL(u).pathname));
 assert.equal(chunkRequests().length,0,'catalog must not eagerly load archival chunks');
 assert.equal(await page.locator('[data-de-dataset] option').count(),history.datasets.length+1);
 await page.locator('[data-de-dataset]').selectOption('register-1740');
 await page.waitForFunction(()=>document.querySelector('[data-de-status]')?.textContent.includes('32361'));
 assert.equal(chunkRequests().length,0,'rights-blocked 1740 must not fetch raw chunks');
 assert.equal(await page.locator('[data-de-results] li').count(),0);
 await page.locator('[data-de-dataset]').selectOption('people-1808');
 await page.waitForFunction(()=>document.querySelector('[data-de-status]')?.textContent.startsWith('12277 / 12277'),null,{timeout:120000});
 assert.equal(chunkRequests().length,history.datasets.find(d=>d.id==='people-1808').chunks.length);
 const sample=await page.locator('[data-de-results] li').first().textContent();
 const uid=sample.match(/uid:\s*(\d+)/)?.[1];assert.ok(uid,'actual historical record contains its original UID');
 await page.locator('[data-de-search]').fill(uid);
 assert.ok((await page.locator('[data-de-results]').textContent()).includes(uid),'real selected-register text filter works');
 await page.locator('[data-de-dataset]').selectOption('');
 for(const [lang,label]of Object.entries({ru:'Данные и реестры',it:'Dati e registri',en:'Data and registers'})){
  await page.locator(`#langs [data-lang="${lang}"]`).click();assert.equal(await page.locator('.data-open').textContent(),label);assert.equal(await page.locator('#dock-title').textContent(),label);assert.equal(await page.locator('#dock').getAttribute('aria-label'),label);
 }
 await page.locator('.data-open').click();assert.equal(await page.locator('#dock').isHidden(),true);assert.equal(await page.locator('.data-open').getAttribute('aria-pressed'),'false');
 // Actual sestiere code + civic number query. Source point is NOT a verified entrance.
 const address=addresses.records.find(r=>r.sestiere==='CN'&&r.number===10);
 assert.ok(address);await page.locator('#find').fill('CN 10');
 await page.waitForFunction(()=>[...document.querySelectorAll('#find-results [role="option"]')].some(e=>e.querySelector('small')?.textContent==='Addresses'));
 assert.ok((await page.locator('#find-results').textContent()).includes(address.label));
 const addressOption=page.locator('#find-results [role="option"]').filter({has:page.locator('small',{hasText:/^Addresses$/})}).filter({hasText:address.label}).first();
 await addressOption.dispatchEvent('pointerdown');await page.waitForFunction(()=>document.querySelector('#find-results').hidden);
 await page.waitForFunction(({x,z})=>Math.hypot(window.__dbg.controls.target.x-x,window.__dbg.controls.target.z-z)<1,{x:address.x,z:address.z},{timeout:15000});
 assert.equal(await page.locator('.b-card').count(),0,'even a matched address does not auto-open a building');
 await page.locator('#find').fill('Palazzo Soranzo');await page.waitForFunction(()=>document.querySelector('#find-results')?.textContent.includes('Palazzo Soranzo'));
 assert.ok((await page.locator('#find-results [role="option"] small').allTextContents()).some(s=>s.startsWith('Building')),'existing building search remains available');await page.locator('#find').press('Escape');
 // Real multi-dataset joined card selected from emitted joins and loaded photo.
 const gid=7423;assert.ok(addresses.by_gid[gid]&&evidence.by_gid[gid]&&history.by_gid[gid]);
 await page.evaluate(g=>window.__dbg.openBuilding(g),gid);
 await page.waitForFunction(()=>!!document.querySelector('.data-enrichment-card')&&!document.querySelector('[data-de-card-loading]'));
 assert.match(await page.locator('.data-enrichment-card').textContent(),/Addresses/);assert.match(await page.locator('.data-enrichment-card').textContent(),/Historical notes/);assert.match(await page.locator('.data-enrichment-card').textContent(),/Historical registers/);
 assert.ok((await page.locator('.data-enrichment-card').textContent()).includes('Gothic'));
 assert.equal(await page.locator('.b-photo img').evaluate(e=>e.complete&&e.naturalWidth>0),true);
 const existingCard=await page.locator('.b-card').evaluate(e=>{const c=e.cloneNode(true);c.querySelector('.data-enrichment-card')?.remove();return c.innerHTML;});
 const checkFooter=()=>page.locator('.b-card').evaluate(e=>e.lastElementChild.classList.contains('b-photo-credit')&&e.firstElementChild.classList.contains('b-photo'));
 assert.equal(await checkFooter(),true);
 for(const [lang,label]of Object.entries({it:'Dati e registri',ru:'Данные и реестры',en:'Data and registers'})){
  await page.locator(`#langs [data-lang="${lang}"]`).click();await page.waitForFunction(label=>document.querySelector('.data-enrichment-card h3')?.textContent===label&&!document.querySelector('[data-de-card-loading]'),label);assert.equal(await page.locator('.data-enrichment-card').count(),1);assert.equal(await checkFooter(),true);
 }
 assert.equal(await page.locator('.b-card').evaluate(e=>{const c=e.cloneNode(true);c.querySelector('.data-enrichment-card')?.remove();return c.innerHTML;}),existingCard,'host photo/facts/extract/footer unchanged after language round-trip');
 await page.locator('.data-open').click();assert.equal(await page.evaluate(()=>window.__dbg.uniforms.uSelected.value),-1,'opening catalog unpins building');
 const bridgeGid=Number(Object.keys(bridges.by_gid)[0]);await page.evaluate(g=>window.__dbg.openBuilding(g),bridgeGid);await page.waitForFunction(()=>document.querySelector('.data-enrichment-card')?.textContent.includes('Bridge characteristics')&&!document.querySelector('[data-de-card-loading]'));
 const vprgGid=Number(Object.keys(evidence.by_gid).find(g=>evidence.by_gid[g].vprg?.some(r=>r.url)));await page.evaluate(g=>window.__dbg.openBuilding(g),vprgGid);await page.waitForFunction(()=>!!document.querySelector('.data-enrichment-card a[href*="VPRG_Citta_Antica/Scheda"]'));
 await page.setViewportSize({width:390,height:844});
 await page.locator('.data-open').click();await page.waitForSelector('.data-enrichment-page');
 assert.ok(await page.locator('.data-enrichment-page').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'mobile catalog fits sheet');
 await page.locator('.data-open').scrollIntoViewIfNeeded();assert.equal(await page.locator('.data-open').isVisible(),true);
 const screenshot=resolve(process.env.TMPDIR||'C:/Users/1/AppData/Local/hermes/cache/scratch','venice-data-integration-mobile.png');await page.screenshot({path:screenshot});
 await page.setViewportSize({width:1600,height:1000});await page.locator('.walks-open').click();await page.waitForSelector('[data-bridge-route-open]');await page.waitForSelector('[data-church-route-open]');assert.deepEqual(await page.locator('.route').allTextContents(),routesBefore,'route cards unchanged');
 // Separate clean page must report HTTP failure honestly in existing Find surface.
 const failure=await browser.newPage({viewport:{width:1600,height:1000}});await failure.route('**/addresses.json',r=>r.fulfill({status:503,body:'Unavailable'}));
 await failure.goto(base+'?lang=en',{waitUntil:'networkidle',timeout:120000});await failure.waitForFunction(()=>!!window.__dbg,null,{timeout:120000});await failure.locator('#find').fill('CN 10');await failure.waitForSelector('[data-find-address-status="error"]').catch(async e=>{console.error('FAILURE SEARCH',await failure.locator('#find-results').evaluate(e=>e.outerHTML),await failure.locator('#find').inputValue());throw e;});assert.match(await failure.locator('#find-results').textContent(),/Data unavailable; record count unknown/);assert.doesNotMatch(await failure.locator('#find-results').textContent(),/Nothing with that name/);await failure.close();
 assert.deepEqual(errors,[]);const known=new Set(['/img/sun.webp','/data/suburbs.json','/data/suburbs.bin']);assert.ok(missing.every(r=>r.status===404&&known.has(new URL(r.url).pathname)),JSON.stringify(missing));
 console.log(JSON.stringify({base,realData:true,counts:{addresses:31623,descriptions:929,vprgLinks:5371,bridges:328,history:98613},matchedCard:gid,addressQuery:'CN 10',addressFocusNotEntrance:true,preservedPhotoFactsFooter:true,unchangedRoutes:routesBefore.length,languages:['en','it','ru'],mobile:true,http503Honest:true,lazyHistoryChunks:true,blocked1740NotFetched:true,real1808PeopleSearch:true,pageErrors:errors,unrelatedMissingAssets:missing,screenshot}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
