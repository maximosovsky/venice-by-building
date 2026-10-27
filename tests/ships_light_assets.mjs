import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const names=['mini_pirate_ship','ship_r_optimized','aleksandr_optimized'];
function read(name){const bytes=readFileSync(root+'web/models/'+name+'.glb');assert.equal(bytes.toString('ascii',0,4),'glTF');const j=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));return {bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),j,triangles:(j.meshes||[]).flatMap(m=>m.primitives).reduce((n,p)=>n+((p.mode??4)===4?j.accessors[p.indices??p.attributes.POSITION].count/3:0),0)};}
const reportPath=root+'reports/ships-light.json';
for(const name of names){
 const source=read(name);
 assert.ok(existsSync(root+'web/models/'+name+'_light.glb'),`${name}: lightweight GLB must exist`);
 const light=read(name+'_light');
 assert.ok(light.bytes<source.bytes*.35,`${name}: bytes materially reduced`);
 assert.ok(light.triangles<source.triangles*.35,`${name}: triangles materially reduced`);
 assert.ok(light.triangles>source.triangles*.05,`${name}: preserve geometry, not substitute a primitive`);
 assert.equal((light.j.images||[]).length,0);assert.equal((light.j.textures||[]).length,0);
 assert.equal((light.j.extensionsRequired||[]).length,0,'no required decoder');
 assert.deepEqual(light.j.asset.extras,source.j.asset.extras,'asset source/license extras');
 assert.deepEqual(light.j.extras,source.j.extras,'root source/license extras');
 for(const m of light.j.materials){assert.deepEqual(m.pbrMetallicRoughness.baseColorFactor,[176/255,79/255,62/255,1]);assert.equal(m.pbrMetallicRoughness.metallicFactor,0);assert.equal(m.pbrMetallicRoughness.roughnessFactor??1,1);assert.equal(m.doubleSided,true);assert.ok(!m.extensions?.KHR_materials_unlit);assert.ok(!m.emissiveFactor||m.emissiveFactor.every(v=>v===0));assert.ok(!JSON.stringify(m).includes('Texture'));}
 for(const p of light.j.meshes.flatMap(m=>m.primitives)){assert.deepEqual(Object.keys(p.attributes).sort(),['NORMAL','POSITION']);assert.ok([1,4].includes(p.mode??4),'preserve original triangles / Aleksandr rigging lines');}
 assert.ok(existsSync(reportPath),'programmatic before/after report');
 const entry=JSON.parse(readFileSync(reportPath)).models.find(m=>m.source===name+'.glb');
 assert.equal(entry.before.sha256,source.sha256,'original unchanged since conversion');assert.equal(entry.after.sha256,light.sha256);assert.equal(entry.after.triangles,light.triangles);
 console.log(`${name}: ${source.bytes} -> ${light.bytes} bytes; ${source.triangles} -> ${light.triangles} triangles`);
}
const module=readFileSync(root+'web/ships-model.js','utf8');
for(const name of names)assert.ok(module.includes(`models/${name}_light.glb`),'loader uses lightweight files');
console.log('PASS lightweight geometry, texture-free matte terracotta, provenance, checksums, loader paths');
