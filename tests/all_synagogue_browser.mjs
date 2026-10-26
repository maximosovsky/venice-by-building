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
 // Ни одна вкладка не включает зелёный оверлей храмов: он доступен только по своему источнику.
 for(const mode of ['0','1','2','3']){await page.locator(`.lenses [data-mode="${mode}"]`).click();assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false,`вкладка ${mode} не должна красить храмы`);}
 await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setSourceVisible('church',true));
 await page.waitForFunction(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible&&(m.material.color||m.material.uniforms.uColor.value).getHexString()==='2f3f6b'),null,{timeout:30000});
 const identityMap=await page.evaluate(()=>Object.fromEntries(window.__dbg.churchBuildingHighlight.manifest.buildings.filter(b=>b.highlight_color).flatMap(b=>b.identities.map(i=>[i.qid,b.gid]))));assert.deepEqual(identityMap,{Q28035407:4521,Q65015:4521,Q12051106:4521,Q62259167:4596,Q2897799:4756});
 const report=await page.evaluate(()=>{
  const h=window.__dbg.churchBuildingHighlight,entry=h.manifest.buildings.find(b=>b.qid==='Q28035407');
  const result={gid:entry.gid,building_id:entry.building_id,matched:h.manifest.matched_stops,unmatched:h.manifest.unmatched.length,blueTriangles:0,blueRoofTriangles:0,blueWallTriangles:0,blueTopCapTriangles:0,byGid:{},greenTriangles:0,expectedTriangles:0,exactTriangleCoordinates:true,greenExcludesCanton:true,transformsPreserved:true,bridgeColors:[],minY:Infinity,maxY:-Infinity,blueMeshes:0};
  const navyEntries=h.manifest.buildings.filter(b=>b.highlight_color==='#2f3f6b');
  for(const b of navyEntries)result.byGid[b.gid]={building_id:b.building_id,triangles:0,wall:0,top:0,shapedRoof:0};
  for(const mesh of h.overlays){
   const blue=(mesh.material.color||mesh.material.uniforms.uColor.value).getHexString()==='2f3f6b',t=mesh.parent.geometry,bld=t.attributes.bld.array,attr=mesh.parent.userData.draw.uniforms.uAttr.value.image.data,idx=t.index.array,pos=t.attributes.position.array;
   const expected=[];let roof=0,wall=0,top=0;
   for(let i=0;i<idx.length;i+=3){const vs=[idx[i],idx[i+1],idx[i+2]];const gid=attr[(bld[vs[0]]&32767)*8+3];if(!result.byGid[gid]||!vs.every(v=>attr[(bld[v]&32767)*8+3]===gid))continue;const counts=result.byGid[gid];if(blue){counts.triangles++;if(vs.some(v=>bld[v]>=32768))counts.shapedRoof++;if(new Set(vs.map(v=>pos[v*3+1])).size>1)counts.wall++;else if(vs.every(v=>pos[v*3+1]>0))counts.top++;}for(const v of vs)expected.push(pos[v*3],pos[v*3+1],pos[v*3+2]);if(vs.some(v=>bld[v]>=32768))roof++;if(new Set(vs.map(v=>pos[v*3+1])).size>1)wall++;else if(vs.every(v=>pos[v*3+1]>0))top++;}
   if(blue){result.blueMeshes++;result.blueTriangles+=mesh.geometry.index.count/3;result.expectedTriangles+=expected.length/9;result.blueRoofTriangles+=roof;result.blueWallTriangles+=wall;result.blueTopCapTriangles+=top;const actual=[];for(const v of mesh.geometry.index.array){const p=mesh.geometry.attributes.position.array;actual.push(p[v*3],p[v*3+1],p[v*3+2]);result.minY=Math.min(result.minY,p[v*3+1]*.1);result.maxY=Math.max(result.maxY,p[v*3+1]*.1);}result.exactTriangleCoordinates&&=JSON.stringify(actual)===JSON.stringify(expected);result.transformsPreserved&&=mesh.position.length()===0&&mesh.scale.x===1&&mesh.parent.scale.x===.1;}
   else{result.greenTriangles+=mesh.geometry.index.count/3;result.greenExcludesCanton&&=navyEntries.every(b=>!mesh.userData.gids.includes(b.gid));}
  }
  window.__dbg.scene.traverse(m=>{if(m.name.startsWith('bridge-highlight-mesh:'))result.bridgeColors.push((m.material.color||m.material.uniforms.color.value).getHexString());});
  return result;
 });
 assert.equal(report.matched,117);assert.equal(report.unmatched,17);assert.equal(report.gid,4521);assert.equal(report.building_id,'w138843453');assert.equal(report.blueTriangles,report.expectedTriangles);assert.ok(report.blueTriangles>0);assert.ok(report.blueWallTriangles>0);assert.ok(report.blueTopCapTriangles>0,'existing roof/top cap included even without high-bit shaped roofs');assert.ok(report.maxY>report.minY);assert.ok(report.exactTriangleCoordinates);assert.ok(report.transformsPreserved);assert.ok(report.greenExcludesCanton);assert.ok(report.greenTriangles>1000);
 assert.deepEqual(Object.keys(report.byGid).sort(),['4521','4596','4756']);assert.equal(report.byGid[4756].building_id,'w345585193');for(const b of Object.values(report.byGid)){assert.ok(b.triangles>0);assert.ok(b.wall>0);assert.ok(b.top>0);}
 await page.evaluate(()=>{const d=window.__dbg,b=d.building(4521);d.controls.target.set(b.x,0,b.z);d.camera.position.set(b.x+100,140,b.z+140);d.controls.update();});await page.waitForTimeout(1200);
 await page.mouse.move(0,0);
 const pixelComparison=await page.evaluate(async()=>{const d=window.__dbg,canvas=document.querySelector('canvas'),read=()=>{const gl=canvas.getContext('webgl2'),p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;},frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));d.uniforms.uHover.value=-1;d.uniforms.uSelected.value=-1;d.setMode(0);await frame();const a=read();d.setMode(3);await frame();const b=read();let exact=0;for(let i=0;i<a.length;i+=4)if(a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2]&&a[i+2]>a[i+1]*1.4&&a[i+1]>a[i]*1.1&&a[i+2]>45&&a[i+2]<130)exact++;return {exactBluePixels:exact};});assert.ok(pixelComparison.exactBluePixels>100,'actual Age/Bridges framebuffer shading matches');
 const screenshot='C:/Users/1/AppData/Local/hermes/cache/scratch/venice-all-five-age-color-local.png';await page.screenshot({path:screenshot});
 const reference=await page.evaluate(async()=>{const d=window.__dbg,b=d.building(5888);d.setMode(0);d.controls.target.set(b.x,0,b.z);d.camera.position.set(b.x+100,140,b.z+140);d.controls.update();d.uniforms.uHover.value=-1;d.uniforms.uSelected.value=-1;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const gl=document.querySelector('canvas').getContext('webgl2'),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);const counts=new Map();for(let i=0;i<pixels.length;i+=4){const [r,g,b]=pixels.slice(i,i+3);if(b>g*1.4&&g>r*1.1&&b>45&&b<130){const key=[r,g,b].join(',');counts.set(key,(counts.get(key)||0)+1);}}return {gid:b.gid,year:b.year,flag:b.flag,baseHex:d.uniforms.uPalette.value[0].getHexString(),palette:d.uniforms.uPalette.value.map(c=>c.getHexString()),dominantBluePixels:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,5)};});// Палитра выросла до 18 слотов: послевоенный синий лежит в ней, но не обязан быть первым цветом.
assert.ok(reference.palette.includes('2f3f6b'),'палитра содержит послевоенный синий: '+reference.palette.join(','));assert.equal(reference.flag,0);assert.ok(reference.dominantBluePixels.some(([rgb,n])=>rgb==='49,66,111'&&n>100),'Ca Pesaro actual roof framebuffer is #31426f under Age lighting');await page.screenshot({path:'C:/Users/1/AppData/Local/hermes/cache/scratch/venice-ca-pesaro-age-reference.png'});await page.evaluate(()=>window.__dbg.setMode(3));
 assert.equal(await page.evaluate(()=>{const h=window.__dbg.churchBuildingHighlight;h.setPicking(true);return h.overlays.some(m=>m.visible);}),false);await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setPicking(false));
 await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setSourceVisible('church',false));assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false);
 // Вкладка «Мосты» открывает мостовой маршрут и по-прежнему НЕ включает зелёный оверлей храмов.
 await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setSourceVisible('church',true));await page.waitForFunction(()=>window.__dbg.churchBuildingHighlight.overlays.every(m=>m.visible));
 await page.locator('.walks-open').click();await page.locator('[data-bridge-route-open]').click();
 await page.waitForFunction(()=>{const g=window.__dbg.scene.children.find(c=>c.name==='all-bridges-route');return !!g&&g.visible;},null,{timeout:30000});
 assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false,'мостовой маршрут не красит храмы в зелёный');
 const bridgeColors=[];
 assert.deepEqual(errors,[]);const knownMissing=new Set(['/img/sun.webp','/data/suburbs.json','/data/suburbs.bin']);assert.deepEqual(httpErrors.filter(p=>!knownMissing.has(p)),[]);assert.deepEqual(consoleErrors.filter(e=>!/^Failed to load resource:.*404/.test(e)),[]);
 console.log(JSON.stringify({base,reference,identityMap,pixelComparison,...report,pageErrors:errors,knownMissing:httpErrors,screenshot,picking:true,noTabPaintsChurches:true}));
}finally{await browser.close();await new Promise(r=>server.close(r));}