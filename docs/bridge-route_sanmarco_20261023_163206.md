# San Marco bridge circuit — verification report

Generated and verified against the existing island PBF on 2026-10-23 (UTC).

## Delivered route

- Start and finish: **Piazza San Marco**, original OSM pedestrian-square node **9645230124**, longitude **12.3390123**, latitude **45.4339208**. The independent PBF reader confirms membership in a named `highway=pedestrian` square way; no artificial snapped point is used.
- **352 retained physical bridge groups**, all fully crossed along their representative original-node paths.
- **426 crossings**, including **74 repeated crossings**; **88 odd-degree land components**.
- Walking distance: **61,003.120 m**; **5,805** exported track points.
- Earlier artifact: 371 bridges, 464 crossings, 93 repeats, 65,140.306 m. Changes: 19 immediately terminal bridges removed; 19 fewer repeats; 4,137.186 m less walking. Start location also changed, so this is an artifact comparison, not an isolated estimate of exclusion savings.
- Inventory reconciliation: **416 = 352 retained + 63 excluded + 1 unresolved crossing**. The 63 exclusions contain 19 new immediate-dead-end exclusions and 44 existing access/topology exclusions. Six unmatched deck candidates remain a separate unresolved population.

## Exact immediate-dead-end criterion

Build the public pedestrian graph from original adjacent OSM node pairs under the existing strict island clipping and conservative access policy. Remove all bridge-classified edges to obtain bridge-free land components. A **real bank** must have at least one outward bridge-free pedestrian edge at a bridge portal: isolated bridge-deck/interior stair nodes do not establish a bank.

Before any removal, count distinct accepted physical bridges incident at **all real portals**, not only the two selected representative endpoints. Exclude a selected complete crossing only if one of its two distinct real banks has bridge-free outward pedestrian access but **no other incident real bridge**. This is a single pass on the original incidence map. Do not reclassify newly exposed leaves or recursively prune bridge chains. Upstream bridges remain required. The synthetic chain regression and an independent reconstruction of land connectivity from the original PBF verify this distinction.

This is an OSM-topology cul-de-sac under the stated scope/access policy, not an on-site finding about actual closures or a claim that an entire named street is physically blocked. Untagged access remains assumed public. Exclusion reasons are human-readable in Russian, Italian and English.

### New exclusions: original bank evidence

Each row's sole incident real bridge is the bridge ID in that row. Node/edge counts refer to its bridge-free bank. Outward ways and portals are original OSM identifiers.

| Bridge ID | OSM name | Bank ID | Nodes / land edges | Portal nodes | Outward pedestrian way IDs |
|---|---|---:|---:|---|---|
| d555835400 | Ponte della Scuola Navale | 138 | 22 / 22 | 1279644669 | 946946513, 946946514, 946946515, 1086667108, 1086667110, 1086667111, 1086667112, 1086667113, 1086667115 |
| d556088894 | Ponte San Giovanni | 608 | 2 / 1 | 4441294600 | 446912133 |
| d556447173 | Ponte de la Panada | 98 | 6 / 5 | 1712554615 | 159154675, 159154703, 159154705 |
| d560266949 | Ponte dei Sartori | 119 | 65 / 73 | 3308313316 | 157242569, 157242574, 157294588, 157294589, 157294590, 157294592, 324078196, 324078197, 324078198, 324078202, 324078205, 324078207, 324078208 |
| d556119022 | Ponte Chiodo | 1000 | 3 / 2 | 8047514084 | 863806461 |
| d569490898 | Unnamed | 946 | 10 / 9 | 5476875859 | 531975136, 578414740 |
| d1232484227 | Unnamed | 154 | 3 / 2 | 1852942158 | 174639280 |
| d569414984 | Ponte Ca' Grimani | 1275 | 3 / 2 | 14002425213 | 492358290, 1537169524 |
| d555707815 | Ponte del l'Ogio | 162 | 14 / 14 | 5362368801 | 555709251, 969246391 |
| d559549197 | Ponte Diedo | 262 | 4 / 3 | 1904790249 | 180048073 |
| d560278015 | Ponte Maria Callas | 271 | 5 / 4 | 1913852760 | 180954113, 348244010, 348244011 |
| d780023286 | Ciclabile per Venezia | 302 | 3 / 2 | 2815919329 | 702919684 |
| d556030300 | Ponte del Fontego | 232 | 5 / 4 | 1856240219 | 174985245, 527940353, 527940354 |
| d556029640 | Ponte de la Corte Nova | 288 | 10 / 9 | 3297317911 | 181632925, 181633012, 181633013, 322937607, 1219073182, 1219073183 |
| d569488629 | Unnamed | 156 | 3 / 2 | 3336007238 | 326900023, 326900029 |
| d555811633 | Ponte Barbarigo | 277 | 9 / 8 | 1915133158 | 181061605, 181061611, 181061849, 469063864 |
| d527940372 | Fondamenta di Santa Giustina | 149 | 13 / 13 | 5131600043 | 1105182477 |
| d569474627 | Unnamed | 947 | 2 / 1 | 5174411976 | 533338877 |
| d1232707310 | Fondamenta Priuli dei Cavaletti | 290 | 6 / 5 | 8586221727 | 925181188, 925182089, 925182091 |

## Repeats and distance: what is proved

Matching is recomputed after exclusions. The retained representative required graph is connected; no additional inter-component connector is needed on this extract. No geographic snapping, ferry or fabricated connecting segment is added. All within-bank transfers use actual shortest bridge-free paths.

An independent unweighted shortest-path closure and minimum perfect matching of the 88 odd banks has cost **74**. The exported circuit attains that lower bound. Therefore **74 repeats is the minimum for this accepted undirected representative model**. It is not a proof over every alternative portal choice: 45 source groups have multi-portal/branched representations. No claim of a complete official bridge registry is made.

Walking ordering retains the same matched augmented crossing multiset. Arbitrary Euler expansion baseline: **95,720.860 m**. Nearest-portal Fleury ordering: **64,319.289 m**. Thirty improving reversals of closed subtrails reduce the complete closed walk to **61,003.120 m**. Self-loop crossings are not reversed because bank ID alone does not encode their orientation. This is deterministic local distance optimization, **not a globally shortest walking-distance proof**.

## Executed checks

Strict TDD: observed failing tests for missing one-pass dead-end detection, changed San Marco origin and real counts, missing closed-subtrail optimizer, and missing extended original-inventory proof before implementing those changes.

- `PYTHONPATH=pipeline python -m venice.s10_bridge_route`: real existing PBF generation completed; JSON and GPX exported.
- `python -m pytest tests/test_bridge_route.py -q`: **29 passed**.
- `python -m pytest tests/ -q`: **29 passed**.
- Independent PBF checks reconstruct bank connectivity, confirm exactly the 19 exclusions and outward way evidence, verify every route segment is an original public adjacent-node pair, and confirm original square-node membership.
- Coverage verifies each retained bridge's complete proof path in either orientation, visit/repeat counts, coordinate/node continuity, closure, geographic scope, local-coordinate frame and metric distance.
- GPX parses back to exactly the JSON coordinate sequence, including the same original start/end coordinates. Current production route data and GPX naming contain no stale previous-origin prose.
- `python tests/test_viewer_contract.py`: **168,265 checks, 0 failures**.
- `node tests/bridge_route_ui.mjs`: **10 passed, 1 browser rasterization test skipped**. UI ownership and browser/deployment verification remain with the parent agent.
- `node tests/i18n_coverage.mjs`: **1,272 checks, 0 missing translations**.
- `node tests/worker_smoke.mjs`: passed. Existing Node module-type/localStorage warnings do not prevent the tests.

## Artifacts and provenance

Modified owned files: `pipeline/venice/s10_bridge_route.py`, `tests/test_bridge_route.py`, `web/data/bridge-route.json`, `web/data/bridge-route.gpx`; this new timestamped report. The generator also refreshes its existing ignored `data/processed/bridge_route_audit.json` and compatible `bridge_route_proof.json`. Original proof fields remain intact, with original pre-exclusion bridge/portal evidence and dead-end exclusions added.

Source: existing `data/raw/osm/venezia_island.osm.pbf`; SHA-256 `5246d846ba5a0aeb169f9bf2fa6dc0e474da8345921c1ea4d776a34d91ce9969`. Main-island scope relation 4817103, including western transport/port areas and excluding external islands. Local acquisition date is 2026-10-22; the PBF header does not establish an OSM snapshot timestamp. OSM contributors, ODbL 1.0. Raw source unchanged. No UI file edits, commit, push, deployment or skills/memory writes were performed by this task.
