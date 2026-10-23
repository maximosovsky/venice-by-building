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


def test_immediate_deadends_do_not_recursively_prune_bridge_chains():
    m = stage()
    land = nx.Graph()
    land.add_edge(10, 11, length=3, way_id=100)
    land.add_edge(20, 21, length=4, way_id=200)
    land.add_edge(30, 31, length=5, way_id=300)
    components = [{10, 11}, {20, 21}, {30, 31}]
    records = {
        'upstream': {'id': 'upstream', 'name': 'Upstream', 'banks': [0, 1],
                     'real_banks': [0, 1], 'portals': [10, 20]},
        'terminal': {'id': 'terminal', 'name': 'Terminal', 'banks': [1, 2],
                     'real_banks': [1, 2], 'portals': [20, 30]},
        'home-loop': {'id': 'home-loop', 'name': '', 'banks': [0, 0],
                      'real_banks': [0], 'portals': [10, 11]},
    }
    excluded = m.immediate_deadends(records, land, components)
    assert {e['id'] for e in excluded} == {'terminal'}
    bank = excluded[0]['dead_end_banks'][0]
    assert bank['bank_id'] == 2
    assert bank['incident_bridge_ids'] == ['terminal']
    assert bank['outward_way_ids'] == [300]


def test_isolated_bridge_interior_is_not_a_deadend_bank():
    m = stage()
    land = nx.Graph()
    land.add_edge(10, 11, length=1, way_id=1)
    land.add_edge(20, 21, length=1, way_id=2)
    land.add_node(99)
    records = {
        'stairs': {'id': 'stairs', 'name': '', 'banks': [0, 1],
                   'real_banks': [0, 1], 'portals': [10, 20, 99]},
        'other': {'id': 'other', 'name': '', 'banks': [0, 1],
                  'real_banks': [0, 1], 'portals': [11, 21]},
    }
    assert m.immediate_deadends(records, land, [{10, 11}, {20, 21}, {99}]) == []


def test_closed_subtrail_reversal_shortens_order_with_identical_crossings():
    m = stage()
    circuit = [(0, 1, 'a'), (1, 0, 'b'), (0, 2, 'c'), (2, 0, 'd'),
               (0, 3, 'e'), (3, 0, 'f')]
    pairs = {('a', 0): (90, 1000), ('b', 1): (1000, 100),
             ('c', 0): (10, 2000), ('d', 2): (2000, 20),
             ('e', 0): (50, 3000), ('f', 3): (3000, 60)}
    pairs.update({(bid, v): tuple(reversed(pairs[bid, u])) for u, v, bid in circuit})
    route, evidence = m.improve_closed_subtrails(
        circuit, 0, lambda bid, bank: pairs[bid, bank], lambda a, b: abs(a - b))
    assert evidence['selected_transfer_m'] < evidence['baseline_transfer_m']
    assert Counter(b for _, _, b in route) == Counter(b for _, _, b in circuit)
    assert route[0][0] == route[-1][1] == 0
    assert all(a[1] == b[0] for a, b in zip(route, route[1:]))


def test_real_ordering_evidence_and_unresolved_source_tags():
    data = json.loads((ROOT / 'web/data/bridge-route.json').read_text(encoding='utf-8'))
    order = data['audit']['walking_order']
    assert order['same_augmented_edge_multiset']
    assert order['selected_distance_m'] <= order['baseline_distance_m']
    assert abs(order['selected_distance_m'] - data['distance_m']) < 0.001
    assert data['distance_m'] < 65140
    assert data['bridge_count'] < 371
    assert data['repeat_crossings'] < 93
    assert len(data['crossings']) == data['bridge_count'] + data['repeat_crossings']
    dead = data['audit']['dead_end_exclusions']
    assert dead and len(dead) == data['audit']['dead_end_exclusion_count']
    assert {e['id'] for e in dead} <= {e['id'] for e in data['excluded']}
    assert all(e['dead_end_banks'] for e in dead)
    assert 'Piazzale Roma' not in json.dumps(data, ensure_ascii=False)
    assert data['start']['name'] == 'Piazza San Marco'
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


def test_real_repeat_minimum_is_independent_unweighted_matching():
    data = json.loads((ROOT / 'web/data/bridge-route.json').read_text(encoding='utf-8'))
    graph = nx.MultiGraph()
    for bridge in data['audit']['required_bridges_detail']:
        graph.add_edge(*bridge['banks'], key=bridge['id'])
    assert nx.is_connected(graph)
    odd = sorted(n for n, degree in graph.degree() if degree % 2)
    closure = nx.Graph()
    for index, u in enumerate(odd):
        distances = nx.single_source_shortest_path_length(graph, u)
        for v in odd[index + 1:]:
            closure.add_edge(u, v, weight=distances[v])
    matching = nx.min_weight_matching(closure, weight='weight')
    lower_bound = sum(closure[u][v]['weight'] for u, v in matching)
    assert len(matching) * 2 == len(odd)
    assert lower_bound == data['repeat_crossings'] == 74
    assert len(odd) == data['euler']['odd_count'] == 88


def test_real_deadend_banks_reconstructed_from_original_pbf():
    import osmium
    from shapely.geometry import LineString, shape
    data = json.loads((ROOT / 'web/data/bridge-route.json').read_text(encoding='utf-8'))
    proof = json.loads((ROOT / 'data/processed/bridge_route_proof.json').read_text(encoding='utf-8'))
    boundary = shape(json.loads((ROOT / 'data/raw/osm/venice_island_polygon_osm_4817103.geojson').read_text(encoding='utf-8'))['features'][0]['geometry'])
    bridge_way_ids = {w for b in data['audit']['inventory'] for w in b['way_ids']}
    blocked_way_ids = {w['id'] for b in data['audit']['inventory'] for w in b['restricted_ways']}
    coords, ways, blocked_nodes = {}, [], set()
    def allowed(tags):
        if tags.get('foot', tags.get('access', 'yes')) not in {'yes', 'designated', 'permissive'}:
            return False
        if tags.get('foot:conditional') or (tags.get('access:conditional') and tags.get('foot') not in {'yes', 'designated', 'permissive'}):
            return False
        return tags.get('opening_hours') in (None, '', '24/7') and tags.get('locked') != 'yes'
    class Reader(osmium.SimpleHandler):
        def node(self, n):
            coords[n.id] = (n.location.lon, n.location.lat)
            if not allowed(dict(n.tags)):
                blocked_nodes.add(n.id)
        def way(self, w):
            tags = dict(w.tags)
            if tags.get('highway') not in {'footway', 'pedestrian', 'steps', 'path', 'living_street', 'residential', 'service', 'unclassified', 'tertiary', 'secondary', 'primary', 'road', 'cycleway'}:
                return
            if not allowed(tags) or w.id in blocked_way_ids:
                return
            if tags.get('route') == 'ferry' or tags.get('ferry') == 'yes' or tags.get('indoor') == 'yes':
                return
            if tags.get('construction') or tags.get('proposed') or tags.get('disused') == 'yes' or tags.get('oneway:foot') in {'yes', '-1'}:
                return
            if tags.get('highway') == 'cycleway' and tags.get('foot') not in {'yes', 'designated', 'permissive'}:
                return
            ways.append((w.id, [n.ref for n in w.nodes]))
    Reader().apply_file(str(ROOT / 'data/raw/osm/venezia_island.osm.pbf'))
    graph = nx.Graph()
    for wid, refs in ways:
        if len(refs) < 2 or any(n not in coords or n in blocked_nodes for n in refs):
            continue
        if not boundary.covers(LineString([coords[n] for n in refs])):
            continue
        for u, v in zip(refs, refs[1:]):
            if u == v:
                continue
            if not graph.has_edge(u, v) or wid in bridge_way_ids:
                graph.add_edge(u, v, bridge=wid in bridge_way_ids, way_id=wid)
    graph = graph.subgraph(nx.node_connected_component(graph, proof['start_node_id'])).copy()
    land = nx.Graph()
    land.add_nodes_from(graph)
    land.add_edges_from((u, v, d) for u, v, d in graph.edges(data=True) if not d['bridge'])
    banks = sorted(nx.connected_components(land), key=min)
    bank_id = {n: i for i, bank in enumerate(banks) for n in bank}
    incidence = {}
    for b in proof['original_bridges']:
        for n in b['portals']:
            if land.degree(n):
                incidence.setdefault(bank_id[n], set()).add(b['id'])
    expected = set()
    for b in proof['original_bridges']:
        selected = {bank_id[b['path'][0]], bank_id[b['path'][-1]]}
        if len(selected) == 2 and any(incidence.get(bank) == {b['id']} for bank in selected):
            expected.add(b['id'])
    assert expected == {b['id'] for b in data['audit']['dead_end_exclusions']}
    assert len(expected) == 19
    for entry in data['audit']['dead_end_exclusions']:
        for evidence in entry['dead_end_banks']:
            bank = banks[evidence['bank_id']]
            assert len(bank) == evidence['node_count']
            assert set(evidence['outward_way_ids']) == {d['way_id'] for _, _, d in land.subgraph(bank).edges(data=True)}
            assert incidence[evidence['bank_id']] == {entry['id']}


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
    assert data['start']['name'] == 'Piazza San Marco'
    assert 12.336 < data['start']['lon'] < 12.340
    assert 45.433 < data['start']['lat'] < 45.435
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
    assert proof['original_bridges']
    assert proof['dead_end_exclusions'] == data['audit']['dead_end_exclusions']
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
    square_way_ids = []
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
            if (tags.get('name') == 'Piazza San Marco' and tags.get('highway') == 'pedestrian'
                    and proof['start_node_id'] in refs):
                square_way_ids.append(w.id)
            for u, v in zip(refs, refs[1:]):
                key = tuple(sorted((u, v)))
                if key in needed_edges:
                    found.add(key)
    reader = Read()
    reader.apply_file(str(ROOT / 'data/raw/osm/venezia_island.osm.pbf'))
    assert square_way_ids, 'Start must be an original node on the pedestrian square'
    assert found == needed_edges
    assert [node_coords[n] for n in ids] == data['coordinates']
    for tags in node_tags.values():
        assert tags.get('foot', tags.get('access')) not in forbidden
    assert data['audit']['verified']['continuous_osm_edges']
    assert data['audit']['verified']['coverage']
