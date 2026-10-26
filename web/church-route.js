// Additive lagoon church inventory. Production geometry/counts come only from the audited JSON.
//
// Владелец атласа задал вид этого маршрута: полоса лежит по земле толстой прозрачной фиолетовой линией,
// здания не дублируются над городом, номера — чёрные цифры шрифтом заголовков, а нажатие на номер
// выводит карточку места. Прежние шары на 38 м, пунктир-схема и тексты аудита убраны.
import { sourcePresentationPicker } from './source-presentation.js';
import { buildThickRouteLine } from './bridge-route.js';
export const UI = {
 title:{ru:'Церкви, храмы, монастыри и синагоги Венеции',it:'Chiese, templi e monasteri, sinagoghe di Venezia',en:'Churches, temples and monasteries, synagogues of Venice'},
 intro:{ru:'Единый нумерованный маршрут по включённым в реестр сакральным местам.',it:'Un unico percorso numerato tra i luoghi sacri inclusi nell’inventario.',en:'One numbered route through the sacred places included in the inventory.'},
 open:{ru:'Открыть маршрут',it:'Apri il percorso',en:'Open route'},
 back:{ru:'Все маршруты',it:'Tutti i percorsi',en:'All routes'},
 loading:{ru:'Загрузка реестра сакральных мест…',it:'Caricamento dell’inventario dei luoghi sacri…',en:'Loading the sacred inventory…'},
 error:{ru:'Маршрут недоступен: файл не загружен или не прошёл проверку. Подставных остановок и линий нет.',it:'Percorso non disponibile: caricamento o verifica falliti. Nessuna tappa o linea sostitutiva.',en:'Route unavailable: loading or validation failed. No substitute stops or lines are shown.'},
 retry:{ru:'Повторить загрузку',it:'Riprova',en:'Retry loading'},
 stops:{ru:'Остановки в реестре',it:'Tappe nell’inventario',en:'Inventory stops'},
 order:{ru:'Остановки по порядку',it:'Tappe in ordine',en:'Stops in order'},
 source:{ru:'Википедия',it:'Wikipedia',en:'Wikipedia'},
 transfers:{ru:'Переходы и переезды',it:'Spostamenti e trasferimenti',en:'Walks and transfers'},
 walk:{ru:'Пешком',it:'A piedi',en:'Walking'},boat:{ru:'Судно',it:'Navigazione',en:'Boat'},
 connector:{ru:'Схема',it:'Schema',en:'Schematic'},
 directions:{ru:'Полоса идёт по земле от первой остановки к последней; номера на карте и в списке совпадают. Нажатие на номер открывает карточку места.',it:'La fascia corre a terra dalla prima all’ultima tappa; i numeri sulla mappa e in elenco coincidono. Un clic sul numero apre la scheda del luogo.',en:'The band runs on the ground from the first stop to the last. The numbers on the map and in the list agree; clicking a number opens the place card.'}
};
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite = n => typeof n === 'number' && Number.isFinite(n);
const pair = p => Array.isArray(p) && p.length === 2 && p.every(finite);
const translated = v => typeof v === 'string' ? !!v.trim() : !!v && ['ru','it','en'].every(l=>typeof v[l]==='string' && !!v[l].trim());
const wikiURL = v => {try{const u=new URL(v);return u.protocol==='https:' && /^(?:[a-z-]+\.)?wikipedia\.org$/.test(u.hostname) && u.pathname.startsWith('/wiki/');}catch{return false;}};
const validWGS = p => pair(p) && Math.abs(p[0])<=180 && Math.abs(p[1])<=90;
export function validateRoute(route) {
 const fail=()=>{throw new Error('Invalid church route data');};
 if(!route || route.status!=='ready' || typeof route.id!=='string' || !route.id || !translated(route.title) || !translated(route.summary) || !Array.isArray(route.stops) || !route.stops.length || !Array.isArray(route.segments))fail();
 const ids=new Set();
 // Примечания к остановке может не быть: владелец убрал служебную фразу про внешнюю точку,
// а содержательные примечания остаются. Если примечание есть, оно должно быть переведено.
 for(const s of route.stops){if(!s || typeof s.id!=='string' || !s.id || ids.has(s.id) || !translated(s.name) || (s.access_note!==undefined && !translated(s.access_note)) || !validWGS([s.lon,s.lat]) || !pair(s.local) || !wikiURL(s.wikipedia))fail();
  const projected=localPoint(s.lon,s.lat);if(Math.hypot(projected[0]-s.local[0],projected[1]-s.local[1])>3)fail();ids.add(s.id);}
 for(const s of route.segments){if(!s || !ids.has(s.from) || !ids.has(s.to) || !['walk','boat','schematic'].includes(s.mode) || typeof s.geometry_semantics!=='string' || !s.geometry_semantics.trim() || !Array.isArray(s.geometry) || s.geometry.length<2 || !s.geometry.every(validWGS))fail();
  // Straight connectors are not upgraded to routable geometry by changing a mode.
  if(s.mode!=='schematic' && (/schematic/i.test(s.geometry_semantics) || !/verified|network|routable|navigable|service/i.test(s.geometry_semantics)))fail();
  if(s.mode==='schematic' && (!/schematic/i.test(s.geometry_semantics) || s.distance_m!==undefined || s.duration_s!==undefined))fail();
 }
 return true;
}
const label=(key,pickText)=>escapeHTML(pickText(UI[key]));
const text=(value,pickText)=>escapeHTML(pickText(value));
export function routeEntryHTML(state,pickText){
 pickText=sourcePresentationPicker(pickText);
 const route=state.status==='ready'?state.route:null;
 return `<li class="route church-route-entry" data-no-i18n><h3>${text(route?.title||UI.title,pickText)}</h3><p>${text(route?.summary||UI.intro,pickText)}</p>
 ${!route?`<p role="status">${label(state.status==='error'?'error':'loading',pickText)}</p>`:''}
 <div class="route-meta">${route?`<span>${route.stops.length} · ${label('stops',pickText)}</span>`:''}<button class="pill primary" data-church-route-open>${label('open',pickText)}</button></div></li>`;
}
// Карточка маршрута: заголовок, список мест и переходы. Тексты аудита, счётчик остановок и кнопка
// «Показать на карте» убраны по просьбе владельца атласа: полоса видна сразу.
export function routePanelHTML(route,state={},pickText){
 pickText=sourcePresentationPicker(pickText);
 return `<article class="dock-page church-route-page" data-no-i18n><h2 id="dock-title">${text(route.title,pickText)}</h2><p class="lede">${text(route.summary,pickText)}</p>
 <h3>${label('order',pickText)}</h3><p class="caveat">${label('directions',pickText)}</p>
 <ol class="church-stops">${route.stops.map((s,i)=>`<li><button data-church-stop="${i}"${state.selected===i?' aria-current="step"':''}><span class="church-stop-number">${i+1}</span><span>${text(s.name,pickText)}</span></button>
 <div class="church-stop-detail">${s.area?`<small>${text(s.area,pickText)}</small>`:''}${translated(s.access_note)?`<p>${text(s.access_note,pickText)}</p>`:''}<a href="${escapeHTML(s.wikipedia)}" target="_blank" rel="noopener noreferrer">${label('source',pickText)}</a></div></li>`).join('')}</ol>
 ${route.segments.length?`<details class="church-transfers"><summary>${label('transfers',pickText)}</summary><ol>${route.segments.map(s=>`<li>${route.stops.findIndex(p=>p.id===s.from)+1} → ${route.stops.findIndex(p=>p.id===s.to)+1} · ${label(s.mode==='schematic'?'connector':s.mode,pickText)}${s.suggested_transport?` · ${text(s.suggested_transport,pickText)}`:''}${s.access_note?`<p>${text(s.access_note,pickText)}</p>`:''}</li>`).join('')}</ol></details>`:''}</article>`;
}
// WGS84 -> EPSG:32633, same signed metric frame as the building atlas.
function utm(lon,lat){
 const a=6378137,e2=.0066943799901413165,k=.9996,ep=e2/(1-e2),r=Math.PI/180,phi=lat*r;
 const N=a/Math.sqrt(1-e2*Math.sin(phi)**2),T=Math.tan(phi)**2,C=ep*Math.cos(phi)**2,A=(lon-15)*r*Math.cos(phi);
 const M=a*((1-e2/4-3*e2**2/64-5*e2**3/256)*phi-(3*e2/8+3*e2**2/32+45*e2**3/1024)*Math.sin(2*phi)+(15*e2**2/256+45*e2**3/1024)*Math.sin(4*phi)-35*e2**3/3072*Math.sin(6*phi));
 return [500000+k*N*(A+(1-T+C)*A**3/6+(5-18*T+T*T+72*C-58*ep)*A**5/120),k*(M+N*Math.tan(phi)*(A*A/2+(5-T+9*C+4*C*C)*A**4/24+(61-58*T+T*T+600*C-330*ep)*A**6/720))];
}
const origin=utm(12.3387,45.4340);
export function localPoint(lon,lat){const [e,n]=utm(lon,lat);return[e-origin[0],-(n-origin[1])];}
export const GROUND_HEIGHT = 1.2;
export const MARKER_HEIGHT = 3;
export const BAND_COLOR = '#7b1fa2';
export const BAND_WIDTH = 14;
export const BAND_OPACITY = .5;
// Номер места: чёрная цифра шрифтом заголовков, без шара и без обводки; шрифт догружается и перерисовывается.
const MARKER_FONT = 'IM Fell English SC';
function numberedMarker(THREE, n, x, z, selected = false) {
 if (typeof document === 'undefined') return null;
 const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
 const ctx = canvas.getContext('2d'); if (!ctx) return null;
 const texture = new THREE.CanvasTexture(canvas);
 const paint = () => {
  ctx.clearRect(0, 0, 64, 64);
  ctx.font = `${String(n).length > 3 ? 20 : selected ? 30 : 28}px "${MARKER_FONT}", Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(String(n), 32, 32);
  texture.needsUpdate = true;
 };
 paint();
 try {
  if (document.fonts?.load && !document.fonts.check(`28px "${MARKER_FONT}"`)) void document.fonts.load(`28px "${MARKER_FONT}"`).then(paint, () => {});
 } catch {}
 const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
 marker.position.set(x, MARKER_HEIGHT, z); marker.scale.set(18, 18, 1); marker.renderOrder = selected ? 41 : 40;
 return marker;
}
// Полоса по земле из проверенной геометрии каждого перехода: и пешего, и паромного. Здания подсвечивает
// сама карта, поэтому копий построек в оверлее нет — только полоса и номера.
export function buildRouteOverlay(THREE, route, resolveStopGid = () => -1) {
 validateRoute(route);
 const group = new THREE.Group(); group.name = 'churches-lagoon-route';
 for (const s of route.segments) {
  const points = s.geometry.map(([lon, lat]) => { const [x, z] = localPoint(lon, lat); return [x, GROUND_HEIGHT, z]; });
  if (points.length < 2) continue;
  const line = buildThickRouteLine(THREE, points);
  line.material.uniforms.color.value.set(BAND_COLOR);
  line.material.uniforms.opacity.value = BAND_OPACITY;
  line.material.uniforms.strokeWidth.value = BAND_WIDTH;
  line.material.uniforms.dashLength.value = 0;
  line.material.depthTest = true;
  line.userData = { mode: s.mode, geometry_semantics: s.geometry_semantics };
  group.add(line);
 }
 route.stops.forEach((s, i) => {
  const marker = numberedMarker(THREE, i + 1, s.local[0], s.local[1]);
  if (!marker) return;
  marker.userData.stop_id = s.id;
  marker.userData.crossing = i;
  marker.userData.gid = resolveStopGid(s);
  group.add(marker);
 });
 return group;
}
function disposeObject(object){object.traverse(o=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m?.map?.dispose();m?.dispose();});});}
export function installChurchRoute({THREE,scene,aimFly,openDock,dockLive,getDockView,showWalks,pickText,onLang,resolveStopGid=()=>-1,openBuildingCard=()=>{},onVisibilityChange=()=>{},fetchRoute=url=>fetch(url,{cache:'no-store'})}){
 const state={status:'idle',route:null,visible:false,selected:-1};let overlay=null,pending=null,disposed=false;
 const back=()=>({label:pickText(UI.back),go:showWalks});
 function render(preserveScroll=false){if(disposed)return;const dock=dockLive.closest?.('.dock'),scroll=dock?.scrollTop||0;
  if(state.status==='ready'){openDock('church-route',routePanelHTML(state.route,state,pickText),back());dockLive.querySelectorAll('[data-church-stop]').forEach(b=>b.addEventListener('click',()=>focusStop(Number(b.dataset.churchStop))));}
  else{openDock('church-route',`<article class="dock-page church-route-page" data-no-i18n><h2 id="dock-title">${label('title',pickText)}</h2><p role="status">${label(state.status==='error'?'error':'loading',pickText)}</p>${state.status==='error'?`<button class="pill" data-church-route-retry>${label('retry',pickText)}</button>`:''}</article>`,back());dockLive.querySelector('[data-church-route-retry]')?.addEventListener('click',retry);}
  if(preserveScroll&&dock)dock.scrollTop=scroll;
 }
 function refresh(){if(disposed)return;if(getDockView()==='church-route')render(true);else if(getDockView()==='walks')showWalks();}
 function load(){if(pending)return pending;if(disposed||state.status==='ready'||state.status==='error')return Promise.resolve(state.route);state.status='loading';
  pending=(async()=>{try{const response=await fetchRoute('data/church-route.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);const route=await response.json();validateRoute(route);if(!disposed){state.route=route;state.status='ready';}}catch{if(!disposed){state.route=null;state.status='error';}}finally{pending=null;refresh();}return state.route;})();return pending;
 }
 // Кнопки «Показать на карте» больше нет: полоса появляется сразу, как только открылась карточка.
 function show(){if(disposed)return;render();void load().then(()=>setVisible(true));}
 function retry(){if(pending||disposed)return pending;state.status='idle';const result=load();refresh();return result;}
 function ensureOverlay(){if(!overlay&&state.route&&!disposed){overlay=buildRouteOverlay(THREE,state.route,resolveStopGid);scene.add(overlay);}return overlay;}
 function setVisible(visible){if(disposed||state.status!=='ready')return;state.visible=!!visible;if(state.visible)ensureOverlay();if(overlay)overlay.visible=state.visible;onVisibilityChange(state.visible);if(getDockView()==='church-route')render(true);}
 function focusStop(index){if(disposed||!Number.isInteger(index)||!state.route?.stops[index])return;state.selected=index;state.visible=true;ensureOverlay().visible=true;
  onVisibilityChange(true);
  overlay.children.filter(o=>o.userData.stop_id).forEach(o=>{const selected=o.userData.crossing===index;o.scale.setScalar(selected?1.5:1);o.userData.selected=selected;});
  const stop=state.route.stops[index];aimFly(stop.local[0],stop.local[1],420);
  // Нажатие на номер выводит карточку самого места.
  const gid=resolveStopGid(stop);
  if(gid>=0)openBuildingCard(gid);
  if(getDockView()==='church-route')render(true);
 }
 // Клик по номеру на карте: спрайты лежат в группе маршрута и помнят своё место.
 function spriteAt(clientX,clientY,camera,size=[globalThis.innerWidth||1,globalThis.innerHeight||1]){
  if(disposed||!overlay?.visible)return null;
  const raycaster=new THREE.Raycaster();
  raycaster.setFromCamera({x:(clientX/size[0])*2-1,y:-(clientY/size[1])*2+1},camera);
  for(const hit of raycaster.intersectObjects(overlay.children,false)){
   const gid=hit.object?.userData?.gid;
   if(Number.isInteger(gid)&&gid>=0)return {gid,index:hit.object.userData.crossing,stop_id:hit.object.userData.stop_id};
  }
  return null;
 }
 const unsubscribe=onLang(()=>{if(getDockView()==='church-route')render(true);});
 return {show,load,retry,setVisible,focusStop,spriteAt,get overlay(){return overlay;},listHTML(){if(state.status==='idle')void load();return routeEntryHTML(state,pickText);},wireList(){dockLive.querySelector('[data-church-route-open]')?.addEventListener('click',show);},dispose(){if(disposed)return;disposed=true;onVisibilityChange(false);unsubscribe?.();if(overlay){scene.remove(overlay);disposeObject(overlay);overlay=null;}}};
}