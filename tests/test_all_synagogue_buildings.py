import json
from pathlib import Path
from shapely.geometry import shape, Point
from pipeline.venice.church_building_manifest import building_match
ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {'Q28035407':(4521,'w138843453'), 'Q65015':(4521,'w138843453'), 'Q12051106':(4521,'w138843453'), 'Q62259167':(4596,'w138842957'), 'Q2897799':(4756,'w345585193')}

def test_all_five_verified_identities_use_three_unique_exact_hosts():
    data=json.loads((ROOT/'web/data/church-buildings.json').read_text(encoding='utf8'))
    special=[b for b in data['buildings'] if b.get('highlight_color')]
    assert len(special)==3
    identities={i['qid']:(b['gid'],b['building_id']) for b in special for i in b['identities']}
    assert identities==EXPECTED
    assert len({b['gid'] for b in data['buildings']})==len(data['buildings'])
    assert data['matched_stops']==117 and len(data['unmatched'])==17
    assert not set(EXPECTED)&{s['qid'] for s in data['unmatched']}

def test_named_pois_and_independent_coordinates_are_strictly_inside_typed_hosts():
    fs=json.loads((ROOT/'data/processed/buildings_centro.geojson').read_text())['features']
    stops=json.loads((ROOT/'web/data/church-route.json').read_text(encoding='utf8'))['stops']
    identities=[]
    for bid in {v[1] for v in EXPECTED.values()}:
        f=next(f for f in fs if f['properties']['building_id']==bid)
        match=building_match(f['properties'],stops)
        assert match and match.get('identities')
        for i in match['identities']:
            assert shape(f['geometry']).contains(Point(*i['poi_coordinate']))
            assert shape(f['geometry']).contains(Point(*i['independent_coordinate']))
            assert i['poi_node'] and i['identity_sources'] and i['name']
            identities.append(i['qid'])
        assert building_match({**f['properties'],'osm_type':'relation'},stops) is None
    assert set(identities)==set(EXPECTED)

def test_reference_is_actual_ca_pesaro_documented_age_color_not_navy():
    data=json.loads((ROOT/'web/data/church-buildings.json').read_text(encoding='utf8'))
    for b in data['buildings']:
        if not b.get('highlight_color'): continue
        assert b['highlight_color']=='#2f3f6b'
        assert b['highlight_shading']=='atlas_age'
        assert b['color_reference']=={'qid':'Q756807','gid':5888,'year':1710,'flag':0,'period':'pre','mode':'Age','year_at_verification':2026,'estimated_mix':0}
