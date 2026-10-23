"""Church inventory and route acceptance tests (written before generator)."""
import importlib.util
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

import networkx as nx
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'pipeline'))


def module():
    assert importlib.util.find_spec('venice.s11_church_route'), 'church generator feature missing'
    from venice import s11_church_route
    return s11_church_route


def test_list_parser_preserves_demolition_context_and_unlinked_mentions():
    m = module()
    text = "== Venezia storica ==\n=== Cannaregio ===\n* [[Chiesa A|A]]\n=== Chiese demolite ===\n* [[Chiesa B|B]]\n=== Castello ===\n* [[Chiesa C]]\n== Laguna sud ==\n=== Poveglia ===\n* San Vitale\n== Terraferma veneziana ==\n=== Mestre ===\n* [[Chiesa D]]"
    rows = m.parse_list(text, 'it')
    assert [(r['title'], r['area'], r['listed_demolished'], r['mainland']) for r in rows] == [
        ('Chiesa A', 'Cannaregio', False, False), ('Chiesa B', 'Cannaregio', True, False),
        ('Chiesa C', 'Castello', False, False), ('San Vitale', 'Poveglia', False, False),
        ('Chiesa D', 'Mestre', False, True)]


def test_identity_merge_deduplicates_qid_not_nearby_temples():
    m = module()
    rows = [{'qid':'Q1','title':'A','sources':['list'],'lon':12.3,'lat':45.4},
            {'qid':'Q1','title':'Alias A','sources':['category'],'lon':12.3,'lat':45.4},
            {'qid':'Q2','title':'B','sources':['category'],'lon':12.30001,'lat':45.4}]
    merged = m.merge_candidates(rows)
    assert len(merged) == 2
    assert merged[0]['sources'] == ['category', 'list']


def test_local_coordinate_origin_and_north_sign():
    m = module()
    assert m.local_coordinates(12.3387,45.4340) == pytest.approx([0,0], abs=.001)
    assert m.local_coordinates(12.3387,45.435)[1] < 0


def test_order_is_deterministic_complete_and_groups_islands():
    m = module()
    rows = [{'id':'b','area':'Murano','lon':12.35,'lat':45.46},
            {'id':'a','area':'Cannaregio','lon':12.32,'lat':45.44},
            {'id':'c','area':'Murano','lon':12.36,'lat':45.46}]
    ordered = m.order_stops(rows)
    assert [s['id'] for s in ordered] == ['a','b','c']
    assert m.order_stops(list(reversed(rows))) == ordered


def test_real_network_path_and_disconnected_schematic_without_length():
    m = module()
    graph = nx.Graph()
    graph.add_edge(1,2,weight=10)
    graph.add_edge(2,3,weight=12)
    nodes = {1:(12.3,45.4),2:(12.3001,45.4001),3:(12.3002,45.4),4:(12.4,45.5)}
    a = {'id':'a','lon':12.3,'lat':45.4,'node':1,'area':'Castello'}
    b = {'id':'b','lon':12.3002,'lat':45.4,'node':3,'area':'Castello'}
    c = {'id':'c','lon':12.4,'lat':45.5,'node':4,'area':'Murano'}
    segments = m.make_segments([a,b,c], graph, nodes)
    assert segments[0]['mode'] == 'walk'
    assert segments[0]['geometry'] == [list(nodes[n]) for n in (1,2,3)]
    assert segments[0]['length_m'] == 22
    assert segments[1]['mode'] == 'schematic'
    assert segments[1]['geometry_semantics'] == 'schematic_non_navigational_connector'
    assert 'length_m' not in segments[1]


def test_validation_rejects_unresolved_and_fake_walk_geometry():
    m = module()
    with pytest.raises(ValueError, match='unresolved'):
        m.validate_route({'stops':[], 'segments':[], 'audit':{'unresolved':[{'title':'X'}]}})
    with pytest.raises(ValueError, match='walk'):
        m.validate_route({'stops':[{'id':'a'},{'id':'b'}], 'segments':[{'from':'a','to':'b','mode':'walk','geometry_semantics':'non_navigational_connector'}], 'audit':{'unresolved':[]}})


def test_gpx_keeps_network_tracks_separate_from_schematic_routes():
    m = module()
    route = {'title':{'en':'Churches'},'stops':[{'id':'a','lon':12.3,'lat':45.4,'name':{'en':'A'},'wikipedia':'https://it.wikipedia.org/wiki/A','access_note':{'en':'Exterior'}}],
             'segments':[{'from':'a','to':'b','mode':'schematic','geometry':[[12.3,45.4],[12.4,45.5]]}]}
    root = ET.fromstring(m.gpx_document(route))
    ns = {'g':'http://www.topografix.com/GPX/1/1'}
    assert len(root.findall('g:wpt',ns)) == 1
    assert not root.findall('g:trk',ns)
    assert 'SCHEMATIC' in root.find('g:rte/g:name',ns).text


def test_category_traversal_handles_cycles_and_pagination():
    m = module()
    pages = {('Category:Churches',None):{'query':{'categorymembers':[{'ns':14,'title':'Category:Islands'},{'ns':0,'title':'Church A'}]},'continue':{'cmcontinue':'next'}},
             ('Category:Churches','next'):{'query':{'categorymembers':[{'ns':0,'title':'Church B'}]}},
             ('Category:Islands',None):{'query':{'categorymembers':[{'ns':14,'title':'Category:Churches'},{'ns':0,'title':'Church C'}]}}}
    rows, categories = m.category_inventory('en',['Category:Churches'],lambda cat,cont:pages[(cat,cont)])
    assert {r['title'] for r in rows} == {'Church A','Church B','Church C'}
    assert len(categories) == 2


def test_cached_api_preserves_raw_source_without_network(tmp_path):
    m = module()
    params = {'action':'query','titles':'A'}
    url = 'https://it.wikipedia.org/w/api.php'
    key = m.cache_key(url, params)
    (tmp_path/key).write_text('{"query":{"pages":[]}}',encoding='utf-8')
    assert m.cached_api(url,params,tmp_path) == {'query':{'pages':[]}}


def test_segment_semantics_and_labels_match_live_ui_contract():
    m = module()
    graph = nx.Graph()
    graph.add_edge(1, 2, weight=10)
    nodes = {1:(12.3,45.4), 2:(12.31,45.4)}
    stops = [{'id':'a','lon':12.3,'lat':45.4,'node':1,'area':'Castello'},
             {'id':'b','lon':12.31,'lat':45.4,'node':2,'area':'Castello'},
             {'id':'c','lon':12.4,'lat':45.5,'area':'Murano'}]
    walking, schematic = m.make_segments(stops, graph, nodes)
    assert 'verified' in walking['geometry_semantics']
    assert 'schematic' in schematic['geometry_semantics']
    assert all(schematic['suggested_transport'].get(k) for k in ('ru','it','en'))


def test_inventory_retains_unknown_in_audit_and_ignores_blank_demolition():
    m = module()
    records = [{'title':'Chiesa A','lang':'it','qid':'Q1','canonical_title':'Chiesa A',
                'area':'Castello','sources':['it_list'],'missing':False,'listed_demolished':False,
                'coordinate':[{'lat':45.44,'lon':12.34}], 'text':'|Demolizione = \n|Sito = \nLa chiesa è aperta.', 'description':'church'},
               {'title':'Unknown chapel','lang':'it','area':'Castello','sources':['it_list'],
                'missing':True,'coordinate':[],'text':'','description':''}]
    inventory, audit = m.build_inventory(records, {})
    assert len(inventory) == 1
    assert len(audit['unresolved']) == 1
    assert audit['candidate_count'] == 2
    assert audit['included_count'] + audit['excluded_count'] + audit['duplicate_count'] + len(audit['unresolved']) == 2


def test_known_island_mentions_use_building_geometry_not_wrong_parent():
    m = module()
    records = [{'title':'San Francesco del Deserto','canonical_title':'San Francesco del Deserto','lang':'en','qid':'Q281139','area':'San Francesco del Deserto','sources':['en_list'],'missing':False,'coordinate':[{'lat':45.4731,'lon':12.4169}], 'description':'island','text':'monastery'},
               {'title':'Oratorio di Santa Barbara (Burano)','lang':'it','area':'Burano','sources':['it_list'],'missing':True,'coordinate':[],'text':'','description':''}]
    osm = [{'type':'way','id':75935317,'center':{'lat':45.4735768,'lon':12.4171872},'tags':{'name':'Chiesa San Francesco del Deserto'}},
           {'type':'way','id':176657686,'center':{'lat':45.484232,'lon':12.4183111},'tags':{'name':'Cappella di Santa Barbara','wikidata':'Q96097398'}}]
    stops, audit = m.build_inventory(records, {}, osm)
    assert len(stops) == 2
    assert not audit['unresolved']
    assert next(s for s in stops if s['area']=='San Francesco del Deserto')['lon'] == 12.4171872
    assert next(s for s in stops if s['area']=='Burano')['qid'] != 'Q96097398', 'OSM chapel tag incorrectly identifies the campanile'


def test_inventory_keeps_surviving_chapel_not_demolished_parent():
    m = module()
    records = [{'qid':'Q3585424','title':'Chiesa di Santa Maria dei Servi (Venezia)','lang':'it','canonical_title':'Chiesa di Santa Maria dei Servi (Venezia)',
                'label':'Volto Santo','area':'Cannaregio','sources':['it_list'],'listed_demolished':False,'mainland':False,'missing':False,
                'coordinate':[{'lat':45.4441,'lon':12.3306}],'description':'church','text':'La chiesa venne distrutta e se ne conservò la cappella del Volto Santo.'}]
    inventory, audit = m.build_inventory(records, {})
    assert len(inventory)==1
    assert 'Volto Santo' in inventory[0]['name']['it']
    assert inventory[0]['survival_status'] == 'surviving_chapel'
    assert not audit['unresolved']


def test_generated_partial_artifact_geometry_and_disclosure():
    m = module()
    data = json.loads((ROOT/'web/data/church-route.json').read_text(encoding='utf-8'))
    m.validate_route(data, allow_incomplete=True)
    audit = data['audit']
    assert audit['candidate_count'] == audit['included_count'] + audit['excluded_count'] + audit['duplicate_count'] + len(audit['unresolved'])
    assert sum(r['source_rows'] for r in audit['reconciliation']) == audit['candidate_count']
    assert audit['inventory_complete'] == (not audit['unresolved'])
    assert len(data['stops']) >= 140
    assert sum(s['confession']=='Jewish' for s in data['stops']) == 5
    assert {'San Lazzaro degli Armeni','Murano','Burano','Torcello','Lido','Pellestrina','San Francesco del Deserto','Sacca Sessola'} <= {s['area'] for s in data['stops']}
    assert all(all(s['name'].get(k) and s['access_note'].get(k) for k in ('ru','it','en')) for s in data['stops'])
    assert all(s['local'] == pytest.approx(m.local_coordinates(s['lon'],s['lat']),abs=.02) for s in data['stops'])
    assert all(all(n.get(k) for k in ('ru','it','en')) for n in audit['limitations'])
    if audit['unresolved']:
        assert 'incomplete' in data['summary']['en'].lower()
        with pytest.raises(ValueError, match='unresolved'):
            m.validate_route(data)
    graph, nodes, _ = m.load_pedestrian_network()
    for s in data['segments']:
        if s['mode']=='walk':
            assert s['geometry'] == [list(nodes[n]) for n in s['osm_nodes']]
            assert all(graph.has_edge(u,v) for u,v in zip(s['osm_nodes'],s['osm_nodes'][1:]))
            assert s['length_m'] == pytest.approx(sum(graph[u][v]['weight'] for u,v in zip(s['osm_nodes'],s['osm_nodes'][1:])),abs=.011)
        else:
            assert s['mode']=='schematic' and 'schematic' in s['geometry_semantics']
            assert 'length_m' not in s
    ns = {'g':'http://www.topografix.com/GPX/1/1'}
    gpx = ET.parse(ROOT/'web/data/church-route.gpx')
    assert len(gpx.findall('g:wpt',ns)) == len(data['stops'])
    assert 'incomplete' in gpx.find('g:metadata/g:desc',ns).text.lower()
    assert len(gpx.findall('g:trk',ns)) == sum(s['mode']=='walk' for s in data['segments'])
    assert len(gpx.findall('g:rte',ns)) == sum(s['mode']=='schematic' for s in data['segments'])


def test_generated_artifact_reconciles_every_candidate_and_required_islands():
    m = module()
    path = ROOT/'web/data/church-route.json'
    assert path.exists(), 'generated artifact missing'
    data = json.loads(path.read_text(encoding='utf-8'))
    m.validate_route(data)
    assert data['status'] == 'ready'
    assert len(data['stops']) >= 140
    assert not data['audit']['unresolved']
    audit = data['audit']
    assert audit['candidate_count'] == audit['included_count'] + audit['excluded_count'] + audit['duplicate_count']
    assert audit['included_count'] == len(data['stops'])
    assert {'San Lazzaro degli Armeni','Murano','Burano','Torcello','Lido','Pellestrina'} <= {s['area'] for s in data['stops']}
    assert any(s.get('confession') == 'Jewish' for s in data['stops'])
    for s in data['stops']:
        assert all(s['name'].get(k) and s['access_note'].get(k) for k in ('ru','it','en'))
        assert s['wikipedia'].startswith(('https://it.wikipedia.org/wiki/','https://en.wikipedia.org/wiki/'))
        assert 12 < s['lon'] < 12.6 and 45.2 < s['lat'] < 45.6
        assert s['local'] == pytest.approx(m.local_coordinates(s['lon'],s['lat']),abs=.02)
    assert len(data['segments']) == len(data['stops'])-1
    assert not any(s.get('day') for s in data['stops'])
    assert not any(s['mode']=='boat' for s in data['segments']), 'boat geometry needs independent proof'
