import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
import * as THREE from '../web/vendor/three.module.js';
const root=new URL('../',import.meta.url);
const original=execFileSync('git',['show','bccbbaa88898e0a8eb989f6b47c3674fb7843282:web/app.js'],{cwd:root,encoding:'utf8',maxBuffer:300000});
const raw=async n=>{let b=await fs.readFile(new URL('web/data/'+n,root));if(b[0]===31&&b[1]===139)b=gunzipSync(b);return b.buffer.slice(b.byteOffset,b.byteOffset+b.length);};
assert.equal(await fs.access(new URL('web/ground-cache.js',root)).then(()=>true,()=>false),true,'precomputed ground implementation must exist');
const {polygonGeometry,edgeField,encodeGround,decodeGround,validateGround}=await import('../web/ground-cache.js');
const config=JSON.parse(await fs.readFile(new URL('web/data/venezia.json',root)));const attrBuf=await raw('attrs.bin');
const sandbox={THREE,Uint32Array,Float32Array,Uint8Array,DataView,Math,Array,config,attrBuf,attrs:new DataView(attrBuf),fetchBin:raw};
vm.createContext(sandbox);
const polygon=original.slice(original.indexOf('async function loadPolygons('),original.indexOf('const flat ='));
vm.runInContext(polygon,sandbox);
const geos={};for(const n of ['land','water','context']) {const b=await raw(n+'.bin');const ref=await sandbox.loadPolygons(n+'.bin');const g=polygonGeometry(b);geos[n]=g;assert.deepEqual(g.index.array,ref.index.array,n+' indices');for(const key of Object.keys(ref.attributes))assert.deepEqual(g.attributes[key].array,ref.attributes[key].array,n+' '+key);}
sandbox.contextGeo=geos.context;
vm.runInContext(original.slice(original.indexOf('const EDGE = (() =>'),original.indexOf('const EDGE_GLSL ='))+'globalThis.expected=EDGE;',sandbox);
const edge=edgeField(geos.context,attrBuf,config);assert.deepEqual(edge.bytes,sandbox.expected.uEdge.value.image.data);assert.deepEqual(edge.min,sandbox.expected.uEdgeMin.value.toArray());assert.deepEqual(edge.size,sandbox.expected.uEdgeSize.value.toArray());
const cache={geos,edge,inputs:{test:'fingerprint'}};const decoded=decodeGround(encodeGround(cache));assert.equal(validateGround(decoded,{test:'fingerprint'}),true);assert.equal(validateGround(decoded,{test:'stale'}),false);
for(const n of Object.keys(geos)) {assert.deepEqual(decoded.geos[n].index.array,geos[n].index.array);for(const key of Object.keys(geos[n].attributes))assert.deepEqual(decoded.geos[n].attributes[key].array,geos[n].attributes[key].array);}
assert.deepEqual(decoded.edge,edge);assert.throws(()=>decodeGround(new ArrayBuffer(4)));console.log('PASS all ground indices/position/normal/uv, exact EDGE bytes/min/size, roundtrip, stale and corrupt fallback');
