"""Exact OSM Wikidata -> current atlas GID manifest. Never infer neighbors/geometry."""
import gzip
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


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
        if p.get('wikidata') not in qids:
            continue
        buildings.append({'gid': gid, 'building_id': p['building_id'], 'osm_type': p['osm_type'],
                          'osm_id': osm, 'qid': p['wikidata'],
                          'match_source': 'exact_osm_wikidata_tag_and_atlas_osm_id'})
    matched = {b['qid'] for b in buildings}
    unmatched = [{'id': s['id'], 'qid': s.get('qid'), 'name': s['name'],
                  'reason': 'no_unique_exact_osm_wikidata_tag_in_current_atlas'}
                 for s in route['stops'] if s.get('qid') not in matched]
    data = {'version': 1, 'inventory_stops': len(route['stops']),
            'matched_stops': len(route['stops']) - len(unmatched), 'buildings': buildings,
            'unmatched': unmatched, 'atlas_attrs_sha256': digest,
            'geometry_source': 'existing_atlas_worker_mesh_including_all_parts_and_roofs',
            'source': 'data/processed/buildings_centro.geojson',
            'limitations': 'Only unique exact OSM Wikidata tags are used. Unmatched stops receive no invented geometry. Existing atlas heights and multipart/roof detail are retained unchanged.'}
    out = ROOT / 'web/data/church-buildings.json'
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'output': str(out), 'buildings': len(buildings), 'matched_stops': data['matched_stops'], 'unmatched_stops': len(unmatched)}))


if __name__ == '__main__':
    main()
