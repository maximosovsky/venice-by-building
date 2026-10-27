import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
let failures=0;
const root=new URL('../web/',import.meta.url);
async function fixture({reduce=false, saved=true}={}) {
 const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:reduce?'reduce':'no-preference'});
 await p.route('http://splash.test/**',async route=>{
  const pathname=new URL(route.request().url()).pathname;
  if(pathname==='/')return route.fulfill({contentType:'text/html',body:`<body class="splash-variant-3"><header><img class="venice-arms" src="img/Venice-1642.png"></header><div id="loading" hidden><span id="progress">100</span></div></body>`});
  if(pathname.startsWith('/data/'))return route.fulfill({contentType:'application/json',body:'{"stats":{"objects":10}}'});
  const file=new URL('.'+pathname,root); if(fs.existsSync(file))return route.fulfill({path:file.pathname.replace(/^\/([A-Z]:)/,'$1')});
  return route.fulfill({status:404,body:''});
 });
 await p.goto('http://splash.test/');
 await p.addStyleTag({path:new URL('styles.css',root).pathname.replace(/^\/([A-Z]:)/,'$1')});
 await p.addStyleTag({path:new URL('splash-variants.css',root).pathname.replace(/^\/([A-Z]:)/,'$1')});
 await p.evaluate(saved=>{if(saved)localStorage.setItem('venice-emblem-pos','{"x":7,"y":13}');window.__dbg={uniforms:{},labelGroup:{visible:true,parent:{traverse(cb){for(let i=0;i<12;i++)cb({isMesh:true,material:{uniforms:{uBorn:{value:1+i/10}}}})}}}};},saved);
 for(const f of ['reveal.js','splash3-emblem.js','splash-variants.js','draggable-emblem.js'])if(fs.existsSync(new URL(f,root)))await p.addScriptTag({url:f});
 await p.evaluate(()=>Promise.all(['layers.json','attrs.bin','pack0.bin','pack1.bin','land.bin','water.bin','context.bin','labels.json','names.json','wiki.json','heritage.json','quests.json'].map(f=>fetch('data/'+f))));
 return p;
}
async function test(name,fn){try{await fn();console.log('PASS',name)}catch(e){failures++;console.error('FAIL',name,e.message)}}
await test('accepted reveal holds map during pending clock',async()=>{
 const p=await fixture();await p.waitForFunction(()=>__veniceReveal.state==='pending');
 const v=await p.evaluate(()=>({progress:__veniceReveal.progress,opacity:getComputedStyle(document.querySelector('#map-layer')).opacity}));
 assert.equal(v.progress,0,'progress must be zero before slow clock starts');assert.equal(+v.opacity,1);await p.close();
});
await test('same emblem is transparent, map-aligned, responsive and does not restore/write saved position',async()=>{
 const p=await fixture();await p.waitForTimeout(50);
 assert.equal(await p.locator('.venice-arms').getAttribute('src'),'img/Venice-1642.png');
 assert.equal(await p.locator('.venice-arms').evaluate(e=>getComputedStyle(e).filter),'none');
 assert.deepEqual(fs.readFileSync(new URL('img/Venice-1642.png',root)),fs.readFileSync(new URL('../Venice-1642.png',root)));
 for(const [width,height] of [[1440,900],[390,844],[844,390],[320,640],[2560,1080],[240,320],[900,200]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(20);
  const v=await p.evaluate(()=>{const e=document.querySelector('.venice-arms'),r=e.getBoundingClientRect();return {opacity:+getComputedStyle(e).opacity,r:{x:r.x,y:r.y,width:r.width,height:r.height},state:window.__splash3Emblem?.geometry,saved:localStorage.getItem('venice-emblem-pos')}});
  assert.ok(v.state,'scoped handoff geometry exists'); assert.equal(v.saved,'{"x":7,"y":13}');
  const g=v.state; assert.ok(Math.abs(v.r.x-g.left)<.1);assert.ok(Math.abs(v.r.y-g.top)<.1);
  assert.ok(v.r.x>=-1&&v.r.y>=-1&&v.r.x+v.r.width<=width+1&&v.r.y+v.r.height<=height+1,JSON.stringify(v));
 }
 await p.close();
});
await test('input cancels pending reveal permanently, handoff survives removal and drag persists only after movement',async()=>{
 const p=await fixture();await p.waitForFunction(()=>__veniceReveal.state==='pending');await p.keyboard.press('Escape');await p.waitForTimeout(1200);
 const v=await p.evaluate(()=>({mode:__veniceReveal.mode,map:!!document.querySelector('#map-layer'),alpha:+getComputedStyle(document.querySelector('.venice-arms')).opacity,pos:localStorage.getItem('venice-emblem-pos')}));
 assert.equal(v.mode,'run');assert.equal(v.map,false);assert.equal(v.alpha,1);assert.equal(v.pos,'{"x":7,"y":13}');
 const box=await p.locator('.venice-arms').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();assert.equal(await p.evaluate(()=>localStorage.getItem('venice-emblem-pos')),'{"x":7,"y":13}');
 await p.mouse.down();await p.mouse.move(box.x+box.width/2-35,box.y+box.height/2+20,{steps:5});await p.mouse.up();assert.notEqual(await p.evaluate(()=>localStorage.getItem('venice-emblem-pos')),'{"x":7,"y":13}');await p.close();
});
await test('reduced motion instant handoff',async()=>{const p=await fixture({reduce:true});await p.waitForTimeout(1400);assert.equal(await p.locator('#map-layer').count(),0);assert.equal(await p.locator('.venice-arms').evaluate(e=>+getComputedStyle(e).opacity),1);await p.close()});
await test('resize after drag keeps entire emblem inside new viewport without overwriting saved position',async()=>{
 const p=await fixture({reduce:true});await p.waitForFunction(()=>__splash3Emblem.released);
 const box=await p.locator('.venice-arms').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2-20,box.y+box.height/2+10);await p.mouse.up();
 const saved=await p.evaluate(()=>localStorage.getItem('venice-emblem-pos'));
 for(const [width,height] of [[390,844],[844,390],[240,200]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(60);const r=await p.locator('.venice-arms').boundingBox();
  assert.ok(r.x>=-.1&&r.y>=-.1&&r.x+r.width<=width+.1&&r.y+r.height<=height+.1,JSON.stringify(r));
 }
 assert.equal(await p.evaluate(()=>localStorage.getItem('venice-emblem-pos')),saved);await p.close();
});
await test('22 second incomplete-loading fallback releases map and emblem together',async()=>{
 const p=await fixture();await p.evaluate(()=>{window.__dbg=null;performance.now=()=>23001;});await p.waitForTimeout(1000);
 assert.equal(await p.locator('#splash').count(),0);assert.equal(await p.locator('#map-layer').count(),0);
 assert.equal(await p.evaluate(()=>__splash3Emblem.released),true);await p.close();
});
await browser.close();if(failures)process.exitCode=1;
