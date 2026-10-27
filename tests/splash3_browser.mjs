import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
const base=process.env.VENICE_URL||'http://127.0.0.1:8768';
const out=path.join(process.env.TMPDIR,'splash3-verification');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[];
try {
const cases = [[1440,900,false],[390,844,false],[844,390,false],[320,640,true]];
for(const [width,height,reduce] of cases.filter(([w,h]) => !process.env.VENICE_VIEWPORT || process.env.VENICE_VIEWPORT === `${w}x${h}`)) {
 const page=await browser.newPage({viewport:{width,height},reducedMotion:reduce?'reduce':'no-preference'}), errors=[];
 const shot=async(name)=>{const c=await page.context().newCDPSession(page);const r=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name),Buffer.from(r.data,'base64'));await c.detach();};
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('venice-emblem-pos','{"x":7,"y":13}');window.__handoffSamples=[];
  setInterval(()=>{const r=window.__veniceReveal,m=document.querySelector('#map-layer'),e=document.querySelector('.venice-arms');
   if(r&&e)window.__handoffSamples.push({time:performance.now(),state:r.state,p:r.progress,map:!!m,ma:m?+getComputedStyle(m).opacity:0,ea:+getComputedStyle(e).opacity});},40);
 });
 await page.goto(base+'/splash3.html?lang=en');
 await page.waitForFunction(()=>!!window.__splash3Emblem?.geometry);
 // Capture during the handoff, not before it: software-rendered screenshot
 // capture can outlast the transition and is not a loading prerequisite.
 if(!reduce) {
  await page.waitForFunction(()=>__veniceReveal.state==='running',{},{timeout:60000});
  await page.waitForFunction(()=>__veniceReveal.progress>.25 && __veniceReveal.progress<.9);
  const v=await page.evaluate(()=>{const e=document.querySelector('.venice-arms'),r=e.getBoundingClientRect(),m=document.querySelector('#map-layer'),img=m.querySelector('img');
   return {g:__splash3Emblem.geometry,er:{x:r.x,y:r.y,w:r.width,h:r.height},mapAlpha:+getComputedStyle(m).opacity,emblemAlpha:+getComputedStyle(e).opacity,img:{left:parseFloat(img.style.left),top:parseFloat(img.style.top),w:parseFloat(img.style.width),h:parseFloat(img.style.height)},count:document.querySelectorAll('.venice-arms').length};});
  assert.equal(v.count,1);assert.ok(Math.abs(v.mapAlpha+v.emblemAlpha-1)<.001);
  // Independent source->screen projection using actual image dimensions/style.
  const k=v.img.w/2560,L=v.g.layerScale,a=.6277699827,b=.0048072373,tx=2153.8452382,ty=220.5698330;
  const corners=[[0,0],[455,0],[0,549],[455,549]].map(([x,y])=>[width/2+L*(v.img.left+k*(tx+a*x-b*y)-width/2),height/2+L*(v.img.top+k*(ty+b*x+a*y)-height/2)]);
  assert.ok(Math.abs(v.er.x-Math.min(...corners.map(c=>c[0])))<.1);
  assert.ok(Math.abs(v.er.y-Math.min(...corners.map(c=>c[1])))<.1);
  assert.ok(v.er.x>=0&&v.er.y>=0&&v.er.x+v.er.w<=width+.1&&v.er.y+v.er.h<=height+.1);
  await shot(`${width}x${height}-handoff.png`);
 }
 await page.waitForFunction(()=>window.__splash3Emblem?.released&& !document.querySelector('#splash'),{},{timeout:60000});
 assert.equal(await page.locator('#map-layer').count(),0);assert.equal(await page.locator('.venice-arms').evaluate(e=>+getComputedStyle(e).opacity),1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('venice-emblem-pos')),'{"x":7,"y":13}');
 await shot(`${width}x${height}-complete.png`);
 const samples=await page.evaluate(()=>window.__handoffSamples),pending=samples.filter(s=>s.state==='pending');
 if(!reduce){assert.ok(pending.length>0);assert.ok(pending.every(s=>s.map&&s.p===0&&s.ma===1&&s.ea===0));assert.equal(samples.at(-1).state,'completed');}
 const rect=await page.locator('.venice-arms').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2-25,rect.y+rect.height/2+10,{steps:5});await page.mouse.up();
 assert.notEqual(await page.evaluate(()=>localStorage.getItem('venice-emblem-pos')),'{"x":7,"y":13}');
 await shot(`${width}x${height}-dragged.png`);
 assert.deepEqual(errors,[]);
 reports.push({width,height,reduce,samples: samples.length,pendingSamples:pending.length,errors});console.log('PASS real splash3',width,height,reduce?'reduced':'natural completion');await page.close();
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(reports,null,2));console.log('Screenshots:',out);
}finally{await browser.close()}
