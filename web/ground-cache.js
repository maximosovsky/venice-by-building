import * as THREE from './vendor/three.module.js';
// Exact original ShapeGeometry and chamfer field, shared by generator and fallback.
export function polygonGeometry(buf) {
  const [nPoly, nRing, nVert] = new Uint32Array(buf, 0, 3);
  const ringStart = new Uint32Array(buf, 12, nPoly + 1);
  const vertStart = new Uint32Array(buf, 12 + 4 * (nPoly + 1), nRing + 1);
  const xz = new Float32Array(buf, 12 + 4 * (nPoly + 1) + 4 * (nRing + 1), 2 * nVert);
  const ring = r => {
    const pts = [];
    for (let v = vertStart[r]; v < vertStart[r + 1]; v++) pts.push(new THREE.Vector2(xz[2 * v], -xz[2 * v + 1]));
    return pts;
  };
  const shapes = [];
  for (let p = 0; p < nPoly; p++) {
    const shape = new THREE.Shape(ring(ringStart[p]));
    for (let r = ringStart[p] + 1; r < ringStart[p + 1]; r++) shape.holes.push(new THREE.Path(ring(r)));
    shapes.push(shape);
  }
  const g = new THREE.ShapeGeometry(shapes);
  g.rotateX(-Math.PI / 2);
  return g;
}
export function edgeField(contextGeo, attrBuf, config) {
  const attrs = new DataView(attrBuf);
  contextGeo.computeBoundingBox();
  const g = contextGeo.boundingBox, cell = 50;
  const W = Math.ceil((g.max.x - g.min.x) / cell) + 1, H = Math.ceil((g.max.z - g.min.z) / cell) + 1;
  const d = new Float32Array(W * H).fill(1e6);
  const [ox, oz] = [config.attrFields.x[0], config.attrFields.z[0]];
  for (let o = 0; o < attrBuf.byteLength; o += config.attrStride) {
    const i = Math.round((attrs.getFloat32(o + ox, true) - g.min.x) / cell), j = Math.round((attrs.getFloat32(o + oz, true) - g.min.z) / cell);
    if (i >= 0 && i < W && j >= 0 && j < H) d[j * W + i] = 0;
  }
  // Two chamfer passes (straight steps of one cell, diagonal ones of 1.414), then a box blur to soften the steps.
  const pass = (dirs, ys, xs) => { for (const y of ys) for (const x of xs) { let v = d[y * W + x];
    for (const [dx, dy, w] of dirs) { const X = x + dx, Y = y + dy; if (X >= 0 && X < W && Y >= 0 && Y < H) v = Math.min(v, d[Y * W + X] + w); }
    d[y * W + x] = v; } };
  const range = (n, back) => Array.from({ length: n }, (_, k) => back ? n - 1 - k : k);
  pass([[-1, 0, 1], [0, -1, 1], [-1, -1, 1.414], [1, -1, 1.414]], range(H), range(W));
  pass([[1, 0, 1], [0, 1, 1], [1, 1, 1.414], [-1, 1, 1.414]], range(H, true), range(W, true));
  const bytes = new Uint8Array(W * H), r = 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let sum = 0, n = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && X < W && Y >= 0 && Y < H) { sum += d[Y * W + X]; n++; } }
    bytes[y * W + x] = Math.min(255, Math.round(sum / n * cell / 10));
  }
  return { bytes, width: W, height: H, min: [g.min.x, g.min.z], size: [(W - 1) * cell, (H - 1) * cell] };
}

const TYPES = { Float32Array, Uint16Array, Uint32Array, Uint8Array };
export function encodeGround({geos, edge, inputs}) {
  const chunks = [], metadata = { version: 1, inputs, geos: {}, edge: { ...edge, bytes: null } };
  let offset = 0;
  const add = (array, itemSize) => {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    const entry = { offset, bytes: bytes.length, type: array.constructor.name, itemSize };
    chunks.push(bytes); offset += bytes.length;
    const pad = (4 - offset % 4) % 4; if (pad) { chunks.push(new Uint8Array(pad)); offset += pad; }
    return entry;
  };
  for (const [name, geo] of Object.entries(geos)) {
    const entry = metadata.geos[name] = { index: add(geo.index.array, 1), attributes: {} };
    for (const [key, attr] of Object.entries(geo.attributes)) entry.attributes[key] = add(attr.array, attr.itemSize);
  }
  metadata.edge.bytes = add(edge.bytes, 1);
  const header = new TextEncoder().encode(JSON.stringify(metadata));
  const start = 8 + Math.ceil(header.length / 4) * 4;
  const output = new Uint8Array(start + offset);
  new DataView(output.buffer).setUint32(0, 0x31434756, true);
  new DataView(output.buffer).setUint32(4, header.length, true);
  output.set(header, 8);let at = start;for(const chunk of chunks) {output.set(chunk, at);at += chunk.length;}
  return output.buffer;
}
export function decodeGround(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x31434756) throw new Error('Unknown ground cache');
  const length = view.getUint32(4, true), start = 8 + Math.ceil(length / 4) * 4;
  const metadata = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 8, length)));
  if (metadata.version !== 1) throw new Error('Unknown ground cache version');
  const read = entry => {
    const Type = TYPES[entry.type];
    if (!Type || entry.bytes % Type.BYTES_PER_ELEMENT || entry.offset < 0 || start + entry.offset + entry.bytes > buffer.byteLength) throw new Error('Invalid ground array');
    return new Type(buffer, start + entry.offset, entry.bytes / Type.BYTES_PER_ELEMENT);
  };
  const geos = {};
  for(const [name, entry] of Object.entries(metadata.geos)) {
    const geo = geos[name] = new THREE.BufferGeometry();geo.setIndex(new THREE.BufferAttribute(read(entry.index), 1));
    for(const [key, attr] of Object.entries(entry.attributes)) geo.setAttribute(key, new THREE.BufferAttribute(read(attr), attr.itemSize));
  }
  const edge = { ...metadata.edge, bytes: read(metadata.edge.bytes) };
  if(edge.bytes.length !== edge.width * edge.height || !['land','water','context'].every(n => geos[n]?.attributes.position && geos[n]?.index)) throw new Error('Incomplete ground cache');
  return {geos, edge, inputs: metadata.inputs};
}
export function validateGround(cache, inputs) {
  return Object.keys(inputs).length === Object.keys(cache.inputs).length && Object.entries(inputs).every(([key, value]) => cache.inputs[key] === value);
}
export async function fingerprint(buffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), b => b.toString(16).padStart(2, '0')).join('');
}
export function edgeUniforms(edge) {
  const tex = new THREE.DataTexture(edge.bytes, edge.width, edge.height, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;tex.needsUpdate = true;
  return {uEdge: {value: tex}, uEdgeMin: {value: new THREE.Vector2(...edge.min)}, uEdgeSize: {value: new THREE.Vector2(...edge.size)}};
}
