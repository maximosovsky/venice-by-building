# User-authorized ferry connector assumption — 2026-10-24

## Verified result

The recomputed closed San Marco–San Marco route visits the exact frozen metric midpoints of all 344 retained bridges. All four municipality-confirmed traghetti are routing-eligible, with walking-network-connected original OSM landings. The heuristic selects San Tomà and Giglio once each; Santa Sofia and Dogana are eligible but unused. Riding every ferry is not a requirement.

| Metric (m unless specified) | Previous ferry variant | Recomputed ferry variant | Change |
|---|---:|---:|---:|
| Total distance | 44648.028 | 44367.296 | -280.732 |
| Walking distance | 44568.477 | 44231.988 | -336.489 |
| Boat distance | 79.551 | 135.308 | +55.757 |
| Walking retrace | 4864.249 | 5087.772 | +223.523 |
| Midpoint arrival events | 353 | 355 | +2 |
| Repeated midpoint arrivals | 9 | 11 | +2 |
| Full physical bridge crossings | 212 | 220 | +8 |
| Repeated full crossings | 10 | 13 | +3 |
| Midpoint return events | 142 | 138 | -4 |

The shorter total route has **more walking retrace than the previous ferry variant**; optimization minimizes total network distance, not retrace as a separate objective. Compared with the unchanged walking-midpoint route (44834.288 m, retrace 5387.205 m), total is 466.992 m shorter and walking retrace is 299.433 m lower.

Actual ferry legs, zero-based route indices:
- San Tomà, OSM way 840231075: nodes 7840414908–5373219859, indices 3942–3943, 79.55133907162703 m.
- Santa Maria del Giglio, OSM way 216893103: nodes 2262139781–2262139780, indices 4212–4213, 55.75622793200259 m.

## Exact scope of the assumption

Audit marker: `user_authorized_ferry_connector_assumption`.

- Santa Sofia ferry way **216893104**, endpoints **2262139792–2262139795**: restore only original pier way **216893107**, nodes **2262139796–2262139795**, recording original `indoor=yes` as the access override. Source way has `highway=footway`, `man_made=pier`, `indoor=yes`; it may describe an indoor landing structure, but current accessibility is not verified. This is an original mapped node path, not an invented connector.
- Giglio ferry way **216893103**, nodes **2262139781–2262139780**: override only its source `foot=no`, with exact ferry ID, way ID, node list and authorization marker checks.
- San Tomà ferry way **840231075** remains eligible without an access override.
- Dogana ferry way **952112466** remains eligible via the existing original public pier prefix, way **292750093**, nodes **27178422–8812616140**; its strict island-clipping exception is retained and disclosed.

No unrelated `foot=no`, indoor, private-access or other pedestrian restrictions are relaxed. Ferry paths use complete original OSM ferry geometry. All ferry legs remain explicitly named Traghetto and exported with `mode=boat`, not walking across water or physical bridge crossings.

Official source retained: https://www.comune.venezia.it/it/content/traghetti-parada . Published timetable effective **2021-06-07**, successfully retrieved in the preceding audit at **2026-10-23T18:55:34+00:00**; not newly fetched here. Current service/access, departures, waits, weather and schedule feasibility remain unverified. No 24/7 or physical-bridge claim. `availability=conditional_unverified_today`, `schedule_feasible=false`; published holidays/early closing and Dogana's OSM 10:00 versus municipal 09:00 conflict remain disclosed.

## Computation and verification

- Strict TDD: initial scoped override/landing/all-four tests failed (3 failures); implemented scoped exceptions; targeted tests passed. A subsequent malformed Giglio node-path regression failed, then passed after restricting the override to its exact original node pair.
- Computed actual 345-target network metric closure using compiled SciPy sparse Dijkstra. NumPy multistart nearest-neighbour plus best-improvement 2-opt, 35 seeds/starts and 64 deterministic kicks, seed 4817103; 2615 aggregate 2-opt moves. No global optimum claim and no giant pure-Python all-pairs computation.
- Previous walking variant is read back, source/route validated and preserved **exactly as a JSON object**. Previous ferry order is an optimization seed; the independently reconstructed previous actual route is retained if a new candidate is worse. Here the new candidate won, `kept_previous_route=false`.
- Progress checkpoint: `C:/Users/1/AppData/Local/hermes/cache/scratch/venice-midpoint-progress-20261024_054316Z.pickle` (trusted internal pickle only).
- Final `python -m pytest tests/test_bridge_visits.py -q`: **17 passed in 43.30 s**. Includes the exact unchanged JavaScript `validateVisitRoutes` validator applied to the written JSON, all 344 original midpoint splits, closure at the original San Marco node, source PBF hash, independent original/split/exception adjacency, original pier source tags/node membership, all-four terminal reachability, exact ferry line membership, independently recomputed route/retrace/crossing statistics, contiguous mode-separated legs and both GPX tracks roundtrip.
- `git diff --check`: success (only normal Git CRLF normalization warnings). Full unrelated suite and browser/deployment checks are not claimed; parent handles deployment.

## Preservation and files

Owned modifications only: `pipeline/venice/s12_bridge_visits.py`, `tests/test_bridge_visits.py`, `web/data/bridge-visit-route.json`, `web/data/bridge-visit-route.gpx`, `web/data/traghetti.json`, and this new report. SciPy 1.18.1 installed into the active Python 3.14.7 tool environment because it was absent; generator dependency documented in its module header.

Original full-crossing artifacts remain untouched, with hashes matching the preceding report:
- `web/data/bridge-route.json`: SHA256 `3155592d7eaebe33942e1df6ed45fe127d8fbe6aba3210fc4bf3f26c52c420a5`.
- `web/data/bridge-route.gpx`: SHA256 `9b34e011c13e166f46cc60b1ac4979ba81f93a2a96811b85bc90cd9ed58442e3` (working copy already CRLF; equals HEAD after newline normalization).

Initial status contained only unrelated untracked `favicon.png`; it remains untouched. No UI edits, other pipeline edits, skill/memory writes, staging, commit or push.
