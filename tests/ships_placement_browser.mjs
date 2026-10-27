// Focused approved-composition acceptance: actual atlas/GLBs, legacy storage,
// geographic projection, world bounds, drag/rotate/save, and reload persistence.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base = process.env.VENICE_URL || 'http://127.0.0.1:8770';
const out = path.join(process.env.TMPDIR, 'venice-ships-placement');
await fs.mkdir(out, { recursive: true });
const expected = { mini_pirate: [-72.877, 308.991, .35, 12.3379, 45.4312, 50], ship_r: [-640.420, 657.181, -.22, 12.3308, 45.4279, 45], aleksandr: [328.987, 233.317, -Math.PI / 4, 12.3430, 45.4320, 60] };
const legacy = JSON.stringify({mini_pirate:{x:-200,z:200,rotY:-1},ship_r:{x:-280,z:260,rotY:-1.4},aleksandr:{x:-120,z:140,rotY:-.78}});
const browser = await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports = [];
async function ready(page) { await page.waitForFunction(() => window.__veniceShipsReady?.status === 'ready' && !document.querySelector('#splash'), null, {timeout:60000}); }
try {
 for (const label of ['fresh','legacy']) {
  const context = await browser.newContext({viewport:{width:1600,height:1000}, reducedMotion:'reduce'});
  if(label==='legacy') await context.addInitScript(value => {if(!localStorage.getItem('venice-ships-pos')) localStorage.setItem('venice-ships-pos',value);}, legacy);
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base+'/?shot', {waitUntil:'domcontentloaded'}); await ready(page);
  const data = await page.evaluate(async expected => {
   const T = await import('./vendor/three.module.js'), {localPoint} = await import('./church-route.js');
   const {scene,camera,controls} = window.__dbg;
   controls.enableDamping=false; controls.target.set(-130,0,370); camera.position.set(-130,1050,1100);camera.lookAt(controls.target);controls.update();scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
   return {ready:window.__veniceShipsReady, old:localStorage.getItem('venice-ships-pos'), ships:scene.children.filter(g=>g.userData.isVeniceShip).map(g=>{
    const b=new T.Box3().setFromObject(g), center=b.getCenter(new T.Vector3()), screen=center.clone().project(camera), model=g.children[0];
    const native=g.clone();native.position.set(0,0,0);native.rotation.y=0;native.updateMatrixWorld(true);const size=new T.Box3().setFromObject(native).getSize(new T.Vector3());
    return {name:g.userData.shipName,x:g.position.x,z:g.position.z,rotY:g.rotation.y,projected:localPoint(...expected[g.userData.shipName].slice(3,5)),scale:model.scale.toArray(),nativeLength:Math.max(size.x,size.y,size.z),bounds:{min:b.min.toArray(),max:b.max.toArray()},screen:{x:(screen.x+1)*800,y:(1-screen.y)*500},materials:(()=>{const a=[];g.traverse(o=>{if(o.isMesh)a.push({type:o.material.type,color:o.material.color.toArray()});});return a;})()};})};
  },expected);
  assert.equal(data.ready.loaded,3); assert.equal(data.ready.gpuPrepared,true);assert.equal(data.ready.rendered,true);
  assert.equal(data.ships.length,3);assert.equal(data.old,label==='legacy'?legacy:null);
  for(const s of data.ships){const e=expected[s.name];assert.equal(s.x,e[0]);assert.equal(s.z,e[1]);assert.equal(s.rotY,e[2]);assert.ok(Math.abs(s.projected[0]-s.x)<.002&&Math.abs(s.projected[1]-s.z)<.002);assert.ok(Math.abs(s.bounds.min[1]+.4)<1e-6);assert.ok(Math.abs(s.nativeLength-e[5])<1e-6);}
  await page.waitForTimeout(400); const screenshot=path.join(out,`${process.env.SHIP_REPORT||'local'}-${label}.png`);await page.screenshot({path:screenshot,timeout:90000});
  if(label==='legacy') {
   const s=data.ships.find(s=>s.name==='mini_pirate');await page.mouse.move(s.screen.x,s.screen.y);await page.mouse.down();await page.mouse.move(s.screen.x+14,s.screen.y+5,{steps:5});await page.mouse.up();
   const saved=await page.evaluate(()=>({value:JSON.parse(localStorage.getItem('venice-ships-pos-v2')),old:localStorage.getItem('venice-ships-pos'),enabled:window.__dbg.controls.enabled}));
   assert.ok(saved.value,'real pointer drag writes versioned key');assert.notEqual(saved.value.mini_pirate.x,s.x);assert.equal(saved.old,legacy);assert.equal(saved.enabled,true);
   // Wheel at the moved ship's new screen location exercises unchanged rotation/save.
   const point=await page.evaluate(async()=>{const T=await import('./vendor/three.module.js');const g=window.__dbg.scene.children.find(g=>g.userData.shipName==='mini_pirate');const v=new T.Box3().setFromObject(g).getCenter(new T.Vector3()).project(window.__dbg.camera);return {x:(v.x+1)*800,y:(1-v.y)*500};});
   await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,100);
   const rotated=await page.evaluate(()=>JSON.parse(localStorage.getItem('venice-ships-pos-v2')));assert.ok(Math.abs(rotated.mini_pirate.rotY-s.rotY-.05)<1e-9);
   await page.reload({waitUntil:'domcontentloaded'});await ready(page);
   const restored=await page.evaluate(()=>window.__dbg.scene.children.filter(g=>g.userData.isVeniceShip).map(g=>({name:g.userData.shipName,x:g.position.x,z:g.position.z,rotY:g.rotation.y})));
   for(const g of restored) assert.deepEqual({x:g.x,z:g.z,rotY:g.rotY},rotated[g.name]); data.persistence={saved,rotated,restored};
  }
  assert.deepEqual(errors,[]);reports.push({case:label,...data,screenshot,errors});await context.close();
 }
 const report=path.join(out,`browser-${process.env.SHIP_REPORT||'local'}.json`);await fs.writeFile(report,JSON.stringify(reports,null,2));console.log(JSON.stringify({result:'PASS',cases:reports.map(r=>({case:r.case,ships:r.ships,screenshot:r.screenshot,persistence:!!r.persistence})),report},null,2));
}finally{await browser.close();}
