#!/usr/bin/env node
// Test-only route fixture. Production always fetches the independently audited data file.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createServer } from 'node:http';
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
  const line = overlay.children.find(o => o.isMesh);
  assert.ok(line, 'route stroke must be a rendered triangle Mesh, not a WebGL 1px Line');
  assert.equal(line.geometry.attributes.position.count, 12);
  assert.equal(line.material.depthTest, false);
  assert.equal(line.material.depthWrite, false);
  assert.ok(line.renderOrder >= 20);
  assert.ok(overlay.children.some(o => o.isLineSegments));
  overlay.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
});

test('production fallback intro starts and finishes at Piazza San Marco in every language', () => {
  for (const lang of ['ru', 'it', 'en']) {
    const html = routeEntryHTML({ status: 'idle' }, value => value[lang]);
    assert.ok(html.includes('Piazza San Marco'));
    assert.ok(!html.includes('Piazzale Roma'));
  }
});

test('3px stroke uses screen-space triangle expansion and refreshes viewport on every render', () => {
  const stroke = buildRouteOverlay(THREE, fixture()).children.find(o => o.isMesh);
  assert.ok(stroke, 'screen-space stroke Mesh exists');
  const material = stroke.material;
  assert.ok(material instanceof THREE.ShaderMaterial);
  assert.equal(material.uniforms.strokeWidth.value, 3, 'exactly 3 CSS px (baseline was 1px)');
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
    assert.equal(material.uniforms.strokeWidth.value, 3);
    // Reconstruct the actual shader's clip-space expansion with real THREE
    // matrices. Project opposite triangle edges back into CSS pixels.
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
        const offset = tangent.clone().multiplyScalar(-1.5).addScaledVector(normal, side * 1.5);
        clip.x += offset.x * 2 / width * clip.w;
        clip.y += offset.y * 2 / height * clip.w;
        return new THREE.Vector2(clip.x / clip.w * width / 2, clip.y / clip.w * height / 2);
      });
      assert.ok(Math.abs(edges[0].distanceTo(edges[1]) - 3) < 1e-10, 'opposite projected mesh edges are exactly 3 CSS pixels apart');
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

// Run BRIDGE_ROUTE_WEBGL=1 node --test tests/bridge_route_ui.mjs for SwiftShader.
test('real WebGL rasterizes a 3 CSS px stroke across angles, zoom, DPR and resize',
  { skip: process.env.BRIDGE_ROUTE_WEBGL !== '1', timeout: 120000 }, async () => {
    const { chromium } = await import('playwright');
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      const files = { '/three.js': new URL('../web/vendor/three.module.js', import.meta.url),
        '/three.core.js': new URL('../web/vendor/three.core.js', import.meta.url), '/route.js': moduleURL };
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
      const samples = await page.evaluate(async () => {
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
        renderer.dispose(); return results;
      });
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
