// Runs the viewer's own worker code over the exported data, in Node.
//
// web/worker.js turns one tile into a mesh; this harness feeds it a real tile from a real pack
// and checks the geometry it hands back, so a layout mismatch between pipeline and viewer fails here
// instead of on the user's screen.
//
// Run:  node tests/worker_smoke.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = process.env.VENICE_DATA || path.join(root, 'web', 'data');

// worker.js ends with `self.onmessage = ...`; give it a self to attach to and a postMessage to capture
let received = null;
globalThis.self = { onmessage: null, postMessage: (msg) => { received = msg; } };
await import(pathToFileURL(path.join(root, 'web', 'worker.js')).href);
if (typeof self.onmessage !== 'function') {
  console.error('FAIL: worker.js did not install an onmessage handler');
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(path.join(dataDir, 'venezia.json'), 'utf8'));
const pack = cfg.packs[0];
const packBuf = zlib.gunzipSync(fs.readFileSync(path.join(dataDir, pack)));
const tiles = cfg.tiles.filter((t) => t.pack === pack);
console.log(`pack ${pack}: ${tiles.length} tiles, ${packBuf.length} bytes decompressed`);

// ---- where the buildings actually are, from attrs.bin: the frame the vertices must agree with ----
const attrs = zlib.gunzipSync(fs.readFileSync(path.join(dataDir, 'attrs.bin')));
const stride = cfg.attrStride;
const offX = cfg.attrFields.x[0], offZ = cfg.attrFields.z[0];
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (let rec = 0; rec + stride <= attrs.length; rec += stride) {
  const x = attrs.readFloatLE(rec + offX), z = attrs.readFloatLE(rec + offZ);
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
}
console.log(`building centroids span x ${minX.toFixed(0)}..${maxX.toFixed(0)} m, z ${minZ.toFixed(0)}..${maxZ.toFixed(0)} m`);
const margin = 1500;   // a footprint can reach well past its centroid, but not kilometres
let totalVertices = 0, totalTriangles = 0, totalBuildings = 0, totalOutsideWorld = 0, totalDegenerate = 0;
let worst = null;
for (const tile of tiles) {
  const slice = packBuf.subarray(tile.offset, tile.offset + tile.length);
  received = null;
  self.onmessage({ data: { buf: slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength), id: tile.file } });
  if (!received) { console.error(`FAIL: worker returned nothing for ${tile.file}`); process.exit(1); }
  const { pos, bld, idx, attr, nB } = received;
  if (nB !== tile.n) { console.error(`FAIL: ${tile.file} built ${nB} buildings, index says ${tile.n}`); process.exit(1); }
  if (pos.length === 0 || idx.length === 0) { console.error(`FAIL: ${tile.file} produced empty geometry`); process.exit(1); }
  if (idx.length % 3 !== 0) { console.error(`FAIL: ${tile.file} index count is not a multiple of three`); process.exit(1); }
  if (attr.length !== nB * 8) { console.error(`FAIL: ${tile.file} attribute texture holds ${attr.length}, expected ${nB * 8}`); process.exit(1); }
  const maxIndex = idx.reduce((m, v) => Math.max(m, v), 0);
  if (maxIndex >= pos.length / 3) { console.error(`FAIL: ${tile.file} triangle index ${maxIndex} is past the vertex array`); process.exit(1); }
  if (bld.length !== pos.length / 3) { console.error(`FAIL: ${tile.file} building ids do not match the vertex count`); process.exit(1); }
  // int16 decimetres: anything past this would wrap, which is what the check is really about
  let overflow = 0, maxAbs = 0, degenerate = 0;
  for (let i = 0; i < pos.length; i++) {
    const a = Math.abs(pos[i]);
    if (a > maxAbs) maxAbs = a;
    if (a > 32767) overflow++;
  }
  for (let t = 0; t < idx.length; t += 3) {
    // a real triangle needs area in three dimensions: walls are vertical and have none in plan
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz === 0) degenerate++;
  }
  // world position = tile origin + vertex, in decimetres; it has to sit where the buildings are
  const ox = tile.tx * cfg.tileSize * 10, oz = tile.tz * cfg.tileSize * 10;
  let outsideWorld = 0;
  for (let i = 0; i < pos.length; i += 3) {
    const wx = (ox + pos[i]) / 10, wz = (oz + pos[i + 2]) / 10;
    if (wx < minX - margin || wx > maxX + margin || wz < minZ - margin || wz > maxZ + margin) outsideWorld++;
  }
  if (worst === null || overflow > worst.overflow) worst = { file: tile.file, overflow, maxAbs, degenerate, outsideWorld };
  totalOutsideWorld += outsideWorld;
  totalDegenerate += degenerate;
  totalVertices += pos.length / 3; totalTriangles += idx.length / 3; totalBuildings += nB;
}
console.log(`built ${totalBuildings} buildings, ${totalVertices} vertices, ${totalTriangles} triangles`);
console.log(`worst tile ${worst.file}: ${worst.overflow} wrapped vertices, max |coord| ${worst.maxAbs} dm, ` +
  `${worst.degenerate} degenerate triangles, ${totalOutsideWorld} vertices outside the city window`);
const degenerateShare = totalDegenerate / (totalTriangles || 1);
if (worst.overflow > 0) { console.error('FAIL: int16 coordinates wrapped'); process.exit(1); }
if (totalOutsideWorld > 0) { console.error('FAIL: geometry lands outside the city window'); process.exit(1); }
if (degenerateShare > 0.05) { console.error(`FAIL: ${(degenerateShare * 100).toFixed(1)}% of triangles are degenerate`); process.exit(1); }
console.log(`worker smoke test passed (degenerate triangles ${(degenerateShare * 100).toFixed(2)}%)`);