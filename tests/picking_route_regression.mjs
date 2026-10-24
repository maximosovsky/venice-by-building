import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:8873/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?lang=ru',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>document.body.dataset.ready==='1'&&window.__dbg,null,{timeout:120000});
 await page.locator('.walks-open').click();await page.locator('[data-bridge-route-open]').click();await page.locator('[data-bridge-route-toggle]').click();await page.waitForTimeout(2500);
 const result=await page.evaluate(async()=>{
  const d=window.__dbg,cfg=await(await fetch('data/venezia.json')).json();const count=cfg.tiles.reduce((sum,t)=>sum+t.n,0);
  const before=d.scene.children.map(x=>x.visible),invalid=[],valid=[];
  for(let y=160;y<innerHeight-70;y+=40)for(let x=40;x<innerWidth-40;x+=40){const gid=d.pick(x,y);if(gid>=count||gid< -1)invalid.push({x,y,gid});else if(gid>=0)valid.push({x,y,gid});}
  const after=d.scene.children.map(x=>x.visible);
  let negativeError,upperError;
  try{d.building(-1)}catch(e){negativeError=e.message}
  try{d.building(count)}catch(e){upperError=e.message}
  return {count,invalid,valid:valid.slice(0,5),before,after,negativeError,upperError,routeVisible:d.scene.children.some(x=>x.name==='all-bridges-route'&&x.visible)};
 });
 assert.deepEqual(result.invalid,[],'route colours must not become building IDs');
 assert.ok(result.valid.length,'real buildings remain pickable');assert.deepEqual(result.after,result.before,'picking restores visibility');assert.equal(result.routeVisible,true);
 assert.match(result.negativeError,/Invalid building ID/);assert.match(result.upperError,/Invalid building ID/);
 for(const p of result.valid)await page.mouse.move(p.x,p.y);
 await page.waitForTimeout(600);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({base,count:result.count,valid:result.valid,invalid:result.invalid,routeVisible:result.routeVisible,errors}));
}finally{await browser.close();}
