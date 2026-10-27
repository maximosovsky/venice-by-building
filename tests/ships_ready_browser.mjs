import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.VENICE_URL||'http://127.0.0.1:8770';
const out=path.join(process.env.TMPDIR||process.env.LOCALAPPDATA,'venice-ships-readiness');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[];
try {
 for(const entry of ['/', '/splash3.html']) for(const reduce of [true,false]) {
  const label=(entry==='/'?'main':'splash3')+(reduce?'-reduced':'-normal');
  if(process.env.SHIP_CASE && process.env.SHIP_CASE!==label) continue;
  console.log('START',label);
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:reduce?'reduce':'no-preference'});
  const errors=[],requested=[];page.on('pageerror',e=>errors.push(e.message));
  let release;const held=new Promise(resolve=>release=resolve);
  await page.route('**/*_light*.glb*',async route=>{requested.push(route.request().url());if(route.request().url().includes('aleksandr'))await held;await route.continue();});
  await page.goto(base+entry+'?shot&lang=en',{waitUntil:'domcontentloaded'});
  console.log('NAVIGATED',label);
  await page.waitForFunction(()=>window.__dbg?.scene && document.querySelector('#progress')?.textContent==='100',null,{timeout:25000});
  await page.waitForTimeout(Math.max(0,23000-await page.evaluate(()=>performance.now())));
  console.log('HELD',label);
  const pending=await page.evaluate(()=>({ready:document.body.dataset.ready,hidden:document.querySelector('#loading').hidden,splash:!!document.querySelector('#splash'),state:window.__veniceShipsReady,ships:window.__dbg.scene.children.filter(o=>o.userData.isVeniceShip).length,reveal:window.__veniceReveal?.state}));
  assert.notEqual(pending.ready,'1',`${label}: map must not be ready while third real GLB is held beyond old 22s fallback`);
  assert.equal(pending.hidden,false);assert.equal(pending.splash,true);assert.equal(pending.state?.status,'pending');
  assert.equal(requested.length,3,'all GLBs must start concurrently');

  release();
  console.log('RELEASED',label);
  if(!reduce) {
    await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:20000,polling:100});
    await page.waitForTimeout(350);
    await page.keyboard.press('Escape'); // test normal-motion handoff cancellation before expensive city flight
  }
  await page.waitForFunction(()=>document.body.dataset.ready==='1'&&!document.querySelector('#splash')&&!document.querySelector('#map-layer'),null,{timeout:25000});
  console.log('SETTLED',label);
  // Color/picking evidence lives in the independent full-app probe.
  const state=await page.evaluate(()=>({state:window.__veniceShipsReady,loaded:window.__veniceShipsLoaded,visible:getComputedStyle(document.querySelector('#scene')).visibility,reveal:window.__veniceReveal.state}));
  assert.equal(state.state.status,'ready');assert.equal(state.state.gpuPrepared,true);assert.equal(state.state.rendered,true);assert.equal(state.loaded,3);assert.equal(state.visible,'visible');assert.deepEqual(errors,[]);
  reports.push({label,pending,settled:state,requested,errors});console.log('PASS',label,JSON.stringify(state));await page.close();

 }
 for(const entry of ['/','/splash3.html']) {
  if(process.env.SHIP_CASE && process.env.SHIP_CASE!=='failure') continue;
  const page=await browser.newPage({reducedMotion:'reduce'});await page.route('**/aleksandr_optimized_light*.glb*',r=>r.fulfill({status:503,body:'controlled ship failure'}));
  await page.goto(base+entry+'?lang=en',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#loading')?.classList.contains('fatal')&&!document.querySelector('#splash')&&!document.querySelector('#map-layer'),null,{timeout:30000});
  const fail=await page.evaluate(()=>({ready:document.body.dataset.ready,hidden:document.querySelector('#loading').hidden,text:document.querySelector('#loading').textContent,state:window.__veniceShipsReady}));
  assert.notEqual(fail.ready,'1');assert.equal(fail.hidden,false);assert.equal(fail.state.status,'error');assert.match(fail.text,/aleksandr|ship/i);reports.push({entry,fail});console.log('PASS honest model failure',entry,fail.text);await page.close();
 }
 await fs.writeFile(path.join(out,'browser-readiness'+(process.env.SHIP_CASE?'-'+process.env.SHIP_CASE:'')+'.json'),JSON.stringify(reports,null,2));console.log('PASS '+reports.length+' full-app cases; '+out);
} finally {await browser.close();}
