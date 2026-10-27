import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.VENICE_URL||'http://127.0.0.1:8770';
const out=path.join(process.env.TMPDIR||process.env.LOCALAPPDATA,'venice-ship-converter/verification');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:900,height:700}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/ship-light-test',r=>r.fulfill({contentType:'text/html',body:'<style>body{margin:0;background:#f5f1e9}canvas{display:block}#label{position:absolute;left:20px;top:10px;font:20px sans-serif}</style><canvas></canvas><div id="label"></div>'}));
 await page.goto(base+'/ship-light-test');
 const results=await page.evaluate(async()=>{
  const THREE=await import('./vendor/three.module.js');const {GLTFLoader}=await import('./vendor/GLTFLoader.js');
  THREE.ColorManagement.enabled=false;
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true,preserveDrawingBuffer:true});renderer.setSize(900,700);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
  const loader=new GLTFLoader(),scene=new THREE.Scene();scene.background=new THREE.Color('#f5f1e9');
  // Use the production installer lights, not a test-only illumination rig.
  const {installShips}=await import('./ships-model.js');const installed=await installShips(scene,new THREE.PerspectiveCamera(),renderer,{enabled:true});scene.remove(...installed);
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,10000),target=new THREE.WebGLRenderTarget(384,384);
  const material=new THREE.MeshStandardMaterial({color:'#b04f3e',metalness:0,roughness:1,side:THREE.DoubleSide});
  const rows=[];window.shipPreview={THREE,scene,camera,renderer,loader,rows};
  for(const name of ['mini_pirate_ship','ship_r_optimized','aleksandr_optimized']){
   const original=(await loader.loadAsync(`models/${name}.glb`)).scene;
   const light=(await loader.loadAsync(`models/${name}_light.glb`)).scene;
   const b0=new THREE.Box3().setFromObject(original),b1=new THREE.Box3().setFromObject(light),size=b0.getSize(new THREE.Vector3()),centre=b0.getCenter(new THREE.Vector3()),radius=size.length();
   const relativeBounds=[...b0.min.toArray().map((v,i)=>Math.abs(v-b1.min.toArray()[i])/radius),...b0.max.toArray().map((v,i)=>Math.abs(v-b1.max.toArray()[i])/radius)];
   let triangles=0,lines=0,materials=[];light.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;const m=o.material;materials.push({type:m.type,color:m.color.toArray(),side:m.side,roughness:m.roughness,metalness:m.metalness,vertexColors:m.vertexColors,emissive:m.emissive?.toArray(),map:!!m.map});}if(o.isLine)lines++;});
   original.traverse(o=>{if(o.isMesh||o.isLine)o.material=material;});
   const masks=[],ious=[],colorSamples=[];
   for(const direction of [[0,.1,1],[1,.1,0],[.8,.5,1]]){
    const distance=radius*2;camera.position.copy(centre).add(new THREE.Vector3(...direction).normalize().multiplyScalar(distance));camera.lookAt(centre);camera.left=-radius*.52;camera.right=radius*.52;camera.top=radius*.52;camera.bottom=-radius*.52;camera.updateProjectionMatrix();
    const local=[];
    for(const obj of [original,light]){scene.add(obj);renderer.setRenderTarget(target);renderer.render(scene,camera);const pixels=new Uint8Array(384*384*4);renderer.readRenderTargetPixels(target,0,0,384,384,pixels);renderer.setRenderTarget(null);scene.remove(obj);const mask=[];for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];mask.push(r>g*1.25&&r>b*1.3&&r>12);if(obj===light&&mask.at(-1))colorSamples.push([r,g,b]);}local.push(mask);}
    let intersection=0,union=0;for(let i=0;i<local[0].length;i++){intersection+=local[0][i]&&local[1][i]?1:0;union+=local[0][i]||local[1][i]?1:0;}ious.push(intersection/union);
   }
   colorSamples.sort((a,b)=>a[0]-b[0]);
   rows.push({name,relativeBounds,triangles,lines,materials,silhouetteIoU:ious,terracottaPixels:colorSamples.length,medianTerracottaRGB:colorSamples[Math.floor(colorSamples.length/2)],original,light,bounds:b0});
  }
  window.showShip=(index,which='light')=>{for(const row of rows){scene.remove(row.original,row.light);}const row=rows[index],box=row.bounds,size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3()),radius=size.length();camera.position.copy(centre).add(new THREE.Vector3(.8,.5,1).normalize().multiplyScalar(radius*2));camera.lookAt(centre);camera.left=-radius*.6;camera.right=radius*.6;camera.top=radius*.6*700/900;camera.bottom=-radius*.6*700/900;camera.updateProjectionMatrix();scene.add(row[which]);renderer.render(scene,camera);document.querySelector('#label').textContent=row.name+' — '+which;};
  return rows.map(({original,light,bounds,...row})=>row);
 });
 for(let i=0;i<results.length;i++){
  const row=results[i];assert.ok(row.relativeBounds.every(v=>v<.01),`${row.name}: bounds within 1% diagonal`);
  for(const m of row.materials){assert.equal(m.type,'MeshStandardMaterial');assert.equal(m.side,2);assert.deepEqual(m.color,[176/255,79/255,62/255]);assert.equal(m.roughness,1);assert.equal(m.metalness,0);assert.equal(m.vertexColors,false);assert.equal(m.map,false);assert.deepEqual(m.emissive,[0,0,0]);}
  assert.ok(row.silhouetteIoU.every(v=>v>.88),`${row.name}: actual rendered silhouettes ${row.silhouetteIoU}`);assert.ok(row.terracottaPixels>1000,'real nonblack warm framebuffer pixels');assert.ok(row.medianTerracottaRGB[0]>80,'terracotta must not render as near-black');
  for(const which of ['original','light']){await page.evaluate(([i,w])=>window.showShip(i,w),[i,which]);await page.screenshot({path:path.join(out,`${row.name}-${which}.png`)});}
 }
 // Exercise production installation, saved poses, all real raycast drag/rotate handlers.
 const interactions=await page.evaluate(async()=>{
  const {THREE,renderer}=window.shipPreview;const {installShips}=await import('./ships-model.js');
  const saved={mini_pirate:{x:-150,z:190,rotY:.25},ship_r:{x:-240,z:280,rotY:-.7},aleksandr:{x:-70,z:120,rotY:1.1}};localStorage.setItem('venice-ships-pos',JSON.stringify(saved));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,900/700,.1,10000),controls={enabled:true};const groups=await installShips(scene,camera,renderer,controls),results=[];
  for(const group of groups){
   const before={...saved[group.userData.shipName]};const box=new THREE.Box3().setFromObject(group),centre=box.getCenter(new THREE.Vector3());
   camera.position.copy(centre).add(new THREE.Vector3(80,80,100));camera.lookAt(centre);camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
   const ray=new THREE.Raycaster();let point;
   for(let y=100;y<650&&!point;y+=5)for(let x=100;x<800;x+=5){ray.setFromCamera(new THREE.Vector2(x/900*2-1,1-y/700*2),camera);const hits=ray.intersectObjects(groups,true);if(hits.length){let cur=hits[0].object;while(cur&&!cur.userData.isVeniceShip)cur=cur.parent;if(cur===group){point={x,y};break;}}}
   if(!point)throw new Error('No raycast point for '+group.userData.shipName);
   const canvas=renderer.domElement;canvas.dispatchEvent(new WheelEvent('wheel',{clientX:point.x,clientY:point.y,deltaY:100,bubbles:true,cancelable:true}));
   const rotated=group.rotation.y;
   // Pick again after yaw; original point can have fallen outside a thin sail.
   scene.updateMatrixWorld(true);let dragPoint;
   for(let y=100;y<650&&!dragPoint;y+=5)for(let x=100;x<800;x+=5){ray.setFromCamera(new THREE.Vector2(x/900*2-1,1-y/700*2),camera);const h=ray.intersectObjects([group],true);if(h.length){dragPoint={x,y};break;}}
   canvas.dispatchEvent(new MouseEvent('mousedown',{clientX:dragPoint.x,clientY:dragPoint.y,bubbles:true,cancelable:true}));const disabled=!controls.enabled;
   window.dispatchEvent(new MouseEvent('mousemove',{clientX:dragPoint.x+25,clientY:dragPoint.y+10,bubbles:true,cancelable:true}));window.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
   const waterline=new THREE.Box3().setFromObject(group).min.y,persisted=JSON.parse(localStorage.getItem('venice-ships-pos'))[group.userData.shipName];
   results.push({name:group.userData.shipName,before,rotated,x:group.position.x,z:group.position.z,waterline,controlsDisabledDuringDrag:disabled,controlsRestored:controls.enabled,persisted});
  }
  return results;
 });
 for(const row of interactions){assert.ok(Math.abs(row.rotated-row.before.rotY-.05)<1e-6,'saved yaw + wheel rotation');assert.ok(Math.hypot(row.x-row.before.x,row.z-row.before.z)>1,'actual drag moved ship');assert.ok(Math.abs(row.waterline+.4)<1e-3);assert.equal(row.controlsDisabledDuringDrag,true);assert.equal(row.controlsRestored,true);assert.equal(row.persisted.x,row.x);assert.equal(row.persisted.z,row.z);assert.equal(row.persisted.rotY,row.rotated);}
 assert.deepEqual(errors,[]);
 const report={base,renderer:'SwiftShader, atlas ColorManagement disabled / LinearSRGB output',models:results,interactions,pageErrors:errors};await fs.writeFile(path.join(out,'browser-verification.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));console.log('PASS real GLTFLoader materials, three-view silhouettes, framebuffer hue, bounds, saved poses, wheel, drag, waterline; artifacts '+out);
}finally{await browser.close();}
