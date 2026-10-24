// Doom-style raycasting gondola game: arrow keys drive, collect golden lions.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const mini = document.getElementById('minimap');
const mctx = mini.getContext('2d', { alpha: false });
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const winEl = document.getElementById('win');
const restartBtn = document.getElementById('restart');

const W = 480, H = 270;
canvas.width = W; canvas.height = H;
canvas.style.width = '100%'; canvas.style.height = '100%';

const XMIN = -2500, XMAX = 17000;
const ZMIN = -9000, ZMAX = 2200;
const WORLD_W = XMAX - XMIN;
const WORLD_H = ZMAX - ZMIN;

const MAP_W = 400, MAP_H = 280;
const CELL_W = WORLD_W / MAP_W;
const CELL_H = WORLD_H / MAP_H;

const maskImg = new Image();
maskImg.src = 'data:image/png;base64,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';
let map = new Uint8Array(MAP_W * MAP_H); // 0 = water, 1 = wall/land
let maskReady = false;
let mapCache = null; // offscreen canvas of static minimap

const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false, w:false, s:false, a:false, d:false };
addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (keys.hasOwnProperty(k)) { keys[k] = true; e.preventDefault(); }
});
addEventListener('keyup', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (keys.hasOwnProperty(k)) keys[k] = false;
});

// Touch controls (left/right virtual joystick halves)
let touchId = null;
addEventListener('touchstart', e => { touchId = e.touches[0].identifier; updateTouch(e.touches[0]); }, { passive:true });
addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === touchId) updateTouch(t); }, { passive:true });
addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === touchId) { touchId = null; Object.keys(keys).forEach(k => keys[k]=false); } }, { passive:true });
function updateTouch(t) {
  const cx = innerWidth / 2, cy = innerHeight / 2;
  const dx = t.clientX - cx, dy = t.clientY - cy;
  keys.ArrowUp = dy < -30; keys.ArrowDown = dy > 30;
  keys.ArrowLeft = dx < -30; keys.ArrowRight = dx > 30;
}

function worldToMap(x, z) {
  return { mx: Math.floor((x - XMIN) / WORLD_W * MAP_W), my: Math.floor((ZMAX - z) / WORLD_H * MAP_H) };
}
function mapAt(mx, my) {
  if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return 1;
  return map[my * MAP_W + mx];
}
function isWaterWorld(x, z) {
  const { mx, my } = worldToMap(x, z);
  return mapAt(mx, my) === 0;
}

// Player
const player = {
  x: 600,
  z: -1500,
  angle: -Math.PI / 2,
  speed: 0,
  maxForward: 1400,
  maxBack: 700,
  accel: 2200,
  friction: 0.96,
  turnSpeed: 2.8,
  radius: 28,
};

const FOV = Math.PI / 2.6;
const HALF_FOV = FOV / 2;

// Lions
const LION_COUNT = 12;
let lions = [];
function findWaterCell(minDist = 0) {
  for (let i = 0; i < 500; i++) {
    const mx = Math.floor(Math.random() * MAP_W);
    const my = Math.floor(Math.random() * MAP_H);
    if (map[my * MAP_W + mx] === 0) {
      const x = XMIN + (mx + 0.5) * CELL_W;
      const z = ZMAX - (my + 0.5) * CELL_H;
      if (Math.hypot(x - player.x, z - player.z) >= minDist) return { x, z, mx, my };
    }
  }
  return null;
}
function spawnLions() {
  lions = [];
  for (let i = 0; i < LION_COUNT; i++) {
    const c = findWaterCell(300 + i * 80);
    lions.push({ x: c ? c.x : player.x, z: c ? c.z : player.z, collected: false, pulse: Math.random() * Math.PI * 2 });
  }
  totalEl.textContent = LION_COUNT;
  scoreEl.textContent = 0;
}
function resetGame() {
  player.x = -354; player.z = -340; player.angle = -Math.PI / 2; player.speed = 0;
  winEl.classList.remove('show');
  spawnLions();
}

maskImg.onload = () => {
  const mcan = document.createElement('canvas');
  mcan.width = MAP_W; mcan.height = MAP_H;
  const mctx = mcan.getContext('2d');
  mctx.drawImage(maskImg, 0, 0, MAP_W, MAP_H);
  const d = mctx.getImageData(0, 0, MAP_W, MAP_H).data;
  for (let i = 0; i < MAP_W * MAP_H; i++) map[i] = d[i * 4] > 128 ? 0 : 1; // white water, black land
  maskReady = true;
  buildMapCache();
  resetGame();
  last = performance.now();
  requestAnimationFrame(loop);
};

let last = performance.now();
function loop(now) {
  if (!maskReady) return requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const up = keys.ArrowUp || keys.w;
  const down = keys.ArrowDown || keys.s;
  const left = keys.ArrowLeft || keys.a;
  const right = keys.ArrowRight || keys.d;

  document.querySelectorAll('#keys i').forEach(el => el.classList.toggle('pressed', keys[el.dataset.key]));

  // Turning
  if (left) player.angle += player.turnSpeed * dt;
  if (right) player.angle -= player.turnSpeed * dt;

  // Acceleration / friction
  if (up) player.speed += player.accel * dt;
  else if (down) player.speed -= player.accel * dt;
  else player.speed *= player.friction;
  const limit = player.speed > 0 ? player.maxForward : player.maxBack;
  player.speed = Math.max(-player.maxBack, Math.min(player.maxForward, player.speed));
  if (Math.abs(player.speed) < 10 && !up && !down) player.speed = 0;

  // Movement with sliding collision (Doom style)
  const moveStep = player.speed * dt;
  const nx = player.x + Math.sin(player.angle) * moveStep;
  const nz = player.z + Math.cos(player.angle) * moveStep;
  // try full move
  if (isWaterWorld(nx, nz) && isWaterWorld(nx + Math.sin(player.angle)*player.radius, nz + Math.cos(player.angle)*player.radius)) {
    player.x = nx; player.z = nz;
  } else {
    // slide along wall: try x only, then z only
    if (isWaterWorld(nx, player.z)) player.x = nx;
    else if (isWaterWorld(player.x, nz)) player.z = nz;
    else player.speed *= -0.3;
  }

  // Collect lions
  lions.forEach(l => {
    if (l.collected) return;
    l.pulse += dt * 5;
    if (Math.hypot(l.x - player.x, l.z - player.z) < player.radius + 38) l.collected = true;
  });
  const collected = lions.filter(l => l.collected).length;
  scoreEl.textContent = collected;
  if (collected === LION_COUNT) winEl.classList.add('show');

  render();
  renderMinimap();
  requestAnimationFrame(loop);
}

function render() {
  // Sky / ceiling
  ctx.fillStyle = '#e9e6df';
  ctx.fillRect(0, 0, W, H / 2);
  // Water floor
  ctx.fillStyle = '#b9d0d2';
  ctx.fillRect(0, H / 2, W, H / 2);

  const dirX = Math.sin(player.angle);
  const dirZ = Math.cos(player.angle);
  const planeX = Math.sin(player.angle + Math.PI / 2) * Math.tan(HALF_FOV);
  const planeZ = Math.cos(player.angle + Math.PI / 2) * Math.tan(HALF_FOV);

  const zBuffer = new Float32Array(W);

  for (let col = 0; col < W; col++) {
    const cameraX = 2 * col / W - 1;
    const rayDirX = dirX + planeX * cameraX;
    const rayDirZ = dirZ + planeZ * cameraX;

    let mapX = Math.floor((player.x - XMIN) / CELL_W);
    let mapY = Math.floor((ZMAX - player.z) / CELL_H);
    const deltaDistX = Math.abs(1 / rayDirX) * CELL_W; // scale to world metres
    const deltaDistZ = Math.abs(1 / rayDirZ) * CELL_H;

    let stepX, stepY, sideDistX, sideDistZ;
    if (rayDirX < 0) { stepX = -1; sideDistX = ((player.x - XMIN) / CELL_W - mapX) * deltaDistX; }
    else { stepX = 1; sideDistX = (mapX + 1 - (player.x - XMIN) / CELL_W) * deltaDistX; }
    if (rayDirZ > 0) { stepY = -1; sideDistZ = (mapY + 1 - (ZMAX - player.z) / CELL_H) * deltaDistZ; }
    else { stepY = 1; sideDistZ = ((ZMAX - player.z) / CELL_H - mapY) * deltaDistZ; }

    let hit = 0, side = 0, perpWallDist = 0;
    for (let i = 0; i < 400; i++) {
      if (sideDistX < sideDistZ) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
      else { sideDistZ += deltaDistZ; mapY += stepY; side = 1; }
      if (mapX < 0 || mapX >= MAP_W || mapY < 0 || mapY >= MAP_H) { hit = 1; break; }
      if (map[mapY * MAP_W + mapX] > 0) { hit = 1; break; }
    }

    if (side === 0) perpWallDist = (mapX - (player.x - XMIN) / CELL_W + (1 - stepX) / 2) * CELL_W / rayDirX;
    else perpWallDist = (mapY - (ZMAX - player.z) / CELL_H + (1 - stepY) / 2) * CELL_H / rayDirZ;
    if (perpWallDist <= 0) perpWallDist = 0.001;
    const perpDist = perpWallDist * Math.cos(cameraX * HALF_FOV);
    zBuffer[col] = perpDist;

    const lineHeight = Math.min(H, H / perpDist * 600);
    const drawStart = Math.max(0, (H - lineHeight) / 2);
    const drawEnd = Math.min(H, drawStart + lineHeight);

    ctx.fillStyle = side === 0 ? '#d8d5ce' : '#c4c1ba';
    ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
  }

  // Sprites
  const invDet = 1 / (planeX * dirZ - dirX * planeZ);
  const sprites = lions.filter(l => !l.collected).map(l => {
    const sx = l.x - player.x, sz = l.z - player.z;
    const tx = invDet * (dirZ * sx - dirX * sz);
    const ty = invDet * (-planeZ * sx + planeX * sz);
    return { ...l, tx, ty };
  }).filter(s => s.ty > 0).sort((a, b) => b.ty - a.ty);

  for (const s of sprites) {
    const screenX = (W / 2) * (1 + s.tx / s.ty);
    const spriteSize = Math.abs(H / s.ty * 250);
    const startX = Math.floor(screenX - spriteSize / 2);
    const endX = Math.floor(screenX + spriteSize / 2);
    for (let x = startX; x < endX; x++) {
      if (x < 0 || x >= W) continue;
      if (zBuffer[x] < s.ty) continue;
      const colWidth = (endX - startX) || 1;
      const slice = (x - startX) / colWidth;
      // draw lion slice as a simple golden disc with vertical bar
      const v = Math.abs(slice - 0.5);
      const yCenter = H / 2 + spriteSize * 0.1;
      const headR = spriteSize * 0.18;
      const bodyH = spriteSize * 0.55;
      const bodyW = spriteSize * 0.22;
      ctx.fillStyle = '#d4af37';
      // head
      if (v < 0.18) ctx.fillRect(x, yCenter - headR, 1, headR * 2);
      // body
      if (v < bodyW / spriteSize / 2) ctx.fillRect(x, yCenter + headR * 0.6, 1, bodyH);
    }
  }
}


function buildMapCache() {
  const mw = mini.width, mh = mini.height;
  mapCache = document.createElement('canvas');
  mapCache.width = mw; mapCache.height = mh;
  const c = mapCache.getContext('2d');
  c.fillStyle = '#f3f0ea';
  c.fillRect(0, 0, mw, mh);
  c.fillStyle = '#b9d0d2';
  const pxPerCellX = mw / MAP_W, pxPerCellY = mh / MAP_H;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y * MAP_W + x] === 0) c.fillRect(x * pxPerCellX, y * pxPerCellY, pxPerCellX + 0.5, pxPerCellY + 0.5);
    }
  }
}

function renderMinimap() {
  const mw = mini.width, mh = mini.height;
  if (mapCache) mctx.drawImage(mapCache, 0, 0);
  else { mctx.fillStyle = '#f3f0ea'; mctx.fillRect(0, 0, mw, mh); }
  // player
  const pmx = (player.x - XMIN) / WORLD_W * mw;
  const pmy = (ZMAX - player.z) / WORLD_H * mh;
  mctx.fillStyle = '#b04f3e';
  mctx.beginPath(); mctx.arc(pmx, pmy, 3, 0, Math.PI * 2); mctx.fill();
  mctx.strokeStyle = '#b04f3e'; mctx.lineWidth = 1.5;
  mctx.beginPath(); mctx.moveTo(pmx, pmy); mctx.lineTo(pmx + Math.sin(player.angle) * 12, pmy - Math.cos(player.angle) * 12); mctx.stroke();
  // lions
  mctx.fillStyle = '#d4af37';
  lions.forEach(l => {
    if (l.collected) return;
    const lx = (l.x - XMIN) / WORLD_W * mw;
    const ly = (ZMAX - l.z) / WORLD_H * mh;
    mctx.beginPath(); mctx.arc(lx, ly, 2, 0, Math.PI * 2); mctx.fill();
  });
}

restartBtn.addEventListener('click', resetGame);
