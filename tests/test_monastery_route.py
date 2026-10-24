"""Monastery expansion acceptance, written before implementation."""
import json,sys,math,xml.etree.ElementTree as ET
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'pipeline'))
from venice import s11_church_route as m

def candidate(identity='monastery-Q1', church=None, area='Castello'):
    return {'id':identity,'name':m.translated('Convent','Convento','Монастырь'),'qid':'Q1','church_stop_id':church,'area':area,'lon':12.34,'lat':45.44,'wikipedia':'https://it.wikipedia.org/wiki/Convento','survival_evidence':'The convent survives, adapted as a school.','decision':'include','survival_status':'adapted_building','osm_buildings':[]}

def test_reviewed_surviving_monastery_is_added_as_exterior_stop():
    assert hasattr(m,'expand_monasteries'), 'monastery expansion feature missing'
    stops,audit=m.expand_monasteries([], [candidate()])
    assert len(stops)==1 and stops[0]['kind']=='monastery'
    assert stops[0]['local']==m.local_coordinates(12.34,45.44)
    assert audit['new_stop_count']==1

def test_colocated_complex_is_annotated_not_counted_twice():
    assert hasattr(m,'expand_monasteries'), 'monastery expansion feature missing'
    church={'id':'church','qid':'Q2','name':m.translated('Church','Chiesa','Церковь'),'access_note':m.translated('Exterior','Esterno','Снаружи')}
    stops,audit=m.expand_monasteries([church],[candidate(church='church')])
    assert len(stops)==1 and len(stops[0]['monasteries'])==1
    assert stops[0]['monastery_qids']==['Q1']
    assert 'Convent' in stops[0]['access_note']['en']
    assert audit['merged_complex_count']==1

def test_island_and_explicit_church_exclusions_cannot_be_reintroduced_as_aliases():
    assert hasattr(m,'expand_monasteries'), 'monastery expansion feature missing'
    rows=[candidate(church=next(iter(m.USER_EXCLUDED_NO_ATLAS_GEOMETRY))),candidate(identity='another',area='Murano')]
    stops,audit=m.expand_monasteries([],rows)
    assert not stops and len(audit['excluded'])==2

def test_separate_monastery_building_is_not_proximity_merged():
    assert hasattr(m,'expand_monasteries'), 'monastery expansion feature missing'
    stops,audit=m.expand_monasteries([{'id':'church'}],[candidate()])
    assert len(stops)==2

def test_exact_monastery_ids_can_extend_whole_building_manifest_without_qid_guess():
    from venice import church_building_manifest as b
    assert hasattr(b,'building_match'), 'monastery exact-ID matcher missing'
    stop=candidate();stop['osm_buildings']=[{'osm_type':'way','osm_id':10,'evidence':'Wikipedia describes surviving Convento; OSM exact named Convento way/10'}]
    p={'osm_type':'way','osm_id':10,'wikidata':'wrong'}
    match=b.building_match(p,[stop]);assert match['stop_id']==stop['id']
    assert match['match_source']=='reviewed_exact_osm_building_identity'
    assert b.building_match({'osm_type':'way','osm_id':11},[stop]) is None

def test_real_expanded_artifacts_preserve_scope_continuity_and_network():
    data=json.loads((ROOT/'web/data/church-route.json').read_text(encoding='utf8'))
    assert 'monasteries' in data['audit'], 'expanded artifact missing'
    audit=data['audit']['monasteries']; assert audit['new_stop_count']>=4
    ids=[s['id'] for s in data['stops']]
    assert not set(ids)&m.USER_EXCLUDED_NO_ATLAS_GEOMETRY
    assert not {s['area'] for s in data['stops']}&{'Murano','Torcello','Lido','San Servolo','San Lazzaro degli Armeni'}
    assert len(data['audit']['unresolved'])==7
    assert all('monaster' in data['title'][l].lower() or 'монастыр' in data['title'][l].lower() for l in ['en','it','ru'])
    m.validate_route(data,allow_incomplete=True)
    graph,nodes,_=m.load_pedestrian_network()
    for s in data['segments']:
        if s['mode']=='walk':
            assert all(graph.has_edge(a,b) for a,b in zip(s['osm_nodes'],s['osm_nodes'][1:]))
            assert math.isclose(s['length_m'],sum(graph[a][b]['weight'] for a,b in zip(s['osm_nodes'],s['osm_nodes'][1:])),abs_tol=.011)
            assert s['geometry']==[list(nodes[n]) for n in s['osm_nodes']]
    gpx=ET.parse(ROOT/'web/data/church-route.gpx');ns={'g':'http://www.topografix.com/GPX/1/1'}
    assert len(gpx.findall('g:wpt',ns))==len(ids)
    manifest=json.loads((ROOT/'web/data/church-buildings.json').read_text(encoding='utf8'))
    assert manifest['inventory_stops']==len(ids)
    assert any(b['osm_id']==138800498 for b in manifest['buildings']), 'verified San Giorgio monastery full volume missing'
