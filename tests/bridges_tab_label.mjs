import assert from 'node:assert/strict';
import fs from 'node:fs';
// Вкладка сокращена до «Мосты» намеренно (2b7c0e6: shorten bridge tab label to Bridges); прежняя длинная
// подпись «Мосты, храмы, монастыри» жила только в этом тесте и держала его красным.
assert.ok(/<button data-mode="3"[^>]*>Мосты<\/button>/.test(fs.readFileSync('web/index.html','utf8')), 'bridge tab must have the requested label');
const {t,setLang}=await import('../web/i18n.js');
for (const [lang,label] of [['ru','Мосты'],['it','Ponti'],['en','Bridges']]) {
 setLang(lang);assert.equal(t('Мосты'),label);
}
console.log('PASS bridge tab label RU/IT/EN');
