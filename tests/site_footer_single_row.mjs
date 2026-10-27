import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// One focused real-atlas pass; SITE_FOOTER_URL exercises the Git-deployed alias.
const web = fileURLToPath(new URL('../web/', import.meta.url));
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.wasm':'application/wasm', '.png':'image/png', '.woff2':'font/woff2' };
const server = process.env.SITE_FOOTER_URL ? null : http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(web, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = process.env.SITE_FOOTER_URL || `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless:true });
const near = (a,b) => assert.ok(Math.abs(a-b)<.1, `${a} != ${b}`);
try {
  const page = await browser.newPage({ viewport:{ width:320, height:900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === '1' && !document.querySelector('#splash'), null, { timeout:180000 });
  const widths = process.env.FOOTER_RED ? [320] : [320,360,390,430,1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height:900 });
    await page.waitForFunction(() => parseFloat(document.documentElement.style.getPropertyValue('--site-footer-height')) === document.querySelector('#venice-site-footer').getBoundingClientRect().height);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const m = await page.evaluate(() => {
      const footer = document.querySelector('#venice-site-footer'), inner = footer.querySelector('.footer-inner'), text = inner.querySelector('span'), social = footer.querySelector('.footer-social');
      const rect = e => { const r=e.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,cy:r.top+r.height/2}; };
      const hit = e => { const r=e.getBoundingClientRect(); return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('a')===e; };
      const s = getComputedStyle(inner), f = getComputedStyle(footer);
      return {width:innerWidth,textValue:text.innerText,footer:rect(footer),text:rect(text),social:rect(social),font:getComputedStyle(text).fontSize,direction:s.flexDirection,wrap:s.flexWrap,gap:s.gap,socialGap:getComputedStyle(social).gap,padding:[f.paddingTop,f.paddingBottom],overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth,timeBottom:document.querySelector('.time').getBoundingClientRect().bottom,reserved:parseFloat(document.documentElement.style.getPropertyValue('--site-footer-height')),links:[...footer.querySelectorAll('a')].map(e=>({href:e.href,hit:hit(e)})),icons:[...social.querySelectorAll('a')].map(e=>({label:e.getAttribute('aria-label'),rect:rect(e),svg:rect(e.querySelector('svg')),color:getComputedStyle(e).color}))};
    });
    console.log('FOOTER', JSON.stringify(m));
    assert.equal(m.textValue,'2026 | Maxim Osovsky');
    assert.equal(m.direction,'row');
    near(m.text.cy,m.social.cy);
    near(m.text.left,30); near(width-m.social.right,30);
    assert.ok(m.text.right < m.social.left,'text left, icons right, without overlap');
    assert.equal(m.overflow,false);
    assert.equal(m.font,'10.5px');
    assert.deepEqual(m.icons.map(x=>x.label),['LinkedIn','X','GitHub','Telegram']);
    assert.deepEqual(m.icons.map(x=>x.color),['rgb(10, 102, 194)','rgb(0, 0, 0)','rgb(51, 51, 51)','rgb(0, 136, 204)']);
    assert.deepEqual(m.links.map(x=>x.href),['https://www.linkedin.com/in/osovsky/','https://www.linkedin.com/in/osovsky/','https://x.com/maximosovsky','https://github.com/maximosovsky','https://t.me/maxim_osovsky']);
    assert.ok(m.links.every(x=>x.hit));
    for (const icon of m.icons) { near(icon.rect.width,21);near(icon.rect.height,21);near(icon.svg.width,18);near(icon.svg.height,18);near(icon.rect.cy,m.social.cy);assert.ok(icon.rect.left>=30 && icon.rect.right<=width-30); }
    near(m.reserved,m.footer.height);
    assert.ok(m.timeBottom <= m.footer.top-(width<=720?8:12)+.1);
    if (width===1440) { assert.equal(m.wrap,'wrap');assert.equal(m.gap,'9px');assert.equal(m.socialGap,'6px');assert.deepEqual(m.padding,['11.25px','5.625px']);near(m.footer.height,38.625); }
    if (width<=720) {
      await page.evaluate(() => { document.querySelector('#dock').hidden=false;document.querySelector('#notes').hidden=false; });
      const last=page.locator('#notes .repo a');await last.scrollIntoViewIfNeeded();
      const dock=await last.evaluate(e=>{const r=e.getBoundingClientRect(),d=document.querySelector('#dock').getBoundingClientRect(),f=document.querySelector('#venice-site-footer').getBoundingClientRect();return {bottom:d.bottom,footerTop:f.top,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('a')===e};});
      assert.ok(dock.bottom<=dock.footerTop+.1);assert.equal(dock.hit,true);
      await page.evaluate(()=>document.querySelector('#dock').hidden=true);
      console.log('DOCK',width,JSON.stringify(dock));
    }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS real atlas single-row footer',url);
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
