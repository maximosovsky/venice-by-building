// Startup paint/failure contract with the real head helper and blocked i18n download.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const web = new URL('../web/',import.meta.url);
const browser = await chromium.launch({headless:true});
try {
 for (const route of ['/', '/ru/']) {
  const context = await browser.newContext({locale:'ru-RU'});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await context.addInitScript(()=>localStorage.setItem('venice-lang','ru'));
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('http://paint.test/**',async r=>{
   const pathname=new URL(r.request().url()).pathname;
   const file=/^\/(?:ru\/?)?$/.test(pathname)?'index.html':pathname.slice(1);
   if (file==='i18n.js') await gate;
   if(file==='app.js') return r.fulfill({contentType:'text/javascript',body:''});
   try {const body=fs.readFileSync(new URL(file,web)); await r.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream'});}
   catch {await r.fulfill({status:404,body:'Not found'});}
  });
  await page.goto('http://paint.test'+route,{waitUntil:'commit'});
  await page.waitForFunction(()=>typeof showFatal==='function');
  const expected=route==='/'?'en':'ru';
  assert.equal(await page.locator('html').getAttribute('lang'),expected);
  assert.equal(await page.title(),expected==='en'?'Venice, building by building':'Венеция, здание за зданием','Head metadata resolves before the translation module finishes');
  assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).visibility),'hidden','No Russian source labels may paint while translation downloads');
  await page.evaluate(()=>showFatal('early initialization failure'));
  assert.equal(await page.locator('#loading b').textContent(),expected==='en'?'The map could not be built.':'Не удалось построить карту.');
  assert.equal(await page.locator('#loading').evaluate(e=>getComputedStyle(e).visibility),'visible','A translation load failure must not hide the fatal screen');
  release();
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-language-pending'));
  assert.equal(await page.locator('.lenses button[data-mode="0"]').textContent(),expected==='en'?'Age':'Возраст');
  assert.deepEqual(errors,[]);
  console.log('PASS '+route+' first paint gated until translation; early fatal visible in '+expected);
  await context.close();
 }
} finally {await browser.close();}
