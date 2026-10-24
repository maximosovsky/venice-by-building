"""Add all Civici2024 points; never infer entrances, nearest buildings or scope.
Run from the repository root: python -m pipeline.venice.s13_addresses
Identity is read from the writer's signed OSM attrs and verified against packs.
"""
import gzip
import hashlib
import json
import math
import struct
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

from pyproj import CRS, Transformer
from shapely import transform
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[2]
RAW = Path('data/raw/Venice_Historical_20261022_2025')
REPOSITORY = RAW / 'repositories/venice-data-week-data/venice-data-week-data-main'
SOURCE = REPOSITORY / '2024-geometries/2024_Civici_EPSG32633.geojson'
BUILDINGS = Path('data/processed/buildings_dated_centro.geojson')
EDGE_GUARD_M = 0.35  # writer simplifies 0.25 m and quantises at 0.1 m


def mesh_inventory(directory, cfg):
    """Read actual packed GIDs and part ranges, not the source feature order."""
    gids, seen, hashes = set(), set(), {}
    for name in sorted({t['pack'] for t in cfg['tiles']}):
        stored = (directory / name).read_bytes()
        hashes[name] = hashlib.sha256(stored).hexdigest()
        blob = gzip.decompress(stored) if stored[:2] == b'\x1f\x8b' else stored
        for t in (t for t in cfg['tiles'] if t['pack'] == name):
            buf = blob[t['offset']:t['offset'] + t['length']]
            if len(buf) != t['length'] or len(buf) < 36:
                raise ValueError('truncated atlas tile')
            magic, n, nparts = struct.unpack_from('<3I', buf)
            if magic != 0x3A5A3356 or n != t['n']:
                raise ValueError('invalid atlas tile header')
            ids = struct.unpack_from(f'<{n}I', buf, 36)
            off = 36 + 4*n + ((2*n+3)//4)*4 + 4*((n+3)//4)*4 + 8*n
            starts = struct.unpack_from(f'<{n+1}I', buf, off)
            if starts[0] != 0 or starts[-1] != nparts or any(a > b for a, b in zip(starts, starts[1:])):
                raise ValueError('invalid atlas part ranges')
            for i, gid in enumerate(ids):
                if gid in seen:
                    raise ValueError('duplicate packed GID')
                seen.add(gid)
                if starts[i+1] > starts[i]:
                    gids.add(gid)
    return gids, hashes


def rendered_buildings(features, raw, cfg, mesh_gids):
    """Match signed writer OSM identities to unique original building footprints."""
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    stride, fields = cfg['attrStride'], cfg['attrFields']
    if len(raw) % stride:
        raise ValueError('invalid attrs stride')
    writer, bridges = defaultdict(list), 0
    for gid, off in enumerate(range(0, len(raw), stride)):
        if raw[off + fields['src'][0]] != 0:
            bridges += 1
            continue
        osm = struct.unpack_from('<d', raw, off + fields['osm'][0])[0]
        if not math.isfinite(osm) or osm != int(osm) or osm == 0:
            raise ValueError('invalid signed writer identity')
        writer[('w' if osm > 0 else 'r') + str(abs(int(osm)))].append(gid)
    original = defaultdict(list)
    for f in features:
        p = f['properties']
        if p.get('osm_type') not in ('way', 'relation') or type(p.get('osm_id')) is not int or p['osm_id'] <= 0:
            raise ValueError('invalid building source identity type/id')
        bid = ('w' if p['osm_type'] == 'way' else 'r') + str(p['osm_id'])
        if bid != p['building_id']:
            raise ValueError('building source identity mismatch')
        original[bid].append(f)
    project = Transformer.from_crs('EPSG:4326', cfg['crs'], always_xy=True).transform
    out, resolved = [], set()
    for bid, ids in sorted(writer.items()):
        if len(ids) != 1 or len(original.get(bid, [])) != 1 or ids[0] not in mesh_gids:
            continue
        geom = transform(shape(original[bid][0]['geometry']), project, interleaved=False)
        if geom.is_empty or not geom.is_valid or geom.geom_type not in ('Polygon', 'MultiPolygon'):
            continue
        out.append({'gid': ids[0], 'building_id': bid, 'geometry': geom,
                    'render_geometry': geom.simplify(0.25, preserve_topology=True)})
        resolved.add(ids[0])
    audit = {'writer_building_rows': sum(map(len, writer.values())), 'bridge_rows_excluded': bridges,
             'resolved_render_buildings': len(out), 'unresolved_writer_gids': sorted({g for ids in writer.values() for g in ids} - resolved),
             'duplicate_writer_identities': {k: v for k, v in writer.items() if len(v) > 1},
             'duplicate_source_identities': {k: len(v) for k, v in original.items() if len(v) > 1}}
    return out, audit


def enrich(data, buildings, cfg, source, expected_count=31623):
    """Census every row and retain ambiguity; duplicate rows are never dropped."""
    fs = data['features']
    if data.get('type') != 'FeatureCollection' or len(fs) != expected_count:
        raise ValueError('Civici census count/type mismatch')
    crs = data.get('crs', {}).get('properties', {}).get('name', '')
    if not crs or CRS.from_user_input(crs).to_epsg() != 32633 or CRS.from_user_input(cfg['crs']).to_epsg() != 32633:
        raise ValueError('expected original EPSG:32633 source and atlas')
    to_ll = Transformer.from_crs('EPSG:32633', 'EPSG:4326', always_xy=True)
    geoms = [b['geometry'] for b in buildings]
    tree = STRtree(geoms)
    occurrences, labels, exact = Counter(), Counter(), Counter()
    records, by_gid = [], defaultdict(list)
    for i, f in enumerate(fs):
        p, geom = f['properties'], f['geometry']
        if not {'CIVICI', 'sestiere', 'number', 'letter'} <= p.keys():
            raise ValueError('missing original Civici field')
        if geom['type'] != 'Point' or len(geom['coordinates']) != 2 or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in geom['coordinates']):
            raise ValueError('expected finite original point coordinates')
        canonical = json.dumps(f, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
        digest = hashlib.sha256(canonical.encode('utf8')).hexdigest()
        occurrences[digest] += 1
        exact[digest] += 1
        rid = 'civici2024:' + digest + ':' + str(occurrences[digest])
        e, n = geom['coordinates']
        lon, lat = to_ll.transform(e, n)
        point = Point(e, n)
        candidates = [int(j) for j in tree.query(point.buffer(EDGE_GUARD_M))
                      if geoms[int(j)].distance(point) <= EDGE_GUARD_M]
        hits = sorted({buildings[j]['gid'] for j in candidates})
        gid, status = None, 'unmatched'
        if len(hits) > 1:
            status = 'ambiguous'
        elif hits:
            b = buildings[candidates[0]]
            safe = all(g.contains(point) and g.boundary.distance(point) > EDGE_GUARD_M for g in (b['geometry'], b['render_geometry']))
            status = 'contained' if safe else 'boundary'
            gid = hits[0] if safe else None
        r = {'id': rid, 'label': p['CIVICI'], 'sestiere': p['sestiere'], 'number': p['number'], 'letter': p['letter'],
             'lon': lon, 'lat': lat, 'x': e-cfg['origin'][0], 'z': -(n-cfg['origin'][1]), 'gid': gid, 'match': status,
             'source_id': f.get('id'), 'source_row': i, 'easting': e, 'northing': n, 'candidate_gids': hits}
        records.append(r)
        labels[p['CIVICI']] += 1
        if gid is not None:
            by_gid[str(gid)].append(rid)
    audit = {'source_rows': len(fs), 'exported_rows': len(records), 'unique_record_ids': len(occurrences) + sum(v-1 for v in occurrences.values()),
             'rows_removed': 0, 'deduplication_policy': 'retain every source row; content-hash IDs with occurrence suffix; never merge duplicate labels or coincident coordinates',
             'exact_duplicate_extra_rows': sum(v-1 for v in exact.values()), 'duplicate_labels': {k: v for k, v in labels.items() if v > 1},
             'sestiere_counts': dict(Counter(r['sestiere'] for r in records)), 'match_counts': dict(Counter(r['match'] for r in records)),
             'field_present_counts': {k: sum(k in f['properties'] for f in fs) for k in ('CIVICI', 'sestiere', 'number', 'letter')},
             'field_nonnull_counts': {k: sum(f['properties'][k] is not None for f in fs) for k in ('CIVICI', 'sestiere', 'number', 'letter')},
             'original_feature_id_rows': sum('id' in f for f in fs), 'matched_buildings': len(by_gid), 'edge_guard_m': EDGE_GUARD_M,
             'interpretation': 'Address-point containment association only; not an entrance, access, dwelling or independently verified building identity. No nearest-neighbour or geographic scope filter.'}
    return {'schema': 1, 'records': records, 'by_gid': dict(by_gid), 'source': source, 'audit': audit}


def main():
    web = ROOT / 'web/data'
    cfg = json.loads((web / 'venezia.json').read_text(encoding='utf8'))
    src_bytes = (ROOT / SOURCE).read_bytes()
    building_bytes = (ROOT / BUILDINGS).read_bytes()
    attrs = (web / 'attrs.bin').read_bytes()
    gids, hashes = mesh_inventory(web, cfg)
    bs, writer_audit = rendered_buildings(json.loads(building_bytes)['features'], attrs, cfg, gids)
    readmes = sorted((ROOT / REPOSITORY).rglob('README*'))
    source = {'name': 'Civici2024', 'edition': 2024, 'path': SOURCE.as_posix(), 'crs': 'EPSG:32633',
              'repository': 'https://github.com/epfl-timemachine/venice-data-week-data',
              'url': 'https://github.com/epfl-timemachine/venice-data-week-data/blob/main/2024-geometries/2024_Civici_EPSG32633.geojson',
              'sha256': hashlib.sha256(src_bytes).hexdigest(), 'bytes': len(src_bytes), 'license': None,
              'license_status': 'not_established_in_local_source_snapshot',
              'license_evidence': {'archive_readme': (RAW / 'README.md').as_posix(), 'archive_statement': 'Check individual licenses; an explicit reusable license was not established for all repositories.',
                                   'repository_readmes_checked': [p.relative_to(ROOT).as_posix() for p in readmes],
                                   'note': 'No root or 2024-geometries README or LICENSE in local repository snapshot. Licenses of other editions are not assigned to Civici2024.'},
              'building_source': BUILDINGS.as_posix(), 'building_sha256': hashlib.sha256(building_bytes).hexdigest(),
              'atlas_attrs_sha256': hashlib.sha256(attrs).hexdigest(), 'atlas_pack_sha256': hashes,
              'atlas_config_sha256': hashlib.sha256((web / 'venezia.json').read_bytes()).hexdigest(),
              'origin': cfg['origin'], 'generated_utc': datetime.now(timezone.utc).isoformat()}
    result = enrich(json.loads(src_bytes), bs, cfg, source)
    result['audit']['writer_identity'] = writer_audit
    out = web / 'addresses.json'
    out.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf8')
    print(json.dumps({'output': str(out), 'audit': result['audit'], 'source_sha256': source['sha256']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
