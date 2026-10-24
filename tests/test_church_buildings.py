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
    assert data['inventory_stops'] == len(route['stops']) == 134
    assert len(data['buildings']) == len({b['gid'] for b in data['buildings']})
    for b in data['buildings']:
        f = source[b['building_id']]
        stop = next(s for s in route['stops'] if s['id'] == b['stop_id'])
        if b['match_source'] == 'exact_osm_wikidata_tag_and_atlas_osm_id':
            assert f['properties']['wikidata'] == b['qid']
            assert b['qid'] in [stop.get('qid'), *stop.get('monastery_qids', [])]
        elif b['match_source'] == 'reviewed_named_poi_contained_in_exact_osm_host':
            from pipeline.venice.church_building_manifest import building_match
            assert building_match(f['properties'], route['stops'])['qid'] == b['qid']
            assert b['match_evidence'] and b['identity_sources']
        else:
            assert b['match_source'] == 'reviewed_exact_osm_building_identity'
            assert b['match_evidence']
            assert any((o['osm_type'],o['osm_id']) == (b['osm_type'],b['osm_id']) for o in stop['osm_buildings'])
        off = b['gid'] * config['attrStride']
        assert int(struct.unpack_from('<d', raw, off)[0]) == f['properties']['osm_id']
        assert f['geometry']['type'] in ['Polygon', 'MultiPolygon']
    matched = {i['stop_id'] for b in data['buildings'] for i in b.get('identities', [b])}
    assert {'Q172988', 'Q52531'} <= matched
    assert data['matched_stops'] == sum(s['id'] in matched for s in route['stops'])
    assert {s['id'] for s in data['unmatched']} == {s['id'] for s in route['stops'] if s['id'] not in matched}
    assert data['matched_stops'] == 117
    assert len(data['unmatched']) == 17
    assert data['matched_stops'] + len(data['unmatched']) == 134
    assert data['geometry_source'] == 'existing_atlas_worker_mesh_including_all_parts_and_roofs'
