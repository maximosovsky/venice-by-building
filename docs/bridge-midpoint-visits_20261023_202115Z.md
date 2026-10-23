# Verified midpoint-visit routes — 2026-10-23

Additive artifacts: `web/data/bridge-visit-route.json`, `web/data/bridge-visit-route.gpx` (two named tracks, mode-separated segments), and `web/data/traghetti.json` (exactly four crossings and eight original OSM terminals). Generator: `pipeline/venice/s12_bridge_visits.py`. Tests: `tests/test_bridge_visits.py`.

| Variant | Walking m | Boat m | Total m | Retraced walking m | Midpoint arrivals / repeats | Full crossings / repeats | Midpoint returns |
|---|---:|---:|---:|---:|---:|---:|---:|
| walking_midpoints | 44834.288 | 0 | 44834.288 | 5387.205 | 352 / 8 | 213 / 12 | 144 |
| traghetto_midpoints | 44568.477 | 79.551 | 44648.028 | 4864.249 | 353 / 9 | 212 / 10 | 142 |

Both visit every one of the **same retained 344 bridges**, at half metric arclength of its frozen representative crossing path. They start and end at the original Piazza San Marco node 9645230124, longitude 12.3390123, latitude 45.4339208. Complete crossing is optional. Reaching and returning from a midpoint counts the real repeated half-deck distance, not zero. `crossings` describes midpoint arrivals, not full crossings. `stats.repeat_distance_m` is walking retrace for the unchanged UI; total retrace is also retained in `stats.total_repeat_distance_m`.

Original full-crossing route: 61647.239 m, independently measured repeated undirected walking-edge distance 7911.200236156393 m. Walking midpoint route reduces total distance by 16812.951 m and walking retrace by 2523.995236156393 m. Ferry variant reduces total distance by 16999.211 m and walking retrace by 3046.951236156393 m versus that original. These are bounded deterministic network-TSP heuristic results, **not global optima**. The ferry variant beats walking midpoint total distance by 186.260 m and uses one San Tomà boat leg (indices 3608–3609), exactly the complete original OSM ferry geometry. Dogana is eligible but unused; no requirement to ride all four.

## Ferry provenance and limitations

Official source: https://www.comune.venezia.it/it/content/traghetti-parada . Successful official `web_extract` is recorded in the previous internal task transcript at 2026-10-23 21:55:34 Istanbul (18:55:34 UTC). Direct HTTP returned an Incapsula stub. The published table states effective date **2021-06-07**; this is historical published evidence, not proof of service today. The current generator's `schedule_source.retrieved_at` reflects local rebuild time; the real successful source-reading timestamp is the one above. Search-index update metadata is not a new timetable effective date.

- Santa Sofia: Mo–Fr 08:30–19:00; weekends/public holidays 09:00–18:00. Mapped, not routed: original landing approach marked indoor and excluded by the retained access policy.
- San Tomà: Mo–Fr 08:30–19:00; weekends/public holidays 09:00–18:30. Eligible and used once.
- Santa Maria del Giglio: 09:00–18:00. Mapped, not routed: original ferry way has `foot=no`; do not silently override it.
- Dogana: municipality 09:00–18:00; original OSM starts at 10:00. Explicit conflict. Eligible via the exact original two-node public pier prefix (way 292750093); this is a disclosed strict island-boundary exception, not a synthetic connector.
- Published no service August 15, December 25/26, January 1; closes 13:00 December 24/31.

All ferry availability is `conditional_unverified_today`; `schedule_feasible=false`. No departure times, waiting times, weather/operator service, current closures or one-day feasibility are established. Both variants have `status=ready` meaning validated data, not guaranteed service. Euler fields are inherited for viewer schema compatibility and explicitly `applicable=false` for midpoint visits. Frozen exclusions (including 19 immediate cul-de-sacs), step/access policy and inventory uncertainty remain disclosed.

## Verification

- `python -m pytest tests/test_bridge_visits.py -q`: **15 passed**, 118.46 s. Includes unchanged real JavaScript validator on the written wrapper, all exact 344 midpoint definitions, reconstructed original/split graph adjacency, original ferry membership, independently recomputed distances/retrace/full-crossing statistics, continuous mode-separated legs and both GPX tracks roundtrip.
- `node --test tests/bridge_route_ui.mjs`: 23 passed, 1 WebGL test skipped, 0 failures (24 tests). Existing Node module-type/localStorage warnings remain; no UI file edited here.
- Full Python suite run earlier: 66 passed, 6 failed. One owned failure was inverse-projection floating-point roundoff at the exact original San Marco start (`12.339012300000002` versus `12.3390123`). Fixed by preserving the literal frozen endpoint and resynchronizing JSON legs and GPX; targeted suite now green. Five church-data failures are unrelated and untouched. **Do not claim full-suite success.**

Original JSON SHA256: `3155592d7eaebe33942e1df6ed45fe127d8fbe6aba3210fc4bf3f26c52c420a5`.
Original GPX SHA256: `9b34e011c13e166f46cc60b1ac4979ba81f93a2a96811b85bc90cd9ed58442e3`.
Both unchanged after generation. UI/unrelated files were not edited, staged, committed or pushed by this task.
