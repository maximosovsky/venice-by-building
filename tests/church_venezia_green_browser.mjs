import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://venice-by-building.vercel.app/?lang=ru&shot',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>window.__dbg,null,{timeout:120000});
 await page.locator('.lenses [data-mode="3"]').click();
 await page.waitForFunction(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible),null,{timeout:30000});
 const report=await page.evaluate(()=>{const h=window.__dbg.churchBuildingHighlight;return {matched:h.manifest.matched_stops,colors:[...new Set(h.overlays.filter(m=>m.visible).map(m=>m.material.color.getHexString()))],triangles:h.overlays.reduce((n,m)=>n+m.geometry.index.count/3,0)};});
 assert.deepEqual(report.colors,['436817']);assert.ok(report.triangles>1000);
 await page.locator('.lenses [data-mode="0"]').click();
 assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,tabToggle:true,pageErrors:errors}));
}finally{await browser.close();}
