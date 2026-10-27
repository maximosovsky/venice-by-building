import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const css=fs.readFileSync(new URL('../web/styles.css',import.meta.url),'utf8');
const b=await chromium.launch({headless:true});
try{
 for(const width of [1440,1024,390]){
  const p=await b.newPage({viewport:{width,height:900}});
  await p.setContent('<nav class="bar"><div class="lenses"><button data-mode="0">Возраст</button><button data-mode="3">Мосты</button><button data-mode="1">Сакральное</button></div><button class="notes-open">О проекте</button><div class="langs"><button>РУС</button></div></nav><aside class="dock"><p>Card</p></aside>');
  await p.addStyleTag({content:css});
  for(const size of await p.locator('.lenses button, .notes-open').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize))))assert.equal(size,18.2);
  assert.equal(await p.locator('.langs button').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),12);
  await p.close();
 }
 console.log('PASS requested header menu 18.2px at desktop/tablet/mobile; language buttons unchanged');
}finally{await b.close()}
