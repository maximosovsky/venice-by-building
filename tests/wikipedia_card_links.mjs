import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:8873/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto(base+'?lang=ru',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>document.body.dataset.ready==='1'&&window.__dbg,null,{timeout:120000});
 await page.evaluate(()=>window.__dbg.openBuilding(9270));
 const anchor=page.locator('.b-card a').filter({hasText:/^Wikipedia$/});
 assert.equal(await anchor.count(),1,'Wikipedia article link must be restored');
 assert.equal(await anchor.getAttribute('href'),'https://it.wikipedia.org/wiki/Chiesa_di_Santo_Stefano_(Venezia,_San_Marco)');
 assert.equal(await anchor.getAttribute('target'),'_blank');
 assert.equal(await page.locator('.b-card .b-photo-credit').count(),1);
 assert.equal(await page.locator('.b-card section.sources').count(),0,'do not restore the removed sources block');
 console.log('PASS Wikipedia link restored; photo credits and card structure preserved',base);
}finally{await browser.close()}
