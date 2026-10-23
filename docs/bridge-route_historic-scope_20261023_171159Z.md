# Historic pedestrian Venice bridge route — 2026-10-23T17:11:59.627143+00:00

## Result
- 344 retained physical crossings; 74 repeated crossings; 418 crossing events; 61647.239 metres; 5781 original-node points.
- Closed Piazza San Marco circuit, start node 9645230124. 86 odd land components. Exact matching minimizes repeated crossings only in the selected crossing model, not global walking length or all alternative branched paths.
- 71 exclusions: disconnected_from_start: 3; access:private: 40; access:no: 1; immediate_pedestrian_dead_end: 19; peripheral_port_transport: 8.
- 10 spatial/category matches: 8 newly removed previously retained crossings; Ciclabile per Venezia was already among the frozen 19 immediate deadends; d1392199150 was already private. No duplicate exclusion accounting.

## Reproducible spatial/category criterion
Exclude a physical bridge group if any original crossing segment overlaps mapped Tronchetto/Stazione Marittima islet or mapped mainland-approach bridge deck by >0.5 metric metres. Also exclude explicitly mapped pier or underground parking bridge ramps within 100m of the mapped port islet; this is a contextual category rule, not a buffered historic-centre boundary. No age or longitude filter. Freeze original one-pass immediate-deadend exclusions before applying this scope. Remove all original edges of excluded groups from walking graph.

The 100m contextual distance is an explicitly chosen proximity limit for **tagged pier or underground parking ramp only**, not a purported administrative zone and not an exclusion of every nearby pedestrian bridge. Actual candidates: port-side metal pier w176184207 and mainland cycleway/underground-parking approach w898914810. The ordinary nearby crossings Ponte di Sant’Andrea and w615792881 remain. So do Santa Marta, Tabacchi and Valeria Solesin. No construction-date or coordinate-axis cutoff is used.

The retained landmark tests require Ponte della Costituzione (modern), Scalzi, Rialto, Accademia and modern Valeria Solesin. Original 19 immediate deadend IDs are independently reconstructed from the original PBF before scope filtering; leaves are not recalculated and chains are not recursively pruned. Scope removes original edges rather than relabeling them as free land transfers.

## Source evidence
Source file: `data/routes/bridge-route-scope.geojson`; immutable original coordinates, node IDs and tags copied from local island PBF. OSM is auditable mapped evidence, **not an authoritative municipal historic-centre boundary**. Stazione Marittima’s source QID repeats Tronchetto’s QID; classification uses its actual name, geometry and transport evidence, not that QID.
PBF SHA-256: `5246d846ba5a0aeb169f9bf2fa6dc0e474da8345921c1ea4d776a34d91ce9969`.
Source URL: https://download.openstreetmap.fr/extracts/europe/italy/veneto.osm.pbf. OpenStreetMap contributors, ODbL 1.0. Acquisition 2026-10-22; PBF header lacks snapshot timestamp.

| OSM way | Name | Evidence category |
|---|---|---|
| 171875325 | Tronchetto | islet |
| 306834563 | Stazione Marittima | islet |
| 583724426 | Ponte della Libertà | bridge |
| 780023286 |  | bridge |

Additional original context: People Mover nodes 562720335 (Tronchetto) and 5217708637 (Marittima cruise terminal); port basin way 306834561 (water=harbour); Tronchetto parking way 23243985. These corroborate category but do not generate or enlarge zone polygons.

## Newly excluded bridges
| ID | Name | longitude | latitude | Zone evidence |
|---|---|---:|---:|---|
| d583724426 | Ponte della Libertà | 12.3168519 | 45.4395819 | way/583724426 |
| w161639264 | Ponte della Libertà | 12.3157665 | 45.4406988 | way/306834563 |
| d569427399 | OSM bridge d569427399 | 12.3145631 | 45.4377366 | way/306834563 |
| w176184207 | OSM bridge w176184207 | 12.3114116 | 45.4336691 | way/306834563 |
| w888348569 | OSM bridge w888348569 | 12.3156810 | 45.4400550 | way/306834563 |
| w898631459 | OSM bridge w898631459 | 12.3153225 | 45.4393279 | way/306834563 |
| w898914789 | OSM bridge w898914789 | 12.3152893 | 45.4394857 | way/306834563 |
| w898914810 | OSM bridge w898914810 | 12.3176060 | 45.4391447 | way/306834563 |

All 71 exclusions include source IDs/tags, coordinates and ru/it/en human-readable explanations in JSON. All 10 scope matches carry those explanations, including overlaps with prior exclusions.

## Geometry contract
- `deck_local`: polygon → rings → [x,z]; 341 retained bridges have original mapped deck polygons; 3 have no deck (`[]`). No buffers or invented footprints.
- `path_local`: every original node of the selected complete crossing, for every retained bridge. Same EPSG:32633 origin at 12.3387,45.4340 and negative northing z as the existing viewer.

## Unresolved candidates and limitations
10 audit details: six unmatched decks, one no-complete-crossing candidate and three disconnected groups. The disconnected groups are also in exclusions and must not be double-counted. The physical inventory reconciles 416 = 344 retained + 71 excluded + 1 ambiguous crossing; six unmatched decks are outside those highway groups.
- d138803225 — Ponte dei Sospiri: unmatched_deck
- d555802970 — Ponte Compagnia della Vela: unmatched_deck
- d555841273 — unnamed: unmatched_deck
- d569427400 — unnamed: unmatched_deck
- d1232060432 — unnamed: unmatched_deck
- d1232707316 — unnamed: unmatched_deck
- w44523054 — Ferrovia: no_complete_crossing
- d556029873 — unnamed: disconnected
- w597743874 — Ciclabile Mestre - Venezia: disconnected
- d1232707313 — unnamed: disconnected

Ferrovia remains unresolved; no crossing was invented. Access without explicit tags uses the documented public default; current closures are unverified. Branch portals still use the existing audited representative full-path model.

## Verification
- Strict RED before implementation: tests failed for missing scope exclusion, missing deck/path geometry, missing removed-edge evidence; later missing exclusion metadata/human explanations also reproduced before code changes.
- `PYTHONPATH=pipeline python -m venice.s10_bridge_route`: actual JSON/GPX generated and GPX round-trip exact.
- `python -m pytest tests/ -q`: **34 passed** before parallel church tests landed. Final rerun: **34 passed, 8 failed**; all failures are the other agent’s new `test_church_route.py` RED tests for missing `venice.s11_church_route`, unrelated to this bridge change. Bridge tests independently reopen PBF for original walking-node edges/access, complete selected crossing paths, deck vertices, scope polygons, deadend incidence and route coverage; independent unweighted matching confirms 74 repeats and 86 odd banks.
- Additional independent PBF check: 84 forbidden original port/transport node-pair geometries, **0 overlaps** with exported route segments.
- `node tests/i18n_coverage.mjs`: 1,272 checks, 0 untranslated; worker smoke passed. Existing Node module-type warnings only.
- Distance-order baseline 95364.166m; selected 61647.239m on the same augmented crossing multiset. No global distance optimum claimed.

## Output checksums
- `web/data/bridge-route.json` SHA-256 `3155592d7eaebe33942e1df6ed45fe127d8fbe6aba3210fc4bf3f26c52c420a5`
- `web/data/bridge-route.gpx` SHA-256 `9b34e011c13e166f46cc60b1ac4979ba81f93a2a96811b85bc90cd9ed58442e3`
- `data/routes/bridge-route-scope.geojson` SHA-256 `9a30244a0eec5e6e078a02cfdccdb7e2b17adbbf75cec9219a54392afde62b6d`
