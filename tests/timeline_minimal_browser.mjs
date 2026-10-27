// Actual full-app route acceptance; no replacement city boot or GLB fixtures.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base=process.env.VENICE_URL||'http://127.0.0.1:8773';
const out=path.join(process.env.TMPDIR,'venice-minimal-timeline-'+(process.env.VENICE_REPORT||'local'));fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[], failures=[];
const legacy=JSON.stringify({mini_pirate:{x:-200,z:200,rotY:-1},ship_r:{x:-280,z:260,rotY:-1.4},aleksandr:{x:-120,z:140,rotY:-.78}});
const cases=process.env.VENICE_CASE==='late-splash3' ? [['/splash3',false,true]] : process.env.VENICE_CASE==='cached-splash3' ? [['/splash3',false,false]] : process.env.VENICE_REPORT==='live' ? [['/',true,false],['/ru',false,false],['/splash3',false,true],['/ru',true,true],['/splash3',true,true]] : process.env.VENICE_DIAG ? [['/ru',false,false],['/splash3',false,false],['/ru',true,true],['/splash3',true,true]] : [['/',true,false],['/ru',false,true],['/splash3',false,true],['/ru',true,true],['/splash3',true,true]];
try{for(const [route,reduce,disableCache] of cases){
 const label=route.slice(1)||'main', context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:reduce?'reduce':'no-preference',locale:'ru-RU'}),page=await context.newPage();
 const errors=[],bad=[],failed=[],handoff=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()})});page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));
 await context.addInitScript(value=>{localStorage.setItem('venice-ships-pos',value);localStorage.setItem('venice-lang','it');window.__testHandoff=[];setInterval(()=>{const m=document.querySelector('#map-layer'),e=document.querySelector('.venice-arms'),r=window.__veniceReveal;if(m&&e&&r)window.__testHandoff.push({t:performance.now(),state:r.state,p:r.progress,map:+getComputedStyle(m).opacity,emblem:+getComputedStyle(e).opacity});},100)},legacy);
 if(disableCache){const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});}
 if(process.env.VENICE_CASE==='late-splash3') await page.route('**/aleksandr_optimized_light_v2.glb*',async request=>{const delay=Math.max(0,23000-await page.evaluate(()=>performance.now()));await new Promise(resolve=>setTimeout(resolve,delay));await request.continue();});
 const r=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});
 if(!disableCache&&process.env.VENICE_DIAG){await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:60000});await page.reload({waitUntil:'domcontentloaded'});}
 try{
 await page.waitForFunction(()=>document.body.dataset.ready==='1'&&!document.querySelector('#splash')&&!document.querySelector('#map-layer')&&window.__veniceReveal?.mode==='run',null,{timeout:65000});
 const state=await page.evaluate(()=>({lang:document.documentElement.lang,ready:document.body.dataset.ready,ships:window.__veniceShipsReady,sceneVisible:getComputedStyle(document.querySelector('#scene')).visibility,children:window.__dbg.scene.children.length,errors:window.__veniceErrors,reveal:window.__veniceReveal,emblem:window.__splash3Emblem,old:localStorage.getItem('venice-ships-pos'),key:document.querySelector('#key').innerText,shipPositions:window.__dbg.scene.children.filter(x=>x.userData.isVeniceShip).map(x=>({name:x.userData.shipName,x:x.position.x,z:x.position.z})),handoff:window.__testHandoff}));
 assert.equal(state.lang,route==='/ru'?'ru':'en');assert.equal(state.ships.status,'ready');assert.equal(state.ships.loaded,3);assert.equal(state.ships.gpuPrepared,true);assert.equal(state.ships.rendered,true);assert.equal(state.sceneVisible,'visible');assert.equal(state.old,legacy);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 if(route==='/splash3'){assert.equal(state.emblem.released,true);if(!reduce)assert.ok(state.handoff.some(x=>x.p>0&&x.p<1&&Math.abs(x.map+x.emblem-1)<.002),'original engraving/emblem crossfade');}
 const screenshot=path.join(out,`${label}-${reduce?'reduced':'normal'}.png`);await page.screenshot({path:screenshot,timeout:60000});
 // Change age, language and controls in the real UI; the removed key must not regenerate.
 const initialYear=await page.evaluate(()=>__dbg.uniforms.uYear.value),sun=page.locator('.year-sun'),box=await sun.boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2-90,box.y+box.height/2,{steps:6});await page.mouse.up();
 assert.notEqual(await page.evaluate(()=>__dbg.uniforms.uYear.value),initialYear,'sun drag changes year');
 await page.locator('#play').click();await page.waitForTimeout(250);await page.locator('#play').click();
 for(const lang of ['en','it','ru']){await page.evaluate(async lang=>{const i=await import('/i18n.js');i.setLang(lang)},lang);await page.waitForTimeout(100);assert.equal(await page.locator('#key').innerText(),'','requested age explanation/legend absent after language or year changes');}
 reports.push({route,reduce,disableCache,status:r.status(),state,screenshot,errors,bad,failed,result:'PASS'});
 }catch(e){failures.push(`${route} ${reduce?'reduced':'normal'}: ${e.message}`);reports.push({route,reduce,disableCache,result:'FAIL',error:e.message,errors,bad,failed,state:await page.evaluate(()=>({ready:document.body.dataset.ready,loading:document.querySelector('#loading')?.innerText,key:document.querySelector('#key')?.innerText,handoff:window.__testHandoff,emblem:window.__splash3Emblem,reveal:window.__veniceReveal,ships:window.__veniceShipsReady}))});}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(reports,null,2));const last=reports.at(-1);console.log(JSON.stringify({...last,state:last.state?{...last.state,handoff:{samples:last.state.handoff?.length,first:last.state.handoff?.[0],last:last.state.handoff?.at(-1)}}:null}));await context.close();
}}finally{await browser.close()}
assert.deepEqual(failures,[],failures.join('\n'));console.log('PASS full-app timeline/routes: '+out);
