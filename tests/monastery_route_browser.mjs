import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('web');
const remote=process.argv[2];
const server=createServer((req,res)=>{const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(p!==root&&!p.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[p===root?'.html':extname(p)]||'application/octet-stream');res.end(readFileSync(p===root?resolve(root,'index.html'):p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${remote || `http://127.0.0.1:${server.address().port}/`}?lang=ru&shot`,{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>document.body.dataset.ready==='1'&&window.__dbg,null,{timeout:120000});
 // Вкладка «Сакральное» (mode 1) включает зелёный оверлей храмовых зданий; вкладка «Мосты» его больше не включает.
 await page.locator('.lenses [data-mode="1"]').click();
 // Владелец атласа: сакральная вкладка не красит храмы зелёным, они остаются в бирюзе главной.
 assert.equal(await page.evaluate(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible)),false,'сакральная вкладка не включает зелёную заливку храмов');
 // Сам оверлей остаётся доступен по своему источнику — включаем его явно.
 await page.evaluate(()=>window.__dbg.churchBuildingHighlight.setSourceVisible('church',true));
 await page.waitForFunction(()=>window.__dbg.churchBuildingHighlight.overlays.some(m=>m.visible),null,{timeout:30000});
 const report=await page.evaluate(()=>{
  const h=window.__dbg.churchBuildingHighlight,entry=h.manifest.buildings.find(b=>b.osm_id===138800498);let expected=0,actual=0,monasteryTriangles=0;
  // Каждый цвет — свой оверлей и свой набор gid: ожидание считается по классу цвета, а не по всему манифесту.
   const byClass={};for(const b of h.manifest.buildings){const c=(b.highlight_color||'#436817').toLowerCase();(byClass[c]=byClass[c]||new Set()).add(b.gid);}
   for(const mesh of h.overlays){actual+=mesh.geometry.index.count;const target=byClass['#'+(mesh.material.color||mesh.material.uniforms.uColor.value).getHexString()]||new Set();const t=mesh.parent.geometry,bld=t.attributes.bld.array,attr=mesh.parent.userData.draw.uniforms.uAttr.value.image.data,idx=t.index.array;
   for(let i=0;i<idx.length;i+=3){const gids=[idx[i],idx[i+1],idx[i+2]].map(v=>attr[(bld[v]&32767)*8+3]);if(gids.every(g=>target.has(g)))expected+=3;if(gids.every(g=>g===entry.gid))monasteryTriangles++;}}
  return {matched:h.manifest.matched_stops,expected,actual,monasteryTriangles,monasteryGid:entry.gid,colors:[...new Set(h.overlays.filter(m=>m.visible).map(m=>(m.material.color||m.material.uniforms.uColor.value).getHexString()))]};
 });
 // Манифест храмовых зданий содержит и глубокий синий #2f3f6b для послевоенных построек, поэтому
// проверяем, что зелёный класс виден и что других цветов, кроме объявленных в манифесте, нет.
 assert.ok(report.colors.includes('436817'),'зелёный оверлей храмов виден');
 assert.ok(report.colors.every(c=>['436817','2f3f6b'].includes(c)),'только цвета из манифеста: '+report.colors.join(','));assert.equal(report.actual,report.expected);assert.ok(report.monasteryTriangles>20);
 await page.locator('.walks-open').click();await page.locator('[data-church-route-open]').click();
 const data=await (await page.request.get(`${remote || `http://127.0.0.1:${server.address().port}/`}data/church-route.json`)).json();
 const index=data.stops.findIndex(s=>s.id==='monastery-Q61954738');await page.locator(`[data-church-stop="${index}"]`).click();
 // Нажатие на номер выводит карточку места; возвращаемся к панели маршрута кнопкой «Сакральное».
 await page.locator('.b-card').waitFor({timeout:20000});await page.locator('.dock-back').click();await page.locator('.church-stops').waitFor({timeout:20000});
 for(const lang of ['ru','it','en']){await page.locator(`#langs [data-lang="${lang}"]`).click();assert.ok((await page.locator('.church-route-page').innerText()).includes(data.title[lang]));}
 assert.deepEqual(errors,[]);const screenshot='C:/Users/1/AppData/Local/hermes/cache/scratch/venice-monastery-green.png';await page.screenshot({path:screenshot});
 console.log(JSON.stringify({...report,stops:data.stops.length,newStopFocus:true,languages:['ru','it','en'],pageErrors:errors,screenshot}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
