// Explicit test-only inventory; never used as a production fallback.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as THREE from '../web/vendor/three.module.js';
import { pick, setLang } from '../web/i18n.js';
const moduleURL = new URL('../web/church-route.js', import.meta.url);
assert.ok(existsSync(moduleURL), 'additive church route module must exist');
const { UI, validateRoute, routeEntryHTML, routePanelHTML, buildRouteOverlay, installChurchRoute, localPoint } = await import(moduleURL);
const text = (ru, it, en) => ({ru,it,en});
const fixture = () => ({id:'churches-lagoon',status:'ready',title:text('Храмы лагуны','Chiese della laguna','Lagoon churches'),summary:text('Единый порядок','Un unico ordine','One ordered route'),stops:[
 {id:'san-marco',name:text('Сан-Марко <script>','San Marco <script>','San Marco <script>'),lon:12.3387,lat:45.434,local:[0,0],wikipedia:'https://en.wikipedia.org/wiki/San_Marco',area:'San Marco',access_note:text('Осмотр снаружи','Visita esterna','Exterior visit')},
 {id:'san-lazzaro',name:text('Сан-Ладзаро','San Lazzaro','San Lazzaro'),lon:12.3614,lat:45.4066,local:[1675.6034913829062,3102.520543113351],wikipedia:'https://en.wikipedia.org/wiki/San_Lazzaro_degli_Armeni',area:'Lagoon',access_note:text('Доступ уточнять','Verificare accesso','Check access')}
],segments:[{from:'san-marco',to:'san-lazzaro',mode:'schematic',geometry_semantics:'schematic',geometry:[[12.3387,45.434],[12.3614,45.4066]],suggested_transport:text('Пешком и вапоретто','A piedi e vaporetto','Walking and vaporetto')}],audit:{scope:text('Только включённый реестр','Solo inventario incluso','Included inventory only')}});

test('validates ready inventory, duplicate ids, coordinates, sources and honest segment semantics',()=>{
 assert.equal(validateRoute(fixture()),true);
 for(const patch of [{status:'pending'},{stops:[]},{stops:[...fixture().stops,fixture().stops[0]]},{segments:[{...fixture().segments[0],mode:'walk'}]}])assert.throws(()=>validateRoute({...fixture(),...patch}),/church route/i);
 for(const patch of [{local:[NaN,0]},{local:[500,500]},{wikipedia:'javascript:alert(1)'},{lon:999},{name:{}},{access_note:{}}]) {const r=fixture();Object.assign(r.stops[0],patch);assert.throws(()=>validateRoute(r),/church route/i);}
 const bad=fixture();bad.segments[0].to='missing';assert.throws(()=>validateRoute(bad),/church route/i);
});
test('ordered list is globally numbered, localized, escaped, source-linked, with exterior/access and schematic warning',()=>{
 for(const lang of ['ru','it','en']) {setLang(lang);const r=fixture(),html=routePanelHTML(r,{selected:1,visible:true},pick);assert.ok(routeEntryHTML({route:r,status:'ready'},pick).includes(r.title[lang]));
 for(const key of Object.keys(UI))assert.ok(UI[key][lang]?.trim(),key+' '+lang);
 for(const value of [r.title[lang],r.stops[1].access_note[lang],r.audit.scope[lang],UI.schematic[lang],UI.exterior[lang],UI.hide[lang]])assert.ok(html.includes(value),value);
 assert.match(html,/<ol class="church-stops">/);assert.match(html,/data-church-stop="0"/);assert.match(html,/data-church-stop="1"[^>]*aria-current="step"/);assert.match(html,/>2<\/span>/);
 assert.ok(!html.includes('<script>'));assert.match(html,/href="https:\/\/en.wikipedia.org\/wiki\/San_Lazzaro_degli_Armeni"/);assert.match(html,/rel="noopener noreferrer"/);
 assert.ok(!/Day 1|День 1|Giorno 1/.test(html)); }
 setLang('en');for(const status of ['loading','error']) {const html=routeEntryHTML({status},pick);assert.ok(html.includes(UI[status].en));assert.ok(!html.includes('2 stops'));}
});
test('metric EPSG32633 frame keeps origin and axes, overlay preserves all external point positions without invented walking line',()=>{
 assert.ok(localPoint(12.3387,45.434).every(n=>Math.abs(n)<.001));const east=localPoint(12.3487,45.434),north=localPoint(12.3387,45.444);assert.ok(east[0]>700&&east[0]<850);assert.ok(north[1]<-1000);
 // Independently computed with pyproj EPSG:4326 -> EPSG:32633.
 const expected=[1675.6034913829062,3102.520543113351];localPoint(12.3614,45.4066).forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<.001));
 const r=fixture(),group=buildRouteOverlay(THREE,r);assert.equal(group.name,'churches-lagoon-route');const points=group.children.filter(o=>o.userData.stop_id);assert.equal(points.length,r.stops.length);
 points.forEach((p,i)=>{assert.equal(p.userData.number,i+1);assert.deepEqual([p.position.x,p.position.z],r.stops[i].local);assert.ok(p.position.y>0);});
 const lines=group.children.filter(o=>o.isLine);assert.equal(lines.length,1);assert.ok(lines[0].material instanceof THREE.LineDashedMaterial);assert.equal(lines[0].userData.mode,'schematic');assert.equal(lines[0].material.depthTest,false);
 group.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});
});
function harness(fetchRoute) {let view='walks',html='',langCallback,walks=0;const actions=new Map(),dock={scrollTop:73};const nodes=s=>({addEventListener:(event,fn)=>actions.set(s,fn)});const live={closest:()=>dock,querySelector:nodes,querySelectorAll:()=>[]};const scene=new THREE.Scene(),flies=[];
 const controller=installChurchRoute({THREE,scene,aimFly:(...args)=>flies.push(args),openDock:(v,h)=>{view=v;html=h;},dockLive:live,getDockView:()=>view,showWalks:()=>walks++,pickText:pick,onLang:fn=>{langCallback=fn;return()=>{langCallback=null;};},fetchRoute});
 return {controller,scene,flies,actions,dock,get html(){return html;},get walks(){return walks;},get view(){return view;},setView:v=>{view=v;},lang:()=>langCallback?.()}; }

test('fetch installer opens point stops outside atlas, persists selection/language/scroll, toggles and disposes without touching building cards',async()=>{
 let requests=0;const h=harness(async url=>{assert.equal(url,'data/church-route.json');requests++;return{ok:true,json:async()=>fixture()};});await h.controller.load();assert.equal(requests,1);assert.ok(h.walks>0);
 h.controller.wireList();h.actions.get('[data-church-route-open]')();assert.equal(h.view,'church-route');h.actions.get('[data-church-route-toggle]')();assert.equal(h.scene.children[0].visible,true);
 h.controller.focusStop(1);assert.deepEqual(h.flies[0],[...fixture().stops[1].local,420]);assert.match(h.html,/data-church-stop="1"[^>]*aria-current="step"/);assert.equal(h.dock.scrollTop,73);
 setLang('it');h.lang();assert.ok(h.html.includes(UI.hide.it));assert.match(h.html,/aria-current="step"/);h.controller.setVisible(false);assert.equal(h.scene.children[0].visible,false);
 h.controller.focusStop(-1);h.controller.focusStop(99);assert.equal(h.flies.length,1);let disposed=0;h.scene.children[0].children[0].children[0].geometry.addEventListener('dispose',()=>disposed++);h.controller.dispose();h.controller.dispose();assert.equal(disposed,1);assert.equal(h.scene.children.length,0);setLang('en');
});
test('network/malformed loads fail closed and retry fetches real data without fallback counts or geometry',async()=>{
 let attempts=0;const h=harness(async()=>{attempts++;return attempts===1?{ok:false,status:404}:{ok:true,json:async()=>fixture()};});h.controller.show();await h.controller.load();assert.ok(h.html.includes(UI.error.en));assert.equal(h.scene.children.length,0);h.controller.setVisible(true);assert.equal(h.scene.children.length,0);assert.ok(!h.html.includes('data-church-stop='));await h.controller.retry();assert.match(h.html,/data-church-stop="1"/);
 const bad=harness(async()=>({ok:true,json:async()=>({...fixture(),stops:[]})}));await bad.controller.load();bad.controller.show();assert.ok(bad.html.includes(UI.error.en));assert.equal(bad.scene.children.length,0);
});
test('in-flight disposal prevents late scene/dock updates and shared load does not duplicate fetch',async()=>{
 let resolve,requests=0;const h=harness(()=>{requests++;return new Promise(r=>resolve=r);});const first=h.controller.load(),second=h.controller.load();assert.equal(first,second);h.controller.dispose();resolve({ok:true,json:async()=>fixture()});await first;assert.equal(requests,1);assert.equal(h.walks,0);assert.equal(h.scene.children.length,0);
});
test('late data load never replaces an existing building card',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));const pending=h.controller.load();h.setView('building');resolve({ok:true,json:async()=>fixture()});await pending;assert.equal(h.view,'building');assert.equal(h.html,'');assert.equal(h.walks,0);
});
test('app keeps bridges/quests while integrating a second route with independent wiring and CSS',()=>{
 const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');assert.match(app,/import \{ installChurchRoute \} from '\.\/church-route\.js'/);assert.match(app,/const churchRoute = installChurchRoute/);assert.ok(app.includes('${bridgeRoute.listHTML()}${churchRoute.listHTML()}${quests.map(route).join(\'\')}'));assert.match(app,/bridgeRoute\.wireList\(\);\s*churchRoute\.wireList\(\);/);
 const css=readFileSync(new URL('../web/styles.css',import.meta.url),'utf8');assert.match(css,/\.church-stops/);
 const syncBar=app.slice(app.indexOf('function syncBar()'),app.indexOf('// ---------- A building:'));assert.ok(syncBar.includes("dockView === 'church-route'"),'Walks tab remains active inside church route');
});
