// The municipal bridge overlay draws only published geometry and always carries its colour label.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const moduleURL=new URL('../web/bridge-characteristics-map.js',import.meta.url);
const {installBridgeCharacteristics,bridgeMaterialColor,BRIDGE_UI}=await import(moduleURL);

test('material colour is keyed by the municipal code and never guessed from position',()=>{
  assert.equal(bridgeMaterialColor({material:{code:'03',label:'muratura'}}),'#c2703a');
  assert.equal(bridgeMaterialColor({material:{code:'01',label:'pietra'}}),'#3f7fb0');
  assert.equal(bridgeMaterialColor({material:{code:'99',label:'ignoto'}}),'#8a8f98');
  assert.equal(bridgeMaterialColor({}),'#8a8f98');
});
test('every visible label ships in Russian, Italian and English',()=>{
  for(const [key,value] of Object.entries(BRIDGE_UI)){
    for(const language of ['ru','it','en'])assert.ok(typeof value[language]==='string'&&value[language].length>0,`${key}.${language}`);
  }
});

const classStub=()=>class{constructor(...args){this.args=args;this.children=[];this.userData={};this.visible=true;this.renderOrder=0;}
  add(...o){this.children.push(...o);}remove(...o){this.children=this.children.filter(c=>!o.includes(c));}removeFromParent(){}dispose(){}};
const THREE={
  Vector2:class{constructor(x,y){this.x=x;this.y=y;}},
  Shape:class extends classStub(){constructor(points){super(points);this.points=points;this.holes=[];}},
  Path:class extends classStub(){},
  ShapeGeometry:class{constructor(shapes){this.shapes=shapes;this.rotated=0;this.translated=null;this.disposed=false;}
    rotateX(a){this.rotated=a;return this;}translate(x,y,z){this.translated=[x,y,z];return this;}dispose(){this.disposed=true;}},
  MeshBasicMaterial:class{constructor(options){Object.assign(this,options);this.disposed=false;}dispose(){this.disposed=true;}},
  Mesh:class extends classStub(){constructor(geometry,material){super(geometry,material);this.geometry=geometry;this.material=material;}},
  Group:class extends classStub(){}
};
const fixture={schema_version:1,geometry_frame:{crs:'EPSG:32633',origin:[1,2],axes:'x=easting,z=-northing',unit:'m'},
  by_gid:{7:{bridge_id:'deck-7',osm_id:1}},
  by_bridge_id:{'deck-7':{municipal_ids:['PONTE:fID1'],material:{code:'03',label:'muratura'},purpose:{code:'04',label:'pedonale'},
    type:{code:'01',label:'ponte'},length_m:10.5,width_m:4.25,dimensions_method:'minimum rotated envelope',
    geometry_local:[[[[0,0],[4,0],[4,-2],[0,-2],[0,0]]]]}}};

test('the overlay draws the surveyed footprint, keeps it hidden until its lens is on, and reports the record',async()=>{
  const scene=new THREE.Group();
  const overlay=installBridgeCharacteristics({THREE,scene,fetchData:async()=>({ok:true,json:async()=>fixture}),pickText:value=>value.en,
    url:'data/enrichment-public/bridge-characteristics.json'});
  assert.equal(await overlay.load(),fixture);
  assert.equal(overlay.overlays.length,1,'one surveyed part drawn');
  const mesh=overlay.overlays[0];
  assert.equal(mesh.geometry.translated[1],26,'drawn just above the paving');
  assert.equal(mesh.geometry.rotated,-Math.PI/2);
  assert.equal(mesh.material.color,'#c2703a');
  assert.equal(overlay.overlays[0].userData.gid,7);
  assert.equal(scene.children[0].visible,false,'nothing is drawn before the Bridges lens is chosen');
  overlay.setSourceVisible('bridges-tab',true);
  assert.equal(scene.children[0].visible,true);
  overlay.setSourceVisible('bridges-tab',false);
  assert.equal(scene.children[0].visible,false);
  const row=overlay.rows(7);
  assert.deepEqual({material:row.material,purpose:row.purpose,type:row.type,colour:row.colour},{material:'muratura',purpose:'pedonale',type:'ponte',colour:'#c2703a'});
  assert.deepEqual(row.size,[10.5,4.25]);
  assert.equal(overlay.summary(7),'muratura · pedonale · ponte · 10.5 × 4.3 m');
  assert.equal(overlay.rows(999),null,'a building without a municipal record reports nothing');
  assert.equal(overlay.summary(999),null);
  overlay.dispose();
  assert.equal(scene.children.length,0);
});
test('a failed or malformed file leaves the map unchanged and reports the error',async()=>{
  const scene=new THREE.Group();
  const failing=installBridgeCharacteristics({THREE,scene,fetchData:async()=>({ok:false,status:503}),pickText:value=>value.en});
  await failing.load();
  assert.match(failing.error,/503/);
  assert.equal(failing.overlays.length,0);assert.equal(scene.children.length,0);
  const malformed=installBridgeCharacteristics({THREE,scene,fetchData:async()=>({ok:true,json:async()=>({schema_version:1})}),pickText:value=>value.en});
  await malformed.load();
  assert.match(malformed.error,/Invalid/);
  assert.equal(malformed.overlays.length,0);
});
test('the published production file matches what the overlay expects',()=>{
  const data=JSON.parse(readFileSync(new URL('../web/data/enrichment-public/bridge-characteristics.json',import.meta.url),'utf8'));
  assert.equal(data.schema_version,1);
  assert.ok(Object.keys(data.by_gid).length>300);
  for(const [gid,deckId] of Object.entries(data.by_gid)){assert.ok(data.by_bridge_id[deckId],`${gid} resolves`);}
  const withGeometry=Object.values(data.by_bridge_id).filter(r=>r.geometry_local?.length);
  assert.ok(withGeometry.length>0);
  assert.equal(data.geometry_frame.unit,'m');
});