// Scoped navigation acceptance: real documents and i18n, without costly city boot.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = path.resolve('web');
const main = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.equal(fs.readFileSync(path.join(root, 'splash3.html'), 'utf8'), main, 'whole-document main/splash parity');
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
const labels = {it:'Info', en:'Info', ru:'О проекте'};
const headings = {it:'Informazioni sul progetto', en:'About the project', ru:'О проекте'};
try {
  for (const entry of ['/', '/splash3']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('http://atlas.test/**', async route => {
      const url = new URL(route.request().url());
      const file = url.pathname === '/' ? 'index.html' : url.pathname === '/splash3' ? 'splash3.html' : url.pathname.slice(1);
      if (file === 'app.js') return route.fulfill({contentType:'text/javascript', body:"import * as i18n from './i18n.js'; window.__labelI18n = i18n;"});
      try {
        await route.fulfill({body:fs.readFileSync(path.join(root, file)), contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)] || 'application/octet-stream'});
      } catch { await route.fulfill({status:404, body:'Not found'}); }
    });
    await page.goto('http://atlas.test' + entry, {waitUntil:'load'});
    await page.waitForFunction(() => !!window.__labelI18n);
    for (const lang of ['it', 'en', 'ru']) {
      await page.evaluate(lang => window.__labelI18n.setLang(lang), lang);
      assert.equal(await page.locator('.notes-open').textContent(), labels[lang]);
      assert.equal(await page.locator('#notes-title').textContent(), headings[lang], 'About heading remains unchanged');
      console.log(`PASS ${entry} setLang(${lang}): navigation=${labels[lang]}, heading=${headings[lang]}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS main/splash whole-document parity; scoped translations; no page errors');
} finally { await browser.close(); }
