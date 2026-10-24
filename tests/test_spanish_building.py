import json
from pathlib import Path
from shapely.geometry import shape, Point
from pipeline.venice.church_building_manifest import building_match

ROOT = Path(__file__).resolve().parents[1]


def test_spanish_named_jewish_poi_and_independent_article_inside_exact_host():
    route = json.loads((ROOT / 'web/data/church-route.json').read_text(encoding='utf8'))
    features = json.loads((ROOT / 'data/processed/buildings_centro.geojson').read_text(encoding='utf8'))['features']
    host = next(f for f in features if f['properties']['building_id'] == 'w345585193')
    match = building_match(host['properties'], route['stops'])
    assert match is not None, 'Spanish reviewed exact host missing'
    assert match['qid'] == 'Q2897799'
    assert match['highlight_color'] == '#000080'
    assert match['highlight_scope'] == 'entire_shared_osm_host_building'
    assert '250421433' in match['match_evidence']
    assert 'adjacent premises' in match['match_evidence']
    assert 'Levantine POI' in match['match_evidence']
    assert 'https://api.openstreetmap.org/api/0.6/node/250421433' in match['identity_sources']
    assert 'https://it.wikipedia.org/wiki/Scola_Ponentina' in match['identity_sources']
    polygon = shape(host['geometry'])
    assert polygon.contains(Point(12.3255604, 45.4446333))  # named OSM Jewish worship POI
    assert polygon.contains(Point(12.325563, 45.444618))  # Italian article coordinate
    assert polygon.contains(Point(12.3256, 45.4448))  # English article coordinate
    assert not polygon.contains(Point(12.3258217, 45.4447594))  # separate Levantine POI
    assert building_match({**host['properties'], 'osm_type': 'relation'}, route['stops']) is None
    assert building_match({**host['properties'], 'osm_id': 345585194}, route['stops']) is None
    assert building_match(host['properties'], [s for s in route['stops'] if s['id'] != 'Q2897799']) is None


def test_spanish_manifest_unique_navy_host_and_complete_totals():
    data = json.loads((ROOT / 'web/data/church-buildings.json').read_text(encoding='utf8'))
    spanish = [b for b in data['buildings'] if b['qid'] == 'Q2897799']
    assert len(spanish) == 1
    assert (spanish[0]['gid'], spanish[0]['building_id'], spanish[0]['highlight_color']) == (4756, 'w345585193', '#000080')
    assert len(data['buildings']) == 116
    assert data['matched_stops'] == 114
    assert len(data['unmatched']) == 20
    assert not any(b['id'] == 'Q2897799' for b in data['unmatched'])
