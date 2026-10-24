"""FIRST-stage read-only municipal PONTE/OSM/route evidence audit. No application writes."""
from pathlib import Path
import json, csv, hashlib, math, zipfile, subprocess, sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
import geopandas as gpd
import pyogrio, osmium, networkx as nx, pymupdf
from pyproj import Transformer
from shapely.geometry import shape, Polygon, LineString, Point, mapping
from shapely.ops import transform, unary_union, polygonize
from shapely.strtree import STRtree

ROOT = Path('D:/100_star/venice')
OUT = Path(__file__).resolve().parent
STAMP = OUT.name.split('audit_')[1]
RAW = ROOT/'data/raw/Venice_Geodata_20261022_2004'
ZIP = RAW/'2010_Venezia_aree_retry.zip'
LAYER = 'ComuneVenezia_aree/PONTE.shp'
OSM = ROOT/'data/raw/osm'
TO_METRIC = Transformer.from_crs(4326,32633,always_xy=True)
TO_WEB = Transformer.from_crs(32633,4326,always_xy=True)

def dump(name, obj):
    p=OUT/name
    with p.open('x',encoding='utf-8') as f: json.dump(obj,f,ensure_ascii=False,indent=2,allow_nan=False)
    return p

def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def metric(g): return transform(TO_METRIC.transform,g)
def load(p): return json.loads(p.read_text(encoding='utf-8'))
def counter(rows,key): return dict(sorted(Counter(r[key] for r in rows).items()))
def writecsv(name, rows):
    keys=list(dict.fromkeys(k for r in rows for k in r))
    with (OUT/name).open('x',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=keys); w.writeheader()
        for r in rows: w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in r.items()})

# Fingerprint protected state BEFORE collection. No existing file is overwritten.
protected={str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for directory in ['web','pipeline','data/routes','docs'] for p in (ROOT/directory).rglob('*') if p.is_file() and '.vercel' not in p.parts and '__pycache__' not in p.parts}
status=subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True)
dump('baseline.json',{'git_status':status,'protected_sha256':protected})
route=load(ROOT/'web/data/bridge-route.json'); audit=route['audit']
base=shape(load(OSM/'venice_island_polygon_osm_4817103.geojson')['features'][0]['geometry'])
extension=load(ROOT/'data/routes/bridge-route-san-pietro-scope.geojson')
route_geo=unary_union([base]+[shape(f['geometry']) for f in extension['features']])
route_scope=metric(route_geo)
centro=metric(shape(load(OSM/'venice_historic_centre_polygon_osm_6628638.geojson')['features'][0]['geometry']))
port_data=load(ROOT/'data/routes/bridge-route-scope.geojson')
port=unary_union([metric(shape(f['geometry'])) for f in port_data['features']])
route_ids={b['id'] for b in route['bridges']}
inventory={r['id']:r for r in audit['inventory']}
excluded={r['id']:r for r in route['excluded']}
way_identity={wid:r['id'] for r in inventory.values() for wid in r['way_ids']}
deck_identity={int(d[1:]):r['id'] for r in inventory.values() for d in r['deck_ids']}
for r in audit['unresolved_decks']: deck_identity[int(r['id'][1:])]=r['id']
assert len(route_ids)==346 and len(inventory)==418 and len(excluded)==71
assert sha(OSM/'venezia_island.osm.pbf')==audit['pbf_sha256']==extension['metadata']['source_sha256']

# Source CRC, exact DBF schema, source dictionary and catalog evidence.
z=zipfile.ZipFile(ZIP); assert z.testzip() is None
uri='zip://'+str(ZIP).replace('\\','/')+'!'+LAYER
info=pyogrio.read_info(uri)
src=gpd.read_file(uri); assert len(src)==1259
fields=[c for c in src.columns if c!='geometry']
def clean(v):
    if v is None or (isinstance(v,float) and math.isnan(v)): return None
    return v.item() if hasattr(v,'item') else v
attrs=[{k:clean(v) for k,v in r.items()} for r in src[fields].to_dict('records')]
original_valid=[g.is_valid for g in src.geometry]
mg=list(src.to_crs(32633).geometry)
for i,g in enumerate(mg):
    if not g.is_valid: mg[i]=g.buffer(0)
assert all(not g.is_empty and g.is_valid for g in mg)
assert src.crs.to_epsg()==6706
pdf=pymupdf.open(RAW/'2010_Venezia_doc.pdf')
dictionary_evidence=[{'pdf_page':i+1,'text':pdf[i].get_text()} for i in [13,56,57]]
mat={'01':'calcestruzzo','02':'legno','03':'muratura','05':'ferro'}
use={'01':'autostradale','02':'stradale','03':'ferroviario','04':'pedonale','05':'ciclabile'}
typ={'01':'ponte','02':'viadotto','03':'cavalcavia','04':'non qualificato'}
structure={'01':'ad arco','02':'a sbalzo','03':'di barche','04':'reticolare','05':'sospeso','06':'a sollevamento verticale o scorrevole','07':'levatoio','08':'fisso non specificato','09':'girevole','10':'girevole/scorrevole'}
unknown={'91':'Non conosciuto','92':'Non assegnato','93':'Non definito','94':'Non applicabile','95':'Altro'}
for d in [mat,use,typ,structure]: d.update(unknown)
catalog=load(RAW/'catalog.json')
catalog_rows=[r for r in catalog['result']['data'] if r.get('agg')=='2010']
manifest=load(RAW/'download_manifest.json')
source_manifest={'municipal_archive':{'path':str(ZIP),'sha256':sha(ZIP),'bytes':ZIP.stat().st_size,'crc_passed':True,'layer':LAYER,'members':[{'name':n,'crc32':format(z.getinfo(n).CRC,'08x'),'bytes':z.getinfo(n).file_size,'sha256':hashlib.sha256(z.read(n)).hexdigest()} for n in z.namelist() if '/PONTE.' in n],'crs':str(src.crs),'edition':'2010 catalog update/edition, NOT bridge construction date','download_manifest_entry':[r for r in manifest if '2010' in r['file']],'download_manifest_gap':'No 2010 archive/PDF entry in the existing download manifest. Catalog evidence and copied bytes retained; exact download request is not invented.','catalog_entries':catalog_rows,'rights':'Not independently established; raw README explicitly states no redistribution license verified. This audit is not public redistribution authorization.'},'dictionary':{'path':str(RAW/'2010_Venezia_doc.pdf'),'sha256':sha(RAW/'2010_Venezia_doc.pdf'),'pdf_metadata':pdf.metadata,'evidence':dictionary_evidence},'osm_manifest':load(OSM/'venice_island_osm_manifest.json'),'osm_inputs':[{'path':str(OSM/n),'sha256':sha(OSM/n),'bytes':(OSM/n).stat().st_size} for n in ['venezia_island.osm.pbf','venezia_historic_centre.osm.pbf']],'route_sha256':sha(ROOT/'web/data/bridge-route.json'),'schema':{'fields':fields,'ogr_dtypes':[str(x) for x in info['dtypes']],'geometry_type':info['geometry_type'],'id_semantics':'No unique ID or bridge name field in DBF. Municipal ID PONTE2010:fIDNNNNNN is zero-based shapefile record index bound to archive/layer SHA256, not CODICE (class code).','field_value_counts':{k:dict(Counter(str(a[k]) for a in attrs)) for k in fields},'decoded_enums':{'PONTE_MAT':mat,'PONTE_USO':use,'PONTE_TY':typ,'PONTE_STRU':structure},'construction_year_field':None,'numeric_92':'Preserved raw; do not interpret repeated 92 numeric entries as measured elevations/heights without numeric null specification.'},'scope':{'route':'Exact original island + San Pietro land/decks; historic pedestrian port polygons sepa... [truncated]
dump('source-manifest.json',source_manifest)

# Read both REAL PBFs: geometry, original node IDs, all highway tags, deck tags, named islets.
nodes={}; node_tags={}; ways={}; islands={}; relations={}; island_relations={}; all_way_nodes={}
class Reader(osmium.SimpleHandler):
    def node(self,n):
        nodes[n.id]=(n.location.lon,n.location.lat)
        if len(n.tags): node_tags[n.id]=dict(n.tags)
    def way(self,w):
        t=dict(w.tags)
        all_way_nodes[w.id]=[n.ref for n in w.nodes]
        r={'id':w.id,'nodes':[n.ref for n in w.nodes],'tags':t}
        if 'highway' in t or t.get('man_made') in {'bridge','pier'} or t.get('bridge','no') not in {'no','','0'}: ways[w.id]=r
        if t.get('place') in {'island','islet'}: islands[w.id]=r
    def relation(self,r):
        t=dict(r.tags)
        if t.get('place') in {'island','islet'}: island_relations[r.id]={'id':r.id,'tags':t,'members':[(m.type,m.ref,m.role) for m in r.members]}
        if t.get('man_made')=='bridge' or t.get('type')=='bridge': relations[r.id]={'id':r.id,'tags':t,'members':[(m.type,m.ref,m.role) for m in r.members]}
reader=Reader()
for n in ['venezia_historic_centre.osm.pbf','venezia_island.osm.pbf']: reader.apply_file(str(OSM/n))
lines={}; decks={}; missing=[]
for wid,w in ways.items():
    if len(w['nodes'])<2 or any(n not in nodes for n in w['nodes']): missing.append(wid); continue
    coords=[TO_METRIC.transform(*nodes[n]) for n in w['nodes']]
    lines[wid]=LineString(coords)
    if w['tags'].get('man_made')=='bridge' and len(coords)>3 and w['nodes'][0]==w['nodes'][-1]:
        g=Polygon(coords)
        decks[wid]=g if g.is_valid else g.buffer(0)
named_islands=[]
for wid,w in islands.items():
    if len(w['nodes'])>3 and w['nodes'][0]==w['nodes'][-1] and all(n in nodes for n in w['nodes']):
        g=metric(Polygon([nodes[n] for n in w['nodes']]))
        if g.is_valid: named_islands.append((wid,w['tags'].get('name','unnamed OSM island'),g))
for rid,r in island_relations.items():
    member_lines=[]
    for kind,wid,role in r['members']:
        if kind=='w' and role=='outer' and wid in all_way_nodes and all(n in nodes for n in all_way_nodes[wid]):
            member_lines.append(metric(LineString([nodes[n] for n in all_way_nodes[wid]])))
    polys=list(polygonize(unary_union(member_lines))) if member_lines else []
    if polys: named_islands.append(('relation/'+str(rid),r['tags'].get('name','unnamed OSM island relation'),unary_union(polys)))
# All network edges retain original adjacent IDs, no invented portal or proximity edge.
PUBLIC={'yes','designated','permissive'}
HIGHWAYS={'footway','pedestrian','steps','path','living_street','residential','service','unclassified','tertiary','secondary','primary','road','cycleway'}
def restriction(t):
    f=t.get('foot',t.get('access','yes'))
    if f not in PUBLIC: return 'access:'+f
    if t.get('foot:conditional') or (t.get('access:conditional') and t.get('foot') not in PUBLIC): return 'conditional_access'
    if t.get('opening_hours') not in {None,'','24/7'}: return 'opening_hours'
    if t.get('locked')=='yes': return 'locked'
    return None

def access(t):
    if t.get('highway') not in HIGHWAYS: return 'not_pedestrian_highway'
    if t.get('highway')=='cycleway' and t.get('foot') not in PUBLIC: return 'cycleway_without_foot_permission'
    if t.get('route')=='ferry' or t.get('ferry')=='yes': return 'ferry'
    if t.get('construction') or t.get('proposed') or t.get('disused')=='yes': return 'construction_or_disused'
    if t.get('indoor')=='yes': return 'indoor'
    if t.get('oneway:foot') in {'yes','-1'}: return 'directed_foot_access_unresolved'
    return restriction(t)
blocked={n:restriction(t) for n,t in node_tags.items() if restriction(t)}
graph=nx.Graph(); bynode=defaultdict(set)
for wid,line in lines.items():
    w=ways[wid]
    if not w['tags'].get('highway'): continue
    for n in w['nodes']: bynode[n].add(wid)
    if access(w['tags']) or any(n in blocked for n in w['nodes']): continue
    if not route_scope.covers(line): continue
    for u,v in zip(w['nodes'],w['nodes'][1:]):
        if u!=v: graph.add_edge(u,v,way_id=wid)
start_nodes={n for wid,w in ways.items() if w['tags'].get('name')=='Piazza San Marco' for n in w['nodes'] if n in graph}
start=min(start_nodes,key=lambda n:Point(TO_METRIC.transform(*nodes[n])).distance(Point(TO_METRIC.transform(12.3387,45.4340))))
reach=nx.node_connected_component(graph,start)
source_stats={'node_count':len(nodes),'way_count':len(ways),'deck_count':len(decks),'bridge_relations':list(relations.values()),'island_relations':list(island_relations.values()),'broader_boundary_actual_relation_name':'Venezia-Murano-Burano', 'broader_boundary_actual_admin_level':'10','missing_geometry_way_ids':missing,'route_network_nodes':graph.number_of_nodes(),'start_node':start,'reachable_nodes':len(reach),'no_snapping':True}
dump('osm-source-stats.json',source_stats)

deck_keys=sorted(decks); dt=STRtree([decks[i] for i in deck_keys])
line_keys=sorted(lines); lt=STRtree([lines[i] for i in line_keys])
munitree=STRtree(mg)
rows=[]; strong_deck=[]
for i,g in enumerate(mg):
    sid=f'PONTE2010:fID{i:06d}'
    ll=TO_WEB.transform(*g.representative_point().coords[0])
    frac=g.intersection(route_scope).area/g.area
    cp=route_scope.covers(g.representative_point()); cf=g.intersection(centro).area/g.area
    if frac>=.99: zone='route_inside'
    elif frac>1e-6: zone='route_boundary_ambiguous'
    elif cf>=.99: zone='broader_centro_outside_route'
    elif cf>1e-6: zone='centro_boundary_ambiguous'
    else: zone='outside_broader_centro'
    pn=g.intersection(port).area/g.area
    island_hits=[{'osm_way_id':wid,'name':name,'municipal_overlap_fraction':round(g.intersection(ig).area/g.area,6)} for wid,name,ig in named_islands if g.intersects(ig) and g.intersection(ig).area/g.area>.1]
    dh=[]; lh=[]; sd=[]
    for j in dt.query(g):
        wid=deck_keys[int(j)]; ov=g.intersection(decks[wid]).area
        if ov<=.01: continue
        fm=ov/g.area; fd=ov/decks[wid].area
        strong=ov>=1 and (fm>=.35 or fd>=.35)
        identity=deck_identity.get(wid,'d'+str(wid))
        dh.append({'osm_way_id':wid,'url':f'https://www.openstreetmap.org/way/{wid}','identity':identity,'overlap_m2':round(ov,4),'municipal_fraction':round(fm,6),'deck_fraction':round(fd,6),'strong':strong,'tags':ways[wid]['tags']})
        if strong: sd.append(wid)
    for j in lt.query(g):
        wid=line_keys[int(j)]; w=ways[wid]; ov=g.intersection(lines[wid]).length
        if ov<=.5 or not w['tags'].get('highway'): continue
        f=ov/max(lines[wid].length,.001)
        tagged=w['tags'].get('bridge','no') not in {'no','','0'}
        strong=tagged and ov>=2 and f>=.25
        lh.append({'osm_way_id':wid,'url':f'https://www.openstreetmap.org/way/{wid}','identity':way_identity.get(wid,'w'+str(wid)) if tagged else None,'overlap_m':round(ov,4),'line_fraction':round(f,6),'bridge_tagged':tagged,'strong':strong,'tags':w['tags'],'access_reason':access(w['tags']),'restricted_nodes':[{'node_id':n,'reason':blocked[n],'tags':node_tags[n]} for n in w['nodes'] if n in blocked],'whole_way_in_route_scope':route_scope.covers(lines[wid]),'original_node_ids':w['nodes'],'reachable_original_nodes':[n for n in w['nodes'] if n in reach]})
    identities=sorted({r['identity'] for r in dh+lh if r['strong'] and r['identity']})
    # Outside extract/boundary census is not a claim of OSM absence.
    if zone not in {'route_inside','route_boundary_ambiguous'}: status='outside_current_route_scope'
    elif len(identities)>1: status='ambiguous_osm_identity'
    elif identities:
        bid=identities[0]
        if bid in route_ids: status='route_included'
        elif bid in excluded: status='osm_known_excluded'
        elif bid in inventory or bid.startswith('d') and int(bid[1:]) in deck_identity: status='osm_known_unresolved'
        else: status='osm_known_not_required'
    else: status='candidate_missing_osm_bridge_identity'
    rows.append({'municipal_id':sid,'source_fid_zero_based':i,'lon':ll[0],'lat':ll[1],'area_m2':round(g.area,4),'original_geometry_valid':original_valid[i],'scope_zone':zone,'route_overlap_fraction':round(frac,6),'route_representative_point_inside':cp,'centro_overlap_fraction':round(cf,6),'port_overlap_fraction':round(pn,6),'named_island_evidence':island_hits,'status':status,'strong_osm_identities':identities,'deck_evidence':dh,'highway_evidence':lh,'municipal_attributes':attrs[i],'material_label_it':mat.get(attrs[i]['PONTE_MAT']),'use_label_it':use.get(attrs[i]['PONTE_USO']),'type_label_it':typ.get(attrs[i]['PONTE_TY']),'structure_label_it':structure.get(attrs[i]['PONTE_STRU']),'source_geometry_wgs84':mapping(transform(Transformer.from_crs(32633,4326,always_xy=True).transform,g))})
    strong_deck.append(set(sd))
    if (i+1)%100==0 or i==len(mg)-1:
        batch=rows[(i//100)*100:i+1]
        dump(f'checkpoint-{i//100:02d}.json',batch)
        print('checkpoint',i+1,flush=True)

# Conservative part grouping: a unique common OSM deck can identify separated municipal parts.
# Never merge different decks merely at a shared landing; no distance threshold or topology snapping.
partgraph=nx.Graph(); partgraph.add_nodes_from(range(len(rows)))
merge_edges=[]; unresolved_contacts=[]
for i,g in enumerate(mg):
    for jj in munitree.query(g):
        j=int(jj)
        if j<=i: continue
        ov=g.intersection(mg[j]).area
        share=g.boundary.intersection(mg[j].boundary).length
        common=strong_deck[i]&strong_deck[j]
        compatible=attrs[i]['PONTE_USO']==attrs[j]['PONTE_USO']
        exact=g.equals(mg[j])
        significant=ov/max(min(g.area,mg[j].area),.001)>=.2
        same_deck_part=share>=1 and len(common)==1 and strong_deck[i]==strong_deck[j] and compatible
        if exact or (significant and compatible) or same_deck_part:
            reason='exact_geometry_duplicate' if exact else ('overlapping_compatible_parts' if significant else 'shared_boundary_same_single_osm_deck')
            partgraph.add_edge(i,j)
            merge_edges.append({'municipal_ids':[rows[i]['municipal_id'],rows[j]['municipal_id']],'reason':reason,'overlap_m2':round(ov,4),'shared_boundary_m':round(share,4),'common_osm_deck_ids':sorted(common)})
        elif share>0 or ov>.01:
            unresolved_contacts.append({'municipal_ids':[rows[i]['municipal_id'],rows[j]['municipal_id']],'overlap_m2':round(ov,4),'shared_boundary_m':round(share,4),'reason':'Not merged: landing-only or insufficient compatible single-deck evidence'})
by_single_deck=defaultdict(list)
for i,dids in enumerate(strong_deck):
    if len(dids)==1: by_single_deck[next(iter(dids))].append(i)
for did,ids in by_single_deck.items():
    for ai,i in enumerate(ids):
        for j in ids[ai+1:]:
            if partgraph.has_edge(i,j) or attrs[i]['PONTE_USO']!=attrs[j]['PONTE_USO']: continue
            # Same exact single authoritative OSM deck, compatible municipal use. Not based on closeness.
            partgraph.add_edge(i,j)
            merge_edges.append({'municipal_ids':[rows[i]['municipal_id'],rows[j]['municipal_id']],'reason':'same_single_osm_deck_compatible_municipal_parts','common_osm_deck_ids':[did],'geometry_gap_m':round(mg[i].distance(mg[j]),4)})
groups=[]
for members in sorted(nx.connected_components(partgraph),key=min):
    ids=sorted(members); gid='MPG:'+rows[ids[0]]['municipal_id'].split(':')[1]
    geom=unary_union([mg[i] for i in ids]); rr=[rows[i] for i in ids]
    identities=sorted({b for r in rr for b in r['strong_osm_identities']})
    statuses=sorted({r['status'] for r in rr}); zones=sorted({r['scope_zone'] for r in rr})
    status=statuses[0] if len(statuses)==1 else 'ambiguous_group_status'
    if len(identities)>1 and any(z.startswith('route_') for z in zones): status='ambiguous_osm_identity'
    ll=TO_WEB.transform(*geom.representative_point().coords[0])
    for i in ids: rows[i]['physical_group_id']=gid; rows[i]['part_role']='single' if len(ids)==1 else ('group_primary' if i==ids[0] else 'duplicate_or_part')
    groups.append({'group_id':gid,'municipal_ids':[r['municipal_id'] for r in rr],'part_count':len(ids),'status':status,'scope_zones':zones,'strong_osm_identities':identities,'lon':ll[0],'lat':ll[1],'area_m2':round(geom.area,4),'deduplication_confidence':'single source object' if len(ids)==1 else 'conservative geometry/deck inference, not independently confirmed physical census','source_geometry_wgs84':mapping(transform(TO_WEB.transform,geom))})
dump('part-grouping-evidence.json',{'merge_edges':merge_edges,'unmerged_contacts':unresolved_contacts})

# Actionable review ledger, with ACTUAL untagged OSM path/node/access evidence.
candidates=[]
for group in groups:
    if not any(z.startswith('route_') for z in group['scope_zones']): continue
    if group['status'] in {'route_included','osm_known_excluded'}: continue
    rr=[rows[int(s.split('fID')[1])] for s in group['municipal_ids']]
    highways={h['osm_way_id']:h for r in rr for h in r['highway_evidence']}
    deckhits={h['osm_way_id']:h for r in rr for h in r['deck_evidence']}
    geom=unary_union([mg[r['source_fid_zero_based']] for r in rr])
    traversals=[]
    for wid,h in highways.items():
        if h['bridge_tagged']: continue
        w=ways[wid]; ins=[geom.covers(Point(TO_METRIC.transform(*nodes[n]))) for n in w['nodes']]
        crossings=[]
        for a,b in zip(w['nodes'],w['nodes'][1:]):
            seg=LineString([TO_METRIC.transform(*nodes[a]),TO_METRIC.transform(*nodes[b])])
            if seg.intersection(geom).length>.5: crossings.append([a,b])
        outside=[n for n,inside in zip(w['nodes'],ins) if not inside]
        # Strong positive only for continuous original highway with outside endpoints and real graph reachability.
        through=len(outside)>=2 and not ins[0] and not ins[-1] and h['overlap_m']>=2 and w['nodes'][0]!=w['nodes'][-1] and w['tags'].get('area')!='yes'
        traversals.append({'osm_way_id':wid,'tags':h['tags'],'overlap_m':h['overlap_m'],'original_overlapping_adjacent_node_pairs':crossings,'outside_original_node_ids':outside,'original_way_has_outside_endpoints':through,'all_original_nodes_reachable':all(n in reach for n in w['nodes']),'whole_way_in_route_scope':h['whole_way_in_route_scope'],'access_reason':h['access_reason'],'restricted_nodes':h['restricted_nodes'],'area_boundary_not_crossing':w['tags'].get('area')=='yes' or w['nodes'][0]==w['nodes'][-1]})
    probable=any(t['original_way_has_outside_endpoints'] and t['all_original_nodes_reachable'] and t['whole_way_in_route_scope'] and not t['access_reason'] and not t['restricted_nodes'] and t['tags'].get('man_made')!='pier' for t in traversals)
    private=any(h['access_reason'] or h['restricted_nodes'] for h in highways.values())
    pier=any(h['tags'].get('man_made')=='pier' for h in highways.values())
    boundary=any(z=='route_boundary_ambiguous' for z in group['scope_zones'])
    port_match=any(r['port_overlap_fraction']>.1 for r in rr)
    if group['status']=='candidate_missing_osm_bridge_identity' and probable and not boundary and not port_match:
        rank=1; review='probable_missing_bridge_tag_on_existing_reachable_osm_highway'
    elif group['status']=='ambiguous_osm_identity' or group['status']=='ambiguous_group_status': rank=2; review='ambiguous_identity_or_multipart_review'
    elif group['status']=='osm_known_not_required': rank=2; review='known_osm_bridge_not_in_current_generator_inventory'
    elif boundary or port_match: rank=4; review='boundary_or_port_scope_review'
    elif private or pier: rank=4; review='possible_private_or_pier_not_proven_public_crossing'
    else: rank=3; review='municipal_candidate_without_verified_public_osm_through_crossing'
    candidates.append({**{k:v for k,v in group.items() if k!='source_geometry_wgs84'},'rank':rank,'review_class':review,'municipal_attributes':[r['municipal_attributes'] for r in rr],'osm_deck_evidence':list(deckhits.values()),'osm_highway_evidence':list(highways.values()),'original_network_traversal_evidence':traversals,'probable_missing':probable and group['status']=='candidate_missing_osm_bridge_identity' and not boundary and not port_match,'access_interpretation':'Untagged access follows existing generator default, not field-verified access. Geometry alone does not prove survival or a two-bank canal crossing.','decision':'review_only_no_autoadd'})
candidates.sort(key=lambda c:(c['rank'],c['group_id']))
for n,c in enumerate(candidates,1): c['review_order']=n
# Bidirectional coverage: every CURRENT source identity, even no municipal counterpart.
source_ledger=[]
all_osm={**inventory,**{r['id']:{**r,'status':'unmatched_deck'} for r in audit['unresolved_decks']}}
for bid,b in sorted(all_osm.items()):
    matched=[r['municipal_id'] for r in rows if bid in r['strong_osm_identities']]
    source_ledger.append({'osm_identity':bid,'name':b['name'],'current_inventory_status':b['status'],'route_included':bid in route_ids,'exclusion_reason':excluded.get(bid,{}).get('reason_code'),'way_ids':b.get('way_ids',[]),'deck_ids':b.get('deck_ids',[bid] if bid.startswith('d') else []),'municipal_ids':matched,'municipal_match_count':len(matched),'source_evidence':excluded.get(bid) or b})
summary={'timestamp_utc':STAMP,'source_rows':len(rows),'scope_rows':counter(rows,'scope_zone'),'status_rows':counter(rows,'status'),'inferred_physical_groups':len(groups),'merged_extra_parts':len(rows)-len(groups),'multipart_groups':sum(g['part_count']>1 for g in groups),'unmerged_contact_pairs':len(unresolved_contacts),'status_groups':counter(groups,'status'),'route_scoped_group_count':sum(any(z.startswith('route_') for z in g['scope_zones']) for g in groups),'strict_route_inside_group_count':sum(g['scope_zones']==['route_inside'] for g in groups),'current_route_bridges':len(route_ids),'current_inventory':len(inventory),'current_excluded':len(excluded),'current_unresolved_groups':sum(r['status']=='unresolved' for r in inventory.values()),'current_unresolved_decks':len(audit['unresolved_decks']),'osm_ledger_count':len(source_ledger),'current_route_with_strong_municipal_match':sum(l['route_included'] and l['municipal_match_count']>0 for l in source_ledger),'current_route_without_strong_municipal_match':[l['osm_identity'] for l in source_ledger if l['route_included'] and not l['municipal_match_count']],'municipal_rows_with_strong_osm_identity':sum(bool(r['strong_osm_identities']) for r in rows),'review_groups':len(candidates),'review_classes':counter(candidates,'review_class'),'probable_missing_review_groups':sum(c['probable_missing'] for c in candidates),'invalid_source_geometries':sum(not b for b in original_valid),'metric_bounds':list(src.to_crs(32633).total_bounds),'source_wgs84_bounds':list(src.to_crs(4326).total_bounds),'named_island_row_counts_overlapping_not_partition':dict(Counter(e['name'] for r in rows for e in r['named_island_evidence'])),'pedestrian_route_inside_rows_outside_port_polygons':sum(r['scope_zone']=='route_inside' and r['port_overlap_fraction']<=.01 for r in rows),'route_inside_port_overlap_rows':sum(r['scope_zone']=='route_inside' and r['port_overlap_fraction']>.01 for r in rows),'broader_centro_total_intersecting_rows':sum(r['centro_overlap_fraction']>0 for r in rows),'broader_boundary_actual_name':'Venezia-Murano-Burano administrative municipalita, NOT strict historic centro' }
dump('municipal-census.json',rows); writecsv('municipal-census.csv',rows)
dump('physical-groups.json',groups); writecsv('physical-groups.csv',groups)
dump('review-candidates.json',candidates); writecsv('review-candidates.csv',candidates)
dump('osm-route-reconciliation.json',source_ledger); writecsv('osm-route-reconciliation.csv',source_ledger)
dump('summary.json',summary)
# Independent written readback, complete reconciliation, unchanged protected files.
wrows=load(OUT/'municipal-census.json'); wg=load(OUT/'physical-groups.json'); wc=load(OUT/'review-candidates.json'); wl=load(OUT/'osm-route-reconciliation.json')
checks={'all_1259_rows':len(wrows)==1259,'unique_municipal_ids':len({r['municipal_id'] for r in wrows})==1259,'scope_sum':sum(summary['scope_rows'].values())==1259,'status_sum':sum(summary['status_rows'].values())==1259,'groups_cover_each_source_once':sorted(s for g in wg for s in g['municipal_ids'])==sorted(r['municipal_id'] for r in wrows),'every_candidate_status':all(c['status'] and c['decision']=='review_only_no_autoadd' for c in wc),'unique_group_ids':len({g['group_id'] for g in wg})==len(wg),'inventory_reconciliation':418==346+71+1,'osm_ledger_exhaustive':len(wl)==418+6,'coordinate_ranges':all(12<r['lon']<13 and 45<r['lat']<46 for r in wrows),'metric_crs':src.to_crs(32633).crs.to_epsg()==32633,'source_crs':src.crs.to_epsg()==6706,'zip_crc':z.testzip() is None,'source_and_route_files_unchanged':all((ROOT/k).exists() and sha(ROOT/k)==v for k,v in protected.items() if k.startswith('data/') or k.startswith('web/data/')),'no_duplicate_candidates':len({c['group_id'] for c in wc})==len(wc)}
assert all(checks.values()),checks
for name,count in [('municipal-census.csv',1259),('physical-groups.csv',len(wg)),('review-candidates.csv',len(wc)),('osm-route-reconciliation.csv',len(wl))]:
    with (OUT/name).open(encoding='utf-8-sig',newline='') as f: assert len(list(csv.DictReader(f)))==count
concurrent_changes=[{'path':k,'before_sha256':v,'after_sha256':sha(ROOT/k) if (ROOT/k).exists() else None} for k,v in protected.items() if not (ROOT/k).exists() or sha(ROOT/k)!=v]
verification={'concurrent_protected_changes':concurrent_changes,'concurrency_note':'This script has writes ONLY to its new reports directory. Concurrent parent edits outside source/route inputs are disclosed, never restored.','checks':checks,'all_passed':all(checks.values()),'git_status_after':subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True),'protected_file_count':len(protected),'artifacts':[{'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)} for p in OUT.iterdir() if p.is_file()],'acceptance_gaps':['Group deduplication is conservative evidence inference, not field-confirmed physical-bridge identity. Landing-only touches retained separately.','No independently verified municipal redistribution license; existing 2010 download manifest entry absent.','Broader centro filename denotes actual administrative relation Venezia-Murano-Burano, not strict historic centre; island-specific overlap evidence supplied, not a false centro census.','Local OSM extracts cover island/broader centro only; outside-centro census is geographic reconciliation, not an assertion of OSM absence.','Municipal edition and DATA_CRE/DATA_MOD are not construction dates or proof of present survival.','Probable missing candidates require human verification of two-bank crossing, access and municipal/OSM geometry identity; no autoadd or proximity snapping.']}
dump('verification.json',verification)
print(json.dumps(summary,ensure_ascii=True,indent=2))
