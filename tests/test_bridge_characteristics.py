"""Municipal enrichment must not invent identity, measurements, or geometry."""
import gzip
import importlib
import json
import struct
from pathlib import Path

import pytest
from shapely.geometry import Polygon

MODULE = 'pipeline.venice.s15_bridge_characteristics'


def api():
    try:
        return importlib.import_module(MODULE)
    except ModuleNotFoundError:
        pytest.fail('Municipal bridge characteristics pipeline is not implemented')


def test_dictionary_decodes_documented_codes_preserves_unknown_literals():
    m = api()
    assert m.decode_enum('PONTE_MAT', '03') == {'code': '03', 'label': 'muratura'}
    assert m.decode_enum('PONTE_USO', '04')['label'] == 'pedonale'
    assert m.decode_enum('PONTE_USO', '03')['label'] == 'ferroviario'
    assert m.decode_enum('PONTE_TY', '01')['label'] == 'ponte'
    assert m.decode_enum('PONTE_MAT', '92')['label'] == 'Non assegnato'
    assert m.decode_enum('PONTE_MAT', '3') == {'code': '3', 'label': None}


def test_numeric_height_fields_are_raw_evidence_never_measurements():
    evidence = api().height_evidence({'PONTE_SEQE': 92.0, 'PONTE_SPQE': 0.0, 'PONTE_SOQE': 4.2})
    assert evidence['PONTE_SEQE'] == {'raw': 92.0, 'value_m': None, 'unit': None, 'status': 'unassigned_sentinel_candidate'}
    assert evidence['PONTE_SPQE']['raw'] == 0.0
    assert evidence['PONTE_SPQE']['value_m'] is None
    assert evidence['PONTE_SOQE']['raw'] == 4.2
    assert evidence['PONTE_SOQE']['unit'] is None


def test_local_geometry_preserves_actual_vertices_holes_not_a_rectangle():
    geom = Polygon([(100, 200, 4), (110, 200, 5), (110, 210, 6), (105, 208, 7), (100, 210, 8)],
                   [[(102, 202, 4), (104, 202, 4), (104, 204, 4), (102, 204, 4)]])
    local = api().local_polygons(geom, [90, 190])
    assert len(local) == 1 and len(local[0]) == 2
    assert local[0][0][3] == [15.0, -18.0]
    assert local[0][1][0] == [12.0, -12.0]
    assert local[0][0][0] == local[0][0][-1]
    assert all(len(p) == 2 for ring in local[0] for p in ring)
    length, width = api().footprint_dimensions(geom)
    assert length == 10 and width == 10


def test_degenerate_geometry_has_no_dimensions():
    from shapely.geometry import LineString
    assert api().footprint_dimensions(LineString([(0, 0), (5, 0)])) == (None, None)


def test_gid_join_uses_only_existing_bridge_osm_rows_rejects_ambiguity():
    config = {'attrStride': 16, 'attrFields': {'osm': [0, '<f8'], 'src': [8, '|u1']}}
    raw = b''.join(struct.pack('<dB7x', osm, src) for osm, src in [(12, 0), (12, 1), (-12, 1), (99, 1)])
    inventory = [{'id': 'd12', 'deck_ids': ['d12'], 'way_ids': [88]},
                 {'id': 'w99', 'deck_ids': [], 'way_ids': [99]}]
    result = api().join_gids(gzip.compress(raw), config, inventory, {'d12': {}, 'w99': {}})
    assert result == {'1': {'bridge_id': 'd12', 'osm_type': 'way', 'osm_id': 12},
                      '3': {'bridge_id': 'w99', 'osm_type': 'way', 'osm_id': 99}}
    inventory.append({'id': 'other', 'deck_ids': ['d12'], 'way_ids': []})
    assert '1' not in api().join_gids(raw, config, inventory, {'d12': {}, 'other': {}, 'w99': {}})
    with pytest.raises(ValueError, match='stride'):
        api().join_gids(raw + b'x', config, inventory, {})


def test_conflicting_source_classifications_remain_nullable_not_first_wins():
    result = api().aggregate_enum('PONTE_MAT', [{'PONTE_MAT': '03'}, {'PONTE_MAT': '02'}])
    assert result['code'] is None and result['label'] is None
    assert result['values'] == [{'code': '02', 'label': 'legno'}, {'code': '03', 'label': 'muratura'}]


def test_export_accepts_only_strong_route_matches_and_preserves_all_source_parts():
    m = api()
    geom = Polygon([(100, 200), (110, 200), (110, 210), (100, 210)])
    attrs = {'PONTE_MAT': '03', 'PONTE_USO': '04', 'PONTE_TY': '01', 'PONTE_SEQE': 92.0}
    census = [{'municipal_id': 'PONTE2010:fID000000', 'source_fid_zero_based': 0,
               'municipal_attributes': attrs, 'strong_osm_identities': ['d12'],
               'deck_evidence': [{'strong': True, 'identity': 'd12', 'overlap_m2': 20, 'municipal_fraction': 0.8, 'deck_fraction': 0.8}], 'highway_evidence': []}]
    ledger = [{'osm_identity': 'd12', 'route_included': True, 'municipal_ids': ['PONTE2010:fID000000']},
              {'osm_identity': 'd13', 'route_included': False, 'municipal_ids': ['PONTE2010:fID000000']}]
    route = {'bridges': [{'id': 'd12'}, {'id': 'd14'}], 'audit': {'inventory': []}}
    out = m.build_characteristics(census, ledger, {0: (attrs, geom)}, route, [90, 190], {})
    assert out['schema_version'] == 1
    assert set(out['by_bridge_id']) == {'d12'}
    row = out['by_bridge_id']['d12']
    assert row['material'] == {'code': '03', 'label': 'muratura'}
    assert row['municipal_ids'] == ['PONTE2010:fID000000']
    assert row['geometry_local'][0][0][0] == [10.0, -10.0]
    assert row['length_m'] == row['width_m'] == 10
    assert row['evidence_heightfields'][0]['fields']['PONTE_SEQE']['value_m'] is None
    assert out['unmatched_bridge_ids'] == ['d14']
    assert out['publication']['actual_geometry'] == 'blocked_pending_municipal_license'
    bad = [dict(census[0], strong_osm_identities=[])]
    with pytest.raises(ValueError, match='strong'):
        m.build_characteristics(bad, ledger, {0: (attrs, geom)}, route, [90, 190], {})


ROOT = Path(__file__).resolve().parents[1]


def test_real_bridge_export_matches_actual_data_enrichment_consumer():
    import subprocess
    script = """
    import fs from 'node:fs';
    import assert from 'node:assert/strict';
    import {recordsForGid,declaredCount} from './web/data-enrichment.js';
    const d=JSON.parse(fs.readFileSync('web/data/bridge-characteristics.json','utf8'));
    assert.equal(declaredCount(d),328);
    for(const [gid,link] of Object.entries(d.gid_identity)) {
      assert.deepEqual(recordsForGid(d,gid),[d.by_bridge_id[link.bridge_id]]);
      assert.equal(d.by_gid[gid],link.bridge_id);
    }
    assert.ok(Object.keys(d.gid_identity).length>0);
    """
    result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT,
                            capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr


def test_all_real_bridge_polygons_attributes_evidence_and_unknown_heights():
    import geopandas as gpd
    from collections import Counter
    from shapely.ops import unary_union
    d = json.loads((ROOT / 'web/data/bridge-characteristics.json').read_text(encoding='utf8'))
    source = d['source']
    archive = ROOT / 'data/raw/Venice_Geodata_20261022_2004/2010_Venezia_aree_retry.zip'
    frame = gpd.read_file(f'zip://{archive.as_posix()}!{source["layer"]}')
    assert len(frame) == source['source_records'] == 1259
    assert frame.crs.to_epsg() == 6706
    metric = frame.to_crs(32633)
    census = json.loads((ROOT / source['audit_path'] / 'municipal-census.json').read_text(encoding='utf8'))
    rows = {r['municipal_id']: r for r in census}
    ledger = json.loads((ROOT / source['audit_path'] / 'osm-route-reconciliation.json').read_text(encoding='utf8'))
    route = json.loads((ROOT / 'web/data/bridge-route.json').read_text(encoding='utf8'))
    expected_ids = {r['osm_identity'] for r in ledger if r['route_included'] and r['municipal_ids']}
    assert set(d['by_bridge_id']) == expected_ids
    assert len(expected_ids) == 328
    assert set(d['unmatched_bridge_ids']) == {r['id'] for r in route['bridges']} - expected_ids
    origin = d['geometry_frame']['origin']
    parts_total = sentinels = 0
    municipal_ids = set()
    for bid, entry in d['by_bridge_id'].items():
        expected_parts, part_ids, parts = [], [], []
        for mid, raw, evidence, heights in zip(entry['municipal_ids'], entry['raw_attributes'],
                                             entry['match_evidence'], entry['evidence_heightfields'], strict=True):
            row = rows[mid]
            fid = row['source_fid_zero_based']
            assert mid == f'PONTE2010:fID{fid:06d}'
            assert bid in row['strong_osm_identities']
            clean = lambda v: None if v is None or (isinstance(v, float) and __import__('math').isnan(v)) else v.item() if hasattr(v, 'item') else v
            attrs = {k: clean(v) for k, v in frame.iloc[fid].drop('geometry').items()}
            assert raw == {'municipal_id': mid, 'fields': attrs}
            assert attrs == row['municipal_attributes']
            strong = [e for kind in ('deck_evidence', 'highway_evidence') for e in row[kind]
                      if e.get('strong') and e.get('identity') == bid]
            assert strong and evidence == {'municipal_id': mid, 'match': 'audited_strong_overlap', 'overlaps': strong}
            geom = metric.geometry.iloc[fid]
            from shapely.geometry import mapping
            expected_raw = json.loads(json.dumps(mapping(frame.geometry.iloc[fid])))
            assert entry['geometry_source'][entry['municipal_ids'].index(mid)] == {
                'municipal_id': mid, 'crs': 'EPSG:6706', 'geometry': expected_raw}
            parts.append(geom)
            polygons = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
            for p in polygons:
                expected_parts.append([[[round(float(c[0])-origin[0],4), round(-(float(c[1])-origin[1]),4)]
                                        for c in ring.coords] for ring in [p.exterior,*p.interiors]])
                part_ids.append(mid)
            for field, value in heights['fields'].items():
                assert value['raw'] == attrs[field]
                assert value['value_m'] is value['unit'] is None
                if value['raw'] in (92, '92'):
                    assert value['status'] == 'unassigned_sentinel_candidate'
                    sentinels += 1
            municipal_ids.add(mid)
        assert entry['geometry_local'] == expected_parts
        assert entry['geometry_part_municipal_ids'] == part_ids
        assert (entry['length_m'],entry['width_m']) == api().footprint_dimensions(unary_union(parts))
        for field, target in [('PONTE_MAT','material'),('PONTE_USO','purpose'),('PONTE_TY','type')]:
            assert entry[target] == api().aggregate_enum(field,[r['fields'] for r in entry['raw_attributes']])
        assert all(z['value_m'] is z['unit'] is z['vertical_datum'] is None for z in entry['evidence_polygon_z'])
        parts_total += len(expected_parts)
    assert sentinels > 0
    assert d['counts']['actual_polygon_parts'] == parts_total
    assert d['counts']['matched_municipal_records'] == len(municipal_ids)
    assert d['counts']['verified_height_measurements'] == 0
    assert source['license'] is d['publication']['license'] is None
    assert d['publication']['actual_geometry'] == 'blocked_pending_municipal_license'
    cfg = json.loads((ROOT / 'web/data/venezia.json').read_text())
    links = api().join_gids((ROOT / 'web/data/attrs.bin').read_bytes(),cfg,route['audit']['inventory'],d['by_bridge_id'])
    assert d['gid_identity'] == links
    assert d['by_gid'] == {gid: link['bridge_id'] for gid,link in links.items()}
    import math
    clean = lambda v: None if v is None or (isinstance(v,float) and math.isnan(v)) else v.item() if hasattr(v,'item') else v
    attributes = [{k:clean(v) for k,v in row.items()} for row in frame.drop(columns='geometry').to_dict('records')]
    rebuilt = api().build_characteristics(census,ledger,
        {fid:(attrs,geom) for fid,(attrs,geom) in enumerate(zip(attributes,metric.geometry))},
        route,origin,source,source_geometries=dict(enumerate(frame.geometry)))
    assert json.loads(json.dumps(rebuilt['by_bridge_id'])) == d['by_bridge_id']
