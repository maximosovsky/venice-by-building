"""Regeneration contracts: JSON-native geometry and recomputed render associations."""
import hashlib
import json
from pathlib import Path

from shapely.geometry import Polygon, mapping

from pipeline.venice import s14_building_evidence as evidence
from pipeline.venice import s15_bridge_characteristics as bridges
from pipeline.venice import s16_historical_registers as history

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads(path.read_text(encoding='utf8'))


def test_bridge_source_geometry_is_json_native_without_roundtrip_mutation():
    geom = Polygon([(100, 200, 4), (110, 200, 5), (110, 210, 6), (100, 210, 7)],
                   [[(102, 202, 4), (104, 202, 4), (104, 204, 4), (102, 204, 4)]])
    attrs = {'PONTE_MAT': '03', 'PONTE_USO': '04', 'PONTE_TY': '01'}
    mid = 'PONTE2010:fID000000'
    census = [{'municipal_id': mid, 'source_fid_zero_based': 0,
               'municipal_attributes': attrs, 'strong_osm_identities': ['d12'],
               'deck_evidence': [{'strong': True, 'identity': 'd12'}], 'highway_evidence': []}]
    ledger = [{'osm_identity': 'd12', 'route_included': True, 'municipal_ids': [mid]}]
    result = bridges.build_characteristics(census, ledger, {0: (attrs, geom)},
        {'bridges': [{'id': 'd12'}]}, [90, 190], {}, source_geometries={0: geom})
    assert json.loads(json.dumps(result, allow_nan=False)) == result
    assert result['by_bridge_id']['d12']['geometry_source'][0]['geometry'] == json.loads(json.dumps(mapping(geom)))


def test_real_bridge_primary_producer_hashes_are_current_without_alias_override():
    source = read(ROOT / 'web/data/bridge-characteristics.json')['source']
    for filename, field in [('attrs.bin', 'attrs_sha256'), ('venezia.json', 'config_sha256')]:
        assert source[field] == hashlib.sha256((ROOT / 'web/data' / filename).read_bytes()).hexdigest()
    assert 'atlas_attrs_sha256' not in source
    assert 'atlas_config_sha256' not in source


def test_real_history_associations_equal_complete_recomputation():
    output = ROOT / 'web/data'
    index = read(output / 'history-registers.json')
    datasets, source_audit = history.load_sources(ROOT / 'data/raw/Venice_Historical_20261022_2025')
    refs = {}
    for dataset in datasets:
        declared = next(d for d in index['datasets'] if d['id'] == dataset['id'])
        refs[dataset['id']] = []
        written_rows = []
        for file in declared['files']:
            rows = read(output / file)['records']
            written_rows.extend(rows)
            refs[dataset['id']].extend({'file': file, 'offset': i, 'record_id': row['record_id']}
                                       for i, row in enumerate(rows))
        assert written_rows == json.loads(json.dumps(dataset['records'], allow_nan=False))
    buildings, render_audit = history.current_buildings(ROOT)
    expected, association_audit = history.associate(datasets, refs, buildings)
    assert index['by_gid'] == expected
    for audit in (source_audit, render_audit, association_audit):
        for key, value in audit.items():
            assert index['audit'][key] == value
    assert history.verify_render_guard(ROOT, index)['current_render_guard_verified']
    assert history.verify_catalog(output, index)['all_canonical_rows_reconciled']


def test_real_building_evidence_equals_all_source_recomputed_matches_and_text():
    output = ROOT / 'web/data'
    written = read(output / 'building-evidence.json')
    config = read(output / 'venezia.json')
    attrs = (output / 'attrs.bin').read_bytes()
    gids, pack_audit = evidence.rendered_pack_gids(config, output)
    targets, render_audit = evidence.render_targets(
        read(ROOT / 'data/processed/buildings_dated_centro.geojson')['features'],
        attrs, config, read(output / 'wiki.json'), rendered_gids=gids)
    render_audit['pack_validation'] = pack_audit
    rebuilt = evidence.build_evidence(read(ROOT / evidence.EDIFICI_REL)['features'],
        read(ROOT / evidence.VPRG_REL)['features'], targets,
        allow_fulltext=True, status='published_user_authorized')
    for key in ('by_gid', 'source_catalog', 'unmatched'):
        assert rebuilt[key] == written[key]
    for key, value in rebuilt['audit'].items():
        assert written['audit'][key] == value
    assert render_audit == written['audit']['render_mapping']
    assert written['source']['atlas_attrs_sha256'] == hashlib.sha256(attrs).hexdigest()
    for path, digest in written['source']['input_sha256'].items():
        assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == digest
