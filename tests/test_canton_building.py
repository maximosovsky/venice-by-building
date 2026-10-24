import json
from pathlib import Path
from pipeline.venice.church_building_manifest import building_match
from shapely.geometry import shape, Point

ROOT = Path(__file__).resolve().parents[1]


def test_canton_reviewed_named_host_is_reproducible_and_exact():
    route = json.loads((ROOT / 'web/data/church-route.json').read_text(encoding='utf8'))
    features = json.loads((ROOT / 'data/processed/buildings_centro.geojson').read_text(encoding='utf8'))['features']
    host = next(f for f in features if f['properties']['building_id'] == 'w138843453')
    match = building_match(host['properties'], route['stops'])
    assert match is not None, 'Canton exact reviewed host missing from generator'
    assert match['qid'] == 'Q28035407'
    assert match['highlight_color'] == '#000080'
    assert match['highlight_scope'] == 'entire_shared_osm_host_building'
    assert 'Canton' in match['match_evidence']
    assert shape(host['geometry']).contains(Point(12.326835, 45.445029))
    assert shape(host['geometry']).contains(Point(12.3267, 45.445))
    assert building_match({**host['properties'], 'osm_type': 'relation'}, route['stops']) is None
    assert building_match({**host['properties'], 'osm_id': 138843454}, route['stops']) is None
    assert building_match(host['properties'], [s for s in route['stops'] if s['id'] != 'Q28035407']) is None


def test_manifest_canton_unique_navy_and_no_remaining_unmatched_entry():
    data = json.loads((ROOT / 'web/data/church-buildings.json').read_text(encoding='utf8'))
    blue = [b for b in data['buildings'] if b.get('highlight_color') == '#000080']
    assert len(blue) == 2, 'only Canton and Spanish hosts should be dark navy'
    canton = next(b for b in blue if b['qid'] == 'Q28035407')
    assert (canton['gid'], canton['building_id']) == (4521, 'w138843453')
    assert not any(b['id'] == 'Q28035407' for b in data['unmatched'])
    assert data['matched_stops'] == 114
    assert len(data['unmatched']) == 20
