import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const web = fileURLToPath(new URL('../web/', import.meta.url));
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.wasm':'application/wasm', '.png':'image/png', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(web, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless:true });
try {
  const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => document.body.dataset.ready === '1' && !document.querySelector('#splash'), null, { timeout:120000 }).catch(async e => { console.error('READINESS', await page.evaluate(() => ({ ready:document.body.dataset.ready, loading:document.querySelector('#loading')?.textContent, ships:window.__veniceShipsReady?.status, errors:window.__veniceErrors })), errors); throw e; });
  const footer = page.locator('#venice-site-footer');
  assert.equal(await footer.locator('span').innerText(), '2026 | Maxim Osovsky');
  assert.deepEqual(await footer.locator('li a').evaluateAll(es => es.map(e => e.getAttribute('aria-label'))), ['LinkedIn','X','GitHub','Telegram']);
  assert.equal(await footer.locator('.social-instagram, a[href*="/LICENSE"]').count(), 0);
  const reference = fs.readFileSync('D:/100_GitHub Design Code/site-design/template/index.html', 'utf8').match(/<footer\b[\s\S]*?<\/footer>/)[0].replace(/<li>[\s\S]*?<\/li>/g, b => /social-youtube|social-devto|social-instagram/.test(b) ? '' : b);
  assert.deepEqual(await footer.locator('svg path').evaluateAll(es => es.map(e => e.getAttribute('d'))), [...reference.matchAll(/\bd="([^"]+)"/g)].map(m => m[1]));
  assert.deepEqual(await footer.locator('li a').evaluateAll(es => es.map(e => getComputedStyle(e).color)), ['rgb(10, 102, 194)','rgb(0, 0, 0)','rgb(51, 51, 51)','rgb(0, 136, 204)']);
  const sizes = await footer.evaluate(e => ({ inset:getComputedStyle(e.querySelector('.container')).paddingLeft, text:getComputedStyle(e.querySelector('span')).fontSize, svg:getComputedStyle(e.querySelector('svg')).width, target:getComputedStyle(e.querySelector('li a')).width }));
  assert.deepEqual(sizes, { inset:'30px', text:'10.5px', svg:'18px', target:'21px' });
  const sun = page.locator('.year-sun');
  await sun.hover();
  assert.equal(await sun.evaluate(e => getComputedStyle(e).cursor), 'grab');
  const before = Number(await page.locator('#hist').getAttribute('aria-valuenow'));
  const box = await sun.boundingBox();
  await page.mouse.down();
  assert.equal(await sun.evaluate(e => getComputedStyle(e).cursor), 'grabbing');
  await page.mouse.move(box.x + box.width / 2 - 180, box.y + box.height / 2, { steps:12 });
  const after = Number(await page.locator('#hist').getAttribute('aria-valuenow'));
  assert.ok(after < before, `sun drag must change year: ${before} -> ${after}`);
  await page.mouse.up();
  assert.equal(await sun.evaluate(e => getComputedStyle(e).cursor), 'grab');
  assert.deepEqual(errors, []);
  console.log('PASS real atlas footer/sun smoke', JSON.stringify({ text:await footer.locator('span').innerText(), icons:4, sizes, hover:'grab', active:'grabbing', yearBefore:before, yearAfter:after, errors }));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
