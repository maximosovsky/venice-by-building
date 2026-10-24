# Historical catalogue completion — 20261024_101804Z

## Deliverable

Index: `D:/100_star/venice/web/data/history-registers.json`.
Chunks: `web/data/history-registers/` (76 schema-1 JSON envelopes, each strictly below 1,900,000 bytes; largest 1,899,996 bytes).

| Canonical population | Records | Chunks |
| --- | ---: | ---: |
| 1740 register, edition 2026-05-12 | 32,361 | 32 |
| 1808 historical geometries (not all buildings) | 24,430 | 10 |
| 1808 textual register entries | 23,662 | 25 |
| 1808 disambiguated people | 12,277 | 4 |
| 1857 commercial CSV transcription | 5,883 | 5 |
| Total heterogeneous source records | 98,613 | 76 |

No boundary filter. Older 1740 edition (32,676 rows) excluded, not combined; derived 1808 aggregation (16,870 groups) excluded as repeated canonical content. Every written record compared against JSON-normalized source-derived records, including original attributes, source-row order, source identifiers and geometry. Original identifier types remain unchanged. Repeated source IDs receive distinct operational IDs; 402 duplicate-index excess rows in 1857 remain separate.

All 1740 points and 1808 geometries retained. 1857 has 5,858 geolocated rows and 25 null geometries. Textual entries and people remain unlocated rather than receiving invented points. Register/guide years are observation events, never building construction dates. The 1857 CSV is a partial transcription of the printed guide; exhaustion of the CSV does not establish full printed-guide coverage.

## Associations and render guard

Decoded actual emitted `attrs.bin` signed OSM IDs (including its `<f8` field), excluded nonbuilding source rows and ambiguous emitted IDs. 11,602 emitted attribute rows; 11,126 eligible current building geometries; five ambiguous emitted OSM IDs excluded. Unique metric polygon overlap requires at least 80% of current footprint and 50% of historical polygon. Associations are spatial evidence, explicitly `identity: false`.

272 current gids have 914 verified references: 272 historical geometries, 355 textual entries and 287 people. Geometry join keys are strings in the actual GeoJSON and integers in the textual table; compatible join comparison does not mutate source IDs. No unsupported current-building links invented for 1740 or 1857.

Index includes exact SHA-256/byte manifest for all 76 chunks plus a current-render guard:

- attrs SHA-256: `2ad58841d957045834c13ae65c6b4247b7cc8f1fb81699a1e9ee532e0da00143`
- config SHA-256: `e54fa76fa8e0a4f2e4469d98c899841e380a2c6dc357dcafacf9f1dabc13548c`

Producer checks current hashes and gid ranges before writing and after reading back. Mutation regression tests prove rejection of changed chunks and render attributes. Regenerate after any render/config change. **The existing UI does not enforce these hash guards at runtime**; that separate host integration is outside this worker's allowed scope.

## Compatibility and verification

Fixed existing-UI contract: dataset `chunks[].url` points to `data/history-registers/...`; chunk envelope is `{schema:1, records:[...]}`; record `id` and `sources` support existing deduplication and provenance. Canonical `files` and offset references remain available. Unchanged regenerated chunks are left untouched, enabling deterministic restart.

Commands actually exercised:

- `python -m pytest tests/test_historical_registers.py -q -k 'not real_sources'`: 12 passed.
- `python -m pytest tests/test_historical_registers.py::test_real_sources_canonical_census -q`: 1 passed.
- `python -m pipeline.venice.s16_historical_registers`: index written and read back; 98,613 records, 76 hashes/chunks and 914 references reconciled; current-render guard passed.
- Independent full record equality against source-derived JSON-normalized records: all five populations passed; on-disk chunk inventory exactly equals manifest.
- `node tests/historical_registers_browser.mjs`: real local records loaded through existing unmodified UI for all five datasets, selected-dataset lazy loading and original-text search passed, rights metadata displayed, no page errors. Isolated smoke server serves actual local files, not fixtures.

Full suite not run, as requested.

## Rights and exact blockers

1808 Zenodo record `10.5281/zenodo.20715172`, version 1.1, explicitly grants CC-BY-4.0. Creator attribution, DOI, license URL and evidence are retained per dataset/source.

1740 modern transcription/geolocation and 1857 modern CSV transcription/geolocation have no explicit redistribution grant in the inspected local README/repository archives. License IDs remain null; no ownership of rights or public-domain status is claimed. Their status is `blocked_pending_rights_confirmation` and `redistribution_allowed: false`. Entire index states `local_only_rights_blocked`, `public_release_allowed: false`, blocked datasets `register-1740` and `commercial-1857`.

**Do not deploy the complete web/data payload publicly until those rights are confirmed or blocked populations are excluded through a separately authorized release.** The existing host treats publication flags as transparency metadata, not an enforced deployment/access control. Full source rows were generated locally as requested; no deployment, commit or push was performed.

## Owned changes

Only `pipeline/venice/s16_historical_registers.py`, `tests/test_historical_registers.py`, new `tests/historical_registers_browser.mjs`, `web/data/history-registers.json`, the 76 historical chunks and this new timestamped document. Existing UI/application files, other workers' data, earlier reports, skills and memories were not modified.
