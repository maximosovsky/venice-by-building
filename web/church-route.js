// Additive lagoon church inventory. Production geometry/counts come only from the audited JSON.
export const UI = {
 title:{ru:'Храмы Венеции и лагуны',it:'Chiese di Venezia e della laguna',en:'Churches of Venice and the lagoon'},
 intro:{ru:'Единый нумерованный маршрут по включённым в реестр храмам.',it:'Un unico percorso numerato tra le chiese incluse nell’inventario.',en:'One numbered route through the churches included in the inventory.'},
 open:{ru:'Открыть маршрут',it:'Apri il percorso',en:'Open route'},
 back:{ru:'Все маршруты',it:'Tutti i percorsi',en:'All routes'},
 loading:{ru:'Загрузка реестра храмов…',it:'Caricamento dell’inventario delle chiese…',en:'Loading church inventory…'},
 error:{ru:'Маршрут недоступен: файл не загружен или не прошёл проверку. Подставных остановок и линий нет.',it:'Percorso non disponibile: caricamento o verifica falliti. Nessuna tappa o linea sostitutiva.',en:'Route unavailable: loading or validation failed. No substitute stops or lines are shown.'},
 retry:{ru:'Повторить загрузку',it:'Riprova',en:'Retry loading'},
 stops:{ru:'Остановки в реестре',it:'Tappe nell’inventario',en:'Inventory stops'},
 order:{ru:'Остановки по порядку',it:'Tappe in ordine',en:'Stops in order'},
 show:{ru:'Показать на карте',it:'Mostra sulla mappa',en:'Show on map'},
 hide:{ru:'Скрыть маршрут',it:'Nascondi il percorso',en:'Hide route'},
 source:{ru:'Википедия',it:'Wikipedia',en:'Wikipedia'},
 exterior:{ru:'Осмотр снаружи; пешком и вапоретто между доступными островами. Перед поездкой уточняйте расписание, ограничения и доступ; частные острова не означают регулярный рейс.',it:'Visite esterne; a piedi e in vaporetto tra le isole accessibili. Verificare orari, restrizioni e accesso prima del viaggio; le isole private non implicano un servizio regolare.',en:'Exterior visits; walking and vaporetto between accessible islands. Check timetables, restrictions and access before travel; private islands do not imply a regular service.'},
 schematic:{ru:'Пунктир — только схема порядка посещения, не пешеходный путь и не маршрут судна. Проверенные пути показаны сплошными линиями. Номера совпадают со списком.',it:'Il tratteggio indica solo l’ordine delle visite, non un percorso pedonale o una rotta navale. I percorsi verificati sono linee continue. I numeri corrispondono all’elenco.',en:'Dashed connectors show visit order only, not walking paths or boat routes. Verified paths use solid lines. Numbers match the list.'},
 scope:{ru:'Охват ограничен включённым проверенным реестром; это не гарантия полного городского списка.',it:'La copertura riguarda l’inventario verificato incluso, non un elenco cittadino garantito completo.',en:'Coverage is limited to the included audited inventory, not a guaranteed complete city register.'},
 transfers:{ru:'Переходы и переезды',it:'Spostamenti e trasferimenti',en:'Walks and transfers'},
 walk:{ru:'Пешком',it:'A piedi',en:'Walking'},boat:{ru:'Судно',it:'Navigazione',en:'Boat'},
 connector:{ru:'Схема',it:'Schema',en:'Schematic'}
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
 for(const s of route.stops){if(!s || typeof s.id!=='string' || !s.id || ids.has(s.id) || !translated(s.name) || !translated(s.access_note) || !validWGS([s.lon,s.lat]) || !pair(s.local) || !wikiURL(s.wikipedia))fail();
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
 const route=state.status==='ready'?state.route:null;
 return `<li class="route church-route-entry" data-no-i18n><h3>${text(route?.title||UI.title,pickText)}</h3><p>${text(route?.summary||UI.intro,pickText)}</p>
 ${!route?`<p role="status">${label(state.status==='error'?'error':'loading',pickText)}</p>`:''}
 <div class="route-meta">${route?`<span>${route.stops.length} · ${label('stops',pickText)}</span>`:''}<button class="pill primary" data-church-route-open>${label('open',pickText)}</button></div></li>`;
}
export function routePanelHTML(route,state={},pickText){
 const notes=route.audit?.limitations??route.audit?.caveats;
 return `<article class="dock-page church-route-page" data-no-i18n><h2 id="dock-title">${text(route.title,pickText)}</h2><p class="lede">${text(route.summary,pickText)}</p>
 <p>${route.stops.length} · ${label('stops',pickText)}</p><p class="caveat">${label('exterior',pickText)}</p>
 <div class="walk-actions"><button class="pill primary" data-church-route-toggle aria-pressed="${!!state.visible}">${label(state.visible?'hide':'show',pickText)}</button></div>
 <p class="caveat church-route-legend">${label('schematic',pickText)}</p><p class="caveat">${label('scope',pickText)}</p>
 ${route.audit?.scope?`<p class="caveat">${text(route.audit.scope,pickText)}</p>`:''}${(notes?(Array.isArray(notes)?notes:[notes]):[]).map(n=>`<p class="caveat">${text(n,pickText)}</p>`).join('')}
 <h3>${label('order',pickText)}</h3><ol class="church-stops">${route.stops.map((s,i)=>`<li><button data-church-stop="${i}"${state.selected===i?' aria-current="step"':''}><span class="church-stop-number">${i+1}</span><span>${text(s.name,pickText)}</span></button>
 <div class="church-stop-detail">${s.area?`<small>${text(s.area,pickText)}</small>`:''}<p>${text(s.access_note,pickText)}</p><a href="${escapeHTML(s.wikipedia)}" target="_blank" rel="noopener noreferrer">${label('source',pickText)}</a></div></li>`).join('')}</ol>
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
function stopMarker(THREE,stop,index){
 const group=new THREE.Group();group.name=`church-stop:${stop.id}`;group.position.set(stop.local[0],38,stop.local[1]);group.userData={stop_id:stop.id,number:index+1};
 const dot=new THREE.Mesh(new THREE.SphereGeometry(7,8,6),new THREE.MeshBasicMaterial({color:'#345a60',depthTest:false,depthWrite:false}));dot.renderOrder=40;group.add(dot);
 if(typeof document!=='undefined') {const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d');if(ctx){ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.strokeText(String(index+1),48,48);ctx.fillStyle='#345a60';ctx.fillText(String(index+1),48,48);
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false,depthWrite:false}));sprite.position.y=22;sprite.scale.set(68,68,1);sprite.renderOrder=41;group.add(sprite);}}
 return group;
}
export function buildRouteOverlay(THREE,route){
 validateRoute(route);const group=new THREE.Group();group.name='churches-lagoon-route';
 route.stops.forEach((s,i)=>group.add(stopMarker(THREE,s,i)));
 for(const s of route.segments){const points=s.geometry.map(([lon,lat])=>{const [x,z]=localPoint(lon,lat);return new THREE.Vector3(x,24,z);});
 const options={color:s.mode==='boat'?'#3b7999':'#345a60',depthTest:false,depthWrite:false,transparent:true,opacity:.8};
 const material=s.mode==='schematic'?new THREE.LineDashedMaterial({...options,dashSize:28,gapSize:22}):new THREE.LineBasicMaterial(options);
 const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);if(s.mode==='schematic')line.computeLineDistances();line.renderOrder=39;line.userData={mode:s.mode,geometry_semantics:s.geometry_semantics};group.add(line);
 }
 return group;
}
function disposeObject(object){object.traverse(o=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m?.map?.dispose();m?.dispose();});});}
export function installChurchRoute({THREE,scene,aimFly,openDock,dockLive,getDockView,showWalks,pickText,onLang,onVisibilityChange=()=>{},fetchRoute=url=>fetch(url)}){
 const state={status:'idle',route:null,visible:false,selected:-1};let overlay=null,pending=null,disposed=false;
 const back=()=>({label:pickText(UI.back),go:showWalks});
 function render(preserveScroll=false){if(disposed)return;const dock=dockLive.closest?.('.dock'),scroll=dock?.scrollTop||0;
  if(state.status==='ready'){openDock('church-route',routePanelHTML(state.route,state,pickText),back());dockLive.querySelector('[data-church-route-toggle]')?.addEventListener('click',()=>setVisible(!state.visible));dockLive.querySelectorAll('[data-church-stop]').forEach(b=>b.addEventListener('click',()=>focusStop(Number(b.dataset.churchStop))));}
  else{openDock('church-route',`<article class="dock-page church-route-page" data-no-i18n><h2 id="dock-title">${label('title',pickText)}</h2><p role="status">${label(state.status==='error'?'error':'loading',pickText)}</p>${state.status==='error'?`<button class="pill" data-church-route-retry>${label('retry',pickText)}</button>`:''}</article>`,back());dockLive.querySelector('[data-church-route-retry]')?.addEventListener('click',retry);}
  if(preserveScroll&&dock)dock.scrollTop=scroll;
 }
 function refresh(){if(disposed)return;if(getDockView()==='church-route')render(true);else if(getDockView()==='walks')showWalks();}
 function load(){if(pending)return pending;if(disposed||state.status==='ready'||state.status==='error')return Promise.resolve(state.route);state.status='loading';
  pending=(async()=>{try{const response=await fetchRoute('data/church-route.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);const route=await response.json();validateRoute(route);if(!disposed){state.route=route;state.status='ready';}}catch{if(!disposed){state.route=null;state.status='error';}}finally{pending=null;refresh();}return state.route;})();return pending;
 }
 function show(){if(disposed)return;render();void load();}
 function retry(){if(pending||disposed)return pending;state.status='idle';const result=load();refresh();return result;}
 function ensureOverlay(){if(!overlay&&state.route&&!disposed){overlay=buildRouteOverlay(THREE,state.route);scene.add(overlay);}return overlay;}
 function setVisible(visible){if(disposed||state.status!=='ready')return;state.visible=!!visible;if(state.visible)ensureOverlay();if(overlay)overlay.visible=state.visible;onVisibilityChange(state.visible);if(getDockView()==='church-route')render(true);}
 function focusStop(index){if(disposed||!Number.isInteger(index)||!state.route?.stops[index])return;state.selected=index;state.visible=true;ensureOverlay().visible=true;
  onVisibilityChange(true);
  overlay.children.filter(o=>o.userData.stop_id).forEach(o=>{const selected=o.userData.number===index+1;o.scale.setScalar(selected?1.5:1);o.userData.selected=selected;});const [x,z]=state.route.stops[index].local;aimFly(x,z,420);if(getDockView()==='church-route')render(true);
 }
 const unsubscribe=onLang(()=>{if(getDockView()==='church-route')render(true);});
 return {show,load,retry,setVisible,focusStop,get overlay(){return overlay;},listHTML(){if(state.status==='idle')void load();return routeEntryHTML(state,pickText);},wireList(){dockLive.querySelector('[data-church-route-open]')?.addEventListener('click',show);},dispose(){if(disposed)return;disposed=true;onVisibilityChange(false);unsubscribe?.();if(overlay){scene.remove(overlay);disposeObject(overlay);overlay=null;}}};
}
