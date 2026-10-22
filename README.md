# Venice, building by building

A 3D atlas of the historic centre of Venice: every building as it stands today, coloured by the
epoch it belongs to, with a timeline that lets the city assemble itself.

Live site: https://venice-by-building.vercel.app (Vercel, from this repository)

## What the map shows

11,137 buildings of the historic centre — the island of Venice, Giudecca, San Giorgio Maggiore,
La Certosa, Murano and Burano — each drawn from its OpenStreetMap footprint, with courtyards as
holes and roof volumes as separate `building:part` prisms.

Colour is age:

| Epoch | Buildings | Source of the statement |
|---|---|---|
| before 1800 | 3,642 | VPRG class preottocentesche |
| 1800–1899 | 423 | VPRG class ottocentesche |
| 1900– | 1,888 | VPRG class novecentesche |
| year stated | 25 | `start_date` / `year_of_construction` on the OSM object |
| unknown | 5,177 | no municipal classification for the building |

## What the data can and cannot say

Venice has no register of construction years. The municipal VPRG classification of *unità edilizie*
describes typology and historic persistence in three epochs, and marks units that were transformed,
merged or rebuilt (`pt`, `fa`, `Or`, and composite codes). `DATA_CSC` in that layer is the date of a
Commissione Scientifica decision (2000–2013), not a construction date. The historical registers held in
`data/raw/Venice_Historical_20261022_2025` record years of observation, not of building.

So the atlas carries intervals, never invented years:

* a stated year is drawn as a year (`flag 0`);
* a VPRG epoch is drawn as an interval and labelled as an epoch (`flag 1`);
* a building with neither is grey and unknown (`flag 2`).

Heights are an explicit tag, else a level count, else the median of the same epoch's measured
buildings — the source is recorded in the `hsrc` attribute and shown in the building card either way.

## Pipeline

Everything in `pipeline/venice/` is ours; it writes plain GeoJSON/GeoParquet first and only then the
viewer's binary format, so the data stays independent of the viewer.

| Stage | What it does | Output |
|---|---|---|
| `s01_buildings.py` | OSM extract into buildings, parts, addresses, streets and water | `data/processed/*_island`, `*_centro` |
| `s02_dating.py` | municipal classification and OSM dates into one evidence table | `evidence_<area>.csv`, `buildings_dated_*` |
| `s04_wikimedia.py` | Wikidata labels, Wikipedia articles, Commons photos with licence and author | `data/ready/wikimedia.json` |
| `s05_streets.py` | streets as ordered rows of facades, with a side for each house | `data/ready/streets.json` |
| `s06_export.py` | tiles, packs, attributes, cards, ground and labels for the viewer | `web/data/*` |

Run:

```bash
cd pipeline
python -m venice.s01_buildings island centro
python -m venice.s02_dating island centro
python -m venice.s04_wikimedia island centro
python -m venice.s05_streets island centro
python -m venice.s06_export centro
```

`pipeline/venice/periods.py` holds the epoch table and the state flags read out of the municipal class
descriptions; nothing there may be turned into a single year.

## Viewer

The rendering and interface code in `web/` is **SydMap** by Amir Marashi (MIT), vendored unchanged apart
from the data path, the language and the wording of the building card. Its data contract — 600 m tiles
packed into gzipped `pack*.bin` with a `SYD2`-style layout, a 56-byte `attrs.bin`, `wiki.json`,
`names.json`, `heritage.json`, `labels.json`, `layers.json` and land/water polygon bins — is implemented
by `s06_export.py`. Three.js r186 is vendored under `web/vendor/`.

Attribution: SydMap (MIT) → [LAYRS: Amsterdam](https://stop-token.com/lab/amsterdam/) by Alex Barakov
(MIT) → [Paris, building by building](https://paris.bogachev.fr) by Alexander Bogachev.

## Licences

| Material | Licence |
|---|---|
| OpenStreetMap geometry, addresses, parts, street names | ODbL 1.0, © OpenStreetMap contributors |
| VPRG Città Antica classification, Comune di Venezia | municipal open data, CC BY 4.0 |
| Wikidata | CC0 |
| Wikipedia text | CC BY-SA |
| Wikimedia Commons photos | per file; author and licence shown on each card |
| SydMap viewer code, three.js | MIT |
| This pipeline | MIT |

## Repository layout

```
pipeline/venice/   the data pipeline (ours)
web/               the site: viewer code, generated data, fonts, vendored three.js
data/raw/          source data, kept on disk and out of git
docs/              engine audit, VPRG class documentation, data inventories
research/          engine source snapshots and provenance records
```

## Status

Working: geometry, parts, epochs, unknown-age layer, Wikimedia cards, streets.
Not yet in this build: the 1987–2010 topographic releases and the 1740/1808/1857 registers as dating
evidence; those files are on disk and their inventories are in `docs/`.