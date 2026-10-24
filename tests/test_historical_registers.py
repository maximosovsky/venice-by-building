"""Canonical-register census, rights gate and conservative spatial association."""
import importlib
import json
from pathlib import Path

import pytest
from shapely.geometry import box, mapping


def module():
    path = Path(__file__).parents[1] / 'pipeline/venice/s16_historical_registers.py'
    assert path.exists(), 'historical register pipeline not implemented'
    return importlib.import_module('pipeline.venice.s16_historical_registers')


def test_normalize_preserves_source_ids_attributes_null_and_event_year():
    m = module()
    props = {'uid': 'AGN-0001a', 'owner_name': 'Paolina Franco', 'ten_name': None}
    record = m.record('register-1740', 1740, 0, props, None, 'uid')
    assert record['record_id'] == 'AGN-0001a'
    assert record['attributes'] == props
    assert record['geo'] is None
    assert record['source_event_year'] == 1740
    assert 'construction_year' not in record
    assert 'current_owner' not in record


def test_chunk_arrays_exhaust_every_row_under_byte_limit(tmp_path):
    m = module()
    rows = [m.record('test', 1808, i, {'uid': str(i), 'name': 'é' * 20}, None, 'uid') for i in range(21)]
    files, refs = m.write_chunks(tmp_path, 'test', rows, max_bytes=1000)
    reread = [r for f in files for r in json.loads((tmp_path / f).read_text(encoding='utf-8'))['records']]
    assert reread == rows
    assert len(refs) == 21
    assert all((tmp_path / f).stat().st_size < 1000 for f in files)
    assert all(json.loads((tmp_path / ref['file']).read_text(encoding='utf-8'))['records'][ref['offset']]['record_id'] == ref['record_id'] for ref in refs)


def test_oversized_single_record_refuses_truncation(tmp_path):
    m = module()
    with pytest.raises(ValueError, match='single record'):
        m.write_chunks(tmp_path, 'test', [{'text': 'x' * 1000}], max_bytes=100)


def test_duplicate_original_geometry_ids_preserved_with_distinct_record_ids():
    m = module()
    rows = m.normalize_rows('parcels-1808', 1808, [{'id': 'way/01'}, {'id': 'way/01'}], 'id')
    assert len({r['record_id'] for r in rows}) == 2
    assert [r['attributes']['id'] for r in rows] == ['way/01', 'way/01']
    assert [r['source_id'] for r in rows] == ['way/01', 'way/01']


def test_overlap_requires_real_area_and_rejects_ambiguous_current_building():
    m = module()
    buildings = [(7, box(0, 0, 10, 10)), (8, box(10, 0, 20, 10))]
    parcels = [('one', box(0, 0, 10, 10)), ('touch', box(20, 0, 30, 10)), ('tiny', box(10, 0, 11, 1))]
    matches = m.spatial_overlap(buildings, parcels)
    assert [(r['gid'], r['record_id']) for r in matches] == [(7, 'one')]
    assert matches[0]['method'] == 'historical_parcel_spatial_overlap'
    assert matches[0]['identity'] is False
    assert m.spatial_overlap(buildings[:1], [('a', box(0, 0, 10, 10)), ('b', box(0, 0, 10, 10))]) == []


def test_rights_gate_only_known_license_allows_publication():
    m = module()
    assert m.license_info(1808, {'metadata': {'license': {'id': 'cc-by-4.0'}, 'doi': '10.5281/zenodo.20715172'}})['redistribution_allowed'] is True
    for year in (1740, 1857):
        info = m.license_info(year, None)
        assert info['id'] is None
        assert info['redistribution_allowed'] is False
        assert info['status'] == 'blocked_pending_rights_confirmation'


def test_written_artifact_reconciles_all_chunks_and_reference_targets(tmp_path):
    m = module()
    rows = m.normalize_rows('test', 1808, [{'uid': '01'}, {'uid': '02'}], 'uid')
    files, refs = m.write_chunks(tmp_path, 'test', rows, max_bytes=2000)
    index = {'schema': 1, 'datasets': [{'id': 'test', 'record_count': 2, 'files': files}], 'by_gid': {'1': [dict(refs[0], dataset_id='test', identity=False)]}}
    audit = m.verify_catalog(tmp_path, index)
    assert audit['canonical_records'] == 2
    assert audit['references_verified'] == 1
    index['datasets'][0]['record_count'] = 1
    with pytest.raises(ValueError, match='count'):
        m.verify_catalog(tmp_path, index)


def test_chunk_envelope_matches_existing_ui_loader(tmp_path):
    m = module()
    files, _ = m.write_chunks(tmp_path, 'test', m.normalize_rows('test', 1740, [{'uid': 'a'}], 'uid'))
    envelope = json.loads((tmp_path / files[0]).read_text(encoding='utf8'))
    assert envelope['schema'] == 1
    assert envelope['records'][0]['id'] == 'a'
    assert envelope['records'][0]['sources'] == ['test']


def test_chunk_hash_rejects_silent_text_corruption(tmp_path):
    import hashlib
    m = module()
    files, _ = m.write_chunks(tmp_path, 'test', m.normalize_rows('test', 1740, [{'uid': 'a'}], 'uid'))
    p = tmp_path / files[0]
    index = {'datasets': [{'id': 'test', 'record_count': 1, 'files': files}],
             'chunk_manifest': {files[0]: {'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size}}}
    p.write_bytes(p.read_bytes().replace(b'"uid":"a"', b'"uid":"b"'))
    with pytest.raises(ValueError, match='hash'):
        m.verify_catalog(tmp_path, index)


def test_render_guard_rejects_changed_current_attributes(tmp_path):
    import hashlib
    m = module()
    web = tmp_path / 'web/data'
    web.mkdir(parents=True)
    (web / 'attrs.bin').write_bytes(b'current')
    (web / 'venezia.json').write_bytes(b'{}')
    index = {'render_guard': {'attrs_sha256': hashlib.sha256(b'current').hexdigest(),
                             'config_sha256': hashlib.sha256(b'{}').hexdigest(), 'attribute_records': 2},
             'by_gid': {'1': []}}
    m.verify_render_guard(tmp_path, index)
    (web / 'attrs.bin').write_bytes(b'other')
    with pytest.raises(ValueError, match='render'):
        m.verify_render_guard(tmp_path, index)


def test_association_joins_source_geometry_string_to_integer_without_mutating_ids():
    m = module()
    geo = mapping(box(12.33, 45.43, 12.3301, 45.4301))
    datasets = [{'id': 'parcels-1808', 'records': m.normalize_rows('parcels-1808', 1808, [{'id': 'way/1', 'geometry_id': '12', 'geometry_type': 'building'}], 'id', [geo])},
                {'id': 'register-1808', 'records': m.normalize_rows('register-1808', 1808, [{'parcel_id': 7, 'geometry_id': 12}], 'parcel_id')},
                {'id': 'people-1808', 'records': m.normalize_rows('people-1808', 1808, [{'uid': 3, 'parcel_ids': [7]}], 'uid')}]
    refs = {d['id']: [{'file': 'fixture', 'offset': i, 'record_id': r['record_id']} for i, r in enumerate(d['records'])] for d in datasets}
    fn = m.Transformer.from_crs(4326, 32633, always_xy=True).transform
    result, _ = m.associate(datasets, refs, [(1, m.transform(fn, m.shape(geo)))])
    assert {r['dataset_id'] for r in result['1']} == {'parcels-1808', 'register-1808', 'people-1808'}
    assert datasets[0]['records'][0]['attributes']['geometry_id'] == '12'


def test_real_sources_canonical_census():
    m = module()
    raw = Path(__file__).parents[1] / 'data/raw/Venice_Historical_20261022_2025'
    if not raw.exists():
        pytest.skip('immutable historical source archive unavailable')
    datasets, audit = m.load_sources(raw)
    counts = {d['id']: len(d['records']) for d in datasets}
    assert counts == {'register-1740': 32361, 'parcels-1808': 24430, 'register-1808': 23662, 'people-1808': 12277, 'commercial-1857': 5883}
    assert audit['excluded_duplicate_editions']['1740_20250625'] == 32676
    assert audit['excluded_aggregate_1808_groups'] == 16870
    assert sum(r['geo'] is not None for d in datasets if d['id'] == 'commercial-1857' for r in d['records']) == 5858
    for dataset in datasets:
        assert len({r['record_id'] for r in dataset['records']}) == len(dataset['records'])
        assert all(r['source_event_year'] == dataset['year'] for r in dataset['records'])


def test_current_gids_decode_actual_double_attribute_and_skip_duplicate_ids(tmp_path):
    import gzip
    import struct
    m = module()
    web = tmp_path / 'web/data'
    processed = tmp_path / 'data/processed'
    web.mkdir(parents=True)
    processed.mkdir(parents=True)
    (web / 'venezia.json').write_text(json.dumps({'attrStride': 8, 'attrFields': {'osm': [0, '<f8']}}))
    (web / 'attrs.bin').write_bytes(gzip.compress(struct.pack('<4d', 123, -456, 789, 789)))
    features = [{'type': 'Feature', 'properties': {'building_id': bid}, 'geometry': mapping(box(12.33, 45.43, 12.3301, 45.4301))} for bid in ['r456', 'w123', 'w789']]
    (processed / 'buildings_dated_centro.geojson').write_text(json.dumps({'type': 'FeatureCollection', 'features': features}))
    buildings, audit = m.current_buildings(tmp_path)
    assert {gid for gid, _ in buildings} == {0, 1}
    assert audit['ambiguous_emitted_osm_ids'] == 1
    (web / 'attrs.bin').write_bytes(gzip.compress(struct.pack('<d', 123.25)))
    with pytest.raises(ValueError, match='integer'):
        m.current_buildings(tmp_path)

