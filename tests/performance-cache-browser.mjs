import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.VENICE_URL||'http://127.0.0.1:8770';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 for(const kind of (process.env.CACHE_CASE?[process.env.CACHE_CASE]:['absent','rejected','stale'])) {
  const page=await browser.newPage({reducedMotion:'reduce'}),errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
  if(kind==='absent')await page.addInitScript(()=>Object.defineProperty(crypto,'subtle',{value:undefined}));
  if(kind==='rejected')await page.addInitScript(()=>Object.defineProperty(crypto.subtle,'digest',{value:()=>Promise.reject(new Error('controlled digest rejection'))}));
  if(kind==='stale')await page.route('**/data/venezia.json',async r=>{const response=await r.fetch(),data=await response.json();data.cacheTest='controlled stale input';await r.fulfill({response,json:data});});
  await page.goto(base+'/?shot&lang=en',{waitUntil:'domcontentloaded'});
  try{await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:30000});}catch(e){console.log('FAIL',kind,await page.locator('#loading').textContent(),errors);throw e;}
  assert(warnings.some(w=>w.includes('Ground cache fallback')),'cache must fall back, not accept unvalidated bytes');
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>window.__veniceShipsReady.status),'ready');
  console.log('PASS guarded ground fallback',kind);await page.close();
 }
}finally{await browser.close();}
