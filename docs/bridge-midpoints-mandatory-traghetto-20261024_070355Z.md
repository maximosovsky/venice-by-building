# Mandatory Traghetto midpoint route — 2026-10-24 07:03:55 UTC

## Result

Regenerated the actual additive JSON and two-track GPX. `traghetto_midpoints` covers all 346 frozen bridge midpoints and closes at San Marco, source node `9645230124`. The ferry variant has 4,876 route points and `audit.verified.mandatory_ferry = true`.

| Metric | Actual exported value |
|---|---:|
| Total distance | 44,135.651 m |
| Walking distance | 44,039.823 m |
| Boat distance | 95.829 m |
| Walking repeated-edge distance (viewer repeat distance) | 4,966.611 m |
| Boat repeated-edge distance | 47.914 m |
| Total repeated-edge distance | 5,014.526 m |
| Unique bridge midpoints visited | 346 |
| Midpoint arrivals / repeat arrivals | 354 / 8 |
| Full bridge crossings / repeat full crossings | 210 / 9 |
| Half-bridge visit reversals | 145 |
| Complete boat legs / ordered ferry events | 2 / 2 |

The selected ferry is **Gondola Traghetto Santa Sofia**, original OSM way `216893104`. The selected tour makes a complete crossing and immediate complete return; these are two independently exported boat legs/events, not a merged boat loop:

1. Route indices 3255–3256: `[2262139792, 2262139795]`, 47.91427555775306 m.
2. Route indices 3256–3257: `[2262139795, 2262139792]`, 47.91427555775306 m.

The constraint requires at least one complete boat leg, not net movement across the canal or prohibition of return crossings. This shortest-found feasible tour is 199.268 m longer than the unchanged 43,936.383 m walking tour. It does not claim a ferry distance saving.

## Search and scope

Reuse the existing walking midpoint arrival order; no walking TSP rerun. Try all four eligible actual OSM ferries in both directions. For each directed ferry, insert its complete source node path into the minimum-cost transfer gap, recomputing network shortest-transfer distances on the audited split graph with all eligible connectors. Apply at most 200 best-improvement 2-opt moves per candidate; the mandatory boat terminal pair is locked against removal (reversal allowed). Select the shortest found feasible candidate. Never fall back to a zero-event walking tour.

| Forced ferry | Forward candidate | Reverse candidate |
|---|---:|---:|
| Santa Sofia | 44,135.65130989155 m | 44,135.65130989155 m |
| San Tomà | 44,187.708984835146 m | 44,187.708984835146 m |
| Giglio | 44,136.09549049254 m | 44,136.095490492546 m |
| Dogana | 44,250.41413005062 m | 44,250.41413005062 m |

Eight directed candidates; selected candidate equals the minimum recorded cost. The chosen candidate needed zero 2-opt moves. This is bounded heuristic search, not global optimality. Final generation took 16.879 seconds.

All four original ferry connectors remain eligible. Access assumptions remain restricted to the exact original Santa Sofia indoor pier and Giglio `foot=no` boat, plus the original Dogana boundary pier prefix. No synthetic water or walking lines were added. Current operation/access, wait times and one-day schedule feasibility remain unverified.

## TDD and verification

- RED before production changes: new mandatory boat export regression failed on the old zero-boat artifact with `assert []`; the new solver test also failed because the solver was absent.
- GREEN: `python -m pytest tests/test_bridge_visits.py -q` → **24 passed in 25.69 s**. No full church suite run.
- Includes actual written JSON passed through unchanged JavaScript `validateVisitRoutes`.
- Includes independent original PBF adjacency and exact split-midpoint checks, source ferry paths and landing approaches, complete ordered event/boat-leg matching, all-346 coverage, San Marco closure, coordinate projection, and independent recomputation of walking/boat/repeat/half-bridge metrics.
- Includes exact JSON/GPX per-track, per-leg point equality and mode checks.
- Frozen walking variant compact JSON bytes remain identical: SHA-256 `8c295882d3a4e69056b7368e7e5cf900eac6c9587cd1151b7d333c7326f64f00`. Walking GPX track remains identical to HEAD.
- Original full-crossing `bridge-route.json` / `.gpx`, frontend `web/bridge-route.js`, and `traghetti.json` hashes remain unchanged.
- Original PBF SHA-256: `5246d846ba5a0aeb169f9bf2fa6dc0e474da8345921c1ea4d776a34d91ce9969`.
- Final JSON SHA-256: `eda51b9bca39efec2991681bc176973f5f1280ba00d236b8ad0afd5a4c272cb4`.
- Final GPX SHA-256: `fdaffac5ccc58955a01a973399a0314adbde483d053504d0f286c9b258f65900`.

## Changed files and boundary

Only `pipeline/venice/s12_bridge_visits.py`, `tests/test_bridge_visits.py`, `web/data/bridge-visit-route.json`, `web/data/bridge-visit-route.gpx`, and this new timestamped report are changed. The existing untracked `favicon.png` was untouched. No commit, push, UI edits or skill/memory writes.
