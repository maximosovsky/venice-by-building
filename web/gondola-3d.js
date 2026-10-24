// 3D gondola game in real Venice: drive on water, collect golden lions, view from below.
import * as THREE from './vendor/three.module.js';

const canvas = document.getElementById('scene');
const loading = document.getElementById('loading');
const progressEl = document.getElementById('progress');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const winEl = document.getElementById('win');
const restartBtn = document.getElementById('restart');

const SKY = 0xffffff;
const WATER = 0xb9d0d2;
const LAND = 0xf3f0ea;
const PALETTE = [0x2f3f6b, 0xb06a2c, 0xc8b06a, 0x9aa0a6];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(SKY);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);

const camera = new THREE.PerspectiveCamera(60, 1, 1, 12000);

const hemi = new THREE.HemisphereLight(0xffffff, 0xb9d0d2, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff8ee, 0.8);
sun.position.set(-300, 500, -400);
scene.add(sun);

const WORLD = {
  XMIN: -2500, XMAX: 17000,
  ZMIN: -9000, ZMAX: 2200,
};
WORLD.W = WORLD.XMAX - WORLD.XMIN;
WORLD.H = WORLD.ZMAX - WORLD.ZMIN;

// ---------- Binary helpers ----------
async function fetchBin(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
  if (head[0] !== 0x1f || head[1] !== 0x8b) return buf;
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}

async function loadPolygons(url) {
  const buf = await fetchBin(url);
  const [nPoly, nRing, nVert] = new Uint32Array(buf, 0, 3);
  const ringStart = new Uint32Array(buf, 12, nPoly + 1);
  const vertStartOff = 12 + 4 * (nPoly + 1);
  const vertStart = new Uint32Array(buf, vertStartOff, nRing + 1);
  const xzOff = vertStartOff + 4 * (nRing + 1);
  const xz = new Float32Array(buf, xzOff, 2 * nVert);
  const shapes = [];
  for (let p = 0; p < nPoly; p++) {
    const makeRing = r => {
      const pts = [];
      for (let v = vertStart[r]; v < vertStart[r + 1]; v++) pts.push(new THREE.Vector2(xz[2 * v], -xz[2 * v + 1]));
      return pts;
    };
    const shape = new THREE.Shape(makeRing(ringStart[p]));
    for (let r = ringStart[p] + 1; r < ringStart[p + 1]; r++) shape.holes.push(new THREE.Path(makeRing(r)));
    shapes.push(shape);
  }
  const g = new THREE.ShapeGeometry(shapes);
  g.rotateX(-Math.PI / 2);
  return g;
}

// ---------- Ground ----------
const groundGroup = new THREE.Group();
scene.add(groundGroup);

Promise.all([
  loadPolygons('data/water.bin'),
  loadPolygons('data/land.bin'),
  loadPolygons('data/context.bin'),
]).then(([waterGeo, landGeo, contextGeo]) => {
  const water = new THREE.Mesh(waterGeo, new THREE.MeshPhongMaterial({ color: WATER, shininess: 80 }));
  water.position.y = -0.4;
  groundGroup.add(water);
  const context = new THREE.Mesh(contextGeo, new THREE.MeshLambertMaterial({ color: 0xe9e6df }));
  context.position.y = -0.1;
  groundGroup.add(context);
  const land = new THREE.Mesh(landGeo, new THREE.MeshLambertMaterial({ color: LAND }));
  land.position.y = -0.05;
  groundGroup.add(land);
}).catch(e => console.error('ground load failed', e));

// ---------- Buildings from tiles ----------
const config = await (await fetch('data/venezia.json')).json();
const TILE = config.tileSize;
const start = new THREE.Vector3(-354, 0, -340);
const RADIUS = 2500;

const tileQueue = config.tiles.filter(t => {
  const cx = (t.tx + 0.5) * TILE;
  const cz = (t.tz + 0.5) * TILE;
  return Math.hypot(cx - start.x, cz - start.z) <= RADIUS;
});
const packs = Object.fromEntries(config.packs.map(name => [name, fetchBin(`data/${name}`)]));
const WORKERS = Math.min(4, navigator.hardwareConcurrency || 2);
const pool = Array.from({ length: WORKERS }, () => new Worker('worker.js', { type: 'module' }));
let loaded = 0;
const buildingMeshes = [];

function colorFor(a) {
  const pf = a[1];
  const period = Math.floor(pf + 0.5) % 16;
  const flag = Math.floor((pf + 0.5) / 16);
  let c = new THREE.Color(PALETTE[Math.min(period, PALETTE.length - 1)] || PALETTE[3]);
  if (flag >= 1) c.lerp(new THREE.Color(0xf1eee8), flag >= 2 ? 1.0 : 0.32);
  return c;
}

function addTile(m) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
  g.setAttribute('bld', new THREE.BufferAttribute(m.bld, 1));
  g.setIndex(new THREE.BufferAttribute(m.idx, 1));

  const nV = m.pos.length / 3;
  const colors = new Float32Array(nV * 3);
  for (let i = 0; i < nV; i++) {
    const b = m.bld[i] % 32768;
    const a = m.attr.subarray(b * 8, b * 8 + 8);
    const c = colorFor(a);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.scale.setScalar(0.1);
  mesh.position.set(m.origin[0], 0, m.origin[1]);
  scene.add(mesh);
  buildingMeshes.push(mesh);
}

for (const w of pool) {
  const next = async () => {
    const task = tileQueue.shift();
    if (!task) return;
    const buf = (await packs[task.pack]).slice(task.offset, task.offset + task.length);
    w.postMessage({ buf, id: task.file }, [buf]);
  };
  w.onmessage = ({ data }) => {
    addTile(data);
    loaded++;
    progressEl.textContent = Math.round(100 * loaded / tileQueue.length);
    if (loaded >= tileQueue.length) loading.hidden = true;
    next();
  };
  next();
}

// ---------- Gondola ----------
const boatGroup = new THREE.Group();
scene.add(boatGroup);
const hullGeo = new THREE.BoxGeometry(0.8, 0.35, 2.4);
hullGeo.translate(0, 0.18, 0);
const hull = new THREE.Mesh(hullGeo, new THREE.MeshLambertMaterial({ color: 0x2c2f2a }));
boatGroup.add(hull);
const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.9), new THREE.MeshLambertMaterial({ color: 0x5f625c }));
cabin.position.set(0, 0.55, -0.1);
boatGroup.add(cabin);
const fez = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshLambertMaterial({ color: 0xb04f3e }));
fez.position.set(0, 0.85, -0.1);
boatGroup.add(fez);

// ---------- Game state ----------
const player = {
  x: start.x, z: start.z,
  angle: -Math.PI / 2,
  speed: 0,
  maxForward: 26,
  maxBack: 10,
  accel: 45,
  friction: 0.94,
  turnSpeed: 1.8,
};

const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (keys.hasOwnProperty(k)) { keys[k] = true; e.preventDefault(); }
});
addEventListener('keyup', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (keys.hasOwnProperty(k)) keys[k] = false;
});

let touchId = null;
addEventListener('touchstart', e => { touchId = e.touches[0].identifier; updateTouch(e.touches[0]); }, { passive: true });
addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === touchId) updateTouch(t); }, { passive: true });
addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === touchId) { touchId = null; Object.keys(keys).forEach(k => keys[k] = false); } }, { passive: true });
function updateTouch(t) {
  const cx = innerWidth / 2, cy = innerHeight / 2;
  const dx = t.clientX - cx, dy = t.clientY - cy;
  keys.ArrowUp = dy < -30; keys.ArrowDown = dy > 30;
  keys.ArrowLeft = dx < -30; keys.ArrowRight = dx > 30;
}

// Water mask for collision (reuse 400x280)
const MASK_W = 400, MASK_H = 280;
let maskData = null;
const maskImg = new Image();
fetch('img/water-mask-400.b64.txt')
  .then(r => r.text())
  .then(dataUrl => { maskImg.src = dataUrl; });
maskImg.onload = () => {
  const c = document.createElement('canvas');
  c.width = MASK_W; c.height = MASK_H;
  const x = c.getContext('2d');
  x.drawImage(maskImg, 0, 0);
  maskData = x.getImageData(0, 0, MASK_W, MASK_H).data;
  spawnLions();
};

function isWater(x, z) {
  if (!maskData) return true;
  const mx = Math.floor((x - WORLD.XMIN) / WORLD.W * MASK_W);
  const my = Math.floor((WORLD.ZMAX - z) / WORLD.H * MASK_H);
  if (mx < 0 || mx >= MASK_W || my < 0 || my >= MASK_H) return false;
  return maskData[(my * MASK_W + mx) * 4] > 128;
}

// Lions
const LION_COUNT = 12;
let lions = [];
const lionGeo = new THREE.SphereGeometry(0.35, 16, 16);
const lionMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
function spawnLions() {
  lions.forEach(l => scene.remove(l.mesh));
  lions = [];
  for (let i = 0; i < LION_COUNT; i++) {
    let p = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const mx = Math.floor(Math.random() * MASK_W);
      const my = Math.floor(Math.random() * MASK_H);
      if (maskData[(my * MASK_W + mx) * 4] > 128) {
        const x = WORLD.XMIN + (mx + 0.5) / MASK_W * WORLD.W;
        const z = WORLD.ZMAX - (my + 0.5) / MASK_H * WORLD.H;
        if (Math.hypot(x - player.x, z - player.z) > 200 + i * 60) { p = { x, z }; break; }
      }
    }
    const mesh = new THREE.Mesh(lionGeo, lionMat);
    mesh.position.set(p ? p.x : player.x, 0.5, p ? p.z : player.z);
    scene.add(mesh);
    lions.push({ x: mesh.position.x, z: mesh.position.z, mesh, collected: false });
  }
  totalEl.textContent = LION_COUNT;
  scoreEl.textContent = 0;
}

function resetGame() {
  player.x = start.x; player.z = start.z; player.angle = -Math.PI / 2; player.speed = 0;
  winEl.classList.remove('show');
  spawnLions();
}
restartBtn.addEventListener('click', resetGame);

// ---------- Loop ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const up = keys.ArrowUp || keys.w;
  const down = keys.ArrowDown || keys.s;
  const left = keys.ArrowLeft || keys.a;
  const right = keys.ArrowRight || keys.d;

  if (left) player.angle += player.turnSpeed * dt;
  if (right) player.angle -= player.turnSpeed * dt;

  if (up) player.speed += player.accel * dt;
  else if (down) player.speed -= player.accel * dt;
  else player.speed *= player.friction;
  player.speed = Math.max(-player.maxBack, Math.min(player.maxForward, player.speed));
  if (Math.abs(player.speed) < 0.3 && !up && !down) player.speed = 0;

  const nx = player.x + Math.sin(player.angle) * player.speed * dt;
  const nz = player.z + Math.cos(player.angle) * player.speed * dt;
  if (isWater(nx, nz)) {
    player.x = nx; player.z = nz;
  } else {
    player.speed *= -0.25;
  }

  lions.forEach(l => {
    if (l.collected) return;
    if (Math.hypot(l.x - player.x, l.z - player.z) < 1.2) {
      l.collected = true;
      scene.remove(l.mesh);
    }
  });
  const collected = lions.filter(l => l.collected).length;
  scoreEl.textContent = collected;
  if (collected === LION_COUNT) winEl.classList.add('show');

  // Boat transform
  boatGroup.position.set(player.x, 0, player.z);
  boatGroup.rotation.y = player.angle;

  // Camera: behind and slightly above boat, looking up at buildings
  const camDist = 8;
  const camHeight = 1.6;
  const cx = player.x - Math.sin(player.angle) * camDist;
  const cz = player.z - Math.cos(player.angle) * camDist;
  camera.position.set(cx, camHeight, cz);
  // look forward and upward
  const lookX = player.x + Math.sin(player.angle) * 18;
  const lookZ = player.z + Math.cos(player.angle) * 18;
  camera.lookAt(lookX, 22, lookZ);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
