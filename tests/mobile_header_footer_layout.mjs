import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Stylesheet/DOM fixture, NOT full WebGL runtime acceptance. All real HTML and
// assets are served; only startup scripts are replaced by real i18n + emblem.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(repo, 'reports/site-footer/mobile-layout');
fs.mkdirSync(out, { recursive: true });
const html = fs.readFileSync(path.join(repo, 'web/index.html'), 'utf8')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  .replace('</body>', `<script src="/site-footer.js"></script><script src="/draggable-emblem.js"></script>
<script type="module">
import {applyStatic, setLang, getLang} from '/i18n.js';
applyStatic();
const sync=()=>document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.lang===getLang())));
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{setLang(b.dataset.lang);sync()});sync();
document.querySelector('#loading').hidden=true;
window.__layoutFixtureReady=true;
</script></body>`);
const viewports = [{width:320,height:800},{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:768,height:1024},{width:844,height:390}];
const browser = await chromium.launch({ headless: true });
const measurements=[];let failures=0;
const close=(a,b)=>assert.ok(Math.abs(a-b)<.1,`${a} != ${b}`);
try {
  for(const viewport of viewports) for(const lang of ['en','ru']) {
    const context=await browser.newContext({viewport,locale:'en-US'});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('http://layout.test/**',route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/' || url.pathname==='/ru') return route.fulfill({contentType:'text/html',body:html});
      const file=path.join(repo,'web',decodeURIComponent(url.pathname.slice(1)));
      return fs.existsSync(file)?route.fulfill({path:file}):route.fulfill({status:404,body:'not found'});
    });
    try {
      await page.goto(`http://layout.test/${lang==='ru'?'ru':''}?lang=${lang}`);
      await page.waitForFunction(()=>window.__layoutFixtureReady && document.querySelector('.venice-arms').parentElement===document.body);
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
      await page.waitForFunction(()=>parseFloat(document.documentElement.style.getPropertyValue('--site-footer-height'))===document.querySelector('#venice-site-footer').getBoundingClientRect().height);
      const metrics=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        const hit=e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('button,a')===e};
        const footer=document.querySelector('#venice-site-footer'), bar=document.querySelector('nav.bar');
        return {viewport:{width:innerWidth,height:innerHeight},lang:document.documentElement.lang,
          masthead:rect(document.querySelector('.masthead')),emblem:rect(document.querySelector('.venice-arms')),
          bar:rect(bar),barScrollWidth:bar.scrollWidth,barClientWidth:bar.clientWidth,
          footer:rect(footer),text:rect(footer.querySelector('span')),social:rect(footer.querySelector('.footer-social')),time:rect(document.querySelector('.time')),
          overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth,
          links:[...footer.querySelectorAll('a')].map(e=>({text:e.getAttribute('aria-label')||e.textContent,hit:hit(e)})),
          menu:[...bar.querySelectorAll('.lenses button:not([hidden]),.notes-open')].map(e=>({text:e.textContent,font:getComputedStyle(e).fontSize,rect:rect(e),hit:hit(e)})),
          searchHit:innerWidth<=720?hit(document.querySelector('.find-open')):null};
      });
      measurements.push(metrics);
      close(metrics.text.left,30);close(viewport.width-metrics.social.right,30);
      assert.equal(metrics.lang,lang);assert.equal(metrics.overflow,false,JSON.stringify(metrics));
      assert.equal(metrics.links.length,5);assert.ok(metrics.links.every(x=>x.hit),JSON.stringify(metrics.links));
      // Owner contract: attribution left, four social icons right, one row.
      assert.ok(metrics.text.right<metrics.social.left);
      close((metrics.text.top+metrics.text.bottom)/2,(metrics.social.top+metrics.social.bottom)/2);
      assert.ok(metrics.time.bottom<=metrics.footer.top-(viewport.width<=720?8:12)+.1);
      assert.ok(metrics.masthead.right<=viewport.width);assert.ok(metrics.masthead.bottom<=metrics.bar.top);
      assert.ok(metrics.masthead.left>=metrics.emblem.right+13.9,'default emblem must not cover wordmark');
      assert.ok(metrics.bar.left>=metrics.emblem.right+13.9,'default emblem must not cover menu hit areas');
      assert.ok(metrics.bar.bottom<=metrics.time.top,'header and timeline must not overlap in landscape');
      assert.ok(metrics.menu.every(x=>x.font==='18.2px'));
      if(viewport.width<=720) {
        assert.equal(metrics.searchHit,true,'fixed search button must not be clipped by scroll container');
        await page.evaluate(()=>document.body.classList.add('finding'));
        const search=await page.locator('#find').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===e}});
        assert.ok(search.left>=0 && search.right<=viewport.width && search.hit,JSON.stringify(search));
        await page.evaluate(()=>document.body.classList.remove('finding'));
      }
      for(const control of await page.locator('nav.bar .lenses button:not([hidden]),nav.bar .notes-open,#langs button').all()) {
        await control.scrollIntoViewIfNeeded();
        const visible=await control.evaluate(e=>{const r=e.getBoundingClientRect(),bar=document.querySelector('nav.bar').getBoundingClientRect();return {left:r.left,right:r.right,barLeft:bar.left,barRight:bar.right,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('button')===e}});
        assert.ok(visible.left>=0 && visible.right<=viewport.width+.1 && visible.hit,`scroll reachable ${await control.innerText()}: ${JSON.stringify(visible)}`);
      }
      const active=page.locator(`#langs [data-lang="${lang==='ru'?'en':lang}"]`);await active.click();
      assert.equal(await active.getAttribute('aria-pressed'),'true');
      // Real About DOM, final real repository link, opened without app/WebGL.
      await page.evaluate(()=>{document.querySelector('#dock').hidden=false;document.querySelector('#notes').hidden=false});
      const last=page.locator('#notes .repo a');await last.scrollIntoViewIfNeeded();
      const dock=await last.evaluate(e=>{const r=e.getBoundingClientRect(),d=document.querySelector('#dock').getBoundingClientRect(),f=document.querySelector('#venice-site-footer').getBoundingClientRect();return {bottom:d.bottom,footerTop:f.top,linkBottom:r.bottom,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('a')===e}});
      metrics.dock=dock;
      assert.ok(dock.hit,JSON.stringify(dock));assert.ok(dock.linkBottom<=dock.footerTop+.1);
      if(viewport.width<=720) assert.ok(dock.bottom<=dock.footerTop+.1);
      await page.evaluate(()=>{document.querySelector('#dock').hidden=true;document.querySelector('nav.bar').scrollLeft=0});
      await page.screenshot({path:path.join(out,`layout-${viewport.width}x${viewport.height}-${lang}.png`),fullPage:true});
      assert.deepEqual(errors,[]);console.log('PASS stylesheet/mobile layout',viewport,lang);
    } catch(error) {failures++;console.error('FAIL stylesheet/mobile layout',viewport,lang,error.message);await page.screenshot({path:path.join(out,`failure-${viewport.width}x${viewport.height}-${lang}.png`),fullPage:true});}
    await context.close();
  }
} finally {await browser.close();fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(measurements,null,2));}
assert.equal(measurements.length,viewports.length*2);
console.log(`Layout fixture: ${measurements.length} viewports/locales measured, failures=${failures}; ${out}`);
if(failures)process.exitCode=1;
