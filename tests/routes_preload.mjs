import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true});
const base=process.env.VENICE_URL||'http://127.0.0.1:8770';
try{
 const p=await b.newPage();await p.route('**/preload-test',r=>r.fulfill({contentType:'text/html',body:'<aside class="dock"><div id="live"></div></aside>'}));await p.goto(base+'/preload-test');
 const result=await p.evaluate(async()=>{
 const THREE=await import('./vendor/three.module.js');const {installBridgeRoute}=await import('./bridge-route.js');const {installChurchRoute}=await import('./church-route.js');
 const scene=new THREE.Scene(), requests=[],dockLive=document.querySelector('#live');let opens=0;
 const common={THREE,scene,dockLive,aimFly(){},openDock(){opens++},getDockView:()=> 'building',showWalks(){},pickText:v=>typeof v==='string'?v:v.en,onLang:()=>()=>{},fetchRoute:async url=>{requests.push(url);return fetch(url)}};
 const bridges=installBridgeRoute(common),sacred=installChurchRoute(common);
 if(!bridges.preload||!sacred.preload)return {missing:true};
 await Promise.all([bridges.preload(),sacred.preload()]);
 const before=scene.children.map(o=>({visible:o.visible,children:o.children.length}));const count=requests.length;
 bridges.setVisible(true);sacred.setVisible(true);await Promise.all([bridges.load(),sacred.load()]);
 const after=scene.children.map(o=>o.visible);bridges.dispose();sacred.dispose();return {requests,before,after,opens,extraRequests:requests.length-count};
 });
 assert.ok(!result.missing,'both controllers expose preload');assert.equal(result.requests.length,3);assert.equal(result.opens,0,'preload cannot replace a card');assert.equal(result.before.length,2);assert.ok(result.before.every(o=>!o.visible&&o.children>0),'both complete route overlays prepared invisibly');assert.ok(result.after.every(Boolean));assert.equal(result.extraRequests,0);console.log('PASS real bridge + sacred routes preloaded with hidden geometry; instant visibility, no refetch or card replacement');
}finally{await b.close()}
