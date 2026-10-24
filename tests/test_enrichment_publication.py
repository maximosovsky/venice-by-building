"""Publication gate exercises real prepared assets; no restricted chunks leave web/data."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / 'pipeline/venice/s17_enrichment_publication.py'

class PublicationTests(unittest.TestCase):
    def test_public_release_is_sanitized_and_source_is_unchanged(self):
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
            self.assertEqual(h['published_record_count'], 60369)
            self.assertEqual(h['withheld_record_count'], 38244)
            allowed = set()
            for d in h['datasets']:
                if d['year'] != 1808:
                    self.assertEqual(d['files'], [])
                    self.assertEqual(d['chunks'], [])
                    self.assertEqual(d['publication']['status'], 'blocked_pending_rights_confirmation')
                    self.assertNotIn('records', d)
                else:
                    rows = []
                    for file in d['files']:
                        allowed.add(file)
                        rows += read(file)['records']
                    self.assertEqual(len(rows), d['record_count'])
                    self.assertEqual(len({r['record_id'] for r in rows}), len(rows))
            self.assertEqual(set(h['chunk_manifest']), allowed)
            for refs in h['by_gid'].values():
                for ref in refs:
                    self.assertIn(ref['file'], allowed)
                    self.assertEqual(cached_chunks[ref['file']]['records'][ref['offset']]['record_id'], ref['record_id'])
            self.assertEqual(set(p.relative_to(out).as_posix() for p in out.rglob('*.json')), allowed | {'addresses.json','building-evidence.json','bridge-characteristics.json','history-registers.json','manifest.json'})
            b = read('bridge-characteristics.json')
            self.assertEqual(len(b['by_bridge_id']), 328)
            self.assertNotIn('geometry_local', json.dumps(b))
            self.assertNotIn('geometry_source', json.dumps(b))
            self.assertTrue(all(r['geometry_available'] is False and 'material' in r for r in b['by_bridge_id'].values()))
            e = read('building-evidence.json')
            self.assertEqual(len(e['source_catalog']['descriptions']), 929)
            self.assertEqual(sum(bool(r.get('url')) for r in e['source_catalog']['vprg']), 5371)
            for collection in [e['source_catalog'], *e['by_gid'].values()]:
                for family, records in collection.items():
                    for r in records:
                        for field in ('text','note','state'):
                            if field in r:
                                self.assertIsNone(r[field])
            a = read('addresses.json')
            self.assertEqual(len(a['records']), 31623)
            self.assertIsNone(a['source']['license'])
            self.assertEqual(a['publication']['rights_status'], 'unknown')
            for data in (a,b,e,h):
                self.assertEqual(data['render_guard']['attrs_sha256'], hashlib.sha256((source/'attrs.bin').read_bytes()).hexdigest())
                self.assertEqual(data['render_guard']['config_sha256'], hashlib.sha256((source/'venezia.json').read_bytes()).hexdigest())
            self.assertIn('data/history-registers/**', report['deployment_excludes'])
            for file, desc in report['files'].items():
                self.assertEqual(hashlib.sha256((out/file).read_bytes()).hexdigest(), desc['sha256'])
            # A future local fulltext review must still be stripped, never trusted as public.
            private = {'text':'private text','text_characters':12,'text_withheld':False,'note':'private note','state':'private state'}
            sanitized = module.sanitize_prose(private)
            self.assertIsNone(sanitized['text'])
            self.assertIsNone(sanitized['note'])
            self.assertIsNone(sanitized['state'])
            # Stale extra chunks cannot silently survive a regeneration.
            (out/'history-registers/register-1740-leak.json').write_text('{}')
            with self.assertRaisesRegex(ValueError, 'Unexpected'):
                module.publish(source, out)
        self.assertEqual(before, {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in before})

if __name__ == '__main__':
    unittest.main()
