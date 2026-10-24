import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('web');
const server=createServer((req,res)=>{const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(p!==root&&!p.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[p===root?'.html':extname(p)]||'application/octet-stream');res.end(readFileSync(p===root?resolve(root,'index.html'):p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],httpErrors=[],consoleErrors=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push(new URL(r.url()).pathname);});page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 const base=process.argv[2] || `http://127.0.0.1:${server.address().port}/`;
 await page.goto(base+'?lang=ru&shot',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>document.body.dataset.ready==='1'&&window.__dbg,null,{timeout:120000});
 await page.locator('.lenses [data-mode="3"]').click();
 await page.waitForFunction(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible&&m.material.color.getHexString()==='0000ff'),null,{timeout:30000});
 const report=await page.evaluate(()=>{
  const h=window.__dbg.churchBuildingHighlight,entry=h.manifest.buildings.find(b=>b.qid==='Q28035407');
  const result={gid:entry.gid,building_id:entry.building_id,matched:h.manifest.matched_stops,unmatched:h.manifest.unmatched.length,blueTriangles:0,blueRoofTriangles:0,blueWallTriangles:0,blueTopCapTriangles:0,greenTriangles:0,expectedTriangles:0,exactTriangleCoordinates:true,greenExcludesCanton:true,transformsPreserved:true,bridgeColors:[],minY:Infinity,maxY:-Infinity,blueMeshes:0};
  for(const mesh of h.overlays){
   const blue=mesh.material.color.getHexString()==='0000ff',t=mesh.parent.geometry,bld=t.attributes.bld.array,attr=mesh.parent.userData.draw.uniforms.uAttr.value.image.data,idx=t.index.array,pos=t.attributes.position.array;
   const expected=[];let roof=0,wall=0,top=0;
   for(let i=0;i<idx.length;i+=3){const vs=[idx[i],idx[i+1],idx[i+2]];if(!vs.every(v=>attr[(bld[v]&32767)*8+3]===entry.gid))continue;for(const v of vs)expected.push(pos[v*3],pos[v*3+1],pos[v*3+2]);if(vs.some(v=>bld[v]>=32768))roof++;if(new Set(vs.map(v=>pos[v*3+1])).size>1)wall++;else if(vs.every(v=>pos[v*3+1]>0))top++;}
   if(blue){result.blueMeshes++;result.blueTriangles+=mesh.geometry.index.count/3;result.expectedTriangles+=expected.length/9;result.blueRoofTriangles+=roof;result.blueWallTriangles+=wall;result.blueTopCapTriangles+=top;const actual=[];for(const v of mesh.geometry.index.array){const p=mesh.geometry.attributes.position.array;actual.push(p[v*3],p[v*3+1],p[v*3+2]);result.minY=Math.min(result.minY,p[v*3+1]*.1);result.maxY=Math.max(result.maxY,p[v*3+1]*.1);}result.exactTriangleCoordinates&&=JSON.stringify(actual)===JSON.stringify(expected);result.transformsPreserved&&=mesh.position.length()===0&&mesh.scale.x===1&&mesh.parent.scale.x===.1;}
   else{result.greenTriangles+=mesh.geometry.index.count/3;result.greenExcludesCanton&&=!mesh.userData.gids.includes(entry.gid);}
  }
  window.__dbg.scene.traverse(m=>{if(m.name.startsWith('bridge-highlight-mesh:'))result.bridgeColors.push((m.material.color||m.material.uniforms.color.value).getHexString());});
  return result;
 });
 assert.equal(report.gid,4521);assert.equal(report.building_id,'w138843453');assert.equal(report.blueTriangles,report.expectedTriangles);assert.ok(report.blueTriangles>0);assert.ok(report.blueWallTriangles>0);assert.ok(report.blueTopCapTriangles>0,'existing roof/top cap included even without high-bit shaped roofs');assert.ok(report.maxY>report.minY);assert.ok(report.exactTriangleCoordinates);assert.ok(report.transformsPreserved);assert.ok(report.greenExcludesCanton);assert.ok(report.greenTriangles>1000);
 await page.evaluate(()=>{const d=window.__dbg,b=d.building(4521);d.controls.target.set(b.x,0,b.z);d.camera.position.set(b.x+100,140,b.z+140);d.controls.update();});await page.waitForTimeout(1200);
 const screenshot='C:/Users/1/AppData/Local/hermes/cache/scratch/venice-canton-blue-local.png';await page.screenshot({path:screenshot});
 await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setPicking(true));assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false);await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setPicking(false));
 await page.locator('.lenses [data-mode="0"]').click();assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false);
 await page.locator('.walks-open').click();await page.locator('[data-bridge-route-open]').click();await page.locator('[data-bridge-route-toggle]').waitFor();await page.locator('[data-bridge-route-toggle]').click();
 await page.waitForFunction(()=>window.__dbg.churchBuildingHighlight.overlays.every(m=>m.visible));
 const bridgeColors=await page.evaluate(()=>{const c=[];window.__dbg.scene.traverse(m=>{if(m.name.startsWith('bridge-highlight-mesh:'))c.push((m.material.color||m.material.uniforms.color.value).getHexString());});return c;});assert.ok(bridgeColors.length>100);assert.ok(bridgeColors.every(c=>c==='ff0000'));
 await page.locator('[data-bridge-route-toggle]').click();assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false);
 assert.deepEqual(errors,[]);const knownMissing=new Set(['/img/sun.webp','/data/suburbs.json','/data/suburbs.bin']);assert.deepEqual(httpErrors.filter(p=>!knownMissing.has(p)),[]);assert.deepEqual(consoleErrors.filter(e=>!/^Failed to load resource:.*404/.test(e)),[]);
 console.log(JSON.stringify({base,...report,bridgeColors:[...new Set(bridgeColors)],bridgeMeshes:bridgeColors.length,pageErrors:errors,knownMissing:httpErrors,screenshot,tabToggle:true,walkBridgeToggle:true,picking:true}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
