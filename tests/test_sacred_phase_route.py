"""Explicit owner-approved sacred walk phases and exported geometry contract."""
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'pipeline'))
from venice import s11_church_route as m


def test_frozen_scope_phase_order_closure_and_water_transfers():
    route = json.loads((ROOT/'web/data/church-route.json').read_text(encoding='utf-8'))
    stops, segments = route['stops'], route['segments']
    assert len(stops) == len({s['id'] for s in stops}) == 134
    assert stops[0]['id'] == 'Q172988'
    assert stops[-1]['id'] == 'Q122152456'
    assert [s['phase'] for s in stops] == ['main_venice']*126 + ['san_giorgio'] + ['giudecca']*7
    convertite = next(s for s in stops if s['id']=='Q57981283')
    assert convertite['area']=='Giudecca' and convertite['phase']=='giudecca'
    assert 'giustizia.it' in convertite['area_evidence']
    main = [s for s in segments if s['phase']=='main_venice']
    assert len(main)==126 and all(s['mode']=='walk' for s in main)
    assert main[0]['geometry'][0] == main[-1]['geometry'][-1]
    assert main[-1]['to']=='Q172988' and main[-1]['event']=='return_to_san_marco'
    water = [s for s in segments if s.get('transport_mode')=='water']
    assert [(s['from'],s['to']) for s in water]==[('Q172988','Q713558'),('Q713558',stops[127]['id'])]
    assert all(s['mode']=='schematic' and 'length_m' not in s for s in water)
    assert all(s.get('traghetto_ids') is None for s in segments)
    assert route['audit']['tour']['global_optimum'] is False
    assert route['audit']['tour']['frozen_inventory_count']==134
    m.validate_route(route, allow_incomplete=True)


def test_all_exported_edges_access_adjacency_and_gpx_parity():
    route=json.loads((ROOT/'web/data/church-route.json').read_text(encoding='utf-8'))
    graph,nodes,_=m.load_pedestrian_network()
    for s in route['segments']:
        if s['mode']=='walk':
            assert s['geometry']==[list(nodes[n]) for n in s['osm_nodes']]
            assert all(graph.has_edge(u,v) for u,v in zip(s['osm_nodes'],s['osm_nodes'][1:]))
            assert s['length_m']==pytest.approx(sum(graph[u][v]['weight'] for u,v in zip(s['osm_nodes'],s['osm_nodes'][1:])), abs=.011)
    for a,b in zip(route['segments'],route['segments'][1:]):
        assert a['to']==b['from']
        assert a['geometry'][-1]==b['geometry'][0]
    ns={'g':'http://www.topografix.com/GPX/1/1'}
    gpx=ET.parse(ROOT/'web/data/church-route.gpx').getroot()
    legs=[el for el in gpx if el.tag.rsplit('}',1)[-1] in ('trk','rte')]
    assert len(legs)==len(route['segments'])
    assert len(gpx.findall('g:wpt',ns))==134
    for leg,segment in zip(legs,route['segments']):
        pts=leg.findall('.//g:trkpt',ns) if segment['mode']=='walk' else leg.findall('g:rtept',ns)
        assert [[float(p.attrib['lon']),float(p.attrib['lat'])] for p in pts]==segment['geometry']


def test_unknown_outer_island_fails_instead_of_silent_scope_change():
    with pytest.raises(ValueError,match='outside requested phases'):
        m.classify_route_phases([{'id':'outer','area':'Murano'}])
