// Real local historical data smoke; no fixtures or production/UI changes.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const index=JSON.parse(readFileSync('web/data/history-registers.json','utf8'));
const requests=[];
const html=`<!doctype html><meta charset="utf-8"><div id="dock-live"></div><script type="module">
import {installDataEnrichment} from '/data-enrichment.js';let view='data';
window.api=installDataEnrichment({dockLive:document.querySelector('#dock-live'),getDockView:()=>view,openDock:(v,h)=>{view=v;document.querySelector('#dock-live').innerHTML=h;},pickText:o=>typeof o==='string'?o:o.en});window.ready=true;</script>`;
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname;requests.push(p);if(p==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}if(!/^\/(?:data\/[a-z0-9./-]+|data-enrichment\.(?:js|css))$/.test(p)){res.writeHead(404).end();return;}try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'application/json');res.end(readFileSync(resolve('web',p.slice(1))));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,timeout:15000});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.ready);await page.evaluate(()=>api.showData());
 assert.equal(await page.locator('[data-de-dataset] option').count(),6);
 assert.equal(requests.filter(p=>p.startsWith('/data/history-registers/')).length,0);
 const result=[];
 for(const dataset of index.datasets){
  await page.locator('[data-de-dataset]').selectOption(dataset.id);
  await page.waitForFunction(n=>document.querySelector('[data-de-status]').textContent.includes(`${n} / ${n}`),dataset.record_count,{timeout:120000});
  result.push({id:dataset.id,records:dataset.record_count});
 }
 const first=JSON.parse(readFileSync('web/data/'+index.datasets[4].files[0],'utf8')).records[0];
 await page.locator('[data-de-search]').fill(first.attributes.LAST_N);
 await page.waitForFunction(s=>document.querySelector('[data-de-results]').textContent.includes(s),first.attributes.LAST_N);
 assert.match(await page.locator('.data-enrichment-page').textContent(),/blocked_pending_rights_confirmation/);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({realLocalData:true,catalogs:result,selectedYearLazyChunks:true,originalTextSearch:true,rightsTransparent:true,pageErrors:errors,limitation:'Host does not enforce render hash guard or publication gate; metadata and producer verification only.'}));
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
