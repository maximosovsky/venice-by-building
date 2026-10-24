"""Supplementary source context; only writes new reports files, never modifies census."""
import json,csv,hashlib
from pathlib import Path
from collections import Counter
import osmium
from shapely.geometry import shape,LineString,Polygon,Point
from shapely.ops import transform,unary_union
from shapely.strtree import STRtree
from pyproj import Transformer
O=Path(__file__).resolve().parent; R=Path('D:/100_star/venice')
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
t=Transformer.from_crs(4326,32633,always_xy=True)
rows=load(O/'municipal-census.json'); candidates=load(O/'review-candidates.json'); groups=load(O/'physical-groups.json'); route=load(R/'web/data/bridge-route.json')
nodes={}; ways={}
class Read(osmium.SimpleHandler):
 def node(self,n): nodes[n.id]=(n.location.lon,n.location.lat)
 def way(self,w):
  if len(w.tags): ways[w.id]={'id':w.id,'tags':dict(w.tags),'nodes':[n.ref for n in w.nodes]}
h=Read()
for f in ['venezia_historic_centre.osm.pbf','venezia_island.osm.pbf']:h.apply_file(str(R/'data/raw/osm'/f))
geoms={}
for wid,w in ways.items():
 if len(w['nodes'])<2 or any(n not in nodes for n in w['nodes']):continue
 cs=[t.transform(*nodes[n]) for n in w['nodes']]
 if cs[0]==cs[-1] and len(cs)>3:
  g=Polygon(cs);geoms[wid]=g if g.is_valid else g.buffer(0)
 else:geoms[wid]=LineString(cs)
keys=sorted(geoms);tree=STRtree([geoms[k] for k in keys])
excluded={e['id']:e for e in route['excluded']}
review=[]
for c in candidates:
 g=unary_union([transform(t.transform,shape(rows[int(s.split('fID')[1])]['source_geometry_wgs84'])) for s in c['municipal_ids']])
 nearby=[]
 for idx in tree.query(g.buffer(15)):
  wid=keys[int(idx)]; gg=geoms[wid]; gap=g.distance(gg)
  if gap>15:continue
  w=ways[wid];tags=w['tags']
  if not any(k in tags for k in ['highway','building','building:part','bridge','man_made','waterway','natural','name']):continue
  nearby.append({'osm_way_id':wid,'url':f'https://www.openstreetmap.org/way/{wid}','distance_m':round(gap,3),'geometry_type':gg.geom_type,'overlap_area_m2':round(g.intersection(gg).area,3),'overlap_length_m':round(g.intersection(gg).length,3),'tags':tags,'original_node_ids':w['nodes']})
 nearby.sort(key=lambda a:(a['distance_m'],a['osm_way_id']))
 ids=c['strong_osm_identities']; reasons=[excluded[b]['reason_code'] for b in ids if b in excluded]
 nonfoot=any(a['tags'].get('name')=='Ponte della Libertà' for a in c['osm_deck_evidence'])
 if nonfoot or reasons and set(reasons)=={'peripheral_port_transport'}:final='osm_known_port_transport_not_route_required'; priority=4
 elif c['status']=='ambiguous_osm_identity':final='ambiguous_identity_review';priority=2
 elif c['status']=='osm_known_unresolved':final='known_osm_deck_unresolved_public_connectivity';priority=3
 else:final='candidate_missing_osm_bridge_identity_unconfirmed';priority=3
 review.append({**c,'final_classification':final,'final_priority':priority,'known_exclusion_reasons':reasons,'nearby_source_evidence_15m':nearby,'context_warning':'15 m neighbourhood is evidence search only, NEVER identity matching, node snapping or a new graph connector.'})
review.sort(key=lambda a:(a['final_priority'],a['group_id']))
for i,c in enumerate(review,1):c['final_review_order']=i
with (O/'review-candidates-enriched.json').open('x',encoding='utf-8') as f:json.dump(review,f,ensure_ascii=False,indent=2)
compact=[]
for c in review:compact.append({k:c[k] for k in ['final_review_order','group_id','municipal_ids','lon','lat','status','final_classification','final_priority','strong_osm_identities','known_exclusion_reasons','decision']})
with (O/'review-candidates-enriched.csv').open('x',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(compact[0]));w.writeheader()
 for c in compact:w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,list) else v for k,v in c.items()})
# Explicit geographic partition and exclusion reason census, all labels from actual source tags.
island=[]
for r in rows:
 evid=[e for e in r['named_island_evidence'] if e['name']!='Venezia' and not e['name'].startswith('unnamed')]
 if r['scope_zone'] in ['route_inside','route_boundary_ambiguous']:label='current_route_geographic_population'
 elif evid:label=max(evid,key=lambda e:e['municipal_overlap_fraction'])['name']
 else:label='outside_route_no_named_island_identity_proven'
 island.append({'municipal_id':r['municipal_id'],'scope_zone':r['scope_zone'],'island_partition_label':label,'named_island_evidence':evid})
with (O/'island-partition.json').open('x',encoding='utf-8') as f:json.dump(island,f,ensure_ascii=False,indent=2)
summary={'all_source_rows':len(rows),'island_partition_row_counts':dict(Counter(r['island_partition_label'] for r in island)),'enriched_review_counts':dict(Counter(c['final_classification'] for c in review)),'excluded_municipal_row_reasons':dict(Counter(excluded[r['strong_osm_identities'][0]]['reason_code'] for r in rows if r['status']=='osm_known_excluded')),'outside_route_osm_coverage_not_claimed':True,'confirmed_probable_missing':0,'rejected_false_positive':{'municipal_id':'PONTE2010:fID000226','osm_way_id':240496222,'reason':'area=yes closed pedestrian square boundary, not a mapped bridge crossing; 2.1073m overlap does not prove a two-bank bridge.'},'broader_boundary_name':'Venezia-Murano-Burano administrative municipalita (relation/6628638, admin_level=10)','source_context_checks':{'review_count_14':len(review)==14,'all_1259_island_rows':len(island)==1259,'unique_ids':len({r['municipal_id'] for r in island})==1259,'no_autoadd':all(c['decision']=='review_only_no_autoadd' for c in review)}}
assert all(summary['source_context_checks'].values())
with (O/'context-summary.json').open('x',encoding='utf-8') as f:json.dump(summary,f,ensure_ascii=False,indent=2)
print(json.dumps(summary,ensure_ascii=True,indent=2))
print('candidate context',json.dumps([{'id':c['group_id'],'nearby_count':len(c['nearby_source_evidence_15m']),'nearest':c['nearby_source_evidence_15m'][:3]} for c in review],ensure_ascii=True)[:18000])
