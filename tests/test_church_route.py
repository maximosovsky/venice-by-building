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
    assert not stops and not audit['unresolved']
    assert {r['reason'] for r in audit['excluded']} == {'user_excluded_no_atlas_geometry'}


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


def test_verified_followup_mentions_merge_without_generic_qids():
    m = module()
    records = [{'title':t, 'lang':lang, 'area':area, 'sources':[lang+'_list'],
                'missing':True, 'coordinate':[], 'text':'', 'description':''}
               for t,lang,area in [('oratorio di Cristo Re','it','Castello'),
                                    ('Cristo Re, Venice','en','Castello'),
                                    ('Chiesa di Santa Maria del Soccorso (Venezia)','it','Dorsoduro'),
                                    ('Santa Maria del Soccorso, Venice','en','Dorsoduro'),
                                    ('Chiesa di Santa Maria delle Grazie (Burano)','it','Burano')]]
    osm = [{'type':'way','id':582322560,'center':{'lat':45.4380991,'lon':12.3493237},'tags':{'name':'Chiesa di Cristo Re alla Celestia','wikidata':'Q385975'}},
           {'type':'way','id':176657496,'center':{'lat':45.4838241,'lon':12.4172199},'tags':{'name':'Chiesa di Santa Maria delle Grazie'}}]
    stops,audit = m.build_inventory(records, {}, osm)
    assert len(stops) == 2
    assert not audit['unresolved']
    assert audit['duplicate_count'] == 2
    assert all(s.get('survival_evidence') for s in stops)
    assert not any(s['qid']=='Q385975' for s in stops), 'Do not adopt an independently unverified OSM QID'


def test_poveglia_disambiguation_is_resolved_as_demolished_church():
    m = module()
    records = [{'title':'San Vitale','qid':'Q18427208','lang':'it','area':'Poveglia',
                'sources':['it_list'],'missing':False,'coordinate':[], 'text':'{{Disambigua}}','description':'disambiguation'}]
    stops,audit=m.build_inventory(records,{})
    assert not stops and not audit['unresolved']
    assert audit['excluded'][0]['reason']=='demolished'
    assert 'Poveglia' in audit['excluded'][0]['evidence']
    assert audit['excluded'][0]['identity'] != 'Q18427208'


def test_san_cristoforo_is_not_a_surviving_cemetery_temple():
    m=module()
    stops,audit=m.build_inventory([{'title':'San Cristoforo di Venezia','lang':'en','area':'San Michele','sources':['en_list'],'missing':True,'coordinate':[]}],{})
    assert not stops and not audit['unresolved']
    assert audit['excluded'][0]['reason']=='demolished'


def test_san_teodoro_retains_the_surviving_renaissance_chapel():
    m=module()
    records=json.loads((ROOT/'data/processed/church_research/resolved.json').read_text(encoding='utf-8'))
    entities=json.loads((ROOT/'data/processed/church_research/entities.json').read_text(encoding='utf-8'))
    rows=[r for r in records if r.get('qid')=='Q119156487']
    assert '1486' in rows[0]['text'] and 'restaurata nel 1961' in rows[0]['text']
    stops,audit=m.build_inventory(rows,entities)
    assert len(stops)==1 and not audit['unresolved']
    assert stops[0]['survival_status']=='surviving_chapel'
    assert stops[0]['access_class']=='restricted'
    assert 'canonica' in stops[0]['survival_evidence']


def test_generic_lido_entities_never_become_building_identities():
    m=module()
    records=[{'title':t,'qid':q,'lang':'it','area':'Lido','sources':['it_list'],
              'missing':False,'coordinate':[],'text':'','description':'generic entity'}
             for t,q in [('Santa Maria Nascente','Q501107'),('San Giuseppe','Q128267')]]
    stops,audit=m.build_inventory(records,{})
    assert not stops and len(audit['unresolved'])==2
    assert {r['identity'] for r in audit['unresolved']} == {'mention-nascente-lido','mention-san-giuseppe-lido'}


def test_generated_partial_artifact_geometry_and_disclosure():
    m = module()
    data = json.loads((ROOT/'web/data/church-route.json').read_text(encoding='utf-8'))
    m.validate_route(data, allow_incomplete=True)
    audit = data['audit']
    assert audit['candidate_count'] == audit['included_count'] + audit['excluded_count'] + audit['duplicate_count'] + len(audit['unresolved'])
    assert sum(r['source_rows'] for r in audit['reconciliation']) == audit['candidate_count']
    assert audit['inventory_complete'] == (not audit['unresolved'])
    assert len(data['stops']) == 134
    assert sum(s['confession']=='Jewish' for s in data['stops']) == 5
    assert not {'San Lazzaro degli Armeni','San Servolo','San Clemente','Murano','Burano','Torcello','San Francesco del Deserto','Sacca Sessola'} & {s['area'] for s in data['stops']}
    assert all(all(s['name'].get(k) and s['access_note'].get(k) for k in ('ru','it','en')) for s in data['stops'])
    assert all(s['local'] == pytest.approx(m.local_coordinates(s['lon'],s['lat']),abs=.02) for s in data['stops'])
    assert all(all(n.get(k) for k in ('ru','it','en')) for n in audit['limitations'])
    if audit['unresolved']:
        # Владелец атласа убрал оговорку о неполноте из карточки маршрута: она осталась в аудите,
        # в отчёте и в описании GPX, а неполный артефакт по-прежнему не проходит строгую проверку.
        assert len(audit['unresolved']) > 0
        assert 'incomplete' in (ROOT/'web/data/church-route.gpx').read_text(encoding='utf-8').lower()
        with pytest.raises(ValueError, match='unresolved'):
            m.validate_route(data)
    graph, nodes, _ = m.load_pedestrian_network()
    for s in data['segments']:
        if s['mode']=='walk':
            assert s['geometry'] == [list(nodes[n]) for n in s['osm_nodes']]
            assert all(graph.has_edge(u,v) for u,v in zip(s['osm_nodes'],s['osm_nodes'][1:]))
            assert s['length_m'] == pytest.approx(sum(graph[u][v]['weight'] for u,v in zip(s['osm_nodes'],s['osm_nodes'][1:])),abs=.011)
        elif s['mode']=='boat':
            # Водный переход — проверенное ребро трагетто из аудированных данных мостового маршрута.
            assert s['geometry_semantics'] == 'verified_traghetto_service_crossing'
            assert s['traghetto_ids'] and all(fid for fid in s['traghetto_ids'])
            assert len(s['geometry']) >= 2 and all(len(point)==2 for point in s['geometry'])
        else:
            assert s['mode']=='schematic' and 'schematic' in s['geometry_semantics']
            assert 'length_m' not in s
    ns = {'g':'http://www.topografix.com/GPX/1/1'}
    gpx = ET.parse(ROOT/'web/data/church-route.gpx')
    assert len(gpx.findall('g:wpt',ns)) == len(data['stops'])
    assert 'incomplete' in gpx.find('g:metadata/g:desc',ns).text.lower()
    assert len(gpx.findall('g:trk',ns)) == sum(s['mode']=='walk' for s in data['segments'])
    # Схемные переходы и водный переход трагетто пишутся маршрутами (rte); треки (trk) — только пешие участки.
    assert len(gpx.findall('g:rte',ns)) == sum(s['mode'] in ('schematic','boat') for s in data['segments'])


def test_generated_artifact_reconciles_every_candidate_and_required_islands():
    m = module()
    path = ROOT/'web/data/church-route.json'
    assert path.exists(), 'generated artifact missing'
    data = json.loads(path.read_text(encoding='utf-8'))
    m.validate_route(data, allow_incomplete=True)
    assert data['status'] == 'ready'
    assert len(data['stops']) == 134
    assert len(data['audit']['unresolved']) == 7
    audit = data['audit']
    assert audit['candidate_count'] == audit['included_count'] + audit['excluded_count'] + audit['duplicate_count'] + len(audit['unresolved'])
    assert audit['included_count'] == len(data['stops'])
    assert not {'San Lazzaro degli Armeni','San Servolo','San Clemente','Sacca Sessola','Murano','Burano','Torcello'} & {s['area'] for s in data['stops']}
    assert any(s.get('confession') == 'Jewish' for s in data['stops'])
    for s in data['stops']:
        assert all(s['name'].get(k) and s['access_note'].get(k) for k in ('ru','it','en'))
        assert s['wikipedia'].startswith(('https://it.wikipedia.org/wiki/','https://en.wikipedia.org/wiki/'))
        assert 12 < s['lon'] < 12.6 and 45.2 < s['lat'] < 45.6
        assert s['local'] == pytest.approx(m.local_coordinates(s['lon'],s['lat']),abs=.02)
    assert len(data['segments']) == len(data['stops'])-1
    assert not any(s.get('day') for s in data['stops'])
    # Обход считает владелец атласа: старт и финиш на площади Сан-Марко, переход через канал — трагетто.
    # Водный переход допустим только как проверенное ребро трагетто, не как выдуманная линия по воде.
    boats = [s for s in data['segments'] if s['mode']=='boat']
    assert all(s['geometry_semantics']=='verified_traghetto_service_crossing' and s.get('traghetto_ids')
               for s in boats), 'boat geometry needs an audited traghetto crossing'
    assert data['audit']['tour']['start'] == 'piazza_san_marco'
    assert data['stops'][0]['id'] == data['audit']['tour']['start_stop']
    assert data['audit']['tour']['walkable_circuit_m'] > 30000, 'обход всей пешеходной Венеции измеряется в десятках километров'
    assert data['audit']['tour']['island_stops'] == sum(1 for g in data['audit']['tour']['island_groups'] for _ in g['stops'])


USER_APPROVED_ROUTE_EXCLUSIONS = {
    'Q379102', 'Q86664730', 'Q107301282', 'Q3585395', 'Q122152493',
    'Q585738', 'Q122152488', 'Q109466368', 'Q109466355', 'Q109466379',
    'Q109466385', 'Q109466393',
}
PRESERVED_ISLAND_STOPS = {
    'Q1791020', 'Q98781254', 'Q3585324', 'mention-chiesa-sacca-sessola',
}


def test_cached_inventory_excludes_exact_user_approved_route_identities():
    m = module()
    cache = ROOT/'data/processed/church_research'
    records = json.loads((cache/'resolved.json').read_text(encoding='utf-8'))
    entities = json.loads((cache/'entities.json').read_text(encoding='utf-8'))
    osm = {(el['type'], el['id']):el
           for name in ('overpass_worship.json','overpass_buildings.json','overpass_chapels.json')
           for el in json.loads((cache/name).read_text(encoding='utf-8'))['elements']}
    stops, audit = m.build_inventory(records, entities, list(osm.values()))
    ids = {s['id'] for s in stops}
    assert not (ids & USER_APPROVED_ROUTE_EXCLUSIONS)
    assert not PRESERVED_ISLAND_STOPS & ids
    assert len(ids) == audit['included_count'] == 129
    user_excluded = [r for r in audit['excluded']
                     if r['reason'] == 'user_excluded_no_atlas_geometry']
    assert {r['identity'] for r in user_excluded} == m.USER_EXCLUDED_NO_ATLAS_GEOMETRY
    assert len(user_excluded) == len(m.USER_EXCLUDED_NO_ATLAS_GEOMETRY)
    assert all(r['decision'] == 'excluded' and r['evidence'] for r in user_excluded)
    assert (audit['candidate_count'], audit['identity_group_count'],
            audit['excluded_count'], audit['duplicate_count'], len(audit['unresolved'])) == (1196,386,250,810,7)
    assert not audit['inventory_complete']
    assert sum(r['source_rows'] for r in audit['reconciliation']) == 1196
    assert 1196 == len(stops) + audit['excluded_count'] + audit['duplicate_count'] + len(audit['unresolved'])


def test_generated_route_has_150_continuous_stops_and_no_user_excluded_waypoints():
    data = json.loads((ROOT/'web/data/church-route.json').read_text(encoding='utf-8'))
    ids = [s['id'] for s in data['stops']]
    assert len(ids) == len(set(ids)) == 134
    assert not (set(ids) & USER_APPROVED_ROUTE_EXCLUSIONS)
    assert not PRESERVED_ISLAND_STOPS & set(ids)
    assert [(s['from'],s['to']) for s in data['segments']] == list(zip(ids,ids[1:]))
    module().validate_route(data, allow_incomplete=True)
    ns = {'g':'http://www.topografix.com/GPX/1/1'}
    gpx = ET.parse(ROOT/'web/data/church-route.gpx')
    waypoints = gpx.findall('g:wpt',ns)
    assert len(waypoints) == 134
    for i, (wpt, stop) in enumerate(zip(waypoints,data['stops']),1):
        assert wpt.find('g:name',ns).text == f"{i:03d} {stop['name']['en']}"
        assert float(wpt.attrib['lon']) == stop['lon']
        assert float(wpt.attrib['lat']) == stop['lat']
