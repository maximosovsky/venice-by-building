"""Exact OSM Wikidata -> current atlas GID manifest. Never infer neighbors/geometry."""
import gzip
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


# Reviewed named POI, not nearest-building inference. OSM maps several physical
# premises into this single host footprint; tint the existing whole host, not a
# fabricated synagogue-only subvolume. Key includes type to reject ID collisions.
REVIEWED_HIGHLIGHT_HOSTS = {
    ('way', 138843453): {
        'stop_id': 'Q28035407', 'qid': 'Q28035407',
        'match_source': 'reviewed_named_poi_contained_in_exact_osm_host',
        'highlight_color': '#2f3f6b',
        'highlight_scope': 'entire_shared_osm_host_building',
        'match_evidence': 'Scuola Canton named Jewish place_of_worship OSM node 13966049130 '
            '(12.3268030, 45.4449784) lies strictly inside way 138843453; both the '
            'route Wikipedia coordinate (12.326835, 45.445029) and independently '
            'published Canton coordinate (12.3267, 45.445) are inside the same '
            '41-node footprint. Canton occupies upper rooms, not the whole host. '
            'The atlas merges adjacent premises, including the Italian synagogue, '
            'into this GID; the entire shared host is highlighted.',
        'identity_sources': [
            'https://api.openstreetmap.org/api/0.6/node/13966049130',
            'https://api.openstreetmap.org/api/0.6/way/138843453/full',
            'https://en.wikipedia.org/wiki/Canton_Synagogue',
            'https://wikimili.com/en/Canton_Synagogue',
            'https://www.jewishvenice.org/history-culture/',
        ],
    },
    ('way', 345585193): {
        'stop_id': 'Q2897799', 'qid': 'Q2897799',
        'match_source': 'reviewed_named_poi_contained_in_exact_osm_host',
        'highlight_color': '#2f3f6b',
        'highlight_scope': 'entire_shared_osm_host_building',
        'match_evidence': 'Scuola Ponentina (Scuola Spagnola) named Jewish place_of_worship '
            'OSM node 250421433, explicitly tagged Q2897799, (12.3255604, 45.4446333) '
            'lies strictly inside way 345585193. Independently published Italian '
            'article coordinate (12.325563, 45.444618) and English article coordinate '
            '(12.3256, 45.4448) also lie inside the exact 67-node footprint, verified '
            'against the OSM way/full response. The atlas host includes adjacent premises; '
            'the entire existing host, not a synagogue-only subvolume, is highlighted. '
            'The separately named Levantine POI node 250421434 (12.3258217, 45.4447594) '
            'is outside this footprint; this host is not identified as Levantine.',
        'identity_sources': [
            'https://api.openstreetmap.org/api/0.6/node/250421433',
            'https://api.openstreetmap.org/api/0.6/way/345585193/full',
            'https://it.wikipedia.org/wiki/Scola_Ponentina',
            'https://en.wikipedia.org/wiki/Spanish_Synagogue_(Venice)',
            'https://api.openstreetmap.org/api/0.6/node/250421434',
        ],
    },
}


# All five identities are reviewed independently; three share one atlas host.
# Article coordinates for German and Levantine fall outside their real hosts;
# never use those stale route coordinates to select geometry.
SYNAGOGUE_IDENTITIES = {
    138843453: [
        ('Q28035407', 'Scuola Canton', 13966049130, [12.3268030, 45.4449784], [12.3267, 45.445], 'https://wikimili.com/en/Canton_Synagogue'),
        ('Q65015', 'Scuola Italiana', 6045579408, [12.3266278, 45.4451422], [12.326621, 45.445149], 'https://it.wikipedia.org/wiki/Scola_Italiana'),
        ('Q12051106', 'Scuola Grande Tedesca', 4819941851, [12.3271218, 45.4450594], [12.3270, 45.4450], 'https://koshertraveling.co/en/venice/attraction/german-synagogue'),
    ],
    345585193: [('Q2897799', 'Scuola Ponentina (Spagnola)', 250421433, [12.3255604, 45.4446333], [12.325563, 45.444618], 'https://it.wikipedia.org/wiki/Scola_Ponentina')],
    138842957: [('Q62259167', 'Scuola Levantina', 250421434, [12.3258217, 45.4447594], [12.32579, 45.44474], 'https://aroundus.com/p/8221059-scola-levantina')],
}
REVIEWED_HIGHLIGHT_HOSTS[('way', 138842957)] = {
    'stop_id': 'Q62259167', 'qid': 'Q62259167',
    'match_source': 'reviewed_named_poi_contained_in_exact_osm_host',
    'highlight_scope': 'entire_shared_osm_host_building',
    'match_evidence': 'Named Jewish Scuola Levantina OSM node 250421434 tagged Q62259167 and independently published AroundUs coordinate (12.32579, 45.44474) are strictly inside exact 42-node host way 138842957. The stale route article coordinate lies outside; Spanish node 250421433 belongs to different way 345585193. Shared adjacent premises are included in the whole existing atlas host.',
    'identity_sources': ['https://api.openstreetmap.org/api/0.6/node/250421434', 'https://api.openstreetmap.org/api/0.6/way/138842957/full', 'https://aroundus.com/p/8221059-scola-levantina'],
}
for (_, osm_id), host in REVIEWED_HIGHLIGHT_HOSTS.items():
    host['identities'] = [dict(stop_id=qid, qid=qid, name=name, poi_node=node,
        poi_coordinate=poi, independent_coordinate=coordinate,
        identity_sources=[f'https://api.openstreetmap.org/api/0.6/node/{node}',
            f'https://api.openstreetmap.org/api/0.6/way/{osm_id}/full', source])
        for qid, name, node, poi, coordinate, source in SYNAGOGUE_IDENTITIES[osm_id]]
    host['highlight_color'] = '#2f3f6b'
    host['highlight_shading'] = 'atlas_age'
    host['color_reference'] = dict(qid='Q756807', gid=5888, year=1710, flag=0,
        period='pre', mode='Age', year_at_verification=2026, estimated_mix=0)
    if osm_id == 138843453:
        host['match_evidence'] += ' Separately named Italian node 6045579408 (Q65015) and German node 4819941851 (Q12051106) are strictly inside this same exact host. Italian article coordinate and independent German reference (12.3270, 45.4450) are also inside; German route coordinate is outside and was not used.'


def building_match(properties, stops):
    reviewed = REVIEWED_HIGHLIGHT_HOSTS.get((properties['osm_type'], properties['osm_id']))
    if reviewed:
        identities = [i for i in reviewed['identities'] if any(s['id'] == i['stop_id'] for s in stops)]
        if identities:
            return {**reviewed, 'stop_id': identities[0]['stop_id'], 'qid': identities[0]['qid'], 'identities': identities}
    for stop in stops:
        for obj in stop.get('osm_buildings', []):
            if (properties['osm_type'], properties['osm_id']) == (obj['osm_type'], obj['osm_id']):
                return {'stop_id':stop['id'], 'qid':stop.get('qid'), 'match_source':'reviewed_exact_osm_building_identity', 'match_evidence':obj['evidence']}
        if properties.get('wikidata') and properties['wikidata'] in [stop.get('qid'), *stop.get('monastery_qids', [])]:
            return {'stop_id':stop['id'], 'qid':properties['wikidata'], 'match_source':'exact_osm_wikidata_tag_and_atlas_osm_id'}
    return None


def main():
    route = json.loads((ROOT / 'web/data/church-route.json').read_text(encoding='utf8'))
    config = json.loads((ROOT / 'web/data/venezia.json').read_text(encoding='utf8'))
    source_path = ROOT / 'data/processed/buildings_centro.geojson'
    features = json.loads(source_path.read_text(encoding='utf8'))['features']
    raw = (ROOT / 'web/data/attrs.bin').read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    qids = {s.get('qid') for s in route['stops']} - {None}
    # Require unique object identity; numeric way/relation collisions are not guessed.
    objects = {}
    for f in features:
        p = f['properties']
        objects.setdefault(p['osm_id'], []).append(p)
    buildings = []
    for gid, off in enumerate(range(0, len(raw), config['attrStride'])):
        if raw[off + config['attrFields']['src'][0]] == 1:
            continue  # bridge decks are never church buildings
        osm = int(struct.unpack_from('<d', raw, off + config['attrFields']['osm'][0])[0])
        candidates = objects.get(osm, [])
        bids = {p['building_id'] for p in candidates}
        if len(bids) != 1:
            continue
        p = candidates[0]
        match = building_match(p, route['stops'])
        if not match:
            continue
        buildings.append({'gid': gid, 'building_id': p['building_id'], 'osm_type': p['osm_type'],
                          'osm_id': osm, **match})
    matched = {i['stop_id'] for b in buildings for i in b.get('identities', [b])}
    unmatched = [{'id': s['id'], 'qid': s.get('qid'), 'name': s['name'],
                  'reason': 'no_unique_exact_osm_wikidata_tag_in_current_atlas'}
                 for s in route['stops'] if s['id'] not in matched]
    data = {'version': 1, 'inventory_stops': len(route['stops']),
            'matched_stops': len(route['stops']) - len(unmatched), 'buildings': buildings,
            'unmatched': unmatched, 'atlas_attrs_sha256': digest,
            'geometry_source': 'existing_atlas_worker_mesh_including_all_parts_and_roofs',
            'source': 'data/processed/buildings_centro.geojson',
            'limitations': 'Only unique exact OSM Wikidata tags, reviewed exact named OSM building identities or reviewed named POIs strictly contained in a verified host footprint are used. Special colors apply to the whole existing atlas host; shared premises are disclosed in highlight_scope and match_evidence. Grouped monasteries retain separate building GIDs. Unmatched stops receive no invented geometry. Existing atlas heights and multipart/roof detail are retained unchanged.'}
    out = ROOT / 'web/data/church-buildings.json'
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'output': str(out), 'buildings': len(buildings), 'matched_stops': data['matched_stops'], 'unmatched_stops': len(unmatched)}))


if __name__ == '__main__':
    main()
