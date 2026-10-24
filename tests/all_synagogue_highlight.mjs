import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {installChurchBuildingHighlight} from '../web/church-building-highlight.js';
const manifest={version:1,buildings:[{gid:4521,qid:'Q28035407',highlight_color:'#2f3f6b',highlight_shading:'atlas_age',identities:[{qid:'Q28035407'},{qid:'Q65015'},{qid:'Q12051106'}]}]};
const h=installChurchBuildingHighlight({THREE,fetchData:async()=>({ok:true,json:async()=>manifest})});
const parent=new THREE.Group();
h.registerTile({nB:1,attr:new Float32Array([1532,0,5,4521,0,0,0,0]),bld:new Uint16Array([0,0,32768]),pos:new Int16Array([0,0,0,10,136,0,0,136,10]),idx:new Uint16Array([0,1,2])},parent);await h.load();
const m=h.overlays[0];assert.ok(m.material.isShaderMaterial,'special volumes must use actual Age shader shading, not flat navy');assert.equal(m.material.uniforms.uColor.value.getHexString(),'2f3f6b');assert.ok(m.material.fragmentShader.includes('0.66 + 0.34 * sun'));assert.ok(m.geometry.getAttribute('shaped'));assert.deepEqual([...m.geometry.getAttribute('shaped').array],[0,0,1]);assert.deepEqual(m.userData.identities.map(i=>i.qid),['Q28035407','Q65015','Q12051106']);h.dispose();console.log('actual Age shading and shared identity metadata: PASS');
