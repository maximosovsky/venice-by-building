"""Additive metric-midpoint visit tours. Never writes the s10 route or inventory.

Run: PYTHONPATH=pipeline python -m venice.s12_bridge_visits
Dependencies: networkx, numpy, scipy, pyproj, osmium, shapely; pytest for verification.
All optimization uses original pedestrian adjacency and explicitly audited ferries.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import pickle
import xml.etree.ElementTree as ET

import networkx as nx
import numpy as np
import osmium
from pyproj import Transformer
from shapely.geometry import shape

from venice import config, s10_bridge_route as s10

OFFICIAL_URL = 'https://www.comune.venezia.it/it/content/traghetti-parada'
INVERSE = Transformer.from_crs(config.CRS_METRIC, config.CRS_WEB, always_xy=True)
FERRY_IDS = {'santa_sofia': 216893104, 'san_toma': 840231075,
             'giglio': 216893103, 'dogana': 952112466}
SCHEDULES = {'santa_sofia': 'Mo-Fr 08:30-19:00; Sa-Su, PH 09:00-18:00',
             'san_toma': 'Mo-Fr 08:30-19:00; Sa-Su, PH 09:00-18:30',
             'giglio': '09:00-18:00', 'dogana': '09:00-18:00'}
SCHEDULE_EVIDENCE = '''TRAGHETTI ATTIVI E ORARI (in vigore dal 07.06.2021)
traghetto DOGANA ore 9.00 - 18.00
traghetto SANTA MARIA DEL GIGLIO ore 9.00 - 18.00
traghetto SAN TOMA’ ore 8.30 – 19.00 da lunedì a venerdì
ore 9.00 – 18.30 Sabato, domenica e festivi
traghetto SANTA SOFIA ore 8.30 – 19.00 da lunedì a venerdì
ore 9.00 – 18.00 sabato, domenica e festivi
il servizio non viene effettuato nei giorni 15/8, 25/12, 26/12, 1/1
il servizio termina alle ore 13.00 nei giorni 24/12, 31/12.'''


def insert_midpoint(graph, xy, path, bridge_id):
    """Insert half arclength of the frozen s10 representative crossing, in UTM.

    New nodes use negative IDs, interpolate an original edge, and preserve its
    source way, physical bridge identity and total metric length. No snapping.
    """
    lengths = [graph[u][v]['length'] for u, v in zip(path, path[1:])]
    halfway = sum(lengths) / 2
    travelled = 0.
    for (u, v), length in zip(zip(path, path[1:]), lengths):
        if abs(halfway - travelled) < 1e-8:
            return u, {'bridge_id': bridge_id, 'node': u, 'existing_node': u,
                       'path': path, 'arclength_m': halfway}
        if halfway <= travelled + length + 1e-8:
            if abs(halfway - travelled - length) < 1e-8:
                return v, {'bridge_id': bridge_id, 'node': v, 'existing_node': v,
                           'path': path, 'arclength_m': halfway}
            fraction = (halfway - travelled) / length
            node = min(-1, min(graph) - 1)
            xy[node] = tuple(xy[u][k] + fraction * (xy[v][k] - xy[u][k]) for k in (0, 1))
            attr = dict(graph[u][v])
            graph.remove_edge(u, v)
            graph.add_edge(u, node, **dict(attr, length=length * fraction,
                                          original_pair=[u, v], split=True))
            graph.add_edge(node, v, **dict(attr, length=length * (1 - fraction),
                                          original_pair=[u, v], split=True))
            return node, {'bridge_id': bridge_id, 'node': node, 'original_pair': [u, v],
                          'way_id': attr.get('way_id'), 'fraction': fraction,
                          'path': path, 'arclength_m': halfway}
        travelled += length
    raise ValueError('Empty or invalid bridge midpoint path')


ASSUMPTION = 'user_authorized_ferry_connector_assumption'
LANDING_PAIRS = {292750093: [27178422, 8812616140],
                 216893107: [2262139796, 2262139795]}


def add_landing_approach(graph, xy, approach):
    """Admit only verified original pier pairs, not geographic water shortcuts."""
    wid, ids, tags = approach['osm_way_id'], approach['node_ids'], approach['source_tags']
    reason = s10.access_reason(tags)
    assumed = approach.get('routing_assumption') == ASSUMPTION
    if (LANDING_PAIRS.get(wid) != ids or any(n not in xy for n in ids)
            or not any(n in graph for n in ids)
            or (wid == 216893107 and (not assumed or reason != 'indoor'
                or s10.access_reason({k: v for k, v in tags.items() if k != 'indoor'}) is not None))
            or (wid == 292750093 and reason is not None)):
        return False
    for u, v in zip(ids, ids[1:]):
        graph.add_edge(u, v, length=math.dist(xy[u], xy[v]), mode='walk',
                       bridge_id=None, way_id=wid, landing_approach=True,
                       routing_assumption=approach.get('routing_assumption'),
                       access_overrides={'indoor': tags['indoor']} if wid == 216893107 else {})
    return True


def add_ferry(graph, xy, ferry):
    """Actual OSM boats; only named municipal Giglio may override foot=no."""
    ids, tags = ferry['node_ids'], ferry['source_tags']
    assumed = (ferry.get('routing_assumption') == ASSUMPTION
               and FERRY_IDS.get(ferry['id']) == ferry.get('osm_way_id'))
    override = (assumed and ferry['id'] == 'giglio' and tags.get('foot') == 'no'
                and ids == [2262139781, 2262139780])
    if (tags.get('route') != 'ferry' or (tags.get('foot', 'yes') not in s10.PUBLIC and not override)
            or len(ids) < 2 or any(n not in xy for n in ids)
            or ids[0] not in graph or ids[-1] not in graph
            or tags.get('access', 'yes') in s10.FORBIDDEN):
        return False
    if any(graph.has_edge(u, v) for u, v in zip(ids, ids[1:])):
        return False
    for u, v in zip(ids, ids[1:]):
        graph.add_edge(u, v, length=math.dist(xy[u], xy[v]), mode='traghetto',
                       bridge_id=None, traghetto_id=ferry['id'], way_id=ferry.get('osm_way_id'),
                       routing_assumption=ASSUMPTION if assumed else None,
                       access_overrides={'foot': tags['foot']} if override else {})
    return True


def metric_closure(graph, targets):
    """Compiled sparse network Dijkstra, not straight lines or Python all-pairs."""
    from scipy.sparse import csr_matrix
    from scipy.sparse.csgraph import dijkstra
    nodelist = list(graph)
    index = {u: i for i, u in enumerate(nodelist)}
    matrix = nx.to_scipy_sparse_array(graph, nodelist=nodelist, weight='length', format='csr')
    # scipy csgraph expects C int indices, not networkx's platform int64.
    matrix = csr_matrix((matrix.data, matrix.indices.astype(np.int32),
                         matrix.indptr.astype(np.int32)), shape=matrix.shape)
    columns = np.asarray([index[u] for u in targets], dtype=np.int32)
    d = dijkstra(matrix, directed=False, indices=columns)[:, columns]
    if not np.isfinite(d).all():
        raise ValueError('disconnected visit targets')
    return d


def tour_cost(distances, tour):
    return float(sum(distances[u, v] for u, v in zip(tour, tour[1:])))


def extend_seed(distances, seed):
    """Cheapest network insertion of new targets; preserve all old target order."""
    route = list(seed)
    for target in sorted(set(range(len(distances))) - set(route)):
        position = min(range(1, len(route)), key=lambda i: (
            distances[route[i - 1], target] + distances[target, route[i]]
            - distances[route[i - 1], route[i]], i))
        route.insert(position, target)
    return route


def optimize_tour(distances, starts=32, seeds=(), kicks=64):
    """Deterministic multi-start NN + best 2-opt + seeded perturb/re-optimize.

    Symmetric metric TSP heuristic; no global optimum claim. Start is index 0.
    Every candidate is a complete closed tour, baseline seeds cannot regress.
    """
    n = len(distances)
    if n < 2:
        return [0, 0], {'global_optimum_claimed': False, 'selected_cost_m': 0., 'best_initial_cost_m': 0.}
    ii, jj = np.triu_indices(n, 2)
    mask = ~((ii == 0) & (jj == n - 1))
    ii, jj = ii[mask], jj[mask]
    def improve(candidate):
        a = np.asarray(candidate[:-1], dtype=int)
        moves = 0
        while len(ii):
            z = np.roll(a, -1)
            delta = (distances[a[ii], a[jj]] + distances[z[ii], z[jj]]
                     - distances[a[ii], z[ii]] - distances[a[jj], z[jj]])
            k = int(np.argmin(delta))
            if delta[k] >= -1e-7:
                break
            i, j = int(ii[k]), int(jj[k])
            a[i + 1:j + 1] = a[i + 1:j + 1][::-1]
            moves += 1
        where = int(np.where(a == 0)[0][0])
        a = np.roll(a, -where).tolist()
        return a + [0], moves
    candidates = [list(s) for s in seeds]
    for first in np.linspace(0, n - 1, min(starts, n), dtype=int):
        remaining = set(range(n)) - {int(first)}
        route = [int(first)]
        while remaining:
            nxt = min(remaining, key=lambda j: (distances[route[-1], j], j))
            remaining.remove(nxt)
            route.append(nxt)
        k = route.index(0)
        route = route[k:] + route[:k]
        candidates.append(route + [0])
    if not candidates:
        raise ValueError('No optimization starts')
    for c in candidates:
        if c[0] != c[-1] or sorted(c[:-1]) != list(range(n)):
            raise ValueError('Invalid TSP seed')
    initial = min(tour_cost(distances, c) for c in candidates)
    best, best_cost, moves = list(min(candidates, key=lambda c: tour_cost(distances, c))), initial, 0
    for c in candidates:
        c, count = improve(c)
        cost = tour_cost(distances, c)
        moves += count
        if cost < best_cost:
            best, best_cost = c, cost
    rng = np.random.default_rng(4817103)
    improvements = 0
    for _ in range(kicks):
        if n < 8:
            break
        cuts = sorted(rng.choice(np.arange(1, n), size=4, replace=False).tolist())
        a, b, c, e = cuts
        p = best[:-1]
        perturbed = p[:a] + p[c:e] + p[b:c] + p[a:b] + p[e:]
        candidate, count = improve(perturbed + [0])
        cost = tour_cost(distances, candidate)
        moves += count
        if cost < best_cost - 1e-7:
            best, best_cost = candidate, cost
            improvements += 1
    relocation_moves = 0
    # Bounded Or-opt blocks escape 2-opt local minima. Actual closure costs,
    # never geometry shortcuts; retain every candidate only if strictly better.
    for _ in range(80):
        change, candidate_best = -1e-7, None
        p = best[:-1]
        for size in (1, 2, 3):
            for i in range(1, n - size + 1):
                block = p[i:i + size]
                rest = p[:i] + p[i + size:]
                removal = (distances[p[i - 1], p[(i + size) % n]]
                           - distances[p[i - 1], block[0]] - distances[block[-1], p[(i + size) % n]])
                for j in range(1, len(rest) + 1):
                    a, z = rest[j - 1], rest[j % len(rest)]
                    delta = removal + distances[a, block[0]] + distances[block[-1], z] - distances[a, z]
                    if delta < change:
                        change, candidate_best = delta, rest[:j] + block + rest[j:] + [0]
        if candidate_best is None:
            break
        candidate, count = improve(candidate_best)
        cost = tour_cost(distances, candidate)
        if cost >= best_cost - 1e-7:
            break
        best, best_cost = candidate, cost
        moves += count
        relocation_moves += 1
    return best, {'method': 'network metric closure; multi-start nearest neighbour; best-improvement 2-opt; deterministic four-cut kicks; bounded Or-opt',
                  'relocation_moves': relocation_moves,
                  'starts': len(candidates), 'kicks': kicks, 'kick_improvements': improvements,
                  'twoopt_moves': moves, 'best_initial_cost_m': initial, 'selected_cost_m': best_cost,
                  'global_optimum_claimed': False, 'random_seed': 4817103}


def route_stats(graph, route, midpoints, banks):
    """Repeated undirected split-edge metres count half-deck backtracking honestly.

    Full crossing: a contiguous run on one bridge joins two distinct ORIGINAL
    bridge-free land banks. Returns on the same bank are not full crossings.
    Midpoint arrivals are visit events, unrelated to full-crossing event counts.
    """
    distance, repeat = Counter(), Counter()
    seen, full, reversal = Counter(), Counter(), 0
    visits = Counter()
    point_bridge = {b['node']: bid for bid, b in midpoints.items()}
    for n in route:
        if n in point_bridge:
            visits[point_bridge[n]] += 1
    active, entry, run_nodes = None, None, []
    def finish(bid, first, last, nodes):
        nonlocal reversal
        if bid is None:
            return
        if first in banks and last in banks and banks[first] != banks[last]:
            full[bid] += 1
        elif (first in banks and last in banks and banks[first] == banks[last]
              and bid in midpoints and midpoints[bid]['node'] in nodes):
            reversal += 1
    for u, v in zip(route, route[1:]):
        d = graph[u][v]
        mode = d.get('mode', 'walk')
        distance[mode] += d['length']
        edge = tuple(sorted((u, v)))
        if seen[edge]:
            repeat[mode] += d['length']
        seen[edge] += 1
        bid = d.get('bridge_id') if mode == 'walk' else None
        if bid != active:
            finish(active, entry, u, run_nodes)
            active, entry, run_nodes = bid, u, [u]
        run_nodes.append(v)
        # Reaching a real bank completes the bridge event even when the next
        # edge immediately returns over that same physical bridge.
        if active is not None and v in banks:
            finish(active, entry, v, run_nodes)
            active, entry, run_nodes = None, v, [v]
    finish(active, entry, route[-1], run_nodes)
    return {'walk_distance_m': distance['walk'], 'boat_distance_m': distance['traghetto'],
            'total_distance_m': sum(distance.values()), 'repeat_distance_m': sum(repeat.values()),
            'walk_repeat_distance_m': repeat['walk'], 'boat_repeat_distance_m': repeat['traghetto'],
            'bridge_full_crossings': sum(full.values()),
            'bridge_full_crossing_repeats': sum(max(0, n - 1) for n in full.values()),
            'bridge_full_crossing_counts': dict(full), 'bridge_visit_reversals': reversal,
            'midpoint_visit_events': sum(visits.values()),
            'midpoint_repeat_visits': sum(max(0, n - 1) for n in visits.values()),
            'bridges_visited': len(visits), 'unique_graph_edges': len(seen),
            'repeated_edge_traversals': sum(n - 1 for n in seen.values())}


def load_inputs():
    """Reuse frozen s10 proof/inventory; rebuild original source graph read-only.

    Dogana's public original pier is clipped by the strict entire-way boundary.
    ONLY its two-node source prefix to the exact ferry terminal is admitted.
    User-authorized what-if additionally admits Santa Sofia's original indoor
    pier and Giglio's ferry foot=no. No unrelated access policy is relaxed.
    """
    old = json.loads((config.WEB_DATA / 'bridge-route.json').read_text(encoding='utf-8'))
    proof = json.loads((config.PROCESSED / 'bridge_route_proof.json').read_text(encoding='utf-8'))
    pbf = config.EXTRACTS['island']
    sha = hashlib.sha256(pbf.read_bytes()).hexdigest()
    assert sha == old['audit']['pbf_sha256'], 'Source changed: re-audit inventory first'
    assert len(proof['bridges']) == old['bridge_count'] == 346
    assert {b['id'] for b in proof['bridges']} == {b['id'] for b in old['bridges']}
    nodes, ways, tags, relations = s10.read_pbf(pbf)
    polygon, correction = s10.route_scope()
    assert correction['source_sha256'] == old['audit']['geographic_scope_correction']['source_sha256']
    graph, groups, audit = s10.build_topology(nodes, ways, tags, polygon)
    graph.remove_edges_from(old['audit']['peripheral_excluded_node_pairs'])
    graph = graph.subgraph(nx.node_connected_component(graph, proof['start_node_id'])).copy()
    nx.set_edge_attributes(graph, 'walk', 'mode')
    assert graph.number_of_nodes() == old['audit']['reachable_nodes']
    ferries_by_way = {}
    class Ferries(osmium.SimpleHandler):
        def way(self, w):
            if w.id in FERRY_IDS.values():
                ferries_by_way[w.id] = {'node_ids': [n.ref for n in w.nodes], 'source_tags': dict(w.tags)}
    Ferries().apply_file(str(pbf))
    approaches = []
    public_pier = next(w for w in ways if w['id'] == 292750093)
    assert public_pier['nodes'][:2] == [27178422, 8812616140]
    assert s10.access_reason(public_pier['tags']) is None
    assert 27178422 in graph
    approaches.append({'osm_way_id': public_pier['id'], 'node_ids': public_pier['nodes'][:2],
                       'source_tags': public_pier['tags'], 'boundary_exception': 'original public ferry-landing pier prefix only'})
    indoor_pier = next(w for w in ways if w['id'] == 216893107)
    assert indoor_pier['nodes'] == LANDING_PAIRS[216893107]
    assert indoor_pier['tags']['indoor'] == 'yes'
    assert indoor_pier['nodes'][0] in graph
    approaches.append({'osm_way_id': indoor_pier['id'], 'node_ids': indoor_pier['nodes'],
                       'source_tags': indoor_pier['tags'], 'traghetto_id': 'santa_sofia',
                       'routing_assumption': ASSUMPTION, 'access_overrides': {'indoor': 'yes'},
                       'assumed_availability': 'conditional_unverified_today',
                       'scope': 'exact original ferry landing pier; possible indoor landing building, access not verified'})
    xy = {n: s10.PROJECT.transform(*ll) for n, ll in nodes.items()}
    landing_graph = graph.copy()
    for a in approaches:
        assert add_landing_approach(landing_graph, xy, a)
    # Actual successful official-page extraction in the interrupted worker log,
    # not the time of this local export/rebuild.
    retrieved = '2026-10-23T18:55:34+00:00'
    source = {'url': OFFICIAL_URL, 'effective_from': '2021-06-07',
              'page_updated_search_index': '2025-09-18', 'retrieved_at': retrieved,
              'retrieval_method': 'web_extract official page; direct HTTP returned Incapsula stub',
              'evidence': SCHEDULE_EVIDENCE, 'live_operation_verified': False}
    ferries = []
    for fid, wid in FERRY_IDS.items():
        raw = ferries_by_way[wid]
        ids = raw['node_ids']
        coordinates = [list(nodes[n]) for n in ids]
        local = [[x - s10.ORIGIN[0], -(y - s10.ORIGIN[1])] for x, y in [xy[n] for n in ids]]
        eligible = add_ferry(landing_graph.copy(), xy, dict(raw, id=fid, osm_way_id=wid,
                                                          routing_assumption=ASSUMPTION))
        assert eligible, 'Municipal ferry not attached to verified original landings: ' + fid
        reason = None
        caveat = s10.prose(
            'Трагетто — лодки, не физические мосты и не 24/7. По разрешению пользователя все четыре доступны графу условно: только исходный пирс Santa Sofia indoor=yes и паром Giglio foot=no имеют явные исключения. Часы муниципалитета с 07.06.2021, работа и доступ сегодня не проверены; однодневность не доказана. Нет обслуживания 15/8, 25/12, 26/12, 1/1; 24/12 и 31/12 до 13:00. Dogana: OSM 10:00, муниципалитет 09:00. Геометрия и терминалы — исходные OSM.',
            'Traghetti in barca, non ponti fisici né servizio 24/7. Ipotesi autorizzata: tutti e quattro disponibili nel grafo; deroghe solo al pontile originale Santa Sofia indoor=yes e al traghetto Giglio foot=no. Orari comunali dal 07.06.2021; servizio e accesso odierni non verificati, fattibilità giornaliera non dimostrata. Chiuso 15/8, 25/12, 26/12, 1/1; 24/12 e 31/12 fino alle 13:00. Dogana OSM 10:00, Comune 09:00. Geometria e terminali originali OSM.',
            'Traghetti are boats, not physical bridges or 24/7 service. User-authorized what-if makes all four graph-eligible; overrides only original Santa Sofia pier indoor=yes and Giglio ferry foot=no. Municipal hours effective 2021-06-07; current operation/access unverified, no one-day feasibility proof. No service Aug 15, Dec 25/26, Jan 1; Dec 24/31 until 13:00. Dogana OSM 10:00 versus municipality 09:00. Geometry and terminals are original OSM.')
        endpoints = []
        for n in (ids[0], ids[-1]):
            x, y = xy[n]
            attached = [w for w in ways if n in w['nodes'] and w['tags'].get('highway')]
            endpoints.append({'node_id': n, 'lon': nodes[n][0], 'lat': nodes[n][1],
                              'x': x - s10.ORIGIN[0], 'z': -(y - s10.ORIGIN[1]),
                              'connected_walking_landing': n in landing_graph,
                              'source_approach_way_ids': [w['id'] for w in attached],
                              'source_approach_tags': [w['tags'] for w in attached]})
        ferries.append(dict(raw, id=fid, osm_way_id=wid, name=raw['source_tags']['name'],
                            coordinates=coordinates, local=local, endpoints=endpoints,
                            routing_eligible=eligible, routing_exclusion=reason,
                            routing_assumption=ASSUMPTION, access_overrides={'foot': 'no'} if fid == 'giglio' else {},
                            landing_access_overrides=[a for a in approaches if a.get('traghetto_id') == fid],
                            schedule=SCHEDULES[fid], schedule_source=source,
                            schedule_conflict=fid == 'dogana', availability='conditional_unverified_today',
                            holidays_closed=['08-15', '12-25', '12-26', '01-01'],
                            early_close={'12-24': '13:00', '12-31': '13:00'}, caveat=caveat))
    return graph, nodes, tags, proof, old, ferries, approaches


def read_checkpoint(path, midpoints, source_sha, inventory_sha=None):
    """Load ONLY an explicitly trusted internal pickle, checking source identity."""
    with Path(path).open('rb') as stream:
        data = pickle.load(stream)
    if inventory_sha is not None and data.get('inventory_sha256') != inventory_sha:
        raise ValueError('checkpoint inventory/scope changed')
    if data['midpoints'] != midpoints:
        raise ValueError('checkpoint midpoint definitions changed')
    n = len(midpoints) + 1
    d = data['distances']
    if d.shape != (n, n) or not np.isfinite(d).all() or not np.allclose(d, d.T):
        raise ValueError('checkpoint distance matrix invalid')
    if any(v['proof']['pbf_sha256'] != source_sha for v in data['variants']):
        raise ValueError('checkpoint source changed')
    return data


def prepare_export(variants, ferries, baseline_euler):
    """Adapt to unchanged viewer: ready is data validity, not ferry availability.

    UI repeat_distance_m means walking retrace. Preserve total retrace separately.
    Euler fields exist for schema compatibility but do not apply to midpoint TSP.
    """
    for f in ferries:
        f['source'] = {'url': f['schedule_source']['url'],
                       'date': 'Published hours effective ' + f['schedule_source']['effective_from'] + '; current service unverified'}
    for r in variants:
        r['availability'] = 'conditional_unverified_today' if r['status'] == 'conditional' else 'walking_access_unverified_today'
        r['status'] = 'ready'
        r['euler'] = dict(baseline_euler, applicable=False)
        s = r['stats']
        s['total_repeat_distance_m'] = s['repeat_distance_m']
        s['repeat_distance_m'] = s['walk_repeat_distance_m']
        r['repeat_distance_m'] = s['repeat_distance_m']
        r['traghetti'] = ferries
        for leg in r['legs']:
            if leg['mode'] == 'traghetto':
                leg['mode'] = 'boat'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--starts', type=int, default=40)
    parser.add_argument('--kicks', type=int, default=120)
    parser.add_argument('--resume', type=Path, help='Trusted internal pickle checkpoint only')
    args = parser.parse_args()
    existing = json.loads((config.WEB_DATA / 'bridge-visit-route.json').read_text(encoding='utf-8'))
    preserved_walk = existing['variants'][0]
    best_known_ferry = existing['variants'][1]
    graph, nodes, tags, proof, old, ferries, approaches = load_inputs()
    xy = {n: s10.PROJECT.transform(*ll) for n, ll in nodes.items()}
    land = nx.Graph()
    land.add_nodes_from(graph)
    land.add_edges_from((u, v) for u, v, d in graph.edges(data=True) if not d.get('bridge_id'))
    bank_components = list(nx.connected_components(land))
    components = {n: i for i, c in enumerate(bank_components) for n in c}
    banks = {n: components[n] for n in land if land.degree(n) > 0}
    midpoints = {}
    for b in proof['bridges']:
        node, evidence = insert_midpoint(graph, xy, b['path'], b['id'])
        midpoints[b['id']] = evidence
    start = proof['start_node_id']
    targets = [start] + [b['node'] for b in midpoints.values()]
    assert len(set(targets)) == 347
    index = {bid: i + 1 for i, bid in enumerate(midpoints)}
    seen = set()
    old_order = [0]
    for c in old['crossings']:
        if c['bridge_id'] not in seen:
            old_order.append(index[c['bridge_id']])
            seen.add(c['bridge_id'])
    old_order.append(0)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%SZ')
    checkpoint = Path(os.environ.get('TMPDIR', str(config.ROOT))) / ('venice-midpoint-progress-' + stamp + '.pickle')
    variants, previous_tour = [], None
    inventory_sha = hashlib.sha256((config.WEB_DATA / 'bridge-route.json').read_bytes()).hexdigest()
    resumed = read_checkpoint(args.resume, midpoints, old['audit']['pbf_sha256'], inventory_sha) if args.resume else None
    if resumed and resumed.get('matrix_mode') != 'walking':
        raise ValueError('checkpoint matrix is not walking closure')
    for assisted in (False, True):
        working = graph.copy()
        if assisted:
            for a in approaches:
                assert add_landing_approach(working, xy, a)
            for f in ferries:
                if f['routing_eligible']:
                    assert add_ferry(working, xy, f)
        print('Metric closure', 'traghetto' if assisted else 'walking', flush=True)
        distances = resumed['distances'] if not assisted and resumed else metric_closure(working, targets)
        with checkpoint.open('wb') as stream:
            pickle.dump({'midpoints': midpoints, 'distances': distances, 'variants': variants,
                         'inventory_sha256': inventory_sha, 'matrix_mode': 'traghetto' if assisted else 'walking'}, stream)
        seeds = [old_order] + ([previous_tour] if previous_tour else [])
        saved = best_known_ferry if assisted else preserved_walk
        seed, seen_seed = [0], set()
        for e in saved['crossings']:
            if e['bridge_id'] not in seen_seed and e['bridge_id'] in index:
                seen_seed.add(e['bridge_id'])
                seed.append(index[e['bridge_id']])
        seed = extend_seed(distances, seed + [0])
        seeds.append(seed)
        # Independently refine the previous optimum's extended order, so a
        # walking local minimum cannot suppress a different ferry basin.
        seeded_tour, seeded_optimization = optimize_tour(distances, starts=0, seeds=[seed], kicks=0)
        seeds.append(seeded_tour)
        tour, optimization = optimize_tour(distances, args.starts, seeds, args.kicks)
        optimization['previous_seed_refined_cost_m'] = seeded_optimization['selected_cost_m']
        optimization.update({'best_known_previous_distance_m': saved['distance_m'],
                             'previous_seed_extended_cost_m': tour_cost(distances, seed),
                             'previous_seed_inserted_ids': sorted(set(midpoints) - seen_seed),
                             'previous_seed_preserved': True})
        previous_tour = tour
        route = [start]
        for a, b in zip(tour, tour[1:]):
            route.extend(nx.shortest_path(working, targets[a], targets[b], weight='length')[1:])
        stats = route_stats(working, route, midpoints, banks)
        # The old route cannot be reused after negative midpoint IDs or scope
        # change. Its validated target order is instead extended and re-expanded.
        assert route[0] == route[-1] == start
        assert all(working.has_edge(u, v) for u, v in zip(route, route[1:]))
        assert {b['node'] for b in midpoints.values()} <= set(route)
        assert stats['bridges_visited'] == 346
        assert abs(stats['total_distance_m'] - optimization['selected_cost_m']) < 1e-6
        assert stats['total_distance_m'] < old['distance_m']
        if assisted:
            assert stats['total_distance_m'] <= variants[0]['distance_m'] + .001, 'Ferry heuristic regressed from walking seed'
            optimization['ferry_improvement_m'] = max(0., variants[0]['distance_m'] - stats['total_distance_m'])
            optimization['optional_ferries_used'] = stats['boat_distance_m'] > 0
        coordinates = [list(INVERSE.transform(*xy[n])) for n in route]
        local = [[round(xy[n][0] - s10.ORIGIN[0], 4), round(-(xy[n][1] - s10.ORIGIN[1]), 4)] for n in route]
        old_by_id = {b['id']: b for b in old['bridges']}
        point_bridge = {b['node']: bid for bid, b in midpoints.items()}
        visits, events = Counter(), []
        for i, n in enumerate(route):
            if n not in point_bridge:
                continue
            bid = point_bridge[n]
            b = old_by_id[bid]
            lon, lat = coordinates[i]
            x, z = local[i]
            visits[bid] += 1
            events.append({'bridge_id': bid, 'name': b['name'], 'lon': lon, 'lat': lat,
                           'x': x, 'z': z, 'coord': [lon, lat], 'repeat': visits[bid] > 1,
                           'route_index': i, 'start_index': i, 'end_index': i, 'event_type': 'midpoint_visit'})
        bridge_rows = []
        for bid, b in old_by_id.items():
            n = midpoints[bid]['node']
            lon, lat = INVERSE.transform(*xy[n])
            bridge_rows.append(dict(b, lon=lon, lat=lat, x=xy[n][0] - s10.ORIGIN[0],
                                    z=-(xy[n][1] - s10.ORIGIN[1]), visits=visits[bid],
                                    full_crossings=stats['bridge_full_crossing_counts'].get(bid, 0)))
        legs, ferry_events = [], []
        i = 0
        while i < len(route) - 1:
            attr = working[route[i]][route[i + 1]]
            mode, fid = attr.get('mode', 'walk'), attr.get('traghetto_id')
            j = i + 1
            while j < len(route) - 1:
                other = working[route[j]][route[j + 1]]
                if (other.get('mode', 'walk'), other.get('traghetto_id')) != (mode, fid):
                    break
                j += 1
            leg = {'mode': mode, 'coordinates': coordinates[i:j + 1], 'local': local[i:j + 1],
                   'start_index': i, 'end_index': j,
                   'distance_m': sum(working[u][v]['length'] for u, v in zip(route[i:j], route[i + 1:j + 1]))}
            if fid:
                leg['traghetto_id'] = fid
                leg['name'] = next(f['name'] for f in ferries if f['id'] == fid)
                leg['routing_assumption'] = ASSUMPTION
                ferry_events.append({'traghetto_id': fid, 'start_index': i, 'end_index': j,
                                     'distance_m': leg['distance_m'], 'conditional': True})
            legs.append(leg)
            i = j
        limitations = s10.prose(
            'Эвристика сетевого TSP, не глобальный оптимум; точные середины исходных 346 мостов, полный переход необязателен. Возвраты по половине моста учтены. Исходные исключения и ограничения сохранены. Пользователь разрешил считать четыре трагетто соединителями графа: это лодки, не мосты и не 24/7. Явные исключения только Santa Sofia: исходный пирс indoor=yes, Giglio: паром foot=no; Dogana: исходный сегмент пирса за строгой границей. Работа и доступ сегодня, ожидание и расписание не проверены, однодневность не доказана.',
            'Euristica TSP di rete, non ottimo globale; punti medi esatti dei 346 ponti originali, attraversamento completo facoltativo. Ritorni su mezzo ponte conteggiati; esclusioni originali mantenute. Ipotesi autorizzata: quattro traghetti come connessioni, barche non ponti né servizio 24/7. Deroghe solo Santa Sofia pontile originale indoor=yes, Giglio traghetto foot=no; Dogana segmento originale oltre confine. Servizio/accesso odierni, attese e fattibilità giornaliera non verificati.',
            'Network TSP heuristic, not global optimum; exact original 346 bridge midpoints, full crossing optional. Half-deck retrace counted; original exclusions/restrictions retained. User-authorized bridge-like graph assumption for all four traghetti: boats, not physical bridges or 24/7 service. Overrides only Santa Sofia original pier indoor=yes and Giglio ferry foot=no; Dogana original pier boundary exception. Current service/access, waiting times and one-day schedule feasibility unverified.')
        semantics = s10.prose(
            'crossings — события достижения середины, repeat_crossings — повторные посещения середины, НЕ полные переходы. Полные переходы и их повторы отдельно в stats; это проход между различными исходными береговыми компонентами по одному мосту.',
            'crossings indica arrivi al punto medio; repeat_crossings conta visite ripetute, NON attraversamenti completi. Attraversamenti completi e ripetizioni separati in stats: percorso su un ponte tra due componenti originali di riva diverse.',
            'crossings are midpoint-arrival events; repeat_crossings counts repeated midpoint visits, NOT full crossings. Full crossings/repeats are separate in stats: contiguous single-bridge run between distinct original land components.')
        name = 'traghetto_midpoints' if assisted else 'walking_midpoints'
        total = round(stats['total_distance_m'], 3)
        stats = {k: round(v, 3) if isinstance(v, float) else v for k, v in stats.items()}
        summary = s10.prose(
            f'346 середины мостов; {total / 1000:.3f} км, {stats["midpoint_repeat_visits"]} повторных посещений середины; возвраты: {stats["bridge_visit_reversals"]}. Сан-Марко — Сан-Марко. ' + ('Условный маршрут с трагетто; не однодневное расписание.' if assisted else 'Только пешком.'),
            f'346 punti medi; {total / 1000:.3f} km, {stats["midpoint_repeat_visits"]} visite ripetute; ritorni: {stats["bridge_visit_reversals"]}. San Marco — San Marco. ' + ('Traghetti condizionali; non orario giornaliero.' if assisted else 'Solo a piedi.'),
            f'346 bridge midpoints; {total / 1000:.3f} km, {stats["midpoint_repeat_visits"]} repeated midpoint arrivals; returns: {stats["bridge_visit_reversals"]}. San Marco — San Marco. ' + ('Conditional traghetti, not a one-day timetable.' if assisted else 'Walking only.'))
        variant = {'id': name, 'visit_mode': True, 'title': s10.prose(
            'Середины 346 мостов' + (' + трагетто (условно)' if assisted else ' — пешком'),
            'Punti medi di 346 ponti' + (' + traghetti (condizionale)' if assisted else ' — a piedi'),
            '346 bridge midpoints' + (' + traghetti (conditional)' if assisted else ' — walking')),
            'summary': summary, 'limitations': limitations, 'event_semantics': semantics,
            'status': 'conditional' if assisted else 'ready', 'start': dict(old['start']),
            'distance_m': total, 'walk_distance_m': stats['walk_distance_m'],
            'boat_distance_m': stats['boat_distance_m'], 'total_distance_m': total,
            'repeat_distance_m': stats['repeat_distance_m'], 'stats': stats,
            'bridge_count': 346, 'repeat_crossings': stats['midpoint_repeat_visits'],
            'coordinates': coordinates, 'local': local, 'bridges': bridge_rows, 'crossings': events,
            'legs': legs, 'ferry_events': ferry_events, 'traghetti': ferries,
            'schedule_feasible': False, 'optimization': optimization,
            'excluded': old['excluded'], 'source': old['source'],
            'gpx': 'data/bridge-visit-route.gpx', 'gpx_track_id': name,
            'baseline_distance_m': old['distance_m'], 'savings_m': round(old['distance_m'] - total, 3),
            'audit': {'limitations': limitations, 'verified': {'closed': True, 'midpoints_346': True,
                      'original_or_split_adjacency': True, 'ferry_membership': True},
                      'scope': old['audit']['scope'], 'geographic_scope_correction': old['audit']['geographic_scope_correction'], 'dead_end_exclusion_count': 19,
                      'routing_assumption': ASSUMPTION if assisted else None,
                      'routing_eligible_ferry_ids': [f['id'] for f in ferries if f['routing_eligible']] if assisted else [],
                      'access_overrides': ([{'osm_way_id': a['osm_way_id'], 'node_ids': a['node_ids'],
                                            'source_tags': a['source_tags'], 'access_overrides': a['access_overrides']}
                                           for a in approaches if a.get('access_overrides')] +
                                           [{'osm_way_id': f['osm_way_id'], 'node_ids': f['node_ids'],
                                             'source_tags': f['source_tags'], 'access_overrides': f['access_overrides']}
                                            for f in ferries if f['access_overrides']]) if assisted else [],
                      'landing_approach_exceptions': approaches if assisted else []},
            'proof': {'route_node_ids': route, 'start_node_id': start,
                      'midpoints': list(midpoints.values()), 'pbf_sha256': old['audit']['pbf_sha256'],
                      'original_route_sha256': hashlib.sha256((config.WEB_DATA / 'bridge-route.json').read_bytes()).hexdigest(),
                      'split_crs': config.CRS_METRIC, 'landing_approaches': approaches if assisted else []}}
        variants.append(variant)
        with checkpoint.open('wb') as stream:
            pickle.dump({'midpoints': midpoints, 'distances': distances, 'variants': variants,
                         'inventory_sha256': inventory_sha, 'matrix_mode': 'traghetto' if assisted else 'walking'}, stream)
        print(json.dumps({'variant': name, 'stats': stats, 'optimization': optimization}, ensure_ascii=False), flush=True)
    prepare_export(variants, ferries, old['euler'])
    for r in variants:
        # Preserve literal original San Marco longitude/latitude; avoid inverse
        # projection roundoff changing the frozen start coordinate identifier.
        r['coordinates'][0] = list(old['coordinates'][0])
        r['coordinates'][-1] = list(old['coordinates'][0])
        for leg in r['legs']:
            leg['coordinates'] = r['coordinates'][leg['start_index']:leg['end_index'] + 1]
    ns = 'http://www.topografix.com/GPX/1/1'
    ET.register_namespace('', ns)
    root = ET.Element('{' + ns + '}gpx', version='1.1', creator='Venice midpoint network routing')
    for r in variants:
        track = ET.SubElement(root, '{' + ns + '}trk')
        ET.SubElement(track, '{' + ns + '}name').text = r['id']
        ET.SubElement(track, '{' + ns + '}desc').text = ' / '.join(r['summary'].values())
        for leg in r['legs']:
            seg = ET.SubElement(track, '{' + ns + '}trkseg')
            for lon, lat in leg['coordinates']:
                ET.SubElement(seg, '{' + ns + '}trkpt', lon=str(lon), lat=str(lat))
            ext = ET.SubElement(seg, '{' + ns + '}extensions')
            ET.SubElement(ext, '{' + ns + '}mode').text = leg['mode']
            if leg.get('traghetto_id'):
                ET.SubElement(ext, '{' + ns + '}traghetto_id').text = leg['traghetto_id']
    ET.ElementTree(root).write(config.WEB_DATA / 'bridge-visit-route.gpx', encoding='utf-8', xml_declaration=True)
    wrapper = {'schema_version': 1, 'generated_at': datetime.now(timezone.utc).isoformat(),
               'variants': variants, 'traghetti': ferries, 'original_full_crossing_route': 'data/bridge-route.json'}
    (config.WEB_DATA / 'bridge-visit-route.json').write_text(json.dumps(wrapper, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (config.WEB_DATA / 'traghetti.json').write_text(json.dumps({'schema_version': 1, 'traghetti': ferries}, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Exported additive JSON + two-track GPX; checkpoint ' + str(checkpoint), flush=True)
    return wrapper


if __name__ == '__main__':
    main()
