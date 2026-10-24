# San Pietro bridge scope correction — 20261024_063848Z

## Outcome
- All three closed Piazza San Marco variants cover exactly 346 unique physical bridges: all original 344 retained, only d555836229 and d555835752 added.
- Full crossings: 61976.535 m; 74 minimum repeated crossings; 88 odd land components (previously 86). Closed once-per-bridge traversal remains impossible in the selected crossing model.

| Variant | Total m | Walking m | Boat m | Midpoint repeat visits | Full crossings | Full-crossing repeats | Half-deck returns |
|---|---:|---:|---:|---:|---:|---:|---:|
| walking_midpoints | 43936.383 | 43936.383 | 0.000 | 8 | 210 | 9 | 145 |
| traghetto_midpoints | 43936.383 | 43936.383 | 0.000 | 8 | 210 | 9 | 145 |

## Audited geographic correction
- The existing Venezia relation/4817103 polygon omits the distinct San Pietro di Castello islet. The centro relation/6628638 is far broader (Murano/Burano and lagoon); it was not substituted wholesale.
- Scope is the exact geometric union of the original Venezia polygon with original OSM way/173629664 (Isola San Pietro di Castello, place=islet, Wikidata Q2121385, 77 original ring references) and both original bridge deck polygons way/555836229 and way/555835752. Source tags, original node IDs and exact coordinates are in data/routes/bridge-route-san-pietro-scope.geojson.
- Added metric area: 61082.699429998 m². No buffer, arbitrary bounding box, snapping, fake connectors or generated deck footprints. Every traversable way must still be wholly covered; connectivity uses only original adjacent OSM nodes.
- Accepted source highway ways: 7504 → 7537; reachable graph: 23161 nodes / 25892 edges. New physical source candidates: exactly two. San Pietro includes extra mapped walkways 491410462 and 491410463 in the same physical deck identity, not additional bridges.
- Original 19 one-pass dead-end exclusions, all 71 total exclusions, all 8 port/transport exclusions and 10 overlapping port scope matches remain unchanged. No recursive leaf pruning. Ponte della Costituzione retained.

## Original-node bridge evidence
- d555835752: way IDs [121811923]; selected full crossing original nodes `[27179839, 1362732685]`; banks [5, 59].
- d555836229: way IDs [173629661, 491410462, 491410463]; selected full crossing original nodes `[4835256833, 1844067168, 1844067122, 1935858909]`; banks [143, 5].

## Midpoint optimization and ferry assumptions
- Recomputed compiled SciPy sparse Dijkstra closure, 40 nearest-neighbour starts, 40 deterministic four-cut kicks, best-improvement 2-opt and bounded Or-opt (maximum 80 relocations). No global total-distance optimality claim.
- Original 344-target walking and ferry orders were retained as seeds, both new targets inserted by cheapest actual network-distance insertion, then independently refined. No stale old negative midpoint IDs or 344-route reuse. Checkpoints bind midpoint definitions, source PBF hash, full inventory/scope artifact hash and closure mode.
- All four municipal traghetti remain conditionally graph-eligible: Santa Sofia, San Tomà, Giglio and Dogana. Exact Santa Sofia indoor pier and Giglio foot=no user assumptions, original Dogana landing exception, hours/holiday caveats and unverified present operation remain unchanged.
- Important result: the selected ferry-eligible optimum found by this bounded heuristic ties the walking route and uses zero boat metres. It does not falsely claim a ferry saving or force a longer boat detour. The independently extended old ferry seed was evaluated but was longer. All four boat connectors remain available in the graph.

## Verification
- Strict TDD: both named-bridge inclusion regressions first failed for missing d555836229 / d555835752, before generator changes; insertion/checkpoint/relocation tests also failed before implementation.
- Targeted bridge suites: .........................................................                [100%]
57 passed in 143.81s (0:02:23)
- Unchanged JavaScript frontend validators returned true for full route and midpoint wrapper; Node emitted only its existing MODULE_TYPELESS_PACKAGE_JSON warning.
- Tests independently re-read original PBF adjacency, land/deck polygons and tags, complete full-crossing node paths, midpoint split membership, all 346 target coverage, forbidden port edge absence, exact San Marco closure, projected distances and all three GPX tracks/mode legs.
- No UI changes, commit or push. Other concurrent church/monastery changes and untracked favicon.png were untouched.
