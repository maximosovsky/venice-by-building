// Real-data integration smoke; Chromium software WebGL works without a GPU.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('web');
const remote = process.argv[2];
const data = JSON.parse(readFileSync(resolve(root, 'data/bridge-route.json'), 'utf8'));
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
 await page.goto(base+'?lang=ru',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(() => typeof document.querySelector('.walks-open')?.onclick === 'function', null, {timeout:120000});
 await page.locator('.walks-open').click();
 await page.locator('[data-bridge-route-open]').click();
 await page.locator('[data-bridge-route-toggle]').waitFor({timeout:30000});
 const panel=page.locator('.bridge-route-page');
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
  assert.ok((await panel.innerText()).includes(data.euler.explanation[lang]));
  assert.ok((await panel.innerText()).includes(data.audit.crossing_model_limitation[lang]));
 }
 const response=await page.request.get(base+'data/bridge-route.gpx');
 assert.equal(response.status(),200); assert.ok((await response.text()).replace(/\r\n/g,'\n') === readFileSync(resolve(root,'data/bridge-route.gpx'),'utf8').replace(/\r\n/g,'\n'), 'live GPX equals local after Git line-ending normalization');
 assert.deepEqual(errors,[]);
 const screenshot='C:/Users/1/AppData/Local/hermes/cache/scratch/venice-bridge-route-verified.png';
 await page.screenshot({path:screenshot});
 console.log(JSON.stringify({base,bridges:data.bridge_count,crossings:data.crossings.length,distance_m:data.distance_m,pageErrors:errors,toggle:true,selectedCrossing:true,languages:['ru','it','en'],gpxVerified:true,screenshot}));
} finally {await browser.close();if(server)await new Promise(r=>server.close(r));}
