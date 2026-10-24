"""Civici census, conservative joins and the actual static UI contract."""
import gzip
import json
import struct
from collections import Counter
from pathlib import Path

import pytest
from shapely.geometry import Polygon, mapping

ROOT = Path(__file__).resolve().parents[1]


def api():
    from pipeline.venice import s13_addresses
    return s13_addresses


def point(x, y, label='CN 6', number=6, letter=None, fid=None):
    f = {'type': 'Feature', 'properties': {'CIVICI': label, 'sestiere': 'CN',
         'number': number, 'letter': letter},
         'geometry': {'type': 'Point', 'coordinates': [x, y]}}
    if fid is not None:
        f['id'] = fid
    return f


def collection(features):
    return {'type': 'FeatureCollection', 'crs': {'type': 'name', 'properties':
            {'name': 'urn:ogc:def:crs:EPSG::32633'}}, 'features': features}


def building(osm_id, kind='way', geometry=None):
    from pyproj import Transformer
    from shapely import transform
    project = Transformer.from_crs('EPSG:32633', 'EPSG:4326', always_xy=True).transform
    geometry = transform(geometry or Polygon([(0, 0), (10, 0), (10, 10), (0, 10)]), project, interleaved=False)
    return {'type': 'Feature', 'properties': {'building_id': ('w' if kind == 'way' else 'r') + str(osm_id),
            'osm_type': kind, 'osm_id': osm_id}, 'geometry': mapping(geometry)}


def attrs(entries):
    return b''.join(struct.pack('<dB7x', osm, src) for osm, src in entries)


CFG = {'attrStride': 16, 'attrFields': {'osm': [0, '<f8'], 'src': [8, '|u1']},
       'origin': [0, 0], 'crs': 'EPSG:32633'}


def test_gid_comes_from_signed_writer_identity_not_source_order():
    out, audit = api().rendered_buildings([building(7), building(7, 'relation'), building(9)],
        attrs([(-7, 0), (9, 1), (7, 0), (999, 0)]), CFG, {0, 1, 2, 3})
    assert {b['building_id']: b['gid'] for b in out} == {'w7': 2, 'r7': 0}
    assert audit['bridge_rows_excluded'] == 1
    assert audit['unresolved_writer_gids'] == [3]


def test_only_present_mesh_gids_with_unique_writer_identity_join():
    out, audit = api().rendered_buildings([building(7), building(8)],
        attrs([(7, 0), (7, 0), (8, 0)]), CFG, {0, 1})
    assert out == []
    assert audit['duplicate_writer_identities'] == {'w7': [0, 1]}


def test_containment_keeps_overlap_holes_boundary_and_unmatched():
    m = api()
    hole = Polygon([(20, 0), (30, 0), (30, 10), (20, 10)],
                   holes=[[(23, 3), (27, 3), (27, 7), (23, 7)]])
    bs, _ = m.rendered_buildings([building(1), building(2, geometry=Polygon([(5, 0), (15, 0), (15, 10), (5, 10)])),
                                building(3, geometry=hole)], attrs([(1, 0), (2, 0), (3, 0)]), CFG, {0, 1, 2})
    fs = [point(2, 2), point(7, 2), point(0, 2), point(25, 5), point(100, 100), point(.05, 2)]
    d = m.enrich(collection(fs), bs, CFG, {'license': None}, expected_count=6)
    assert [r['match'] for r in d['records']] == ['contained', 'ambiguous', 'boundary', 'unmatched', 'unmatched', 'boundary']
    assert [r['gid'] for r in d['records']] == [0, None, None, None, None, None]
    assert d['by_gid'] == {'0': [d['records'][0]['id']]}
    assert d['records'][1]['candidate_gids'] == [0, 1]
    assert sum(d['audit']['match_counts'].values()) == 6


def test_preserve_source_fields_ids_coordinates_and_all_duplicate_rows():
    m = api()
    f = point(291000.123456789, 5035000.987654321, 'CN 006 A', '006', 'A', 'literal/001')
    fs = [f, point(291001, 5035001, 'SP 2347'), point(291002, 5035002, 'SP 2347'), f]
    d = m.enrich(collection(fs), [], {**CFG, 'origin': [290000, 5034000]}, {}, expected_count=4)
    assert d['schema'] == 1
    assert len(d['records']) == len({r['id'] for r in d['records']}) == 4
    r = d['records'][0]
    assert (r['label'], r['sestiere'], r['number'], r['letter'], r['source_id']) == ('CN 006 A', 'CN', '006', 'A', 'literal/001')
    assert (r['easting'], r['northing']) == tuple(f['geometry']['coordinates'])
    assert r['x'] == pytest.approx(1000.123456789)
    assert r['z'] == pytest.approx(-1000.987654321)
    assert d['audit']['exact_duplicate_extra_rows'] == 1
    assert d['audit']['rows_removed'] == 0
    assert d['audit']['duplicate_labels'] == {'CN 006 A': 2, 'SP 2347': 2}
    reversed_d = m.enrich(collection(list(reversed(fs))), [], CFG, {}, expected_count=4)
    assert {r['id'] for r in reversed_d['records']} == {r['id'] for r in d['records']}


@pytest.mark.parametrize('mutation', ['count', 'crs', 'geometry', 'nonfinite', 'missing'])
def test_fail_closed_on_bad_census_inputs(mutation):
    d = collection([point(1, 2)])
    expected = 1
    if mutation == 'count':
        expected = 31623
    elif mutation == 'crs':
        d['crs']['properties']['name'] = 'EPSG:4326'
    elif mutation == 'geometry':
        d['features'][0]['geometry']['type'] = 'LineString'
    elif mutation == 'nonfinite':
        d['features'][0]['geometry']['coordinates'][0] = float('nan')
    else:
        del d['features'][0]['properties']['number']
    with pytest.raises(ValueError):
        api().enrich(d, [], CFG, {}, expected_count=expected)


def test_pack_inventory_excludes_zero_part_objects(tmp_path):
    # Header, GIDs, year, three byte arrays, heritage, layers, partStart.
    tile = struct.pack('<7I2f', 0x3A5A3356, 2, 1, 0, 0, 0, 0, 0, 0)
    tile += struct.pack('<2I', 7, 12) + bytes(4) + bytes(4) * 4 + bytes(16)
    tile += struct.pack('<3I', 0, 1, 1)
    (tmp_path / 'pack0.bin').write_bytes(gzip.compress(tile))
    cfg = {'tiles': [{'pack': 'pack0.bin', 'offset': 0, 'length': len(tile), 'n': 2}]}
    gids, hashes = api().mesh_inventory(tmp_path, cfg)
    assert gids == {7}
    assert hashes['pack0.bin']


def test_real_export_contains_every_source_row_and_reciprocal_index():
    path = ROOT / 'web/data/addresses.json'
    assert path.exists(), 'actual Civici2024 export is missing'
    d = json.loads(path.read_text(encoding='utf8'))
    src = json.loads((ROOT / d['source']['path']).read_text(encoding='utf8'))['features']
    assert len(src) == len(d['records']) == len({r['id'] for r in d['records']}) == 31623
    assert d['schema'] == 1
    cfg = json.loads((ROOT / 'web/data/venezia.json').read_text())
    raw = (ROOT / 'web/data/attrs.bin').read_bytes()
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    indexed = {}
    for r, f in zip(d['records'], src):
        p = f['properties']
        assert (r['label'], r['sestiere'], r['number'], r['letter']) == (p['CIVICI'], p['sestiere'], p['number'], p['letter'])
        assert [r['easting'], r['northing']] == f['geometry']['coordinates']
        assert r['source_id'] is None  # actual source has no feature IDs
        assert r['x'] == r['easting'] - cfg['origin'][0]
        assert r['z'] == -(r['northing'] - cfg['origin'][1])
        assert 12 < r['lon'] < 13 and 45 < r['lat'] < 46
        if r['gid'] is not None:
            assert r['match'] == 'contained'
            assert raw[r['gid'] * cfg['attrStride'] + cfg['attrFields']['src'][0]] == 0
            indexed.setdefault(str(r['gid']), []).append(r['id'])
    assert indexed == d['by_gid']
    assert d['audit']['match_counts'] == dict(Counter(r['match'] for r in d['records']))
    assert d['audit']['sestiere_counts'] == {'CN': 7765, 'CS': 7341, 'SM': 5533, 'DD': 4366, 'SP': 3704, 'SC': 2914}
    assert d['audit']['duplicate_labels'] == {'SP 2347': 2}
    assert d['audit']['exact_duplicate_extra_rows'] == d['audit']['rows_removed'] == 0
    assert d['source']['license'] is None
    assert d['source']['license_status'] == 'not_established_in_local_source_snapshot'
    assert d['source']['sha256']
    assert not any('entrance' in r for r in d['records'])


def test_all_real_associations_reverify_unique_signed_identity_and_containment():
    from pyproj import Transformer
    from shapely import transform
    from shapely.geometry import Point, shape
    d = json.loads((ROOT / 'web/data/addresses.json').read_text(encoding='utf8'))
    cfg = json.loads((ROOT / 'web/data/venezia.json').read_text())
    raw = (ROOT / 'web/data/attrs.bin').read_bytes()
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    features = json.loads((ROOT / d['source']['building_source']).read_text(encoding='utf8'))['features']
    grouped = {}
    for f in features:
        grouped.setdefault(f['properties']['building_id'], []).append(f)
    signed = Counter(int(struct.unpack_from('<d', raw, i)[0]) for i in range(0, len(raw), cfg['attrStride'])
                     if raw[i + cfg['attrFields']['src'][0]] == 0)
    project = Transformer.from_crs('EPSG:4326', 'EPSG:32633', always_xy=True).transform
    checked = 0
    geometries = {}
    for r in d['records']:
        if r['gid'] is None:
            continue
        osm = int(struct.unpack_from('<d', raw, r['gid'] * cfg['attrStride'])[0])
        bid = ('w' if osm > 0 else 'r') + str(abs(osm))
        assert signed[osm] == len(grouped[bid]) == 1
        if bid not in geometries:
            geometries[bid] = transform(shape(grouped[bid][0]['geometry']), project, interleaved=False)
        g = geometries[bid]
        pt = Point(r['easting'], r['northing'])
        assert g.contains(pt) and g.boundary.distance(pt) > d['audit']['edge_guard_m']
        simplified = g.simplify(.25, preserve_topology=True)
        assert simplified.contains(pt) and simplified.boundary.distance(pt) > d['audit']['edge_guard_m']
        assert r['candidate_gids'] == [r['gid']]
        checked += 1
    assert checked == d['audit']['match_counts']['contained'] > 0


def test_real_address_all_rows_recomputed_matches_and_consumer_contract():
    import subprocess
    m = api()
    d = json.loads((ROOT / 'web/data/addresses.json').read_text(encoding='utf8'))
    cfg = json.loads((ROOT / 'web/data/venezia.json').read_text())
    source = json.loads((ROOT / d['source']['path']).read_text(encoding='utf8'))
    features = json.loads((ROOT / d['source']['building_source']).read_text(encoding='utf8'))['features']
    gids, hashes = m.mesh_inventory(ROOT / 'web/data', cfg)
    buildings, audit = m.rendered_buildings(features,(ROOT / 'web/data/attrs.bin').read_bytes(),cfg,gids)
    recomputed = m.enrich(source,buildings,cfg,d['source'])
    assert recomputed['records'] == d['records']
    assert recomputed['by_gid'] == d['by_gid']
    assert recomputed['audit'] == {k:v for k,v in d['audit'].items() if k != 'writer_identity'}
    assert audit == d['audit']['writer_identity']
    assert hashes == d['source']['atlas_pack_sha256']
    script = """
    import fs from 'node:fs';
    import assert from 'node:assert/strict';
    import {recordsForGid,declaredCount,queryAddressRecords} from './web/data-enrichment.js';
    const d=JSON.parse(fs.readFileSync('web/data/addresses.json','utf8'));
    assert.equal(declaredCount(d),31623);
    const ids=new Map(d.records.map(r=>[r.id,r]));
    for(const [gid,refs] of Object.entries(d.by_gid))assert.deepEqual(recordsForGid(d,gid),refs.map(id=>ids.get(id)));
    assert.equal(queryAddressRecords(d,'SP 2347').filter(r=>r.label==='SP 2347').length,2);
    """
    result = subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,capture_output=True,text=True)
    assert result.returncode == 0, result.stdout + result.stderr


@pytest.mark.parametrize('kind,identity', [('node',7),('way',-7),('relation',0),('way','007'),('relation',True)])
def test_source_identity_rejects_invalid_type_or_nonpositive_noninteger_id(kind,identity):
    f = building(7)
    f['properties'] = {'building_id':'r7' if kind == 'node' else 'w7', 'osm_type':kind, 'osm_id':identity}
    with pytest.raises(ValueError,match='identity'):
        api().rendered_buildings([f],attrs([(-7 if kind == 'node' else 7,0)]),CFG,{0})
