// Venice gondola: a first-person drive through the real canals, from the water, collecting
// golden lions. The city is the viewer's own data - the same tiles, worker and palette as
// web/app.js - so what passes by is the Venice the map draws, not a mock-up.
//
// The look follows app.js where it matters: the same four-period palette, the same posting of
// the renderer's colour space, the same sun/foot shading and fog maths in the building shader,
// the same land and water colours. One deliberate difference: the map fades the city in from
// 9 km, but the tiles loaded here end at 2.4 km, so the fog is pulled in to hide that edge
// rather than show the void.
//
// Built for the canals, not for a street plan: collision is the real water, rasterised at 3 m
// by pipeline/venice/game_mask.py, and the reachable part of it is flood-filled from the start
// so every lion sits in water the gondola can actually get to.
import * as THREE from './vendor/three.module.js';

THREE.ColorManagement.enabled = false;

const SKY = '#ffffff';
const LAND = '#f3f0ea';
const WATER = '#b9d0d2';
const MAQUETTE = '#f1eee8';
const ATTR_W = 256;

// Collision mask: 1667 x 1667 cells at 3 m over X -2854..2147, Z -2840..2161.
const MASK = { url: 'img/water-fine.png', x0: -2854, z0: -2840, cell: 3, w: 1667, h: 1667 };
const START = { x: -354, z: -340, angle: -1.101 };  // Canal Grande, bow down the canal
const LOAD_RADIUS = 2400;
const FOG = { near: 1300, far: 2500 };
const LION_COUNT = 12;
const EYE = 1.15;                                    // camera height above the water, m
const HULL = { length: 4.6, halfBeam: 0.75, bow: 1.9 };
const DRIVE = { max: 26, turbo: 44, back: 12, accel: 13, turn: 1.55, driftMax: 7, pitchMax: 1.25, pitchMin: -0.5 };
const CATCH = 8;                                     // metres: how close a lion is picked up

const canvas = document.getElementById('scene');
const loading = document.getElementById('loading');
const progressEl = document.getElementById('progress');
const noteEl = document.getElementById('note');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const speedEl = document.getElementById('speed');
const turboEl = document.getElementById('turbo');
const nearestEl = document.getElementById('nearest');
const winEl = document.getElementById('win');
const minimap = document.getElementById('minimap');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // as app.js: the palette is authored for it
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(SKY);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.5, 9000);

// The boat and the lions are lit; the city carries its own shading in its shader.
scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb6b8, 0.85));
const sunLight = new THREE.DirectionalLight(0xfff8ee, 0.7);
sunLight.position.set(-0.55, 0.55, -0.62).multiplyScalar(400);
scene.add(sunLight);

const col = c => new THREE.Color(c);
const palette = [];

async function fetchBin(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
  if (head[0] !== 0x1f || head[1] !== 0x8b) return buf;
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}

// ---------- Ground: the same polygons app.js draws, triangulated rather than extruded ----------
function polygons(buf) {
  const [nPoly, nRing, nVert] = new Uint32Array(buf, 0, 3);
  const ringStart = new Uint32Array(buf, 12, nPoly + 1);
  const off = 12 + 4 * (nPoly + 1);
  const vertStart = new Uint32Array(buf, off, nRing + 1);
  const xz = new Float32Array(buf, off + 4 * (nRing + 1), 2 * nVert);
  const pos = [], idx = [];
  for (let p = 0; p < nPoly; p++) {
    const outer = [], holes = [];
    for (let r = ringStart[p]; r < ringStart[p + 1]; r++) {
      const pts = [];
      for (let v = vertStart[r]; v < vertStart[r + 1]; v++) pts.push(new THREE.Vector2(xz[2 * v], -xz[2 * v + 1]));
      if (r === ringStart[p]) outer.push(...pts); else holes.push(pts);
    }
    if (outer.length < 3) continue;
    const base = pos.length / 3;
    for (const v of [outer, ...holes].flat()) pos.push(v.x, 0, -v.y);
    for (const t of THREE.ShapeUtils.triangulateShape(outer, holes)) idx.push(base + t[0], base + t[1], base + t[2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// A flat surface in app.js's shader: light 1.04, foot 0.82.
const FLAT = 1.04 * 0.82;
const groundMaterial = hex => new THREE.MeshBasicMaterial({ color: col(hex).multiplyScalar(FLAT), fog: true });

// ---------- Buildings: app.js's shader, cut down to the period palette ----------
const CITY_VERT = /* glsl */`
  in float bld;
  uniform sampler2D uAttr;
  uniform vec3 uPalette[4];
  uniform vec3 uMaquette;
  out vec3 vColor;
  out vec3 vWorld;
  out float vShaped;
  void main() {
    int i = int(bld + 0.5);
    bool shaped = i >= 32768;             // a pale surface, as pipeline/s03_tiles.py marks it
    i = i % 32768;
    ivec2 tc = ivec2(2 * (i % ${ATTR_W}), i / ${ATTR_W});
    vec4 a = texelFetch(uAttr, tc, 0);
    int pf = int(a.y + 0.5);
    int period = min(pf % 16, 3);
    int flag = pf / 16;
    vShaped = shaped ? 1.0 : 0.0;
    vec3 c = uPalette[period];
    if (flag >= 1) c = mix(c, uMaquette, 0.32);       // an estimated year is paler
    if (shaped) c = mix(c, vec3(1.0), 0.3);
    vColor = c;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const CITY_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uFogColor;
  uniform vec2 uFog;
  in vec3 vColor;
  in vec3 vWorld;
  in float vShaped;
  out vec4 outColor;
  void main() {
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    // A low afternoon sun from the north-west, a soft sky from above (app.js).
    float sun = max(dot(n, normalize(vec3(-0.55, 0.55, -0.62))), 0.0);
    float light = mix(0.66 + 0.34 * sun, 1.04, smoothstep(0.86, 0.94, n.y));
    if (vShaped > 0.5) light = 0.6 + 0.3 * sun + 0.2 * max(dot(n, normalize(vec3(0.6, 0.45, 0.66))), 0.0);
    float foot = mix(0.82, 1.0, clamp(vWorld.y / 12.0, 0.0, 1.0));
    vec3 c = vColor * light * foot;
    float d = length(vWorld - cameraPosition);
    c = mix(c, uFogColor, smoothstep(uFog.x, uFog.y, d));
    outColor = vec4(c, 1.0);
  }
`;

const cityLook = () => ({
  uPalette: { value: palette },
  uMaquette: { value: col(MAQUETTE) },
  uFogColor: { value: col(SKY) },
  uFog: { value: new THREE.Vector2(FOG.near, FOG.far) },
});

function addTile(m) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
  g.setAttribute('bld', new THREE.BufferAttribute(m.bld, 1));
  g.setIndex(new THREE.BufferAttribute(m.idx, 1));
  const rows = Math.ceil(m.nB / ATTR_W);
  const data = new Float32Array(ATTR_W * 2 * rows * 4);
  data.set(m.attr);
  const tex = new THREE.DataTexture(data, ATTR_W * 2, rows, THREE.RGBAFormat, THREE.FloatType);
  tex.needsUpdate = true;
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { ...cityLook(), uAttr: { value: tex } },
    vertexShader: CITY_VERT,
    fragmentShader: CITY_FRAG,
    side: THREE.DoubleSide,
  }));
  mesh.scale.setScalar(0.1);                 // the worker's positions are decimetres
  mesh.position.set(m.origin[0], 0, m.origin[1]);
  scene.add(mesh);
}

// ---------- The mask: water, and the water the gondola can reach ----------
let mask = null, reach = null;

function indexOf(x, z) {
  const c = Math.floor((x - MASK.x0) / MASK.cell);
  const r = Math.floor((z - MASK.z0) / MASK.cell);
  if (c < 0 || c >= MASK.w || r < 0 || r >= MASK.h) return -1;
  return r * MASK.w + c;
}
const isWater = (x, z) => {
  const i = indexOf(x, z);
  return i >= 0 && mask[i] === 1;
};

async function loadMask() {
  const img = new Image();
  img.src = MASK.url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = MASK.w; c.height = MASK.h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const rgba = ctx.getImageData(0, 0, MASK.w, MASK.h).data;
  mask = new Uint8Array(MASK.w * MASK.h);
  for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4] > 128 ? 1 : 0;

  // Flood fill from the start over water eroded by one cell: the canals that open off the
  // Grande, and only where the 4.6 m hull has 3 m of clearance around it, so a lion can never
  // be placed behind a gap the gondola cannot pass.
  const open = new Uint8Array(mask.length);
  for (let r = 1; r < MASK.h - 1; r++) {
    for (let c = 1; c < MASK.w - 1; c++) {
      const i = r * MASK.w + c;
      if (mask[i] && mask[i - 1] && mask[i + 1] && mask[i - MASK.w] && mask[i + MASK.w]
        && mask[i - MASK.w - 1] && mask[i - MASK.w + 1] && mask[i + MASK.w - 1] && mask[i + MASK.w + 1]) open[i] = 1;
    }
  }
  reach = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const s = indexOf(START.x, START.z);
  if (s < 0 || open[s] !== 1) throw new Error('the start point has no clearance for the gondola');
  let head = 0, tail = 0;
  reach[s] = 1; queue[tail++] = s;
  while (head < tail) {
    const i = queue[head++];
    const c0 = i % MASK.w, r0 = (i - c0) / MASK.w;
    if (c0 > 0 && !reach[i - 1] && open[i - 1]) { reach[i - 1] = 1; queue[tail++] = i - 1; }
    if (c0 < MASK.w - 1 && !reach[i + 1] && open[i + 1]) { reach[i + 1] = 1; queue[tail++] = i + 1; }
    if (r0 > 0 && !reach[i - MASK.w] && open[i - MASK.w]) { reach[i - MASK.w] = 1; queue[tail++] = i - MASK.w; }
    if (r0 < MASK.h - 1 && !reach[i + MASK.w] && open[i + MASK.w]) { reach[i + MASK.w] = 1; queue[tail++] = i + MASK.w; }
  }
}

// ---------- The gondola ----------
const player = { x: START.x, z: START.z, angle: START.angle, pitch: 0.21, speed: 0, drift: 0, collected: 0 };

const keys = { up: false, down: false, left: false, right: false, strafeL: false, strafeR: false, lookUp: false, lookDown: false, turbo: false };
const KEYMAP = {
  ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
  ArrowLeft: 'left', ArrowRight: 'right', a: 'strafeL', d: 'strafeR',
  q: 'lookUp', e: 'lookDown', PageUp: 'lookUp', PageDown: 'lookDown',
};
addEventListener('keydown', ev => {
  if (ev.key === 'Shift') { keys.turbo = true; return; }
  const k = KEYMAP[ev.key.length === 1 ? ev.key.toLowerCase() : ev.key];
  if (k) { keys[k] = true; ev.preventDefault(); }
});
addEventListener('keyup', ev => {
  if (ev.key === 'Shift') { keys.turbo = false; return; }
  const k = KEYMAP[ev.key.length === 1 ? ev.key.toLowerCase() : ev.key];
  if (k) keys[k] = false;
});
const releaseKeys = () => { for (const k in keys) keys[k] = false; };
addEventListener('blur', releaseKeys);

// Mouse: drag to look, as the map itself is dragged; a click locks the pointer for free looking.
let dragging = false, lastMouse = null;
canvas.addEventListener('mousedown', ev => { dragging = true; lastMouse = [ev.clientX, ev.clientY]; });
addEventListener('mouseup', () => { dragging = false; lastMouse = null; });
addEventListener('mousemove', ev => {
  if (document.pointerLockElement) {
    player.angle -= ev.movementX * 0.0025;
    player.pitch = Math.max(DRIVE.pitchMin, Math.min(DRIVE.pitchMax, player.pitch - ev.movementY * 0.002));
    return;
  }
  if (!dragging || !lastMouse) return;
  const dx = ev.clientX - lastMouse[0], dy = ev.clientY - lastMouse[1];
  lastMouse = [ev.clientX, ev.clientY];
  player.angle -= dx * 0.004;
  player.pitch = Math.max(DRIVE.pitchMin, Math.min(DRIVE.pitchMax, player.pitch - dy * 0.003));
});
canvas.addEventListener('click', () => { if (canvas.requestPointerLock) canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement) releaseKeys(); });

// A gondola is long: the hull is tested at seven points, so it can lie against a wall and slide.
const PROBES = [[0, 0], [0, HULL.bow], [0, -HULL.bow], [HULL.halfBeam, 0], [-HULL.halfBeam, 0],
  [HULL.halfBeam, -1.4], [-HULL.halfBeam, -1.4]];
function free(x, z, angle) {
  const s = Math.sin(angle), c = Math.cos(angle);
  for (let i = 0; i < PROBES.length; i++) {
    const lat = PROBES[i][0], along = PROBES[i][1];
    if (!isWater(x + c * lat + s * along, z - s * lat + c * along)) return false;
  }
  return true;
}

const boat = new THREE.Group();
{
  const dark = new THREE.MeshLambertMaterial({ color: col('#2c2f2a') });
  const mid = new THREE.MeshLambertMaterial({ color: col('#5f625c') });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(HULL.halfBeam * 2, 0.42, HULL.length), dark);
  hull.position.y = 0.2;
  boat.add(hull);
  const prow = new THREE.Mesh(new THREE.BoxGeometry(HULL.halfBeam * 1.5, 0.5, 0.9), dark);
  prow.position.set(0, 0.28, HULL.length / 2 - 0.2);
  boat.add(prow);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(HULL.halfBeam * 1.9, 0.14, 0.7), mid);
  bench.position.set(0, 0.48, -0.9);
  boat.add(bench);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(HULL.halfBeam * 1.6, 0.5, 1.1), mid);
  cabin.position.set(0, 0.62, 0.35);
  boat.add(cabin);
  const fez = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), new THREE.MeshLambertMaterial({ color: col('#b04f3e') }));
  fez.position.set(0, 0.95, 0.35);
  boat.add(fez);
  // The lion of the Serenissima at the prow, in gold, as the lions you collect are.
  const figurehead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), new THREE.MeshLambertMaterial({ color: col('#d4af37'), emissive: col('#6b5205') }));
  figurehead.position.set(0, 0.62, HULL.length / 2 + 0.25);
  boat.add(figurehead);
  scene.add(boat);
}

// ---------- The lions ----------
const lions = [];
const lionMaterial = new THREE.MeshLambertMaterial({ color: col('#d4af37'), emissive: col('#6b5205') });
const maneMaterial = new THREE.MeshLambertMaterial({ color: col('#b8912a'), emissive: col('#4a3805') });
const beamMaterial = new THREE.MeshBasicMaterial({ color: col('#f0d060'), transparent: true, opacity: 0.16, fog: false, depthWrite: false });
const ringMaterial = new THREE.MeshBasicMaterial({ color: col('#e6c34a'), transparent: true, opacity: 0.5, fog: false, depthWrite: false, side: THREE.DoubleSide });

function placeLions() {
  const spots = [];
  for (let pass = 0; pass < 3 && spots.length < LION_COUNT; pass++) {
    const gap = 90 / (pass + 1), far = 1100 / (pass + 1), near = 150 / (pass + 1);
    for (let tries = 0; tries < 40000 && spots.length < LION_COUNT; tries++) {
      const i = Math.floor(Math.random() * mask.length);
      if (!reach[i]) continue;
      const c = i % MASK.w, r = (i - c) / MASK.w;
      // open water only - the 3 x 3 neighbourhood - so nothing is placed inside a wall
      let open = true;
      for (let dr = -1; dr <= 1 && open; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= MASK.h || cc < 0 || cc >= MASK.w || !reach[rr * MASK.w + cc]) { open = false; break; }
        }
      }
      if (!open) continue;
      const x = MASK.x0 + (c + 0.5) * MASK.cell, z = MASK.z0 + (r + 0.5) * MASK.cell;
      const d = Math.hypot(x - START.x, z - START.z);
      if (d < near || d > far) continue;
      if (spots.some(p => Math.hypot(p.x - x, p.z - z) < gap)) continue;
      spots.push({ x, z });
    }
  }
  if (spots.length < LION_COUNT) throw new Error(`only ${spots.length} of ${LION_COUNT} lion spots found`);

  for (const s of spots) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.25, 18, 14), lionMaterial));
    const mane = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.42, 10, 22), maneMaterial);
    mane.rotation.y = Math.PI / 2;
    g.add(mane);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 46, 10, 1, true), beamMaterial);
    beam.position.y = 22;
    g.add(beam);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.9, 28), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.2;
    g.add(ring);
    g.position.set(s.x, 2.4, s.z);
    scene.add(g);
    lions.push({ x: s.x, z: s.z, group: g, taken: false });
  }
  totalEl.textContent = String(LION_COUNT);
}

function resetGame() {
  player.x = START.x; player.z = START.z; player.angle = START.angle;
  player.pitch = 0.21; player.speed = 0; player.drift = 0; player.collected = 0;
  scoreEl.textContent = '0';
  winEl.classList.remove('show');
  for (const l of lions) { l.taken = false; l.group.visible = true; }
}

// ---------- The chart on the HUD: water, the lions, the start, the gondola ----------
const MM = 156, MM_SPAN = 900;
const mmCtx = minimap.getContext('2d');
const mmImage = mmCtx.createImageData(MM, MM);
const mmStep = MM_SPAN / MM / MASK.cell;                       // mask cells per pixel

function drawMinimap() {
  const c0 = (player.x - MASK.x0) / MASK.cell, r0 = (player.z - MASK.z0) / MASK.cell;
  const d = mmImage.data;
  for (let py = 0; py < MM; py++) {
    const rr = Math.round(r0 + (py - MM / 2) * mmStep);
    for (let px = 0; px < MM; px++) {
      const cc = Math.round(c0 + (px - MM / 2) * mmStep);
      const i = (py * MM + px) * 4;
      const wet = cc >= 0 && cc < MASK.w && rr >= 0 && rr < MASK.h && mask[rr * MASK.w + cc];
      d[i] = wet ? 214 : 246; d[i + 1] = wet ? 231 : 243; d[i + 2] = wet ? 233 : 236; d[i + 3] = 255;
    }
  }
  mmCtx.putImageData(mmImage, 0, 0);
  const at = (x, z) => [MM / 2 + (x - player.x) / MM_SPAN * MM, MM / 2 + (z - player.z) / MM_SPAN * MM];
  mmCtx.fillStyle = '#c9a227';
  for (const l of lions) {
    if (l.taken) continue;
    const [x, y] = at(l.x, l.z);
    if (x < -3 || y < -3 || x > MM + 3 || y > MM + 3) continue;
    mmCtx.beginPath(); mmCtx.arc(x, y, 3.2, 0, 6.284); mmCtx.fill();
  }
  const [sx, sy] = at(START.x, START.z);
  mmCtx.strokeStyle = '#b04f3e'; mmCtx.lineWidth = 1.6;
  mmCtx.beginPath(); mmCtx.arc(sx, sy, 3, 0, 6.284); mmCtx.stroke();
  const a = player.angle;
  mmCtx.fillStyle = '#b04f3e';
  mmCtx.beginPath();
  mmCtx.moveTo(MM / 2 + Math.sin(a) * 7, MM / 2 + Math.cos(a) * 7);
  mmCtx.lineTo(MM / 2 + Math.sin(a + 2.5) * 5.5, MM / 2 + Math.cos(a + 2.5) * 5.5);
  mmCtx.lineTo(MM / 2 + Math.sin(a - 2.5) * 5.5, MM / 2 + Math.cos(a - 2.5) * 5.5);
  mmCtx.closePath(); mmCtx.fill();
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------- Loading ----------
async function loadCity() {
  const config = await (await fetch('data/venezia.json')).json();
  palette.length = 0;
  for (const p of config.periods) palette.push(col(p.color));
  while (palette.length < 4) palette.push(col('#9aa0a6'));

  // land.bin and context.bin are byte-identical in this build, so the land is drawn once.
  const land = new THREE.Mesh(polygons(await fetchBin('data/land.bin')), groundMaterial(LAND));
  land.position.y = -0.05;
  scene.add(land);
  const water = new THREE.Mesh(polygons(await fetchBin('data/water.bin')), groundMaterial(WATER));
  water.position.y = -0.4;
  scene.add(water);

  const TILE = config.tileSize;
  const tasks = config.tiles.filter(t => Math.abs((t.tx + 0.5) * TILE - START.x) <= LOAD_RADIUS
    && Math.abs((t.tz + 0.5) * TILE - START.z) <= LOAD_RADIUS);
  const total = tasks.length;
  if (!total) return;
  const packs = Object.fromEntries(config.packs.map(n => [n, fetchBin(`data/${n}`)]));

  await new Promise(resolve => {
    const pool = Array.from({ length: Math.min(4, navigator.hardwareConcurrency || 2) }, () => new Worker('worker.js', { type: 'module' }));
    let loaded = 0;
    const done = () => {
      if (++loaded < total) return false;
      progressEl.textContent = '100';
      pool.forEach(p => p.terminate());
      resolve();
      return true;
    };
    for (const w of pool) {
      const next = async () => {
        const task = tasks.shift();
        if (!task) return;
        const buf = (await packs[task.pack]).slice(task.offset, task.offset + task.length);
        w.postMessage({ buf, id: task.file }, [buf]);
      };
      // A tile that will not parse is counted rather than stalling the bar, so the game still starts.
      w.onerror = ev => { console.error('tile worker', ev.message || ev); if (!done()) next(); };
      w.onmessage = ({ data }) => {
        addTile(data);
        progressEl.textContent = String(Math.round(100 * loaded / total));
        if (!done()) next();
      };
      next();
    }
  });
}

// ---------- The drive ----------
let last = 0, mmTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;

  if (keys.left) player.angle += DRIVE.turn * dt;
  if (keys.right) player.angle -= DRIVE.turn * dt;
  if (keys.lookUp) player.pitch = Math.min(DRIVE.pitchMax, player.pitch + 1.1 * dt);
  if (keys.lookDown) player.pitch = Math.max(DRIVE.pitchMin, player.pitch - 1.1 * dt);

  const top = keys.turbo ? DRIVE.turbo : DRIVE.max;
  if (keys.up) player.speed = Math.min(top, player.speed + DRIVE.accel * dt * (keys.turbo ? 1.7 : 1));
  else if (keys.down) player.speed = Math.max(-DRIVE.back, player.speed - DRIVE.accel * dt);
  else player.speed -= player.speed * Math.min(1, 1.5 * dt);

  const driftTarget = keys.strafeR ? DRIVE.driftMax : keys.strafeL ? -DRIVE.driftMax : 0;
  player.drift += (driftTarget - player.drift) * Math.min(1, 3 * dt);

  // Move in steps no longer than a metre, so a fast gondola cannot cross a wall between frames.
  const s = Math.sin(player.angle), c = Math.cos(player.angle);
  const vx = s * player.speed + c * player.drift;
  const vz = c * player.speed - s * player.drift;
  const steps = Math.max(1, Math.ceil(Math.hypot(vx, vz) * dt));
  for (let i = 0; i < steps; i++) {
    const nx = player.x + vx * dt / steps, nz = player.z + vz * dt / steps;
    if (free(nx, nz, player.angle)) { player.x = nx; player.z = nz; }
    else if (free(nx, player.z, player.angle)) { player.x = nx; player.speed *= 0.86; player.drift *= 0.6; }
    else if (free(player.x, nz, player.angle)) { player.z = nz; player.speed *= 0.86; player.drift *= 0.6; }
    else { player.speed *= -0.22; player.drift *= -0.2; break; }   // a wall: bounce off it
  }

  for (const l of lions) {
    if (l.taken) continue;
    if (Math.hypot(l.x - player.x, l.z - player.z) < CATCH) {
      l.taken = true; l.group.visible = false;
      player.collected++;
      scoreEl.textContent = String(player.collected);
      if (player.collected === LION_COUNT) winEl.classList.add('show');
    }
  }
  for (let i = 0; i < lions.length; i++) {
    const l = lions[i];
    if (l.taken) continue;
    l.group.rotation.y += dt * 0.9;
    l.group.position.y = 2.4 + Math.sin(now / 700 + i) * 0.3;
  }

  boat.position.set(player.x, 0, player.z);
  boat.rotation.y = player.angle;

  const bx = player.x + s * (HULL.length / 2 - 0.3), bz = player.z + c * (HULL.length / 2 - 0.3);
  const cp = Math.cos(player.pitch), sp = Math.sin(player.pitch);
  camera.position.set(bx, EYE, bz);
  camera.lookAt(bx + s * cp * 60, EYE + sp * 60, bz + c * cp * 60);
  const fov = 62 + Math.min(22, Math.abs(player.speed) * 0.55);   // the speed of it, in the lens
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }

  speedEl.textContent = String(Math.round(Math.hypot(player.speed, player.drift) * 3.6));
  turboEl.style.opacity = keys.turbo ? '1' : '0.25';
  let best = Infinity;
  for (const l of lions) if (!l.taken) best = Math.min(best, Math.hypot(l.x - player.x, l.z - player.z));
  nearestEl.textContent = best === Infinity ? '—' : `${Math.round(best)} м`;

  if (now - mmTick > 90) { mmTick = now; drawMinimap(); }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

async function init() {
  try {
    resize();
    await loadCity();
    noteEl.textContent = 'Вода, каналы и львы…';
    await loadMask();
    placeLions();
    resetGame();
    renderer.render(scene, camera);
    loading.hidden = true;
    loading.style.display = 'none';
    requestAnimationFrame(frame);
  } catch (err) {
    console.error(err);
    noteEl.innerHTML = `<b>Не удалось запустить игру</b><br>${String((err && err.message) || err).slice(0, 240)}`;
  }
}

document.getElementById('restart').addEventListener('click', resetGame);
init();