import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {MeshoptDecoder} from '../web/vendor/meshopt_decoder.module.js';
await MeshoptDecoder.ready;
const reportURL=new URL('../reports/performance-ships.json',import.meta.url);
assert.equal(await fs.access(reportURL).then(()=>true,()=>false),true,'lossless derivatives report must exist');
const report=JSON.parse(await fs.readFile(reportURL));
let before=0,after=0;
for(const model of report.models) {
 const src=await fs.readFile(new URL('../web/models/'+model.source,import.meta.url)),dst=await fs.readFile(new URL('../web/'+model.url,import.meta.url));
 const parse=b=>{const len=b.readUInt32LE(12),j=JSON.parse(b.toString('utf8',20,20+len));return {j,bin:b.subarray(28+len)};};
 const a=parse(src),b=parse(dst);assert.equal(createHash('sha256').update(src).digest('hex'),model.sourceSha256);assert.equal(createHash('sha256').update(dst).digest('hex'),model.sha256);assert.match(model.url,new RegExp(model.sha256));
 for(const key of ['asset','extras','nodes','scenes','scene','meshes','accessors','materials','skins','animations','images','textures','samplers'])assert.deepEqual(b.j[key],a.j[key],key+' must be preserved');
 assert(b.j.extensionsRequired.includes('EXT_meshopt_compression'));
 assert.equal(b.j.bufferViews.length,a.j.bufferViews.length);
 for(let i=0;i<a.j.bufferViews.length;i++) {
  const av=a.j.bufferViews[i],bv=b.j.bufferViews[i],ext=bv.extensions?.EXT_meshopt_compression;assert(ext,'every view compressed');assert.equal(ext.filter,'NONE');
  const decoded=new Uint8Array(ext.count*ext.byteStride);MeshoptDecoder.decodeGltfBuffer(decoded,ext.count,ext.byteStride,b.bin.subarray(ext.byteOffset,ext.byteOffset+ext.byteLength),ext.mode,ext.filter);
  assert.deepEqual(Buffer.from(decoded),a.bin.subarray(av.byteOffset||0,(av.byteOffset||0)+av.byteLength),'byte-exact decoded view '+i);
 }
 assert(dst.length<src.length*.85,'at least 15% lossless byte reduction per model');before+=src.length;after+=dst.length;
}
assert.equal(report.models.length,3);console.log('PASS all raw decoded buffer views, indices, attributes, rigging, nodes, materials, attribution: '+before+' -> '+after+' bytes');
