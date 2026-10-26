#!/usr/bin/env node
// Test-only route fixture. Production always fetches the independently audited data file.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createServer } from 'node:http';
import * as THREE from '../web/vendor/three.module.js';
import { pick, setLang } from '../web/i18n.js';
import { sourcePresentationText } from '../web/source-presentation.js';

const moduleURL = new URL('../web/bridge-route.js', import.meta.url);
assert.ok(existsSync(moduleURL), 'the additive bridge route module must exist');
const { escapeHTML, UI, validateRoute, routeEntryHTML, routePanelHTML, routeGeometry, buildRouteOverlay, installBridgeRoute,
  BAND_WIDTH, BAND_COLOR, GROUND_HEIGHT, MARKER_HEIGHT } = await import(moduleURL);
const text = (ru, it, en) => ({ ru, it, en });
const fixture = () => ({
  id: 'all-bridges', title: text('Все мосты', 'Tutti i ponti', 'All bridges'),
  summary: text('Кольцо через мосты', 'Anello dei ponti', 'Bridge circuit'), status: 'ready',
  start: { name: 'Piazzale Roma', lon: 12.318, lat: 45.438 }, distance_m: 12500,
  bridge_count: 1, repeat_crossings: 1,
  euler: { possible: false, odd_count: 2, explanation: text('Две нечётные вершины: нужны повторы.', 'Due vertici dispari: servono ripetizioni.', 'Two odd vertices: repeats are required.') },
  coordinates: [[12.318, 45.438], [12.319, 45.439], [12.318, 45.438]],
  local: [[0, 0], [100, -100], [0, 0]],
  bridges: [{ id: 'way/1', name: 'Ponte <script>', lon: 12.319, lat: 45.439, x: 100, z: -100, visits: 2, deck_local: [], path_local: [[90, -90], [100, -100], [110, -105]] }],
  crossings: [false, true].map(repeat => ({ bridge_id: 'way/1', name: 'Ponte <script>', lon: 12.319, lat: 45.439, x: 100, z: -100, repeat })),
  excluded: [{ id: 'way/2', name: 'Private & closed', reason: text('Частный', 'Privato', 'Private') }],
  audit: { limitations: text('Доступность не проверена на месте.', 'Accessibilità non verificata sul posto.', 'Access not checked on site.') },
  gpx: 'data/bridge-route.gpx', source: { url: 'https://www.openstreetmap.org/', license: 'ODbL', date: '2026-10-23' }
});

// All additions are test-only; no fixture is written to the production data directory.
const traghettiFixture = () => Array.from({ length: 4 }, (_, i) => ({
  id: `traghetto-${i}`, name: `Station ${i}`, endpoints: [
    { x: i * 10, z: 0, lon: 12.318, lat: 45.438 }, { x: i * 10 + 5, z: 5, lon: 12.319, lat: 45.439 }
  ], local: [[i * 10, 0], [i * 10 + 5, 5]],
  coordinates: [[12.318, 45.438], [12.319, 45.439]],
  schedule: 'Service days and times vary', source: { url: 'https://example.org/schedule', date: '2026-10-23' }
}));
const visitFixture = (boat = false) => {
  const r = fixture();
  r.id = boat ? 'traghetto_midpoints' : 'walking_midpoints'; r.visit_mode = true;
  r.title = boat ? text('Середины с Traghetto', 'Punti medi con Traghetto', 'Midpoints with Traghetto') : text('Посещения пешком', 'Visite a piedi', 'Walking visits');
  r.distance_m = 300; r.stats = { walk_distance_m: boat ? 200 : 300, boat_distance_m: boat ? 100 : 0, repeat_distance_m: 40 };
  r.legs = boat ? [
    { mode: 'walk', local: r.local.slice(0, 2), coordinates: r.coordinates.slice(0, 2) },
    { mode: 'boat', traghetto_id: 'traghetto-0', local: r.local.slice(1), coordinates: r.coordinates.slice(1) }
  ] : [{ mode: 'walk', local: r.local, coordinates: r.coordinates }];
  r.ferry_events = boat ? [{ traghetto_id: 'traghetto-0' }] : [];
  r.gpx = `data/${r.id}.gpx`; r.audit.conditional_service = boat;
  return r;
};
const wrapperFixture = () => ({ variants: [visitFixture(), visitFixture(true)], traghetti: traghettiFixture() });

test('visit contract validates real per-leg geometry and stats without weakening original validation', async () => {
  const { validateVisitRoutes } = await import(moduleURL);
  assert.equal(typeof validateVisitRoutes, 'function', 'new source wrapper validator exists');
  assert.equal(validateRoute(visitFixture()), true);
  assert.equal(validateVisitRoutes(wrapperFixture()), true);
  for (const patch of [{ stats: { walk_distance_m: -1, boat_distance_m: 0, repeat_distance_m: 0 } },
    { stats: { walk_distance_m: 300, boat_distance_m: 0, repeat_distance_m: 301 } },
    { stats: { walk_distance_m: 200, boat_distance_m: 100, repeat_distance_m: 0 } },
    { legs: [] }, { legs: [{ mode: 'fly', local: [[0, 0], [1, 1]], coordinates: [[0, 0], [1, 1]] }] },
    { legs: [{ mode: 'walk', local: [[0, 0], [1, 1]], coordinates: [[0, 0], [1, 1]] }] },
    { bridge_count: 2 }]) assert.throws(() => validateRoute({ ...visitFixture(), ...patch }), /route/i);
  const duplicate = wrapperFixture(); duplicate.variants[1].id = duplicate.variants[0].id;
  assert.throws(() => validateVisitRoutes(duplicate), /route/i);
  const unknown = wrapperFixture(); unknown.variants[1].legs[1].traghetto_id = 'absent';
  assert.throws(() => validateVisitRoutes(unknown), /route/i);
  const malformed = wrapperFixture(); malformed.traghetti[0].endpoints[0].x = NaN;
  assert.throws(() => validateVisitRoutes(malformed), /route/i);
});

test('midpoint panel is honest about visit events, walking/boat/retrace distances and conditional service in all languages', () => {
  for (const lang of ['ru', 'it', 'en']) {
    setLang(lang);
    const panel = routePanelHTML(visitFixture(true), { variants: [fixture(), ...wrapperFixture().variants], variantStatus: 'ready', traghetti: traghettiFixture() }, pick);
    for (const key of ['midpoint', 'walkDistance', 'boatDistance', 'retraceDistance', 'visits', 'visitDirections', 'serviceCaveat', 'showTraghetti']) {
      assert.ok(UI[key]?.[lang], key); assert.ok(panel.includes(UI[key][lang]), key);
    }
    assert.ok(!panel.includes(UI.euler[lang])); assert.ok(!panel.includes(UI.repeats[lang]));
    assert.ok(!panel.includes(visitFixture().euler.explanation[lang]));
    assert.doesNotMatch(panel, /data-bridge-route-variant|value="all-bridges"|value="walking_midpoints"/);
    assert.match(panel, /data-bridge-traghetti-toggle/);
    assert.match(panel, /href="data\/traghetto_midpoints.gpx" download/);
    assert.ok(panel.includes('https://example.org/schedule')); assert.ok(panel.includes('Service days and times vary'));
  }
  setLang('en');
});

test('variant overlays draw supplied legs separately, keep every red bridge and number, never join walking across boat', async () => withCanvas(async canvases => {
  const r = visitFixture(true), overlay = buildRouteOverlay(THREE, r);
  const legs = overlay.children.filter(o => o.userData.route_leg !== undefined);
  assert.equal(legs.length, 2);
  for (const [i, leg] of legs.entries()) {
    assert.equal(leg.userData.mode, r.legs[i].mode);
    assert.equal(leg.geometry.attributes.position.count, 6);
    const a = leg.geometry.attributes.segmentStart.array, b = leg.geometry.attributes.segmentEnd.array;
    assert.deepEqual([a[0], a[2]], r.legs[i].local[0]);
    assert.deepEqual([b[b.length - 3], b[b.length - 1]], r.legs[i].local.at(-1));
  }
  assert.equal(legs[0].material.uniforms.strokeWidth.value, BAND_WIDTH);
  // Обе части маршрута — одна и та же малиновая полоса: и пешком, и трагетто. Мосты выше города
  // больше не дублируются: их подсвечивает сама карта, а оверлей несёт только полосу и номера.
  for (const leg of legs) {
    assert.equal(leg.material.uniforms.color.value.getHexString(), BAND_COLOR.slice(1));
    assert.equal(leg.material.uniforms.dashLength.value, 0);
    assert.equal(leg.material.depthTest, true, 'полоса лежит на земле: дома её перекрывают');
  }
  assert.equal(highlights(overlay).length, 0, 'ни одной копии моста над городом');
  assert.ok(overlay.children.every(o => o.isSprite || o.userData.route_leg !== undefined));
  assert.deepEqual(canvases.map(c => c.ops.find(o => o[0] === 'fillText')[1]), ['1']);
  release(overlay);
}));

test('four independent Traghetto station groups render both labelled endpoints and only supplied ferry geometry', async () => withCanvas(async canvases => {
  const { buildTraghettoOverlay } = await import(moduleURL);
  assert.equal(typeof buildTraghettoOverlay, 'function');
  const ferries = traghettiFixture(); delete ferries[3].local; delete ferries[3].coordinates;
  const overlay = buildTraghettoOverlay(THREE, ferries);
  assert.equal(overlay.children.length, 4);
  assert.equal(new Set(overlay.children.map(o => o.userData.traghetto_id)).size, 4);
  const labels = []; overlay.traverse(o => { if (o.isSprite) labels.push(o); });
  assert.equal(labels.length, 8); assert.equal(canvases.length, 8);
  assert.ok(canvases.every(c => c.ops.some(o => o[0] === 'fillText' && o[1] === 'Traghetto')));
  const lines = []; overlay.traverse(o => { if (o.isMesh && o.material.isShaderMaterial) lines.push(o); });
  assert.equal(lines.length, 3, 'no invented ferry line where geometry is missing');
  for (const line of lines) { assert.equal(line.material.uniforms.color.value.getHexString(), '168bd2'); assert.ok(line.material.uniforms.dashLength.value > 0); }
  release(overlay);
}));

test('mandatory ferry is the default and sole exposed bridge route for both card and detail', async () => {
  const calls = [], h = harness(async () => ({ ok: true, json: async () => fixture() }),
    async (url, options) => { calls.push([url, options]); return { ok: true, json: async () => wrapperFixture() }; });
  h.controller.show(); await h.controller.load(); await h.controller.loadVariants();
  assert.deepEqual(calls, [['data/bridge-visit-route.json', { cache: 'no-store' }]]);
  const ferryCard = h.controller.listHTML();
  assert.ok(ferryCard.includes(visitFixture(true).title.en));
  assert.ok(!ferryCard.includes(fixture().title.en));
  assert.ok(!ferryCard.includes(visitFixture().title.en));
  assert.doesNotMatch(h.html, /data-bridge-route-variant/);
  h.handlers.get('[data-bridge-route-toggle]')();
  assert.match(h.html, /href="data\/traghetto_midpoints.gpx"/);
  assert.equal(h.scene.children[0].children.filter(o => o.userData.route_leg !== undefined).length, 2);
  assert.equal(h.controller.listHTML(), ferryCard);
  h.handlers.get('[data-bridge-traghetti-toggle]')();
  assert.equal(h.scene.children.length, 2);
  h.controller.setVisible(false);
  assert.equal(h.scene.children.find(o => o.name === 'traghetti-stations').visible, true);
  h.controller.selectVariant('all-bridges'); h.controller.selectVariant('walking_midpoints');
  assert.match(h.html, /href="data\/traghetto_midpoints.gpx"/);
  assert.ok(!h.html.includes(UI.euler.en));
  assert.equal(h.scene.children.find(o => o.name === 'all-bridges-route').visible, false);
  h.controller.selectVariant('missing'); assert.match(h.html, /href="data\/traghetto_midpoints.gpx"/);
  h.controller.dispose(); h.controller.dispose(); assert.equal(h.scene.children.length, 0);
});

test('missing ferry data fails closed and retries without replacing another card', async () => {
  let attempt = 0;
  const h = harness(async () => ({ ok: true, json: async () => fixture() }), async () => ++attempt === 1 ? { ok: false, status: 404 } : { ok: true, json: async () => wrapperFixture() });
  h.controller.show(); await h.controller.load(); await h.controller.loadVariants();
  assert.ok(h.html.includes(UI.error.en));
  assert.match(h.html, /data-bridge-route-retry/);
  h.controller.setVisible(true); assert.equal(h.scene.children.length, 0);
  assert.doesNotMatch(h.html + h.controller.listHTML(), /data-crossing|download|All bridges|Walking visits|original route remains/i);
  h.setView('building'); await h.controller.retryVariants();
  assert.equal(h.view, 'building');
  h.controller.show(); assert.match(h.html, /href="data\/traghetto_midpoints.gpx"/);
  h.controller.dispose();
});

test('bootstrap inventory stays internal while mandatory ferry data is still loading', async () => {
  let releaseFetch, started;
  const waiting = new Promise(resolve => { started = resolve; });
  const h = harness(async () => ({ ok: true, json: async () => fixture() }), () => {
    started(); return new Promise(resolve => { releaseFetch = resolve; });
  });
  h.controller.show(); const loading = h.controller.load(); await waiting;
  assert.ok(h.html.includes(UI.loading.en));
  assert.doesNotMatch(h.html + h.controller.listHTML(), /All bridges|Walking visits|download|data-crossing/);
  h.controller.setVisible(true); h.controller.selectVariant('all-bridges');
  assert.equal(h.scene.children.length, 0);
  releaseFetch({ ok: true, json: async () => wrapperFixture() }); await loading; await h.controller.loadVariants();
  assert.ok(h.html.includes(visitFixture(true).title.en)); h.controller.dispose();
});

test('absent, pedestrian-only, malformed or mismatched ferry cannot become a fallback route', async () => {
  for (const mutate of [d => { d.variants.pop(); }, d => { d.variants[1] = { ...visitFixture(), id: 'traghetto_midpoints' }; },
    d => { d.variants[1].status = 'pending'; }, d => { d.variants[1].bridges[0].id = 'unknown'; d.variants[1].crossings.forEach(c => { c.bridge_id = 'unknown'; }); }]) {
    const data = wrapperFixture(); mutate(data);
    const h = harness(async () => ({ ok: true, json: async () => fixture() }), async () => ({ ok: true, json: async () => data }));
    h.controller.show(); await h.controller.load(); await h.controller.loadVariants();
    assert.ok(h.html.includes(UI.error.en)); assert.match(h.html, /data-bridge-route-retry/);
    assert.doesNotMatch(h.html + h.controller.listHTML(), /download|data-crossing|All bridges|Walking visits/);
    h.controller.setVisible(true); assert.equal(h.scene.children.length, 0); h.controller.dispose();
  }
});

test('real emitted mandatory-ferry JSON supplies the default list, detail and geometry inventory', async () => {
  const original = JSON.parse(readFileSync(new URL('../web/data/bridge-route.json', import.meta.url)));
  const data = JSON.parse(readFileSync(new URL('../web/data/bridge-visit-route.json', import.meta.url)));
  const ferry = data.variants.find(r => r.id === 'traghetto_midpoints');
  assert.equal(ferry.distance_m, 44575.796); assert.equal(ferry.bridge_count, 346);
  assert.equal(ferry.ferry_events.length, 1); assert.equal(ferry.ferry_events[0].traghetto_id, 'santa_sofia');
  const h = harness(async () => ({ ok: true, json: async () => original }), async () => ({ ok: true, json: async () => data }));
  h.controller.show(); assert.deepEqual(await h.controller.load(), ferry); await h.controller.loadVariants();
  assert.ok(h.controller.listHTML().includes(ferry.title.en)); assert.ok(h.html.includes(ferry.title.en));
  assert.equal((h.html.match(/data-crossing=/g) || []).length, ferry.crossings.length);
  assert.ok(h.html.includes(ferry.gpx)); assert.ok(h.html.includes(sourcePresentationText(ferry.source.url,'en')));
  assert.doesNotMatch(h.html, /data-bridge-route-variant/); h.controller.dispose();
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

test('scene geometry lies on the ground, carries no arrows and duplicates no bridge above the city', () => {
  const geometry = routeGeometry(fixture());
  assert.deepEqual(geometry.points.map(p => [p[0], p[2]]), fixture().local);
  assert.ok(geometry.points.every(p => p[1] === GROUND_HEIGHT), 'полоса идёт по земле, а не в 24 м над ней');
  assert.equal(geometry.arrows, undefined, 'стрелки убраны вместе с копиями мостов');
  const overlay = buildRouteOverlay(THREE, fixture());
  assert.ok(overlay instanceof THREE.Group);
  const line = overlay.children.find(o => o.isMesh);
  assert.ok(line, 'route stroke must be a rendered triangle Mesh, not a WebGL 1px Line');
  assert.equal(line.geometry.attributes.position.count, 12);
  assert.equal(line.material.depthTest, true, 'полоса на земле: дома её перекрывают');
  assert.equal(line.material.depthWrite, false);
  assert.ok(line.renderOrder >= 20);
  assert.equal(overlay.children.some(o => o.isLineSegments), false, 'стрелок больше нет');
  assert.equal(highlights(overlay).length, 0, 'копий мостов над городом нет');
  overlay.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
});

test('production fallback intro starts and finishes at Piazza San Marco in every language', () => {
  for (const lang of ['ru', 'it', 'en']) {
    const html = routeEntryHTML({ status: 'idle' }, value => value[lang]);
    assert.ok(html.includes('Piazza San Marco'));
    assert.ok(!html.includes('Piazzale Roma'));
  }
});

test('the thick band uses screen-space triangle expansion and refreshes the viewport on every render', () => {
  const stroke = buildRouteOverlay(THREE, fixture()).children.find(o => o.isMesh);
  assert.ok(stroke, 'screen-space stroke Mesh exists');
  const material = stroke.material;
  assert.ok(material instanceof THREE.ShaderMaterial);
  assert.equal(material.uniforms.strokeWidth.value, BAND_WIDTH, 'толстая полоса, а не прежняя линия в 3 px');
  assert.match(material.vertexShader, /projectionMatrix/);
  assert.match(material.vertexShader, /resolution/);
  assert.match(material.vertexShader, /strokeWidth/);
  assert.match(material.vertexShader, /\.w/);
  assert.match(material.fragmentShader, /discard/, 'round caps keep sharp turns connected');
  assert.equal(stroke.frustumCulled, false, 'expanded pixels outside centerline bounds must not disappear');
  for (const [width, height, dpr] of [[800, 600, 1], [450, 900, 2], [1100, 500, 1.5]]) {
    const renderer = { getPixelRatio: () => dpr,
      getSize: target => target.set(width, height),
      getCurrentViewport: target => target.set(0, 0, width * dpr, height * dpr) };
    stroke.onBeforeRender(renderer);
    assert.deepEqual(material.uniforms.resolution.value.toArray(), [width, height]);
    assert.equal(material.uniforms.strokeWidth.value, BAND_WIDTH);
    // Reconstruct the actual shader's clip-space expansion with real THREE
    // matrices. Project opposite triangle edges back into CSS pixels.
    const half = BAND_WIDTH / 2;
    for (const angle of [0, .37, Math.PI / 4, Math.PI / 2]) for (const zoom of [1, 3]) {
      const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100);
      camera.position.z = 10; camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      const start = new THREE.Vector4(-Math.cos(angle), -Math.sin(angle), -.2, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
      const end = new THREE.Vector4(Math.cos(angle), Math.sin(angle), .2, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
      const tangent = new THREE.Vector2((end.x / end.w - start.x / start.w) * width / 2,
        (end.y / end.w - start.y / start.w) * height / 2).normalize();
      const normal = new THREE.Vector2(-tangent.y, tangent.x);
      const edges = [-1, 1].map(side => {
        const clip = start.clone();
        const offset = tangent.clone().multiplyScalar(-half).addScaledVector(normal, side * half);
        clip.x += offset.x * 2 / width * clip.w;
        clip.y += offset.y * 2 / height * clip.w;
        return new THREE.Vector2(clip.x / clip.w * width / 2, clip.y / clip.w * height / 2);
      });
      assert.ok(Math.abs(edges[0].distanceTo(edges[1]) - BAND_WIDTH) < 1e-10, 'opposite projected mesh edges are exactly the band width apart');
    }
  }
  stroke.onBeforeRender({ getSize: target => target.set(320, 240), getPixelRatio: () => 2 });
  assert.deepEqual(material.uniforms.resolution.value.toArray(), [320, 240]);
  assert.ok([...stroke.geometry.attributes.position.array].every(Number.isFinite));
  stroke.geometry.dispose(); material.dispose();
});

test('installer disposes thick stroke geometry and shader exactly once without retaining the scene group', async () => {
  const h = harness(async () => ({ ok: true, json: async () => fixture() }));
  await h.controller.load(); h.controller.setVisible(true);
  const stroke = h.scene.children[0].children.find(o => o.isMesh);
  assert.ok(stroke);
  let geometryDisposals = 0, materialDisposals = 0;
  stroke.geometry.addEventListener('dispose', () => geometryDisposals++);
  stroke.material.addEventListener('dispose', () => materialDisposals++);
  h.controller.dispose(); h.controller.dispose();
  assert.equal(geometryDisposals, 1);
  assert.equal(materialDisposals, 1);
  assert.equal(h.scene.children.length, 0);
});

// Раньше здесь лежали копии настилов над городом (красные на высоте 26 м). Владелец атласа запретил
// дублировать мосты: подсветку несёт карта, поэтому копий быть не должно, а highlights всегда пуст.
const highlights = overlay => overlay.children.filter(o => o.userData.bridge_id && !o.isSprite);
const release = overlay => overlay.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
const deckFixture = () => {
  const route = fixture();
  route.bridges[0].deck_local = [
    [[[10, 20], [30, 20], [30, 40], [10, 40], [10, 20]], [[15, 25], [15, 35], [25, 35], [25, 25], [15, 25]]],
    [[[40, 20], [45, 20], [45, 25], [40, 25], [40, 20]]]
  ];
  return route;
};

test('no bridge is duplicated above the city, not even where full deck geometry is supplied', () => {
  const route = deckFixture(), overlay = buildRouteOverlay(THREE, route);
  assert.equal(highlights(overlay).length, 0, 'ни одной копии настила над городом');
  assert.equal(overlay.children.some(o => o.isGroup), false, 'мосты не приходят своими группами');
  assert.ok(overlay.children.every(o => o.isSprite || o.isMesh), 'оверлей — только полоса и номера');
  assert.ok(!overlay.children.some(o => o.userData.bridge_id === route.excluded[0].id));
  release(overlay);
});

test('every first-crossing number carries its bridge so a click opens that bridge card', async () => withCanvas(async () => {
  const route = deckFixture(), asked = [];
  const overlay = buildRouteOverlay(THREE, route, id => { asked.push(id); return 42; });
  const sprites = overlay.children.filter(o => o.isSprite);
  assert.equal(sprites.length, 1, 'номер ставится только на первое пересечение');
  assert.equal(sprites[0].position.y, MARKER_HEIGHT, 'номер лежит у земли, а не в 38 м над городом');
  assert.equal(sprites[0].userData.crossing, 0);
  assert.equal(sprites[0].userData.bridge_id, route.bridges[0].id);
  assert.equal(sprites[0].userData.gid, 42);
  assert.deepEqual(asked, [route.bridges[0].id], 'атлас спрашивают про каждый номер');
  release(overlay);
}));

test('a bridge the atlas does not know gets a number but never an invented card', async () => withCanvas(async () => {
  const overlay = buildRouteOverlay(THREE, deckFixture(), () => -1);
  const sprites = overlay.children.filter(o => o.isSprite);
  assert.ok(sprites.length > 0);
  assert.ok(sprites.every(o => o.userData.gid === -1), 'неизвестный мост карточки не получает');
  release(overlay);
}));

test('missing or malformed deck/path geometry fails closed instead of fabricating a footprint', () => {
  for (const geometry of [{ deck_local: [], path_local: undefined }, { deck_local: [], path_local: [[1, 2]] },
    { deck_local: [[[[NaN, 0], [1, 1], [2, 0]]]], path_local: [[1, 2], [3, 4]] }]) {
    const route = fixture(); Object.assign(route.bridges[0], geometry);
    assert.throws(() => validateRoute(route), /route/i);
  }
  assert.equal(validateRoute(deckFixture()), true);
});

function withCanvas(fn) {
  const previous = globalThis.document, canvases = [];
  globalThis.document = { createElement: () => {
    const ops = [], ctx = new Proxy({}, { get: (_, key) => (...args) => ops.push([key, ...args]), set: (target, key, value) => { target[key] = value; return true; } });
    const canvas = { getContext: () => ctx, ops }; canvases.push(canvas); return canvas;
  } };
  return Promise.resolve().then(() => fn(canvases)).finally(() => { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; });
}

test('all unique first-crossing numbers render digits only on transparent canvases, including selected repeat', async () => withCanvas(async canvases => {
  const route = fixture(); route.bridges = []; route.crossings = []; route.bridge_count = 80; route.repeat_crossings = 1;
  for (let i = 0; i < 80; i++) {
    const bridge = { ...fixture().bridges[0], id: `way/${i + 10}`, visits: i === 0 ? 2 : 1 };
    route.bridges.push(bridge); route.crossings.push({ ...fixture().crossings[0], bridge_id: bridge.id });
    if (i === 0) route.crossings.push({ ...fixture().crossings[1], bridge_id: bridge.id });
  }
  const h = harness(async () => ({ ok: true, json: async () => route }));
  await h.controller.load(); h.controller.setVisible(true);
  const overlay = h.scene.children[0];
  assert.equal(overlay.children.filter(o => o.isSprite).length, 80, 'no first-visit sampler');
  assert.equal(highlights(overlay).length, 0, 'копий мостов над городом нет');
  assert.equal(new Set(overlay.children.filter(o => o.isSprite).map(o => o.userData.bridge_id)).size, 80, 'номер помнит свой мост');
  assert.deepEqual(canvases.map(c => c.ops.find(op => op[0] === 'fillText')[1]), route.crossings.flatMap((c, i) => c.repeat ? [] : [String(i + 1)]));
  h.controller.focusCrossing(1);
  assert.equal(canvases.at(-1).ops.find(op => op[0] === 'fillText')[1], '2');
  for (const canvas of canvases) {
    assert.ok(canvas.ops.every(op => ['clearRect', 'fillText', 'strokeText'].includes(op[0])), JSON.stringify(canvas.ops));
    assert.ok(canvas.ops.filter(op => /Text$/.test(op[0])).every(op => /^\d+$/.test(op[1])));
  }
  const replaced = overlay.children.at(-1), replacementDisposals = { material: 0, texture: 0 };
  replaced.material.addEventListener('dispose', () => replacementDisposals.material++);
  replaced.material.map.addEventListener('dispose', () => replacementDisposals.texture++);
  h.controller.focusCrossing(0);
  assert.deepEqual(replacementDisposals, { material: 1, texture: 1 });
  assert.ok(!overlay.children.includes(replaced));
  const disposals = [], spriteGeometry = overlay.children.find(o => o.isSprite).geometry;
  let sharedSpriteDisposals = 0; const onSharedDispose = () => sharedSpriteDisposals++;
  spriteGeometry.addEventListener('dispose', onSharedDispose);
  overlay.traverse(o => { for (const resource of [o.isSprite ? null : o.geometry, o.material, o.material?.map].filter(Boolean)) {
    const record = { resource, count: 0 }; resource.addEventListener('dispose', () => record.count++); disposals.push(record);
  } });
  h.controller.dispose(); h.controller.dispose();
  assert.ok(disposals.every(d => d.count === 1), 'all highlight and label resources disposed exactly once');
  assert.equal(sharedSpriteDisposals, 0, 'THREE owns the shared sprite geometry; do not dispose other components’ geometry');
  spriteGeometry.removeEventListener('dispose', onSharedDispose);
  assert.equal(h.scene.children.length, 0);
}));

test('installer disposes the band geometry and material exactly once', async () => {
  const h = harness(async () => ({ ok: true, json: async () => deckFixture() }));
  await h.controller.load(); h.controller.setVisible(true);
  const stroke = h.scene.children[0].children.find(o => o.isMesh), counts = { geometry: 0, material: 0 };
  assert.ok(stroke, 'полоса на месте');
  stroke.geometry.addEventListener('dispose', () => counts.geometry++);
  stroke.material.addEventListener('dispose', () => counts.material++);
  h.controller.setVisible(false); h.controller.setVisible(true);
  assert.deepEqual(counts, { geometry: 0, material: 0 }, 'hide/show reuses existing resources');
  h.controller.dispose(); h.controller.dispose();
  assert.deepEqual(counts, { geometry: 1, material: 1 });
  assert.equal(h.scene.children.length, 0);
});

test('нажатие на номер в списке летит к переходу и открывает карточку самого моста', async () => {
  const h = harness(async () => ({ ok: true, json: async () => fixture() }));
  await h.controller.load(); h.controller.setVisible(true);
  h.controller.focusCrossing(0);
  assert.deepEqual(h.opened, [77], 'открывается gid моста, а не соседнего дома');
  assert.ok(h.flights.length > 0, 'камера летит к переходу');
});

test('directions describe all first-crossing numbers instead of sampled markers in each language', () => {
  for (const lang of ['ru', 'it', 'en']) assert.ok(!/выборочно|selezione|sampled/.test(UI.directions[lang]));
});

// Run BRIDGE_ROUTE_WEBGL=1 node --test tests/bridge_route_ui.mjs for SwiftShader.
test('real WebGL rasterizes a 3 CSS px stroke across angles, zoom, DPR and resize',
  { skip: process.env.BRIDGE_ROUTE_WEBGL !== '1', timeout: 120000 }, async () => {
    const { chromium } = await import('playwright');
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      const files = { '/three.js': new URL('../web/vendor/three.module.js', import.meta.url),
        '/three.core.js': new URL('../web/vendor/three.core.js', import.meta.url), '/route.js': moduleURL,
        '/source-presentation.js': new URL('../web/source-presentation.js', import.meta.url) };
      if (files[url.pathname]) { res.setHeader('Content-Type', 'text/javascript'); res.end(readFileSync(files[url.pathname])); }
      else res.end('<!doctype html><body></body>');
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
      browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--no-sandbox'] });
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const report = await page.evaluate(async route => {
        const THREE = await import('/three.js');
        const { buildThickRouteLine } = await import('/route.js');
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        document.body.appendChild(renderer.domElement); renderer.setClearColor(0, 0);
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
        camera.position.z = 10; camera.lookAt(0, 0, 0);
        const results = [];
        for (const [width, height, dpr] of [[320, 240, 1], [480, 300, 2], [360, 260, 1.5]]) {
          renderer.setPixelRatio(dpr); renderer.setSize(width, height);
          camera.aspect = width / height;
          for (const zoom of [1, 2]) for (const angle of [0, Math.PI / 4, Math.PI / 2, .37]) {
            camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
            const points = [-1, 1].map(sign => [sign * Math.cos(angle), sign * Math.sin(angle), sign * .2]);
            const stroke = buildThickRouteLine(THREE, points);
            stroke.material.uniforms.color.value.set(0xffffff); stroke.material.uniforms.opacity.value = 1;
            scene.add(stroke); renderer.render(scene, camera);
            const gl = renderer.getContext(), w = renderer.domElement.width, h = renderer.domElement.height;
            const pixels = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            const endpoints = points.map(p => new THREE.Vector3(...p).project(camera)).map(p => [(p.x + 1) * w / 2, (p.y + 1) * h / 2]);
            const [a, b] = endpoints, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
            let area = 0;
            // Measure the middle 60% only, excluding round caps and clipping.
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
              const along = ((x + .5 - a[0]) * dx + (y + .5 - a[1]) * dy) / len;
              if (along > len * .2 && along < len * .8) area += pixels[(y * w + x) * 4 + 3] / 255;
            }
            results.push({ width, height, dpr, zoom, angle, measuredCSSWidth: area / (len * .6) / dpr,
              resolution: stroke.material.uniforms.resolution.value.toArray() });
            scene.remove(stroke); stroke.geometry.dispose(); stroke.material.dispose();
          }
        }
        const { buildRouteOverlay } = await import('/route.js');
        const fallback = { ...route.bridges[0], id: 'fallback/2', deck_local: [], visits: 1 };
        route.bridges.push(fallback); route.bridge_count = 2;
        route.crossings.push({ ...route.crossings[0], bridge_id: fallback.id, repeat: false });
        renderer.setPixelRatio(1); renderer.setSize(600, 680);
        const top = new THREE.OrthographicCamera(0, 150, 120, -50, .1, 200);
        top.position.set(0, 100, 0); top.up.set(0, 0, -1); top.lookAt(0, 0, 0); top.updateMatrixWorld();
        const overlay = buildRouteOverlay(THREE, route); scene.add(overlay);
        overlay.children.filter(o => !o.userData.bridge_id).forEach(o => { o.visible = false; });
        const readPixel = (x, z) => {
          const p = new THREE.Vector3(x, 26, z).project(top), gl = renderer.getContext(), pixel = new Uint8Array(4);
          gl.readPixels(Math.floor((p.x + 1) * 300), Math.floor((p.y + 1) * 340), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          return [...pixel];
        };
        renderer.render(scene, top);
        const highlightPixels = { deck: readPixel(20, 22), hole: readPixel(20, 30), multipart: readPixel(42, 22), fallback: readPixel(100, -100) };
        const occluder = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshBasicMaterial({ color: '#00ff00' }));
        occluder.rotation.x = -Math.PI / 2; occluder.position.y = 60; scene.add(occluder);
        renderer.render(scene, top); highlightPixels.aboveOccluder = readPixel(20, 22);
        scene.remove(occluder); occluder.geometry.dispose(); occluder.material.dispose();
        const labels = overlay.children.filter(o => o.isSprite);
        const canvasReport = labels.map(o => {
          const canvas = o.material.map.image, pixels = canvas.getContext('2d').getImageData(0, 0, 64, 64).data;
          const alpha = (x, y) => pixels[(y * 64 + x) * 4 + 3];
          return { corners: [[0, 0], [32, 0], [0, 32], [63, 63], [32, 6]].map(([x, y]) => alpha(x, y)),
            ink: [...pixels].filter((v, i) => i % 4 === 3 && v > 0).length };
        });
        scene.remove(overlay);
        overlay.traverse(o => { if (!o.isSprite) o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
        renderer.dispose(); return { samples: results, highlightPixels, canvasReport };
      }, deckFixture());
      const samples = report.samples;
      assert.deepEqual(report.highlightPixels.hole, [0, 0, 0, 0], 'mapped deck hole stays transparent in actual WebGL');
      for (const key of ['deck', 'multipart', 'fallback', 'aboveOccluder']) assert.deepEqual(report.highlightPixels[key], [255, 0, 0, 255], key);
      assert.equal(report.canvasReport.length, 2);
      for (const canvas of report.canvasReport) { assert.deepEqual(canvas.corners, [0, 0, 0, 0, 0]); assert.ok(canvas.ink > 0); }
      console.log('WebGL bridge raster:', JSON.stringify({ pixels: report.highlightPixels, labels: report.canvasReport }));
      for (const sample of samples) {
        assert.deepEqual(sample.resolution, [sample.width, sample.height]);
        // Four-sample MSAA quantizes diagonal coverage; geometric width remains exactly 3.
        assert.ok(Math.abs(sample.measuredCSSWidth - 3) < .25, JSON.stringify(sample));
      }
      assert.deepEqual(errors, []);
      console.log('WebGL 3px raster samples:', JSON.stringify(samples));
    } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
  });

// Minimal injected dock boundary; real HTML and THREE geometry remain under test.
function harness(fetchRoute, visitFetch) {
  let bootstrap;
  const defaultVisits = () => {
    const data = wrapperFixture(), ferry = data.variants[1];
    for (const key of ['bridges', 'crossings', 'bridge_count', 'repeat_crossings']) ferry[key] = bootstrap[key];
    data.variants = [ferry];
    return { ok: true, json: async () => data };
  };
  const scene = new THREE.Scene();
  let view = null, html = '', back = null, languageCallback, listRefreshes = 0;
  const opened = [], handlers = new Map(), flights = [];
  const element = selector => ({ addEventListener: (_, fn) => handlers.set(selector, fn), dataset: {}, setAttribute() {} });
  const dockLive = { querySelector: element, querySelectorAll: () => [], closest: () => null };
  const controller = installBridgeRoute({ THREE, scene, aimFly: (...args) => flights.push(args),
    openDock: (v, body, b) => { view = v; html = body; back = b; }, dockLive,
    getDockView: () => view, showWalks: () => { listRefreshes++; view = 'walks'; },
    pickText: pick, onLang: fn => { languageCallback = fn; return () => {}; },
    // Один известный мост и один неизвестный: по номеру открывается карточка только первого.
    resolveBridgeGid: id => (id === 'way/1' ? 77 : -1),
    openBuildingCard: gid => opened.push(gid),
    fetchRoute: async (url, options) => {
      if (url === 'data/bridge-visit-route.json') return visitFetch ? visitFetch(url, options) : defaultVisits();
      const response = await fetchRoute(url, options);
      return { ...response, json: async () => { bootstrap = await response.json(); return bootstrap; } };
    } });
  return { controller, scene, flights, handlers, opened, setView: v => { view = v; }, lang: () => languageCallback(),
    get html() { return html; }, get view() { return view; }, get back() { return back; }, get listRefreshes() { return listRefreshes; } };
}

test('route loader bypasses stale browser data cache', async () => {
  let options;
  const h = harness(async (url, init) => { options = init; return { ok: true, json: async () => fixture() }; });
  h.controller.show(); await h.controller.load();
  assert.equal(options?.cache, 'no-store');
  assert.match(h.html, /data-crossing="1"/);
});

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
  assert.ok(app.includes('${bridgeRoute.listHTML()}'), 'bridge entry remains in existing routes');
  assert.ok(app.includes("${quests.map(route).join('')}"), 'existing quests remain in routes');
  assert.match(app, /bridgeRoute\.wireList\(\)/);
  assert.match(app, /dockView === 'bridge-route'/);
  assert.match(app, /function renderQuest\(\)/);
  assert.match(app, /function buildingHtml\(/);
  const css = readFileSync(new URL('../web/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.bridge-crossings button\[aria-current="step"\]/);
  assert.match(css, /\.bridge-route-stats/);
});
