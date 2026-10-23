"""OSM pedestrian bridge postman route, scoped to Venice main-island relation 4817103.

Run: python -m venice.s10_bridge_route (with PYTHONPATH=pipeline).
No fabricated shortcuts: every emitted segment is an original adjacent OSM node pair.
The bridge inventory is an audited interpretation of this extract, not an official census.
"""
import hashlib
import itertools
import json
import math
from collections import Counter, defaultdict
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

import networkx as nx
import osmium
from pyproj import Transformer
from shapely.geometry import LineString, Point, Polygon, shape
from shapely import transform as shapely_transform
from shapely.strtree import STRtree

from venice import config

FORBIDDEN = {'no', 'private', 'customers', 'permit', 'delivery', 'destination', 'agricultural', 'forestry'}
PUBLIC = {'yes', 'designated', 'permissive'}
HIGHWAYS = {'footway', 'pedestrian', 'steps', 'path', 'living_street', 'residential',
            'service', 'unclassified', 'tertiary', 'secondary', 'primary', 'road', 'cycleway'}
PROJECT = Transformer.from_crs(config.CRS_WEB, config.CRS_METRIC, always_xy=True)
ORIGIN = PROJECT.transform(*config.ORIGIN_LONLAT)


def prose(ru, it, en):
    return {'ru': ru, 'it': it, 'en': en}


def transform(fn, geom):
    return shapely_transform(geom, fn, interleaved=False)


def select_crossing(choices, component, components):
    """Prefer genuine land attachments, then full distant portals, then shorter walk."""
    return max(choices, key=lambda c: (
        min(len(components[component[c[2][0]]]), len(components[component[c[2][-1]]])),
        c[0], -c[1]))


def restriction(tags):
    """Foot-specific rules override generic access, but conditional access is unresolved."""
    foot = tags.get('foot', tags.get('access', 'yes'))
    if foot not in PUBLIC:
        return 'access:' + str(foot)
    if tags.get('foot:conditional') or (tags.get('access:conditional') and tags.get('foot') not in PUBLIC):
        return 'conditional_access'
    if tags.get('opening_hours') not in (None, '', '24/7'):
        return 'opening_hours'
    if tags.get('locked') == 'yes':
        return 'locked'
    return None


def access_reason(tags):
    if tags.get('route') == 'ferry' or tags.get('ferry') == 'yes':
        return 'ferry'
    if tags.get('highway') not in HIGHWAYS:
        return 'not_pedestrian_highway'
    if tags.get('highway') == 'cycleway' and tags.get('foot') not in PUBLIC:
        return 'cycleway_without_foot_permission'
    if tags.get('construction') or tags.get('proposed') or tags.get('disused') == 'yes':
        return 'construction_or_disused'
    if tags.get('indoor') == 'yes':
        return 'indoor'
    if tags.get('oneway:foot') in {'yes', '-1'}:
        return 'directed_foot_access_unresolved'
    return restriction(tags)


def read_pbf(path):
    nodes, node_tags, ways, relations = {}, {}, [], []
    class Reader(osmium.SimpleHandler):
        def node(self, n):
            nodes[n.id] = (n.location.lon, n.location.lat)
            if len(n.tags):
                node_tags[n.id] = {t.k: t.v for t in n.tags}
        def way(self, w):
            tags = {t.k: t.v for t in w.tags}
            if 'highway' in tags or tags.get('man_made') == 'bridge' or tags.get('bridge', 'no') != 'no':
                ways.append({'id': w.id, 'nodes': [n.ref for n in w.nodes], 'tags': tags})
        def relation(self, r):
            tags = {t.k: t.v for t in r.tags}
            if tags.get('man_made') == 'bridge' or tags.get('type') == 'bridge':
                relations.append({'id': r.id, 'tags': tags,
                                  'members': [(m.type, m.ref, m.role) for m in r.members]})
    reader = Reader()
    reader.apply_file(str(path))
    return nodes, ways, node_tags, relations


def build_topology(nodes, ways, node_tags, polygon, decks=None):
    """Build original-node adjacency and physical bridge groups; retain restricted audit.

    A mapped deck is strong identity evidence for parallel paths. Without a deck,
    only connected bridge ways with compatible names are merged. No snapping.
    """
    metric = {n: PROJECT.transform(*ll) for n, ll in nodes.items()}
    scope = transform(PROJECT.transform, polygon) if polygon is not None else None
    decks = list(decks or [])
    if not decks:
        for w in ways:
            if w['tags'].get('man_made') != 'bridge' or len(w['nodes']) < 4 or w['nodes'][0] != w['nodes'][-1]:
                continue
            if any(n not in nodes for n in w['nodes']):
                continue
            geom = Polygon([nodes[n] for n in w['nodes']])
            if not geom.is_valid:
                geom = geom.buffer(0)
            if scope is None or scope.covers(transform(PROJECT.transform, geom).representative_point()):
                decks.append({'id': 'd' + str(w['id']), 'name': w['tags'].get('name', ''),
                              'geometry': geom, 'tags': w['tags']})
    deck_shapes = [transform(PROJECT.transform, d['geometry']) for d in decks]
    tree = STRtree(deck_shapes)
    candidates, accepted, reasons = [], [], Counter()
    blocked_nodes = {n: restriction(t) for n, t in node_tags.items() if restriction(t)}
    missing_nodes = []
    for w in ways:
        tags = w['tags']
        if not tags.get('highway'):
            continue
        if len(w['nodes']) < 2 or any(n not in metric for n in w['nodes']):
            missing_nodes.append(w['id'])
            continue
        line = LineString([metric[n] for n in w['nodes']])
        # Strict clip: all traversable nodes remain on the main island, not the buffered extract.
        if scope is not None and not scope.covers(line):
            continue
        tagged = tags.get('bridge', 'no') not in ('no', '', '0')
        matches = []
        for i in tree.query(line):
            overlap = line.intersection(deck_shapes[i]).length
            if overlap > 0.5 and (tagged or overlap / max(line.length, 0.01) > 0.6):
                matches.append((overlap, int(i)))
        deck_idx = max(matches)[1] if matches else None
        reason = access_reason(tags)
        if reason is None and any(n in blocked_nodes for n in w['nodes']):
            reason = 'restricted_node'
        if reason is None and deck_idx is not None:
            reason = restriction(decks[deck_idx].get('tags', {}))
        rec = {**w, 'line': line, 'reason': reason, 'deck_idx': deck_idx}
        if tagged or deck_idx is not None:
            candidates.append(rec)
        if reason is None:
            accepted.append(rec)
        else:
            reasons[reason] += 1
    identities = nx.Graph()
    identities.add_nodes_from(range(len(candidates)))
    by_deck, by_node = defaultdict(list), defaultdict(list)
    for i, c in enumerate(candidates):
        if c['deck_idx'] is not None:
            by_deck[c['deck_idx']].append(i)
        for n in c['nodes']:
            by_node[n].append(i)
    for group in by_deck.values():
        identities.add_edges_from(zip(group, group[1:]))
    for group in by_node.values():
        for a, b in itertools.combinations(group, 2):
            ca, cb = candidates[a], candidates[b]
            da, db = ca['deck_idx'], cb['deck_idx']
            # Distinct mapped decks never collapse just because a landing node is shared.
            if da is not None and db is not None and da != db:
                continue
            na, nb = ca['tags'].get('name', ''), cb['tags'].get('name', '')
            if not na or not nb or na.casefold() == nb.casefold():
                identities.add_edge(a, b)
    bridges, way_bridge, used_decks = [], {}, set()
    for group in sorted(nx.connected_components(identities), key=lambda s: min(candidates[i]['id'] for i in s)):
        rows = [candidates[i] for i in sorted(group)]
        deck_indices = {r['deck_idx'] for r in rows if r['deck_idx'] is not None}
        used_decks.update(deck_indices)
        bid = decks[min(deck_indices)]['id'] if deck_indices else 'w' + str(min(r['id'] for r in rows))
        names = {r['tags']['name'] for r in rows if r['tags'].get('name')}
        name = next((decks[i]['name'] for i in sorted(deck_indices) if decks[i]['name']), '') or (sorted(names)[0] if names else '')
        allowed = [r for r in rows if r['reason'] is None]
        bridges.append({'id': bid, 'name': name, 'way_ids': [r['id'] for r in rows],
                        'allowed_way_ids': [r['id'] for r in allowed],
                        'restricted_ways': [{'id': r['id'], 'reason': r['reason']} for r in rows if r['reason']],
                        'names': sorted(names), 'deck_ids': [decks[i]['id'] for i in sorted(deck_indices)],
                        'geometry': rows[0]['line']})
        for r in rows:
            way_bridge[r['id']] = bid
    graph = nx.Graph()
    for w in accepted:
        bid = way_bridge.get(w['id'])
        for u, v in zip(w['nodes'], w['nodes'][1:]):
            if u == v:
                continue
            length = math.dist(metric[u], metric[v])
            attr = {'length': length, 'way_id': w['id'], 'bridge_id': bid}
            if graph.has_edge(u, v):
                # Preserve the stricter bridge classification on duplicate mapped centre lines.
                if bid and not graph[u][v].get('bridge_id'):
                    graph[u][v].update(attr)
            else:
                graph.add_edge(u, v, **attr)
    unresolved_decks = [{'id': d['id'], 'name': d['name'],
                         'reason_code': 'deck_without_mapped_highway',
                         'lon': d['geometry'].representative_point().x,
                         'lat': d['geometry'].representative_point().y}
                        for i, d in enumerate(decks) if i not in used_decks]
    audit = {'scoped_decks': len(decks), 'scoped_bridge_highway_ways': len(candidates),
             'physical_groups': len(bridges), 'accepted_highway_ways': len(accepted),
             'excluded_highway_reasons': dict(reasons), 'missing_node_way_ids': missing_nodes,
             'unresolved_decks': unresolved_decks, 'node_count': graph.number_of_nodes(),
             'edge_count': graph.number_of_edges(), 'restricted_node_count': len(blocked_nodes)}
    return graph, bridges, audit


def postman(graph, start):
    """Exact minimum repeated edge count on a connected undirected bridge multigraph.

    Shortest paths minimize bridge crossings first and bridge-deck length second.
    Blossom minimum perfect matching pairs odd-degree land components. No claim
    of optimal total walking length: free land transfers are expanded afterwards.
    """
    if not nx.is_connected(graph):
        raise ValueError('disconnected required bridge graph')
    odd = sorted(n for n, degree in graph.degree() if degree % 2)
    # Any matching uses at most |odd|/2 simple paths, each no longer than the
    # sum of all original deck lengths. This strict bound proves lexicographic
    # priority for repeated crossing count, irrespective of length differences.
    scale = math.ceil(max(1, len(odd) // 2) * sum(d['length'] for _, _, d in graph.edges(data=True)) + 1)
    simple = nx.Graph()
    for u, v, k, d in graph.edges(keys=True, data=True):
        weight = scale + d['length']
        if not simple.has_edge(u, v) or weight < simple[u][v]['weight']:
            simple.add_edge(u, v, weight=weight, key=k)
    distances, paths = {}, {}
    for u in odd:
        distances[u], paths[u] = nx.single_source_dijkstra(simple, u, weight='weight')
    closure = nx.Graph()
    for u, v in itertools.combinations(odd, 2):
        closure.add_edge(u, v, weight=distances[u][v])
    matching = nx.min_weight_matching(closure, weight='weight')
    augmented = nx.MultiGraph(graph)
    repeats = 0
    for u, v in sorted(tuple(sorted(pair)) for pair in matching):
        path = paths[u][v]
        for a, b in zip(path, path[1:]):
            key = simple[a][b]['key']
            augmented.add_edge(a, b, key='repeat-' + str(repeats), **graph[a][b][key])
            repeats += 1
    assert nx.is_eulerian(augmented)
    route = [(u, v, augmented[u][v][k]['bridge_id'])
             for u, v, k in nx.eulerian_circuit(augmented, source=start, keys=True)]
    return route, odd, repeats


def distance_aware_euler_order(circuit, start_node, portals, transfer_distance):
    """Fleury nearest-portal heuristic on the SAME augmented edge multiset.

    ``portals(bid, bank)`` returns (entry, exit) for an oriented crossing,
    or a single portal when both ends coincide. Only non-cut edges may be
    consumed unless forced: this preserves feasibility of the remaining
    Euler trail, including parallel repeats and self-loops. Compare complete
    closed transfer costs and retain the baseline if the heuristic is worse.
    Deck costs are invariant under reordering. No global optimum claim.
    """
    def ends(bid, bank):
        pair = portals(bid, bank)
        return pair if isinstance(pair, tuple) else (pair, pair)

    def cost(route):
        here, total = start_node, 0.0
        for u, _, bid in route:
            entry, here_after = ends(bid, u)
            total += transfer_distance(here, entry)
            here = here_after
        return total + transfer_distance(here, start_node)

    remaining = nx.MultiGraph()
    for key, (u, v, bid) in enumerate(circuit):
        remaining.add_edge(u, v, key=key, bridge_id=bid)
    if not circuit or not nx.is_eulerian(remaining):
        raise ValueError('ordering requires a nonempty closed Euler circuit')
    start_bank = circuit[0][0]
    bank, here, candidate = start_bank, start_node, []
    while remaining.number_of_edges():
        choices = list(remaining.edges(bank, keys=True, data=True))
        # A simple-graph cut with parallel copies is NOT a multigraph cut.
        cuts = {frozenset((u, v)) for u, v in nx.bridges(nx.Graph(remaining))
                if remaining.number_of_edges(u, v) == 1}
        safe = [e for e in choices if frozenset(e[:2]) not in cuts]
        eligible = safe or choices
        if not eligible:
            raise AssertionError('Euler ordering stranded unused edges')
        u, v, key, attr = min(eligible, key=lambda e: (
            transfer_distance(here, ends(e[3]['bridge_id'], bank)[0]), e[2]))
        bid = attr['bridge_id']
        candidate.append((bank, v, bid))
        here = ends(bid, bank)[1]
        remaining.remove_edge(u, v, key)
        bank = v
    assert bank == start_bank
    signature = lambda route: Counter((min(u, v), max(u, v), bid) for u, v, bid in route)
    assert signature(candidate) == signature(circuit)
    assert all(a[1] == b[0] for a, b in zip(candidate, candidate[1:]))
    baseline_cost, candidate_cost = cost(circuit), cost(candidate)
    selected = candidate if candidate_cost < baseline_cost else circuit
    return selected, {'method': 'nearest-portal Fleury; baseline fallback',
                      'baseline_transfer_m': baseline_cost,
                      'candidate_transfer_m': candidate_cost,
                      'selected_transfer_m': min(baseline_cost, candidate_cost),
                      'selected': 'distance-aware' if selected is candidate else 'baseline',
                      'same_augmented_edge_multiset': True}


def improve_closed_subtrails(circuit, start_node, portals, transfer_distance):
    """Deterministic best-improvement reversal of closed subtrails (local heuristic).

    Reversing a subtrail with identical end banks preserves every required edge.
    Symmetric land distances leave internal costs unchanged. Skip self-loop
    crossings because their bank alone does not encode their path orientation.
    """
    route = list(circuit)
    def ends(edge):
        return portals(edge[2], edge[0])
    def cost(edges):
        here, total = start_node, 0.0
        for edge in edges:
            entry, exit_node = ends(edge)
            total += transfer_distance(here, entry)
            here = exit_node
        return total + transfer_distance(here, start_node)
    baseline = cost(route)
    improvements = 0
    while True:
        best, move = -1e-7, None
        for i in range(len(route)):
            prev = start_node if i == 0 else ends(route[i - 1])[1]
            first = ends(route[i])[0]
            for j in range(i + 2, len(route) + 1):
                if route[j - 1][0] == route[j - 1][1]:
                    break
                if any(u == v for u, v, _ in route[i:j]):
                    break
                if route[i][0] != route[j - 1][1]:
                    continue
                last = ends(route[j - 1])[1]
                next_node = start_node if j == len(route) else ends(route[j])[0]
                delta = (transfer_distance(prev, last) + transfer_distance(first, next_node)
                         - transfer_distance(prev, first) - transfer_distance(last, next_node))
                if delta < best:
                    best, move = delta, (i, j)
        if move is None:
            break
        i, j = move
        route[i:j] = [(v, u, bid) for u, v, bid in reversed(route[i:j])]
        improvements += 1
    selected = cost(route)
    assert selected <= baseline + 1e-6
    assert Counter((min(u, v), max(u, v), b) for u, v, b in route) == Counter(
        (min(u, v), max(u, v), b) for u, v, b in circuit)
    return route, {'baseline_transfer_m': baseline, 'selected_transfer_m': selected,
                   'closed_subtrail_reversals': improvements}


def immediate_deadends(records, land, components):
    """One-pass leaf-bank test on ORIGINAL real bridge attachments, never a 2-core.

    A real bank has an outward bridge-free pedestrian edge. Isolated stair/deck
    nodes are not banks. Count distinct physical bridges at all real portals,
    not representative paths alone; exclude only a selected crossing entering
    a real bank whose sole incident bridge is itself. Do not recompute leaves.
    """
    incident = defaultdict(set)
    for bid, b in records.items():
        for bank in b['real_banks']:
            incident[bank].add(bid)
    excluded = []
    for bid, b in records.items():
        evidence = []
        for bank in sorted(set(b['banks']) & set(b['real_banks'])):
            if incident[bank] != {bid} or len(set(b['banks'])) < 2:
                continue
            outward = list(land.subgraph(components[bank]).edges(data=True))
            if not outward:
                continue
            evidence.append({'bank_id': bank, 'node_count': len(components[bank]),
                'representative_node_id': min(components[bank]),
                'land_edge_count': len(outward),
                'outward_way_ids': sorted({d['way_id'] for _, _, d in outward}),
                'portal_node_ids': sorted(set(b['portals']) & components[bank]),
                'incident_bridge_ids': sorted(incident[bank])})
        if evidence:
            excluded.append({'id': bid, 'name': b['name'],
                             'reason_code': 'immediate_pedestrian_dead_end',
                             'dead_end_banks': evidence})
    return excluded


def main():
    pbf = config.EXTRACTS['island']
    nodes, ways, tags, relations = read_pbf(pbf)
    polygon = shape(json.loads(config.OSM_POLYGONS['island'].read_text(encoding='utf-8'))['features'][0]['geometry'])
    graph, groups, audit = build_topology(nodes, ways, tags, polygon)
    # Start is an actual node on a mapped Piazza San Marco walking way, not a snapped invented point.
    piazzale = {n for w in ways if w['tags'].get('name') == 'Piazza San Marco' and access_reason(w['tags']) is None
                for n in w['nodes'] if n in graph}
    if not piazzale:
        raise ValueError('No public Piazza San Marco walking node in extract')
    start = min(piazzale, key=lambda n: math.dist(PROJECT.transform(*nodes[n]),
                                               PROJECT.transform(12.3387, 45.4340)))
    reachable = nx.node_connected_component(graph, start)
    graph = graph.subgraph(reachable).copy()
    land = nx.Graph()
    land.add_nodes_from(graph)
    land.add_edges_from((u, v, dict(d)) for u, v, d in graph.edges(data=True) if not d['bridge_id'])
    components = sorted(nx.connected_components(land), key=lambda s: min(s))
    component = {n: i for i, c in enumerate(components) for n in c}
    bridge_edges = defaultdict(list)
    for u, v, d in graph.edges(data=True):
        if d['bridge_id']:
            bridge_edges[d['bridge_id']].append((u, v, d))
    required = nx.MultiGraph()
    records, excluded, unresolved = {}, [], []
    for b in groups:
        edges = bridge_edges[b['id']]
        if not b['allowed_way_ids']:
            codes = sorted({r['reason'] for r in b['restricted_ways']})
            excluded.append({'id': b['id'], 'name': b['name'], 'reason_code': ','.join(codes)})
            continue
        if not edges:
            excluded.append({'id': b['id'], 'name': b['name'], 'reason_code': 'disconnected_from_start'})
            continue
        bg = nx.Graph()
        bg.add_edges_from(edges)
        portals = [n for n in bg if land.degree(n) > 0 or bg.degree(n) == 1]
        banks = sorted({component[n] for n in portals})
        choices = []
        for connected in nx.connected_components(bg):
            pts = [n for n in portals if n in connected]
            for a, z in itertools.combinations(pts, 2):
                if len(banks) > 1 and component[a] == component[z]:
                    continue
                path = nx.shortest_path(bg, a, z, weight='length')
                length = sum(bg[u][v]['length'] for u, v in zip(path, path[1:]))
                # Farthest portals select an entire crossing, never a partial deck visit.
                choices.append((math.dist(PROJECT.transform(*nodes[a]), PROJECT.transform(*nodes[z])), length, path))
        if not choices:
            unresolved.append({'id': b['id'], 'name': b['name'], 'reason_code': 'no_complete_crossing',
                               'land_components': banks, 'portals': portals})
            continue
        if len(banks) > 2:
            audit.setdefault('multi_portal_bridges', []).append({'id': b['id'], 'name': b['name'],
                'land_components': banks, 'portals': portals,
                'method': prose('Выбраны порталы с наиболее связными берегами, затем наиболее удалённые. Эвристика требует проверки; боковые ветви не отдельные мосты.',
                    'Scelti i portali con rive più connesse, poi più distanti. Euristica da verificare; rami laterali non sono ponti distinti.',
                    'Prefer most connected land banks, then farthest portals. Heuristic needs review; side branches are not separate bridges.')})
        _, length, path = select_crossing(choices, component, components)
        a, z = component[path[0]], component[path[-1]]
        required.add_edge(a, z, key=b['id'], bridge_id=b['id'], length=length)
        mid = LineString([PROJECT.transform(*nodes[n]) for n in path]).interpolate(length / 2)
        inverse = Transformer.from_crs(config.CRS_METRIC, config.CRS_WEB, always_xy=True)
        lon, lat = inverse.transform(mid.x, mid.y)
        records[b['id']] = {**b, 'path': path, 'banks': [a, z], 'length': length,
                            'real_banks': sorted({component[n] for n in portals if land.degree(n) > 0}),
                            'portals': portals,
                            'lon': lon, 'lat': lat, 'x': mid.x - ORIGIN[0], 'z': -(mid.y - ORIGIN[1])}
    original_records = dict(records)
    deadends = immediate_deadends(records, land, components)
    audit['dead_end_exclusions'] = deadends
    audit['dead_end_exclusion_count'] = len(deadends)
    audit['dead_end_criterion'] = prose(
        'Однократная проверка исходных берегов: есть пешеходный выход без мостов, но нет другого настоящего моста. Изолированные узлы настила/ступеней не считаются берегом. Цепочки рекурсивно не удаляются.',
        'Un solo controllo delle rive originali: accesso pedonale senza ponti, ma nessun altro ponte reale. Nodi isolati di impalcato/scale non sono rive. Nessuna rimozione ricorsiva delle catene.',
        'One-pass test of original banks: outward bridge-free pedestrian access exists, but no other real bridge is incident. Isolated deck/stair nodes are not banks. Bridge chains are not recursively pruned.')
    for entry in deadends:
        records.pop(entry['id'])
    excluded.extend(deadends)
    required = nx.MultiGraph()
    for bid, b in records.items():
        required.add_edge(*b['banks'], key=bid, bridge_id=bid, length=b['length'])
    audit['ambiguous_portals'] = unresolved
    # Publish source tags rather than inferring public/nonpublic from a famous name.
    by_way = {w['id']: w for w in ways}
    details = []
    metric_scope = transform(PROJECT.transform, polygon)
    highway_shapes = [(w, LineString([PROJECT.transform(*nodes[n]) for n in w['nodes']]))
                      for w in ways if w['tags'].get('highway') and len(w['nodes']) > 1
                      and all(n in nodes for n in w['nodes'])]
    pending = [(d, 'unmatched_deck', [int(d['id'][1:])]) for d in audit['unresolved_decks']]
    pending += [(d, 'no_complete_crossing', next(b['way_ids'] for b in groups if b['id'] == d['id']))
                for d in unresolved]
    pending += [(d, 'disconnected', next(b['way_ids'] for b in groups if b['id'] == d['id']))
                for d in excluded if d['reason_code'] == 'disconnected_from_start']
    for d, category, ids in pending:
        source = [{'way_id': i, 'tags': by_way[i]['tags']} for i in ids]
        if d['id'].startswith('d') and int(d['id'][1:]) in by_way and int(d['id'][1:]) not in ids:
            source.append({'way_id': int(d['id'][1:]), 'tags': by_way[int(d['id'][1:])]['tags']})
        nearby = []
        if category == 'unmatched_deck':
            deck = by_way[int(d['id'][1:])]
            geom = transform(PROJECT.transform, Polygon([nodes[n] for n in deck['nodes']]))
            for w, line in highway_shapes:
                gap = geom.distance(line)
                if gap < 10:
                    nearby.append({'way_id': w['id'], 'tags': w['tags'],
                                   'distance_m': round(gap, 3),
                                   'overlap_m': round(geom.intersection(line).length, 3),
                                   'entirely_in_scope': metric_scope.covers(line),
                                   'access_reason': access_reason(w['tags'])})
            clipped = [w for w in nearby if w['overlap_m'] > 0.5 and not w['entirely_in_scope']]
            if clipped:
                text = 'Nearby mapped pedestrian/bridge highways overlap this deck but fail strict entire-way island clipping. No access prohibition is tagged on those paths; exclusion is scope/topology, not evidence of private access.'
            else:
                text = 'Deck polygon has no matched scoped highway crossing; its tags do not establish public pedestrian access. No path is invented. Nearby highways (within 10m), if any, are evidence only, never snapped connectors.'
        elif any(s['tags'].get('man_made') == 'pier' for s in source):
            text = 'Mapped as man_made=pier and highway=footway, with no access prohibition; a landing/pier network, not a verified two-bank bridge. Only one land portal remains.'
        elif any(s['tags'].get('access') == 'private' for s in source):
            text = 'Private steps/footway are explicit in the group. Its unrestricted stub cannot be reached after private approaches are filtered; not a complete public through-crossing.'
        elif any(s['tags'].get('foot') == 'yes' for s in source):
            text = 'Explicit foot=yes permits pedestrians, but this scoped segment is disconnected from Piazza San Marco after strict clipping/access filtering. Not classified as private; no connector invented.'
        else:
            text = 'Highway=footway without an access prohibition is public by the stated default policy, but its original-node segment is disconnected. Actual public through-access remains unverified.'
        details.append({'id': d['id'], 'name': d['name'], 'category': category,
                        'source_tags': source, 'nearby_highways': nearby,
                        'assessment': prose(
                            'Оценка по исходным тегам OSM (англ.): ' + text,
                            'Valutazione dai tag OSM originali (inglese): ' + text, text)})
    audit['unresolved_details'] = details
    audit['inventory'] = [{'id': b['id'], 'name': b['name'], 'way_ids': b['way_ids'],
        'deck_ids': b['deck_ids'], 'names': b['names'],
        'status': 'required' if b['id'] in records else ('excluded' if b['id'] in {e['id'] for e in excluded} else 'unresolved'),
        'restricted_ways': b['restricted_ways']} for b in groups]
    assert len(groups) == len(records) + len(excluded) + len(unresolved)
    audit['source_date_semantics'] = prose('Дата — дата локального извлечения исходных данных. Заголовок PBF не содержит дату снимка OSM.',
        'Data di estrazione locale; intestazione PBF priva della data dello snapshot OSM.',
        'Date is local extract acquisition date; PBF header contains no OSM snapshot timestamp.')
    audit['crossing_model_limitation'] = prose(
        f'У {len(audit.get("multi_portal_bridges", []))} мостов несколько ветвей/порталов; выбран один полный путь. Минимум повторов и нечётность относятся к этой модели, а не доказаны для всех альтернативных ветвей. Мост Ferrovia без полного перехода и непривязанные настилы остаются неразрешёнными.',
        f'{len(audit.get("multi_portal_bridges", []))} ponti hanno più rami/portali; scelto un percorso completo. Ripetizioni minime e parità valgono per questo modello, non per tutte le alternative. Ferrovia senza attraversamento completo e impalcati senza percorso restano irrisolti.',
        f'{len(audit.get("multi_portal_bridges", []))} bridges have multiple branches/portals; one complete path is selected. Minimum repeats and parity apply to this model, not proven across alternative branches. Ferrovia without a full crossing and unmatched decks remain unresolved.')
    audit['required_components_detail'] = [list(c) for c in nx.connected_components(required)]
    audit['required_bridges_detail'] = [{'id': b['id'], 'name': b['name'], 'banks': b['banks']} for b in records.values()]
    audit['bridge_relations'] = relations
    print(json.dumps({'groups': len(groups), 'required': len(records), 'excluded': len(excluded),
                      'unresolved_portals': len(unresolved), 'unresolved_decks': len(audit['unresolved_decks']),
                      'required_components': nx.number_connected_components(required),
                      'graph_nodes': graph.number_of_nodes(), 'start': start}, ensure_ascii=False))
    # Persist diagnostics before solving so a blocker is reproducible, never a invented route.
    (config.PROCESSED / 'bridge_route_audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf-8')
    if component[start] not in required:
        raise ValueError('Piazza San Marco is disconnected from unambiguous required bridge graph')
    circuit, odd, repeats = postman(required, component[start])
    distance_cache = {}
    def crossing_portals(bid, bank):
        path = records[bid]['path']
        return (path[0], path[-1]) if component[path[0]] == bank else (path[-1], path[0])
    def land_distance(a, b):
        if a not in distance_cache:
            distance_cache[a] = nx.single_source_dijkstra_path_length(land, a, weight='length')
        return distance_cache[a][b]
    circuit, order = distance_aware_euler_order(circuit, start, crossing_portals, land_distance)
    circuit, refinement = improve_closed_subtrails(circuit, start, crossing_portals, land_distance)
    order['fleury_transfer_m'] = order['selected_transfer_m']
    order['selected_transfer_m'] = refinement['selected_transfer_m']
    order['closed_subtrail_reversals'] = refinement['closed_subtrail_reversals']
    order['method'] += '; best-improvement closed-subtrail reversal'
    deck_distance = sum(records[bid]['length'] for _, _, bid in circuit)
    order.update({'baseline_distance_m': round(order['baseline_transfer_m'] + deck_distance, 3),
                  'selected_distance_m': round(order['selected_transfer_m'] + deck_distance, 3),
                  'bridge_deck_distance_m': round(deck_distance, 3)})
    audit['walking_order'] = order
    node_route = [start]
    crossing_rows, visits = [], Counter()
    for u, v, bid in circuit:
        b = records[bid]
        path = b['path'] if component[b['path'][0]] == u else list(reversed(b['path']))
        walk = nx.shortest_path(land, node_route[-1], path[0], weight='length')
        node_route.extend(walk[1:])
        begin = len(node_route) - 1
        node_route.extend(path[1:])
        visits[bid] += 1
        crossing_rows.append({'bridge_id': bid, 'name': b['name'], 'lon': b['lon'], 'lat': b['lat'],
                              'x': b['x'], 'z': b['z'], 'repeat': visits[bid] > 1,
                              'start_index': begin, 'end_index': len(node_route) - 1})
    node_route.extend(nx.shortest_path(land, node_route[-1], start, weight='length')[1:])
    coordinates = [list(nodes[n]) for n in node_route]
    local = [[round(x - ORIGIN[0], 4), round(-(y - ORIGIN[1]), 4)]
             for x, y in [PROJECT.transform(*ll) for ll in coordinates]]
    distance = sum(graph[u][v]['length'] for u, v in zip(node_route, node_route[1:]))
    assert set(visits) == set(records)
    assert node_route[0] == node_route[-1] == start
    assert all(graph.has_edge(u, v) for u, v in zip(node_route, node_route[1:]))
    assert sum(n - 1 for n in visits.values()) == repeats
    assert all(not restriction(tags.get(n, {})) for n in node_route)
    bridge_rows = [{'id': b['id'], 'name': b['name'], 'lon': b['lon'], 'lat': b['lat'],
                    'x': b['x'], 'z': b['z'], 'visits': visits[b['id']]}
                   for b in records.values()]
    for e in excluded:
        code = e['reason_code']
        if code == 'immediate_pedestrian_dead_end':
            e['reason'] = prose(
                'Сразу за мостом пешеходный тупик: берег имеет выход без мостов, но не связан с другим настоящим мостом. Проверка однократная; вышележащие мосты сохранены.',
                'Subito dopo il ponte un vicolo cieco pedonale: la riva ha accesso senza ponti, ma nessun altro ponte reale. Controllo unico; ponti a monte mantenuti.',
                'Immediately beyond this bridge is a pedestrian cul-de-sac: the bank has bridge-free outward access but no other real bridge. One-pass exclusion; upstream bridges retained.')
        else:
            e['reason'] = prose('Исключён по данным OSM: ' + code,
                                'Escluso secondo OSM: ' + code, 'Excluded according to OSM: ' + code)
    possible = not odd and not unresolved and not any(e['reason']['en'].endswith('disconnected_from_start') for e in excluded)
    explanation = prose(
        f'После сжатия пешеходной связности без мостов: {len(odd)} компонент нечётной степени. '
        f'Замкнутый обход каждого принятого моста ровно один раз {"возможен" if not odd else "невозможен"}. '
        f'Подбор пар даёт минимум {repeats} повторных переходов в принятой модели; общая длина не доказана оптимальной.',
        f'Dopo la contrazione dei percorsi senza ponti: {len(odd)} componenti di grado dispari. '
        f'Il circuito con ogni ponte accettato una sola volta è {"possibile" if not odd else "impossibile"}. '
        f'L’abbinamento richiede almeno {repeats} attraversamenti ripetuti nel modello; la lunghezza totale non è dimostrata ottima.',
        f'After contracting bridge-free walking connectivity: {len(odd)} odd-degree land components. '
        f'A closed once-per-accepted-bridge circuit is {"possible" if not odd else "impossible"}. '
        f'Matching gives a minimum of {repeats} repeated crossings in the accepted model; total walking length is not proven optimal.')
    audit.update({'scope_relation': 4817103, 'scope': prose('Настроенный полигон главного острова, включая западные транспортные/портовые зоны; без Джудекки и внешних островов. Это не шесть отдельных административных полигонов.',
                  'Poligono configurato dell’isola principale, incluse le aree occidentali di trasporto/porto; escluse Giudecca e isole esterne. Non sono sei poligoni amministrativi separati.',
                  'Configured main-island polygon includes western transport/port areas; excludes Giudecca and outer islands. Not six separate administrative district polygons.'),
                  'reachable_nodes': graph.number_of_nodes(), 'reachable_edges': graph.number_of_edges(),
                  'land_components': len(components), 'odd_components': [
                      {'id': c, 'degree': required.degree(c), 'representative_node_id': min(components[c]),
                       'lon': nodes[min(components[c])][0], 'lat': nodes[min(components[c])][1]}
                      for c in odd],
                  'required_graph_connected': nx.is_connected(required),
                  'partial_restrictions': [{'id': b['id'], 'ways': b['restricted_ways']}
                                           for b in groups if b['restricted_ways'] and b['allowed_way_ids']],
                  'optimization': prose('Точное паросочетание нечётных компонент; минимум числа повторных мостов в принятом графе. Пешеходные переходы внутри компонент — кратчайшие для выбранного порядка.',
                      'Abbinamento esatto delle componenti dispari; minimo numero di ponti ripetuti nel grafo accettato. Collegamenti pedonali interni minimi per l’ordine scelto.',
                      'Exact odd-component matching minimizes repeated bridges in the accepted graph. Land transfers are shortest for the chosen circuit order.'),
                  'limitations': prose('Это аудит OSM, не официальный полный реестр. Доступ без тегов предполагается публичным. Условный, ограниченный по времени и закрытый доступ исключён консервативно. Непривязанные настилы и неоднозначные кандидаты требуют проверки; актуальные закрытия не проверены на месте. Ступени не подходят для безбарьерного маршрута.',
                      'Audit OSM, non inventario ufficiale completo. Accesso non specificato assunto pubblico. Accessi condizionali, a orario e chiusi esclusi prudenzialmente. Impalcati senza percorso e candidati ambigui da verificare; chiusure attuali non controllate sul posto. I gradini non sono accessibili senza barriere.',
                      'OSM audit, not a complete official inventory. Untagged access is assumed public. Conditional, time-limited and closed access conservatively excluded. Unmatched decks and ambiguous candidates need review; current closures are not checked on site. Steps make this unsuitable as a step-free route.'),
                  'verified': {'continuous_osm_edges': True, 'coverage': True, 'closed': True, 'public_access_policy': True},
                  'pbf_sha256': hashlib.sha256(pbf.read_bytes()).hexdigest(),
                  'generated_at': datetime.now(timezone.utc).isoformat()})
    data = {'id': 'all-bridges', 'title': prose('Мосты без непосредственных тупиков: Сан-Марко — Сан-Марко',
                'Ponti senza vicoli ciechi immediati: San Marco — San Marco',
                'Bridges without immediate cul-de-sacs: San Marco — San Marco'),
            'summary': prose(f'{len(records)} принятых мостов OSM, {repeats} повторных переходов; {len(deadends)} исключено из-за непосредственного пешеходного тупика. Начало и конец — Piazza San Marco. Непроверенные кандидаты указаны в аудите.',
                f'{len(records)} ponti OSM accettati, {repeats} attraversamenti ripetuti; {len(deadends)} esclusi per vicolo cieco pedonale immediato. Partenza e arrivo a Piazza San Marco. Candidati non risolti nell’audit.',
                f'{len(records)} accepted OSM bridges, {repeats} repeated crossings; {len(deadends)} excluded for an immediate pedestrian cul-de-sac. Starts and ends at Piazza San Marco. Unresolved candidates are listed in the audit.'),
            'status': 'ready', 'start': {'name': 'Piazza San Marco', 'lon': nodes[start][0], 'lat': nodes[start][1]},
            'distance_m': round(distance, 3), 'bridge_count': len(records), 'repeat_crossings': repeats,
            'euler': {'possible': possible, 'odd_count': len(odd), 'explanation': explanation},
            'coordinates': coordinates, 'local': local, 'bridges': bridge_rows, 'crossings': crossing_rows,
            'excluded': excluded, 'audit': audit, 'gpx': 'data/bridge-route.gpx',
            'source': {'url': 'https://download.openstreetmap.fr/extracts/europe/italy/veneto.osm.pbf',
                       'license': 'OpenStreetMap contributors, ODbL 1.0', 'date': '2026-10-22'}}
    ns = 'http://www.topografix.com/GPX/1/1'
    ET.register_namespace('', ns)
    root = ET.Element('{'+ns+'}gpx', {'version': '1.1', 'creator': 'Venice by Building / OSM audited bridge route'})
    track = ET.SubElement(root, '{'+ns+'}trk')
    ET.SubElement(track, '{'+ns+'}name').text = 'Piazza San Marco — all accessible OSM bridges — Piazza San Marco'
    segment = ET.SubElement(track, '{'+ns+'}trkseg')
    for lon, lat in coordinates:
        ET.SubElement(segment, '{'+ns+'}trkpt', {'lat': str(lat), 'lon': str(lon)})
    ET.ElementTree(root).write(config.WEB_DATA / 'bridge-route.gpx', encoding='utf-8', xml_declaration=True)
    points = ET.parse(config.WEB_DATA / 'bridge-route.gpx').findall('.//{'+ns+'}trkpt')
    assert [[float(p.attrib['lon']), float(p.attrib['lat'])] for p in points] == coordinates
    audit['verified']['gpx_roundtrip'] = True
    (config.PROCESSED / 'bridge_route_proof.json').write_text(json.dumps({
        'route_node_ids': node_route, 'start_node_id': start,
        'original_bridges': [{'id': b['id'], 'way_ids': b['way_ids'], 'path': b['path'],
                              'banks': b['banks'], 'portals': b['portals']}
                             for b in original_records.values()],
        'dead_end_exclusions': deadends,
        'bridges': [{'id': b['id'], 'way_ids': b['way_ids'], 'path': b['path'], 'banks': b['banks']}
                    for b in records.values()]}), encoding='utf-8')
    (config.WEB_DATA / 'bridge-route.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(json.dumps({'distance_m': data['distance_m'], 'bridges': len(records), 'repeats': repeats,
                      'odd_count': len(odd), 'points': len(coordinates), 'gpx_verified': True}))
    return data


if __name__ == '__main__':
    main()
