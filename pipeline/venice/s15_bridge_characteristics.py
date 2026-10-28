"""Additive municipal PONTE characteristics; never regenerate routes or meshes.

Run: python -m pipeline.venice.s15_bridge_characteristics
Output is exclusive-create and INTERNAL until municipal redistribution is cleared.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import gzip
import hashlib
import json
import math
from pathlib import Path
import struct
import zipfile

from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
AUDIT = 'reports/municipal-ponte-audit_20261024_091400Z'
UNKNOWN = {'91': 'Non conosciuto', '92': 'Non assegnato', '93': 'Non definito',
           '94': 'Non applicabile', '95': 'Altro'}
ENUMS = {
    'PONTE_MAT': {'01': 'calcestruzzo', '02': 'legno', '03': 'muratura', '05': 'ferro'},
    'PONTE_USO': {'01': 'autostradale', '02': 'stradale', '03': 'ferroviario', '04': 'pedonale', '05': 'ciclabile'},
    'PONTE_TY': {'01': 'ponte', '02': 'viadotto', '03': 'cavalcavia', '04': 'non qualificato'},
}
HEIGHT_FIELDS = ('PONTE_LL', 'PONTE_SEQE', 'PONTE_SPQE', 'PONTE_SOQE',
                 'PONTE_SEEX', 'PONTE_SPEX', 'PONTE_SOEX')


def decode_enum(field, code):
    """Decode literal documented strings only: never repair 3 to 03."""
    return {'code': code, 'label': {**ENUMS[field], **UNKNOWN}.get(code)}


def aggregate_enum(field, attributes):
    codes = sorted({a.get(field) for a in attributes}, key=lambda v: str(v))
    if len(codes) == 1:
        return decode_enum(field, codes[0])
    return {'code': None, 'label': None, 'values': [decode_enum(field, c) for c in codes]}


def height_evidence(attributes):
    return {field: {'raw': attributes.get(field), 'value_m': None, 'unit': None,
                    'status': ('unassigned_sentinel_candidate' if attributes.get(field) in (92, '92')
                               else 'undocumented_unit_or_extrusion_semantics')}
            for field in HEIGHT_FIELDS}


def local_polygons(geometry, origin):
    """Polygon/ring/[x,z] nesting, holes retained; Z is evidence, not scene height."""
    polygons = [geometry] if geometry.geom_type == 'Polygon' else list(geometry.geoms)
    return [[[ [round(float(c[0]) - origin[0], 4), round(-(float(c[1]) - origin[1]), 4)]
                for c in ring.coords] for ring in [p.exterior, *p.interiors]]
            for p in polygons]


def footprint_dimensions(geometry):
    """Derived 2D oriented-envelope long/short sides, NOT surveyed span/deck width."""
    if geometry.is_empty or not geometry.is_valid or geometry.area <= 0:
        return None, None
    box = geometry.minimum_rotated_rectangle
    if box.geom_type != 'Polygon':
        return None, None
    coords = list(box.exterior.coords)
    sides = [math.dist(a[:2], b[:2]) for a, b in zip(coords, coords[1:])]
    return round(max(sides), 3), round(min(sides), 3)


def join_gids(raw, config, inventory, entries):
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    stride = config['attrStride']
    if stride <= 0 or len(raw) % stride:
        raise ValueError('attrs.bin length violates configured stride')
    identities = defaultdict(set)
    for item in inventory:
        for deck in item['deck_ids']:
            if not (isinstance(deck, str) and deck.startswith('d') and deck[1:].isdigit()):
                raise ValueError('Malformed OSM deck identifier')
            identities[int(deck[1:])].add(item['id'])
        for way in item['way_ids']:
            if not isinstance(way, int) or way <= 0:
                raise ValueError('Malformed OSM way identifier')
            identities[way].add(item['id'])
    result = {}
    for gid, offset in enumerate(range(0, len(raw), stride)):
        if raw[offset + config['attrFields']['src'][0]] != 1:
            continue
        value = struct.unpack_from('<d', raw, offset + config['attrFields']['osm'][0])[0]
        if not math.isfinite(value) or value <= 0 or not value.is_integer():
            continue  # negative IDs are relations, never way-ID collisions
        matches = identities.get(int(value), set())
        if len(matches) == 1:
            bridge_id = next(iter(matches))
            if bridge_id in entries:
                result[str(gid)] = {'bridge_id': bridge_id, 'osm_type': 'way', 'osm_id': int(value)}
    return result


def build_characteristics(census, ledger, source_rows, route, origin, source, source_geometries=None):
    route_ids = {b['id'] for b in route['bridges']}
    rows = {r['municipal_id']: r for r in census}
    if len(rows) != len(census):
        raise ValueError('Duplicate municipal audit IDs')
    entries = {}
    for link in ledger:
        bridge_id = link['osm_identity']
        if bridge_id not in route_ids or not link['route_included'] or not link['municipal_ids']:
            continue
        ids = sorted(set(link['municipal_ids']))
        parts, attributes, evidence, heights, z_evidence = [], [], [], [], []
        for municipal_id in ids:
            row = rows[municipal_id]
            fid = row['source_fid_zero_based']
            if municipal_id != f'PONTE2010:fID{fid:06d}':
                raise ValueError('Municipal ID/FID mismatch')
            if bridge_id not in row['strong_osm_identities']:
                raise ValueError('Rejected non-strong municipal identity')
            attrs, geometry = source_rows[fid]
            if attrs != row['municipal_attributes']:
                raise ValueError('Raw source attributes differ from audited source')
            if geometry.is_empty or not geometry.is_valid or geometry.geom_type not in ('Polygon', 'MultiPolygon'):
                raise ValueError('Invalid source polygon; no automatic repair permitted')
            parts.append(geometry)
            attributes.append(attrs)
            strong = [e for kind in ('deck_evidence', 'highway_evidence') for e in row[kind]
                      if e.get('strong') and e.get('identity') == bridge_id]
            if not strong:
                raise ValueError('Missing strong source overlap evidence')
            evidence.append({'municipal_id': municipal_id, 'match': 'audited_strong_overlap', 'overlaps': strong})
            heights.append({'municipal_id': municipal_id, 'fields': height_evidence(attrs)})
            polys = [geometry] if geometry.geom_type == 'Polygon' else list(geometry.geoms)
            z_values = [float(c[2]) for p in polys for r in [p.exterior, *p.interiors]
                        for c in r.coords if len(c) > 2 and math.isfinite(c[2])]
            z_evidence.append({'municipal_id': municipal_id, 'min_raw': min(z_values) if z_values else None,
                               'max_raw': max(z_values) if z_values else None,
                               'vertical_datum': None, 'unit': None, 'value_m': None,
                               'status': 'raw_polygon_z_not_bridge_height'})
        length, width = footprint_dimensions(unary_union(parts))
        entries[bridge_id] = {
            'municipal_ids': ids,
            'material': aggregate_enum('PONTE_MAT', attributes),
            'purpose': aggregate_enum('PONTE_USO', attributes),
            'type': aggregate_enum('PONTE_TY', attributes),
            'length_m': length, 'width_m': width,
            'dimensions_method': 'EPSG:32633 minimum rotated envelope long/short sides of complete matched footprint union; derived, not surveyed span or usable width',
            'geometry_local': [p for part in parts for p in local_polygons(part, origin)],
            'geometry_part_municipal_ids': [mid for mid, part in zip(ids, parts)
                                           for _ in local_polygons(part, origin)],
            'evidence_heightfields': heights, 'evidence_polygon_z': z_evidence,
            'raw_attributes': [{'municipal_id': mid, 'fields': attrs} for mid, attrs in zip(ids, attributes)],
            'match_evidence': evidence,
            'source': {'key': 'municipal_ponte_2010', 'layer': source.get('layer', 'ComuneVenezia_aree/PONTE.shp'),
                       'archive_sha256': source.get('archive_sha256'), 'source_crs': 'EPSG:6706'},
        }
        if source_geometries is not None:
            from shapely.geometry import mapping
            entries[bridge_id]['geometry_source'] = [
                {'municipal_id': mid, 'crs': 'EPSG:6706',
                 # Shapely mappings contain tuples; normalize coordinates at the
                 # GeoJSON boundary so strict written-result equality is meaningful.
                 'geometry': json.loads(json.dumps(
                     mapping(source_geometries[rows[mid]['source_fid_zero_based']]), allow_nan=False))}
                for mid in ids]
    return {'schema_version': 1, 'by_bridge_id': dict(sorted(entries.items())), 'by_gid': {},
            'unmatched_bridge_ids': sorted(route_ids - set(entries)),
            'geometry_frame': {'crs': 'EPSG:32633', 'origin': origin, 'axes': 'x=easting-originE; z=-(northing-originN)', 'unit': 'm', 'nesting': 'polygon/ring/[x,z]'},
            'source': source,
            'publication': {'actual_geometry': 'blocked_pending_municipal_license', 'license': None,
                            'reason': 'Download availability is not verified redistribution permission; internal preparation only.'}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--audit', default=AUDIT)
    parser.add_argument('--output', default='web/data/bridge-characteristics.json')
    args = parser.parse_args()
    root = args.root
    output = root / args.output
    if output.exists():
        raise FileExistsError(f'Refusing existing write: {output}; use a NEW --output')
    load = lambda p: json.loads(p.read_text(encoding='utf-8'))
    sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
    audit = root / args.audit
    manifest = load(audit / 'source-manifest.json')
    archive = root / 'data/raw/Venice_Geodata_20261022_2004/2010_Venezia_aree_retry.zip'
    pdf = archive.parent / '2010_Venezia_doc.pdf'
    route_path = root / 'web/data/bridge-route.json'
    config_path = root / 'web/data/venezia.json'
    attrs_path = root / 'web/data/attrs.bin'
    protected = {p: sha(p) for d in ('web/data', 'data/routes') for p in (root / d).rglob('*') if p.is_file()}
    if sha(archive) != manifest['municipal_archive']['sha256'] or sha(pdf) != manifest['dictionary']['sha256']:
        raise ValueError('Archive/PDF differs from authoritative audit')
    if sha(route_path) != manifest['route_sha256']:
        raise ValueError('Route differs from authoritative audit; no rematching permitted')
    with zipfile.ZipFile(archive) as z:
        if z.testzip() is not None:
            raise ValueError('Archive CRC failure')
        for member in manifest['municipal_archive']['members']:
            if hashlib.sha256(z.read(member['name'])).hexdigest() != member['sha256']:
                raise ValueError('Shapefile component hash mismatch')
    import geopandas as gpd
    import pymupdf
    with pymupdf.open(pdf) as document:
        text = '\n'.join(document[i].get_text() for i in (13, 56, 57))
        if not all(term in text for term in ('PONTE_MAT', 'muratura', 'pedonale', 'ferroviario', 'Non assegnato', 'PONTE_TY')):
            raise ValueError('Official PDF dictionary evidence missing')
    frame = gpd.read_file(f'zip://{archive.as_posix()}!{manifest["municipal_archive"]["layer"]}')
    if len(frame) != 1259 or frame.crs.to_epsg() != 6706 or not frame.geometry.is_valid.all():
        raise ValueError('Source count/CRS/validity mismatch')
    clean = lambda v: None if v is None or (isinstance(v, float) and math.isnan(v)) else v.item() if hasattr(v, 'item') else v
    attributes = [{k: clean(v) for k, v in row.items()} for row in frame.drop(columns='geometry').to_dict('records')]
    metric = frame.to_crs(32633)
    source_rows = {fid: (attrs, geom) for fid, (attrs, geom) in enumerate(zip(attributes, metric.geometry))}
    config = load(config_path)
    source = {'key': 'municipal_ponte_2010', 'authority': 'Regione del Veneto, Comune di Venezia GEODBT lot',
              'portal_url': 'https://idt2.regione.veneto.it/idt/downloader/download',
              'layer': manifest['municipal_archive']['layer'], 'archive_sha256': sha(archive),
              'dictionary_sha256': sha(pdf), 'dictionary_pages': [14, 57, 58],
              'audit_path': args.audit, 'source_records': len(frame), 'source_crs': 'EPSG:6706',
              'metric_crs': 'EPSG:32633', 'edition': '2010 catalog edition, not construction date',
              'route_sha256': sha(route_path), 'attrs_sha256': sha(attrs_path), 'config_sha256': sha(config_path),
              'census_sha256': sha(audit / 'municipal-census.json'),
              'reconciliation_sha256': sha(audit / 'osm-route-reconciliation.json'),
              'osm_attribution': 'OpenStreetMap contributors, ODbL 1.0', 'license': None,
              'rights_evidence': 'Authoritative audit and raw README: redistribution not independently established; official download pages establish availability only.'}
    route = load(route_path)
    result = build_characteristics(load(audit / 'municipal-census.json'),
                                   load(audit / 'osm-route-reconciliation.json'), source_rows, route, config['origin'], source,
                                   source_geometries=dict(enumerate(frame.geometry)))
    # Consumer resolves literal catalog keys; keep complete signed identity evidence separately.
    result['gid_identity'] = join_gids(attrs_path.read_bytes(), config, route['audit']['inventory'], result['by_bridge_id'])
    result['by_gid'] = {gid: link['bridge_id'] for gid, link in result['gid_identity'].items()}
    result['record_count'] = len(result['by_bridge_id'])
    entries = result['by_bridge_id']
    ids = {mid for r in entries.values() for mid in r['municipal_ids']}
    result['counts'] = {'source_records': len(frame), 'route_bridges': len(route['bridges']),
                        'matched_bridges': len(entries), 'matched_municipal_records': len(ids),
                        'unmatched_bridges': len(result['unmatched_bridge_ids']),
                        'gid_links': len(result['by_gid']),
                        'bridges_with_gid': len(set(result['by_gid'].values())),
                        'actual_polygon_parts': sum(len(r['geometry_local']) for r in entries.values()),
                        'length_width_derived': sum(r['length_m'] is not None and r['width_m'] is not None for r in entries.values()),
                        'verified_height_measurements': 0,
                        'materials': dict(Counter(r['material']['code'] for r in entries.values())),
                        'purposes': dict(Counter(r['purpose']['code'] for r in entries.values())),
                        'types': dict(Counter(r['type']['code'] for r in entries.values()))}
    if len(entries) != 328 or len(route['bridges']) != 346:
        raise ValueError('Authoritative strong-match/route totals differ')
    for p, digest in protected.items():
        if sha(p) != digest:
            raise ValueError(f'Protected source changed during run: {p}')
    result['generated_at'] = datetime.now(timezone.utc).isoformat()
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('x', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    written = load(output)
    if written != result:
        raise ValueError('Written JSON roundtrip differs')
    print(json.dumps({'output': str(output), 'sha256': sha(output), 'counts': written['counts'],
                      'publication': written['publication']}, indent=2))


if __name__ == '__main__':
    main()
