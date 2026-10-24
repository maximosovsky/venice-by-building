"""Generate only deployment-facing enrichment projections, never alter prepared data.

Run: python -m pipeline.venice.s17_enrichment_publication
IMPORTANT: exclude manifest.deployment_excludes from local Vercel uploads. Merely
changing UI URLs does not stop a static host from serving prepared private files.
Commit/deploy ONLY enrichment-public, not the original enrichment JSON/chunks.
Unknown licenses remain unknown: factual projections are user-authorized policy,
not a newly discovered license grant. Producer-blocked prose/geometry is withheld.
"""
import argparse
from copy import deepcopy
import gzip
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NAMES = ('addresses.json', 'building-evidence.json', 'bridge-characteristics.json', 'history-registers.json')
EXCLUDES = ['data/' + n for n in NAMES] + ['data/history-registers/**']

def read(path):
    return json.loads(path.read_text(encoding='utf8'))

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def sanitize_prose(value):
    """Strip fulltext even if a future private producer mistakenly includes it."""
    if isinstance(value, list):
        return [sanitize_prose(v) for v in value]
    if not isinstance(value, dict):
        return value
    result = {k: sanitize_prose(v) for k, v in value.items()}
    for field in ('text', 'description', 'description_it', 'text_it', 'note', 'state'):
        if field in result:
            present = bool(result[field]) or bool(result.get(field + '_characters')) or result.get(field + '_withheld', False)
            result[field] = None
            result[field + '_withheld'] = present
            result[field + '_publication_status'] = 'blocked_rights_unestablished' if present else 'no_source_value'
    return result

def render_guard(source, data):
    s = data.get('source', {})
    g = data.get('render_guard', {})
    attrs = g.get('attrs_sha256') or s.get('atlas_attrs_sha256') or s.get('attrs_sha256')
    config = g.get('config_sha256') or s.get('atlas_config_sha256') or s.get('config_sha256') or s.get('input_sha256', {}).get('web/data/venezia.json')
    if not attrs or not config or attrs != digest(source/'attrs.bin') or config != digest(source/'venezia.json'):
        raise ValueError('Producer render hashes missing or stale; regenerate enrichment')
    raw = (source/'attrs.bin').read_bytes()
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    count = len(raw) // read(source/'venezia.json')['attrStride']
    if any(not str(gid).isdigit() or not 0 <= int(gid) < count for gid in data.get('by_gid', {})):
        raise ValueError('GID outside rendered attributes')
    return {'attrs_sha256': attrs, 'config_sha256': config, 'attribute_records': count,
            'policy': 'WebCrypto must verify current attrs/config before any gid association.'}

def publish(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if output == source or source.is_relative_to(output):
        raise ValueError('Output must be separate from prepared source')
    assets = {name: deepcopy(read(source/name)) for name in NAMES}
    for data in assets.values():
        data['render_guard'] = render_guard(source, data)
    a = assets['addresses.json']
    # Producer has unknown license, not a hard blocked publication flag.
    if a.get('publication', {}).get('public_release_allowed') is False:
        raise ValueError('Address producer explicitly blocks release')
    a['publication'] = {'status': 'factual_projection', 'rights_status': 'unknown',
                        'license': None, 'policy': 'User-authorized address-number and coordinate facts; not a verified license grant.'}
    a['record_count'] = len(a['records'])
    e = assets['building-evidence.json'] = sanitize_prose(assets['building-evidence.json'])
    e['source'].update(fulltext_published=False, fulltext_included=False, fulltext_publication_status='blocked_rights_unestablished')
    e['publication'] = {'status': 'facts_links_and_withheld_text_metadata', 'rights_status': 'unknown',
                        'description_metadata_records': len(e['source_catalog']['descriptions']),
                        'vprg_link_records': sum(bool(r.get('url')) for r in e['source_catalog']['vprg']),
                        'fulltext_published': False}
    b = assets['bridge-characteristics.json']
    fields = {'municipal_ids','material','purpose','type','length_m','width_m','height_m','dimensions_method','match_evidence','source'}
    b['by_bridge_id'] = {key: {k:v for k,v in row.items() if k in fields} | {'geometry_available': False}
                         for key, row in b['by_bridge_id'].items()}
    b.pop('geometry_frame', None)
    b['publication'] = {**b['publication'], 'status': 'factual_characteristics_only', 'rights_status': 'unknown',
                        'geometry_available': False, 'policy': 'No municipal raw geometry is deployed. Dimensions are derived footprint envelopes, not surveyed measurements.'}
    h = assets['history-registers.json']
    allowed = set()
    chunks = {}
    blocked = []
    published = withheld = 0
    paths = {}
    for d in h['datasets']:
        if d.get('license', {}).get('redistribution_allowed') is not True:
            blocked.append(d['id'])
            withheld += d['record_count']
            d['files'], d['chunks'] = [], []
            d.pop('records', None)
            d['publication'] = {'status': 'blocked_pending_rights_confirmation', 'published_record_count': 0}
            continue
        allowed.add(d['id'])
        files = []
        rows = []
        for file in d['files']:
            path = (source/file).resolve()
            if not path.is_relative_to(source/'history-registers'):
                raise ValueError('Unsafe chunk path')
            if digest(path) != h['chunk_manifest'][file]['sha256']:
                raise ValueError('Source chunk hash mismatch')
            payload = path.read_bytes()
            envelope = json.loads(payload)
            if envelope.get('schema') != 1:
                raise ValueError('Unsupported chunk schema')
            relative = 'history-registers/' + path.name
            if relative in chunks:
                raise ValueError('Duplicate chunk filename')
            chunks[relative] = payload
            paths[file] = relative
            files.append(relative)
            rows.extend(envelope['records'])
        if len(rows) != d['record_count'] or len({r['record_id'] for r in rows}) != len(rows):
            raise ValueError('Licensed chunk counts/IDs mismatch')
        published += len(rows)
        d['files'] = files
        d['chunks'] = [{'url': 'data/enrichment-public/' + file} for file in files]
        d['publication'] = {'status': 'licensed_with_attribution', 'published_record_count': len(rows),
                            'modifications': 'Canonical source normalized and chunked; current-render spatial associations added, not building identity.'}
    h['by_gid'] = {gid: [{**ref, 'file': paths[ref['file']]} for ref in refs if ref['dataset_id'] in allowed]
                   for gid, refs in h['by_gid'].items() if any(ref['dataset_id'] in allowed for ref in refs)}
    h['chunk_manifest'] = {file: {'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)} for file,payload in chunks.items()}
    h['published_record_count'], h['withheld_record_count'] = published, withheld
    h['publication'] = {'status': 'partial_release', 'blocked_datasets': blocked, 'public_release_allowed': True,
                        'published_record_count': published, 'withheld_record_count': withheld,
                        'policy': 'All source populations remain in catalog; only explicitly licensed records are downloadable.'}
    payloads = {name: json.dumps(data, ensure_ascii=False, allow_nan=False, separators=(',', ':')).encode('utf8') for name,data in assets.items()}
    payloads.update(chunks)
    expected = set(payloads) | {'manifest.json'}
    if output.exists():
        unexpected = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()} - expected
        if unexpected:
            raise ValueError('Unexpected publication files: ' + ', '.join(sorted(unexpected)))
    report = {'schema': 1, 'deployment_excludes': EXCLUDES,
              'deployment_warning': 'Local uploads must exclude prepared files above; UI URL redirection alone is not a release gate. Parent owns Vercel ignore configuration.',
              'files': {file: {'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)} for file,payload in payloads.items()},
              'historical_publication': h['publication'], 'addresses': a['publication'], 'evidence': e['publication'], 'bridges': b['publication']}
    payloads['manifest.json'] = json.dumps(report, ensure_ascii=False, indent=2).encode('utf8')
    for file,payload in payloads.items():
        target = output/file
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    # Verify exact generated inventory, hashes and references before declaring ready.
    if {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()} != expected:
        raise ValueError('Published file inventory mismatch')
    for file,desc in report['files'].items():
        if digest(output/file) != desc['sha256']:
            raise ValueError('Published hash mismatch')
    verified_chunks = {file: read(output/file)['records'] for file in chunks}
    for refs in read(output/'history-registers.json')['by_gid'].values():
        for ref in refs:
            if verified_chunks[ref['file']][ref['offset']]['record_id'] != ref['record_id']:
                raise ValueError('Broken published reference')
    return report

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT/'web/data')
    parser.add_argument('--output', type=Path, default=ROOT/'web/data/enrichment-public')
    args = parser.parse_args()
    report = publish(args.source, args.output)
    print(json.dumps({k:v for k,v in report.items() if k != 'files'}, ensure_ascii=False, indent=2))
    print('Verified deployment files:', len(report['files']) + 1)

if __name__ == '__main__':
    main()
