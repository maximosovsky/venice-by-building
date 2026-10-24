import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { t, pick, setLang } from '../web/i18n.js';
import { routePanelHTML as bridgePanel, routeEntryHTML as bridgeEntry } from '../web/bridge-route.js';
import { routePanelHTML as churchPanel } from '../web/church-route.js';
const forbidden = /openstreetmaps?|openstereetmaps?|\bOSM\b/i;
const sourceLink = /href=["'][^"']*(?:openstreetmap|\.osm\b)/i;
const read = name => JSON.parse(readFileSync(`web/data/${name}.json`, 'utf8'));
const bridge = read('bridge-route'), visits = read('bridge-visit-route'), church = read('church-route');
let checks = 0;
for (const lang of ['ru','it','en']) {
  setLang(lang);
  const label = {ru:'О проекте',it:'Informazioni sul progetto',en:'About the project'}[lang];
  assert.equal(t('О проекте'), label); checks++;
  for (const variant of ['OpenStreetMap','OpenStreetMaps','OpenStereetMaps','oSm']) {
    assert.ok(!forbidden.test(t(variant)), `${lang} t(${variant})`);
    assert.ok(!forbidden.test(pick({ru:variant,it:variant,en:variant})), `${lang} data-derived ${variant}`); checks+=2;
  }
  for (const text of ['измерено по тегу OSM', 'по числу этажей OSM', 'Объект наследия (тег OSM)']) {
    assert.ok(!forbidden.test(t(text)), `${lang}: ${text}`); checks++;
  }
  const rawPick = v => typeof v === 'string' ? v : v?.[lang] ?? v?.ru ?? '';
  for (const route of [bridge,...visits.variants]) {
    for (const html of [bridgePanel(route,{variantStatus:'ready',traghetti:visits.traghetti},rawPick),bridgeEntry({status:'ready',route},rawPick)]) {
      assert.ok(!forbidden.test(html.replace(/<[^>]+>/g,'')), `${lang} bridge ${route.id}: visible text`);
      assert.ok(!sourceLink.test(html), `${lang} bridge ${route.id}: external source link`); checks+=2;
    }
  }
  const html = churchPanel(church,{},rawPick);
  assert.ok(!forbidden.test(html.replace(/<[^>]+>/g,'')), `${lang} church panel`); checks++;
}
const index = readFileSync('web/index.html','utf8');
const about = index.match(/<article id="notes"[\s\S]*?<\/article>/)[0];
assert.match(about,/© участники OpenStreetMap/); assert.match(about,/ODbL 1\.0/);
assert.match(about,/https:\/\/www\.openstreetmap\.org\/copyright/);
assert.ok(!forbidden.test(index.replace(about,'')), 'HTML including no-JS outside About');
assert.ok(!forbidden.test(readFileSync('web/splash.js','utf8')), 'all splash languages'); checks+=5;
console.log(JSON.stringify({pass:true,checks,languages:['ru','it','en'],preservedSourceMetadata:true}));
