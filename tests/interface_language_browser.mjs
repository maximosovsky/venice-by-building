// Real DOM + real i18n/splash modules; replace only the costly city boot.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const web = new URL('../web/', import.meta.url);
const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const cases = [
  ['/', 'ru', 'en'], ['/', null, 'en'], ['/splash3', 'ru', 'en'],
  ['/ru', 'en', 'ru'], ['/ru/', 'en', 'ru'],
  ['/ru?lang=en', 'en', 'ru'], ['/ru/?lang=it', 'en', 'ru'],
  ['/?lang=it', 'ru', 'it'], ['/?lang=ru', 'en', 'ru'],
  ['/?lang=invalid', 'ru', 'en'],
];
const titles = {en:'Venice, building by building',ru:'Венеция, здание за зданием',it:'Venezia, edificio per edificio'};
const age = {en:'Age',ru:'Возраст',it:'Età'};
const fatal = {en:'The map could not be built.',ru:'Не удалось построить карту.',it:'Non è stato possibile costruire la mappa.'};
const browser = await chromium.launch({headless:true});
let failures = [];
try {
 for (const [route, saved, expected] of cases) {
  const context = await browser.newContext({locale:'ru-RU'});
  const page = await context.newPage();
  const errors = [], badAssets = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => {if(e.type()==='error') errors.push(e.text());});
  await context.addInitScript(s => s===null ? localStorage.removeItem('venice-lang') : localStorage.setItem('venice-lang', s), saved);
  await page.route('http://atlas.test/**', async r => {
   const u = new URL(r.request().url());
   if (u.pathname.startsWith('/ru/')) badAssets.push(u.pathname);
   let file = u.pathname === '/' || /^\/ru\/?$/.test(u.pathname) ? 'index.html' : u.pathname === '/splash3' ? 'splash3.html' : u.pathname.slice(1);
   if (file === 'app.js') return r.fulfill({contentType:'text/javascript',body:`import * as i18n from './i18n.js'; i18n.applyStatic(); document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>i18n.setLang(b.dataset.lang)); window.__languageFixture=i18n;`});
   try {
    const body = fs.readFileSync(new URL(file, web));
    const ext = path.extname(file);
    await r.fulfill({body,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'})[ext] || 'application/octet-stream'});
   } catch { await r.fulfill({status:404,body:'Not found'}); }
  });
  try {
   await page.goto('http://atlas.test'+route);
   await page.waitForFunction(()=>!!window.__languageFixture);
   assert.equal(await page.evaluate(()=>window.__languageFixture.getLang()), expected, route+' initial module language');
   assert.equal(await page.locator('html').getAttribute('lang'), expected);
   assert.equal(await page.locator('.lenses button[data-mode="0"]').textContent(), age[expected]);
   assert.equal(await page.locator('#splash .mark').textContent(), expected==='ru' ? 'Венеция, дом за домом' : titles[expected]);
   assert.equal(await page.title(), titles[expected]);
   for (const selector of ['meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]']) {
    const value = await page.locator(selector).getAttribute('content');
    assert.equal(/[а-яё]/i.test(value), expected==='ru', selector+' language');
   }
   assert.equal(await page.locator('#langs').getAttribute('aria-label'), {en:'Language',it:'Lingua',ru:'Язык'}[expected]);
   assert.equal(await page.evaluate(()=>fatalLang()), expected);
   assert.equal(await page.evaluate(()=>document.querySelector('script[src*="app.js"]').src), 'http://atlas.test/app.js?v=ships-ready-1');
   assert.equal(await page.evaluate(()=>new URL('data/venezia.json', document.baseURI).pathname), '/data/venezia.json');
   assert.deepEqual(badAssets.filter(x=>!/^\/ru\/$/.test(x)), []);
   for (const next of ['en','it','ru','en']) {
    await page.locator(`[data-lang="${next}"]`).click();
    assert.equal(await page.evaluate(()=>window.__languageFixture.getLang()),next);
    assert.equal(await page.locator('.lenses button[data-mode="0"]').textContent(),age[next]);
    assert.equal(await page.evaluate(()=>fatalLang()),next);
    assert.equal(await page.title(),titles[next]);
   }
   await page.evaluate(()=>showFatal('test failure'));
   assert.equal(await page.locator('#loading b').textContent(),fatal.en);
   assert.deepEqual(errors, [], route+' browser errors');
   console.log('PASS '+route+' saved='+saved+' browser=ru: '+expected+'; switches, metadata, splash, fatal, root assets');
  } catch (e) { failures.push(route+': '+e.message); }
  finally { await context.close(); }
 }
 const rewrites = config.rewrites || [];
 try {
  assert.ok(rewrites.some(r=>r.source==='/ru(/)?' && r.destination==='/'), 'one optional-trailing /ru rewrite to main index.html');
  assert.ok((config.headers||[]).some(h=>h.source==='/ru(/)?' && h.headers.some(v=>v.key.toLowerCase()==='x-robots-tag' && v.value==='noindex, nofollow')), 'exact and trailing /ru noindex response header');
  for(const file of ['index.html','splash3.html']) assert.doesNotMatch(fs.readFileSync(new URL(file,web),'utf8'), /href=["'](?:https:\/\/venice-by-building\.vercel\.app)?\/ru\/?["']/,'Russian route remains unlinked');
  console.log('PASS unlinked /ru rewrite and noindex headers');
 } catch(e) {failures.push(e.message);}
} finally {await browser.close();}
assert.deepEqual(failures, [], failures.join('\n'));
console.log('PASS interface language routing suite');
