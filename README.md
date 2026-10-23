# Venice, building by building

A 3D atlas of the historic centre of Venice: every building as it stands today, coloured by the
epoch it belongs to, with a timeline that lets the city assemble itself.

Live site: https://venice-by-building.vercel.app (Vercel, from this repository)

## Languages

The site speaks Russian, Italian and English: the switch sits in the top bar, `?lang=it` or
`?lang=en` sets it from a link, and the choice is remembered in the browser. Russian is the source
of every text; `web/i18n.js` holds the dictionaries keyed by the Russian original, and both the
page and the pipeline's own prose (stories, eras, layers) go through it. Wikipedia extracts and
article titles are shown in the language of the map where Wikidata has that sitelink, and fall back
to the Italian one.

`node tests/i18n_coverage.mjs` fails if any Russian text the reader can see — on the page, in the
code or in the exported data — has no Italian and English line, or if a translation lost its
placeholders or kept Cyrillic in it.

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
| `s07_wikidata.py` | every Wikidata item located in Venice, matched to our footprints by geometry | `data/processed/wikidata_match_*` |
| `s08_wikidata_enrich.py` | names, articles, dates with precision, architects, styles, heritage, heights, Commons photos | `data/ready/wikidata_enriched.json` |
| `s06_export.py` | tiles, packs, attributes, cards, ground and labels for the viewer | `web/data/*` |

Run:

```bash
cd pipeline
python -m venice.s01_buildings island centro
python -m venice.s02_dating island centro
python -m venice.s04_wikimedia island centro
python -m venice.s05_streets island centro
python -m venice.s07_wikidata centro
python -m venice.s08_wikidata_enrich centro
python -m venice.s06_export centro
```

`pipeline/venice/periods.py` holds the epoch table and the state flags read out of the municipal class
descriptions; nothing there may be turned into a single year.

Wikidata is matched **by geometry**: the atlas used to know only the 382 buildings tagged with
`wikidata` in OpenStreetMap, while the coordinates of 2 685 Venetian items reach 1 536 of our
buildings and bridge decks (1 175 points fall inside a contour, 361 within 18 m). That is where the
cards beyond those 382 come from — 1 460 in all, 1 312 of them with a Commons photograph — as well as
252 dates (226 exact years, 53 as an interval), 43 heritage designations, 200 styles, 121 architects
and 529 named places: vaporetto landings, hotels, schools. A link found by coordinates says so on the
card and counts as tentative; implausible statements are dropped. See
`docs/wikidata-enrichment_20261023.md`.

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
Not yet in this build, but held on disk and inventoried in `docs/`:

* **Topographic releases 1987–2010** — `docs/topographic-data-inventory_20261022.md`. Usable 3D inputs
  exist: base and eaves elevations in 2005 `FABBRIC` and 2006 `EDIFC`/`EDI_MIN`; 181,113 volumetric parts
  in 2010 `UN_VOL`; 187,161 roof polygons with vertex Z in `ELE_CP`. Legacy horizontal CRS is inferred
  EPSG:3003, the GEODBT archives declare EPSG:6706, the vertical datum is undocumented, and no stable
  identifier links a building across all five releases.
* **Historical registers 1740 / 1808 / 1857 and the TimeMachine Atlas** —
  `docs/historical-data-inventory_20261022.md`. The nearest thing to per-building age evidence is
  `2024_Edifici_EPSG32633.geojson`, attribute `description_piamonte`: 929 building-linked descriptions with
  cited historical prose, from which dates need semantic extraction. Atlas `start_date`/`end_date` are
  mostly map states; `transform_date` and `fire_date` are sparse candidates. Dorigo observations 976–1408
  and the 1740/1808 registers date zones and parcels, not modern buildings. The 1808 Zenodo release is
  CC BY 4.0; other historical datasets have no established reuse grant.

The viewer's data contract, as implemented by `s06_export.py`, is written down in
`docs/viewer-contract_20261022.md`.