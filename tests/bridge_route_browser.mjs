// Real-data integration smoke; Chromium software WebGL works without a GPU.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import { sourcePresentationText, sourcePresentationHref } from '../web/source-presentation.js';
const root = resolve('web');
const remote = process.argv[2];
const original = JSON.parse(readFileSync(resolve(root, 'data/bridge-route.json'), 'utf8'));
const visits = JSON.parse(readFileSync(resolve(root, 'data/bridge-visit-route.json'), 'utf8'));
const data = visits.variants.find(r => r.id === 'traghetto_midpoints');
assert.equal(data.distance_m, 44575.796); assert.equal(data.bridge_count, 346);
assert.equal(data.ferry_events.length, 1); assert.equal(data.ferry_events[0].traghetto_id, 'santa_sofia');
const server = remote ? null : createServer((req,res) => {
  const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!path.startsWith(root)) {res.writeHead(403).end(); return;}
  try {
    const file = path === root ? resolve(root,'index.html') : path;
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.gpx':'application/gpx+xml'};
    res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  } catch {res.writeHead(404).end();}
});
if (server) await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base = remote || `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const failedResources=[]; page.on('response',r=>{if(r.status()>=400) failedResources.push({url:r.url(),status:r.status()});});
 const consoleErrors=[]; page.on('console',m=>{if(m.type()==='error') consoleErrors.push(m.text());});
 const routeResponses=[];
 page.on('response',r=>{if(r.url().endsWith('/data/bridge-visit-route.json')) routeResponses.push(r);});
 await page.goto(base+'?lang=ru',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(() => typeof document.querySelector('.walks-open')?.onclick === 'function', null, {timeout:120000});
 await page.locator('.walks-open').click();
 await page.waitForFunction(title => document.querySelector('.bridge-route-entry')?.textContent.includes(title), data.title.ru, {timeout:30000});
 const cards = await page.locator('.route:not(.bridge-route-entry)').allTextContents();
 assert.ok(cards.length > 0, 'existing church route cards remain');
 const entry = await page.locator('.bridge-route-entry').innerText();
 assert.ok(entry.includes(data.title.ru)); assert.ok(entry.includes('44,6')); assert.ok(entry.includes('346'));
 assert.ok(!entry.includes(original.title.ru));
 await page.locator('[data-bridge-route-open]').click();
 await page.locator('[data-bridge-route-toggle]').waitFor({timeout:30000});
 const panel=page.locator('.bridge-route-page');
 assert.equal(await page.locator('[data-bridge-route-variant]').count(),0);
 assert.equal(await page.locator('a[download]').getAttribute('href'),data.gpx);
 assert.ok((await panel.innerText()).includes(sourcePresentationText(data.source.url,'ru')));
 assert.ok(await panel.locator(`a[href="${sourcePresentationHref(data.source.url)}"]`).count() > 0);
 assert.ok(routeResponses.length > 0); assert.deepEqual(await routeResponses.at(-1).json(),visits,'actual UI-loaded variant source equals emitted JSON');
 const boat = data.legs.filter(l=>l.mode==='boat');
 assert.equal(boat.length,1); assert.equal(boat[0].traghetto_id,data.ferry_events[0].traghetto_id);
 const station = visits.traghetti.find(t=>t.id===boat[0].traghetto_id);
 const boatCoordinates = [...boat[0].coordinates].sort(), sourceCoordinates = [...station.coordinates].sort();
 assert.equal(boatCoordinates.length,sourceCoordinates.length);
 assert.ok(boatCoordinates.every((p,i)=>p.every((v,j)=>Math.abs(v-sourceCoordinates[i][j]) < 1e-12)), 'boat event uses source Santa Sofia geometry (floating-point serialization tolerance only)');
 assert.ok((await panel.innerText()).includes(station.source.url));
 assert.equal(await page.locator('[data-crossing]').count(),data.crossings.length);
 assert.ok((await panel.innerText()).includes(String(data.bridge_count)));
 await page.locator('[data-bridge-route-toggle]').click();
 assert.equal(await page.locator('[data-bridge-route-toggle]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-crossing="2"]').click();
 assert.equal(await page.locator('[data-crossing="2"]').getAttribute('aria-current'),'step');
 await page.locator('[data-bridge-route-toggle]').click();
 assert.equal(await page.locator('[data-bridge-route-toggle]').getAttribute('aria-pressed'),'false');
 for (const lang of ['it','en','ru']) {
  await page.locator(`#langs [data-lang="${lang}"]`).click();
  const body=await panel.innerText();
  assert.ok(body.includes(data.title[lang])); assert.ok(body.includes(sourcePresentationText(data.audit.limitations[lang],lang)));
  assert.ok(!body.includes(original.title[lang])); assert.ok(!body.includes(visits.variants[0].title[lang]));
  assert.ok(!body.includes(data.euler.explanation[lang]));
  await page.locator('[data-bridge-traghetti-toggle]').click();
  assert.equal(await page.locator('[data-bridge-traghetti-toggle]').getAttribute('aria-pressed'),'true');
  assert.ok((await page.locator('[data-bridge-traghetti-toggle]').innerText()).includes('Traghetto'));
  await page.locator('[data-bridge-traghetti-toggle]').click();
  assert.equal(await page.locator('[data-bridge-traghetti-toggle]').getAttribute('aria-pressed'),'false');
 }
 const response=await page.request.get(base+data.gpx);
 assert.equal(response.status(),200); assert.ok((await response.text()).replace(/\r\n/g,'\n') === readFileSync(resolve(root,data.gpx),'utf8').replace(/\r\n/g,'\n'), 'live ferry GPX equals local after Git line-ending normalization');
 await page.locator('[data-bridge-traghetti-toggle]').click();
 assert.equal(await page.locator('[data-bridge-traghetti-toggle]').getAttribute('aria-pressed'), 'true');
 const visitGPX=await page.request.get(base+'data/bridge-visit-route.gpx');
 assert.equal(visitGPX.status(),200);
 assert.ok((await visitGPX.text()).replace(/\r\n/g,'\n') === readFileSync(resolve(root,'data/bridge-visit-route.gpx'),'utf8').replace(/\r\n/g,'\n'));
 assert.deepEqual(errors,[]);
 const knownMissing = new Set(['/img/sun.webp','/data/suburbs.json','/data/suburbs.bin']);
 assert.ok(failedResources.every(r=>r.status===404 && knownMissing.has(new URL(r.url).pathname)),JSON.stringify(failedResources));
 assert.equal(consoleErrors.length,failedResources.length,'only the explicitly enumerated unrelated missing assets may log errors');
 assert.ok(consoleErrors.every(m=>m.includes('404 (Not Found)')),JSON.stringify(consoleErrors));
 const screenshot='C:/Users/1/AppData/Local/hermes/cache/scratch/venice-bridge-route-verified.png';
 await page.screenshot({path:screenshot});
 await page.locator('.walks-open').click();
 assert.deepEqual(await page.locator('.route:not(.bridge-route-entry)').allTextContents(),cards,'church cards unchanged after bridge interactions');
 assert.ok((await page.locator('.bridge-route-entry').innerText()).includes(data.title.ru));
 console.log(JSON.stringify({base,variant:data.id,bridges:data.bridge_count,crossings:data.crossings.length,nodes:data.local.length,distance_m:data.distance_m,ferryEvents:data.ferry_events.length,boatSource:station.id,pageErrors:errors,unrelatedMissingAssets:failedResources,toggle:true,selectedCrossing:true,languages:['ru','it','en'],gpxVerified:true,churchCardsUnchanged:true,screenshot}));
} finally {await browser.close();if(server)await new Promise(r=>server.close(r));}
