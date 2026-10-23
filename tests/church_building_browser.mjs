import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('web');
const server=createServer((req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path===root?'.html':extname(path)]||'application/octet-stream');res.end(readFileSync(path===root?resolve(root,'index.html'):path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],consoleErrors=[],httpErrors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)httpErrors.push(new URL(r.url()).pathname);});
 const base=process.argv[2] || `http://127.0.0.1:${server.address().port}/`;
 await page.goto(base+'?lang=ru&shot',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>document.body.dataset.ready==='1'&&window.__dbg,null,{timeout:120000});
 assert.equal(await page.evaluate(()=>!!window.__dbg.churchBuildingHighlight),true,'bridge view must install full-building highlight');
 await page.locator('.walks-open').click();await page.locator('[data-bridge-route-open]').click();await page.locator('[data-bridge-route-toggle]').waitFor();await page.locator('[data-bridge-route-toggle]').click();
 await page.waitForFunction(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible),null,{timeout:30000});
 const report=await page.evaluate(()=>{
  const {churchBuildingHighlight:h,scene}=window.__dbg;
  let expected=0,actual=0,roofs=0;const target=new Set(h.manifest.buildings.map(b=>b.gid)),refs=[];
  for(const mesh of h.overlays){actual+=mesh.geometry.index.count;const t=mesh.parent.geometry,bld=t.attributes.bld.array,attr=mesh.parent.userData.draw.uniforms.uAttr.value.image.data,idx=t.index.array;
   for(let i=0;i<idx.length;i+=3)if([idx[i],idx[i+1],idx[i+2]].every(v=>target.has(attr[(bld[v]&32767)*8+3]))){expected+=3;if([idx[i],idx[i+1],idx[i+2]].some(v=>bld[v]>=32768))roofs++;}
   const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)assertFinite(p.getX(i),p.getY(i),p.getZ(i));
   for(const qid of ['Q172988','Q52531']){const entry=h.manifest.buildings.find(b=>b.qid===qid);if(Array.from(attr).some((v,i)=>i%8===3&&v===entry.gid)){const positions=[];for(let i=0;i<bld.length;i++)if(attr[(bld[i]&32767)*8+3]===entry.gid)positions.push([t.attributes.position.getX(i),t.attributes.position.getY(i),t.attributes.position.getZ(i)]);refs.push({qid,gid:entry.gid,vertices:positions.length,minY:Math.min(...positions.map(p=>p[1]))*.1,maxY:Math.max(...positions.map(p=>p[1]))*.1,distinctXZ:new Set(positions.map(p=>p[0]+','+p[2])).size});}}
  }
  const bridgeColors=[];scene.traverse(m=>{if(m.name.startsWith('bridge-highlight-mesh:'))bridgeColors.push((m.material.color||m.material.uniforms.color.value).getHexString());});
  return {expected,actual,roofs,refs,bridgeColors,overlays:h.overlays.length,allGray:h.overlays.every(m=>m.visible&&(m.material.color||m.material.uniforms.color.value).getHexString()==='808080'),matched:h.manifest.matched_stops,unmatched:h.manifest.unmatched.length};
  function assertFinite(...v){if(!v.every(Number.isFinite))throw Error('nonfinite mesh');}
 });
 assert.equal(report.actual,report.expected,'every church triangle including wall/part/roof must be gray');assert.ok(report.actual>1000);assert.equal(report.allGray,true);assert.equal(report.refs.length,2);for(const r of report.refs){assert.ok(r.vertices>100);assert.ok(r.distinctXZ>20);assert.ok(r.maxY>r.minY);}assert.notEqual(report.refs[0].gid,report.refs[1].gid);assert.ok(report.bridgeColors.length>100);assert.ok(report.bridgeColors.every(c=>c==='ff0000'));
 await page.locator('[data-bridge-route-toggle]').click();assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false);
 // Selecting a crossing also turns the bridge overlay (and gray churches) on.
 await page.locator('[data-crossing="0"]').click();assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.every(m=>m.visible)),true);
 await page.evaluate(()=>{window.__dbg.churchBuildingHighlight.setSourceVisible('church',true);window.__dbg.bridgeRoute.setVisible(false);});assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.every(m=>m.visible)),true);
 await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setSourceVisible('church',false));assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.every(m=>!m.visible)),true);
 await page.evaluate(()=>window.__dbg.bridgeRoute.setVisible(true));
 await page.waitForTimeout(1700);
 const screenshots=[];
 for(const [qid,name] of [['Q172988','san-marco'],['Q52531','salute']]){
  await page.evaluate(q=>{const d=window.__dbg,b=d.building(d.churchBuildingHighlight.manifest.buildings.find(b=>b.qid===q).gid);d.controls.target.set(b.x,0,b.z);d.camera.position.set(b.x+160,180,b.z+200);d.controls.update();},qid);
  await page.waitForTimeout(1200);const path=`C:/Users/1/AppData/Local/hermes/cache/scratch/venice-church-building-${name}.png`;await page.screenshot({path});screenshots.push(path);
 }
 assert.deepEqual(errors,[]);const knownMissing=new Set(['/img/sun.webp','/data/suburbs.json','/data/suburbs.bin']);assert.deepEqual(httpErrors.filter(p=>!knownMissing.has(p)),[]);assert.deepEqual(consoleErrors.filter(e=>!/^Failed to load resource:.*404/.test(e)),[]);
 console.log(JSON.stringify({base,...report,bridgeColors:[...new Set(report.bridgeColors)],pageErrors:errors,knownMissing:httpErrors,screenshots}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
