// Real-data browser smoke. Optional deployed base URL: node tests/church_route_browser.mjs https://site/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('web'),remote=process.argv.slice(2).find(arg=>!arg.startsWith('--'));
const expectUnavailable=process.argv.includes('--expect-unavailable');
const fixturePath=process.argv.find(arg=>arg.startsWith('--fixture-json='))?.slice('--fixture-json='.length);
assert.ok(!(remote&&fixturePath),'test fixtures are local-only; deployed smoke must use real data');
const fixtureData=fixturePath?readFileSync(fixturePath,'utf8'):null;
const server=remote?null:createServer((req,res)=>{
 if(fixtureData&&new URL(req.url,'http://localhost').pathname==='/data/church-route.json'){res.setHeader('Content-Type','application/json');res.end(fixtureData);return;}
 const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const file=path===root?resolve(root,'index.html'):path;const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.gpx':'application/gpx+xml'};res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404).end();}
});
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=(remote||`http://127.0.0.1:${server.address().port}/`).replace(/\/?$/,'/');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],consoleErrors=[],httpErrors=[];
 page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 await page.goto(base+'?lang=ru',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>typeof document.querySelector('.walks-open')?.onclick==='function',null,{timeout:120000});
 await page.locator('.walks-open').click();
 assert.equal(await page.locator('[data-bridge-route-open]').count(),1,'bridge entry preserved');
 assert.equal(await page.locator('[data-church-route-open]').count(),1,'second church route entry exists');
 if(expectUnavailable){
  await page.locator('[data-church-route-open]').click();await page.locator('[data-church-route-retry]').waitFor();
  assert.equal(await page.locator('[data-church-stop]').count(),0);assert.equal(await page.locator('[data-church-route-toggle]').count(),0);
  for(const lang of ['it','en','ru']){await page.locator(`#langs [data-lang="${lang}"]`).click();assert.ok((await page.locator('.church-route-page [role="status"]').innerText()).length>30);}
  assert.deepEqual(errors,[]);const screenshot='C:/Users/1/AppData/Local/hermes/cache/scratch/venice-church-route-unavailable.png';await page.screenshot({path:screenshot});
  console.log(JSON.stringify({base,bridgeEntryPreserved:true,churchEntry:true,failClosed:true,stops:0,pageErrors:errors,consoleErrors,httpErrors,screenshot}));
 }else{
 const response=await page.request.get(base+'data/church-route.json');assert.equal(response.status(),200);const data=await response.json();assert.equal(data.status,'ready');
 await page.locator('[data-church-route-open]').click();await page.locator('[data-church-route-toggle]').waitFor({timeout:30000});
 const panel=page.locator('.church-route-page');assert.equal(await page.locator('[data-church-stop]').count(),data.stops.length);
 const names=await page.locator('.church-stops .church-stop-number').allTextContents();assert.deepEqual(names,data.stops.map((_,i)=>String(i+1)));
 assert.equal(await panel.locator('a[href*="wikipedia.org/wiki/"]').count(),data.stops.length);
 await page.locator('[data-church-route-toggle]').click();assert.equal(await page.locator('[data-church-route-toggle]').getAttribute('aria-pressed'),'true');
 const markerCount=await page.evaluate(()=>window.__dbg.churchRoute.overlay.children.filter(o=>o.userData.stop_id).length);assert.equal(markerCount,data.stops.length);
 const laz=data.stops.findIndex(s=>/lazzaro/i.test(s.id+' '+JSON.stringify(s.name)));assert.ok(laz>=0,'San Lazzaro included in supplied inventory');
 for(const i of [...new Set([0,laz])]){
  await page.locator(`[data-church-stop="${i}"]`).click();assert.equal(await page.locator(`[data-church-stop="${i}"]`).getAttribute('aria-current'),'step');
  await page.waitForFunction(([x,z])=>Math.abs(window.__dbg.controls.target.x-x)<1&&Math.abs(window.__dbg.controls.target.z-z)<1,data.stops[i].local,{timeout:20000});
  const pos=await page.evaluate(id=>{const p=window.__dbg.churchRoute.overlay.children.find(o=>o.userData.stop_id===id);return[p.position.x,p.position.z];},data.stops[i].id);assert.deepEqual(pos,data.stops[i].local);
 }
 for(const lang of ['it','en','ru']){await page.locator(`#langs [data-lang="${lang}"]`).click();assert.ok((await panel.innerText()).includes(data.title[lang]));const note=data.stops[laz].access_note;assert.ok((await panel.innerText()).includes(typeof note==='string'?note:note[lang]));assert.equal(await page.locator(`[data-church-stop="${laz}"]`).getAttribute('aria-current'),'step');}
 await page.locator('[data-church-route-toggle]').click();assert.equal(await page.evaluate(()=>window.__dbg.churchRoute.overlay.visible),false);
 await page.locator('[data-church-route-toggle]').click();assert.equal(await page.evaluate(()=>window.__dbg.churchRoute.overlay.visible),true);
 // Existing optional atlas assets are absent in this checkout. Report them,
 // but never excuse church-route requests, JS errors or WebGL console errors.
 const knownMissing=new Set(['/img/sun.webp','/data/suburbs.json','/data/suburbs.bin']);
 const unrelated404s=httpErrors.filter(e=>e.status===404&&knownMissing.has(new URL(e.url).pathname));
 assert.deepEqual(errors,[]);assert.deepEqual(httpErrors.filter(e=>!unrelated404s.includes(e)),[]);
 const resource404='Failed to load resource: the server responded with a status of 404 (Not Found)';
 assert.deepEqual(consoleErrors.filter(e=>e!==resource404),[]);assert.ok(consoleErrors.length<=unrelated404s.length);
 const screenshot='C:/Users/1/AppData/Local/hermes/cache/scratch/venice-church-route-verified.png';await page.screenshot({path:screenshot});
 console.log(JSON.stringify({base,testFixture:!!fixtureData,stops:data.stops.length,markers:markerCount,bridgeEntryPreserved:true,sanLazzaroIndex:laz,pointFocusVerified:true,languages:['ru','it','en'],pageErrors:errors,consoleErrors,httpErrors,unrelated404s,screenshot}));
 }
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
