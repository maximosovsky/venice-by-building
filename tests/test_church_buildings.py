import gzip
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_real_church_buildings_match_exact_atlas_identifiers():
    path = ROOT / 'web/data/church-buildings.json'
    assert path.exists(), 'verified church building manifest is missing'
    data = json.loads(path.read_text(encoding='utf8'))
    route = json.loads((ROOT / 'web/data/church-route.json').read_text(encoding='utf8'))
    config = json.loads((ROOT / 'web/data/venezia.json').read_text())
    features = json.loads((ROOT / 'data/processed/buildings_centro.geojson').read_text(encoding='utf8'))['features']
    source = {f['properties']['building_id']: f for f in features}
    raw = (ROOT / 'web/data/attrs.bin').read_bytes()
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    qids = {s['qid'] for s in route['stops'] if s.get('qid')}
    assert data['inventory_stops'] == len(route['stops']) == 162
    assert len(data['buildings']) == len({b['gid'] for b in data['buildings']})
    for b in data['buildings']:
        f = source[b['building_id']]
        assert f['properties']['wikidata'] == b['qid']
        assert b['qid'] in qids
        assert b['match_source'] == 'exact_osm_wikidata_tag_and_atlas_osm_id'
        off = b['gid'] * config['attrStride']
        assert int(struct.unpack_from('<d', raw, off)[0]) == f['properties']['osm_id']
        assert f['geometry']['type'] in ['Polygon', 'MultiPolygon']
    matched = {b['qid'] for b in data['buildings']}
    assert {'Q172988', 'Q52531'} <= matched
    assert data['matched_stops'] == sum(s.get('qid') in matched for s in route['stops'])
    assert {s['id'] for s in data['unmatched']} == {s['id'] for s in route['stops'] if s.get('qid') not in matched}
    assert data['matched_stops'] + len(data['unmatched']) == 162
    assert data['geometry_source'] == 'existing_atlas_worker_mesh_including_all_parts_and_roofs'
