#!/usr/bin/env node
// Test-only route fixture. Production always fetches the independently audited data file.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as THREE from '../web/vendor/three.module.js';
import { pick, setLang } from '../web/i18n.js';

const moduleURL = new URL('../web/bridge-route.js', import.meta.url);
assert.ok(existsSync(moduleURL), 'the additive bridge route module must exist');
const { escapeHTML, UI, validateRoute, routeEntryHTML, routePanelHTML, routeGeometry, buildRouteOverlay, installBridgeRoute } = await import(moduleURL);
const text = (ru, it, en) => ({ ru, it, en });
const fixture = () => ({
  id: 'all-bridges', title: text('Все мосты', 'Tutti i ponti', 'All bridges'),
  summary: text('Кольцо через мосты', 'Anello dei ponti', 'Bridge circuit'), status: 'ready',
  start: { name: 'Piazzale Roma', lon: 12.318, lat: 45.438 }, distance_m: 12500,
  bridge_count: 1, repeat_crossings: 1,
  euler: { possible: false, odd_count: 2, explanation: text('Две нечётные вершины: нужны повторы.', 'Due vertici dispari: servono ripetizioni.', 'Two odd vertices: repeats are required.') },
  coordinates: [[12.318, 45.438], [12.319, 45.439], [12.318, 45.438]],
  local: [[0, 0], [100, -100], [0, 0]],
  bridges: [{ id: 'way/1', name: 'Ponte <script>', lon: 12.319, lat: 45.439, x: 100, z: -100, visits: 2 }],
  crossings: [false, true].map(repeat => ({ bridge_id: 'way/1', name: 'Ponte <script>', lon: 12.319, lat: 45.439, x: 100, z: -100, repeat })),
  excluded: [{ id: 'way/2', name: 'Private & closed', reason: text('Частный', 'Privato', 'Private') }],
  audit: { limitations: text('Доступность не проверена на месте.', 'Accessibilità non verificata sul posto.', 'Access not checked on site.') },
  gpx: 'data/bridge-route.gpx', source: { url: 'https://www.openstreetmap.org/', license: 'ODbL', date: '2026-10-23' }
});

test('escapes all HTML contexts and rejects malformed/unready route contracts', () => {
  assert.equal(escapeHTML('<"\'&>'), '&lt;&quot;&#39;&amp;&gt;');
  assert.equal(validateRoute(fixture()), true);
  for (const patch of [{ status: 'pending' }, { local: [[NaN, 0]] }, { crossings: [] }, { bridge_count: 2 }, { repeat_crossings: 0 }, { coordinates: [[0, 0]] }, { gpx: 'javascript:alert(1)' }]) {
    assert.throws(() => validateRoute({ ...fixture(), ...patch }), /route/i);
  }
  assert.throws(() => validateRoute({ ...fixture(), crossings: fixture().crossings.map(c => ({ ...c, bridge_id: 'missing' })) }), /route/i);
});

test('list and panel pick self-contained ru/it/en labels, including Euler and excluded reasons', () => {
  for (const lang of ['ru', 'it', 'en']) {
    setLang(lang);
    for (const [key, value] of Object.entries(UI)) {
      assert.ok(value[lang]?.trim(), `${key} has ${lang}`);
      assert.equal(pick(value), value[lang]);
    }
    const route = fixture(), entry = routeEntryHTML({ status: 'ready', route }, pick);
    const panel = routePanelHTML(route, { visible: true, selected: 1 }, pick);
    for (const html of [entry, panel]) {
      assert.ok(html.includes(route.title[lang]));
      assert.ok(!html.includes('<script>'));
    }
    for (const s of [route.euler.explanation[lang], route.excluded[0].reason[lang], route.audit.limitations[lang], UI.hide[lang], UI.repeat[lang], UI.length[lang]]) assert.ok(panel.includes(s), s);
    assert.match(panel, /href="data\/bridge-route\.gpx" download/);
    assert.match(panel, /data-crossing="0"/);
    assert.match(panel, /data-crossing="1"[^>]*aria-current="step"/);
    assert.match(panel, /Ponte &lt;script&gt;/);
    assert.match(panel, /Private &amp; closed/);
    assert.match(panel, /ODbL/);
    assert.match(panel, /12[.,]5/);
    assert.match(panel, /2026-10-23/);
  }
  setLang('en');
  assert.ok(routeEntryHTML({ status: 'loading' }, pick).includes(UI.loading.en));
  assert.ok(routeEntryHTML({ status: 'error' }, pick).includes(UI.error.en));
  const unsafe = { ...fixture(), source: { url: 'javascript:alert(1)', license: '<img>', date: 'x' } };
  assert.ok(!routePanelHTML(unsafe, {}, pick).includes('href="javascript:'));
});

test('panel exposes model uncertainty, source date semantics and unresolved candidates', () => {
  const route = fixture();
  route.audit.crossing_model_limitation = text('Ветви требуют проверки', 'Rami da verificare', 'Branches need review');
  route.audit.source_date_semantics = text('Дата получения', 'Data acquisizione', 'Acquisition date');
  route.audit.scope = text('Остров с портовой зоной', 'Isola con zona portuale', 'Island including port area');
  route.audit.ambiguous_portals = [{ id: 'w99', name: 'Ferrovia' }];
  route.audit.unresolved_decks = [{ id: 'd99', name: 'Ponte dei Sospiri' }];
  for (const lang of ['ru', 'it', 'en']) {
    setLang(lang);
    const panel = routePanelHTML(route, {}, pick);
    for (const key of ['crossing_model_limitation', 'source_date_semantics', 'scope']) assert.ok(panel.includes(route.audit[key][lang]), key);
    assert.ok(panel.includes('Ferrovia'));
    assert.ok(panel.includes('Ponte dei Sospiri'));
    assert.ok(panel.includes('w99'));
  }
  setLang('en');
});

test('scene geometry uses supplied local coordinates, is elevated and has directional arrows', () => {
  const geometry = routeGeometry(fixture());
  assert.deepEqual(geometry.points.map(p => [p[0], p[2]]), fixture().local);
  assert.ok(geometry.points.every(p => p[1] > 0));
  assert.ok(geometry.arrows.length > 0);
  const overlay = buildRouteOverlay(THREE, fixture());
  assert.ok(overlay instanceof THREE.Group);
  const line = overlay.children.find(o => o.isLine && !o.isLineSegments);
  assert.equal(line.geometry.attributes.position.count, 3);
  assert.equal(line.material.depthTest, false);
  assert.equal(line.material.depthWrite, false);
  assert.ok(line.renderOrder >= 20);
  assert.ok(overlay.children.some(o => o.isLineSegments));
  overlay.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
});

// Minimal injected dock boundary; real HTML and THREE geometry remain under test.
function harness(fetchRoute) {
  const scene = new THREE.Scene();
  let view = null, html = '', back = null, languageCallback, listRefreshes = 0;
  const handlers = new Map(), flights = [];
  const element = selector => ({ addEventListener: (_, fn) => handlers.set(selector, fn), dataset: {}, setAttribute() {} });
  const dockLive = { querySelector: element, querySelectorAll: () => [], closest: () => null };
  const controller = installBridgeRoute({ THREE, scene, aimFly: (...args) => flights.push(args),
    openDock: (v, body, b) => { view = v; html = body; back = b; }, dockLive,
    getDockView: () => view, showWalks: () => { listRefreshes++; view = 'walks'; },
    pickText: pick, onLang: fn => { languageCallback = fn; return () => {}; }, fetchRoute });
  return { controller, scene, flights, handlers, setView: v => { view = v; }, lang: () => languageCallback(),
    get html() { return html; }, get view() { return view; }, get back() { return back; }, get listRefreshes() { return listRefreshes; } };
}

test('installer fetches real URL once, renders loading, then detail; toggles and focuses real scene route', async () => {
  let resolve, calls = [];
  const h = harness(url => { calls.push(url); return new Promise(r => { resolve = r; }); });
  h.controller.show();
  assert.equal(h.view, 'bridge-route');
  assert.ok(h.html.includes(UI.loading.en));
  resolve({ ok: true, json: async () => fixture() });
  await h.controller.load();
  assert.deepEqual(calls, ['data/bridge-route.json']);
  assert.match(h.html, /data-crossing="1"/);
  assert.equal(h.back.label, UI.back.en);
  h.controller.setVisible(true);
  assert.equal(h.scene.children.length, 1);
  assert.equal(h.scene.children[0].visible, true);
  h.controller.focusCrossing(1);
  assert.deepEqual(h.flights[0].slice(0, 3), [100, -100, 260]);
  assert.match(h.html, /aria-current="step"/);
  h.controller.setVisible(false);
  assert.equal(h.scene.children[0].visible, false);
  setLang('it'); h.lang();
  assert.ok(h.html.includes(UI.show.it));
  h.setView('building'); h.lang();
  assert.equal(h.view, 'building', 'language changes cannot steal another dock panel');
  h.controller.dispose();
  assert.equal(h.scene.children.length, 0);
  setLang('en');
});

test('failed route fetch is honest, retryable, and never substitutes a production fixture', async () => {
  let count = 0;
  const h = harness(async () => ++count === 1 ? { ok: false, status: 404 } : { ok: true, json: async () => fixture() });
  h.controller.show(); await h.controller.load();
  assert.ok(h.html.includes(UI.error.en));
  assert.ok(!h.html.includes('download'));
  assert.equal(h.scene.children.length, 0);
  await h.controller.retry();
  assert.match(h.html, /download/);
  assert.equal(count, 2);
});

test('late loading cannot replace a building card; existing quest insertion and dock contracts are additive', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; }));
  h.controller.show(); h.setView('building');
  resolve({ ok: true, json: async () => fixture() }); await h.controller.load();
  assert.equal(h.view, 'building');
  const app = readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
  assert.match(app, /import \{ installBridgeRoute \} from '\.\/bridge-route\.js'/);
  assert.match(app, /\$\{bridgeRoute\.listHTML\(\)\}\$\{quests\.map\(route\)\.join\(''\)\}/);
  assert.match(app, /bridgeRoute\.wireList\(\)/);
  assert.match(app, /dockView === 'bridge-route'/);
  assert.match(app, /function renderQuest\(\)/);
  assert.match(app, /function buildingHtml\(/);
  const css = readFileSync(new URL('../web/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.bridge-crossings button\[aria-current="step"\]/);
  assert.match(css, /\.bridge-route-stats/);
});
