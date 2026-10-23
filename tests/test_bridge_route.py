"""TDD and independent checks for the all-public-bridges data contract."""
import importlib.util
import json
import math
import sys
from collections import Counter
from pathlib import Path
import xml.etree.ElementTree as ET

import networkx as nx
import pytest
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]


def stage():
    path = ROOT / 'pipeline/venice/s10_bridge_route.py'
    assert path.exists(), 'Bridge-route generator is not implemented'
    sys.path.insert(0, str(ROOT / 'pipeline'))
    spec = importlib.util.spec_from_file_location('bridge_route', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.mark.parametrize('tags,allowed', [
    ({'highway': 'steps'}, True),
    ({'highway': 'footway', 'access': 'private'}, False),
    ({'highway': 'footway', 'access': 'no', 'foot': 'yes'}, True),
    ({'highway': 'footway', 'foot': 'no'}, False),
    ({'highway': 'service', 'access': 'customers'}, False),
    ({'highway': 'motorway'}, False),
    ({'highway': 'cycleway'}, False),
    ({'highway': 'cycleway', 'foot': 'yes'}, True),
    ({'route': 'ferry', 'foot': 'yes'}, False),
    ({'highway': 'construction', 'foot': 'yes'}, False),
    ({'highway': 'footway', 'access:conditional': 'no @ (Mo-Fr)'}, False),
    ({'highway': 'footway', 'opening_hours': '09:00-17:00'}, False),
])
def test_public_access_policy(tags, allowed):
    assert stage().access_reason(tags) is None if allowed else stage().access_reason(tags) is not None


def test_connected_split_bridge_ways_form_one_crossing():
    mod = stage()
    nodes = {1: (12.33, 45.43), 2: (12.3301, 45.43), 3: (12.3302, 45.43),
             4: (12.3303, 45.43), 5: (12.3304, 45.43)}
    ways = [dict(id=10, nodes=[1, 2], tags={'highway': 'footway'}),
            dict(id=11, nodes=[2, 3], tags={'highway': 'steps', 'bridge': 'yes', 'name': 'Ponte Test'}),
            dict(id=12, nodes=[3, 4], tags={'highway': 'steps', 'bridge': 'yes', 'name': 'Ponte Test'}),
            dict(id=13, nodes=[4, 5], tags={'highway': 'footway'})]
    g, bridges, audit = mod.build_topology(nodes, ways, {}, None)
    assert len(bridges) == 1
    assert set(bridges[0]['way_ids']) == {11, 12}
    assert nx.has_path(g, 1, 5)


def test_even_bridge_cycle_needs_no_repeated_crossing():
    m = stage()
    g = nx.MultiGraph()
    for i, (u, v) in enumerate([(0, 1), (1, 2), (2, 0)]):
        g.add_edge(u, v, key=str(i), bridge_id=str(i), length=10)
    route, odd, repeats = m.postman(g, 0)
    assert odd == []
    assert repeats == 0
    assert len(route) == 3
    assert route[0][0] == route[-1][1] == 0


def test_odd_bridge_chain_needs_each_edge_twice():
    m = stage()
    g = nx.MultiGraph()
    g.add_edge(0, 1, key='a', bridge_id='a', length=10)
    g.add_edge(1, 2, key='b', bridge_id='b', length=20)
    route, odd, repeats = m.postman(g, 0)
    assert len(odd) == 2
    assert repeats == 2
    assert Counter(x[2] for x in route) == {'a': 2, 'b': 2}
    assert all(a[1] == b[0] for a, b in zip(route, route[1:]))


def test_postman_disconnected_required_bridges_are_rejected():
    m = stage()
    g = nx.MultiGraph()
    g.add_edge(0, 1, key='a', bridge_id='a', length=1)
    g.add_edge(2, 3, key='b', bridge_id='b', length=1)
    with pytest.raises(ValueError, match='disconnected'):
        m.postman(g, 0)


def test_deck_merges_parallel_walks_without_counting_two_bridges():
    m = stage()
    from shapely.geometry import Polygon
    nodes = {1: (12.33, 45.43), 2: (12.3301, 45.43), 3: (12.3302, 45.43),
             4: (12.3301, 45.43001), 5: (12.3302, 45.43001), 6: (12.3303, 45.43)}
    ways = [dict(id=1, nodes=[1, 2, 4], tags={'highway': 'footway'}),
            dict(id=2, nodes=[2, 3], tags={'highway': 'footway', 'bridge': 'yes'}),
            dict(id=3, nodes=[4, 5], tags={'highway': 'steps', 'bridge': 'yes'}),
            dict(id=4, nodes=[3, 5, 6], tags={'highway': 'footway'})]
    deck = Polygon([(12.33009, 45.429999), (12.33021, 45.429999),
                    (12.33021, 45.430011), (12.33009, 45.430011)])
    _, bridges, _ = m.build_topology(nodes, ways, {}, None, [{'id': 'd99', 'name': '', 'geometry': deck, 'tags': {}}])
    assert len(bridges) == 1


def test_crossing_prefers_connected_land_banks_over_dead_end_spurs():
    m = stage()
    components = [{1, 2, 3}, {4, 5, 6}, {7}]
    component = {n: i for i, bank in enumerate(components) for n in bank}
    choices = [(30, 30, [1, 7]), (20, 20, [1, 4])]
    assert m.select_crossing(choices, component, components)[2] == [1, 4]


def test_distance_aware_order_shortens_transfers_without_changing_edge_multiset():
    m = stage()
    # Two excursions on the same land bank; greedy ordering must strictly
    # shorten transfers while preserving all four oriented bridge possibilities.
    circuit = [(0, 1, 'far-out'), (1, 0, 'far-back'),
               (0, 2, 'near-out'), (2, 0, 'near-back')]
    portals = {('far-out', 0): 90, ('far-out', 1): 1000,
               ('far-back', 1): 1000, ('far-back', 0): 100,
               ('near-out', 0): 10, ('near-out', 2): 2000,
               ('near-back', 2): 2000, ('near-back', 0): 20}
    route, evidence = m.distance_aware_euler_order(
        circuit, 0, lambda bid, bank: portals[bid, bank], lambda a, b: abs(a - b))
    assert evidence['selected_transfer_m'] < evidence['baseline_transfer_m']
    assert Counter((min(u, v), max(u, v), bid) for u, v, bid in route) == Counter(
        (min(u, v), max(u, v), bid) for u, v, bid in circuit)
    assert route[0][0] == route[-1][1] == 0
    assert all(a[1] == b[0] for a, b in zip(route, route[1:]))


def test_distance_aware_order_does_not_take_cut_edge_before_remaining_cycle():
    m = stage()
    # A bridge in the remaining graph must be deferred, even if its portal is nearer.
    circuit = [(0, 1, 'a'), (1, 1, 'loop'), (1, 0, 'a'), (0, 0, 'home-loop')]
    route, evidence = m.distance_aware_euler_order(
        circuit, 0, lambda bid, bank: 0 if bid == 'a' else 10,
        lambda a, b: abs(a - b))
    assert len(route) == len(circuit)
    assert Counter(bid for _, _, bid in route) == Counter(bid for _, _, bid in circuit)
    assert all(a[1] == b[0] for a, b in zip(route, route[1:]))
    assert evidence['selected_transfer_m'] <= evidence['baseline_transfer_m']


def test_distance_aware_order_preserves_seeded_euler_multigraphs_and_never_regresses():
    import random
    m = stage()
    rng = random.Random(4817103)
    for trial in range(30):
        # Union of closed walks: connected Euler multigraphs with parallel
        # edge copies, nonzero self-loop deck endpoints and many branch choices.
        circuit = []
        portals = {}
        for cycle in range(5):
            banks = [0] + [rng.randrange(4) for _ in range(4)] + [0]
            for u, v in zip(banks, banks[1:]):
                bid = f'{trial}-{len(circuit)}'
                a, z = (u, rng.randrange(100)), (v, rng.randrange(100))
                portals[bid, u] = (a, z)
                if u != v:
                    portals[bid, v] = (z, a)
                circuit.append((u, v, bid))
        def transfer(a, b):
            assert a[0] == b[0], 'transfer cannot cross a bridge-free bank boundary'
            return abs(a[1] - b[1])
        route, evidence = m.distance_aware_euler_order(
            circuit, (0, 0), lambda bid, bank: portals[bid, bank], transfer)
        assert Counter((min(u, v), max(u, v), bid) for u, v, bid in route) == Counter(
            (min(u, v), max(u, v), bid) for u, v, bid in circuit)
        assert route[0][0] == route[-1][1] == 0
        assert all(a[1] == b[0] for a, b in zip(route, route[1:]))
        assert evidence['selected_transfer_m'] <= evidence['baseline_transfer_m']


def test_real_ordering_evidence_and_unresolved_source_tags():
    data = json.loads((ROOT / 'web/data/bridge-route.json').read_text(encoding='utf-8'))
    order = data['audit']['walking_order']
    assert order['same_augmented_edge_multiset']
    assert order['selected_distance_m'] <= order['baseline_distance_m']
    assert abs(order['selected_distance_m'] - data['distance_m']) < 0.001
    assert data['distance_m'] < 80000
    assert (data['bridge_count'], len(data['crossings']), data['repeat_crossings'],
            data['euler']['odd_count']) == (371, 464, 93, 106)
    details = data['audit']['unresolved_details']
    assert len(details) == 10  # Ferrovia, six unmatched decks, three disconnected groups
    assert {d['category'] for d in details} == {'no_complete_crossing', 'unmatched_deck', 'disconnected'}
    for detail in details:
        assert detail['id'] and detail['source_tags'] and detail['assessment']['en']
    by_id = {d['id']: d for d in details}
    nearby = by_id['d555841273']['nearby_highways']
    steps = next(w for w in nearby if w['way_id'] == 218723109)
    assert steps['tags']['highway'] == 'steps'
    assert steps['tags']['bridge'] == 'yes'
    assert not steps['entirely_in_scope']
    assert steps['overlap_m'] > 40
    assert 'transport' in data['audit']['scope']['en']


def test_real_candidate_inventory_reconciles_required_excluded_unresolved():
    data = json.loads((ROOT / 'web/data/bridge-route.json').read_text(encoding='utf-8'))
    audit = data['audit']
    assert len(audit['inventory']) == audit['physical_groups']
    assert audit['physical_groups'] == (data['bridge_count'] + len(data['excluded']) + len(audit['ambiguous_portals']))
    assert len({b['id'] for b in audit['inventory']}) == audit['physical_groups']
    required = {b['id'] for b in data['bridges']}
    assert {b['id'] for b in audit['inventory'] if b['status'] == 'required'} == required
    for b in audit['inventory']:
        assert b['way_ids']
    from shapely.geometry import Point, shape
    boundary = shape(json.loads((ROOT / 'data/raw/osm/venice_island_polygon_osm_4817103.geojson').read_text(encoding='utf-8'))['features'][0]['geometry'])
    assert all(boundary.covers(Point(ll)) for ll in data['coordinates'])
    assert audit['source_date_semantics']['en']


def test_real_json_gpx_and_osm_topology_are_independently_verified():
    path = ROOT / 'web/data/bridge-route.json'
    assert path.exists(), 'Real route has not been generated'
    data = json.loads(path.read_text(encoding='utf-8'))
    assert data['status'] == 'ready'
    assert data['id'] == 'all-bridges'
    assert data['bridge_count'] == len(data['bridges']) > 200
    counts = Counter(c['bridge_id'] for c in data['crossings'])
    assert counts == {b['id']: b['visits'] for b in data['bridges']}
    assert data['repeat_crossings'] == sum(v - 1 for v in counts.values())
    assert sum(c['repeat'] for c in data['crossings']) == data['repeat_crossings']
    assert data['coordinates'][0] == data['coordinates'][-1]
    assert data['coordinates'][0] == [data['start']['lon'], data['start']['lat']]
    assert 12.316 < data['start']['lon'] < 12.321
    assert 45.436 < data['start']['lat'] < 45.440
    assert not (set(counts) & {e['id'] for e in data['excluded']})
    for obj in [data['title'], data['summary'], data['euler']['explanation']] + [e['reason'] for e in data['excluded']]:
        assert set(obj) == {'ru', 'it', 'en'}
    project = Transformer.from_crs('EPSG:4326', 'EPSG:32633', always_xy=True)
    ox, oy = project.transform(12.3387, 45.4340)
    total = 0
    last = None
    for ll, xz in zip(data['coordinates'], data['local'], strict=True):
        x, y = project.transform(*ll)
        assert math.dist(xz, [x - ox, -(y - oy)]) < 0.02
        if last:
            total += math.dist(last, (x, y))
        last = x, y
    assert abs(total - data['distance_m']) < 0.05
    points = ET.parse(ROOT / 'web/data/bridge-route.gpx').findall('.//{http://www.topografix.com/GPX/1/1}trkpt')
    assert [[float(p.attrib['lon']), float(p.attrib['lat'])] for p in points] == data['coordinates']
    proof = json.loads((ROOT / 'data/processed/bridge_route_proof.json').read_text(encoding='utf-8'))
    ids = proof['route_node_ids']
    assert len(ids) == len(data['coordinates'])
    proof_bridges = {b['id']: b for b in proof['bridges']}
    for crossing in data['crossings']:
        actual = ids[crossing['start_index']:crossing['end_index'] + 1]
        expected = proof_bridges[crossing['bridge_id']]['path']
        assert actual == expected or actual == list(reversed(expected))
    assert ids[0] == ids[-1] == proof['start_node_id']
    # Re-extract authoritative adjacency/access independently, not trusting a generated graph.
    import osmium
    needed_nodes = set(ids)
    needed_edges = {tuple(sorted((u, v))) for u, v in zip(ids, ids[1:])}
    found, node_coords, node_tags = set(), {}, {}
    forbidden = {'private', 'no', 'customers', 'permit', 'delivery', 'destination', 'agricultural', 'forestry'}
    class Read(osmium.SimpleHandler):
        def node(self, n):
            if n.id in needed_nodes:
                node_coords[n.id] = [n.location.lon, n.location.lat]
                node_tags[n.id] = dict((t.k, t.v) for t in n.tags)
        def way(self, w):
            tags = dict((t.k, t.v) for t in w.tags)
            if tags.get('highway') not in {'footway', 'pedestrian', 'steps', 'path', 'living_street', 'residential', 'service', 'unclassified', 'tertiary', 'secondary', 'primary', 'road', 'cycleway'}:
                return
            if tags.get('foot', tags.get('access')) in forbidden or tags.get('route') == 'ferry':
                return
            refs = [n.ref for n in w.nodes]
            for u, v in zip(refs, refs[1:]):
                key = tuple(sorted((u, v)))
                if key in needed_edges:
                    found.add(key)
    reader = Read()
    reader.apply_file(str(ROOT / 'data/raw/osm/venezia_island.osm.pbf'))
    assert found == needed_edges
    assert [node_coords[n] for n in ids] == data['coordinates']
    for tags in node_tags.values():
        assert tags.get('foot', tags.get('access')) not in forbidden
    assert data['audit']['verified']['continuous_osm_edges']
    assert data['audit']['verified']['coverage']
