import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('web'), remote=process.argv[2];
const server=remote?null:createServer((req,res)=>{
 const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const file=path===root?resolve(root,'index.html'):path;res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404).end();}
});
if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=remote||`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
const report=[], errors=[];
async function audit(page,lang,state){
 const hits=await page.evaluate(()=>{
  const re=/openstreetmaps?|openstereetmaps?|\bOSM\b/i,hits=[];
  const visible=el=>el&&!el.closest('#notes,script,style')&&el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while(node=walk.nextNode())if(visible(node.parentElement)&&re.test(node.nodeValue))hits.push(node.nodeValue.trim());
  for(const el of document.querySelectorAll('[title],[aria-label],[alt],a[href]'))if(visible(el))for(const key of ['title','aria-label','alt','href']){const value=el.getAttribute(key)||'';if(re.test(value)||key==='href'&&/openstreetmap|\.osm\b/i.test(value))hits.push(`${key}: ${value}`);}
  return hits;
 });
 assert.deepEqual(hits,[],`${lang} ${state}`);report.push({lang,state,forbiddenMentions:0});
}
try{
 for(const lang of ['ru','it','en']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  // Hold the actual dataset briefly so the real loading splash can be inspected.
  await page.route('**/data/venezia.json',async route=>{await new Promise(r=>setTimeout(r,1800));await route.continue();});
  await page.goto(base+`?lang=${lang}`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('#splash').waitFor({state:'visible'});await audit(page,lang,'splash');
  await page.waitForFunction(()=>document.body.dataset.ready==='1'&&window.__dbg,null,{timeout:120000});
  await page.waitForFunction(()=>!document.querySelector('#splash'),null,{timeout:30000});await audit(page,lang,'initial');
  const title={ru:'О проекте',it:'Informazioni sul progetto',en:'About the project'}[lang];
  assert.equal(await page.locator('.notes-open').innerText(),lang==='ru'?'О проекте':'Info');
  await page.locator('.notes-open').click();assert.equal(await page.locator('#notes-title').innerText(),title);
  const about=await page.locator('#notes').innerText();assert.match(about,/OpenStreetMap/);assert.match(about,/ODbL 1\.0/);assert.match(about,/©/);
  assert.equal(await page.locator('#notes a[href="https://www.openstreetmap.org/copyright"]').count(),1);await audit(page,lang,'About with attribution');
  await page.locator('.dock-close').click();
  await page.locator('.walks-open').click();await page.locator('[data-bridge-route-open]').waitFor();await audit(page,lang,'walks async entries');
  await page.locator('[data-bridge-route-open]').click();await page.locator('[data-bridge-route-toggle]').waitFor();
  await page.locator('.bridge-route-page details').evaluateAll(els=>els.forEach(el=>el.open=true));await audit(page,lang,'bridge route expanded');
  const aboutLink=page.locator('.bridge-route-page a[href="#notes"]').first();await aboutLink.click();assert.equal(await page.locator('#notes-title').innerText(),title);
  await page.locator('.walks-open').click();await page.locator('[data-church-route-open]').click();await page.locator('[data-church-route-toggle]').waitFor();
  await page.locator('.church-route-page details').evaluateAll(els=>els.forEach(el=>el.open=true));await audit(page,lang,'church route expanded');
  await page.locator('.dock-close').click();await page.locator('#find').fill('Palazzo Ducale');await page.locator('#find-results [role="option"]').first().waitFor();await audit(page,lang,'search');
  await page.locator('#find-results [role="option"]').first().click();await page.locator('.b-card').waitFor();await audit(page,lang,'representative building card');
  await page.locator('.dock-close').click();
  const hover=await page.evaluate(()=>{for(const y of [300,400,500,600])for(const x of [400,600,800,1000])if(window.__dbg.pick(x,y)>=0)return{x,y};return null;});
  assert.ok(hover,'real building hover target');await page.mouse.move(hover.x,hover.y);await page.locator('#tip').waitFor({state:'visible',timeout:30000});await audit(page,lang,'building tooltip');
  await page.mouse.move(20,20);
  await page.evaluate(()=>{const d=window.__dbg;let gid;for(let g=0;g<11602;g++)if(d.building(g).src===1){gid=g;break;}if(gid===undefined)throw Error('missing bridge card');d.openBuilding(gid);});await audit(page,lang,'bridge structure card');
  await page.evaluate(()=>{const d=window.__dbg;d.showStory(d.layers.find(l=>l.id==='works'));});await audit(page,lang,'bridge layer');
  await page.locator('#dock-live a[href="#notes"]').first().click();assert.equal(await page.locator('#notes-title').innerText(),title);
  await page.close();
  const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base+`?lang=${lang}`,{waitUntil:'domcontentloaded'});assert.equal(await nojs.locator('.notes-open').innerText(),'О проекте');await audit(nojs,lang,'no JavaScript');await nojs.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({base,checks:report.length,report,pageErrors:errors,aboutSourceLinksWork:true}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
