"""Generate the deployment-facing enrichment projection from the prepared sidecars.

Run: python -m pipeline.venice.s17_enrichment_publication
IMPORTANT: exclude manifest.deployment_excludes from local Vercel uploads. Merely
changing UI URLs does not stop a static host from serving prepared private files.
Commit/deploy ONLY enrichment-public, not the original enrichment JSON/chunks.

The rights review found no explicit redistribution grant for the Edifici 2024 prose,
the VPRG notes, the municipal bridge geometry, the 1740 register and the 1857
directory. The operator has explicitly authorized publishing them anyway; every
projection therefore carries an explicit policy record stating that publication is
the operator's authorization and not a discovered license. Nothing here claims a
rights grant the sources do not contain.
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
AUTHORIZATION = 'published_on_operator_authorization_rights_unestablished'


def read(path):
    return json.loads(path.read_text(encoding='utf8'))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


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
    if a.get('publication', {}).get('public_release_allowed') is False:
        raise ValueError('Address producer explicitly blocks release')
    a['publication'] = {'status': AUTHORIZATION, 'rights_status': 'unknown', 'license': None,
                        'policy': 'Operator-authorized address-number and coordinate facts; not a verified license grant.'}
    a['record_count'] = len(a['records'])
    e = assets['building-evidence.json']
    descriptions = e['source_catalog']['descriptions']
    e['source'].update(fulltext_published=True, fulltext_included=True,
                       fulltext_publication_status=AUTHORIZATION)
    e['publication'] = {'status': AUTHORIZATION, 'rights_status': 'unknown',
                        'description_records': len(descriptions),
                        'description_records_with_text': sum(1 for r in descriptions if r.get('text')),
                        'description_characters': sum(len(r.get('text') or '') for r in descriptions),
                        'vprg_records': len(e['source_catalog']['vprg']),
                        'vprg_records_with_note_or_state': sum(1 for r in e['source_catalog']['vprg'] if r.get('note') or r.get('state')),
                        'vprg_link_records': sum(bool(r.get('url')) for r in e['source_catalog']['vprg']),
                        'fulltext_published': True}
    b = assets['bridge-characteristics.json']
    b['publication'] = {**b.get('publication', {}), 'status': AUTHORIZATION, 'rights_status': 'unknown',
                        'geometry_available': True,
                        'policy': 'Operator-authorized municipal material, purpose, type, dimensions and footprint geometry. Dimensions are derived footprint envelopes, not surveyed measurements.'}
    h = assets['history-registers.json']
    chunks, paths = {}, {}
    published = 0
    for d in h['datasets']:
        files, rows = [], []
        for file in d['files']:
            path = (source/file).resolve()
            if not path.is_relative_to(source/'history-registers'):
                raise ValueError('Unsafe chunk path')
            if digest(path) != h['chunk_manifest'][file]['sha256']:
                raise ValueError('Source chunk hash mismatch')
            payload = path.read_bytes()
            if json.loads(payload).get('schema') != 1:
                raise ValueError('Unsupported chunk schema')
            relative = 'history-registers/' + path.name
            if relative in chunks:
                raise ValueError('Duplicate chunk filename')
            chunks[relative] = payload
            paths[file] = relative
            files.append(relative)
            rows.extend(json.loads(payload)['records'])
        if len(rows) != d['record_count'] or len({r['record_id'] for r in rows}) != len(rows):
            raise ValueError('Chunk counts/IDs mismatch')
        published += len(rows)
        d['files'] = files
        d['chunks'] = [{'url': 'data/enrichment-public/' + file} for file in files]
        d['publication'] = {'status': AUTHORIZATION, 'published_record_count': len(rows), 'rights_status': 'unknown',
                            'license': d.get('license'),
                            'modifications': 'Canonical source normalized and chunked; current-render spatial associations added, not building identity.'}
    h['by_gid'] = {gid: [{**ref, 'file': paths[ref['file']]} for ref in refs] for gid, refs in h['by_gid'].items()}
    h['chunk_manifest'] = {file: {'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)} for file, payload in chunks.items()}
    h['published_record_count'] = published
    h['publication'] = {'status': AUTHORIZATION, 'public_release_allowed': True, 'published_record_count': published,
                        'datasets': {d['id']: {'record_count': d['record_count'],
                                               'published_record_count': d['publication']['published_record_count'],
                                               'rights_status': 'unknown', 'license': d.get('license')} for d in h['datasets']},
                        'policy': 'Operator-authorized publication of every source population; no license grant is claimed.'}
    payloads = {name: json.dumps(data, ensure_ascii=False, allow_nan=False, separators=(',', ':')).encode('utf8') for name, data in assets.items()}
    payloads.update(chunks)
    expected = set(payloads) | {'manifest.json'}
    if output.exists():
        unexpected = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()} - expected
        if unexpected:
            raise ValueError('Unexpected publication files: ' + ', '.join(sorted(unexpected)))
    report = {'schema': 1, 'deployment_excludes': EXCLUDES,
              'deployment_warning': 'Local uploads must exclude prepared files above; UI URL redirection alone is not a release gate. Parent owns Vercel ignore configuration.',
              'files': {file: {'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)} for file, payload in payloads.items()},
              'historical_publication': h['publication'], 'addresses': a['publication'], 'evidence': e['publication'], 'bridges': b['publication']}
    payloads['manifest.json'] = json.dumps(report, ensure_ascii=False, indent=2).encode('utf8')
    for file, payload in payloads.items():
        target = output/file
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    # Verify exact generated inventory, hashes and references before declaring ready.
    if {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()} != expected:
        raise ValueError('Published file inventory mismatch')
    for file, desc in report['files'].items():
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
    print(json.dumps({k: v for k, v in report.items() if k != 'files'}, ensure_ascii=False, indent=2))
    print('Verified deployment files:', len(report['files']) + 1)


if __name__ == '__main__':
    main()