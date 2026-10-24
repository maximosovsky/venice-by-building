"""Publication projection exercises real prepared assets; no prepared file is modified."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / 'pipeline/venice/s17_enrichment_publication.py'
AUTHORIZATION = 'published_on_operator_authorization_rights_unestablished'


class PublicationTests(unittest.TestCase):
    def test_authorized_public_release_is_complete_and_source_is_unchanged(self):
        self.assertTrue(MODULE.exists(), 'missing publication gate')
        spec = importlib.util.spec_from_file_location('publication', MODULE)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        source = ROOT / 'web/data'
        before = {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in source.rglob('*') if p.is_file() and 'enrichment-public' not in p.parts}
        with tempfile.TemporaryDirectory(dir=os.environ.get('TMPDIR')) as tmp:
            out = Path(tmp) / 'public'
            report = module.publish(source, out)
            read = lambda name: json.loads((out / name).read_text(encoding='utf8'))
            h = read('history-registers.json')
            cached_chunks = {file: read(file) for file in h['chunk_manifest']}
            self.assertEqual(h['record_count'], 98613)
            self.assertEqual(h['published_record_count'], 98613)
            self.assertNotIn('withheld_record_count', h)
            self.assertEqual(h['publication']['status'], AUTHORIZATION)
            published_files = set()
            for dataset in h['datasets']:
                rows = []
                for file in dataset['files']:
                    published_files.add(file)
                    rows += read(file)['records']
                self.assertEqual(len(rows), dataset['record_count'])
                self.assertEqual(len({r['record_id'] for r in rows}), len(rows))
                self.assertEqual(dataset['publication']['published_record_count'], dataset['record_count'])
                self.assertEqual(dataset['publication']['status'], AUTHORIZATION)
                self.assertTrue(all(chunk['url'].startswith('data/enrichment-public/history-registers/') for chunk in dataset['chunks']))
            self.assertEqual(set(h['chunk_manifest']), published_files)
            self.assertEqual(len(h['datasets']), 5)
            for refs in h['by_gid'].values():
                for ref in refs:
                    self.assertIn(ref['file'], published_files)
                    self.assertEqual(cached_chunks[ref['file']]['records'][ref['offset']]['record_id'], ref['record_id'])
            self.assertEqual({p.relative_to(out).as_posix() for p in out.rglob('*.json')},
                             published_files | {'addresses.json', 'building-evidence.json', 'bridge-characteristics.json', 'history-registers.json', 'manifest.json'})
            b = read('bridge-characteristics.json')
            self.assertEqual(len(b['by_bridge_id']), 328)
            self.assertIn('geometry_local', json.dumps(b))
            self.assertIn('geometry_frame', b)
            self.assertTrue(all('material' in r for r in b['by_bridge_id'].values()))
            self.assertEqual(b['publication']['status'], AUTHORIZATION)
            self.assertTrue(b['publication']['geometry_available'])
            e = read('building-evidence.json')
            descriptions = e['source_catalog']['descriptions']
            self.assertEqual(len(descriptions), 929)
            self.assertEqual(sum(1 for r in descriptions if r.get('text')), 929)
            self.assertEqual(sum(len(r.get('text') or '') for r in descriptions), 266089)
            self.assertEqual(sum(bool(r.get('url')) for r in e['source_catalog']['vprg']), 5371)
            self.assertTrue(any(r.get('note') or r.get('state') for r in e['source_catalog']['vprg']))
            self.assertTrue(e['publication']['fulltext_published'])
            self.assertEqual(e['source']['fulltext_publication_status'], AUTHORIZATION)
            a = read('addresses.json')
            self.assertEqual(len(a['records']), 31623)
            self.assertIsNone(a['source']['license'])
            self.assertEqual(a['publication']['rights_status'], 'unknown')
            for data in (a, b, e, h):
                self.assertEqual(data['render_guard']['attrs_sha256'], hashlib.sha256((source/'attrs.bin').read_bytes()).hexdigest())
                self.assertEqual(data['render_guard']['config_sha256'], hashlib.sha256((source/'venezia.json').read_bytes()).hexdigest())
            self.assertIn('data/history-registers/**', report['deployment_excludes'])
            self.assertIn('data/building-evidence.json', report['deployment_excludes'])
            for file, desc in report['files'].items():
                self.assertEqual(hashlib.sha256((out/file).read_bytes()).hexdigest(), desc['sha256'])
            # Stale extra chunks cannot silently survive a regeneration.
            (out/'history-registers/register-1740-leak.json').write_text('{}')
            with self.assertRaisesRegex(ValueError, 'Unexpected'):
                module.publish(source, out)
        self.assertEqual(before, {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in before})


if __name__ == '__main__':
    unittest.main()