#!/usr/bin/env node
/** Texture-free derivatives of the three existing licensed ships; never writes originals.
 * Isolated tooling (no repository dependency changes):
 * npm install --prefix <scratch>/venice-ship-converter --save-exact @gltf-transform/core@4.5.1 @gltf-transform/functions@4.5.1 meshoptimizer@1.3.0
 * node scripts/convert-ships-light.mjs --deps <scratch>/venice-ship-converter [--ratio 0.25] [--error 0.005]
 * Defaults: repository inferred from this script, deps from TMPDIR/venice-ship-converter.
 * Uncompressed float geometry, preserved transforms/names/source extras, no LOD or decoder.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2);
function option(key,fallback){const i=args.indexOf(key);return i<0?fallback:args[i+1];}
const repo=path.resolve(option('--repo',fileURLToPath(new URL('../',import.meta.url))));
const deps=path.resolve(option('--deps',path.join(process.env.TMPDIR||process.env.LOCALAPPDATA||repo,'venice-ship-converter')));
const ratio=Number(option('--ratio','0.25')),error=Number(option('--error','0.005'));
if(!(ratio>0&&ratio<1&&error>0&&error<=.02))throw new Error('Require 0<ratio<1 and 0<error<=0.02 (fraction of mesh radius).');
const require=createRequire(path.join(deps,'package.json'));
async function dependency(name,version){const resolved=require.resolve(name);const mod=await import(pathToFileURL(resolved));const pkg=JSON.parse(await fs.readFile(path.join(deps,'node_modules',name,'package.json')));if(pkg.version!==version)throw new Error(`${name}: expected pinned ${version}, got ${pkg.version}`);return mod;}
const {NodeIO}=await dependency('@gltf-transform/core','4.5.1');
const {weld,simplify,normals,prune,getBounds}=await dependency('@gltf-transform/functions','4.5.1');
const {MeshoptSimplifier}=await dependency('meshoptimizer','1.3.0');
await MeshoptSimplifier.ready;
const io=new NodeIO();
function statistics(bytes){const b=Buffer.from(bytes);const j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));return {bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),triangles:(j.meshes||[]).flatMap(m=>m.primitives).reduce((s,p)=>s+((p.mode??4)===4?j.accessors[p.indices??p.attributes.POSITION].count/3:0),0),lineSegments:(j.meshes||[]).flatMap(m=>m.primitives).reduce((s,p)=>s+(p.mode===1?j.accessors[p.indices??p.attributes.POSITION].count/2:0),0),images:(j.images||[]).length,textures:(j.textures||[]).length,meshes:(j.meshes||[]).length,primitives:(j.meshes||[]).reduce((s,m)=>s+m.primitives.length,0),extensionsRequired:j.extensionsRequired||[],asset:j.asset,rootExtras:j.extras??null};}
const report={toolchain:{'@gltf-transform/core':'4.5.1','@gltf-transform/functions':'4.5.1',meshoptimizer:'1.3.0'},settings:{ratio,error,errorUnits:'fraction of each mesh radius',color:'#b04f3e',baseColorFactor:[176/255,79/255,62/255,1],metallicFactor:0,roughnessFactor:1,doubleSided:true,compression:false,notes:'Palette components intentionally authored directly in linear working space to match atlas ColorManagement.enabled=false / LinearSRGB output.'},models:[]};
for(const name of ['mini_pirate_ship','ship_r_optimized','aleksandr_optimized']){
 const source=name+'.glb',output=name+'_light.glb',sourcePath=path.join(repo,'web/models',source),outputPath=path.join(repo,'web/models',output);
 if(sourcePath===outputPath)throw new Error('Cannot overwrite source');
 const original=await fs.readFile(sourcePath);const before=statistics(original);
 const doc=await io.readBinary(original);before.bounds=getBounds(doc.getRoot().getDefaultScene());
 const materialExtras=doc.getRoot().listMaterials().filter(m=>Object.keys(m.getExtras()).length).map(m=>({name:m.getName(),extras:m.getExtras()}));
 const material=doc.createMaterial('Atlas matte terracotta').setBaseColorFactor(report.settings.baseColorFactor).setMetallicFactor(0).setRoughnessFactor(1).setDoubleSided(true);
 if(materialExtras.length)material.setExtras({sourceMaterials:materialExtras});
 for(const mesh of doc.getRoot().listMeshes())for(const prim of mesh.listPrimitives()){
  if(prim.listTargets().length||prim.getAttribute('JOINTS_0'))throw new Error('Animated/skinned source needs an explicit preservation policy.');
  prim.setMaterial(material);
  // Texture and hard-normal seams otherwise pin most Ship R triangles. Weld
  // position-only topology, then regenerate flat maquette normals after reduction.
  for(const semantic of prim.listSemantics())if(semantic!=='POSITION' && !(name==='mini_pirate_ship' && semantic==='NORMAL'))prim.setAttribute(semantic,null);
 }
 for(const m of doc.getRoot().listMaterials())if(m!==material)m.dispose();
 for(const t of doc.getRoot().listTextures())t.dispose();
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio,error,lockBorder:false}),normals({overwrite:false}),weld(),prune({keepExtras:true,keepLeaves:true,keepAttributes:true}));
 const afterBounds=getBounds(doc.getRoot().getDefaultScene());
 const binary=await io.writeBinary(doc);const after={...statistics(binary),bounds:afterBounds};
 if(after.images||after.textures||after.extensionsRequired.length)throw new Error('Output must be texture/decoder free');
 if(after.triangles>before.triangles*.35)throw new Error(`${source}: simplification insufficient (${after.triangles}/${before.triangles}); inspect topology rather than silently accepting.`);
 if(JSON.stringify(before.asset.extras)!==JSON.stringify(after.asset.extras))throw new Error('Source attribution changed');
 if(createHash('sha256').update(await fs.readFile(sourcePath)).digest('hex')!==before.sha256)throw new Error('Original changed during conversion');
 await fs.writeFile(outputPath,binary);
 report.models.push({source,output,before,after,bytesReductionFraction:1-after.bytes/before.bytes,triangleReductionFraction:1-after.triangles/before.triangles});
 console.log(`${source}: ${before.bytes} -> ${after.bytes} bytes; ${before.triangles} -> ${after.triangles} triangles`);
}
await fs.mkdir(path.join(repo,'reports'),{recursive:true});
await fs.writeFile(path.join(repo,'reports/ships-light.json'),JSON.stringify(report,null,2)+'\n');
