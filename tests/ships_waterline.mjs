import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.VENICE_URL||'http://127.0.0.1:8768';
const b=await chromium.launch({headless:true});
try{
 const p=await b.newPage();
 await p.route('**/ship-test',r=>r.fulfill({contentType:'text/html',body:'<canvas id="scene"></canvas>'}));
 await p.goto(base+'/ship-test');
 const rows=await p.evaluate(async()=>{
  const THREE=await import('./vendor/three.module.js');
  const {installShips}=await import('./ships-model.js');
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera();
  const groups=await installShips(scene,camera,{domElement:document.querySelector('canvas')},{enabled:true});
  return groups.map(g=>{g.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(g);return {name:g.userData.shipName,minY:box.min.y,maxY:box.max.y,x:g.position.x,z:g.position.z};});
 });
 console.log(JSON.stringify(rows,null,2));
 assert.equal(rows.length,3,'all actual GLBs must load');
 for(const row of rows)assert.ok(Math.abs(row.minY-(-.4))<1e-3,`${row.name}: keel ${row.minY}, actual water -0.4`);
 console.log('PASS all three actual GLB keels aligned with water');
}finally{await b.close()}
