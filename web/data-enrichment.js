// Additive municipal evidence UI. Joins are supplied by the data producer, never proximity guesses.
// Installer does not own the host navigation, current building, photograph, facts or scene colors.
export const DATA_URLS = Object.freeze({addresses:'data/enrichment-public/addresses.json',evidence:'data/enrichment-public/building-evidence.json',bridges:'data/enrichment-public/bridge-characteristics.json',history:'data/enrichment-public/history-registers.json'});
export const DATA_UI = {
 title:{ru:'Данные и реестры',it:'Dati e registri',en:'Data and registers'},
 addresses:{ru:'Адреса',it:'Indirizzi',en:'Addresses'}, evidence:{ru:'Исторические сведения',it:'Notizie storiche',en:'Historical notes'},
 bridges:{ru:'Характеристики моста',it:'Caratteristiche del ponte',en:'Bridge characteristics'},history:{ru:'Исторические реестры',it:'Registri storici',en:'Historical registers'},
 loading:{ru:'Загрузка…',it:'Caricamento…',en:'Loading…'},error:{ru:'Данные недоступны; число записей неизвестно.',it:'Dati non disponibili; numero di record ignoto.',en:'Data unavailable; record count unknown.'},
 retry:{ru:'Повторить',it:'Riprova',en:'Retry'},unknown:{ru:'Не указано',it:'Non indicato',en:'Not specified'},
 original:{ru:'Исходные подписи и текст (без перевода)',it:'Etichette e testo della fonte (non tradotti)',en:'Original source labels and text (not translated)'},
 sourceLanguageUnknown:{ru:'Язык источника неизвестен',it:'Lingua della fonte sconosciuta',en:'Source language unknown'},withheld:{ru:'Текст не опубликован: права на воспроизведение не установлены',it:'Testo non pubblicato: diritti di riproduzione non accertati',en:'Text withheld: reproduction rights not established'},publication:{ru:'Условия публикации',it:'Condizioni di pubblicazione',en:'Publication conditions'},sheetCaveat:{ru:'Типологическая карточка, не индивидуальный чертёж здания.',it:'Scheda tipologica, non rilievo individuale dell’edificio.',en:'Typology sheet, not an individual building schematic.'},groups:{ru:'Связанные объекты',it:'Oggetti associati',en:'Associated objects'},styles:{ru:'Стили и типологии',it:'Stili e tipologie',en:'Styles and typologies'},
 association:{ru:'Связь с историческим участком, а не подтверждение тождества современного здания.',it:'Associazione a una particella storica, non identità accertata dell’edificio attuale.',en:'Historical parcel association, not confirmation of current building identity.'},
 rights:{ru:'Лицензия: проверка прав ожидается',it:'Licenza: verifica dei diritti in attesa',en:'License: rights review pending'},
 source:{ru:'Источник',it:'Fonte',en:'Source'},sheet:{ru:'Карточка VPRG',it:'Scheda VPRG',en:'VPRG sheet'},
 material:{ru:'Материал',it:'Materiale',en:'Material'},purpose:{ru:'Назначение',it:'Uso',en:'Purpose'},type:{ru:'Тип',it:'Tipo',en:'Type'},
 length_m:{ru:'Длина',it:'Lunghezza',en:'Length'},width_m:{ru:'Ширина',it:'Larghezza',en:'Width'},height_m:{ru:'Высота',it:'Altezza',en:'Height'},
 dataset:{ru:'Набор / год',it:'Dataset / anno',en:'Dataset / year'},choose:{ru:'Выберите набор',it:'Scegli un dataset',en:'Choose a dataset'},
 search:{ru:'Поиск по исходному тексту',it:'Cerca nel testo originale',en:'Search original text'},area:{ru:'Сестьере',it:'Sestiere',en:'Sestiere'},all:{ru:'Все',it:'Tutti',en:'All'},
 count:{ru:'Записи',it:'Record',en:'Records'},catalog:{ru:'Каталог и происхождение',it:'Catalogo e provenienza',en:'Catalog and provenance'},
 more:{ru:'Показать ещё',it:'Mostra altri',en:'Show more'},show:{ru:'Показать на карте',it:'Mostra sulla mappa',en:'Show on map'},match:{ru:'Связь',it:'Associazione',en:'Match'},
 blocked:{ru:'Только метаданные: публикация записей заблокирована до подтверждения прав',it:'Solo metadati: pubblicazione dei record bloccata in attesa dei diritti',en:'Metadata only: records blocked pending rights confirmation'},
 guard:{ru:'Связи с объектами отключены: проверка версии карты не пройдена',it:'Associazioni disabilitate: verifica della versione della mappa non riuscita',en:'Object associations disabled: current map hash verification failed'},
 links:{ru:'Ссылки VPRG',it:'Link VPRG',en:'VPRG links'},
 load:{ru:'Загрузить записи выбранного набора',it:'Carica i record del dataset scelto',en:'Load selected dataset records'}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=v=>v==null?[]:Array.isArray(v)?v:[v];
const normalize=v=>String(v??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const stringify=v=>typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');
export function safeSourceURL(value){if(typeof value!=='string'||!/^https?:\/\//i.test(value))return null;try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export async function verifyRenderGuard(data,{fetchData=url=>fetch(url,{cache:'no-store'}),hashAssets=null,attrsURL='data/attrs.bin',configURL='data/venezia.json'}={}){
 try{
  const guard=data?.render_guard;
  if(!guard||!globalThis.crypto?.subtle)return false;
  for(const [url,expected] of [[attrsURL,guard.attrs_sha256],[configURL,guard.config_sha256]]){
   if(!/^[a-f0-9]{64}$/.test(expected||''))return false;
   const key=url;
   let task=hashAssets?.get(key);
   if(!task){task=(async()=>{const response=await fetchData(url);if(!response.ok)throw Error('Render asset unavailable');const bytes=await response.arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');})();hashAssets?.set(key,task);}
   let actual;try{actual=await task;}catch(e){hashAssets?.delete(key);throw e;}
   if(actual!==expected)return false;
  }
  return true;
 }catch{return false;}
}
export async function guardAssociations(data,options={}){
 const verified=await verifyRenderGuard(data,options);
 if(verified)return {...data,association_guard_verified:true};
 // Independent catalog/search remains usable; never reuse unverified identity or coordinates.
 const strip=value=>Array.isArray(value)?value.map(strip):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='gid'?null:k==='candidate_gids'?[]:k==='matches'?[]:strip(v)])):value;
 return {...strip(data),by_gid:{},gid_identity:{},association_guard_verified:false};
}
export function declaredCount(data){for(const k of ['record_count','count','total_records','total'])if(Number.isSafeInteger(data?.[k])&&data[k]>=0)return data[k];if(Array.isArray(data))return data.length;if(data?.records)return allRecords(data).length;if(data?.by_bridge_id)return Object.keys(data.by_bridge_id).length;if(data?.source_catalog&&Object.values(data.source_catalog).every(Array.isArray))return Object.values(data.source_catalog).reduce((n,a)=>n+a.length,0);return null;}
export function catalogCounts(data){return {records:declaredCount(data),groups:data?.by_gid?Object.keys(data.by_gid).length:null,...Object.fromEntries(Object.entries(data?.source_catalog||{}).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length])),...(Array.isArray(data?.source_catalog?.vprg)?{links:data.source_catalog.vprg.filter(r=>list(r.sheet_url||r.url).some(safeSourceURL)).length}:{})};}
function allRecords(data){return Array.isArray(data)?data:Array.isArray(data?.records)?data.records:Object.values(data?.records||{});}
function resolveRecord(data,ref){
 if(ref&&typeof ref==='object')return ref.bridge_id&&data?.by_bridge_id?data.by_bridge_id[ref.bridge_id]||null:ref;
 const records=allRecords(data),byID=data?.by_bridge_id||data?.record_catalog||{};
 if(Object.hasOwn(byID,ref))return byID[ref];
 const byLiteralID=records.find(r=>String(r.id)===String(ref));
 return byLiteralID||(typeof ref==='number'?records[ref]:null);
}
export function recordsForGid(data,gid){return list(data?.by_gid?.[String(gid)]).map(ref=>resolveRecord(data,ref)).filter(Boolean);}
export function queryAddressRecords(data,q,{limit=50,sestiere=''}={}){
 const tokens=normalize(q).split(' ').filter(Boolean);if(!tokens.length)return [];
 return allRecords(data).filter(r=>(!sestiere||r.sestiere===sestiere)&&tokens.every(t=>normalize([r.label,r.number,r.letter,r.sestiere].join(' ')).includes(t))).slice(0,limit);
}
function datasets(data){return Array.isArray(data?.datasets)?data.datasets:Object.entries(data?.datasets||{}).map(([id,d])=>({id,...d}));}
export function historyChunks(data,id){const d=datasets(data).find(d=>String(d.id??d.year)===String(id));if(d?.publication?.published_record_count===0||d?.license?.redistribution_allowed===false)return [];return list(d?.chunks??d?.files).map(c=>{const descriptor=typeof c==='string'?{url:c}:c;const url=descriptor.url??descriptor.path??descriptor.file;return {...descriptor,url:typeof url==='string'&&!/^(?:[a-z]+:|\/|data\/)/i.test(url)?`data/${url}`:url};});}
const historyArea=r=>r.sestiere??r.attributes?.sestiere??r.attributes?.DISTRICT??r.attributes?.district??'';
export function queryHistoryRecords(records,q,{area=''}={}){const tokens=normalize(q).split(' ').filter(Boolean);return records.filter(r=>(!area||historyArea(r)===area)&&tokens.every(token=>normalize(stringify(r)).includes(token)));}
function addressLabel(r){return [r.label,[r.number,r.letter].filter(v=>v!==null&&v!==undefined&&v!=='').join(' '),r.sestiere].filter(Boolean).join(' · ');}

/**
 * openDock(view, html), dockLive Element, getDockView() -> 'building'/'data'/other;
 * aimFly(x,z) is used only on explicit map actions. pickText({ru,it,en}), onLang(callback).
 * Optional fetchData(url) -> Response and urls override allow fixture tests / versioned URLs.
 * enrichCard(gid) must be called immediately after EACH host buildingHtml replacement.
 * queryAddresses(q) -> Promise<original address records>; rejected fetch != empty search.
 */
export function installDataEnrichment({openDock,dockLive,getDockView,aimFly=()=>{},pickText=v=>typeof v==='string'?v:v.en,onLang=()=>{},fetchData=url=>fetch(url,{cache:'no-store'}),urls={}}){
 const paths={...DATA_URLS,...urls},cache=new Map(),inflight=new Map(),loadErrors=new Map(),hashAssets=new Map(),guarded=new Map();
 let disposed=false,cardRequest=0,currentCard=null,currentGid=null,pageRequest=0;
 const filters={dataset:'',q:'',area:'',limit:100};
 let pageRecords=null,pageError=null,pageLoading=false;
 const t=k=>esc(pickText(DATA_UI[k]||{ru:k,it:k,en:k}));
 if(typeof document!=='undefined'&&!document.querySelector('link[data-data-enrichment-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./data-enrichment.css',import.meta.url).href;link.dataset.dataEnrichmentCss='';document.head.append(link);}
 async function loadURL(url){
  if(cache.has(url))return cache.get(url);if(inflight.has(url))return inflight.get(url);
  const promise=(async()=>{loadErrors.delete(url);const response=await fetchData(url);if(!response.ok)throw new Error(`HTTP ${response.status} ${url}`);const data=await response.json();if(!Array.isArray(data)&&data?.schema!==1&&data?.schema_version!==1)throw new Error(`Unsupported schema: ${url}`);cache.set(url,data);return data;})();
  inflight.set(url,promise);try{return await promise;}catch(e){loadErrors.set(url,e);throw e;}finally{inflight.delete(url);}
 }
 const load=k=>loadURL(paths[k]);
 function original(value,language=null){if(value&&typeof value==='object'&&Object.hasOwn(value,'label'))value=value.label;return value==null||value===''?t('unknown'):`<span${/^[a-z]{2}(?:-[a-zA-Z]{2})?$/.test(language||'')?` lang="${esc(language)}"`:''}>${esc(stringify(value))}</span>`;}
 function link(url,label){return list(url).map(value=>{const safe=safeSourceURL(value);return safe?`<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>`:'';}).filter(Boolean).join(' · ');}
 function provenance(r,data){
  const catalog=data?.source_catalog||data?.sources||{};
  let sources=list(r.sources||r.source||r.source_id).map(s=>typeof s==='string'?(catalog[s]&&!Array.isArray(catalog[s])?catalog[s]:{id:s}):s);
  const root=data?.source;
  if(root?.key)sources=sources.length?sources.map(s=>s?.key===root.key?{...root,...s}:s):[root];
  else if(root?.url||root?.portal_url)sources.push(root);
  else if(root&&typeof root==='object')sources.push(...Object.values(root).filter(s=>s&&typeof s==='object'&&(s.url||s.portal_url)));
  if(r.source_url||r.url)sources.push({url:r.source_url||r.url});
  const seen=new Set();sources=sources.filter(s=>{const key=stringify(s);if(seen.has(key))return false;seen.add(key);return true;});
  const rows=sources.map(s=>`${esc(s.title||s.label||s.id||s.key||'')} ${link(s.url||s.source_url||s.portal_url,t('source'))}${s.license?` · ${esc(stringify(s.license))}`:` · ${t('rights')}`}${s.rights_evidence||s.license_status||s.redistribution?` · ${esc(s.rights_evidence||s.license_status||s.redistribution)}`:''}`).join('<br>');
  return `<small class="de-provenance">${rows||t('rights')}<br>${r.language?`lang: ${esc(r.language)}`:t('sourceLanguageUnknown')}${r.match?`<br>${t('match')}: ${esc(stringify(r.match))}`:''}</small>`;
 }
 function evidenceRecord(r,data,kind){
  const prose=kind==='vprg'?['note','state']:['text','description_it','description','text_it'];
  const body=prose.filter(k=>Object.hasOwn(r,k)).map(k=>`<p><b>${esc(k)}</b>: ${r[k+'_withheld']||/blocked|private/.test(r[k+'_publication_status']||'')?t('withheld'):original(r[k],r.language)}</p>`).join('');
  return `<div class="de-record">${body}${['style','typology','sheet'].filter(k=>Object.hasOwn(r,k)).map(k=>`<p><b>${esc(k)}</b>: ${original(r[k],r.language)}</p>`).join('')}${kind==='vprg'?`${link(r.sheet_url||r.url,t('sheet'))}<p class="de-caveat">${t('sheetCaveat')}</p>`:''}${provenance(r,data)}</div>`;
 }
 function historyRecord(r,data){
  // Raw archival content remains Italian and retains identifiers; no invented translated ownership.
  const fields=Object.entries(r).filter(([k,v])=>!['geometry','source','sources','source_url','url','match','gid','chunk','chunk_url'].includes(k)&&v!=null);
  return `<li class="de-record">${fields.map(([k,v])=>`<div><b>${esc(k)}</b>: ${original(v)}</div>`).join('')}${provenance(r,data)}</li>`;
 }
 function cardHTML(results,gid){
  const sections=[];
  const addresses=results.addresses?recordsForGid(results.addresses,gid):[];
  if(addresses.length)sections.push(`<section><h4>${t('addresses')}</h4><ul>${addresses.map(a=>`<li>${original(addressLabel(a))}${provenance(a,results.addresses)}</li>`).join('')}</ul></section>`);
  const notes=results.evidence?recordsForGid(results.evidence,gid):[];
  if(notes.length)sections.push(`<section><h4>${t('evidence')}</h4><small>${t('original')}</small>${notes.map(r=>`${(r.description_it??r.description??r.text_it??r.text)?evidenceRecord(r,results.evidence,'descriptions'):''}${list(r.descriptions).map(d=>evidenceRecord(typeof d==='object'?d:{text:d},results.evidence,'descriptions')).join('')}${list(r.vprg).map(v=>evidenceRecord(v,results.evidence,'vprg')).join('')}${list(r.styles).map(s=>evidenceRecord(s,results.evidence,'styles')).join('')}`).join('')}</section>`);
  const bridges=results.bridges?recordsForGid(results.bridges,gid):[];
  if(bridges.length)sections.push(`<section><h4>${t('bridges')}</h4><small>${t('original')}</small>${bridges.map(r=>`<dl>${['material','purpose','type'].map(k=>`<dt>${t(k)}</dt><dd>${original(r[k])}</dd>`).join('')}${Object.entries(r.dimensions||Object.fromEntries(['length_m','width_m','height_m'].map(k=>[k,r[k]]))).map(([k,v])=>`<dt>${t(k)}</dt><dd>${v==null?t('unknown'):esc(stringify(v))+(/_m$/.test(k)?' m':'')}</dd>`).join('')}</dl>${r.dimensions_method?`<p class="de-caveat">${esc(r.dimensions_method)}</p>`:''}${provenance(r,results.bridges)}`).join('')}</section>`);
  const refs=results.history?recordsForGid(results.history,gid):[];
  if(refs.length)sections.push(`<section><h4>${t('history')}</h4><p class="de-caveat">${t('association')}</p><ul>${refs.map(r=>historyRecord(r,results.history)).join('')}</ul><button type="button" data-de-card-history>${t('load')}</button></section>`);
  for(const k of ['addresses','evidence','bridges','history']){
   if(results[k]?.association_guard_verified===false)sections.push(`<p class="de-caveat" data-de-guard="${k}">${t(k)}: ${t('guard')}</p>`);
   if(!Object.hasOwn(results,k))sections.push(`<p data-de-card-loading="${k}" role="status">${t(k)}: ${t('loading')}</p>`);
   else if(results[k]===null)sections.push(`<details class="de-error"><summary>${t(k)}: ${t('error')}</summary><button data-de-card-retry type="button">${t('retry')}</button></details>`);
  }
  return sections.length?`<h3>${t('title')}</h3>${sections.join('')}`:'';
 }
 async function enrichCard(gid){
  const card=dockLive?.querySelector('.b-card');if(disposed||!card||getDockView()!=='building')return false;
  const request=++cardRequest;currentCard=card;currentGid=gid;
  const keys=['addresses','evidence','bridges','history'],results={};
  const live=()=>!disposed&&request===cardRequest&&card.isConnected&&dockLive.querySelector('.b-card')===card&&getDockView()==='building';
  function paint(){if(!live())return false;
   const html=cardHTML(results,gid);
   let section=card.querySelector(':scope > .data-enrichment-card');if(!html){section?.remove();return true;}
   if(!section){section=document.createElement('section');section.className='data-enrichment-card';section.dataset.gid=String(gid);section.setAttribute('data-no-i18n','');const credit=card.querySelector(':scope > .b-photo-credit, :scope > footer');card.insertBefore(section,credit||null);}
   section.innerHTML=html;
   section.querySelectorAll('[data-de-card-retry]').forEach(button=>button.addEventListener('click',()=>enrichCard(gid)));
   section.querySelector('[data-de-card-history]')?.addEventListener('click',()=>{
    const ref=recordsForGid(results.history,gid)[0];filters.dataset=String(ref.dataset_id??ref.dataset??ref.year??'');filters.q=String(ref.record_id??ref.id??'');void showData().then(()=>{if(filters.dataset&&getDockView()==='data')void selectDataset();});
   });return true;
  }
  paint();await Promise.all(keys.map(async k=>{try{const data=await load(k);if(!guarded.has(data))guarded.set(data,guardAssociations(data,{fetchData,hashAssets}));results[k]=await guarded.get(data);if(!results[k].association_guard_verified)guarded.delete(data);}catch{results[k]=null;}paint();}));
  return live();
 }
 async function queryAddresses(q,options){const data=await guardAssociations(await load('addresses'),{fetchData,hashAssets});return queryAddressRecords(data,q,options);}
 function catalogHTML(){return Object.entries(paths).map(([key,url])=>{
  const data=cache.get(url),counts=catalogCounts(data),n=counts.records,error=loadErrors.has(url);
  const metrics=data?Object.entries(counts).filter(([k])=>k!=='records').map(([k,v])=>`${t(k)}: ${v===null?t('unknown'):v}`).join(' · '):'';
  const sources=data?Object.values(data.source_catalog||{}).filter(v=>!Array.isArray(v)).map(s=>provenance({source:s},data)).join(''):'';
  return `<details class="de-catalog-item" data-de-catalog="${key}"><summary>${t(key)} · ${error?t('error'):n===null?(data?t('unknown'):t('loading')):n+' '+t('count')}</summary>${metrics}${data?provenance(data,data):error?t('error'):t('loading')}${sources}${data?.publication?`<p class="de-caveat">${t('publication')}: ${esc(stringify(data.publication))}</p>`:''}${error?`<button type="button" data-de-catalog-retry="${key}">${t('retry')}</button>`:''}</details>`;
 }).join('');}
 function pageHTML(){
  const history=cache.get(paths.history),ds=datasets(history),areas=[...new Set((pageRecords||[]).map(historyArea).filter(Boolean))].sort();
  const d=ds.find(d=>String(d.id??d.year)===filters.dataset),count=declaredCount(d);
  const filtered=queryHistoryRecords(pageRecords||[],filters.q,{area:filters.area});
  const blocked=d&&(d.publication?.published_record_count===0||d.license?.redistribution_allowed===false);
  const status=blocked?`${t('blocked')} · ${count} ${t('count')}`:pageError?t('error'):pageLoading?`${t('loading')}${pageRecords===null?'':` · ${filtered.length} / ${pageRecords.length}${count===null?'':` · ${count} ${t('count')}`}`}`:pageRecords===null?t('choose'):`${filtered.length} / ${pageRecords.length}${count===null?'':` · ${count} ${t('count')}`}`;
  return `<article class="dock-page data-enrichment-page" data-no-i18n><h2 id="dock-title">${t('title')}</h2><h3>${t('catalog')}</h3>${catalogHTML()}<h3>${t('history')}</h3><p class="de-caveat">${t('association')}</p><small>${t('original')}</small><div class="de-controls"><label>${t('dataset')}<select data-de-dataset><option value="">${t('choose')}</option>${ds.map(d=>{const id=String(d.id??d.year),n=declaredCount(d);return `<option value="${esc(id)}"${id===filters.dataset?' selected':''}>${esc(d.title?pickText(d.title):d.year??id)} · ${n===null?t('unknown'):n}</option>`;}).join('')}</select></label><label>${t('search')}<input type="search" data-de-search value="${esc(filters.q)}"></label><label>${t('area')}<select data-de-area><option value="">${t('all')}</option>${areas.map(a=>`<option${a===filters.area?' selected':''}>${esc(a)}</option>`).join('')}</select></label></div>${d?`<div class="de-dataset-meta">${provenance({...d,source:{...d.source,license:d.license}},history)}${list(d.limitations).map(v=>`<p class="de-caveat">${esc(v)}</p>`).join('')}</div>`:''}<p data-de-status role="status">${status}</p>${pageError?`<button data-de-retry>${t('retry')}</button>`:''}<ul data-de-results class="de-records">${filtered.slice(0,filters.limit).map(r=>historyRecord(r,history)).join('')}</ul>${filtered.length>filters.limit?`<button data-de-more>${t('more')}</button>`:''}</article>`;
 }
 function bindPage(){
  dockLive.querySelectorAll('[data-de-catalog-retry]').forEach(button=>button.addEventListener('click',async()=>{const key=button.dataset.deCatalogRetry;const task=load(key);renderPage();try{await task;if(key==='history')pageError=null;}catch{}renderPage();}));
  dockLive.querySelector('[data-de-dataset]')?.addEventListener('change',e=>{filters.dataset=e.target.value;filters.area='';filters.q='';filters.limit=100;selectDataset();});
  dockLive.querySelector('[data-de-search]')?.addEventListener('input',e=>{filters.q=e.target.value;filters.limit=100;renderPage(true);});
  dockLive.querySelector('[data-de-area]')?.addEventListener('change',e=>{filters.area=e.target.value;filters.limit=100;renderPage();});
  dockLive.querySelector('[data-de-more]')?.addEventListener('click',()=>{filters.limit+=100;renderPage();});
  dockLive.querySelector('[data-de-retry]')?.addEventListener('click',()=>filters.dataset?selectDataset():showData());
 }
 function renderPage(preserveInput=false){if(disposed||getDockView()!=='data')return;const old=dockLive.querySelector('[data-de-search]'),focused=preserveInput&&old===document.activeElement;const parent=dockLive.closest('.dock'),scroll=parent?.scrollTop;
  const openCatalog=[...dockLive.querySelectorAll('[data-de-catalog][open]')].map(e=>e.dataset.deCatalog);
  dockLive.innerHTML=pageHTML();bindPage();for(const key of openCatalog)dockLive.querySelector(`[data-de-catalog="${key}"]`)?.setAttribute('open','');if(parent)parent.scrollTop=scroll;if(focused)dockLive.querySelector('[data-de-search]').focus();
 }
 async function selectDataset(){
  const token=++pageRequest;pageRecords=null;pageError=null;pageLoading=!!filters.dataset;renderPage();if(!filters.dataset)return;
  try{
   const history=await load('history'),d=datasets(history).find(d=>String(d.id??d.year)===filters.dataset);if(!d)throw new Error('Missing dataset');
   if(d.publication?.published_record_count===0||d.license?.redistribution_allowed===false){pageRecords=[];return;}
   const chunks=historyChunks(history,filters.dataset),records=allRecords(d).slice(),count=declaredCount(d);pageRecords=records;
   // Sequential selected-dataset chunks, incremental filtering and cancellation after every await.
   for(const c of chunks){if(disposed||token!==pageRequest||getDockView()!=='data')return;const url=c.url;if(!url||/^(?:[a-z]+:|\/\/)/i.test(url)&&!safeSourceURL(url))throw new Error('Invalid chunk URL');
    const data=await loadURL(url);if(disposed||token!==pageRequest||getDockView()!=='data')return;records.push(...allRecords(data));pageRecords=records;renderPage(true);}
   if(token!==pageRequest||disposed)return;
   if(count!==null&&pageRecords.length!==count)throw new Error('Manifest record count mismatch');
  }catch(e){if(token===pageRequest)pageError=e;}finally{if(token===pageRequest){pageLoading=false;renderPage();}}
 }
 async function showData(){if(disposed)return;openDock('data',pageHTML());bindPage();
  const token=++pageRequest;pageLoading=true;renderPage();
  const values=await Promise.all(Object.keys(paths).map(async k=>{try{return await load(k);}catch(e){return e;}finally{if(!disposed&&getDockView()==='data'&&token===pageRequest)renderPage();}}));
  if(disposed||getDockView()!=='data'||token!==pageRequest)return;pageLoading=false;pageError=loadErrors.has(paths.history)?new Error('Unavailable history index'):null;renderPage();
 }
 const unsubscribe=onLang(()=>{if(disposed)return;if(getDockView()==='data')renderPage();else if(getDockView()==='building'&&currentCard===dockLive?.querySelector('.b-card'))void enrichCard(currentGid);});
 function focusAddress(record){if(typeof record?.x==='number'&&Number.isFinite(record.x)&&typeof record?.z==='number'&&Number.isFinite(record.z)){aimFly(record.x,record.z,420);return true;}return false;}
 return {enrichCard,queryAddresses,showData,focusAddress,dispose(){disposed=true;++cardRequest;++pageRequest;if(typeof unsubscribe==='function')unsubscribe();}};
}
