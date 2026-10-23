"""Test-first midpoint routing and independent source/export proofs."""
import importlib
import json
import math
import sys
from collections import Counter
from pathlib import Path
import xml.etree.ElementTree as ET

import networkx as nx
import numpy as np
import pytest
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'pipeline'))


def stage():
    assert (ROOT / 'pipeline/venice/s12_bridge_visits.py').exists(), 'Midpoint visit implementation missing'
    return importlib.import_module('venice.s12_bridge_visits')


def test_metric_midpoint_splits_original_segment_preserving_length():
    m = stage()
    g = nx.Graph()
    g.add_edge(1, 2, length=4., way_id=7, bridge_id='b', mode='walk')
    g.add_edge(2, 3, length=8., way_id=8, bridge_id='b', mode='walk')
    xy = {1: (0., 0.), 2: (4., 0.), 3: (12., 0.)}
    node, proof = m.insert_midpoint(g, xy, [1, 2, 3], 'b')
    assert xy[node] == (6., 0.)
    assert not g.has_edge(2, 3)
    assert g[2][node]['length'] == 2.
    assert g[node][3]['length'] == 6.
    assert nx.shortest_path_length(g, 1, 3, weight='length') == 12.
    assert proof['original_pair'] == [2, 3]
    assert proof['fraction'] == .25
    assert g[2][node]['way_id'] == 8


def test_midpoint_at_existing_node_does_not_create_zero_edge():
    m = stage()
    g = nx.Graph()
    g.add_edge(1, 2, length=5., bridge_id='b')
    g.add_edge(2, 3, length=5., bridge_id='b')
    node, proof = m.insert_midpoint(g, {1: (0., 0.), 2: (5., 0.), 3: (10., 0.)}, [1, 2, 3], 'b')
    assert node == 2
    assert g.number_of_edges() == 2
    assert proof['existing_node'] == 2


def test_half_bridge_return_is_repeat_distance_not_full_crossing():
    m = stage()
    g = nx.Graph()
    g.add_edge(1, 2, length=5., bridge_id='b', mode='walk')
    g.add_edge(2, 3, length=5., bridge_id='b', mode='walk')
    stats = m.route_stats(g, [1, 2, 1], {'b': {'node': 2}}, {1: 0, 3: 1})
    assert stats['walk_distance_m'] == 10.
    assert stats['repeat_distance_m'] == 5.
    assert stats['bridge_full_crossings'] == 0
    assert stats['midpoint_visit_events'] == 1
    assert stats['bridge_visit_reversals'] == 1


def test_full_crossing_repeats_are_separate_from_visit_repeats():
    m = stage()
    g = nx.Graph()
    g.add_edge(1, 2, length=5., bridge_id='b', mode='walk')
    g.add_edge(2, 3, length=5., bridge_id='b', mode='walk')
    stats = m.route_stats(g, [1, 2, 3, 2, 1], {'b': {'node': 2}}, {1: 0, 3: 1})
    assert stats['bridge_full_crossings'] == 2
    assert stats['bridge_full_crossing_repeats'] == 1
    assert stats['midpoint_repeat_visits'] == 1
    assert stats['repeat_distance_m'] == 10.


def test_ferry_stats_do_not_leak_into_walk_or_bridge_counts():
    m = stage()
    g = nx.Graph()
    g.add_edge(1, 2, length=80., mode='traghetto', traghetto_id='x', bridge_id=None)
    stats = m.route_stats(g, [1, 2, 1], {}, {})
    assert stats['boat_distance_m'] == 160.
    assert stats['walk_distance_m'] == 0.
    assert stats['boat_repeat_distance_m'] == 80.
    assert stats['walk_repeat_distance_m'] == 0.
    assert stats['bridge_full_crossings'] == 0


def test_ferry_requires_original_geometry_connected_landings_and_public_tags():
    m = stage()
    g = nx.Graph()
    g.add_edge(1, 3, length=1.)
    g.add_edge(2, 4, length=1.)
    xy = {1: (0., 0.), 2: (10., 0.), 3: (0., 1.), 4: (10., 1.)}
    good = {'id': 'x', 'node_ids': [1, 2], 'source_tags': {'route': 'ferry', 'foot': 'yes'}}
    assert m.add_ferry(g, xy, good)
    assert g[1][2]['mode'] == 'traghetto'
    for rec in [dict(good, node_ids=[1, 99]), dict(good, source_tags={'route': 'ferry', 'foot': 'no'}),
                dict(good, source_tags={'route': 'boat', 'foot': 'yes'})]:
        assert not m.add_ferry(nx.Graph([(1, 3), (2, 4)]), xy, rec)


def test_network_metric_closure_not_straight_line_and_disconnection_rejected():
    m = stage()
    g = nx.Graph()
    g.add_edge(1, 2, length=100.)
    g.add_edge(2, 3, length=50.)
    assert m.metric_closure(g, [1, 3])[0, 1] == 150.
    g.add_node(4)
    with pytest.raises(ValueError, match='disconnected'):
        m.metric_closure(g, [1, 4])


def test_multistart_twoopt_closed_tour_improves_bad_seed_and_preserves_all_targets():
    m = stage()
    xy = np.array([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5]], dtype=float)
    d = np.sqrt(((xy[:, None] - xy[None, :]) ** 2).sum(axis=2))
    bad = [0, 2, 1, 3, 4, 0]
    tour, evidence = m.optimize_tour(d, starts=5, seeds=[bad], kicks=4)
    assert tour[0] == tour[-1] == 0
    assert sorted(tour[:-1]) == list(range(5))
    assert m.tour_cost(d, tour) < m.tour_cost(d, bad)
    assert evidence['global_optimum_claimed'] is False
    assert evidence['selected_cost_m'] <= evidence['best_initial_cost_m']


def test_export_adapter_matches_unchanged_ui_and_preserves_repeat_meanings():
    m = stage()
    r = {'status': 'conditional', 'legs': [{'mode': 'traghetto'}],
         'stats': {'repeat_distance_m': 15., 'walk_repeat_distance_m': 10.}}
    ferries = [{'schedule_source': {'url': m.OFFICIAL_URL, 'effective_from': '2021-06-07'}}]
    m.prepare_export([r], ferries, {'possible': False, 'odd_count': 2, 'explanation': {'en': 'baseline'}})
    assert r['status'] == 'ready'
    assert r['availability'] == 'conditional_unverified_today'
    assert r['legs'][0]['mode'] == 'boat'
    assert r['stats']['repeat_distance_m'] == 10.
    assert r['stats']['total_repeat_distance_m'] == 15.
    assert r['euler']['applicable'] is False
    assert ferries[0]['source']['url'] == m.OFFICIAL_URL


def test_resume_checkpoint_rejects_stale_midpoints_and_source(tmp_path):
    import pickle
    m = stage()
    p = tmp_path / 'internal.pickle'
    variant = {'id': 'walking_midpoints', 'proof': {'pbf_sha256': 'source'}}
    data = {'midpoints': {'b': {'node': -1}}, 'distances': np.zeros((2, 2)), 'variants': [variant]}
    p.write_bytes(pickle.dumps(data))
    assert m.read_checkpoint(p, data['midpoints'], 'source')['variants'] == [variant]
    with pytest.raises(ValueError, match='midpoint'):
        m.read_checkpoint(p, {'b': {'node': -2}}, 'source')
    with pytest.raises(ValueError, match='source'):
        m.read_checkpoint(p, data['midpoints'], 'changed')


@pytest.fixture(scope='module')
def artifacts():
    stage()
    p = ROOT / 'web/data/bridge-visit-route.json'
    assert p.exists(), 'Optimized route export missing'
    return json.loads(p.read_text(encoding='utf-8'))


def test_export_variants_cover_exact_frozen344_and_event_semantics(artifacts):
    old = json.loads((ROOT / 'web/data/bridge-route.json').read_text(encoding='utf-8'))
    ids = {b['id'] for b in old['bridges']}
    assert len(ids) == 344
    assert len(artifacts['variants']) == 2
    for r in artifacts['variants']:
        assert r['visit_mode'] is True
        assert {b['id'] for b in r['bridges']} == ids
        assert {b['bridge_id'] for b in r['crossings']} == ids
        assert r['bridge_count'] == 344
        assert len(r['crossings']) == 344 + r['repeat_crossings']
        assert sum(c['repeat'] for c in r['crossings']) == r['repeat_crossings']
        assert r['repeat_crossings'] == r['stats']['midpoint_repeat_visits']
        assert r['distance_m'] < old['distance_m']
        assert r['coordinates'][0] == r['coordinates'][-1] == old['coordinates'][0]
        assert r['stats']['total_distance_m'] == r['distance_m']
        assert r['stats']['repeat_distance_m'] > 0
        for key in ['title', 'summary', 'limitations', 'event_semantics']:
            assert set(r[key]) == {'ru', 'it', 'en'}
    walk, boat = artifacts['variants']
    assert walk['id'] == 'walking_midpoints'
    assert walk['stats']['boat_distance_m'] == 0
    assert boat['id'] == 'traghetto_midpoints'
    assert boat['distance_m'] < walk['distance_m']
    assert boat['status'] == 'ready'
    assert boat['availability'] == 'conditional_unverified_today'
    assert boat['schedule_feasible'] is False


def test_independent_real_graph_and_split_source_membership(artifacts):
    m = stage()
    base, nodes, _, proof, old, ferries, approaches = m.load_inputs()
    xy = {n: m.s10.PROJECT.transform(*ll) for n, ll in nodes.items()}
    allowed_walk = {frozenset((u, v)) for u, v in base.edges()}
    for a in approaches:
        allowed_walk.update(frozenset(pair) for pair in zip(a['node_ids'], a['node_ids'][1:]))
    inverse = Transformer.from_crs('EPSG:32633', 'EPSG:4326', always_xy=True)
    for r in artifacts['variants']:
        p = r['proof']
        assert p['pbf_sha256'] == old['audit']['pbf_sha256']
        ids = p['route_node_ids']
        assert ids[0] == ids[-1] == proof['start_node_id']
        positions = dict(xy)
        split_pairs = set()
        for b in p['midpoints']:
            n = b['node']
            if 'existing_node' in b:
                assert n == b['existing_node']
                continue
            u, v = b['original_pair']
            assert frozenset((u, v)) in allowed_walk
            f = b['fraction']
            assert 0 < f < 1
            positions[n] = tuple(xy[u][k] + f * (xy[v][k] - xy[u][k]) for k in (0, 1))
            split_pairs.update([frozenset((u, n)), frozenset((n, v))])
        eligible = {f['id']: f for f in ferries if f['routing_eligible']}
        ferry_pairs = {frozenset(pair) for f in eligible.values() for pair in zip(f['node_ids'], f['node_ids'][1:])}
        all_allowed = allowed_walk | split_pairs | (ferry_pairs if r['id'] == 'traghetto_midpoints' else set())
        assert all(frozenset(pair) in all_allowed for pair in zip(ids, ids[1:]))
        expected = [inverse.transform(*positions[n]) for n in ids]
        assert max(math.dist(ll, exp) for ll, exp in zip(r['coordinates'], expected)) < 1e-9
        assert len(ids) == len(r['coordinates']) == len(r['local'])
        assert {b['node'] for b in p['midpoints']} <= set(ids)
        for c in r['crossings']:
            assert ids[c['route_index']] == next(b['node'] for b in p['midpoints'] if b['bridge_id'] == c['bridge_id'])
        for e in r['ferry_events']:
            assert e['traghetto_id'] in eligible
            f = eligible[e['traghetto_id']]
            assert ids[e['start_index']:e['end_index'] + 1] in [f['node_ids'], f['node_ids'][::-1]]
        split_graph = base.copy()
        exact_midpoints = {}
        for b in proof['bridges']:
            _, evidence = m.insert_midpoint(split_graph, positions, b['path'], b['id'])
            exact_midpoints[b['id']] = evidence
        assert list(exact_midpoints.values()) == p['midpoints']
        if r['id'] == 'traghetto_midpoints':
            for a in approaches:
                for u, v in zip(a['node_ids'], a['node_ids'][1:]):
                    split_graph.add_edge(u, v, length=math.dist(positions[u], positions[v]),
                                         mode='walk', bridge_id=None, way_id=a['osm_way_id'])
            for f in eligible.values():
                assert m.add_ferry(split_graph, positions, f)
        assert all(split_graph.has_edge(u, v) for u, v in zip(ids, ids[1:]))
        bank_land = nx.Graph()
        bank_land.add_nodes_from(base)
        bank_land.add_edges_from((u, v) for u, v, d in base.edges(data=True) if not d.get('bridge_id'))
        bank_components = {n: i for i, c in enumerate(nx.connected_components(bank_land)) for n in c}
        banks = {n: bank_components[n] for n in bank_land if bank_land.degree(n) > 0}
        actual_stats = m.route_stats(split_graph, ids, exact_midpoints, banks)
        for k, value in actual_stats.items():
            export_key = 'total_repeat_distance_m' if k == 'repeat_distance_m' else k
            if isinstance(value, float):
                assert abs(value - r['stats'][export_key]) <= .001
            else:
                assert value == r['stats'][export_key]
        baseline_stats = m.route_stats(base, proof['route_node_ids'], {}, banks)
        assert r['stats']['walk_repeat_distance_m'] < baseline_stats['walk_repeat_distance_m']
        assert r['stats']['repeat_distance_m'] == r['stats']['walk_repeat_distance_m']
        for leg in r['legs']:
            i, j = leg['start_index'], leg['end_index']
            assert leg['coordinates'] == r['coordinates'][i:j + 1]
            mode = 'traghetto' if leg['mode'] == 'boat' else 'walk'
            assert all(split_graph[u][v]['mode'] == mode for u, v in zip(ids[i:j], ids[i + 1:j + 1]))
            assert abs(leg['distance_m'] - sum(split_graph[u][v]['length'] for u, v in zip(ids[i:j], ids[i + 1:j + 1]))) < 1e-6
        flattened = list(r['legs'][0]['coordinates'])
        for leg in r['legs'][1:]:
            assert flattened[-1] == leg['coordinates'][0]
            flattened.extend(leg['coordinates'][1:])
        assert flattened == r['coordinates']


def test_actual_written_wrapper_passes_unchanged_javascript_validator(artifacts):
    import subprocess
    result = subprocess.run(['node', '--input-type=module', '-e',
        "import fs from 'node:fs'; import {validateVisitRoutes} from './web/bridge-route.js'; "
        "const d=JSON.parse(fs.readFileSync('web/data/bridge-visit-route.json','utf8')); "
        "if(!validateVisitRoutes(d))process.exit(1); console.log('real written variants valid');"],
        cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert 'real written variants valid' in result.stdout


def test_all_four_traghetti_mapped_with_official_schedule_and_conflicts(artifacts):
    f = json.loads((ROOT / 'web/data/traghetti.json').read_text(encoding='utf-8'))
    assert f['traghetti'] == artifacts['traghetti']
    assert {x['id'] for x in f['traghetti']} == {'santa_sofia', 'san_toma', 'giglio', 'dogana'}
    for x in f['traghetti']:
        assert len(x['endpoints']) == 2
        assert x['coordinates']
        assert x['schedule_source']['url'] == 'https://www.comune.venezia.it/it/content/traghetti-parada'
        assert x['schedule_source']['effective_from'] == '2021-06-07'
        assert x['availability'] == 'conditional_unverified_today'
        assert set(x['caveat']) == {'ru', 'it', 'en'}
    d = {x['id']: x for x in f['traghetti']}
    assert not d['giglio']['routing_eligible']
    assert not d['santa_sofia']['routing_eligible']
    assert d['dogana']['schedule_conflict']


def test_gpx_two_tracks_roundtrip_mode_legs_and_names(artifacts):
    ns = {'g': 'http://www.topografix.com/GPX/1/1'}
    root = ET.parse(ROOT / 'web/data/bridge-visit-route.gpx').getroot()
    tracks = root.findall('g:trk', ns)
    assert len(tracks) == len(artifacts['variants'])
    for track, r in zip(tracks, artifacts['variants']):
        assert track.find('g:name', ns).text == r['id']
        segments = track.findall('g:trkseg', ns)
        assert len(segments) == len(r['legs'])
        for seg, leg in zip(segments, r['legs']):
            points = [[float(p.attrib['lon']), float(p.attrib['lat'])] for p in seg.findall('g:trkpt', ns)]
            assert points == leg['coordinates']
            assert seg.find('g:extensions/g:mode', ns).text == leg['mode']
