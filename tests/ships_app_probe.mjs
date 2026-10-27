import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const out=path.join(process.env.TMPDIR||process.env.LOCALAPPDATA,'venice-ships-readiness');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});const logs=[];
 page.on('pageerror',e=>logs.push(e.message));page.on('console',e=>{if(e.type()==='error')logs.push(e.text());});
 await page.goto((process.env.VENICE_URL||'http://127.0.0.1:8770')+'/?shot&lang=en',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__veniceShipsLoaded===3&&!document.querySelector('#splash'),null,{timeout:45000}).catch(async e=>{console.log(await page.evaluate(()=>({loaded:window.__veniceShipsLoaded,loading:document.querySelector('#loading')?.outerHTML,ships:window.__dbg?.scene.children.filter(o=>o.userData.isVeniceShip).length})),logs);throw e;});
 const data=await page.evaluate(async()=>{
  const {scene,camera,controls,pick}=window.__dbg;const THREE=await import('./vendor/three.module.js');
  controls.enableDamping=false;controls.target.set(-200,15,200);camera.position.set(-200,220,520);camera.lookAt(controls.target);controls.update();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  const groups=scene.children.filter(o=>o.userData.isVeniceShip);const info=groups.map(g=>{const materials=[];g.traverse(o=>{if(o.isMesh)materials.push({type:o.material.type,color:o.material.color.toArray(),map:!!o.material.map,vertexColors:o.material.vertexColors,normals:!!o.geometry.attributes.normal});});const v=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()).project(camera);return {name:g.userData.shipName,x:(v.x+1)*720,y:(1-v.y)*450,materials};});
  window.probePick=()=>pick(720,450);return {groups:info,lights:scene.children.filter(o=>o.isLight).map(o=>({type:o.type,visible:o.visible,intensity:o.intensity})),resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('ship')||r.name.includes('aleksandr')).map(r=>r.name)};
 });
 const rows=[];
 for(const mode of ['before-pick','after-pick']) {
  if(mode==='after-pick')await page.evaluate(()=>window.probePick());await page.waitForTimeout(500);const file=path.join(out,'baseline-'+mode+'.png');await page.screenshot({path:file});
  const stats=await page.evaluate(async({src,groups})=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=1440;c.height=900;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return groups.map(p=>{const a=ctx.getImageData(Math.round(p.x)-45,Math.round(p.y)-55,90,110).data;const warm=[],dark=[];for(let i=0;i<a.length;i+=4){if(a[i]>a[i+1]*1.4&&a[i]>a[i+2]*1.4&&a[i]>65)warm.push([a[i],a[i+1],a[i+2]]);if(a[i]<40&&a[i+1]<40&&a[i+2]<40)dark.push([a[i],a[i+1],a[i+2]]);}warm.sort((a,b)=>a[0]-b[0]);return {name:p.name,warm:warm.length,dark:dark.length,median:warm[Math.floor(warm.length/2)]};});},{src:'data:image/png;base64,'+(await fs.readFile(file)).toString('base64'),groups:data.groups});rows.push({mode,stats,file});
 }
 const report={data,rows,logs};await fs.writeFile(path.join(out,'baseline-app.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
