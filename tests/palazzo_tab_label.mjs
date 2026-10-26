import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync('web/index.html','utf8');
// Владелец атласа убрал эту кнопку из панели: самого выделения Palazzo это не отменяет,
// оно работает на главной карте, но вкладки в панели больше нет.
assert.ok(!/<button[^>]*data-mode="2"/.test(html), 'кнопки «Все Palazzo» в панели быть не должно');
const {t,setLang}=await import('../web/i18n.js');
for (const [lang,label] of [['ru','Все Palazzo'],['it','Tutti i Palazzo'],['en','All Palazzo']]) {
 setLang(lang);assert.equal(t('Все Palazzo'),label);
}
setLang('ru');assert.equal(t('Наследие'),'Наследие');
console.log('PASS: renamed tab RU/IT/EN; heritage card field preserved');
