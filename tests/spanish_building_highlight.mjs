import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {installChurchBuildingHighlight} from '../web/church-building-highlight.js';
const tile={pos:new Int16Array([0,0,0,30,0,0,0,90,0,0,100,0,30,100,0,0,120,30,80,0,0,90,0,0,80,80,0]),bld:new Uint16Array([0,0,0,32768,32768,32768,1,1,1]),idx:new Uint32Array([0,1,2,3,4,5,6,7,8]),attr:new Float32Array([0,0,0,4756,0,0,0,0,0,0,0,4521,0,0,0,0]),nB:2};
const manifest={version:1,buildings:[{gid:4756,qid:'Q2897799',highlight_color:'#000080'},{gid:4521,qid:'Q28035407',highlight_color:'#000080'}]};
const h=installChurchBuildingHighlight({THREE,fetchData:async()=>({ok:true,json:async()=>manifest})});
h.registerTile(tile,new THREE.Mesh());await h.load();h.setSourceVisible('church',true);
assert.equal(h.overlays.length,1,'same-color hosts share one exclusive overlay');
assert.equal(h.overlays[0].material.color.getHexString(),'000080');
assert.equal(h.overlays[0].geometry.index.count,9,'every wall and shaped roof triangle copied');
assert.deepEqual([...h.overlays[0].geometry.attributes.position.array],[...tile.pos]);
assert.deepEqual(h.overlays[0].userData.gids,[4756,4521]);h.dispose();
for(const color of ['navy','#12345g','url(x)',null]){
 const invalid=installChurchBuildingHighlight({THREE,fetchData:async()=>({ok:true,json:async()=>({version:1,buildings:[{gid:4756,qid:'Q2897799',highlight_color:color}]})})});
 invalid.registerTile(tile,new THREE.Mesh());await invalid.load();assert.equal(invalid.manifest,null,'reject unsafe/invalid color');assert.match(invalid.error,/Invalid/);invalid.dispose();
}
console.log('Spanish + Canton exclusive navy full geometry and safe color validation PASS');
