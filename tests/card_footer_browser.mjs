import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('https://venice-by-building.vercel.app/?lang=ru&shot',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>window.__dbg);
let verified=0;
for(const lang of ['ru','it','en']){
await page.locator(`#langs [data-lang="${lang}"]`).click();
await page.evaluate(()=>window.__dbg.openBuilding(9029));
assert.equal(await page.locator('.b-card .sources').count(),0);
assert.equal(await page.locator('.b-photo figcaption').count(),0);
assert.ok(await page.locator('.b-photo-credit').count());
assert.equal(await page.locator('.b-card').evaluate(el=>el.lastElementChild.className),'b-photo-credit');
await page.evaluate(()=>window.__dbg.showStory(window.__dbg.layers.find(l=>l.id==='works')));
assert.equal(await page.locator('#dock-live .caveat').count(),0);assert.equal(await page.locator('#dock-live .src').count(),0);verified++;
}
assert.deepEqual(errors,[]);console.log(JSON.stringify({languages:verified,photoAtBottom:true,removedSources:true,removedBridgeCopy:true,pageErrors:errors}));
}finally{await browser.close();}
