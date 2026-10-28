import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const base=process.env.VENICE_URL||'http://127.0.0.1:8781';
const original=execFileSync('git',['show','bccbbaa88898e0a8eb989f6b47c3674fb7843282:web/app.js'],{encoding:'utf8',maxBuffer:300000});
const labelCode=original.slice(original.indexOf('const labelGroup ='),original.indexOf('// ---------- Shared uniforms'));
let browser;const results=[];
try {
 for(const fallback of [false,true]) {
  if(process.env.PERFORMANCE_CASE && process.env.PERFORMANCE_CASE !== (fallback?'corrupt':'valid')) continue;
  await browser?.close();
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  console.log('START performance-browser', {fallback});
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'}),errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
  await page.addInitScript(()=>{window.__draws=0;window.__picks=0;for(const C of [WebGLRenderingContext,WebGL2RenderingContext])for(const key of ['drawElements','drawArrays','readPixels']){const f=C.prototype[key];if(f)C.prototype[key]=function(...a){window[key==='readPixels'?'__picks':'__draws']++;return f.apply(this,a);};}});
  if(fallback)await page.route('**/assets/ground.*.bin',r=>r.fulfill({status:200,body:'corrupt controlled fixture'}));
  await page.goto(base+'/?shot&lang=en',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.dataset.ready==='1'&&!document.querySelector('#splash')&&!document.querySelector('#map-layer'),null,{timeout:90000});
  await page.waitForTimeout(1500);
  if(fallback)assert(warnings.some(w=>w.includes('Ground cache fallback')));else assert(!warnings.some(w=>w.includes('Ground cache fallback')));
  const a=await page.evaluate(()=>[window.__draws,window.__picks]);await page.waitForTimeout(1000);assert.deepEqual(await page.evaluate(()=>[window.__draws,window.__picks]),a,'idle GPU must sleep');
  await page.mouse.move(640,400);await page.waitForTimeout(5000);const h=await page.evaluate(()=>[window.__draws,window.__picks]);await page.waitForTimeout(1000);assert.deepEqual(await page.evaluate(()=>[window.__draws,window.__picks]),h,'stationary hover must sleep');
  await page.mouse.move(641,400);await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>window.__picks),h[1]+1,'moving pointer performs new pick');await page.mouse.move(0,0);
  const beforeFlight=await page.evaluate(()=>({camera:window.__dbg.camera.position.toArray(),draws:window.__draws}));
  await page.evaluate(()=>{window.__flightDone=false;window.__dbg.flyTo(-80,300,()=>window.__flightDone=true);});
  await page.waitForFunction(()=>window.__flightDone,null,{timeout:30000});await page.waitForTimeout(5000);
  const flight=await page.evaluate(()=>({camera:window.__dbg.camera.position.toArray(),draws:window.__draws}));assert.notDeepEqual(flight.camera,beforeFlight.camera);assert(flight.draws>beforeFlight.draws);
  // Compare full label state to the original algorithm, not a relaxed visibility count.
  const comparison=await page.evaluate(async original=>{
    const THREE=await import('./vendor/three.module.js'),d=window.__dbg;
    const camera=d.camera,scene=new THREE.Scene(),MUTED='#5f625c',LABEL_PX=64;
    const clone=d.labels.map(l=>({L:l.L,x:l.x,z:l.z,ang:l.ang,len:l.len,wid:l.wid,mesh:null}));
    const code=original.slice(original.indexOf('const labelGroup ='),original.indexOf('// ---------- Shared uniforms'));
    const end=code.indexOf('// ----------');const body=end>=0?code.slice(0,end):code;
    const create=new Function('THREE','camera','scene','MUTED','document','labelData',body+';return {labels,updateLabels};');
    const data=[...new Set(clone.map(l=>l.L))];
    const ref=create(THREE,camera,scene,MUTED,document,data),dist=camera.position.distanceTo(d.controls.target);
    for(let i=0;i<24;i++)ref.updateLabels(dist);
    const snapshot=labels=>labels.map(l=>({name:l.L.name,x:l.x,z:l.z,vis:l._vis,visible:l.mesh?.visible??false,scale:l.mesh?.visible?l.mesh.scale.toArray():null}));
    return {actual:snapshot(d.labels),expected:snapshot(ref.labels)};
  },original);
  assert.deepEqual(comparison.actual,comparison.expected,'exact original label state after close flight');
  const year=await page.evaluate(()=>window.__dbg.uniforms.uYear.value);await page.evaluate(()=>window.__dbg.startPlay());await page.waitForTimeout(1000);const playing=await page.evaluate(()=>({year:window.__dbg.uniforms.uYear.value,draws:window.__draws}));assert.notEqual(playing.year,year);await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);results.push({fallback,flight:true,labels:comparison.actual.length,playing:true,idleDraws:0,stationaryPicks:0,warnings,errors});await page.close();
 }
 const output=process.env.TMPDIR+'/venice-performance/runtime.json';await fs.mkdir(process.env.TMPDIR+'/venice-performance',{recursive:true});await fs.writeFile(output,JSON.stringify(results,null,2));console.log('PASS demand GPU, stationary pick, flight, exact original labels, playback, corrupt fallback',output);
}finally{await browser.close();}
