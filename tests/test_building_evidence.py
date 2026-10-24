"""Evidence joins must use the current render identity, never input order."""
import gzip
import importlib.util
import json
import struct
from pathlib import Path

import pytest
from shapely.geometry import box, mapping

ROOT = Path(__file__).resolve().parents[1]


def module():
    path = ROOT / 'pipeline/venice/s14_building_evidence.py'
    assert path.exists(), 'Building evidence stage has not been implemented'
    spec = importlib.util.spec_from_file_location('building_evidence', path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def feature(bid, osm, geom, **extra):
    return {'type': 'Feature', 'properties': {'building_id': bid, 'osm_type': 'way' if osm > 0 else 'relation', 'osm_id': abs(osm), **extra}, 'geometry': mapping(geom)}


def config():
    return {'attrStride': 56, 'attrFields': {'osm': [0, '<f8'], 'src': [44, '|u1'], 'wk': [28, '<i4']}}


def attrs(*objects):
    out = bytearray(56 * len(objects))
    for gid, (osm, src, wk) in enumerate(objects):
        struct.pack_into('<d', out, gid * 56, osm)
        out[gid * 56 + 44] = src
        struct.pack_into('<i', out, gid * 56 + 28, wk)
    return gzip.compress(out)


def test_render_mapping_is_signed_sparse_not_source_order():
    m = module()
    features = [feature('w11', 11, box(0, 0, 1, 1)), feature('r11', -11, box(3, 0, 4, 1))]
    targets, audit = m.render_targets(features, attrs((-11, 0, -1), (99, 1, -1), (11, 0, -1)), config(), [], 'EPSG:32633')
    assert {r['building_id']: r['gid'] for r in targets} == {'r11': 0, 'w11': 2}
    assert audit['bridge_rows_excluded'] == 1


def test_duplicate_building_parts_are_unioned_not_dropped():
    m = module()
    fs = [feature('w11', 11, box(0, 0, 1, 1)), feature('w11', 11, box(2, 0, 3, 1))]
    targets, audit = m.render_targets(fs, attrs((11, 0, -1)), config(), [], 'EPSG:32633')
    assert targets[0]['geometry'].area == 2
    assert audit['duplicate_source_rows'] == 1


def test_invalid_stride_is_rejected():
    with pytest.raises(ValueError, match='stride'):
        module().render_targets([], b'abc', config(), [], 'EPSG:32633')


def test_osm_tokens_are_strictly_validated():
    m = module()
    assert m.osm_tokens('way/11, relation/22,') == [('way', 11), ('relation', 22)]
    assert m.osm_tokens('way/11x') == []
    assert m.osm_tokens('WAY/11') == []


def targets():
    return [{'gid': 9, 'building_id': 'w11', 'osm_type': 'way', 'osm_id': 11, 'qids': ['Q42'], 'geometry': box(0, 0, 10, 10)}, {'gid': 2, 'building_id': 'w22', 'osm_type': 'way', 'osm_id': 22, 'qids': [], 'geometry': box(10, 0, 20, 10)}]


def test_exact_osm_identity_precedes_geometry():
    m = module()
    index = m.Matcher(targets())
    hits, reason = index.match({'osm_ids': 'way/11'}, box(10, 0, 20, 10))
    assert hits[0]['gid'] == 9
    assert hits[0]['match']['method'] == 'exact_osm_identity'


def test_verified_osm_qid_precedes_geometry():
    hits, reason = module().Matcher(targets()).match({'wikidata': 'Q42'}, box(40, 40, 41, 41))
    assert hits[0]['gid'] == 9
    assert hits[0]['match']['method'] == 'exact_osm_wikidata'


def test_unique_reciprocal_overlap_is_conservative():
    hits, reason = module().Matcher(targets()).match({}, box(.1, .1, 9.9, 9.9))
    assert hits[0]['gid'] == 9
    assert hits[0]['match']['method'] == 'reciprocal_polygon_overlap'
    assert hits[0]['match']['source_overlap'] == 1


def test_split_and_nearest_buildings_are_not_guessed():
    m = module().Matcher(targets())
    assert m.match({}, box(0, 0, 20, 10))[0] == []
    assert m.match({}, box(21, 0, 22, 1))[0] == []


def test_http_urls_are_literal_and_unsafe_or_relative_urls_rejected():
    m = module()
    assert m.safe_url('https://example.org/s.htm?q=a;b') == 'https://example.org/s.htm?q=a;b'
    for value in ['javascript:alert(1)', '//example.org', 'Scheda1.htm', ' https://example.org', 'https://example.org\n']:
        assert m.safe_url(value) is None


def test_records_preserve_verbatim_text_without_date_extraction():
    m = module()
    text = '  Chiesa eretta nel 1388.\n<i>Originale</i>  '
    e = m.edifici_record({'EDIFI_ID': 77, 'description_piamonte': text, 'style': 'Gothic', 'typology': 'Palazzo'}, allow_fulltext=True)
    assert e['text'] == text
    assert e['language'] == 'it'
    assert 'year' not in e
    v = m.vprg_record({'OBJECTID': 8, 'NOTE': '  nota\n', 'STATO_ALT': ' stato ', 'SCHEDA': 'x.htm', 'LINK_SCHEDA': 'javascript:bad'}, allow_fulltext=True)
    assert v['note'] == '  nota\n'
    assert v['state'] == ' stato '
    assert v['sheet'] == 'x.htm'
    assert v['url'] is None
    assert v['raw_url'] == 'javascript:bad'


def test_unknown_rights_block_public_text_but_retain_evidence_metadata():
    m = module()
    e = m.edifici_record({'EDIFI_ID': 77, 'description_piamonte': 'Originale italiano'})
    assert e['text'] is None
    assert e['text_withheld'] is True
    assert e['text_publication_status'] == 'blocked_rights_unestablished'
    assert e['text_sha256']
    v = m.vprg_record({'OBJECTID': 8, 'NOTE': 'nota', 'STATO_ALT': 'stato', 'LINK_SCHEDA': 'https://example.org/a'})
    assert v['note'] is None
    assert v['state'] is None
    assert v['url'] == 'https://example.org/a'


def test_real_pack_directory_reader_uses_compressed_tile_ranges(tmp_path):
    blob = struct.pack('<7I2f', 0x3A5A3356, 2, 0, 0, 0, 0, 0, 0, 0) + struct.pack('<2I', 2, 9)
    (tmp_path / 'pack0.bin').write_bytes(gzip.compress(b'prefix' + blob))
    cfg = {'packs': ['pack0.bin'], 'tiles': [{'pack': 'pack0.bin', 'offset': 6, 'length': len(blob), 'n': 2}]}
    gids, audit = module().rendered_pack_gids(cfg, tmp_path)
    assert gids == {2, 9}
    assert audit['pack_gids'] == 2
    cfg['tiles'][0]['length'] += 1
    with pytest.raises(ValueError, match='range'):
        module().rendered_pack_gids(cfg, tmp_path)


def test_export_catalog_retains_unmatched_and_all_links():
    m = module()
    ef = [{'properties': {'EDIFI_ID': 1, 'description_piamonte': 'descrizione'}, 'geometry': mapping(box(100, 100, 101, 101))}]
    vf = [{'properties': {'OBJECTID': 8, 'LINK_SCHEDA': 'https://example.org/s', 'SCHEDA': 's'}, 'geometry': mapping(box(0, 0, 10, 10))}]
    result = m.build_evidence(ef, vf, targets(), edifici_crs='EPSG:32633', vprg_crs='EPSG:32633')
    assert result['schema'] == 1
    assert len(result['source_catalog']['descriptions']) == 1
    assert len(result['source_catalog']['vprg']) == 1
    assert result['unmatched']['descriptions'][0]['source_id'] == '1'
    assert result['by_gid']['9']['vprg'][0]['source_id'] == '8'
    assert result['audit']['descriptions_matched_records'] == 0


def test_pack_validation_reads_real_render_gids_and_rejects_missing():
    m = module()
    blob = struct.pack('<7I2f', 0x3A5A3356, 2, 0, 0, 0, 0, 0, 0, 0) + struct.pack('<2I', 2, 9)
    assert m.pack_gids(blob) == [2, 9]
    with pytest.raises(ValueError, match='magic'):
        m.pack_gids(b'bad!' + blob[4:])


def test_coordinate_associated_wiki_qid_is_not_exact_identity():
    m = module()
    fs = [feature('w11', 11, box(0, 0, 1, 1))]
    ts, audit = m.render_targets(fs, attrs((11, 0, 0)), config(), [{'qid': 'Q42', 'byGeometry': True}], 'EPSG:32633')
    assert ts[0]['qids'] == []


def test_assigned_attributes_without_pack_gid_are_not_render_targets():
    fs = [feature('w11', 11, box(0, 0, 1, 1)), feature('w22', 22, box(2, 0, 3, 1))]
    ts, audit = module().render_targets(fs, attrs((11, 0, -1), (22, 0, -1)), config(), [], 'EPSG:32633', rendered_gids={1})
    assert [t['gid'] for t in ts] == [1]
    assert audit['assigned_building_rows_not_rendered'] == 1


def test_pack_reader_rejects_truncated_gid_array():
    blob = struct.pack('<7I2f', 0x3A5A3356, 2, 0, 0, 0, 0, 0, 0, 0)
    with pytest.raises(ValueError, match='truncated'):
        module().pack_gids(blob)


def test_projected_s06_position_mismatch_rejects_stale_mapping():
    m = module()
    cfg = config() | {'origin': [100, 100]}
    cfg['attrFields'] = cfg['attrFields'] | {'x': [48, '<f4'], 'z': [52, '<f4']}
    ts, audit = m.render_targets([feature('w11', 11, box(0, 0, 1, 1))], attrs((11, 0, -1)), cfg, [], 'EPSG:32633')
    assert ts == []
    assert audit['unresolved_render_rows'] == [0]
