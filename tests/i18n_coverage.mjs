#!/usr/bin/env node
// Полнота перевода: ни один русский текст, который видит человек, не должен остаться без
// итальянского и английского. Проверяются страница, код и данные конвейера.
//
//   node tests/i18n_coverage.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DICT_ALL, LANGS, norm, t, pick, setLang, translateTree } from '../web/i18n.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const CYR = /[а-яА-ЯёЁ]/;

let failures = [], checks = 0;
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

// --- 1. Словари: обе стороны заполнены, ключи совпадают, подстановки не потеряны.
const ruKeys = new Set([...Object.keys(DICT_ALL.it), ...Object.keys(DICT_ALL.en)]);
const onlyIt = Object.keys(DICT_ALL.it).filter(k => !(k in DICT_ALL.en));
const onlyEn = Object.keys(DICT_ALL.en).filter(k => !(k in DICT_ALL.it));
check(onlyIt.length === 0, `есть только по-итальянски: ${onlyIt.slice(0, 5).join(' | ')}`);
check(onlyEn.length === 0, `есть только по-английски: ${onlyEn.slice(0, 5).join(' | ')}`);
for (const lang of ['it', 'en']) {
  for (const [k, v] of Object.entries(DICT_ALL[lang])) {
    check(typeof v === 'string' && v.trim().length > 0, `${lang}: пустой перевод для «${k.slice(0, 50)}»`);
    const ph = s => (s.match(/\{(\w+)\}/g) || []).sort().join(',');
    check(ph(k) === ph(v), `${lang}: подстановки не совпадают для «${k.slice(0, 50)}» (${ph(k)} → ${ph(v)})`);
    check(!CYR.test(v), `${lang}: перевод всё ещё содержит кириллицу: «${k.slice(0, 40)}» → «${v.slice(0, 40)}»`);
  }
}
check(ruKeys.size > 120, `словарь слишком мал: ${ruKeys.size} ключей`);

// --- 2. Страница: каждый русский текст и подпись должны быть в словаре.
const html = read('web/index.html');
// Содержимое с data-no-i18n модуль не переводит (сам переключатель языка), и тест тоже не требует.
const body = html.split('<body>')[1].split('</body>')[0]
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<[^>]*data-no-i18n[^>]*>[\s\S]*?<\/div>/g, '')
  .replace(/<[^>]*data-no-i18n[^>]*>/g, '');
const missing = [];
for (const m of body.matchAll(/>([^<>]*)</g)) {
  const text = norm(m[1]);
  if (text.length > 1 && CYR.test(text) && !(text in DICT_ALL.it)) missing.push(text);
}
for (const m of body.matchAll(/(?:placeholder|aria-label|title|content|alt)="([^"]+)"/g)) {
  const text = norm(m[1]);
  if (CYR.test(text) && !(text in DICT_ALL.it)) missing.push(`[подпись] ${text}`);
}
const uniqMissing = [...new Set(missing)];
check(uniqMissing.length === 0,
  `страница: без перевода ${uniqMissing.length} текстов, например:\n    ` + uniqMissing.slice(0, 8).join('\n    '));

// --- 3. Данные конвейера: сюжеты, эпохи, слои — их русский текст тоже должен переводиться.
const layers = JSON.parse(read('web/data/layers.json'));
const cfg = JSON.parse(read('web/data/venezia.json'));
const dataKeys = new Set();
for (const L of layers) {
  for (const v of [L.section, L.title, L.era, L.text, L.caveat, L.source?.label, ...(L.groups || []).map(g => g.label)]) {
    if (typeof v === 'string' && CYR.test(v)) dataKeys.add(norm(v));
  }
}
for (const p of cfg.periods) if (CYR.test(p.label)) dataKeys.add(norm(p.label));
for (const h of cfg.heritage?.labels || []) if (CYR.test(h)) dataKeys.add(norm(h));
const dataMissing = [...dataKeys].filter(k => !(k in DICT_ALL.it) || !(k in DICT_ALL.en));
check(dataMissing.length === 0,
  `данные конвейера: без перевода ${dataMissing.length}, например:\n    ` + dataMissing.slice(0, 6).join('\n    '));

// --- 4. Сам перевод работает: подстановка, выбор языка, откат на исходник.
check(t('Возраст') === 'Возраст', 'на русском t() должна вернуть исходник');
check(pick({ ru: 'Возраст', en: 'Age', it: 'Età' }) === 'Возраст', 'pick() должна взять текущий язык (ru)');
check(pick('Возраст') === 'Возраст', 'pick() от строки должна вернуть исходник');
check(norm('  Все\u00a011\u00a0137  зданий ') === 'Все 11 137 зданий', 'norm() не приводит пробелы к одному виду');

// --- 5. Страница: переключатель языка на месте и связан с модулем.
check(/id="langs"[\s\S]{0,300}data-lang="it"[\s\S]{0,200}data-lang="en"/.test(html), 'в шапке нет переключателя языка');
const app = read('web/app.js');
check(app.includes("from './i18n.js'"), 'app.js не подключает словарь');
check(/setLang\(b\.dataset\.lang\)/.test(app), 'кнопки языка не связаны со сменой языка');
check(/onLang\(/.test(app), 'смена языка не перерисовывает карточки и подписи');
check(/pick\(/.test(app) || /pickText\(/.test(app), 'подписи из данных не проходят через pickText()');

// Имена, взятые из словаря, не должны совпадать с тем, что объявлено в app.js: одна такая
// ошибка («Identifier 'pick' has already been declared») гасит весь модуль и карта не грузится.
const imported = (app.match(/import\s*\{([^}]+)\}\s*from\s*'\.\/i18n\.js'/) || [, ''])[1]
  .split(',').map(s => s.trim().split(/\s+as\s+/).pop()).filter(Boolean);
check(imported.length >= 5, `не разобрать список импорта из i18n.js: ${imported.join(', ')}`);
for (const name of imported) {
  const declared = new RegExp(`(?:^|\\n)\\s*(?:function|const|let|var|class)\\s+${name}\\b`).test(app);
  check(!declared, `имя «${name}» импортировано из i18n.js и объявлено в app.js — модуль не соберётся`);
}

// --- 6. Сам обход страницы: на маленьком дереве проверяем и замену, и сохранение пробелов.
const text = v => ({ nodeType: 3, nodeValue: v });
const el = (tag, attrs = {}, children = []) => ({
  nodeType: 1, tagName: tag, dataset: {}, childNodes: children, attrs: { ...attrs },
  hasAttribute(a) { return a in this.attrs; },
  getAttribute(a) { return this.attrs[a]; },
  setAttribute(a, v) { this.attrs[a] = v; },
});
const page = el('BODY', {}, [
  text('  Венеция  '),
  el('BUTTON', { placeholder: 'Найти здание, улицу или мост' }, [text('Возраст')]),
  text('Что-то своё, чего в словаре нет'),
  el('SCRIPT', {}, [text('Возраст')]),
  el('DIV', { 'data-no-i18n': '' }, [text('РУС')]),
]);
setLang('en');
translateTree(page);
check(page.childNodes[0].nodeValue === '  Venice  ', `пробелы вокруг текста не сохранены: «${page.childNodes[0].nodeValue}»`);
check(page.childNodes[1].getAttribute('placeholder') === 'Find a building, a street or a bridge', 'подпись поля поиска не переведена');
check(page.childNodes[1].childNodes[0].nodeValue === 'Age', 'текст кнопки не переведён');
check(page.childNodes[2].nodeValue === 'Что-то своё, чего в словаре нет', 'незнакомый текст должен остаться как есть');
check(page.childNodes[3].childNodes[0].nodeValue === 'Возраст', 'текст внутри <script> переводить нельзя');
check(page.childNodes[4].childNodes[0].nodeValue === 'РУС', 'содержимое с data-no-i18n переводить нельзя');
check(page.childNodes[4].hasAttribute('data-no-i18n'), 'поддельный узел должен нести data-no-i18n, иначе проверка пустая');

// Переключение туда и обратно: исходный русский текст должен храниться, иначе с итальянского
// на английский уже не перейти — в разметке остался перевод.
setLang('it'); translateTree(page);
check(page.childNodes[1].childNodes[0].nodeValue === 'Età', 'итальянский текст не встал после английского');
check(page.childNodes[1].getAttribute('placeholder') === 'Cerca un edificio, una via o un ponte', 'подпись поиска не переключилась на итальянский');
setLang('ru'); translateTree(page);
check(page.childNodes[1].childNodes[0].nodeValue === 'Возраст', 'русский текст не вернулся');
check(page.childNodes[0].nodeValue === '  Венеция  ', `русский текст вернулся с потерей пробелов: «${page.childNodes[0].nodeValue}»`);
setLang('en'); translateTree(page);
check(page.childNodes[0].nodeValue === '  Venice  ', 'после возврата к английскому текст не перевёлся');
setLang('ru');

console.log(`проверок: ${checks}, без перевода: ${uniqMissing.length + dataMissing.length + onlyIt.length + onlyEn.length}`);
console.log(`ключей в словаре: ${ruKeys.size} (языки: ${LANGS.join(', ')})`);
for (const f of failures.slice(0, 30)) console.log('  FAIL:', f);
process.exit(failures.length ? 1 : 0);