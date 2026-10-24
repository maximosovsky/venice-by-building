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
 sourceLanguageUnknown:{ru:'Язык источника неизвестен',it:'Lingua della fonte sconosciuta',en:'Source language unknown'},
 withheld:{ru:'Текст не опубликован: права на воспроизведение не установлены',it:'Testo non pubblicato: diritti di riproduzione non accertati',en:'Text withheld: reproduction rights not established'},
 sheetCaveat:{ru:'Типологическая карточка, не индивидуальный чертёж здания.',it:'Scheda tipologica, non rilievo individuale dell’edificio.',en:'Typology sheet, not an individual building schematic.'},
 styles:{ru:'Стили и типологии',it:'Stili e tipologie',en:'Styles and typologies'},
 association:{ru:'Связь с историческим участком, а не подтверждение тождества современного здания.',it:'Associazione a una particella storica, non identità accertata dell’edificio attuale.',en:'Historical parcel association, not confirmation of current building identity.'},
 rights:{ru:'Лицензия: права не установлены, публикация — решение оператора',it:'Licenza: diritti non accertati, pubblicazione su decisione dell’operatore',en:'License: rights unestablished, publication is the operator’s decision'},
 source:{ru:'Источник',it:'Fonte',en:'Source'},sheet:{ru:'Карточка VPRG',it:'Scheda VPRG',en:'VPRG sheet'},
 material:{ru:'Материал',it:'Materiale',en:'Material'},purpose:{ru:'Назначение',it:'Uso',en:'Purpose'},type:{ru:'Тип',it:'Tipo',en:'Type'},
 length_m:{ru:'Длина',it:'Lunghezza',en:'Length'},width_m:{ru:'Ширина',it:'Larghezza',en:'Width'},height_m:{ru:'Высота',it:'Altezza',en:'Height'},
 datasetYear:{ru:'Реестр',it:'Registro',en:'Register'},year:{ru:'Год',it:'Anno',en:'Year'},
 match:{ru:'Связь',it:'Associazione',en:'Match'},
 guard:{ru:'Связи с объектами отключены: проверка версии карты не пройдена',it:'Associazioni disabilitate: verifica della versione della mappa non riuscita',en:'Object associations disabled: current map hash verification failed'},
 load:{ru:'Показать записи',it:'Mostra i record',en:'Show records'},
 loadCaveat:{ru:'Записи реестра показаны как есть, без перевода.',it:'I record del registro sono mostrati come sono, senza traduzione.',en:'Register records are shown as they stand, without translation.'},
 noRecords:{ru:'Для этого здания записей нет.',it:'Nessun record per questo edificio.',en:'No records for this building.'}
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
 // Independent address search remains usable; never reuse unverified identity or coordinates.
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
export function historyChunks(data,id){const d=datasets(data).find(d=>String(d.id??d.year)===String(id));if(!d)return [];return list(d.chunks??d.files).map(c=>{const descriptor=typeof c==='string'?{url:c}:c;const url=descriptor.url??descriptor.path??descriptor.file;return {...descriptor,url:typeof url==='string'&&!/^(?:[a-z]+:|\/|data\/)/i.test(url)?`data/${url}`:url};});}
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
export function installDataEnrichment({dockLive,getDockView,aimFly=()=>{},pickText=v=>typeof v==='string'?v:v.en,onLang=()=>{},fetchData=url=>fetch(url,{cache:'no-store'}),urls={}}){
 const paths={...DATA_URLS,...urls},cache=new Map(),inflight=new Map(),loadErrors=new Map(),hashAssets=new Map(),guarded=new Map();
 let disposed=false,cardRequest=0,currentCard=null,currentGid=null;
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
  // Raw archival content remains in its source language and keeps its identifiers.
  const fields=Object.entries(r).filter(([k,v])=>!['geometry','source','sources','source_url','url','match','gid','chunk','chunk_url','dataset_id','file','offset'].includes(k)&&v!=null&&k!=='text');
  const prose=r.text?`<p class="de-text">${esc(r.text)}</p>`:'';
  return `<li class="de-record">${prose}${fields.map(([k,v])=>`<div><b>${esc(k)}</b>: ${original(v)}</div>`).join('')}${provenance(r,data)}</li>`;
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
  if(refs.length)sections.push(`<section><h4>${t('history')}</h4><p class="de-caveat">${t('association')}</p><ul data-de-card-history-list></ul><button type="button" data-de-card-history>${t('load')}</button></section>`);
  for(const k of ['addresses','evidence','bridges','history']){
   if(results[k]?.association_guard_verified===false)sections.push(`<p class="de-caveat" data-de-guard="${k}">${t(k)}: ${t('guard')}</p>`);
   if(!Object.hasOwn(results,k))sections.push(`<p data-de-card-loading="${k}" role="status">${t(k)}: ${t('loading')}</p>`);
   else if(results[k]===null)sections.push(`<details class="de-error"><summary>${t(k)}: ${t('error')}</summary><button data-de-card-retry type="button">${t('retry')}</button></details>`);
  }
  return sections.length?`<h3>${t('title')}</h3>${sections.join('')}`:'';
 }
 async function historyForGid(gid,results){
  const refs=results.history?recordsForGid(results.history,gid):[];if(!refs.length)return [];
  const byFile=new Map();
  for(const ref of refs){const file=ref.file??ref.chunk;if(!file)continue;if(!byFile.has(file))byFile.set(file,[]);byFile.get(file).push(ref);}
  const out=[];
  await Promise.all([...byFile.entries()].map(async([file,group])=>{
   let chunk;try{chunk=await loadURL('data/enrichment-public/'+file.replace(/^data\//,''));}catch{return;}
   const records=allRecords(chunk);
   for(const ref of group){const row=Number.isInteger(ref.offset)?records[ref.offset]:records.find(r=>String(r.record_id)===String(ref.record_id));if(row)out.push({...row,dataset_id:ref.dataset_id??row.dataset_id??''});}
  }));
  return out;
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
   const historyButton=section.querySelector('[data-de-card-history]');
   if(historyButton)historyButton.addEventListener('click',async()=>{
    if(!live())return;
    historyButton.disabled=true;
    const rows=await historyForGid(gid,results);
    if(!live())return;
    const listEl=section.querySelector('[data-de-card-history-list]');
    if(listEl)listEl.innerHTML=rows.length?rows.map(r=>historyRecord(r,results.history)).join(''):`<li class="de-caveat">${t('noRecords')}</li>`;
    const caveat=document.createElement('p');caveat.className='de-caveat';caveat.textContent=pickText(DATA_UI.loadCaveat);
    historyButton.replaceWith(caveat);
   });
   return true;
  }
  paint();await Promise.all(keys.map(async k=>{try{const data=await load(k);if(!guarded.has(data))guarded.set(data,guardAssociations(data,{fetchData,hashAssets}));results[k]=await guarded.get(data);if(!results[k].association_guard_verified)guarded.delete(data);}catch{results[k]=null;}paint();}));
  return live();
 }
 async function queryAddresses(q,options){const data=await guardAssociations(await load('addresses'),{fetchData,hashAssets});return queryAddressRecords(data,q,options);}
 const unsubscribe=onLang(()=>{if(disposed)return;if(getDockView()==='building'&&currentCard===dockLive?.querySelector('.b-card'))void enrichCard(currentGid);});
 function focusAddress(record){if(typeof record?.x==='number'&&Number.isFinite(record.x)&&typeof record?.z==='number'&&Number.isFinite(record.z)){aimFly(record.x,record.z,420);return true;}return false;}
 return {enrichCard,queryAddresses,focusAddress,historyForGid:(gid)=>load('history').then(data=>historyForGid(gid,{history:data})),dispose(){disposed=true;++cardRequest;if(typeof unsubscribe==='function')unsubscribe();}};
}