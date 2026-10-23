# Measured heights from the municipal survey

The atlas used to guess: 8 303 of 11 137 buildings had no height at all and were drawn at the median of
their epoch. The municipal topographic archives of the Comune di Venezia contain real measurements, and
this step takes them.

## Which archive actually covers the historic centre

Six layers were checked against the atlas footprint. The result is not what the archive sizes suggest:

| archive | features | **inside the atlas** | what it holds |
|---|---|---|---|
| **2010 UN_VOL** | 181 113 | **109 943** | volumetric parts with base, eaves, ridge and height |
| 2010 EDIFC | 40 320 | 8 813 | footprints and use codes, no heights |
| 2010 EDI_MIN | 29 477 | 2 311 | minor structures, no heights |
| 2010 PONTE | 1 259 | 462 | bridge polygons; the level fields are empty (all «92») |
| 2006 EDIFC / EDI_MIN / PONTE | 167 939 / 82 164 / 2 265 | **0** | the lagoon lot of Chioggia and the southern lagoon |
| 2010 ELE_CP | 187 161 | **0** (Murano 10 664) | roof elements with real Z and roof typology |
| 2005 FABBRIC (CTRN5000, 46 sheets) | 27 937 | **0** within 3 km | quota pairs elsewhere, no .prj, EPSG:3003 by inference |

So the widely quoted «167 939 measured buildings» of the 2006 lot cannot be used for Venice at all, the
roof layer does not reach the centre, and the only municipal measurement of the historic centre is the
2010 volume layer.

## Method

`pipeline/venice/s09_municipal.py`:

1. reads UN_VOL for the atlas footprint (EPSG:6706) and reprojects to EPSG:32633;
2. attaches each part to a building — first by its representative point falling inside a footprint,
   then, for the rest, by at least half of the part's area overlapping one;
3. picks the **largest part** as the body of the building: a church's footprint also contains its
   campanile, and the tallest part would otherwise inflate the whole church. The height of that part is
   `UN_VOL_QG − UN_VOL_QB`, its own eaves minus its own base;
4. keeps the tallest measured part separately (`height_max_m`) for the record, and drops anything below
   2 m (a parapet or a step) or above 80 m.

## Result

| | before | after |
|---|---|---|
| heights measured by the city | 0 | **8 915 of 11 602 objects** |
| heights by an OSM `height` tag | 536 | 42 |
| heights from storey counts | 2 283 | 124 |
| heights estimated from the epoch median | 8 303 | **2 055** |
| median height drawn | 6,7 m (estimate) | 6,3 m (measured) |

Of the 8 915 measured objects, 937 carry a name. The tallest is the campanile of San Marco at 73,7 m
(the survey measures the top of the belfry; the 98,6 m of its OSM entry include the spire above it, which
is the separate `ridge` value of 94,4 m in the same record).

## Checks

* **Against an independent measurement.** For the 492 buildings whose OSM entry carries a measured
  `height`, the difference between that tag and the survey's `eaves − base` has a median of **+0,18 m**
  (10–90 % from −2,9 to +4,0 m). The two agree, and taking the difference cancels the survey's own
  vertical datum, which the archive does not document.
* **Rows.** Of 44 723 parts in the narrow centre, 43 539 attach by a point inside a footprint and 444 by
  area; no part was left unassigned silently.
* **Representative cases.** Campanile di San Marco 73,7 m; the basilica of Santa Maria Gloriosa dei Frari
  takes 25,5 m for its body while its campanile is a separate footprint of 49,4 m; ordinary houses 2,8–8,9 m.
* **Plausibility window.** Nothing above 80 m survives into the export, and the 6 objects whose OSM tag was
  below 2 m now fall back to the epoch estimate instead of being drawn as knee-high houses.

## Limits

* The vertical datum is not documented. The height shown is the eaves above the building's own base, so
  the datum cancels; the absolute elevation is not used.
* Roof shapes cannot be taken from the municipality in the centre: ELE_CP covers Murano, not Venice. OSM
  `building:part` volumes remain the source of roofs.
* The record's own dates (DATA_CRE / DATA_MOD = 2013-03-25) are dates of the record, not of the building.
* **The terms of use of these municipal archives are not established.** The atlas publishes derived
  heights (eaves above base) and names the source; before wider redistribution the licence must be settled.

## Reproducing

```bash
cd pipeline
python -m venice.s09_municipal centro     # attach the municipal volumes to our footprints
python -m venice.s06_export centro        # heights, cards and layers
```