# Enrichment from Wikidata

Venice is well described in Wikidata, and most of what is there about a building was never used by
this atlas: it knew only the 382 buildings that carry a `wikidata` tag in OpenStreetMap. This step
adds the rest, by geometry rather than by tag.

## What Wikidata holds for Venice

| | items |
|---|---|
| located in Venice (`P131` = Q641) | 3 756 |
| of those, with coordinates (`P625`) | 2 618 |
| with an inception date (`P571`) | ~500 (501 stated to the year, 91 to the century, 69 to a decade) |
| with a heritage designation (`P1435`) | 153, of them 143 «культурное наследие Италии» |
| with an architectural style (`P149`) | ~200 (Renaissance 63, Gothic 31, Baroque 21…) |
| sculptures, canals, hotels, bridges, churches, palaces | 488 palaces, 231 churches, 222 canals, 391 bridges |

## How the link is made

`pipeline/venice/s07_wikidata.py` asks the Wikidata Query Service for every item located in Venice
that has coordinates, then matches each point against our own footprints (buildings and bridge decks,
projected to EPSG:32633, in an STR tree): a point inside a contour is a sure match, a point within
18 m of one is a near match.

| | items |
|---|---|
| matched to one of our objects | **2 094** |
| … point inside the contour | 1 175 |
| … within 18 m | 361 |
| our objects that gained a link | **1 536** (of which 375 bridge decks) |
| not matched (paintings, canals, landings, statues) | 591 |

`pipeline/venice/s08_wikidata_enrich.py` then collects, for the matched items: names and article
titles in Russian, Italian and English, the inception date **with its precision**, architects,
styles, heritage status, height, the Commons photograph with author and licence, and the first
paragraph of the article. Data land in `data/ready/wikidata_enriched.json`; everything is cached in
`data/processed/api_cache/`, so a re-run does not touch the network.

## What the map gained

| | before | after |
|---|---|---|
| cards | 385 | **1 460** |
| cards with a photograph | 374 | **1 312** |
| exact years on the timeline | 25 | **226** |
| dates from Wikidata | 0 | 252 objects (225 exact, 53 as an interval) |
| objects with a heritage status | 0 | 43 (the Heritage lens was empty) |
| named places (vaporetto landings, hotels, schools) | 0 | 529 |
| styles / architects on cards | 0 / 0 | 200 / 121 |
| heights measured in Wikidata | 0 | 15 buildings (292 items carry one, but nearly all belong to bridges; see below) |
| names | 818 | 1 128 |

## What is deliberately not taken

* **Implausible heights.** Wikidata's `P2048` for Venice includes 1000 m, 395 m and values below
  2 m. Only heights between 2 and 120 m are accepted for buildings (the campanile of San Marco is
  98.6 m), and only for buildings: for a bridge `P2048` states the clearance or the span, not the
  deck, so the deck keeps its assumed slab height and the measured value is shown on the card.
* **A century as a year.** A statement precise to a decade or a century is drawn as an interval
  (`flag = 1`), never as an exact year. Only day-, month- and year-precise statements become exact
  years, and every one of them is recorded with its source (`dsrc = 2`, Wikidata).
* **Geography as a building's own tag.** A link found by coordinates is not the same claim as a
  `wikidata` tag on the building itself: such cards say «связь найдена по координатам» and the
  objects fall into the tentative-links layer, so a reader can tell the two apart.

## Reproducing

```bash
cd pipeline
python -m venice.s07_wikidata  centro   # query the items and match them to our footprints
python -m venice.s08_wikidata_enrich centro   # properties, photographs, article openings
python -m venice.s06_export centro      # cards, dates, heritage, heights, places
```

Both steps are polite to the Wikimedia APIs and pause on HTTP 429; with the caches warm the whole
run takes about two minutes without any network traffic.