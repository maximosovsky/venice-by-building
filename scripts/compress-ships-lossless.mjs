#!/usr/bin/env node
/** Lossless EXT_meshopt_compression over original v2 buffer views.
 * No quantization, reorder, simplification, filters, material or JSON rewriting.
 * npm install --prefix <scratch>/venice-ship-converter --save-exact meshoptimizer@1.3.0
 * node scripts/compress-ships-lossless.mjs [--deps <scratch>/venice-ship-converter]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),index=args.indexOf('--deps');
const deps=index<0?'C:/Users/1/AppData/Local/hermes/cache/scratch/venice-ship-converter':args[index+1];
const require=createRequire(path.join(deps,'package.json'));
const pkg=JSON.parse(await fs.readFile(path.join(deps,'node_modules/meshoptimizer/package.json')));if(pkg.version!=='1.3.0')throw new Error('Requires meshoptimizer@1.3.0');
const {MeshoptEncoder}=await import(pathToFileURL(require.resolve('meshoptimizer')));await MeshoptEncoder.ready;
const root=new URL('../',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex'),report={toolchain:{meshoptimizer:'1.3.0'},settings:{mode:'ATTRIBUTES',filter:'NONE',quantization:false,reorder:false,simplification:false,notes:'Compress complete raw buffer views including padding. Index views use 4-byte attribute codec: exact bytes/order preserved, no triangle codec rotation.'},models:[]};
await fs.mkdir(new URL('web/assets/',root),{recursive:true});
for(const name of ['mini_pirate_ship_light_v2','ship_r_optimized_light_v2','aleksandr_optimized_light_v2']) {
 const source=name+'.glb',src=await fs.readFile(new URL('web/models/'+source,root));
 const jlen=src.readUInt32LE(12),json=JSON.parse(src.toString('utf8',20,20+jlen)),bin=src.subarray(28+jlen);
 if(json.buffers.length!==1||json.buffers[0].uri||json.extensionsRequired?.length)throw new Error('Unsupported source buffers/extensions');
 const chunks=[];let offset=0;
 for(const view of json.bufferViews) {
  let mode=view.target===34963?'INDICES':'ATTRIBUTES';
  const component=json.accessors.find(a=>a.bufferView===json.bufferViews.indexOf(view))?.componentType;
  let stride=mode==='INDICES'?(component===5123?2:4):view.byteStride||4;if(view.byteLength%stride)throw new Error('Buffer view not losslessly aligned');
  const data=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
  let encoded=MeshoptEncoder.encodeGltfBuffer(data,data.length/stride,stride,mode,0);
  if(mode==='INDICES' && data.length%4===0) {
    const alternative=MeshoptEncoder.encodeGltfBuffer(data,data.length/4,4,'ATTRIBUTES',0);
    if(alternative.length<encoded.length){encoded=alternative;stride=4;mode='ATTRIBUTES';}
  }
  view.buffer=1;view.extensions={...view.extensions,EXT_meshopt_compression:{buffer:0,byteOffset:offset,byteLength:encoded.length,byteStride:stride,count:data.length/stride,mode,filter:'NONE'}};
  chunks.push(Buffer.from(encoded));offset+=encoded.length;const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}
 }
 json.buffers=[{byteLength:offset},{byteLength:json.buffers[0].byteLength,extensions:{EXT_meshopt_compression:{fallback:true}}}];
 json.extensionsUsed=[...(json.extensionsUsed||[]),'EXT_meshopt_compression'];json.extensionsRequired=['EXT_meshopt_compression'];
 let text=Buffer.from(JSON.stringify(json));text=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]);
 const body=Buffer.concat(chunks),out=Buffer.alloc(12+8+text.length+8+body.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(text.length,12);out.writeUInt32LE(0x4e4f534a,16);text.copy(out,20);out.writeUInt32LE(body.length,20+text.length);out.writeUInt32LE(0x004e4942,24+text.length);body.copy(out,28+text.length);
 const sha=hash(out),url=`assets/${name}_meshopt.${sha}.glb`;await fs.writeFile(new URL('web/'+url,root),out);
 if(hash(await fs.readFile(new URL('web/models/'+source,root)))!==hash(src))throw new Error('Source changed');
 report.models.push({source,sourceSha256:hash(src),beforeBytes:src.length,url,sha256:sha,afterBytes:out.length,bufferViews:json.bufferViews.length});console.log(`${source}: ${src.length} -> ${out.length} bytes`);
}
report.beforeBytes=report.models.reduce((s,m)=>s+m.beforeBytes,0);report.afterBytes=report.models.reduce((s,m)=>s+m.afterBytes,0);
await fs.writeFile(new URL('reports/performance-ships.json',root),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(new URL('web/ship-assets.js',root),'// Generated lossless derivatives; originals/v2 are immutable.\nexport const SHIP_ASSETS = '+JSON.stringify(Object.fromEntries(report.models.map(m=>[m.source,m.url])),null,2)+';\n');
