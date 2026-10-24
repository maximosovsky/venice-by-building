# Churches and monasteries expansion — 24 October 2026

## Delivered

- Route expanded from **129 to 134 stops**: five new surviving/adapted monastery premises.
- **29 monastery members grouped into 28 existing church complexes**, avoiding a second waypoint for an explicitly co-located complex. Frari and the surviving San Nicolò della Lattuga convent share the Frari visit, but remain separate source identities.
- Independent Wikipedia collection: recursive religious-building categories (307 Italian members, 275 English members), six fully paginated searches, 733 fetched articles; 109 geographically plausible articles reviewed, with 107 explicit building/mention decisions in `web/data/monastery-inventory.json` (34 included premises/members, 73 excluded/review-limited mentions).
- All prior `USER_EXCLUDED_NO_ATLAS_GEOMETRY` identities remain excluded. New monastery scope is historic sestieri, Giudecca/Sacca Fisola and San Giorgio Maggiore, not Murano/Torcello/Lido or previously removed islands.

## New stops

| Stop | Surviving premises | Access/geometry |
|---|---|---|
| `monastery-Q3672972` | Santa Chiara convent, now Questura | Restricted exterior; exact named OSM relation 2284203, not demolished church |
| `monastery-Q57906878` | Santo Sepolcro convent, now Caserma Cornoldi | Restricted exterior; exact named OSM relation 2291108; part of north cloister survives |
| `monastery-Q428317` | San Lorenzo and surviving monastery cloister | Exact named church way 286784078; former exclusion concerned demolished San Sebastiano chapel/one convent wing |
| `monastery-Q385975` | Surviving Celestia convent cloister | Wikipedia complex reference coordinate, **not** the nearby Cristo Re church polygon |
| `monastery-Q61954738` | Former San Giovanni Laterano monastery, adapted as archive/school | Wikipedia complex reference coordinate; the oratory is demolished, not the surviving adapted premises |

Primary article URLs and survival decisions are embedded in the inventory and route. Former monasteries remain eligible when substantial adapted premises survive. A name containing “abbey” does not prove a surviving monastery: the Misericordia monastery is explicitly demolished and was not added.

## Route and full-volume geometry

- 133 continuous segments: **117 verified OSM walking paths**, **16 schematic non-navigational connectors**.
- Verified-network distance **38,319.41 m**, not total travel distance and not a globally optimized tour.
- Restricted sites remain unsnapped exterior references; their schematic connections assert no public admission or fabricated pedestrian path. San Giorgio transfer is not a fabricated boat track.
- Green manifest: **114 existing atlas building GIDs covering 112 of 134 stops**; **22 unmatched stops**. The San Giorgio monastery adds verified way 138800498 (GID 10268), separate from the basilica; Terese adds the verified separate convent volume, and San Lorenzo adds its verified church volume.
- Reviewed exact named relation IDs are retained in the source inventory. Some do not exist as unique exported atlas render records; these receive **no invented geometry**. The green renderer was not modified. Manifest remains schema version 1, required by its existing validator.

## Verification

- Strict TDD: six expansion tests first failed for missing behavior/artifacts; implementation then passed.
- `python -m pytest tests/test_church_route.py tests/test_church_buildings.py tests/test_monastery_route.py -q`: **29 passed**.
- Updated obsolete church tests that still expected removed islands and counts of 150/162. Their current assertions preserve the approved exclusions and actual artifact accounting.
- `node tests/church_route_ui.mjs`: **8 passed**.
- `node tests/church_building_highlight.mjs`: passed full walls/parts/roof extraction, GID matching and visibility/picking/disposal contracts.
- `node tests/church_route_browser.mjs`: 134 rendered stops and markers, focus and Russian/Italian/English switch verified; no page errors. Three existing unrelated missing optional assets reported (`sun.webp`, `suburbs.json`, `suburbs.bin`).
- `node tests/monastery_route_browser.mjs`: live local real-data green overlay; **46,800 expected/actual triangle indices**, **371 San Giorgio monastery triangles**, exact green `436817`, new-stop focus and all three languages; no page errors.
- Screenshot: `C:/Users/1/AppData/Local/hermes/cache/scratch/venice-monastery-green.png`.
- Whole-repository pytest was attempted but timed out after 180 seconds amid other ongoing bridge work; only the owned church suite is claimed green. The old gray-overlay browser test remains obsolete and was not used as acceptance of green coloring.

## Limits and reproduction

The existing **seven unresolved church identities remain disclosed**. This is a reviewed source-bounded expansion, **not a claim that every monastery mentioned anywhere in Wikipedia is exhaustively included**. Some category/search mentions have no verified surviving premises and remain review-limited; unrelated hospitals, geographic entities, bibliography-only mentions and institutions elsewhere were not promoted to monastery stops.

Cached raw API JSON, paginated discovery results, article batches and review assembly scripts are persisted in ignored `data/processed/church_research/`. Published reviewed evidence is versioned in `web/data/monastery-inventory.json` so the generator does not depend on ignored research scripts for normal builds.

```bash
PYTHONPATH=pipeline python -m venice.s11_church_route --report docs/church-monastery-route-audit-20261024.md
PYTHONPATH=pipeline python -m venice.church_building_manifest
python -m pytest tests/test_church_route.py tests/test_church_buildings.py tests/test_monastery_route.py -q
node tests/monastery_route_browser.mjs
```

No UI/highlight-module, bridge-generator, commit/push or deployment changes belong to this workstream. Parent handles publication and live deployed verification.
