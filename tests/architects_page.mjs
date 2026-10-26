// Список архитекторов и ссылки в карточках: данные, страница и подстановка в app.js.
// Имена и статьи берутся из Викиданных, поэтому проверяем прежде всего выравнивание ссылок с именами
// и то, что имя без статьи остаётся именем, а не превращается в выдуманную ссылку.
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const wiki = JSON.parse(readFileSync('web/data/wiki.json', 'utf8'));
const data = JSON.parse(readFileSync('web/data/architects.json', 'utf8'));
const app = readFileSync('web/app.js', 'utf8');
const pagePath = 'web/architects.html';
assert.ok(existsSync(pagePath), 'страница архитекторов должна существовать');
const page = readFileSync(pagePath, 'utf8');

const withArchitects = wiki.filter(record => record.architects && record.architects.length);
assert.ok(withArchitects.length > 100, `зданий с архитекторами должно быть больше сотни, найдено ${withArchitects.length}`);

for (const record of withArchitects) {
  assert.ok(record.architects_links, `${record.qid}: нет поля architects_links`);
  for (const lang of ['ru', 'it', 'en']) {
    assert.ok(Array.isArray(record.architects_links[lang]), `${record.qid}: ссылки ${lang} должны быть списком`);
    const names = (record.architects_la && record.architects_la[lang]) || record.architects;
    assert.equal(record.architects_links[lang].length, names.length,
      `${record.qid}: ссылки ${lang} выровнены по индексу с именами`);
    for (const url of record.architects_links[lang]) {
      if (url !== null) assert.match(url, /^https:\/\/(ru|it|en)\.wikipedia\.org\/wiki\/\S+$/, `${record.qid}: ссылка ${lang} ведёт в Википедию`);
    }
  }
}

assert.ok(data.architects.length >= 50, `имён в списке должно быть не меньше полусотни, найдено ${data.architects.length}`);
// Имена в карточках бывают и текстом статьи, не только из свойства P84: такие записи получают
// пустые ссылки и остаются текстом, поэтому счёт зданий с P84 не больше числа записей с именами.
const uniqueWithArchitects = new Set(withArchitects.map(r => r.qid)).size;
assert.ok(data.buildings_with_architects > 100 && data.buildings_with_architects <= uniqueWithArchitects,
  `зданий с P84: ${data.buildings_with_architects}, записей с именами: ${uniqueWithArchitects}`);
// Викиданные не всегда дают русскую подпись: имя обязано быть хотя бы на одном языке,
// остальное — как есть, без выдумывания перевода.
assert.ok(data.architects.every(a => a.name.ru || a.name.it || a.name.en), 'у каждого имени есть подпись');
const withRussian = data.architects.filter(a => a.name.ru).length;
assert.ok(withRussian > 0, 'русские подписи должны быть хотя бы у части имён');
const without = data.architects.filter(a => !a.wikipedia || !Object.keys(a.wikipedia).length);
assert.ok(data.architects.every(a => a.buildings.length > 0), 'у каждого имени перечислены здания');
assert.ok(without.every(a => !a.wikipedia.ru), 'у имени без статьи нет выдуманной ссылки');
for (const architect of data.architects) {
  for (const url of Object.values(architect.wikipedia)) {
    assert.match(url, /^https:\/\/(ru|it|en)\.wikipedia\.org\/wiki\/\S+$/);
  }
}

assert.ok(app.includes('architects_links'), 'карточка берёт ссылки из записи wiki.json');
assert.match(app, /const architectList = w =>/, 'имена архитекторов собираются одной функцией');
assert.match(app, /links\[i\] \? link\(links\[i\], name\) : esc\(name\)/, 'имя без статьи остаётся текстом');
assert.ok(page.includes('data/architects.json'), 'страница читает тот же файл данных');
assert.ok(page.includes('статьи в Википедии нет'), 'на странице видно, у кого статьи нет');
assert.ok(!/var A = false/.test(page), 'в странице нет мусорной переменной');

console.log(JSON.stringify({buildings_with_architects: withArchitects.length, architects: data.architects.length,
  with_wikipedia: data.architects.length - without.length, without_wikipedia: without.map(a => a.name.en || a.qid),
  page: pagePath}));