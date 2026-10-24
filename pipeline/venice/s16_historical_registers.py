"""Exhaustive local historical catalogues; dates are register events, never construction.

Run: python -m pipeline.venice.s16_historical_registers
Unknown redistribution rights are explicitly blocked; this stage does NOT publish.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
import gzip
import hashlib
import json
from pathlib import Path
import struct

from pyproj import Transformer
from shapely import make_valid, wkt, transform as coordinate_transform
from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[2]
MAX_BYTES = 1_900_000


def transform(fn, geometry):
    return coordinate_transform(geometry, fn, interleaved=False)


COMMON_LIMITATIONS = [
    'The year is the source register/guide event, not a construction year.',
    'Historical owner/tenant/professional names do not establish modern ownership.',
    'No geographic boundary filter: all canonical source rows are retained.',
    'Current gid associations are spatial evidence only, explicitly not building identity.',
]


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def record(dataset_id, year, row, attributes, geo, id_field):
    source_id = attributes.get(id_field)
    label_fields = ('owner_name', 'owner_transcription', 'LAST_N', 'FIRST_N', 'name', 'family', 'function', 'quality', 'profession', 'place', 'LOC_STR')
    label = ' · '.join(str(attributes[k]) for k in label_fields if attributes.get(k) not in (None, ''))
    return {'record_id': str(source_id) if source_id is not None else f'row:{row}',
            'id': str(source_id) if source_id is not None else f'row:{row}', 'sources': [dataset_id],
            'source_id': source_id, 'source_row': row, 'label': label or str(source_id),
            'text': '\n'.join(f'{k}: {json.dumps(v, ensure_ascii=False)}' for k, v in attributes.items() if v is not None and v != ''),
            'attributes': dict(attributes), 'geo': geo, 'source_event_year': year}


def normalize_rows(dataset_id, year, rows, id_field, geometries=None):
    geometries = geometries if geometries is not None else [None] * len(rows)
    counts = Counter(str(r.get(id_field)) for r in rows if r.get(id_field) is not None)
    result = []
    for i, (attributes, geo) in enumerate(zip(rows, geometries, strict=True)):
        item = record(dataset_id, year, i, attributes, geo, id_field)
        if item['source_id'] is not None and counts[str(item['source_id'])] > 1:
            item['record_id'] = f"{item['record_id']}#source-row:{i}"
        item['id'] = item['record_id']
        result.append(item)
    if len({r['record_id'] for r in result}) != len(result):
        raise ValueError(f'{dataset_id}: colliding record IDs')
    return result


def license_info(year, zenodo):
    if year == 1808 and zenodo and zenodo.get('metadata', {}).get('license', {}).get('id') == 'cc-by-4.0':
        metadata = zenodo['metadata']
        return {'id': 'CC-BY-4.0', 'url': 'https://creativecommons.org/licenses/by/4.0/',
                'redistribution_allowed': True, 'status': 'confirmed',
                'evidence': '1808/zenodo_record.json metadata.license.id = cc-by-4.0',
                'source_doi': metadata.get('doi'), 'version': metadata.get('version'),
                'attribution': metadata.get('creators', [])}
    return {'id': None, 'redistribution_allowed': False,
            'status': 'blocked_pending_rights_confirmation',
            'evidence': 'Inspected local source README and repository archive: no LICENSE/COPYING or explicit redistribution grant found.',
            'note': 'Public access and the age of the manuscript do not license modern transcription/geolocation.'}


def source_info(raw, path, url, crs):
    return {'url': url, 'local_file': path.relative_to(raw).as_posix(),
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes': path.stat().st_size, 'original_crs': crs}


def load_sources(raw):
    """One 1740 edition, three distinct 1808 units, one complete 1857 CSV."""
    raw = Path(raw)
    week = raw / 'repositories/venice-data-week-data/venice-data-week-data-main'
    p1740 = raw / 'repositories/venice-1740-landregister/venice-1740-landregister-main/1740_Catastici_2026-05-12.geojson'
    old1740 = week / '1740-catastici/1740_catastici_version20250625.geojson'
    p1857 = week / '1857-commercial-guide/1857_commercial_guide_with_pages_20250624.csv'
    zenodo = read_json(raw / '1808/zenodo_record.json')
    to_web = Transformer.from_crs(32633, 4326, always_xy=True).transform
    specs = [
        ('register-1740', 1740, p1740, 'uid', {'ru': 'Поземельный реестр 1740', 'it': 'Catastici del 1740', 'en': '1740 land register'}, 'EPSG:32633'),
        ('parcels-1808', 1808, raw / '1808/venice_1808_landregister_geometries.geojson', 'id', {'ru': 'Исторические участки 1808', 'it': 'Particelle catastali del 1808', 'en': '1808 historical parcels'}, 'OGC:CRS84'),
        ('register-1808', 1808, raw / '1808/venice_1808_landregister_textual_entries.json', 'parcel_id', {'ru': 'Поземельный реестр 1808', 'it': 'Sommarioni del 1808', 'en': '1808 land register entries'}, None),
        ('people-1808', 1808, raw / '1808/venice_1808_landregister_standardised_people.json', 'uid', {'ru': 'Исторические лица реестра 1808', 'it': 'Persone dei Sommarioni del 1808', 'en': '1808 register people'}, None),
        ('commercial-1857', 1857, p1857, 'index', {'ru': 'Коммерческий справочник 1857', 'it': 'Guida commerciale del 1857', 'en': '1857 commercial guide'}, 'EPSG:4326'),
    ]
    datasets = []
    for dataset_id, year, path, id_field, title, crs in specs:
        if year == 1857:
            with path.open(encoding='utf-8-sig', newline='') as handle:
                attrs = list(csv.DictReader(handle))
            geos = [mapping(wkt.loads(r['geometry'])) if r['geometry'].strip() else None for r in attrs]
            url = 'https://github.com/epfl-timemachine/venice-data-week-data/tree/main/1857-commercial-guide'
        else:
            data = read_json(path)
            if isinstance(data, dict) and data.get('type') == 'FeatureCollection':
                attrs = [r['properties'] for r in data['features']]
                geos = [r.get('geometry') for r in data['features']]
                if year == 1740:
                    geos = [mapping(transform(to_web, shape(g))) if g else None for g in geos]
            else:
                attrs, geos = data, None
            url = ('https://github.com/epfl-timemachine/venice-1740-landregister' if year == 1740
                   else f'https://zenodo.org/records/20715172/files/{path.name}')
        rows = normalize_rows(dataset_id, year, attrs, id_field, geos)
        limitations = list(COMMON_LIMITATIONS)
        if year == 1740:
            limitations.append('Canonical edition 2026-05-12: 32,361 entries; older 2025-06-25 edition is not added. Points are manually located properties, not footprints.')
        if year == 1857:
            limitations.append('Exhausts the CSV transcription (5,883 entries), not the entire printed guide. 25 rows lack geolocation. Methods include contemporary numbering, cadaster, manual and interpolation; no current-building identity inferred.')
        if dataset_id == 'parcels-1808':
            limitations.append('Geometry rows include water, streets, courtyards and sottoportici; only building polygons are eligible for current-footprint associations. Original geometry IDs can repeat.')
        if dataset_id == 'people-1808':
            limitations.append('Disambiguated people are separate from entries/parcels; people counts are not buildings or independent ownership events.')
        datasets.append({'id': dataset_id, 'title': title, 'year': year,
                         'record_count': len(rows), 'fields': sorted(set().union(*(r.keys() for r in attrs))),
                         'source': source_info(raw, path, url, crs), 'license': license_info(year, zenodo),
                         'limitations': limitations, 'records': rows})
    aggregate = read_json(raw / '1808/venice_1808_landregister_aggregated_data.json')
    counts = {d['id']: len(d['records']) for d in datasets}
    expected = {'register-1740': 32361, 'parcels-1808': 24430, 'register-1808': 23662, 'people-1808': 12277, 'commercial-1857': 5883}
    if counts != expected:
        raise ValueError(f'Canonical source count mismatch: {counts}')
    audit = {'canonical_source_counts': counts,
             'excluded_duplicate_editions': {'1740_20250625': len(read_json(old1740)['features'])},
             'selected_1740_edition': '2026-05-12', 'excluded_aggregate_1808_groups': len(aggregate),
             'excluded_aggregate_reason': 'Derived repetition of canonical polygons, entries and people; not an additional population.',
             'duplicate_source_ids': {d['id']: len(d['records']) - len({str(r['source_id']) for r in d['records']}) for d in datasets},
             'geolocated_rows': {d['id']: sum(r['geo'] is not None for r in d['records']) for d in datasets},
             'boundary_filter_applied': False, 'event_year_semantics': 'source register or guide observation, not construction'}
    return datasets, audit


def write_chunks(output, dataset_id, records, max_bytes=MAX_BYTES):
    """Write schema-1 envelopes consumed by the existing UI, no slicing."""
    output = Path(output)
    directory = output / 'history-registers'
    directory.mkdir(parents=True, exist_ok=True)
    prefix, suffix = b'{"schema":1,"records":[', b']}'
    overhead = len(prefix) + len(suffix)
    files, refs, batch, size = [], [], [], overhead
    def flush():
        nonlocal batch, size
        if not batch:
            return
        filename = f'history-registers/{dataset_id}-{len(files):03d}.json'
        payload = prefix + b','.join(b for _, b in batch) + suffix
        target = output / filename
        # Deterministic restart: keep completed byte-identical chunks untouched.
        if not target.exists() or target.read_bytes() != payload:
            target.write_bytes(payload)
        files.append(filename)
        refs.extend({'file': filename, 'offset': i, 'record_id': r['record_id']} for i, (r, _) in enumerate(batch))
        batch, size = [], overhead
    for item in records:
        encoded = json.dumps(item, ensure_ascii=False, allow_nan=False, separators=(',', ':')).encode('utf-8')
        if len(encoded) + overhead >= max_bytes:
            raise ValueError(f'{dataset_id}: single record exceeds chunk limit')
        if batch and size + len(encoded) + 1 >= max_bytes:
            flush()
        size += len(encoded) + (1 if batch else 0)
        batch.append((item, encoded))
    flush()
    return files, refs


def spatial_overlap(buildings, parcels):
    """Unique >=80% current and >=50% historical area, metric polygons only."""
    if not parcels:
        return []
    tree = STRtree([p[1] for p in parcels])
    result = []
    for gid, building in buildings:
        if building.area <= 0:
            continue
        candidates = []
        for i in tree.query(building, predicate='intersects'):
            record_id, parcel = parcels[int(i)]
            if parcel.area <= 0:
                continue
            area = building.intersection(parcel).area
            bshare, pshare = area / building.area, area / parcel.area
            if bshare >= .8 and pshare >= .5:
                candidates.append({'gid': gid, 'record_id': record_id, 'method': 'historical_parcel_spatial_overlap',
                                   'identity': False, 'current_footprint_share': round(bshare, 6),
                                   'historical_parcel_share': round(pshare, 6)})
        if len(candidates) == 1:
            result.extend(candidates)
    return result


def current_buildings(root):
    """Decode actual emitted gid->signed OSM IDs, never source-row enumeration."""
    web = root / 'web/data'
    cfg = read_json(web / 'venezia.json')
    stride = cfg['attrStride']
    offset, dtype = cfg['attrFields']['osm']
    if dtype not in ('<i8', '<i4', '<f8'):
        raise ValueError(f'Unexpected OSM attribute dtype {dtype}')
    blob = gzip.decompress((web / 'attrs.bin').read_bytes())
    if len(blob) % stride:
        raise ValueError('Truncated attribute records')
    unpack = {'<i8': '<q', '<i4': '<i', '<f8': '<d'}[dtype]
    gid_by_id = defaultdict(list)
    for gid in range(len(blob) // stride):
        if 'src' in cfg['attrFields'] and blob[gid * stride + cfg['attrFields']['src'][0]] != 0:
            continue
        osm_id = struct.unpack_from(unpack, blob, gid * stride + offset)[0]
        if dtype == '<f8' and (not float(osm_id).is_integer() or abs(osm_id) > 2**53):
            raise ValueError('OSM attribute must be an exactly representable integer')
        osm_id = int(osm_id)
        gid_by_id[('w' if osm_id >= 0 else 'r') + str(abs(osm_id))].append(gid)
    to_metric = Transformer.from_crs(4326, 32633, always_xy=True).transform
    grouped = defaultdict(list)
    for area in ('island', 'centro'):
        path = root / f'data/processed/buildings_dated_{area}.geojson'
        if not path.exists():
            continue
        for feature in read_json(path)['features']:
            bid = feature['properties']['building_id']
            if bid in gid_by_id and feature.get('geometry'):
                grouped[bid].append(make_valid(transform(to_metric, shape(feature['geometry']))))
    buildings = []
    for bid, geometries in grouped.items():
        # Repeated exported signed OSM IDs are ambiguous: do not choose a gid.
        if len(gid_by_id[bid]) == 1:
            buildings.append((gid_by_id[bid][0], unary_union(geometries)))
    return buildings, {'emitted_attribute_records': len(blob) // stride,
                       'current_building_geometries': len(buildings),
                       'ambiguous_emitted_osm_ids': sum(len(v) > 1 for v in gid_by_id.values()),
                       'attrs_sha256': hashlib.sha256((web / 'attrs.bin').read_bytes()).hexdigest(),
                       'config_sha256': hashlib.sha256((web / 'venezia.json').read_bytes()).hexdigest(),
                       'gid_mapping': 'Decoded actual attrs.bin signed OSM id; source geometries grouped by building_id; duplicate emitted IDs excluded.'}


def associate(datasets, refs_by_dataset, buildings):
    data = {d['id']: d['records'] for d in datasets}
    to_metric = Transformer.from_crs(4326, 32633, always_xy=True).transform
    eligible = [r for r in data['parcels-1808'] if r['geo'] and r['attributes'].get('geometry_type', r['attributes'].get('parcel_type')) == 'building']
    parcels = [(r['record_id'], make_valid(transform(to_metric, shape(r['geo'])))) for r in eligible]
    matches = spatial_overlap(buildings, parcels)
    by_gid = defaultdict(list)
    parcel_by_id = {r['record_id']: r for r in eligible}
    text_by_geometry = defaultdict(list)
    for row in data['register-1808']:
        key = row['attributes'].get('geometry_id')
        if key is not None:
            text_by_geometry[str(key)].append(row)
    people_by_parcel = defaultdict(list)
    for row in data['people-1808']:
        for parcel_id in row['attributes'].get('parcel_ids') or []:
            people_by_parcel[parcel_id].append(row)
    refmaps = {key: {r['record_id']: r for r in refs} for key, refs in refs_by_dataset.items()}
    for match in matches:
        gid, rid = match['gid'], match['record_id']
        evidence = {k: v for k, v in match.items() if k not in ('gid', 'record_id')}
        def add(dataset_id, record_id, **extra):
            by_gid[str(gid)].append(dict(refmaps[dataset_id][record_id], id=record_id,
                                         sources=[dataset_id], dataset_id=dataset_id, **evidence, **extra))
        add('parcels-1808', rid)
        geometry_id = parcel_by_id[rid]['attributes'].get('geometry_id')
        if geometry_id is not None:
            for row in text_by_geometry.get(str(geometry_id), []):
                add('register-1808', row['record_id'], via_historical_parcel=rid)
                for person in people_by_parcel.get(row['source_id'], []):
                    add('people-1808', person['record_id'], via_historical_parcel=rid)
    # Do not equate uncertain 1740 id_napo semantics or 1857 numbered points to today's buildings.
    for gid, refs in by_gid.items():
        unique = {(r['dataset_id'], r['record_id']): r for r in refs}
        by_gid[gid] = list(unique.values())
    return dict(by_gid), {'historical_parcel_matches': len(matches), 'associated_gids': len(by_gid),
                          'association_references': sum(map(len, by_gid.values())),
                          'rule': 'Unique building-type 1808 parcel overlapping >=80% current footprint and >=50% historical polygon area; metric EPSG:32633; ambiguous matches discarded.',
                          'unassociated_catalogues': ['register-1740', 'commercial-1857'],
                          'unassociated_reason': 'Retained source points and historical IDs, but no proven cross-year current-building identity. Browse/search full catalogue independently.'}


def verify_catalog(output, index):
    output = Path(output)
    chunks, total, max_size = {}, 0, 0
    declared_files = set()
    for dataset in index['datasets']:
        rows = []
        for file in dataset['files']:
            if file in declared_files:
                raise ValueError('Duplicate chunk declaration')
            declared_files.add(file)
            path = output / file
            size = path.stat().st_size
            manifest = index.get('chunk_manifest', {}).get(file)
            if manifest and (manifest['bytes'] != size or manifest['sha256'] != hashlib.sha256(path.read_bytes()).hexdigest()):
                raise ValueError(f'Chunk hash mismatch: {file}')
            if size >= MAX_BYTES:
                raise ValueError(f'Chunk size limit exceeded: {file}')
            max_size = max(max_size, size)
            envelope = read_json(path)
            if not isinstance(envelope, dict) or envelope.get('schema') != 1 or not isinstance(envelope.get('records'), list):
                raise ValueError('Chunks must be schema-1 record envelopes')
            chunk = envelope['records']
            chunks[file] = chunk
            rows.extend(chunk)
        if len(rows) != dataset['record_count']:
            raise ValueError(f"{dataset['id']}: chunk count mismatch")
        if len({r['record_id'] for r in rows}) != len(rows):
            raise ValueError('Duplicate canonical record ID')
        total += len(rows)
    references = 0
    for refs in index.get('by_gid', {}).values():
        for ref in refs:
            if chunks[ref['file']][ref['offset']]['record_id'] != ref['record_id']:
                raise ValueError('Broken record reference')
            if ref.get('identity') is not False:
                raise ValueError('Spatial association cannot assert identity')
            references += 1
    return {'canonical_records': total, 'chunk_files': len(chunks), 'maximum_chunk_bytes': max_size,
            'references_verified': references, 'all_canonical_rows_reconciled': True}


def verify_render_guard(root, index):
    guard = index['render_guard']
    web = Path(root) / 'web/data'
    for filename, field in [('attrs.bin', 'attrs_sha256'), ('venezia.json', 'config_sha256')]:
        if hashlib.sha256((web / filename).read_bytes()).hexdigest() != guard[field]:
            raise ValueError(f'Current render changed: {filename}; regenerate historical gid references')
    for gid in index.get('by_gid', {}):
        if not str(gid).isdigit() or not 0 <= int(gid) < guard['attribute_records']:
            raise ValueError('Historical gid outside current render')
    return {'current_render_guard_verified': True}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--raw', type=Path, default=ROOT / 'data/raw/Venice_Historical_20261022_2025')
    parser.add_argument('--output', type=Path, default=ROOT / 'web/data')
    args = parser.parse_args(argv)
    datasets, audit = load_sources(args.raw)
    refs_by_dataset = {}
    for dataset in datasets:
        dataset['files'], refs_by_dataset[dataset['id']] = write_chunks(args.output, dataset['id'], dataset['records'])
        dataset['chunks'] = [{'url': 'data/' + file} for file in dataset['files']]
        print(dataset['id'], len(dataset['records']), len(dataset['files']), flush=True)
    buildings, gid_audit = current_buildings(ROOT)
    by_gid, match_audit = associate(datasets, refs_by_dataset, buildings)
    public_datasets = [{k: v for k, v in d.items() if k != 'records'} for d in datasets]
    blocked = [d['id'] for d in datasets if not d['license']['redistribution_allowed']]
    manifest = {file: {'sha256': hashlib.sha256((args.output / file).read_bytes()).hexdigest(),
                       'bytes': (args.output / file).stat().st_size}
                for d in datasets for file in d['files']}
    source_catalog = {d['id']: dict(d['source'], id=d['id'], title=d['title']['en'], license=d['license']) for d in datasets}
    guard = {'attrs_sha256': gid_audit['attrs_sha256'], 'config_sha256': gid_audit['config_sha256'],
             'attribute_records': gid_audit['emitted_attribute_records'],
             'policy': 'Producer validates exact current render; regenerate on attrs/config changes. Host must enforce guard before reusing references.'}
    index = {'schema': 1, 'datasets': public_datasets, 'by_gid': by_gid,
             'record_count': sum(d['record_count'] for d in datasets),
             'sources': list(source_catalog.values()), 'source_catalog': source_catalog,
             'chunk_manifest': manifest, 'render_guard': guard,
             'publication': {'status': 'local_only_rights_blocked' if blocked else 'ready_with_attribution',
                             'blocked_datasets': blocked, 'public_release_allowed': not blocked},
             'audit': dict(audit, **gid_audit, **match_audit)}
    index['audit'].update(verify_catalog(args.output, index))
    index['audit'].update(verify_render_guard(ROOT, index))
    path = args.output / 'history-registers.json'
    path.write_text(json.dumps(index, ensure_ascii=False, allow_nan=False, separators=(',', ':')), encoding='utf-8')
    # Read back exact final index and all listed chunks, not in-memory-only verification.
    verified = verify_catalog(args.output, read_json(path))
    verified.update(verify_render_guard(ROOT, read_json(path)))
    print(json.dumps({'publication': index['publication'], 'verification': verified, 'matching': match_audit}, ensure_ascii=False, indent=2))
    return index


if __name__ == '__main__':
    main()
