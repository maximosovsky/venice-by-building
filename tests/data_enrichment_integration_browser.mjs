// Remote smoke for the deployed site: the enrichment must live in cards and on the map,
// never in a separate catalog section. Usage: node tests/data_enrichment_integration_browser.mjs [baseURL]
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2]||'https://venice-by-building.vercel.app/';
const abs=path=>new URL(path,base).href;
const get=path=>fetch(abs(path),{cache:'no-store'}).then(r=>{assert.equal(r.ok,true,`${path} HTTP ${r.status}`);return r.json();});
const head=path=>fetch(abs(path),{cache:'no-store',method:'GET'}).then(r=>r.status);

const addresses=await get('data/enrichment-public/addresses.json');
const evidence=await get('data/enrichment-public/building-evidence.json');
const bridges=await get('data/enrichment-public/bridge-characteristics.json');
const history=await get('data/enrichment-public/history-registers.json');
assert.equal(addresses.records.length,31623);
assert.equal(evidence.source_catalog.descriptions.length,929);
assert.equal(evidence.source_catalog.descriptions.filter(r=>r.text).length,929,'verbatim Italian prose is published');
assert.equal(evidence.source_catalog.vprg.filter(r=>r.url).length,5371);
assert.equal(Object.keys(bridges.by_bridge_id).length,328);
assert.ok(Object.values(bridges.by_bridge_id).some(r=>Array.isArray(r.geometry_local)&&r.geometry_local.length),'surveyed footprint geometry is published');
assert.equal(history.record_count,98613);
assert.equal(history.datasets.length,5);
assert.equal(history.published_record_count,98613);
for (const dataset of history.datasets) assert.equal(dataset.publication.published_record_count,dataset.record_count,`${dataset.id} fully published`);
// Every register population is downloadable, including 1740 and 1857.
for (const id of ['register-1740','commercial-1857','parcels-1808']) {
  const dataset=history.datasets.find(d=>d.id===id);
  assert.ok(dataset.chunks.length>0,`${id} exposes chunks`);
  const first=String(dataset.chunks[0].url);
  assert.ok(first.startsWith('data/enrichment-public/'),`${id} chunk URL stays inside the published projection`);
  assert.equal(await head(first),200,`${id} first chunk served`);
}
// Prepared local-only files must never be served by the deployed host.
const deployed=/^https:\/\//.test(base);
const privacy=[];
for (const path of ['data/addresses.json','data/building-evidence.json','data/bridge-characteristics.json','data/history-registers.json']) {
  const status=await head(path);
  privacy.push({path,status});
  if (deployed) assert.equal(status,404,`${path} must stay private`);
  else assert.ok([200,404].includes(status),`${path} must answer`);
}

const html=await fetch(base).then(r=>r.text());
assert.doesNotMatch(html,/data-open/,'the catalog section must be gone');
assert.match(html,/notes-open/,'the rest of the bar survives');

const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
let report;
try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&/img\/|data\//.test(r.url()))missing.push({url:r.url(),status:r.status()});});
  await page.goto(base,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.__dbg&&typeof window.__dbg.openBuilding==='function',null,{timeout:120000});
  assert.equal(await page.locator('.data-open').count(),0,'no catalog button on the live page');
  // Pin the language so label assertions do not depend on a remembered preference.
  await page.locator('#langs [data-lang="en"]').click();
  await page.waitForTimeout(500);

  const cardGid=Number(Object.keys(evidence.by_gid).find(gid=>evidence.by_gid[gid].descriptions.length&&evidence.by_gid[gid].vprg.length));
  assert.ok(Number.isInteger(cardGid),'a production building carries description and VPRG associations');
  await page.evaluate(gid=>window.__dbg.openBuilding(gid),cardGid);
  await page.waitForFunction(()=>!document.querySelector('[data-de-card-loading]'),null,{timeout:60000});
  const cardText=await page.locator('.data-enrichment-card').textContent();
  assert.doesNotMatch(cardText,/Text withheld/,'published prose must not be replaced by a withheld notice');
  assert.match(cardText,/Original source labels and text/,'the source-language notice is shown');
  assert.ok(await page.locator('.data-enrichment-card .de-record p').first().textContent().then(t=>t.trim().length>40),'real Italian description rendered');
  assert.ok(await page.locator('.data-enrichment-card a[href^="https://www.comune.venezia.it"]').count()>0,'literal VPRG sheet link');

  // A bridge card carries the municipal characteristics.
  const bridgeGid=Number(Object.keys(bridges.by_gid)[0]);
  await page.evaluate(gid=>window.__dbg.openBuilding(gid),bridgeGid);
  await page.waitForFunction(()=>!document.querySelector('[data-de-card-loading]'),null,{timeout:60000});
  const bridgeText=await page.locator('.data-enrichment-card').textContent();
  assert.match(bridgeText,/Material/);assert.match(bridgeText,/Purpose/);assert.match(bridgeText,/Type/);
  assert.match(bridgeText,/not surveyed span or usable width/);
  // The enriched card must fit a phone without horizontal overflow.
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.locator('.data-enrichment-card').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'mobile card has no horizontal overflow');
  await page.setViewportSize({width:1280,height:900});

  // The map draws the municipal footprints and labels them on hover.
  await page.locator('.lenses button[data-mode="3"]').click();
  await page.waitForFunction(()=>window.__dbg.bridgeCharacteristics.manifest!==null||window.__dbg.bridgeCharacteristics.error!==null,null,{timeout:90000});
  const recordCount=await page.evaluate(()=>window.__dbg.bridgeCharacteristics.recordCount);
  assert.ok(recordCount>300,`municipal bridge records loaded on the map (${recordCount})`);
  const summary=await page.evaluate(gid=>window.__dbg.bridgeCharacteristics.summary(gid),bridgeGid);
  assert.match(summary,/muratura|pedonale|ponte/,'bridge tooltip carries material, purpose and type');
  const meshes=await page.evaluate(()=>window.__dbg.bridgeCharacteristics.overlays.length);
  assert.ok(meshes>0,`surveyed footprints drawn on the map (${meshes})`);

  const routes=await page.evaluate(()=>[...document.querySelectorAll('.route')].map(e=>e.textContent.trim().slice(0,60)));
  for (const lang of ['it','en','ru']) {
    await page.locator(`#langs [data-lang="${lang}"]`).click();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.data-open').count(),0);
  }
  assert.deepEqual(errors,[],'no page errors');
  report={base,counts:{addresses:addresses.records.length,descriptions:929,vprgLinks:5371,bridges:328,history:98613,bridgeRecordsOnMap:recordCount,bridgeMeshes:meshes},
    cardGid,bridgeGid,routesUnchanged:routes.length,missingAssets:missing.filter(m=>!['data/suburbs.json','data/suburbs.bin','img/sun.webp'].some(x=>m.url.includes(x))),pageErrors:errors};
} finally { await browser.close(); }
console.log(JSON.stringify(report));