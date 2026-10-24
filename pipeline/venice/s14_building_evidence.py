"""Additive, rights-gated Edifici2024/VPRG evidence sidecar. No dates inferred.

Run from the repository: python pipeline/venice/s14_building_evidence.py
Unknown redistribution rights deliberately withhold full prose in web output.
--local-fulltext requires --output outside web/ and is for private review only.
--local-fulltext --authorized-publication writes the same prose into web output on the
operator's explicit authorization; it is a policy switch, not a discovered license grant.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import math
import re
import struct
from collections import Counter, defaultdict
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from pyproj import Transformer
from shapely import make_valid, transform
from shapely.geometry import shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[2]
EDIFICI_REL = 'data/raw/Venice_Historical_20261022_2025/repositories/venice-data-week-data/venice-data-week-data-main/2024-geometries/2024_Edifici_EPSG32633.geojson'
EDIFICI_URL = 'https://github.com/epfl-timemachine/venice-data-week-data/blob/main/2024-geometries/2024_Edifici_EPSG32633.geojson'
VPRG_REL = 'data/raw/vprg/venezia_classificazione_unita_edilizie.geojson'
VPRG_URL = 'https://arcgis-prd.comune.venezia.it/server/rest/services/URBANISTICA/VPRG_Citta_Antica_WGS84_15_01_2021/MapServer/14'


def present(value):
    return value is not None and bool(str(value).strip())


def safe_url(value):
    if not isinstance(value, str) or value != value.strip() or any(ord(c) < 32 for c in value):
        return None
    try:
        p = urlsplit(value)
        if p.scheme in ('http', 'https') and p.hostname and not p.username and not p.password:
            return value
    except ValueError:
        pass
    return None


def osm_tokens(value):
    if not isinstance(value, str):
        return []
    result = []
    for token in value.split(','):
        match = re.fullmatch(r'(way|relation)/([1-9][0-9]*)', token.strip())
        if match:
            result.append((match[1], int(match[2])))
    return list(dict.fromkeys(result))


@lru_cache(maxsize=8)
def metric_transformer(crs):
    return Transformer.from_crs(crs, 'EPSG:32633', always_xy=True)


def metric_geometry(geometry, crs):
    geom = shape(geometry)
    if crs != 'EPSG:32633':
        geom = transform(geom, metric_transformer(crs).transform, interleaved=False)
    return make_valid(geom) if not geom.is_valid else geom


def pack_gids(blob):
    """Read worker.js's little-endian GID array at byte 36, not assigned attrs."""
    raw = gzip.decompress(blob) if blob[:2] == b'\x1f\x8b' else blob
    if len(raw) < 36:
        raise ValueError('truncated pack header')
    magic, count = struct.unpack_from('<2I', raw)
    if magic != 0x3A5A3356:
        raise ValueError('Invalid Venice pack magic')
    if len(raw) < 36 + count * 4:
        raise ValueError('truncated pack GID array')
    return list(struct.unpack_from(f'<{count}I', raw, 36))


def rendered_pack_gids(config, directory):
    packs = {name: (directory / name).read_bytes() for name in config['packs']}
    # app.js fetchBin decompresses the complete pack before applying tile ranges.
    decoded = {name: gzip.decompress(blob) if blob[:2] == b'\x1f\x8b' else blob for name, blob in packs.items()}
    gids = []
    for tile in config['tiles']:
        pack = decoded[tile['pack']]
        start, length = tile['offset'], tile['length']
        if start < 0 or length <= 0 or start + length > len(pack):
            raise ValueError('Invalid pack tile range')
        tile_gids = pack_gids(pack[start:start + length])
        if len(tile_gids) != tile['n']:
            raise ValueError('Tile record count differs from config')
        gids.extend(tile_gids)
    if len(set(gids)) != len(gids):
        raise ValueError('Duplicate render GID in packs')
    return set(gids), {'tiles_verified': len(config['tiles']), 'pack_gids': len(gids),
                       'reader': 'web/worker.js: header nB at byte 4, uint32 GIDs at byte 36',
                       'pack_sha256': {name: hashlib.sha256(blob).hexdigest() for name, blob in packs.items()}}


def render_targets(features, raw_attrs, config, wiki, crs='EPSG:4326', rendered_gids=None):
    raw = gzip.decompress(raw_attrs) if raw_attrs[:2] == b'\x1f\x8b' else raw_attrs
    stride, fields = config['attrStride'], config['attrFields']
    if stride < 45 or len(raw) % stride:
        raise ValueError('Invalid attribute stride or truncated attributes')
    grouped = defaultdict(list)
    for feature in features:
        p = feature['properties']
        signed = p['osm_id'] * (1 if p['osm_type'] == 'way' else -1)
        grouped[signed].append(feature)
    audit = {'attribute_rows': len(raw) // stride, 'bridge_rows_excluded': 0,
             'assigned_building_rows_not_rendered': 0,
             'duplicate_source_rows': sum(len(fs) - 1 for fs in grouped.values()),
             'unresolved_render_rows': [], 'signed_osm_and_s06_position_verified': 0}
    targets = []
    rendered_counts = Counter(struct.unpack_from('<d', raw, off + fields['osm'][0])[0]
                              for off in range(0, len(raw), stride) if raw[off + fields['src'][0]] == 0)
    for gid, off in enumerate(range(0, len(raw), stride)):
        if raw[off + fields['src'][0]] != 0:
            audit['bridge_rows_excluded'] += 1
            continue
        if rendered_gids is not None and gid not in rendered_gids:
            audit['assigned_building_rows_not_rendered'] += 1
            continue
        signed = struct.unpack_from('<d', raw, off + fields['osm'][0])[0]
        if not math.isfinite(signed) or signed != int(signed):
            raise ValueError('Invalid signed OSM ID in attributes')
        fs = grouped.get(int(signed), [])
        if len({f['properties']['building_id'] for f in fs}) != 1:
            audit['unresolved_render_rows'].append(gid)
            continue
        geoms = [metric_geometry(f['geometry'], crs) for f in fs]
        if 'x' in fields and 'z' in fields:
            x = struct.unpack_from('<f', raw, off + fields['x'][0])[0]
            z = struct.unpack_from('<f', raw, off + fields['z'][0])[0]
            ox, oy = config['origin']
            eligible = [i for i, geom in enumerate(geoms)
                        if math.hypot(geom.simplify(.25, preserve_topology=True).representative_point().x - ox - x,
                                      -(geom.simplify(.25, preserve_topology=True).representative_point().y - oy) - z) < .02]
            if len(eligible) != 1:
                audit['unresolved_render_rows'].append(gid)
                continue
            audit['signed_osm_and_s06_position_verified'] += 1
            if rendered_counts[signed] > 1:
                geoms = [geoms[eligible[0]]]
                fs = [fs[eligible[0]]]
        elif rendered_counts[signed] > 1:
            audit['unresolved_render_rows'].append(gid)
            continue
        p = fs[0]['properties']
        qids = set()
        for f in fs:
            qid = f['properties'].get('wikidata')
            if isinstance(qid, str) and re.fullmatch(r'Q[1-9][0-9]*', qid):
                qids.add(qid)
        # Coordinate-associated wiki cards are NOT verified identity joins.
        wk = struct.unpack_from('<i', raw, off + fields['wk'][0])[0]
        if 0 <= wk < len(wiki) and not wiki[wk].get('byGeometry'):
            qid = wiki[wk].get('qid')
            if isinstance(qid, str) and re.fullmatch(r'Q[1-9][0-9]*', qid):
                qids.add(qid)
        targets.append({'gid': gid, 'building_id': p['building_id'], 'osm_type': p['osm_type'],
                        'osm_id': p['osm_id'], 'qids': sorted(qids), 'geometry': unary_union(geoms)})
    audit['verified_render_buildings'] = len(targets)
    return targets, audit


class Matcher:
    """Verified explicit identifiers first; no nearest/centroid fallback."""
    def __init__(self, targets):
        self.targets = targets
        self.tree = STRtree([t['geometry'] for t in targets])
        self.osm = defaultdict(list)
        self.qids = defaultdict(list)
        for target in targets:
            self.osm[(target['osm_type'], target['osm_id'])].append(target)
            for qid in target.get('qids', []):
                self.qids[qid].append(target)

    def match(self, properties, geometry):
        exact = {}
        for token in osm_tokens(properties.get('osm_ids')):
            hits = self.osm.get(token, [])
            if len(hits) == 1:
                exact[hits[0]['gid']] = {'gid': hits[0]['gid'], 'match': {'method': 'exact_osm_identity', 'osm_type': token[0], 'osm_id': token[1]}}
        if exact:
            return [exact[k] for k in sorted(exact)], None
        qid = properties.get('wikidata')
        if isinstance(qid, str) and re.fullmatch(r'Q[1-9][0-9]*', qid):
            hits = self.qids.get(qid, [])
            if len(hits) == 1:
                return [{'gid': hits[0]['gid'], 'match': {'method': 'exact_osm_wikidata', 'qid': qid}}], None
        if geometry.is_empty or geometry.area <= 0:
            return [], 'empty_or_nonpolygon_geometry'
        scores = []
        for index in self.tree.query(geometry, predicate='intersects'):
            target = self.targets[int(index)]
            area = target['geometry'].area
            if area <= 0:
                continue
            intersection = geometry.intersection(target['geometry']).area
            source_share, target_share = intersection / geometry.area, intersection / area
            if min(source_share, target_share) >= .8:
                scores.append((target, source_share, target_share))
        if len(scores) != 1:
            return [], 'ambiguous_overlap' if len(scores) > 1 else 'no_unique_reciprocal_overlap_0.8'
        target, ss, ts = scores[0]
        return [{'gid': target['gid'], 'match': {'method': 'reciprocal_polygon_overlap',
                 'source_overlap': round(ss, 6), 'target_overlap': round(ts, 6),
                 'confidence': 'conservative_spatial_association_not_identity'}}], None


def text_metadata(value, allowed, field, status=None):
    text = value if present(value) else None
    return {field: text if allowed else None, field + '_withheld': bool(text and not allowed),
            field + '_publication_status': (status or ('private_review_only' if allowed else 'blocked_rights_unestablished')) if text else 'no_source_value',
            field + '_sha256': hashlib.sha256(str(text).encode('utf8')).hexdigest() if text else None,
            field + '_characters': len(text) if isinstance(text, str) else 0}


def edifici_record(p, allow_fulltext=False, status=None):
    return {'source_id': str(p['EDIFI_ID']), 'language': 'it', 'source_url': EDIFICI_URL,
            **text_metadata(p.get('description_piamonte'), allow_fulltext, 'text', status),
            'style': p.get('style'), 'typology': p.get('typology')}


def vprg_record(p, allow_fulltext=False, status=None):
    return {'source_id': str(p['OBJECTID']), 'language': 'it', 'source_url': VPRG_URL,
            **text_metadata(p.get('NOTE'), allow_fulltext, 'note', status),
            **text_metadata(p.get('STATO_ALT'), allow_fulltext, 'state', status),
            'sheet': p.get('SCHEDA') if present(p.get('SCHEDA')) else None,
            'url': safe_url(p.get('LINK_SCHEDA')), 'raw_url': p.get('LINK_SCHEDA'),
            'url_role': 'typology_sheet_not_individual_building_schematic'}


def build_evidence(edifici, vprg, targets, edifici_crs='EPSG:32633', vprg_crs='EPSG:4326', allow_fulltext=False, status=None):
    matcher = Matcher(targets)
    by_gid, catalogs = {}, {'descriptions': [], 'vprg': [], 'styles': []}
    unmatched = {key: [] for key in catalogs}
    methods = {key: Counter() for key in catalogs}
    for family, features, crs in [('edifici', edifici, edifici_crs), ('vprg', vprg, vprg_crs)]:
        seen = set()
        for feature in features:
            p = feature['properties']
            if family == 'edifici':
                keys = (['descriptions'] if present(p.get('description_piamonte')) else []) + (['styles'] if present(p.get('style')) or present(p.get('typology')) else [])
                record = edifici_record(p, allow_fulltext, status)
            else:
                keys = ['vprg'] if any(present(p.get(k)) for k in ['NOTE', 'STATO_ALT', 'SCHEDA', 'LINK_SCHEDA']) else []
                record = vprg_record(p, allow_fulltext, status)
            if not keys:
                continue
            if record['source_id'] in seen:
                raise ValueError(f'Duplicate {family} source ID: {record["source_id"]}')
            seen.add(record['source_id'])
            hits, reason = matcher.match(p, metric_geometry(feature['geometry'], crs))
            for key in keys:
                entry = dict(record)
                if key == 'styles':
                    entry = {k: record[k] for k in ['source_id', 'source_url', 'style', 'typology']}
                entry['matches'] = hits
                catalogs[key].append(entry)
                if not hits:
                    unmatched[key].append({'source_id': entry['source_id'], 'reason': reason})
                for hit in hits:
                    gid = str(hit['gid'])
                    target = by_gid.setdefault(gid, {'descriptions': [], 'vprg': [], 'styles': []})
                    target[key].append({k: v for k, v in entry.items() if k != 'matches'} | {'match': hit['match']})
                    methods[key][hit['match']['method']] += 1
    audit = {'render_buildings': len(targets), 'enriched_gids': len(by_gid)}
    for key in catalogs:
        audit[key + '_source_records'] = len(catalogs[key])
        audit[key + '_matched_records'] = len(catalogs[key]) - len(unmatched[key])
        audit[key + '_unmatched_records'] = len(unmatched[key])
        audit[key + '_gids'] = sum(bool(value[key]) for value in by_gid.values())
        audit[key + '_associations'] = sum(methods[key].values())
        audit[key + '_match_methods'] = dict(methods[key])
    return {'schema': 1, 'by_gid': dict(sorted(by_gid.items(), key=lambda item: int(item[0]))),
            'source_catalog': catalogs, 'unmatched': unmatched, 'audit': audit,
            'source': {'edifici2024': {'url': EDIFICI_URL, 'license': None, 'redistribution': 'unestablished',
                        'rights_evidence': 'Publisher repository has no root README or LICENSE; API license=null; 2024 directory has no README or LICENSE. Historical archive README warns rights not established.'},
                       'vprg': {'url': VPRG_URL, 'license': None, 'redistribution': 'unestablished_for_note_fulltext',
                        'rights_evidence': 'Root project README claims CC BY 4.0, but acquisition manifest supplies attribution only, not a license grant; publisher analysis page supplies study/non-prescriptive notice, no dataset license.'},
                       'fulltext_published': bool(allow_fulltext and status == 'published_user_authorized'),
                       'fulltext_included': allow_fulltext,
                       'fulltext_publication_status': (status or ('private_review_only' if allow_fulltext else 'blocked_rights_unestablished')),
                       'limitations': ['Italian source prose preserved verbatim; no translations or year extraction.', 'Links are literal LINK_SCHEDA values; SCHEDA is not expanded into an invented URL.', 'VPRG sheets are shared typology documents, not unique building survey schematics.', '0.8 reciprocal polygon overlap is a spatial association, not verified building identity.', 'No boundary edits, no nearest-neighbor matches, no source-order GIDs.', 'Publication of source prose is the operator\'s authorization, not a discovered license grant.']}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'web/data/building-evidence.json')
    parser.add_argument('--local-fulltext', action='store_true')
    parser.add_argument('--authorized-publication', action='store_true',
                        help="Operator has authorized publishing the verbatim source prose into web output.")
    args = parser.parse_args()
    if args.local_fulltext and not args.authorized_publication and args.output.resolve().is_relative_to((ROOT / 'web').resolve()):
        parser.error('Unknown source rights block fulltext in public web output; choose private --output')
    if args.authorized_publication and not args.local_fulltext:
        parser.error('--authorized-publication only changes the rights policy for --local-fulltext')
    status = 'published_user_authorized' if (args.local_fulltext and args.authorized_publication) else None
    read = lambda path: json.loads(path.read_text(encoding='utf8'))
    cfg = read(ROOT / 'web/data/venezia.json')
    attrs = (ROOT / 'web/data/attrs.bin').read_bytes()
    rendered_gids, pack_audit = rendered_pack_gids(cfg, ROOT / 'web/data')
    raw_attrs = gzip.decompress(attrs) if attrs[:2] == b'\x1f\x8b' else attrs
    if any(gid >= len(raw_attrs) // cfg['attrStride'] for gid in rendered_gids):
        raise ValueError('Pack GID outside attribute range')
    targets, render_audit = render_targets(read(ROOT / 'data/processed/buildings_dated_centro.geojson')['features'], attrs, cfg, read(ROOT / 'web/data/wiki.json'), rendered_gids=rendered_gids)
    render_audit['pack_validation'] = pack_audit
    edifici = read(ROOT / EDIFICI_REL)['features']
    vprg = read(ROOT / VPRG_REL)['features']
    evidence = build_evidence(edifici, vprg, targets, allow_fulltext=args.local_fulltext, status=status)
    evidence['audit']['render_mapping'] = render_audit
    evidence['source']['atlas_attrs_sha256'] = hashlib.sha256(attrs).hexdigest()
    evidence['source']['input_sha256'] = {rel: hashlib.sha256((ROOT / rel).read_bytes()).hexdigest() for rel in [EDIFICI_REL, VPRG_REL, 'data/processed/buildings_dated_centro.geojson', 'web/data/venezia.json']}
    evidence['source']['generated_at'] = datetime.now(timezone.utc).isoformat()
    evidence['audit']['raw_edifici_features'] = len(edifici)
    evidence['audit']['raw_vprg_features'] = len(vprg)
    evidence['audit']['vprg_link_source_records'] = sum(present(f['properties'].get('LINK_SCHEDA')) for f in vprg)
    evidence['audit']['vprg_note_source_records'] = sum(present(f['properties'].get('NOTE')) for f in vprg)
    evidence['audit']['vprg_state_source_records'] = sum(present(f['properties'].get('STATO_ALT')) for f in vprg)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(evidence, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf8')
    print(json.dumps({'output': str(args.output), 'audit': evidence['audit'],
                      'fulltext_published': bool(evidence['source']['fulltext_published']),
                      'fulltext_included': args.local_fulltext,
                      'fulltext_publication_status': evidence['source']['fulltext_publication_status']}, ensure_ascii=True))


if __name__ == '__main__':
    main()
