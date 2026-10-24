# Mandatory ferry through-connection correction

Supersedes `bridge-midpoints-mandatory-traghetto-20261024_070355Z.md`; old immediate-return report retained untouched as history.

## Actual result

Real regenerated JSON/GPX: 2026-10-24T07:08:27.089841+00:00. Closed at San Marco source node `9645230124`, all 346 original exact midpoints, 4939 route points.

**44,575.796 m total; 44,527.882 m walking; 47.914 m boat.** One complete Santa Sofia crossing, source OSM way `216893104`, indices 1602–1603, `[2262139792, 2262139795]`, actual length 47.91427555775306 m. No reverse boat leg exists. No opposite-return pairs; no void immediate crossing-and-return.

Immediately surrounding bridge visits: Ponte de l'Olio `d449268018` at index 1554, then Ponte Priuli `d560267102` at index 1621. Distinct bridges. Selected seeded target replacement: `d555720704` → `d560267102` (midpoint nodes -31 → -48).

Walking variant is unchanged 43,936.383 m; ferry variant is 639.413 m longer, not a saving claim.

| Metric | Exported value |
|---|---:|
| walk_distance_m | 44527.882 |
| boat_distance_m | 47.914 |
| total_distance_m | 44575.796 |
| repeat_distance_m | 5172.601 |
| walk_repeat_distance_m | 5172.601 |
| boat_repeat_distance_m | 0 |
| bridge_full_crossings | 212 |
| bridge_full_crossing_repeats | 11 |
| bridge_visit_reversals | 146 |
| midpoint_visit_events | 356 |
| midpoint_repeat_visits | 10 |
| bridges_visited | 346 |
| unique_graph_edges | 4202 |
| repeated_edge_traversals | 736 |
| total_repeat_distance_m | 5172.601 |

## Search

Eight candidates: each eligible actual OSM ferry in both directions. For each, choose the least-cost existing bridge-to-bridge transfer replacement: pedestrian distance first target → source landing + complete boat geometry + pedestrian distance destination landing → next distinct bridge target. Exclude San Marco gaps. No optional terminal nodes or boat spurs. Walking approaches cannot undo the boat.

Bounded 200-move best-improvement 2-opt locks the selected bridge-target connection; reversal reverses the whole connection. Expand every candidate and validate source boats and cyclic return separation AFTER search. Other transfers pedestrian-only. Select minimum actual candidate distance; best found, not global optimum. All eight candidates retained exactly one complete boat crossing and zero reverse pairs.

| Ferry | Directed landing nodes | Connected seeded bridge targets | Actual candidate m | 2-opt moves |
|---|---|---|---:|---:|
| santa_sofia | [2262139792, 2262139795] | ['d555720704', 'd560267102'] | 44575.795899 | 0 |
| santa_sofia | [2262139795, 2262139792] | ['d556128742', 'w121674081'] | 44844.643487 | 0 |
| san_toma | [7840414908, 5373219859] | ['d467824851', 'd556130585'] | 45348.563155 | 0 |
| san_toma | [5373219859, 7840414908] | ['d557098978', 'd559354598'] | 45321.646518 | 0 |
| giglio | [2262139781, 2262139780] | ['d555813806', 'd489861188'] | 45000.623834 | 0 |
| giglio | [2262139780, 2262139781] | ['d556463494', 'd556239027'] | 44722.803285 | 0 |
| dogana | [8812616140, 13504465655] | ['d556458403', 'd556450945'] | 45630.940004 | 0 |
| dogana | [13504465655, 8812616140] | ['d555804524', 'd555802969'] | 45368.278014 | 0 |

## TDD and verification

- RED before production edits: existing Santa Sofia immediate-return artifact failed new midpoint-separation regression with an empty intersection. Pier-walk audit regression failed because audit absent; solver regression failed because connected bridge-target evidence absent.
- GREEN after actual regeneration: `python -m pytest tests/test_bridge_visits.py -q` → **26 passed in 42.66 s**.
- Includes independent actual original PBF/split adjacency, source ferry geometry/approaches, exact 346 midpoint definitions, San Marco closure, projection and independent full/half crossing and repeated-distance recomputation.
- Includes ordered boat events/legs, GPX per-track/per-leg point equality and unchanged JavaScript `validateVisitRoutes` on actual written wrapper.
- Synthetic audit rejects walking-at-pier reverse crossing, accepts reverse after midpoint visit. Actual cyclic event regression rejects opposite-return without midpoint. Export assertions cover distinct surrounding bridge visits, all eight candidate target pairs and minimum selected cost.
- Existing distance assertion now permits 0.001 m serialization rounding: unrounded 44,575.795899290744 m rounds upward to 44,575.796 m.
- `git diff --check` passes; generated GPX has Git CRLF normalization warning.

## Preservation and ownership

Frozen walking compact JSON SHA-256 `8c295882d3a4e69056b7368e7e5cf900eac6c9587cd1151b7d333c7326f64f00`; walking GPX track equals HEAD. Original full-crossing JSON and frontend equal HEAD bytes. Original full-crossing GPX and ferry catalogue equal HEAD after CRLF normalization; neither written in this task. Existing Windows checkout line endings explain raw differences.

Stage no longer writes `traghetti.json`, verifying frozen catalogue equality instead.

- New visit JSON SHA-256: `def10e9c76131a723ad24f75225212981f07e9f23d0558d0e3a41cf28fe4617b`.
- New visit GPX SHA-256: `99ff85eae7b4b5ae4634e12a746554e6f99bfa68a3f5bd03e5110144ffb97066`.

Edited only owned s12 script/tests, visit JSON/GPX and this new report. Existing old report/favicon untouched. No UI edits, commit, push, memory or skill writes. Target suite only, no full unrelated suite.

Access assumptions remain original Santa Sofia indoor pier, Giglio foot=no boat, Dogana boundary pier prefix. All four eligible. Operation/access today, waiting times and one-day feasibility unverified.
