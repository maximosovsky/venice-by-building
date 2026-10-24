import assert from 'node:assert/strict';
import fs from 'node:fs';
assert.ok(/<button data-mode="3"[^>]*>Мосты, храмы, монастыри<\/button>/.test(fs.readFileSync('web/index.html','utf8')), 'bridge tab must have the requested label');
const {t,setLang}=await import('../web/i18n.js');
for (const [lang,label] of [['ru','Мосты, храмы, монастыри'],['it','Ponti, templi, monasteri'],['en','Bridges, temples, monasteries']]) {
 setLang(lang);assert.equal(t('Мосты, храмы, монастыри'),label);
}
console.log('PASS bridge tab label RU/IT/EN');
