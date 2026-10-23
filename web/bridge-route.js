// Additive all-bridges walk. No production fallback: only the audited JSON supplies geometry/counts.
export const UI = {
  title: { ru: 'Все пешеходные мосты', it: 'Tutti i ponti pedonali', en: 'All pedestrian bridges' },
  intro: { ru: 'Кольцевой маршрут по шести сестьери от Piazza San Marco и обратно.', it: 'Un percorso ad anello nei sei sestieri, da Piazza San Marco e ritorno.', en: 'A circuit through the six sestieri, starting and ending at Piazza San Marco.' },
  open: { ru: 'Открыть маршрут', it: 'Apri il percorso', en: 'Open route' },
  back: { ru: 'Все маршруты', it: 'Tutti i percorsi', en: 'All routes' },
  loading: { ru: 'Загрузка проверенного маршрута…', it: 'Caricamento del percorso verificato…', en: 'Loading the audited route…' },
  error: { ru: 'Маршрут недоступен: файл не загружен или не прошёл проверку. Геометрия и числа не подставляются.', it: 'Percorso non disponibile: il file non è stato caricato o non ha superato la verifica. Nessuna geometria o cifra sostitutiva.', en: 'Route unavailable: the file could not be loaded or failed validation. No substitute geometry or counts are shown.' },
  retry: { ru: 'Повторить загрузку', it: 'Riprova', en: 'Retry loading' },
  length: { ru: 'Длина', it: 'Lunghezza', en: 'Length' },
  km: { ru: 'км', it: 'km', en: 'km' },
  bridges: { ru: 'Уникальные мосты', it: 'Ponti unici', en: 'Unique bridges' },
  repeats: { ru: 'Повторные переходы', it: 'Attraversamenti ripetuti', en: 'Repeat crossings' },
  repeat: { ru: 'повтор', it: 'ripetizione', en: 'repeat' },
  start: { ru: 'Начало и конец', it: 'Partenza e arrivo', en: 'Start and finish' },
  euler: { ru: 'Можно ли пройти каждый мост ровно один раз?', it: 'Si può attraversare ogni ponte esattamente una volta?', en: 'Can every bridge be crossed exactly once?' },
  possible: { ru: 'Замкнутый маршрут без повторов возможен в проверенном графе.', it: 'Nel grafo verificato è possibile un circuito senza ripetizioni.', en: 'A closed route without repeats is possible in the audited graph.' },
  impossible: { ru: 'Замкнутый маршрут без повторов невозможен в проверенном графе.', it: 'Nel grafo verificato un circuito senza ripetizioni è impossibile.', en: 'A closed route without repeats is impossible in the audited graph.' },
  odd: { ru: 'Вершины нечётной степени', it: 'Vertici di grado dispari', en: 'Odd-degree vertices' },
  show: { ru: 'Показать на карте', it: 'Mostra sulla mappa', en: 'Show on map' },
  hide: { ru: 'Скрыть линию', it: 'Nascondi la linea', en: 'Hide route' },
  focus: { ru: 'К началу маршрута', it: 'Vai alla partenza', en: 'Go to start' },
  gpx: { ru: 'Скачать GPX', it: 'Scarica GPX', en: 'Download GPX' },
  crossings: { ru: 'Переходы по порядку', it: 'Attraversamenti in ordine', en: 'Crossings in order' },
  directions: { ru: 'Стрелки показывают направление. Номера на карте показаны выборочно; выбранный переход отмечается отдельно. Полный порядок — в списке ниже.', it: 'Le frecce indicano la direzione. Sulla mappa appare una selezione di numeri; l’attraversamento scelto è evidenziato separatamente. L’elenco seguente riporta l’ordine completo.', en: 'Arrows show direction. Map numbers are sampled; the selected crossing is marked separately. The full order is listed below.' },
  source: { ru: 'Источник и ограничения', it: 'Fonte e limiti', en: 'Source and limitations' },
  caveat: { ru: 'Маршрут рассчитан по опубликованному пешеходному графу, а не по обследованию на месте. Доступность, закрытия, ступени и условия прохода могут измениться. Полнота относится к включённым в набор данным мостам, а не к гарантированно полному городскому реестру. Минимальность общей длины не гарантируется.', it: 'Il percorso è calcolato sul grafo pedonale pubblicato, non su un sopralluogo. Accessibilità, chiusure, gradini e condizioni di passaggio possono cambiare. La copertura riguarda i ponti inclusi nei dati, non un registro cittadino garantito completo. La lunghezza totale minima non è garantita.', en: 'The route is calculated from the published pedestrian graph, not a field survey. Access, closures, steps and passage conditions may change. Coverage refers to bridges included in the dataset, not a guaranteed complete city register. Minimum total walking distance is not guaranteed.' },
  excluded: { ru: 'Исключённые объекты', it: 'Elementi esclusi', en: 'Excluded objects' },
  unresolved: { ru: 'Кандидаты, требующие проверки', it: 'Candidati da verificare', en: 'Candidates requiring review' },
  none: { ru: 'В файле нет исключённых объектов.', it: 'Il file non elenca elementi esclusi.', en: 'No excluded objects are listed in the file.' }
};

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeSource = value => /^https?:\/\//i.test(String(value)) ? String(value) : null;
const safeGPX = value => /^data\/[a-z0-9_-]+\.gpx$/i.test(String(value)) ? String(value) : null;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const pair = value => Array.isArray(value) && value.length === 2 && value.every(finite);

// Fail closed on a malformed/mismatched file. No coordinate conversion or guessed source counts.
export function validateRoute(route) {
  const fail = () => { throw new Error('Invalid bridge route data'); };
  if (!route || route.status !== 'ready' || !route.id || !route.title || !route.summary || !route.start?.name ||
      !finite(route.start.lon) || !finite(route.start.lat) || !finite(route.distance_m) || route.distance_m <= 0 ||
      !Number.isInteger(route.bridge_count) || route.bridge_count < 1 || !Number.isInteger(route.repeat_crossings) || route.repeat_crossings < 0 ||
      typeof route.euler?.possible !== 'boolean' || !Number.isInteger(route.euler.odd_count) || route.euler.odd_count < 0 || !route.euler.explanation ||
      !Array.isArray(route.local) || route.local.length < 2 || !route.local.every(pair) ||
      !Array.isArray(route.coordinates) || route.coordinates.length !== route.local.length || !route.coordinates.every(pair) ||
      !Array.isArray(route.bridges) || route.bridges.length !== route.bridge_count ||
      !Array.isArray(route.crossings) || !Array.isArray(route.excluded) || !route.source || !safeGPX(route.gpx)) fail();
  const ids = new Set(), visits = new Map();
  for (const b of route.bridges) {
    if (!b.id || ids.has(b.id) || ![b.x, b.z, b.lon, b.lat].every(finite) || !Number.isInteger(b.visits) || b.visits < 1) fail();
    ids.add(b.id);
  }
  let repeats = 0;
  for (const c of route.crossings) {
    if (!ids.has(c.bridge_id) || ![c.x, c.z, c.lon, c.lat].every(finite) || typeof c.repeat !== 'boolean') fail();
    const n = visits.get(c.bridge_id) || 0;
    if (c.repeat !== (n > 0)) fail();
    visits.set(c.bridge_id, n + 1);
    if (c.repeat) repeats++;
  }
  if (visits.size !== ids.size || repeats !== route.repeat_crossings || route.crossings.length !== route.bridge_count + repeats ||
      route.bridges.some(b => visits.get(b.id) !== b.visits)) fail();
  return true;
}

const number = (n, pickText, digits = 0) => new Intl.NumberFormat(pickText({ ru: 'ru', it: 'it', en: 'en' }), { maximumFractionDigits: digits }).format(n);
const label = (key, pickText) => escapeHTML(pickText(UI[key]));
const length = (route, pickText) => `${number(route.distance_m / 1000, pickText, 1)} ${label('km', pickText)}`;

export function routeEntryHTML(state, pickText) {
  const route = state.route;
  return `<li class="route bridge-route-entry" data-no-i18n><h3>${escapeHTML(pickText(route?.title || UI.title))}</h3>
    <p>${escapeHTML(pickText(route?.summary || UI.intro))}</p>
    ${state.status === 'loading' || state.status === 'idle' ? `<p role="status">${label('loading', pickText)}</p>` : ''}
    ${state.status === 'error' ? `<p role="status">${label('error', pickText)}</p>` : ''}
    <div class="route-meta">${route ? `<span>${length(route, pickText)} · ${number(route.bridge_count, pickText)} ${label('bridges', pickText)} · ${number(route.repeat_crossings, pickText)} ${label('repeats', pickText)}</span>` : ''}
      <button class="pill primary" data-bridge-route-open>${label('open', pickText)}</button></div></li>`;
}

export function routePanelHTML(route, state = {}, pickText) {
  const sourceURL = safeSource(route.source?.url), gpxURL = safeGPX(route.gpx);
  const limitations = route.audit?.limitations ?? route.audit?.caveats;
  const notes = [...(limitations ? (Array.isArray(limitations) ? limitations : [limitations]) : []),
    route.audit?.scope, route.audit?.crossing_model_limitation, route.audit?.source_date_semantics].filter(Boolean);
  const unresolved = [...(route.audit?.ambiguous_portals || []), ...(route.audit?.unresolved_decks || [])];
  return `<article class="dock-page bridge-route-page" data-no-i18n>
    <h2 id="dock-title">${escapeHTML(pickText(route.title))}</h2><p class="lede">${escapeHTML(pickText(route.summary))}</p>
    <dl class="bridge-route-stats"><dt>${label('start', pickText)}</dt><dd>${escapeHTML(pickText(route.start.name))}</dd>
      <dt>${label('length', pickText)}</dt><dd>${length(route, pickText)}</dd>
      <dt>${label('bridges', pickText)}</dt><dd>${number(route.bridge_count, pickText)}</dd>
      <dt>${label('repeats', pickText)}</dt><dd>${number(route.repeat_crossings, pickText)}</dd></dl>
    <div class="walk-actions"><button class="pill primary" data-bridge-route-toggle aria-pressed="${!!state.visible}">${label(state.visible ? 'hide' : 'show', pickText)}</button>
      <button class="pill" data-bridge-route-start>${label('focus', pickText)}</button>
      ${gpxURL ? `<a class="pill" href="${escapeHTML(gpxURL)}" download>${label('gpx', pickText)}</a>` : ''}</div>
    <h3>${label('euler', pickText)}</h3><p>${label(route.euler.possible ? 'possible' : 'impossible', pickText)}</p>
    <p>${escapeHTML(pickText(route.euler.explanation))}</p><p>${label('odd', pickText)}: ${number(route.euler.odd_count, pickText)}</p>
    <h3>${label('source', pickText)}</h3><p class="src">${sourceURL ? `<a href="${escapeHTML(sourceURL)}" target="_blank" rel="noopener noreferrer">${escapeHTML(sourceURL)}</a>` : escapeHTML(route.source?.url)}
      · ${escapeHTML(route.source?.license)} · ${escapeHTML(route.source?.date)}</p>
    <p class="caveat">${label('caveat', pickText)}</p>${notes.map(n => `<p class="caveat">${escapeHTML(pickText(n))}</p>`).join('')}
    <details><summary>${label('excluded', pickText)} (${number(route.excluded.length, pickText)})</summary>
      ${route.excluded.length ? `<ul>${route.excluded.map(b => `<li><b>${escapeHTML(pickText(b.name || b.id))}</b> <small>${escapeHTML(b.id)}</small> — ${escapeHTML(pickText(b.reason))}</li>`).join('')}</ul>` : `<p>${label('none', pickText)}</p>`}</details>
    ${unresolved.length ? `<details><summary>${label('unresolved', pickText)} (${number(unresolved.length, pickText)})</summary><ul>${unresolved.map(b => `<li>${escapeHTML(pickText(b.name || b.id))} <small>${escapeHTML(b.id)}</small></li>`).join('')}</ul></details>` : ''}
    <h3>${label('crossings', pickText)} (${number(route.crossings.length, pickText)})</h3><p class="caveat">${label('directions', pickText)}</p>
    <ol class="bridge-crossings">${route.crossings.map((c, i) => `<li><button data-crossing="${i}"${state.selected === i ? ' aria-current="step"' : ''}>
      <span class="bridge-crossing-number">${i + 1}</span><span>${escapeHTML(pickText(c.name || c.bridge_id))}${c.repeat ? ` <small class="bridge-repeat">${label('repeat', pickText)}</small>` : ''}</span></button></li>`).join('')}</ol>
  </article>`;
}

// The dataset already uses the atlas's metric x/z frame. y is deliberately a visual overlay, not a surveyed height.
export function routeGeometry(route, elevation = 24) {
  const points = route.local.map(([x, z]) => [x, elevation, z]), arrows = [];
  let since = 220;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz);
    if (d < 0.01) continue;
    since += d;
    if (since < 220) continue;
    since = 0;
    const ux = dx / d, uz = dz / d, x = (a[0] + b[0]) / 2, z = (a[2] + b[2]) / 2, size = Math.min(14, d / 3);
    const tip = [x + ux * size, elevation + 1, z + uz * size];
    arrows.push([x - ux * size - uz * size * .65, elevation + 1, z - uz * size + ux * size * .65], tip,
      [x - ux * size + uz * size * .65, elevation + 1, z - uz * size - ux * size * .65], tip);
  }
  return { points, arrows };
}

function numberedMarker(THREE, n, x, z, selected = false) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  ctx.fillStyle = selected ? '#b04f3e' : '#345a60'; ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 32, 33);
  const texture = new THREE.CanvasTexture(canvas);
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
  marker.position.set(x, 38, z); marker.scale.set(48, 48, 1); marker.renderOrder = selected ? 33 : 32;
  return marker;
}

// Each segment is two expanded triangles with round caps. The union of adjacent
// caps closes even hairpin turns without miter spikes or zoom-dependent widths.
// THREE is supplied by the atlas: no second library copy or addon dependency.
export function buildThickRouteLine(THREE, points) {
  const positions = [], starts = [], ends = [], corners = [];
  const quad = [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (a.every((v, j) => v === b[j])) continue;
    for (const corner of quad) {
      positions.push(...(corner[0] ? b : a));
      starts.push(...a); ends.push(...b); corners.push(...corner);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('segmentStart', new THREE.Float32BufferAttribute(starts, 3));
  geometry.setAttribute('segmentEnd', new THREE.Float32BufferAttribute(ends, 3));
  geometry.setAttribute('corner', new THREE.Float32BufferAttribute(corners, 2));
  const material = new THREE.ShaderMaterial({
    uniforms: { resolution: { value: new THREE.Vector2(1, 1) }, strokeWidth: { value: 3 },
      color: { value: new THREE.Color('#b04f3e') }, opacity: { value: .95 } },
    depthTest: false, depthWrite: false, transparent: true, side: THREE.DoubleSide,
    vertexShader: `
      uniform vec2 resolution;
      uniform float strokeWidth;
      attribute vec3 segmentStart;
      attribute vec3 segmentEnd;
      attribute vec2 corner;
      varying vec2 strokePosition;
      varying float segmentLength;
      void main() {
        vec4 start = projectionMatrix * modelViewMatrix * vec4(segmentStart, 1.0);
        vec4 end = projectionMatrix * modelViewMatrix * vec4(segmentEnd, 1.0);
        vec2 delta = (end.xy / end.w - start.xy / start.w) * resolution * 0.5;
        segmentLength = length(delta);
        vec2 tangent = segmentLength > 0.00001 ? delta / segmentLength : vec2(1.0, 0.0);
        vec2 normal = vec2(-tangent.y, tangent.x);
        float halfWidth = strokeWidth * 0.5;
        vec2 offset = (tangent * (corner.x * 2.0 - 1.0) + normal * corner.y) * halfWidth;
        vec4 clip = mix(start, end, corner.x);
        clip.xy += offset * 2.0 / resolution * clip.w;
        gl_Position = clip;
        // Screen-space interpolation, including with a perspective camera.
        strokePosition = vec2(mix(-halfWidth, segmentLength + halfWidth, corner.x), corner.y * halfWidth) * clip.w;
        segmentLength *= clip.w;
      }`,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float strokeWidth;
      varying vec2 strokePosition;
      varying float segmentLength;
      void main() {
        vec2 p = strokePosition * gl_FragCoord.w;
        float len = segmentLength * gl_FragCoord.w;
        float cap = max(max(-p.x, p.x - len), 0.0);
        if (cap > 0.0 && length(vec2(cap, p.y)) > strokeWidth * 0.5) discard;
        gl_FragColor = vec4(color, opacity);
      }`
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'all-bridges-route-stroke'; mesh.renderOrder = 30;
  // The shader expands beyond world-space centerline bounds.
  mesh.frustumCulled = false;
  const viewport = new THREE.Vector4();
  mesh.onBeforeRender = renderer => {
    const resolution = material.uniforms.resolution.value;
    if (renderer.getCurrentViewport) {
      renderer.getCurrentViewport(viewport);
      const dpr = renderer.getPixelRatio();
      resolution.set(viewport.z / dpr, viewport.w / dpr);
    } else renderer.getSize(resolution);
    resolution.x = Math.max(1, resolution.x); resolution.y = Math.max(1, resolution.y);
  };
  return mesh;
}

export function buildRouteOverlay(THREE, route) {
  const group = new THREE.Group(); group.name = 'all-bridges-route';
  const data = routeGeometry(route), vectors = values => values.map(p => new THREE.Vector3(...p));
  group.add(buildThickRouteLine(THREE, data.points));
  const arrows = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(vectors(data.arrows)),
    new THREE.LineBasicMaterial({ color: '#345a60', depthTest: false, depthWrite: false })); arrows.renderOrder = 31; group.add(arrows);
  // Bound draw calls/textures: sample at most 36 first-visit numbers; any selected crossing gets its own marker.
  const first = route.crossings.map((c, i) => ({ ...c, index: i })).filter(c => !c.repeat), stride = Math.max(1, Math.ceil(first.length / 36));
  first.forEach((c, i) => { if (i % stride === 0) { const marker = numberedMarker(THREE, c.index + 1, c.x, c.z); if (marker) group.add(marker); } });
  return group;
}

function disposeObject(object) {
  object.traverse(o => { o.geometry?.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material];
    materials.forEach(m => { m?.map?.dispose(); m?.dispose(); }); });
}

// The installer owns only its dock view and scene group; it does not change quests, picking, cards or renderer.
export function installBridgeRoute({ THREE, scene, aimFly, openDock, dockLive, getDockView, showWalks, pickText, onLang, fetchRoute = url => fetch(url) }) {
  const state = { status: 'idle', route: null, visible: false, selected: -1 };
  let pending = null, overlay = null, selectedMarker = null, disposed = false;
  const back = () => ({ label: pickText(UI.back), go: showWalks });
  function render(preserveScroll = false) {
    if (disposed) return;
    const dock = dockLive.closest?.('.dock'), scrollTop = dock?.scrollTop || 0;
    if (state.status === 'ready') {
      openDock('bridge-route', routePanelHTML(state.route, state, pickText), back());
      dockLive.querySelector('[data-bridge-route-toggle]')?.addEventListener('click', () => setVisible(!state.visible));
      dockLive.querySelector('[data-bridge-route-start]')?.addEventListener('click', () => { const [x, z] = state.route.local[0]; aimFly(x, z, 900); });
      dockLive.querySelectorAll('[data-crossing]').forEach(b => b.addEventListener('click', () => focusCrossing(Number(b.dataset.crossing))));
    } else {
      openDock('bridge-route', `<article class="dock-page bridge-route-page" data-no-i18n><h2 id="dock-title">${label('title', pickText)}</h2>
        <p role="status">${label(state.status === 'error' ? 'error' : 'loading', pickText)}</p>
        ${state.status === 'error' ? `<button class="pill" data-bridge-route-retry>${label('retry', pickText)}</button>` : ''}</article>`, back());
      dockLive.querySelector('[data-bridge-route-retry]')?.addEventListener('click', retry);
    }
    if (preserveScroll && dock) dock.scrollTop = scrollTop;
  }
  function refresh() {
    if (disposed) return;
    if (getDockView() === 'bridge-route') render(true);
    else if (getDockView() === 'walks') showWalks();
  }
  function load() {
    if (pending) return pending;
    if (disposed || state.status === 'ready' || state.status === 'error') return Promise.resolve(state.route);
    state.status = 'loading';
    pending = (async () => {
      try {
        const response = await fetchRoute('data/bridge-route.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const route = await response.json(); validateRoute(route);
        if (!disposed) { state.route = route; state.status = 'ready'; }
      } catch { if (!disposed) { state.route = null; state.status = 'error'; } }
      finally { pending = null; refresh(); }
      return state.route;
    })();
    return pending;
  }
  function show() { if (disposed) return; render(); void load(); }
  function retry() { if (pending || disposed) return pending; state.status = 'idle'; const result = load(); refresh(); return result; }
  function ensureOverlay() { if (!overlay && state.route && !disposed) { overlay = buildRouteOverlay(THREE, state.route); scene.add(overlay); } return overlay; }
  function setVisible(visible) {
    if (state.status !== 'ready' || disposed) return;
    state.visible = !!visible;
    if (state.visible) ensureOverlay();
    if (overlay) overlay.visible = state.visible;
    if (getDockView() === 'bridge-route') render(true);
  }
  function focusCrossing(index) {
    if (disposed || !Number.isInteger(index) || !state.route?.crossings[index]) return;
    const c = state.route.crossings[index]; state.selected = index; state.visible = true; ensureOverlay().visible = true;
    if (selectedMarker) { overlay.remove(selectedMarker); disposeObject(selectedMarker); }
    selectedMarker = numberedMarker(THREE, index + 1, c.x, c.z, true); if (selectedMarker) overlay.add(selectedMarker);
    aimFly(c.x, c.z, 260);
    if (getDockView() === 'bridge-route') render(true);
  }
  const unsubscribe = onLang(() => { if (getDockView() === 'bridge-route') render(true); });
  return {
    show, load, retry, setVisible, focusCrossing,
    listHTML() { if (state.status === 'idle') void load(); return routeEntryHTML(state, pickText); },
    wireList() { dockLive.querySelector('[data-bridge-route-open]')?.addEventListener('click', show); },
    dispose() { disposed = true; unsubscribe?.(); if (overlay) { scene.remove(overlay); disposeObject(overlay); overlay = null; } }
  };
}
