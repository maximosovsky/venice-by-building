import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.env.SITE_FOOTER_REFERENCE || 'D:/100_GitHub Design Code/site-design/template';
const reference = fs.readFileSync(path.join(source, 'index.html'), 'utf8').match(/<footer\b[\s\S]*?<\/footer>/)[0].replace(/<li>[\s\S]*?<\/li>/g, block => /social-youtube|social-devto|social-instagram/.test(block) ? '' : block);
const expectedPaths = [...reference.matchAll(/\bd="([^"]+)"/g)].map(m => m[1]);
const expectedViews = [...reference.matchAll(/viewBox="([^"]+)"/g)].map(m => m[1]);
const links = ['https://www.linkedin.com/in/osovsky/', 'https://x.com/maximosovsky', 'https://github.com/maximosovsky', 'https://t.me/maxim_osovsky'];
const colors = ['rgb(10, 102, 194)', 'rgb(0, 0, 0)', 'rgb(51, 51, 51)', 'rgb(0, 136, 204)'];
const browser = await chromium.launch({ headless: true });
let failures = 0;
async function test(name, run) {
  try { await run(); console.log('PASS', name); }
  catch (error) { failures++; console.error('FAIL', name, error.message); }
}
const close = (a, b) => assert.ok(Math.abs(a - b) < .06, `${a} != ${b}`);
await test('standalone footer assets exist', () => {
  assert.ok(fs.existsSync(path.join(repo, 'web/site-footer.js')), 'missing additive footer JS');
  assert.ok(fs.existsSync(path.join(repo, 'web/site-footer.css')), 'missing additive footer CSS');
});
if (!failures) {
  const referencePage = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await referencePage.goto('file:///' + source.replaceAll('\\', '/') + '/index.html');
  const referenceMetrics = {};
  for (const width of [1440, 390]) {
    await referencePage.setViewportSize({ width, height: 900 });
    referenceMetrics[width] = await referencePage.locator('footer').evaluate(e => e.getBoundingClientRect().height);
  }
  console.log('REFERENCE HEIGHTS', JSON.stringify(referenceMetrics));
  await referencePage.close();
  for (const width of [1440, 390]) {
    await test(`${width}px: exact reference paths, links, active brand colors, scale and clearance`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const html = fs.readFileSync(path.join(repo, 'web/index.html'), 'utf8');
      const timeline = html.match(/<section class="time"[\s\S]*?<\/section>/)?.[0];
      assert.ok(timeline, 'use actual timeline markup, not an invented control');
      await page.setContent(`<html><body>${timeline}<div id="splash" style="position:fixed;inset:0;background:#eddec6;z-index:40"></div></body></html>`);
      await page.addStyleTag({ path: path.join(repo, 'web/styles.css') });
      const baseline = await page.locator('.time').evaluate(e => parseFloat(getComputedStyle(e).bottom));
      await page.addStyleTag({ path: path.join(repo, 'web/site-footer.css') });
      await page.addScriptTag({ path: path.join(repo, 'web/site-footer.js') });
      const footer = page.locator('#venice-site-footer');
      await footer.waitFor();
      await page.waitForTimeout(80);
      assert.equal(await footer.locator('span').innerText(), '2026 | Maxim Osovsky');
      assert.equal(await footer.locator('span a').getAttribute('href'), links[0]);
      assert.equal(await footer.locator('li a').count(), 4);
      assert.equal(await footer.locator('.social-instagram').count(), 0);
      assert.deepEqual(await footer.locator('li a').evaluateAll(es => es.map(e => e.href)), links);
      assert.deepEqual(await footer.locator('svg path').evaluateAll(es => es.map(e => e.getAttribute('d'))), expectedPaths);
      assert.deepEqual(await footer.locator('svg').evaluateAll(es => es.map(e => e.getAttribute('viewBox'))), expectedViews);
      assert.deepEqual(await footer.locator('li a').evaluateAll(es => es.map(e => getComputedStyle(e).color)), colors);
      assert.deepEqual(await footer.locator('svg path').evaluateAll(es => es.map(e => getComputedStyle(e).fill)), colors);
      assert.ok(await footer.locator('li a').evaluateAll(es => es.every(e => e.getAttribute('aria-label') && e.rel.includes('noopener') && e.rel.includes('noreferrer'))));
      const metrics = await footer.evaluate(e => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        const a = e.querySelector('li a'), svg = e.querySelector('svg');
        const time = document.querySelector('.time').getBoundingClientRect();
        return { height: r.height, top: r.top, bottom: r.bottom, paddingTop: parseFloat(s.paddingTop), paddingBottom: parseFloat(s.paddingBottom), text: parseFloat(getComputedStyle(e.querySelector('span')).fontSize), svg: svg.getBoundingClientRect().height, target: a.getBoundingClientRect().height, timelineBottom: time.bottom, timelineOffset: parseFloat(getComputedStyle(document.querySelector('.time')).bottom), overflow: document.documentElement.scrollWidth > innerWidth, visible: [...e.querySelectorAll('li a')].every(a => { const r=a.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')===a; }) };
      });
      // New owner contract replaces the former template-height ratio.
      assert.ok(metrics.height < referenceMetrics[width] * .75);
      const edges = await footer.evaluate(e => {
        const r=e.getBoundingClientRect(), text=e.querySelector('.footer-inner span').getBoundingClientRect(), icons=e.querySelector('.footer-social').getBoundingClientRect();
        return {background:getComputedStyle(e).backgroundColor,wall:getComputedStyle(document.body).backgroundColor,left:text.left-r.left,right:r.right-icons.right};
      });
      assert.equal(edges.background, edges.wall);
      close(edges.left,30);close(edges.right,30);
      close(metrics.text, 10.5); close(metrics.svg, 18); close(metrics.target, 21);
      close(metrics.paddingTop, 11.25); close(metrics.paddingBottom, 5.625);
      close(metrics.timelineOffset, baseline + metrics.height);
      assert.ok(metrics.timelineBottom <= metrics.top - baseline + .1, JSON.stringify(metrics));
      assert.equal(metrics.bottom, 900); assert.equal(metrics.overflow, false); assert.equal(metrics.visible, true);
      await page.addScriptTag({ path: path.join(repo, 'web/site-footer.js') });
      assert.equal(await footer.count(), 1, 'self-installation is idempotent');
      await page.evaluate(() => document.querySelector('#splash').remove());
      await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 900 });
      await page.waitForTimeout(80);
      const resized = await footer.evaluate(e => ({ height:e.getBoundingClientRect().height, offset:parseFloat(getComputedStyle(document.querySelector('.time')).bottom) }));
      const resizedWidth = width === 390 ? 1440 : 390;
      assert.ok(resized.height < referenceMetrics[resizedWidth] * .75);
      close(resized.offset, resized.height + (resizedWidth <= 720 ? 8 : 12));
      assert.deepEqual(errors, []);
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(80);
      const out = path.join(repo, 'reports/site-footer'); fs.mkdirSync(out, { recursive:true });
      await page.screenshot({ path:path.join(out, `footer-${width}.png`) });
      console.log('METRICS', width, JSON.stringify(metrics));
      await page.close();
    });
  }
  await test('defer self-initializes before DOMContentLoaded without extra callers', async () => {
    const page = await browser.newPage();
    await page.route('http://footer.test/**', route => {
      const name = new URL(route.request().url()).pathname;
      if (name === '/') return route.fulfill({ contentType:'text/html', body:'<html><head><link rel="stylesheet" href="/site-footer.css"><script defer src="/site-footer.js"></script></head><body></body></html>' });
      return route.fulfill({ path:path.join(repo, 'web', name.slice(1)) });
    });
    await page.goto('http://footer.test/');
    assert.equal(await page.locator('#venice-site-footer').count(), 1);
    await page.close();
  });
}
await browser.close();
console.log(`${failures ? 'FAIL' : 'PASS'} site footer suite; failures=${failures}`);
if (failures) process.exitCode = 1;
