// Gondola turbo game: arrow keys to drive, collect golden lions in the Venice canals.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const winEl = document.getElementById('win');
const restartBtn = document.getElementById('restart');

// World bounds (local Venice coords, metres)
const XMIN = -2500, XMAX = 17000;
const ZMIN = -9000, ZMAX = 2200;
const WORLD_W = XMAX - XMIN;
const WORLD_H = ZMAX - ZMIN;

// Collision mask: 200x140 PNG, black=land, white=water
const MASK_W = 200, MASK_H = 140;
const maskImg = new Image();
maskImg.src = 'data:image/png;base64,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';
let maskData = null;

// Canal map background image
const mapImg = new Image();
mapImg.src = 'img/venice-canals-map-small.png';

// Viewport scale: world metres per screen pixel
let scale = 1;

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  scale = Math.max(WORLD_W / innerWidth, WORLD_H / innerHeight) * 1.05;
}
addEventListener('resize', resize);
resize();

// Gondola state
const boat = {
  x: 600,
  z: -1500,
  angle: -Math.PI / 2,
  speed: 0,
  maxSpeed: 360,
  accel: 420,
  friction: 0.92,
  turnSpeed: 2.6,
  radius: 55,
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

// Touch controls for mobile
let touchId = null;
addEventListener('touchstart', e => { touchId = e.touches[0].identifier; updateTouch(e.touches[0]); }, { passive: true });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) if (t.identifier === touchId) updateTouch(t);
}, { passive: true });
addEventListener('touchend', e => {
  for (const t of e.changedTouches) if (t.identifier === touchId) { touchId = null; Object.keys(keys).forEach(k => keys[k] = false); }
}, { passive: true });
function updateTouch(t) {
  const cx = innerWidth / 2, cy = innerHeight / 2;
  const dx = t.clientX - cx, dy = t.clientY - cy;
  keys.ArrowUp = dy < -30; keys.ArrowDown = dy > 30;
  keys.ArrowLeft = dx < -30; keys.ArrowRight = dx > 30;
}

// Golden lions
const LION_COUNT = 12;
let lions = [];

function worldToMask(x, z) {
  const mx = Math.floor((x - XMIN) / WORLD_W * MASK_W);
  const my = Math.floor((ZMAX - z) / WORLD_H * MASK_H);
  return { mx, my };
}

function isWater(x, z) {
  const { mx, my } = worldToMask(x, z);
  if (mx < 0 || mx >= MASK_W || my < 0 || my >= MASK_H) return false;
  const i = (my * MASK_W + mx) * 4;
  return maskData[i] > 128;
}

function findWaterPoint() {
  let best = null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const x = XMIN + Math.random() * WORLD_W;
    const z = ZMIN + Math.random() * WORLD_H;
    if (isWater(x, z)) {
      const d = Math.hypot(x - boat.x, z - boat.z);
      if (!best || d > 300) best = { x, z };
      if (d > 1400) return best;
    }
  }
  return best || { x: boat.x, z: boat.z };
}

function spawnLions() {
  lions = [];
  for (let i = 0; i < LION_COUNT; i++) {
    const p = findWaterPoint();
    lions.push({ x: p.x, z: p.z, collected: false, pulse: Math.random() * Math.PI * 2 });
  }
  totalEl.textContent = LION_COUNT;
  scoreEl.textContent = 0;
}

function resetGame() {
  boat.x = 600; boat.z = -1500; boat.angle = -Math.PI / 2; boat.speed = 0;
  winEl.classList.remove('show');
  spawnLions();
}

function startWhenReady() {
  if (!maskData || !mapImg.complete) return requestAnimationFrame(startWhenReady);
  resetGame();
  last = performance.now();
  requestAnimationFrame(loop);
}

maskImg.onload = () => {
  const mcan = document.createElement('canvas');
  mcan.width = MASK_W; mcan.height = MASK_H;
  const mctx = mcan.getContext('2d');
  mctx.drawImage(maskImg, 0, 0);
  maskData = mctx.getImageData(0, 0, MASK_W, MASK_H).data;
  startWhenReady();
};

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const up = keys.ArrowUp || keys.w;
  const down = keys.ArrowDown || keys.s;
  const left = keys.ArrowLeft || keys.a;
  const right = keys.ArrowRight || keys.d;

  document.querySelectorAll('#keys i').forEach(el => {
    el.classList.toggle('pressed', keys[el.dataset.key]);
  });

  if (Math.abs(boat.speed) > 5) {
    const dir = Math.sign(boat.speed);
    if (left) boat.angle += dir * boat.turnSpeed * dt;
    if (right) boat.angle -= dir * boat.turnSpeed * dt;
  }

  if (up) boat.speed += boat.accel * dt;
  if (down) boat.speed -= boat.accel * dt;
  boat.speed *= boat.friction;
  boat.speed = Math.max(-boat.maxSpeed * 0.5, Math.min(boat.maxSpeed, boat.speed));

  const nx = boat.x + Math.sin(boat.angle) * boat.speed * dt;
  const nz = boat.z + Math.cos(boat.angle) * boat.speed * dt;

  let blocked = false;
  const probes = [
    { dx: 0, dz: 0 },
    { dx: Math.sin(boat.angle + 0.55) * 34, dz: Math.cos(boat.angle + 0.55) * 34 },
    { dx: Math.sin(boat.angle - 0.55) * 34, dz: Math.cos(boat.angle - 0.55) * 34 }
  ];
  for (const pr of probes) {
    if (!isWater(nx + pr.dx, nz + pr.dz)) { blocked = true; break; }
  }
  if (!blocked) {
    boat.x = nx; boat.z = nz;
  } else {
    boat.speed *= -0.25;
  }

  let collected = 0;
  lions.forEach(l => {
    if (l.collected) { collected++; return; }
    l.pulse += dt * 4;
    if (Math.hypot(l.x - boat.x, l.z - boat.z) < boat.radius + 38) {
      l.collected = true;
    }
  });
  collected = lions.filter(l => l.collected).length;
  scoreEl.textContent = collected;
  if (collected === LION_COUNT) winEl.classList.add('show');

  draw();
  requestAnimationFrame(loop);
}

function draw() {
  const W = canvas.width / devicePixelRatio;
  const H = canvas.height / devicePixelRatio;
  ctx.fillStyle = '#f3f0ea';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(1 / scale, 1 / scale);
  ctx.translate(-boat.x, -boat.z);

  // Canal map
  ctx.drawImage(mapImg, XMIN, ZMIN, WORLD_W, WORLD_H);

  // Grid overlay
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(XMIN / 500) * 500; x <= XMAX; x += 500) {
    ctx.moveTo(x, ZMIN); ctx.lineTo(x, ZMAX);
  }
  for (let z = Math.floor(ZMIN / 500) * 500; z <= ZMAX; z += 500) {
    ctx.moveTo(XMIN, z); ctx.lineTo(XMAX, z);
  }
  ctx.stroke();

  // Lions
  lions.forEach(l => {
    if (l.collected) return;
    const r = 32 + Math.sin(l.pulse) * 4;
    ctx.save();
    ctx.translate(l.x, l.z);
    ctx.fillStyle = 'rgba(212,175,55,.28)';
    ctx.beginPath(); ctx.arc(0, 0, r + 12, 0, Math.PI * 2); ctx.fill();
    ctx.font = '36px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🦁', 0, 4);
    ctx.restore();
  });

  // Gondola
  ctx.save();
  ctx.translate(boat.x, boat.z);
  ctx.rotate(boat.angle);
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 28); ctx.lineTo(0, 28 + Math.abs(boat.speed) * 0.16);
  ctx.stroke();
  ctx.fillStyle = '#2c2f2a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5f625c';
  ctx.fillRect(-8, -10, 16, 22);
  ctx.fillStyle = '#b04f3e';
  ctx.beginPath(); ctx.arc(0, -2, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

restartBtn.addEventListener('click', resetGame);
