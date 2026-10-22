# Historical Venice data inventory — 2026-10-22

## Scope and conclusion

Read-only inspection of `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025`: **490 files; 937,472,050 bytes**. No source files were changed. Every existing file is listed with its absolute path and exact byte size in Appendix A; actual schemas and date distributions follow. The folder-name suffix `2025` is not a historical date or a reliable release date.

**There is no universal, verified construction-year column for Venice buildings in this collection.** There are nevertheless several usable, differently qualified forms of datable evidence:

1. **Actual building-linked historical prose:** the 2024 building polygons contain `description_piamonte`, with source-cited construction, reconstruction and period statements for selected buildings. This is the strongest local route to actual building age, but requires manual semantic extraction and source checking, not simply reading `2024` or extracting every number.
2. **Structured building-level dates, semantics provisional:** TimeMachine Atlas vectors have `start_date`, `end_date`, `transform_date` and `fire_date`, and its search index has `start_year`/`end_year`. Most building dates encode map-state validity (especially 1808 and 2016). Sparse event attributes are useful candidate evidence, not a documented, verified construction-date catalogue.
3. **Dated medieval observations:** Dorigo records have individual observation dates and source citations, linked to historical zones. These are genuinely datable records, but their geometries are areas/zones, not identified building footprints or modern cadastral parcels. Earliest observation of a zone is not first mention or construction of each building there.
4. **Dated register snapshots:** the 1808 Sommarioni give parcel/building polygons and ownership/use at the register date; the 1740 Catastici give property-entry points with some purported links to 1808; the 1857 guide gives professional/address entries. These can establish presence or use at a historical snapshot, **not construction in 1740/1808/1857**. Their historical year is dataset-level, not a per-record date field.
5. **Graphical broad periods:** the San Servolo A5 PDF contains building-age classes; municipal NTA/analysis documents explain pre-19th-, 19th- and 20th-century categories, but no citywide per-building assignment export is present.

## 1. 1808 Napoleonic cadastre / Sommarioni

Canonical, publisher-checksummed files:

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_geometries.geojson` — **12,903,992 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_textual_entries.json` — **28,237,771 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_aggregated_data.json` — **75,969,502 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_standardised_people.json` — **3,938,260 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_merge_log.json` — **2,724,903 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\README.md` — **12,153 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\zenodo_record.json` — **8,899 bytes**

- **Geometry:** 24,430 Polygon features, CRS84 longitude/latitude; `geometry_type` values: building 15,246; courtyard 7,887; sottoportico 704; street 327; water 264; null 2. These are cadastral geometry parts, not 24,430 distinct buildings. A parcel may comprise building/courtyard/passage parts.
- **Register:** 23,662 textual entries; `parcel_id` is integer, unique entry identity; `geometry_id` is integer in the text but string/null in GeoJSON. There are 16,004 distinct text geometry groups versus 16,022 non-null polygon geometry groups. The join is many-to-many/grouped: cast consistently before matching, retain unjoined geometries. Never assume one entry = one building.
- **Join keys:** `geometry_id` links text to geometry groups; `parcel_id` links text to the people's `parcel_ids` list; `uid` identifies a person. Archival parcel numbers are `parcel_number` plus `sub_parcel_number`, interpreted with `district`; `house_number` is an address, not a date. `properties.id` is a geometry identifier such as `way/11415`, not an event date.
- **Actual geometry schema:** `id`, `parcel_number`, `geometry_type`, `geometry_id`, `parish_standardised`, `area`. `geometry_type`, not README's `parcel_type`; geometry IDs are not universally integer as documented.
- **Aggregate:** 16,870 objects with `geometries` **a FeatureCollection dictionary**, `text` list and `people` list, not a simple GeoJSON FeatureCollection or the README's list-of-geometries contract. Aggregate subrecords omit operational linkage fields, so the separate canonical files are preferable for explicit joins.
- **Date evidence:** no per-feature construction, first-mention, survey-year or period field in the geometry/text/people/log schemas. The dataset documents the cadastre compiled **in 1808** from 27 original plates. This supports historical presence, ownership and use as a snapshot only. The metadata publication date **2026-06-16** and version **1.1** describe publication, not buildings. `parish_standardised` uses interpreted 1740 parish boundaries; this does not date a building to 1740.
- **Language:** source and standardized content primarily Italian/historical Venetian Italian; operational field names English; selected `_en` fields translate ownership/use and qualities. Metadata explicitly says `"language": "ita"`. The actual people fields are `uid`, `nucleus_uid`, `family`, `name`, etc., not README's `own_uid`/`own_name`; `father_is_q`/`husband_is_q` are float/null, not the stated boolean.
- **Rights:** canonical Zenodo v1.1 is CC BY 4.0; quote and provenance in §7.

### Repository variants and CSV exports

`D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main` contains overlapping exports of the same 1808 source, not additional observation years. Exact filenames/sizes appear in Appendix A.

`D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni` contains overlapping exports of the same 1808 source, not additional observation years. Exact filenames/sizes appear in Appendix A.

The dedicated repository includes geometry CSV (24,430 rows, `geometry` is WKT Polygon), text CSV (23,662), people CSV (12,277), log CSV (9,312), JSON counterparts, aggregated JSON, and eight processing notebooks. Data Week contains geometry, text, people and aggregate JSON. Keep these variants separate: one polygon's geometry-group assignment differs between the canonical Zenodo and repository exports; text/aggregate Data Week files also have different byte sizes. Notebooks are documentation and were not executed.

## 2. 1740 Catastici / 1741-labelled processing material

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\1740_Catastici_2026-05-12.geojson` — **46,730,299 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\1740_Catastici_2026-05-12.tsv` — **9,448,321 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\README.md` — **6,735 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\1740_catastici_version20250625.geojson` — **32,824,244 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740_redrawn_parishes_cleaned_wikidata_standardised.geojson` — **106,216 bytes**

- Newer dedicated repository: **32,361 Point features** in EPSG:32633; matching TSV has 32,361 rows, with `x`/`y` coordinate columns. Points are manually interpreted locations of property entries, not per-building/per-parcel boundary polygons. The README advertises a CRS84 export but it is absent from both local ZIP and extracted snapshot.
- Older Data Week version: **32,676 Point features**, EPSG:32633; 2025-06-25 and 2026-05-12 in filenames are data-production/version dates. There is no per-record historical date column.
- Records describe owners (`owner_name`), tenants (`ten_name`), property use (`function`), annual revenue (`an_rendi`), location (`place`, `parish_std`, `sestiere`), standardized owner/shop categories. `PP_Function_GEOMETRY` describes physical level/fraction, **not polygon geometry**. Schema details in Appendix B.
- `uid` identifies a transcription entry, often parish code plus number and suffix. `id_napo` is documented as identifier(s) of corresponding 1808 parcels. **Its exact target identifier cannot be safely assumed.** The newer export has 10,743 non-null strings; splitting only commas/semicolons gives 10,747 tokens, 4,637 distinct. 10,334 tokens exactly match canonical 1808 `geometry_id` values; 10,333 also match `parcel_id` values, so numeric overlap does not validate the key. Some strings are `?`, `casa`, `Galion`, `8151 8152`, `4941.0` or `135758`.
- A concrete semantic warning: `AGN-0019` has `id_napo = "14768"`; joining this to canonical 1808 `geometry_id = 14768` yields **San Polo**, parcel 9129, `Sottoportico Ruga degli Orefici`, rather than the 1740 Sant'Agnese/Dorsoduro location. This is evidence that a bare numeric equality is not a verified cross-register join. Retain exact original tokens; obtain the identifier crosswalk or validate by district/location and source before assigning 1740 evidence to an 1808 polygon.
- 73 redrawn parish polygons (70 Polygon, 3 MultiPolygon), CRS84: `NAME`, `alt_name`, `id`, `SESTIERE`, `church`, Wikidata-name fields and `area`; only dataset-level 1740 context, no building date.
- Processing folder includes 1741-labelled XLSX/JSON intermediate owner-disambiguation datasets: standard 33,297 rows; expanded 38,218 rows (splits/owner expansions), not independent historical buildings. Preprocessing JSON also has 33,297 rows; pattern JSON has 4,658 records. `1741` is a project/register label; do not silently reconcile it into an exact per-entry observation date. No date column appears in those actual schemas. Dictionaries, notebooks, MD/PDF documentation and three images support processing, not historical map tiles. Source scan paths `path_img` / `tif_path_img` are references; the archival TIFF scans are not locally included.
- Language: historical Italian/Venetian transcription; English operational names and shop translations; Latin/Italian entity dictionaries. No explicit dataset reuse licence found in either repository snapshot.

## 3. 1857 commercial guide

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\1857_commercial_guide_with_pages_20250624.csv` — **1,501,744 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\1857_Nuova_Guida_commerciale_della_citta_di_Venezia.pdf` — **18,132,651 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\README.md` — **2,482 bytes**

CSV: **5,883 entries**, each a professional/business/address entry; 383-page source PDF. `geometry` contains WKT Point longitude/latitude, not building polygons. Operational `index`; location candidates `DISTRICT` + `NUM` + `LOC_STR` / `LOC_PAR` / `NORM_PARISH`; `PAGE_NUM` locates the printed source page (README says add 7 for PDF page). These are address matching inputs, not a documented join to an 1808 `geometry_id` or 2024 `EDIFI_ID`.

`geometry_from` actual values: contemporary 5,277; cadaster 321; interpolation 233; manuel 27; empty 25. Contemporary door location is not proof of the same building existing in 1857. The guide is a **1857 register/edition observation**; `20250624` is CSV production date. No per-record historical date/construction field. The README explicitly says transcription of **part** of the guide, so completeness of the full source volume is not claimed. Actual translation fields are `profession_eng`, `category_eng` (not README's `_en`). Primarily Italian, with English standardized translations. Source PDF's Google Books notice makes both a public-domain statement and file-use requests; no separate licence for the derived CSV was found.

## 4. Contemporary 2024 geometry layer — with hidden historical prose

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Canals_EPSG32633.geojson` — **1,268,100 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Civici_EPSG32633.geojson` — **6,728,890 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Edifici_EPSG32633.geojson` — **14,442,426 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Isole_EPSG32633.geojson` — **262,593 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Sestiere_EPSG32633.geojson` — **97,373 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Streets_EPSG32633.geojson` — **6,930,875 bytes**

All six GeoJSON layers declare **EPSG:32633**. Buildings: **8,512** features (6,787 MultiPolygon; 1,725 Polygon); addresses 31,623 Points; canals 169 areas; islands 119; districts 8; streets 3,773 areas. The `2024` filename prefix denotes the contemporary dataset, not construction year.

**Important finding not evident from a date-field-only search:** buildings have `description_piamonte` populated on **929 features**, with Italian quoted descriptions and citations to **G. Piamonte, _Venezia vista dall'Acqua_, 1992**, including page references. There is no structured DATE/PERIOD field, but this attribute contains actual, building-linked construction/reconstruction/century evidence. Example records:

- `EDIFI_ID = 15`: “Convento di S. Alvise … **eretto nel 1388** … (CN 3206)” plus a separate Scuola description; source pp.158–159. Distinguish multiple objects aggregated in one polygon record.
- `EDIFI_ID = 22`: “**la costruzione è del 1600** … (CN 2205)”, source p.182. A century-like round year must not automatically become an exact day/year.
- `EDIFI_ID = 31`: “Palazzo Falier. **La prima costruzione è del 1000**, il palazzo fu **ricostruito nel 1105** …”, source p.85. First construction and reconstruction are distinct events.
- `EDIFI_ID = 36`: “La **costruzione cinquecentesca** è attribuita al Sanmicheli.” Period rather than exact year.
- `EDIFI_ID = 19`: **1845** refers to a facade project **not executed**, not actual construction; **1992** is the cited book edition; door numbers are not dates.

A conservative full-file regex for explicit “eretto/costruito/ricostruito/fondato nel YEAR” or “costruzione (è) del YEAR” yields **42 candidate mentions on 40 features, numeric range 1000–1960**. This is a reproducible extraction screen, **not a validated chronological range for all 929 descriptions**, not an exhaustive count of datable buildings, and includes approximate centuries/reconstruction/foundation contexts. More permissive extraction produced a false year **659** from “costruzione al numero 659”; extracting every numeric token is unsafe. Preserve quoted text, event type, original uncertainty and citation, and check identity/component alignment.

Join/identity fields: `EDIFI_ID`, `EDIFI_ID_old`, `CIVICI`, `door_indices`, `osm_ids`, `wikidata`, `ISL_uid`, `NEIGH_uid`; address points have `CIVICI`, `sestiere`, `number`, `letter`. No validated universal historical-register crosswalk is supplied. `style` (449 populated; Gothic/Renaissance/Baroque etc.) is a stylistic classification, not a DATE; `typology` is type; `modified` is a 0/1 string flag on 25 records, **not a modification timestamp**. Rights for this geometry layer and quoted Piamonte text are not established locally; citation does not grant reuse rights.

## 5. Dorigo medieval observations, zones and indices

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\README.md` — **916 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\geometries_generalized.geojson` — **1,054,104 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\centroids.geojson` — **160,210 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\README.md` — **1,613 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\README.md` — **778 bytes**

Source identified by README: W. Dorigo, **_Venezia Romanica_ (2003)**. Folder title `946_1408` is a thematic/source label, **not the observed minimum in downloaded records**.

- **71 entity JSON files** (page/column filenames), total **12,537 records**. Individual `date_start`/`date_end` float years; 12,536 non-null in each, one null record. Actual `date_start` range **976–1408**; `date_end` **978–1408**. Each has 288 distinct non-null values. Dates are observations/ownership/place statements, not building construction. `date_comment`: unsure 68, before 13, or 4, after 1, and 1 (87 total). Preserve these qualifiers; an interval or “before” is not an exact observation year.
- **71 XLSX tables**: effective observation rows correspond to the JSON 12,537 records; XML contains 100 additional blank/styled rows, which must not be counted as observations. `dates_start` and `dates_end` are the corresponding numeric year cells; source raw `data`, `dates_comment`, `sources`, `parcel_numbers`, `map_number`, `page`, `derived_from_row`; raw spatial text `informazioni urbinistico-edilizie`, ownership `proprietà`. Observation text is Latin, ownership annotations Italian. JSON versions tokenize `spatial_information`/`ownership` and add fuzzy entity `matches`.
- **Generalized zones:** 693 features (691 Polygon, 2 MultiPolygon), CRS84; `id`, `start_date`, `end_date`. 677 features have date fields, 16 are null. Start values represent earliest observations, ranging **976–1378**; end values latest observations **1145–1408**. Raw minimum start is `976-01-01T00:00:00Z` (three-digit year, not four-digit ISO form); do not silently treat this as valid strict ISO. January 1 / December 31 are year envelopes, not source evidence for an exact day.
- **Centroids:** 693 Points, CRS84; same fields/count/date-year ranges, padded `0976…+00:00` format. These are an alternative zone representation, not individual building points. **20 zone IDs have different start/end years between centroids and polygons**, beyond formatting; reconcile against source observations before analysis.
- **26 quarter GeoJSON files:** detailed geometries, documented Monte Mario CRS; zone field `number`. Actual per-file CRS/types/attributes in Appendix B. No date column in these detailed geometry files.
- **Join:** use `map_number` plus each parsed value in `parcel_numbers` to form generalized `id` (`scanned-map-page_zone`). `area_code` is raw/unclean; use standardized `parcel_numbers`. Link to detailed quarter filename/page and `number` where present. Zone code is **not an 1808/2024 cadastral parcel identity**; no direct modern-building crosswalk.
- **Five index JSON files:** personal names, world/Venice place names, peculiar feature names, `pages` and `vedi_anche` references. Auxiliary matching vocabulary and viewer HTML are not independently dated geometries.

Usable as dated **zone-associated observations with cited source**, not a ready per-building age layer, and not proof that every building in the zone existed at its earliest observation. No explicit licence found; a modern 2003 book and derivative extraction require separate rights assessment.

## 6. TimeMachine Atlas: vectors, coverage and date semantics

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\decoded_z14_all_layers.geojson` — **21,771,368 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\venice_atlas_downloaded.mbtiles` — **4,796,416 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\search.json` — **114,964 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tilejson.json` — **2,927 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\index.html` — **4,710 bytes**

**These are vector data, not map images.** All **165 PBF files** were freshly decoded as Mapbox vector tiles; layers are `building`, `waterway`, `landuse`, `landcover`. Exact PBF paths/sizes are in Appendix A. Downloaded zoom counts: z13 6, z14 12, z15 35, z16 **112 physical nonempty PBF files**; five confirmed empty z16 positions exist only as zero-byte tile payloads in MBTiles (170 tile rows total). The manifest's z16 117 is positions/rows, not 117 on-disk PBF files.

MBTiles is a **locally reconstructed SQLite container**, not the original publisher `timemachine.mbtiles`. The metadata `basename` and `filesize = 4857856` in TileJSON describe the remote original; local file is 4,796,416 bytes. `tiles` table: `zoom_level`, `tile_column`, `tile_row`, `tile_data`; TMS rows must be flipped to XYZ. Nonempty compressed/decompressed payloads were compared to every standalone PBF: all match. SQLite `integrity_check` returned `ok`. Do not compare compressed MBTiles payload byte lengths directly to uncompressed PBF sizes.

TileJSON declares EPSG:3857, maxzoom16, bounds `[12.30091, 45.41917, 12.36785, 45.44917]`; only the Venice historic-centre footprint, not the entire municipality. The download README says positions at zoom0–12 returned out-of-bounds and all published-bounds positions at z13–16 were enumerated. This is a bounded downloaded tile snapshot, not a claim to the publisher's full original file. `mtime = 1540295827594` is metadata timestamp, not a building date.

### Actual years and fields

Decoded z14 GeoJSON: **49,969 tile features**, **47,430 building features**. Source layer/tile provenance `_source_layer`, `_source_tile` retained, geometries converted to longitude/latitude. All zooms overlap and tiles clip features, so feature counts cannot be added to obtain unique buildings.

| Layer, z14 | Features | `start_date` observed range | `end_date` observed range | Other event fields |
|---|---:|---|---|---|
| building | 47,430 | 365–2016 (all populated) | 1350–2016 (24,835 populated) | `transform_date` 1106–1863 (85 features); `fire_date` 976–1630 (47 features) |
| waterway | 1,520 | 800–1899 | 1350–2018 | none |
| landuse | 871 | 800–2016 | 1350–2016 | none |
| landcover | 148 | 800–1100 | 1100–1350 | none |

Thus **raw temporal attributes span 365–2018**, but this is not a continuous series of observed maps or confirmed construction years. Building `start_date = 365` is a suspect outlier (search identifies “Madonna dell'Orto”, convento); it is reported literally, not repaired. The repeated state boundaries are 800, 1100, 1350, 1500, 1808, 2016; waterways have 1899–2018 representation. Full actual distinct numeric values and counts by zoom/layer are in Appendix C.

At z14, **23,428 building tile features** have `start_date=1808`, with corresponding `end_date=2016`; **22,595** have `start_date=2016` and no end. These dominate the layer, compelling evidence of historical-state/visualization validity rather than construction in those years. 1350/1100 groups likewise may be reconstructed survey/state intervals. Missing `end_date` means no recorded upper bound, not demolition never happened.

Sparse named-building examples:

- San Giobbe, `shp_id=95476`: start1378, end1808, transform1450, source tile14/8752/5864.
- San Girolamo, `shp_id=102559`: start1380, end1808, transform1705, fire1456, same tile.

`fire_date` and `transform_date` are clearly building-level attributed candidate events, but no locally saved definition/citation explains how each was established. They are **not construction or first-mention fields by name**, and transformation must not be equated to original erection. For non-snapshot start years, construction versus foundation versus earliest mention is not resolved by the saved TileJSON; use only as unverified candidate dates until independently sourced.

Search index: **342 records**, `start_year` 365–1700 (all), `end_year`1451–1916 (29 populated;313 null), plus `name`, `id`, `class`, `envelope` WKT in projected map coordinates and `center` longitude/latitude. Five `id` null. Candidate join `search.id` to `building.shp_id`, but identifier reuse/history/clipping must be checked; not a stable modern-building identity. Search years describe selected named objects, not all map editions or all buildings. Attribution statements in TileJSON/index are not a blanket redistribution licence for historical vectors.

## 7. Municipal documents, Tassini and rights

### Municipal PDFs

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\NTA_Citta_Antica.pdf` — **622,881 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\NTA_Appendice_1.pdf` — **1,130,274 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\elaborati_di_analisi.pdf` — **424,977 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\San_Servolo_A5_ages.pdf` — **542,003 bytes**

- `NTA_Citta_Antica.pdf`:64 pages, planning/regulatory prose and typological rules, not individually geolocated dated building rows. Metadata dates2018/2019 are PDF production/update dates. “data della sua costruzione” appears in legal classification discussion, not an exported building field.
- `NTA_Appendice_1.pdf`:99 pages, **63 typological/open-space sheets**, not63 identified buildings. Text explicitly says “TESTO AGGIORNATO AL03/07/2019” (regulation update). Preottocentesca (pre19th century), ottocentesca (19th), novecentesca (20th) classes; types A/A1/B/Bg/B1/C/D/pt/fa are pre19th residential classes, O/Or19th, N/Ne/Nr20th, other special/non-residential codes with similarly broad periods. Definitions alone cannot assign a period to an arbitrary building polygon.
- `elaborati_di_analisi.pdf`:21 pages, analysis inventory/legend. “ALLEGATO ALLA DELIBERA DI ADOZIONE … C.C.n°277 del02/12/1996” is planning adoption date. Tav8a categories include “Persistenze di unità edilizie preottocentesche…”, transformed pre19th footprints, unclassified and new19th/20th constructions. Individual A8a map sheets and citywide feature export are **absent**.
- `San_Servolo_A5_ages.pdf`:one-page graphical typology/age sheet for San Servolo only. Extracted heading “Tipologie edilizie e classi di età degli edifici”, legend “DATAZIONE EDIFICI”; textual classes are20th-century,19th-century with major20th-century reconstruction,19th-century, pre19th-century. This supplies broad cartographic building-age evidence after manual map reading/georeferencing/assignment, **not a machine-readable date-per-feature schema**. PDF metadata creation2026-01-07 is scan/PDF production, not building survey. No exact per-building construction-year table was found.

No explicit reusable licence or rights grant appears in the extracted text/metadata of the four municipal PDFs; official availability does not by itself establish redistribution terms. Municipality source URLs are recorded in the manifest/root README.

### Tassini toponymy

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\A-C.txt` — **417,734 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\Toponomastica Veneziana.pdf` — **4,070,980 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\Toponomastica Veneziana.txt` — **1,854,758 bytes**
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\Toponomastica Veneziana_with_pages_delim.txt` — **1,876,782 bytes**

434-page PDF and Italian plain-text versions of _Toponomastica Veneziana_: unstructured place/building-history prose with potentially useful historical mentions and dates. No per-record DATE schema, coordinates or durable building/parcel join keys. A-C text is explicitly a subset by filename; page-delimited full text is an alternate representation. Individual dates must be extracted with their subject and source, not presented as a parsed building-age dataset. PDF creation2015-09-30 is file production; no explicit reuse licence for the digital transcription found.

### Exact local rights statements

1. **Canonical1808 publisher metadata:**
`D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\zenodo_record.json` — **8,899 bytes**
   At `metadata.license`: **`{"id": "cc-by-4.0"}`**; at `metadata.access_right`: **`"open"`**; DOI`10.5281/zenodo.20715172`, version1.1. This supports attribution-based reuse of that canonical release. The saved metadata is the licence evidence, not an inferred licence from GitHub visibility. The root README independently states: “Each file verified against the publisher's MD5 checksum. **CC BY4.0.** The dataset records cadastral state in1808, not construction in that year.”

2. **Atlas attribution, not a historical-dataset licence:**
`D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tilejson.json` — **2,927 bytes**
   `attribution` exactly: `<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>`.

`D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\index.html` — **4,710 bytes**
   Visible-source anchor: `<a href="https://www.maptiler.com/license/maps/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>`.
   Saved MBTiles description: “Historical states. Dates are not necessarily construction/demolition dates; source redistribution license not established.” Root README: “A redistribution license for the historical Atlas dataset was not established; keep separate from CC BY data and do not assume the software's license covers the data.” Attribution to OpenStreetMap is not evidence that every historical layer is solely OSM or licensed under the same terms.

3. **1857 scan, printed Google Books notice, PDF page1:**
`D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\1857_Nuova_Guida_commerciale_della_citta_di_Venezia.pdf` — **18,132,651 bytes**
   “Ha sopravvissuto abbastanza per non essere più protetto dai diritti di copyright e diventare di pubblico dominio.”
   “La classificazione di un libro come di pubblico dominio può variare da paese a paese.”
   “Non fare un uso commerciale di questi file … ti chiediamo di utilizzare questi file per uso personale e non a fini commerciali.”
   “Non inviare query automatizzate”; “Conserva la filigrana … Non rimuoverla.”
   These are the notice's public-domain statement and file-use requests, quoted separately without resolving their legal enforceability. They are not an explicit licence for the derivative CSV.

4. **Other repository sources:** no LICENSE/COPYING file or explicit data reuse grant found among any ZIP members/extracted files. The root README states: “Check individual licenses; an explicit reusable license was not established for all repositories.” Canonical1808 files proven byte-identical to the CC BY release can be sourced under that release's provenance; this does **not** automatically license differing variants, dictionaries, notebooks,1740,Dorigo,2024 or book-derived text. None is declared freely reusable here.

## 8. Integrity, missing scope, duplicate data and schema problems

### Verification actually performed

- Parsed every JSON/GeoJSON and notebook JSON: no parse errors. CSV/TSV were fully read; geometry CSV required a raised CSV field-size limit because WKT exceeds131,072 characters (a reader-limit issue, **not corruption**).
- All165 standalone PBFs decoded without errors. Local MBTiles integrity `ok`; every nonempty row matched its standalone PBF after decompression/TMS flip. Five zero payloads are intentional/source-confirmed empties, **not truncated downloads**.
- All7 PDFs opened and every page's text was read (not a visual certification of every map/scan). All3 PNG/JPEG images passed PIL verification; these are processing diagrams, not historical-map rasters.
- All3 ZIPs passed full CRC `testzip()`, with3,18,281 actual file members respectively. Every extracted file matched its ZIP member byte-for-byte. Manifest members may include directory entries, so counts4/20/etc. need not be file counts.
- Recomputed SHA-256 for all490 files; all manifest entries carrying verified SHA-256/byte assertions matched. All6 publisher-listed canonical1808 files matched the saved Zenodo MD5 checksums.
- XLSX files opened via ZIP/XML (73 workbooks); blank inline strings initially exceeded the simple reader's assumption, then were handled successfully. Not evidence of file corruption.

### Incomplete or absent material

- 1740 README's `1740_Catastici_2026-05-12_crs84.geojson` is absent from its local ZIP/extraction: projected geometry and TSV are present, geographic alternate export is not. No incomplete JSON was substituted.
- Municipal `classification_schema.json`, `classification_query.json`, `analysis_page.html` are failed requests recorded in `verification_summary.json`/manifest, **not actual files here**. HTTP403/WAF errors documented; no building-date layer exported. A8a individual sheets missing. Full citywide period assignment cannot be made from legends alone.
- Original publisher Atlas MBTiles not downloaded; local reconstructed MBTiles clearly marked. No tile zoom0–12 files; source returned out-of-bounds according to saved acquisition evidence. Scope limited to published historic-centre bounds.
- 1857 CSV explicitly partial transcription;25 records have empty geolocation method. Dorigo has one missing record date,16 zones without date bounds, and20 polygon/centroid temporal discrepancies. 1740 `id_napo` has malformed/non-numeric/ambiguous links. These are content/coverage issues, not byte corruption.
- No Parquet files, archival TIFF map scans, GeoTIFFs, shapefiles, or historical-map JPEG/PNG sheets present. The three actual images are project documentation diagrams. Earlier Veneto observation/edition-year archives mentioned in the root README are **outside this inspected root**, not present datasets here.

### Byte-identical duplicate files

The following groups were confirmed by SHA-256. They are repeated exports/representations, not independent historical observations:

- SHA-256`0bc71fd7db170e32bf3b7fe8aacb605eb03aa33410b9a003ba26984e849b755c`:
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_aggregated_data.json` — **75,969,502 bytes**
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_aggregated_data.json` — **75,969,502 bytes**
- SHA-256`c9433910c377ce9d20a5224c26d73a245a8f414c18133fb836cfa6684bd879a5`:
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_merge_log.json` — **2,724,903 bytes**
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_merge_log.json` — **2,724,903 bytes**
- SHA-256`b8d9526b8e0da05d02489deeab007efcb97ddfb29a6c988a73a57caf905d0081`:
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_standardised_people.json` — **3,938,260 bytes**
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_standardised_people.json` — **3,938,260 bytes**
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\venice_1808_landregister_standardised_people.json` — **3,938,260 bytes**
- SHA-256`94573eeb1715d895cc425f854b4570fa74a14bfa2ea8d5c604a6212c7d735f2e`:
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_textual_entries.json` — **28,237,771 bytes**
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_textual_entries.json` — **28,237,771 bytes**
- SHA-256`144775c748b0bac22b7388ad603f8c5d0dc9513f31e99f2b46a4215fb5aacc8d`:
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_geometries.geojson` — **12,903,989 bytes**
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\venice_1808_landregister_geometries.geojson` — **12,903,989 bytes**
- SHA-256`ebaed4c5c766ccb1df2373eac2184a03bf62e628c4ddb55106b7e2831c8823da`:
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_STD.json` — **24,049,565 bytes**
  - `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step8.json` — **24,049,565 bytes**

Further non-byte-identical duplicates/versions:
- Canonical1808 geometry differs from repository geometry in exactly **one feature** (index807, `properties.id=way/11957`): canonical `geometry_id="16827"`, repository null. All other feature content is equal. Keep provenance; do not overwrite/collapse variants silently.
- Data Week text/aggregate are96 bytes larger than canonical counterparts; these are variants of the same1808 source, not additional dates. ZIP snapshots duplicate the extracted datasets by design.
- Standard1741 JSON and step8 are identical; expanded owner rows are not new parcels. Dorigo entity JSON/XLSX and polygons/centroids are parallel representations; compare date disagreement before collapsing. Atlas multizoom/clipped/historical-state features must not be counted as unique buildings.

## 9. Practical evidence decision

| Intended claim | Locally usable source | What can actually be said | Remaining gate |
|---|---|---|---|
| Actual construction/reconstruction or broad building period | 2024 buildings `description_piamonte` | Quoted source-cited statement for selected `EDIFI_ID`s, separate event types | Manual extraction, component identity, original source and rights review |
| Building transformation/fire candidate | Atlas building `transform_date`/`fire_date` | Attributed numeric event-year candidate attached to a vector building | No per-event citation/definition saved; independently verify; rights unresolved |
| Earliest building mention | None universally verified | Dorigo is zone observation; Atlas starts are mixed state/candidate years | Subject-specific source reading; do not rename fields to “first mention” |
| Parcel/building present at1808 cadastral snapshot | Canonical1808 geometry/text join | Shape, register use/ownership in1808 | Match target building over time; CC BY4.0 attribution |
| Property use/ownership at1740 register snapshot | 1740 point/entry | Location-interpreted record in1740 dataset context | Resolve `id_napo` crosswalk; no exact construction year; rights unresolved |
| Address business/profession at1857 | 1857 CSV plus source page | Recorded profession/location in1857 guide | Historical address/geolocation validation; partial coverage; rights review |
| Medieval ownership/place observation | Dorigo dates/source and zone link | Observation/interval associated with historical zone | Not cadastral building identity; preserve qualifiers and discrepant bounds |
| Broad period assigned to San Servolo buildings | San Servolo A5 graphic | Pre19th/19th/20th-century map classes | Manual map interpretation/georeferencing; no per-feature export; rights unresolved |
| Citywide municipal building-age classification | Not locally available | Definitions/legend only | Obtain actual classifications/individual maps |

## Appendix A — every existing file, absolute path and exact size

No inferred/unavailable file is included below. Files are grouped by relative parent directory; every row itself gives a full absolute path.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\download_root.txt` | 52 | Text / OCR / reference |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\manifest.json` | 70,034 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\README.md` | 3,981 | Markdown documentation |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\verification_summary.json` | 1,864 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\README.md` | 12,153 | Markdown documentation |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_aggregated_data.json` | 75,969,502 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_geometries.geojson` | 12,903,992 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_merge_log.json` | 2,724,903 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_standardised_people.json` | 3,938,260 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_textual_entries.json` | 28,237,771 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\zenodo_record.json` | 8,899 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\decoded_z14_all_layers.geojson` | 21,771,368 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\index.html` | 4,710 | HTML viewer / saved page |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\search.json` | 114,964 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tilejson.json` | 2,927 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\venice_atlas_downloaded.mbtiles` | 4,796,416 | SQLite vector MBTiles (local assembly) |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4375`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4375\2932.pbf` | 2,356 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4375\2933.pbf` | 1,439 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4376`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4376\2932.pbf` | 1,300,465 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4376\2933.pbf` | 82,701 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4377`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4377\2932.pbf` | 146,745 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\13\4377\2933.pbf` | 16,161 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8751`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8751\5864.pbf` | 328 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8751\5865.pbf` | 1,320 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8751\5866.pbf` | 693 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8752`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8752\5864.pbf` | 87,058 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8752\5865.pbf` | 471,520 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8752\5866.pbf` | 37,743 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8753`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8753\5864.pbf` | 102,930 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8753\5865.pbf` | 1,058,483 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8753\5866.pbf` | 58,516 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8754`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8754\5864.pbf` | 3,783 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8754\5865.pbf` | 160,644 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\14\8754\5866.pbf` | 16,401 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17503`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17503\11729.pbf` | 114 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17503\11730.pbf` | 1,033 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17503\11731.pbf` | 666 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17503\11732.pbf` | 371 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17503\11733.pbf` | 258 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17504`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17504\11729.pbf` | 528 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17504\11730.pbf` | 7,871 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17504\11731.pbf` | 25,441 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17504\11732.pbf` | 7,895 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17504\11733.pbf` | 373 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17505`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17505\11729.pbf` | 89,547 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17505\11730.pbf` | 218,369 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17505\11731.pbf` | 278,425 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17505\11732.pbf` | 32,887 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17505\11733.pbf` | 205 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17506`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17506\11729.pbf` | 98,307 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17506\11730.pbf` | 463,518 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17506\11731.pbf` | 359,216 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17506\11732.pbf` | 45,756 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17506\11733.pbf` | 235 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17507`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17507\11729.pbf` | 5,849 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17507\11730.pbf` | 214,545 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17507\11731.pbf` | 174,910 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17507\11732.pbf` | 12,289 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17507\11733.pbf` | 1,610 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17508`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17508\11729.pbf` | 2,229 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17508\11730.pbf` | 19,134 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17508\11731.pbf` | 144,969 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17508\11732.pbf` | 3,116 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17508\11733.pbf` | 1,302 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17509`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17509\11729.pbf` | 402 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17509\11730.pbf` | 3,691 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17509\11731.pbf` | 14,013 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17509\11732.pbf` | 13,514 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\15\17509\11733.pbf` | 628 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007\23459.pbf` | 114 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007\23460.pbf` | 284 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007\23461.pbf` | 723 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007\23462.pbf` | 757 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007\23463.pbf` | 224 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007\23464.pbf` | 223 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35007\23465.pbf` | 160 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23458.pbf` | 160 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23459.pbf` | 213 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23460.pbf` | 1,350 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23461.pbf` | 1,984 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23462.pbf` | 1,859 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23463.pbf` | 1,244 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23464.pbf` | 1,194 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23465.pbf` | 277 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35008\23466.pbf` | 129 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23458.pbf` | 171 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23459.pbf` | 389 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23460.pbf` | 1,019 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23461.pbf` | 7,004 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23462.pbf` | 8,546 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23463.pbf` | 21,950 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23464.pbf` | 7,603 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23465.pbf` | 1,303 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35009\23466.pbf` | 194 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23458.pbf` | 250 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23459.pbf` | 34,875 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23460.pbf` | 23,203 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23461.pbf` | 45,808 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23462.pbf` | 75,103 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23463.pbf` | 47,568 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23464.pbf` | 10,982 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23465.pbf` | 1,527 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35010\23466.pbf` | 145 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23458.pbf` | 1,380 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23459.pbf` | 69,493 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23460.pbf` | 94,732 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23461.pbf` | 103,229 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23462.pbf` | 125,599 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23463.pbf` | 98,304 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23464.pbf` | 16,761 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23465.pbf` | 11,245 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35011\23466.pbf` | 173 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23458.pbf` | 2,456 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23459.pbf` | 86,864 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23460.pbf` | 117,621 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23461.pbf` | 150,249 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23462.pbf` | 115,455 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23463.pbf` | 100,804 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23464.pbf` | 23,446 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35012\23465.pbf` | 11,436 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23458.pbf` | 320 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23459.pbf` | 29,618 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23460.pbf` | 132,442 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23461.pbf` | 156,534 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23462.pbf` | 147,791 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23463.pbf` | 74,848 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23464.pbf` | 11,091 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23465.pbf` | 10,231 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35013\23466.pbf` | 154 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23458.pbf` | 333 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23459.pbf` | 904 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23460.pbf` | 59,187 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23461.pbf` | 126,474 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23462.pbf` | 112,453 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23463.pbf` | 4,336 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23464.pbf` | 7,632 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23465.pbf` | 4,664 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35014\23466.pbf` | 1,424 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23458.pbf` | 1,434 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23459.pbf` | 4,560 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23460.pbf` | 2,087 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23461.pbf` | 63,946 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23462.pbf` | 83,625 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23463.pbf` | 2,341 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23464.pbf` | 3,558 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23465.pbf` | 137 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35015\23466.pbf` | 159 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23458.pbf` | 505 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23459.pbf` | 1,790 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23461.pbf` | 16,994 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23462.pbf` | 38,756 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23463.pbf` | 37,465 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23464.pbf` | 419 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23465.pbf` | 323 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35016\23466.pbf` | 206 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23458.pbf` | 154 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23460.pbf` | 165 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23461.pbf` | 4,633 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23462.pbf` | 35,026 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23463.pbf` | 68,769 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23464.pbf` | 3,290 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23465.pbf` | 284 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35017\23466.pbf` | 1,248 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23458.pbf` | 155 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23459.pbf` | 143 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23460.pbf` | 667 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23461.pbf` | 3,738 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23462.pbf` | 6,447 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23463.pbf` | 9,695 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23464.pbf` | 12,694 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23465.pbf` | 811 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35018\23466.pbf` | 183 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23458.pbf` | 282 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23459.pbf` | 315 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23460.pbf` | 165 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23461.pbf` | 483 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23462.pbf` | 560 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23463.pbf` | 1,052 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23464.pbf` | 3,240 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23465.pbf` | 907 | Mapbox vector tile PBF |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\tiles\16\35019\23466.pbf` | 403 | Mapbox vector tile PBF |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\elaborati_di_analisi.pdf` | 424,977 | PDF document / graphical map |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\NTA_Appendice_1.pdf` | 1,130,274 | PDF document / graphical map |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\NTA_Citta_Antica.pdf` | 622,881 | PDF document / graphical map |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\municipal\San_Servolo_A5_ages.pdf` | 542,003 | PDF document / graphical map |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister.zip` | 4,429,191 | ZIP repository snapshot |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister.zip` | 11,663,091 | ZIP repository snapshot |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data.zip` | 77,787,653 | ZIP repository snapshot |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\1740_Catastici_2026-05-12.geojson` | 46,730,299 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\1740_Catastici_2026-05-12.tsv` | 9,448,321 | TSV register and coordinates |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\README.md` | 6,735 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\README.md` | 12,115 | Markdown documentation |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_aggregated_data.json` | 75,969,502 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_geometries.csv` | 8,828,028 | CSV table; WKT geometry where present |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_geometries.geojson` | 12,903,989 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_merge_log.csv` | 611,213 | CSV table; WKT geometry where present |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_merge_log.json` | 2,724,903 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_standardised_people.csv` | 722,852 | CSV table; WKT geometry where present |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_standardised_people.json` | 3,938,260 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_textual_entries.csv` | 8,479,191 | CSV table; WKT geometry where present |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_textual_entries.json` | 28,237,771 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\1_alignement&generation.ipynb` | 13,546 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\2_align_pages_and_parcel_numbers.ipynb` | 32,513 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\3_new_transcription.ipynb` | 9,077 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\4_Church_standardisation_part1.ipynb` | 3,792 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\5_aggregated_version_production.ipynb` | 4,007 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\6_institution_standardisation.ipynb` | 26,713 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\7_institution_standardisation_from_isabella.ipynb` | 27,142 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\scripts\8_last_cleanup_and_misc.ipynb` | 35,697 | Jupyter processing/documentation notebook |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\.gitignore` | 11 | Repository configuration |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740_redrawn_parishes_cleaned_wikidata_standardised.geojson` | 106,216 | GeoJSON vectors |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\1740_catastici_version20250625.geojson` | 32,824,244 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\README.md` | 2,404 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\README.md` | 4,771 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\az_documentation`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\az_documentation\Catastici 1741 - Project Documentation.md` | 26,573 | Markdown documentation |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\az_documentation\Catastici 1741 - Project Documentation.pdf` | 845,384 | PDF document / graphical map |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\az_documentation\images`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\az_documentation\images\Entity Mapping - Catastici 1741.jpg` | 423,120 | JPEG processing diagram |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\az_documentation\images\entity_types.png` | 91,379 | PNG processing diagram |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\az_documentation\images\family_ownership.png` | 71,091 | PNG processing diagram |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\catastici_1741_STD.xlsx` | 5,365,640 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\catastici_1741_STD_expanded.xlsx` | 6,144,641 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\README.md` | 2,227 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_STD.json` | 24,049,565 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_STD_expanded.json` | 28,340,115 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step1.json` | 22,654,823 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step2.json` | 22,654,115 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step3.json` | 22,665,126 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step4.json` | 22,839,220 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step5.json` | 23,267,073 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step6_patterns.json` | 1,867,396 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step7.json` | 23,474,565 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step8.json` | 24,049,565 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_pre-processing`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_pre-processing\catastici_20240123.json` | 16,909,660 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\README.md` | 9,015 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\entities.json` | 45,217 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\guild_entities.json` | 895 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\jew_entities.json` | 533 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\religious_entities.json` | 13,154 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\religious_titles_entities.json` | 10,881 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\scuole_grandi_entities.json` | 3,374 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\scuole_mestieri_entities.json` | 1,319 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\scuole_religious_entities.json` | 1,671 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\social_care_entities.json` | 3,600 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\unlinked_entities.json` | 6,413 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\venezia_entities.json` | 1,349 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\ENT_dictionary\venezia_titles_entities.json` | 1,790 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\MSC_dictionary`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\MSC_dictionary\cities.json` | 1,387 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\MSC_dictionary\ignore_next.json` | 4,334 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\MSC_dictionary\places.json` | 2,558 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\MSC_dictionary\separators.json` | 190 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\MSC_dictionary\unknown_owners.json` | 1,935 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\family_names.json` | 84,903 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\family_names_comp.json` | 225 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\first_names.json` | 27,587 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\mestieri.json` | 1,373 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\titles.json` | 18,667 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\titles_plur.json` | 1,600 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\titles_sing.json` | 10,213 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\unknown_relatives.json` | 1,793 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\unknown_relatives_plur.json` | 1,186 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\PPL_dictionary\unknown_relatives_sing.json` | 610 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions\mestieri_to_mentions.json` | 7,250 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions\religious_to_mentions.json` | 35,158 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions\scuole_grandi_to_mentions.json` | 3,619 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions\scuole_mestieri_to_mentions.json` | 1,752 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions\scuole_religious_to_mentions.json` | 3,363 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions\social_care_to_mentions.json` | 4,830 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\entities_to_mentions\venezia_to_mentions.json` | 5,015 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\people_to_mentions`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\people_to_mentions\family_name_groups.json` | 306,862 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\people_to_mentions\mestieri_to_std.json` | 3,520 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\people_to_mentions\title_plur_to_sing.json` | 1,963 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\dictionaries\std_mappings\people_to_mentions\title_to_std.json` | 46,556 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\1-SetUp_Dataset.ipynb` | 5,569 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\10-Statistics&Insights.ipynb` | 1,211,881 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\2-Unknowns_Assignation.ipynb` | 6,673 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\3-RepubblicaVenezia_Assignation.ipynb` | 11,189 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\4-Entity_Assignation.ipynb` | 14,046 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\5-People_Assignation.ipynb` | 16,495 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\6-Assignation_NER_Model.ipynb` | 16,655 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\7-Model_Patterns_Assignation.ipynb` | 37,388 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\8-Terminology_Standardisation.ipynb` | 21,238 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\9-Format_Verification.ipynb` | 6,800 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\pipeline\README.md` | 12,808 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\utils`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\utils\utils.py` | 2,629 | Python processing source |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\utils\utils_entities.py` | 2,419 | Python processing source |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\utils\utils_people.py` | 12,083 | Python processing source |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\utils\UtilsCommonString.ipynb` | 7,645 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\utils\UtilsFormatting.ipynb` | 19,616 | Jupyter processing/documentation notebook |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\utils\UtilsSearch.ipynb` | 2,048 | Jupyter processing/documentation notebook |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\README.md` | 9,632 | Markdown documentation |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\venice_1808_landregister_aggregated_data.json` | 75,969,598 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\venice_1808_landregister_geometries.geojson` | 12,903,989 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\venice_1808_landregister_standardised_people.json` | 3,938,260 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\venice_1808_landregister_textual_entries.json` | 28,237,867 | JSON data / metadata / processing intermediate |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\1857_commercial_guide_with_pages_20250624.csv` | 1,501,744 | CSV table; WKT geometry where present |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\1857_Nuova_Guida_commerciale_della_citta_di_Venezia.pdf` | 18,132,651 | PDF document / graphical map |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\README.md` | 2,482 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Canals_EPSG32633.geojson` | 1,268,100 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Civici_EPSG32633.geojson` | 6,728,890 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Edifici_EPSG32633.geojson` | 14,442,426 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Isole_EPSG32633.geojson` | 262,593 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Sestiere_EPSG32633.geojson` | 97,373 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Streets_EPSG32633.geojson` | 6,930,875 | GeoJSON vectors |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\README.md` | 916 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\103_0.json` | 120,165 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\104_2.json` | 105,713 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\105_2.json` | 32,033 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\107_0.json` | 298,258 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\112_2.json` | 170,027 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\115_0.json` | 64,003 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\118_0.json` | 327,297 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\121_1.json` | 77,638 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\123_0.json` | 70,920 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\125_1.json` | 97,675 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\126_2.json` | 78,213 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\129_0.json` | 150,951 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\130_2.json` | 185,787 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\136_0.json` | 163,480 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\137_3.json` | 169,950 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\139_3.json` | 66,428 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\140_2.json` | 125,352 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\141_3.json` | 94,645 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\145_0.json` | 178,625 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\146_3.json` | 66,116 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\147_2.json` | 39,157 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\149_0.json` | 95,880 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\152_2.json` | 202,044 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\154_3.json` | 81,594 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\156_0.json` | 206,326 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\160_2.json` | 78,464 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\165_0.json` | 125,124 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\166_1.json` | 218,934 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\172_0.json` | 247,463 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\174_2.json` | 106,895 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\179_0.json` | 144,401 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\180_2.json` | 107,940 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\181_2.json` | 204,704 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\187_0.json` | 247,082 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\189_2.json` | 228,234 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\193_0.json` | 229,846 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\25_0.json` | 381,733 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\32_0.json` | 119,558 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\34_3.json` | 22,858 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\38_0.json` | 68,490 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\38_3.json` | 151,606 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\42_0.json` | 73,825 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\42_3.json` | 82,650 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\47_0.json` | 178,859 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\48_3.json` | 103,624 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\49_3.json` | 95,148 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\50_3.json` | 171,976 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\56_0.json` | 66,166 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\56_3.json` | 152,341 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\58_1.json` | 95,488 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\59_1.json` | 152,423 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\61_0.json` | 165,501 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\65_0.json` | 167,032 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\66_3.json` | 25,205 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\67_0.json` | 33,784 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\67_2.json` | 61,918 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\72_0.json` | 63,908 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\72_2.json` | 111,595 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\73_3.json` | 139,577 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\75_2.json` | 131,194 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\76_3.json` | 92,627 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\81_0.json` | 64,731 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\81_2.json` | 99,380 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\82_3.json` | 47,547 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\83_1.json` | 161,087 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\87_0.json` | 170,065 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\88_3.json` | 76,320 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\90_0.json` | 140,931 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\93_0.json` | 107,909 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\96_0.json` | 204,158 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\99_0.json` | 142,325 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\additional_lists.txt` | 3,473 | Text / OCR / reference |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\files.json` | 959 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\index.html` | 4,183 | HTML viewer / saved page |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\entities\README.md` | 1,613 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\centroids.geojson` | 160,210 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\geometries_generalized.geojson` | 1,054,104 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\README.md` | 619 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\106_modificato.geojson` | 577,490 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\114_modificato.geojson` | 309,058 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\122_modificato.geojson` | 311,748 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\127_modificato.geojson` | 389,730 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\133_modificato.geojson` | 707,347 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\143_modificato.geojson` | 343,539 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\148_modificato.geojson` | 644,408 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\156_modificato.geojson` | 363,987 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\162_modificato.geojson` | 391,527 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\169_modificato.geojson` | 505,960 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\176_modificato.geojson` | 491,771 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\184_modificato.geojson` | 387,954 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\192_modificato.geojson` | 282,814 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\24_modificato.geojson` | 353,011 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\32_modificato.geojson` | 210,333 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\35_modificato.geojson` | 293,187 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\40_modificato.geojson` | 201,846 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\44_modificato.geojson` | 418,183 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\53_modificato.geojson` | 731,837 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\63_modificato.geojson` | 357,943 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\68_modificato.geojson` | 515,461 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\78_modificato.geojson` | 402,574 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\85_modificato.geojson` | 285,680 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\90_modificato.geojson` | 282,909 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\94_modificato.geojson` | 248,497 | GeoJSON vectors |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\98_modificato.geojson` | 408,314 | GeoJSON vectors |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\indices`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\indices\content_0_entries.json` | 132,873 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\indices\content_1_entries.json` | 787,299 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\indices\content_2_entries.json` | 50,291 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\indices\content_3_entries.json` | 278,896 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\indices\content_4_entries.json` | 119,212 | JSON data / metadata / processing intermediate |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\indices\README.md` | 401 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\103_0.xlsx` | 17,556 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\104_2.xlsx` | 15,192 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\105_2.xlsx` | 8,760 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\107_0.xlsx` | 31,333 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\112_2.xlsx` | 22,935 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\115_0.xlsx` | 11,206 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\118_0.xlsx` | 33,647 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\121_1.xlsx` | 14,258 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\123_0.xlsx` | 13,185 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\125_1.xlsx` | 16,755 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\126_2.xlsx` | 14,816 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\129_0.xlsx` | 19,875 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\130_2.xlsx` | 22,262 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\136_0.xlsx` | 20,489 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\137_3.xlsx` | 21,691 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\139_3.xlsx` | 11,507 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\140_2.xlsx` | 17,120 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\141_3.xlsx` | 13,941 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\145_0.xlsx` | 21,878 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\146_3.xlsx` | 12,198 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\147_2.xlsx` | 9,596 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\149_0.xlsx` | 14,189 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\152_2.xlsx` | 23,878 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\154_3.xlsx` | 13,022 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\156_0.xlsx` | 24,760 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\160_2.xlsx` | 13,080 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\165_0.xlsx` | 18,535 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\166_1.xlsx` | 25,259 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\172_0.xlsx` | 27,607 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\174_2.xlsx` | 15,723 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\179_0.xlsx` | 18,664 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\180_2.xlsx` | 15,302 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\181_2.xlsx` | 25,696 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\187_0.xlsx` | 27,755 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\189_2.xlsx` | 25,540 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\193_0.xlsx` | 29,268 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\25_0.xlsx` | 41,442 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\32_0.xlsx` | 17,313 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\34_3.xlsx` | 8,521 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\38_0.xlsx` | 12,645 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\38_3.xlsx` | 19,539 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\42_0.xlsx` | 12,467 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\42_3.xlsx` | 13,594 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\47_0.xlsx` | 22,000 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\48_3.xlsx` | 15,489 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\49_3.xlsx` | 14,153 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\50_3.xlsx` | 20,703 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\56_0.xlsx` | 12,236 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\56_3.xlsx` | 19,177 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\58_1.xlsx` | 14,450 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\59_1.xlsx` | 19,546 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\61_0.xlsx` | 21,868 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\65_0.xlsx` | 21,678 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\66_3.xlsx` | 8,655 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\67_0.xlsx` | 10,253 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\67_2.xlsx` | 12,539 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\72_0.xlsx` | 11,809 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\72_2.xlsx` | 16,452 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\73_3.xlsx` | 18,878 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\75_2.xlsx` | 18,148 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\76_3.xlsx` | 13,805 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\81_0.xlsx` | 11,770 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\81_2.xlsx` | 15,005 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\82_3.xlsx` | 10,824 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\83_1.xlsx` | 21,048 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\87_0.xlsx` | 20,790 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\88_3.xlsx` | 13,026 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\90_0.xlsx` | 18,202 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\93_0.xlsx` | 15,906 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\96_0.xlsx` | 23,837 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\99_0.xlsx` | 19,400 | Excel tabular records |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\README.md` | 778 | Markdown documentation |

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini`

| Absolute file path | Bytes | Format / role |
|---|---:|---|
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\A-C.txt` | 417,734 | Text / OCR / reference |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\Toponomastica Veneziana.pdf` | 4,070,980 | PDF document / graphical map |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\Toponomastica Veneziana.txt` | 1,854,758 | Text / OCR / reference |
| `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\tassini\Toponomastica Veneziana_with_pages_delim.txt` | 1,876,782 | Text / OCR / reference |

## Appendix B — inspected data schemas and temporal columns

Actual union of fields across complete files, not a README-only contract. Type notation is Python JSON value type: int,float,str,list,dict,NoneType. Different representations/versions are retained. Nulls and omitted fields are distinct. Dates in narrative strings are discussed separately in §4; a regex over field names does not identify all historical evidence.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_aggregated_data.json` — **75,969,502 bytes**

Records/features: **16,870**. 

Fields (actual type:count):

- `geometries`: dict:16,870
- `text`: list:16,870
- `people`: list:16,870

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_geometries.geojson` — **12,903,992 bytes**

Records/features: **24,430**. Geometry types: `{"Polygon": 24430}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}`.

Fields (actual type:count):

- `id`: str:24,430
- `parcel_number`: NoneType:849, str:23,581
- `geometry_type`: str:24,428, NoneType:2
- `geometry_id`: NoneType:848, str:23,582
- `parish_standardised`: NoneType:984, str:23,446
- `area`: float:24,430

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_merge_log.json` — **2,724,903 bytes**

Records/features: **9,312**. 

Fields (actual type:count):

- `merge_log_uid`: str:9,312
- `owner_uid`: str:9,312
- `parcel_id`: str:9,312
- `suddetto`: bool:9,312
- `same_father`: bool:9,312
- `same_mother`: bool:9,312
- `same_siblings`: bool:9,312
- `same_husband`: bool:9,312
- `same_title`: bool:9,312
- `same_other_note`: bool:9,312
- `same_name_only`: bool:9,312

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_standardised_people.json` — **3,938,260 bytes**

Records/features: **12,277**. 

Fields (actual type:count):

- `uid`: int:12,277
- `nucleus_uid`: int:12,277
- `family`: str:12,277
- `name`: str:12,277
- `title`: NoneType:12,158, str:119
- `father`: str:3,539, NoneType:8,738
- `father_is_q`: float:3,539, NoneType:8,738
- `mother`: NoneType:12,275, str:2
- `siblings`: NoneType:11,381, str:896
- `husband`: NoneType:12,084, str:193
- `husband_is_q`: NoneType:12,084, float:193
- `other_notes`: NoneType:11,896, str:381
- `parcel_ids`: list:12,277

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\1808\venice_1808_landregister_textual_entries.json` — **28,237,771 bytes**

Records/features: **23,662**. 

Fields (actual type:count):

- `parcel_id`: int:23,662
- `owner_transcription`: str:22,920, NoneType:742
- `owner_standardised`: str:23,660, NoneType:2
- `owner_standardised_class`: str:3,096, NoneType:20,566
- `owner_wd`: NoneType:22,776, str:886
- `owner_right_of_use`: str:22,784, NoneType:878
- `owner_type`: str:22,851, NoneType:811
- `old_entity`: str:1,040, NoneType:22,622
- `old_entity_standardised`: str:1,014, NoneType:22,648
- `old_entity_standardised_class`: str:1,006, NoneType:22,656
- `old_entity_wd`: NoneType:22,857, str:805
- `old_owner_right_of_use`: str:1,013, NoneType:22,649
- `old_owner_type`: str:9,780, NoneType:13,882
- `old_religious_entity_type`: NoneType:23,234, str:428
- `owner_supplementary`: NoneType:23,434, str:228
- `geometry_id`: int:23,662
- `parcel_number`: str:23,662
- `sub_parcel_number`: NoneType:10,597, str:13,065
- `place`: str:23,402, NoneType:260
- `house_number`: str:20,703, NoneType:2,959
- `quality`: str:23,307, NoneType:355
- `ownership_types`: list:23,661, NoneType:1
- `qualities`: list:23,660, NoneType:2
- `district`: str:23,662
- `owner_right_of_use_en`: str:22,783, NoneType:879
- `old_religious_entity_type_en`: NoneType:23,234, str:428
- `old_owner_right_of_use_en`: str:473, NoneType:23,189
- `qualities_en`: list:23,660, NoneType:2
- `ownership_types_en`: list:23,661, NoneType:1
- `citation`: str:23,610, NoneType:52

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\decoded_z14_all_layers.geojson` — **21,771,368 bytes**

Records/features: **49,969**. Geometry types: `{"Polygon": 49843, "MultiPolygon": 126}`; declared CRS: `null`.

Fields (actual type:count):

- `class`: str:3,316
- `end_date`: int:27,209
- `shp_id`: int:49,937
- `start_date`: int:49,969
- `_source_layer`: str:49,969
- `_source_tile`: str:49,969
- `name`: str:647
- `subclass`: str:148
- `transform_date`: int:85
- `fire_date`: int:47

Temporal fields: `end_date`, `start_date`, `transform_date`, `fire_date`. See main report and Appendix C for numeric/date-year ranges; lexical string order is not used to infer years.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\atlas\search.json` — **114,964 bytes**

Records/features: **342**. 

Fields (actual type:count):

- `start_year`: int:342
- `name`: str:342
- `end_year`: NoneType:313, int:29
- `envelope`: str:342
- `id`: int:337, NoneType:5
- `class`: str:228, NoneType:114
- `center`: list:342

Temporal fields: `start_year`, `end_year`. See main report and Appendix C for numeric/date-year ranges; lexical string order is not used to infer years.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\1740_Catastici_2026-05-12.geojson` — **46,730,299 bytes**

Records/features: **32,361**. Geometry types: `{"Point": 32361}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `uid`: str:32,361
- `author`: str:32,361
- `owner_code`: str:32,361
- `owner_count`: str:32,359, NoneType:2
- `PP_OwnerCode`: str:32,361
- `owner_name`: str:32,087, NoneType:274
- `ten_name`: NoneType:2,908, str:29,453
- `function`: str:31,893, NoneType:468
- `an_rendi`: NoneType:3,183, str:29,178
- `id_napo`: NoneType:21,618, str:10,743
- `quantity_income`: NoneType:32,060, str:301
- `quality_income`: NoneType:31,861, str:500
- `place`: str:32,309, NoneType:52
- `parish_std`: str:32,361
- `sestiere`: str:32,361
- `PP_Function_TOP`: str:31,548, NoneType:813
- `PP_Function_MID`: str:31,540, NoneType:821
- `PP_Function_PROPERTY`: NoneType:29,614, str:2,747
- `PP_Function_GEOMETRY`: str:7,660, NoneType:24,701
- `PP_Bottega_STD`: NoneType:29,171, str:3,190
- `PP_Bottega_COUNT`: NoneType:26,567, str:5,794
- `PP_Bottega_TRAD`: NoneType:29,173, str:3,188
- `PP_Bottega_METACATEGORY`: NoneType:29,173, str:3,188
- `PP_Owner_Title`: NoneType:17,037, str:15,324
- `PP_Owner_Entity`: NoneType:27,034, str:5,327
- `PP_Owner_FirstName`: str:25,526, NoneType:6,835
- `PP_Owner_LastName`: str:26,950, NoneType:5,411
- `PP_Owner_Mestiere`: NoneType:31,837, str:524
- `PP_Owner_Title_Categories`: NoneType:20,051, str:12,310
- `INDEX_Owner_Symbols`: NoneType:19,910, str:12,451
- `INDEX_Function_Symbols`: str:31,540, NoneType:821
- `INDEX_Owner_Index1`: str:32,361
- `INDEX_Owner_Index2`: str:32,361
- `patronymic`: str:2,348

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_geometries.geojson` — **12,903,989 bytes**

Records/features: **24,430**. Geometry types: `{"Polygon": 24430}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}`.

Fields (actual type:count):

- `id`: str:24,430
- `parcel_number`: NoneType:849, str:23,581
- `geometry_type`: str:24,428, NoneType:2
- `geometry_id`: NoneType:849, str:23,581
- `parish_standardised`: NoneType:984, str:23,446
- `area`: float:24,430

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\1740_catastici_version20250625.geojson` — **32,824,244 bytes**

Records/features: **32,676**. Geometry types: `{"Point": 32676}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `uid`: str:32,676
- `author`: str:32,676
- `tif_path_img`: str:31,931, NoneType:745
- `owner_code`: str:32,676
- `owner_count`: str:32,676
- `PP_OwnerCode_SIMPL`: str:32,676
- `owner_name`: str:32,676
- `ten_name`: str:32,676
- `function`: str:32,676
- `an_rendi`: str:32,676
- `id_napo`: str:32,676
- `quantity_income`: str:32,676
- `quality_income`: str:32,676
- `place`: str:32,676
- `parish_std`: str:32,676
- `sestiere`: str:32,676
- `PP_Function_TOP`: str:31,837, NoneType:839
- `PP_Function_MID`: str:32,676
- `PP_Function_PROPERTY`: NoneType:30,122, str:2,554
- `PP_Function_GEOMETRY`: NoneType:25,329, str:7,347
- `PP_Bottega_STD`: str:3,009, NoneType:29,667
- `PP_Bottega_COUNT`: float:5,808, NoneType:26,868
- `PP_Bottega_TRAD`: str:3,009, NoneType:29,667
- `PP_Bottega_METACATEGORY`: str:3,009, NoneType:29,667
- `PP_Owner_Title`: str:32,271, NoneType:405
- `PP_Owner_Entity`: NoneType:27,619, str:5,057
- `PP_Owner_FirstName`: str:27,214, NoneType:5,462
- `PP_Owner_LastName`: str:27,214, NoneType:5,462
- `owner_mestiere_std`: str:32,676
- `PP_Owner_Notes`: str:32,676

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740_redrawn_parishes_cleaned_wikidata_standardised.geojson` — **106,216 bytes**

Records/features: **73**. Geometry types: `{"Polygon": 70, "MultiPolygon": 3}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}`.

Fields (actual type:count):

- `NAME`: str:73
- `alt_name`: str:73
- `id`: str:73
- `SESTIERE`: str:73
- `church`: NoneType:4, str:69
- `wd_venetian_name`: NoneType:41, str:32
- `wd_italian_name`: NoneType:4, str:69
- `area`: float:73

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1808-sommarioni\venice_1808_landregister_geometries.geojson` — **12,903,989 bytes**

Records/features: **24,430**. Geometry types: `{"Polygon": 24430}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}`.

Fields (actual type:count):

- `id`: str:24,430
- `parcel_number`: NoneType:849, str:23,581
- `geometry_type`: str:24,428, NoneType:2
- `geometry_id`: NoneType:849, str:23,581
- `parish_standardised`: NoneType:984, str:23,446
- `area`: float:24,430

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Canals_EPSG32633.geojson` — **1,268,100 bytes**

Records/features: **169**. Geometry types: `{"MultiPolygon": 9, "Polygon": 160}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `TYPE`: str:169
- `NAME`: str:169
- `NAME_UID`: str:169
- `uid`: str:169
- `area`: float:169
- `btw_centrality`: float:169
- `closeness_centrality`: float:169
- `degree_centrality`: float:169
- `eigen_centrality`: float:169
- `pagerank`: float:169

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Civici_EPSG32633.geojson` — **6,728,890 bytes**

Records/features: **31,623**. Geometry types: `{"Point": 31623}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `CIVICI`: str:31,623
- `sestiere`: str:31,623
- `number`: int:31,623
- `letter`: NoneType:24,033, str:7,590

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Edifici_EPSG32633.geojson` — **14,442,426 bytes**

Records/features: **8,512**. Geometry types: `{"MultiPolygon": 6787, "Polygon": 1725}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `EDIFI_ID`: int:8,512
- `SESTIERE`: str:8,512
- `ISOLA`: NoneType:6,495, str:2,017
- `EDIFI_ID_old`: float:8,512
- `CIVICI`: str:8,512
- `description_piamonte`: NoneType:7,583, str:929
- `names`: str:295, NoneType:8,217
- `wikidata`: str:272, NoneType:8,240
- `wikipedia`: str:266, NoneType:8,246
- `other_names`: str:33, NoneType:8,479
- `osm_ids`: str:293, NoneType:8,219
- `n_civ`: str:8,511, NoneType:1
- `number_volumi`: int:8,512
- `sub_volumi`: str:8,462, NoneType:50
- `door_indices`: str:8,512
- `area`: float:8,507, NoneType:5
- `modified`: NoneType:8,487, str:25
- `new_id`: NoneType:8,506, str:6
- `ISL_uid`: str:7,342, NoneType:1,170
- `NEIGH_uid`: str:6,942, NoneType:1,570
- `aulic_name`: str:449, NoneType:8,063
- `typology`: str:449, NoneType:8,063
- `style`: str:449, NoneType:8,063

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Isole_EPSG32633.geojson` — **262,593 bytes**

Records/features: **119**. Geometry types: `{"Polygon": 118, "MultiPolygon": 1}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `uid`: str:119
- `area`: float:119
- `count_edi`: int:119

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Sestiere_EPSG32633.geojson` — **97,373 bytes**

Records/features: **8**. Geometry types: `{"Polygon": 6, "MultiPolygon": 2}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `division_name`: str:8

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\2024-geometries\2024_Streets_EPSG32633.geojson` — **6,930,875 bytes**

Records/features: **3,773**. Geometry types: `{"Polygon": 3542, "MultiPolygon": 231}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::32633"}}`.

Fields (actual type:count):

- `NAME`: str:3,773
- `SESTIERE`: str:3,773
- `ISOLA`: NoneType:3,369, str:404
- `TYPE`: str:3,773
- `DENOMINATO`: str:3,770, NoneType:3
- `TYPE_SIMPL`: str:3,773
- `TYPOLOGY`: str:3,773
- `NAME_UID`: str:3,773
- `uid`: str:3,773
- `area`: float:3,773
- `centrality`: float:3,773
- `btw_centrality`: float:3,773
- `closeness_centrality`: float:3,773
- `degree_centrality`: float:3,773
- `eigen_centrality`: float:3,773
- `pagerank`: float:3,773
- `load`: float:3,773

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\centroids.geojson` — **160,210 bytes**

Records/features: **693**. Geometry types: `{"Point": 693}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}`.

Fields (actual type:count):

- `id`: str:693
- `start_date`: str:677, NoneType:16
- `end_date`: str:677, NoneType:16

Temporal fields: `start_date`, `end_date`. See main report and Appendix C for numeric/date-year ranges; lexical string order is not used to infer years.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\geometries_generalized.geojson` — **1,054,104 bytes**

Records/features: **693**. Geometry types: `{"Polygon": 691, "MultiPolygon": 2}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}`.

Fields (actual type:count):

- `id`: str:693
- `start_date`: str:677, NoneType:16
- `end_date`: str:677, NoneType:16

Temporal fields: `start_date`, `end_date`. See main report and Appendix C for numeric/date-year ranges; lexical string order is not used to infer years.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\106_modificato.geojson` — **577,490 bytes**

Records/features: **24**. Geometry types: `{"Polygon": 24}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:24

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\114_modificato.geojson` — **309,058 bytes**

Records/features: **12**. Geometry types: `{"Polygon": 12}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:12

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\122_modificato.geojson` — **311,748 bytes**

Records/features: **26**. Geometry types: `{"Polygon": 26}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:26

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\127_modificato.geojson` — **389,730 bytes**

Records/features: **41**. Geometry types: `{"Polygon": 41}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:41

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\133_modificato.geojson` — **707,347 bytes**

Records/features: **56**. Geometry types: `{"Polygon": 56}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:56

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\143_modificato.geojson` — **343,539 bytes**

Records/features: **34**. Geometry types: `{"Polygon": 34}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:34

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\148_modificato.geojson` — **644,408 bytes**

Records/features: **46**. Geometry types: `{"Polygon": 46}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:46

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\156_modificato.geojson` — **363,987 bytes**

Records/features: **16**. Geometry types: `{"Polygon": 16}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:16

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\162_modificato.geojson` — **391,527 bytes**

Records/features: **31**. Geometry types: `{"Polygon": 31}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:31

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\169_modificato.geojson` — **505,960 bytes**

Records/features: **33**. Geometry types: `{"Polygon": 33}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:33

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\176_modificato.geojson` — **491,771 bytes**

Records/features: **33**. Geometry types: `{"Polygon": 33}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:33

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\184_modificato.geojson` — **387,954 bytes**

Records/features: **26**. Geometry types: `{"Polygon": 26}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:26

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\192_modificato.geojson` — **282,814 bytes**

Records/features: **10**. Geometry types: `{"Polygon": 10}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:10

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\24_modificato.geojson` — **353,011 bytes**

Records/features: **21**. Geometry types: `{"Polygon": 21}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:21

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\32_modificato.geojson` — **210,333 bytes**

Records/features: **14**. Geometry types: `{"Polygon": 14}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:14

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\35_modificato.geojson` — **293,187 bytes**

Records/features: **20**. Geometry types: `{"Polygon": 20}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:20

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\40_modificato.geojson` — **201,846 bytes**

Records/features: **16**. Geometry types: `{"Polygon": 16}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:16

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\44_modificato.geojson` — **418,183 bytes**

Records/features: **37**. Geometry types: `{"Polygon": 37}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:37

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\53_modificato.geojson` — **731,837 bytes**

Records/features: **45**. Geometry types: `{"Polygon": 45}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:45

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\63_modificato.geojson` — **357,943 bytes**

Records/features: **22**. Geometry types: `{"Polygon": 22}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:22

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\68_modificato.geojson` — **515,461 bytes**

Records/features: **34**. Geometry types: `{"Polygon": 34}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:34

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\78_modificato.geojson` — **402,574 bytes**

Records/features: **31**. Geometry types: `{"Polygon": 31}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:31

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\85_modificato.geojson` — **285,680 bytes**

Records/features: **19**. Geometry types: `{"Polygon": 19}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:19

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\90_modificato.geojson` — **282,909 bytes**

Records/features: **17**. Geometry types: `{"Polygon": 17}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:17

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\94_modificato.geojson` — **248,497 bytes**

Records/features: **13**. Geometry types: `{"Polygon": 13}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:13

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\geometries\quarters\98_modificato.geojson` — **408,314 bytes**

Records/features: **24**. Geometry types: `{"Polygon": 24}`; declared CRS: `{"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3004"}}`.

Fields (actual type:count):

- `number`: int:24

No explicit DATE/YEAR/PERIOD-like field. Dataset year or narrative evidence, if any, is described in the main report.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1740-landregister\venice-1740-landregister-main\1740_Catastici_2026-05-12.tsv` — **9,448,321 bytes**

32,361 rows. Header: `uid`, `author`, `owner_code`, `owner_count`, `PP_OwnerCode`, `owner_name`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `place`, `parish_std`, `sestiere`, `PP_Function_TOP`, `PP_Function_MID`, `PP_Function_PROPERTY`, `PP_Function_GEOMETRY`, `PP_Bottega_STD`, `PP_Bottega_COUNT`, `PP_Bottega_TRAD`, `PP_Bottega_METACATEGORY`, `PP_Owner_Title`, `PP_Owner_Entity`, `PP_Owner_FirstName`, `PP_Owner_LastName`, `PP_Owner_Mestiere`, `PP_Owner_Title_Categories`, `INDEX_Owner_Symbols`, `INDEX_Function_Symbols`, `INDEX_Owner_Index1`, `INDEX_Owner_Index2`, `patronymic`, `x`, `y`.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_geometries.csv` — **8,828,028 bytes**

24,430 rows. Header: `id`, `parcel_number`, `geometry_type`, `geometry_id`, `parish_standardised`, `geometry`, `area`.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_merge_log.csv` — **611,213 bytes**

9,312 rows. Header: `merge_log_uid`, `owner_uid`, `parcel_id`, `suddetto`, `same_father`, `same_mother`, `same_siblings`, `same_husband`, `same_title`, `same_other_note`, `same_name_only`.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_standardised_people.csv` — **722,852 bytes**

12,277 rows. Header: `uid`, `nucleus_uid`, `family`, `name`, `title`, `father`, `father_is_q`, `mother`, `siblings`, `husband`, `husband_is_q`, `other_notes`, `parcel_ids`.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-1808-landregister\venice-1808-landregister-main\venice_1808_landregister_textual_entries.csv` — **8,479,191 bytes**

23,662 rows. Header: `parcel_id`, `owner_transcription`, `owner_standardised`, `owner_standardised_class`, `owner_wd`, `owner_right_of_use`, `owner_type`, `old_entity`, `old_entity_standardised`, `old_entity_standardised_class`, `old_entity_wd`, `old_owner_right_of_use`, `old_owner_type`, `old_religious_entity_type`, `owner_supplementary`, `geometry_id`, `parcel_number`, `sub_parcel_number`, `place`, `house_number`, `quality`, `ownership_types`, `qualities`, `district`, `owner_right_of_use_en`, `old_religious_entity_type_en`, `old_owner_right_of_use_en`, `qualities_en`, `ownership_types_en`, `citation`.

### `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1857-commercial-guide\1857_commercial_guide_with_pages_20250624.csv` — **1,501,744 bytes**

5,883 rows. Header: `index`, `OCC_COMPL`, `LAST_N`, `FIRST_N`, `PER_GRP`, `PER_COMPL`, `LOC_PAR`, `LOC_STR`, `NUM`, `LOC_COMPL`, `NORM_PARISH`, `DISTRICT`, `geometry`, `geometry_from`, `profession`, `profession_eng`, `category`, `category_eng`, `PAGE_NUM`.

### Dorigo entity JSON shared schema

`row_nr`, `page_nr`, `area_code`, `parcel_numbers`, `map_number`, `data`, `fonte`, `date_start`, `date_end`, `date_comment`, `source`, `derived_from_row`, `spatial_information`, `ownership`, `matches`. Numeric `date_start`976–1408; `date_end`978–1408, per observation. Individual file paths/sizes in Appendix A.

### XLSX column names

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\103_0.xlsx` — **17,556 bytes**; 171 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\104_2.xlsx` — **15,192 bytes**; 147 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\105_2.xlsx` — **8,760 bytes**; 45 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\107_0.xlsx` — **31,333 bytes**; 398 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\112_2.xlsx` — **22,935 bytes**; 227 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\115_0.xlsx` — **11,206 bytes**; 87 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\118_0.xlsx` — **33,647 bytes**; 440 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\121_1.xlsx` — **14,258 bytes**; 111 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\123_0.xlsx` — **13,185 bytes**; 96 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\125_1.xlsx` — **16,755 bytes**; 144 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\126_2.xlsx` — **14,816 bytes**; 116 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\129_0.xlsx` — **19,875 bytes**; 212 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\130_2.xlsx` — **22,262 bytes**; 272 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\136_0.xlsx` — **20,489 bytes**; 228 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\137_3.xlsx` — **21,691 bytes**; 210 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\139_3.xlsx` — **11,507 bytes**; 95 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\140_2.xlsx` — **17,120 bytes**; 174 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\141_3.xlsx` — **13,941 bytes**; 132 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\145_0.xlsx` — **21,878 bytes**; 250 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\146_3.xlsx` — **12,198 bytes**; 94 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\147_2.xlsx` — **9,596 bytes**; 58 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\149_0.xlsx` — **14,189 bytes**; 136 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\152_2.xlsx` — **23,878 bytes**; 274 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\154_3.xlsx` — **13,022 bytes**; 108 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\156_0.xlsx` — **24,760 bytes**; 262 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\160_2.xlsx` — **13,080 bytes**; 109 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\165_0.xlsx` — **18,535 bytes**; 169 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\166_1.xlsx` — **25,259 bytes**; 303 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\172_0.xlsx` — **27,607 bytes**; 348 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\174_2.xlsx` — **15,723 bytes**; 145 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\179_0.xlsx` — **18,664 bytes**; 206 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\180_2.xlsx` — **15,302 bytes**; 152 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\181_2.xlsx` — **25,696 bytes**; 275 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\187_0.xlsx` — **27,755 bytes**; 324 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\189_2.xlsx` — **25,540 bytes**; 283 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\193_0.xlsx` — **29,268 bytes**; 257 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\25_0.xlsx` — **41,442 bytes**; 460 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\32_0.xlsx` — **17,313 bytes**; 159 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\34_3.xlsx` — **8,521 bytes**; 35 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\38_0.xlsx` — **12,645 bytes**; 85 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\38_3.xlsx` — **19,539 bytes**; 211 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\42_0.xlsx` — **12,467 bytes**; 103 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\42_3.xlsx` — **13,594 bytes**; 122 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\47_0.xlsx` — **22,000 bytes**; 258 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\48_3.xlsx` — **15,489 bytes**; 152 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\49_3.xlsx` — **14,153 bytes**; 127 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\50_3.xlsx` — **20,703 bytes**; 230 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\56_0.xlsx` — **12,236 bytes**; 83 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\56_3.xlsx` — **19,177 bytes**; 217 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\58_1.xlsx` — **14,450 bytes**; 126 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\59_1.xlsx` — **19,546 bytes**; 210 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\61_0.xlsx` — **21,868 bytes**; 223 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\65_0.xlsx` — **21,678 bytes**; 231 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\66_3.xlsx` — **8,655 bytes**; 38 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\67_0.xlsx` — **10,253 bytes**; 46 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\67_2.xlsx` — **12,539 bytes**; 83 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\72_0.xlsx` — **11,809 bytes**; 90 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\72_2.xlsx` — **16,452 bytes**; 164 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\73_3.xlsx` — **18,878 bytes**; 186 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\75_2.xlsx` — **18,148 bytes**; 168 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\76_3.xlsx` — **13,805 bytes**; 137 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\81_0.xlsx` — **11,770 bytes**; 90 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\81_2.xlsx` — **15,005 bytes**; 140 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\82_3.xlsx` — **10,824 bytes**; 69 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\83_1.xlsx` — **21,048 bytes**; 209 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\87_0.xlsx` — **20,790 bytes**; 230 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\88_3.xlsx` — **13,026 bytes**; 93 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\90_0.xlsx` — **18,202 bytes**; 195 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\93_0.xlsx` — **15,906 bytes**; 147 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\96_0.xlsx` — **23,837 bytes**; 272 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\946_1408-dorigo\tables\99_0.xlsx` — **19,400 bytes**; 190 XML data rows (blank/styled rows not filtered); header `unità areale`, `informazioni urbinistico-edilizie`, `data`, `proprietà`, `fonte`, `page`, `map_number`, `parcel_numbers`, `remark_number`, `asterisk_number`, `dates_start`, `dates_end`, `dates_comment`, `derived_from_row`, `sources`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\catastici_1741_STD.xlsx` — **5,365,640 bytes**; 33,297 XML data rows (blank/styled rows not filtered); header `uidx`, `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\catastici_1741_STD_expanded.xlsx` — **6,144,641 bytes**; 38,218 XML data rows (blank/styled rows not filtered); header `uidx`, `id`, `owner_name`, `owner_code`, `parcel_portion`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`

### 1740 processing intermediate JSON schemas

- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_STD.json` — **24,049,565 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_STD_expanded.json` — **28,340,115 bytes**; 38,218 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `parcel_portion`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step1.json` — **22,654,823 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step2.json` — **22,654,115 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step3.json` — **22,665,126 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step4.json` — **22,839,220 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step5.json` — **23,267,073 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step6_patterns.json` — **1,867,396 bytes**; 4,658 records; fields: `uidx`, `owner_text`, `patterns`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step7.json` — **23,474,565 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_post-processing\pipeline_steps\catastici_1741_step8.json` — **24,049,565 bytes**; 33,297 records; fields: `uidx`, `id`, `owner_name`, `owner_code`, `owner_count`, `owner_count_remark`, `owner_entity`, `owner_entity_group`, `owner_first_name`, `owner_family_name`, `owner_family_group`, `owner_title`, `owner_title_std`, `owner_mestiere`, `owner_mestiere_std`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.
- `D:\100_star\venice\data\raw\Venice_Historical_20261022_2025\repositories\venice-data-week-data\venice-data-week-data-main\1740-catastici\index\data_catastici\data_pre-processing\catastici_20240123.json` — **16,909,660 bytes**; 33,297 records; fields: `id`, `owner_name`, `ten_name`, `function`, `an_rendi`, `id_napo`, `quantity_income`, `quality_income`, `author`, `place`, `parish`, `sestiere`, `uid`, `path_img`, `geometry`; no explicit historical date field.

## Appendix C — actual full-file date distributions

### Atlas decoded PBFs by zoom/layer

Counts are tile features, not unique buildings. Values are literal integer years, not certified event meanings.

#### z13 / building: 37,388 features

Fields: `class`, `end_date`, `fire_date`, `name`, `shp_id`, `start_date`, `transform_date`.

- `start_date`: 37,388 populated, range 365–2016; values/counts: 365:1, 800:1, 821:1, 827:2, 841:2, 847:1, 850:2, 853:4, 890:1, 899:1, 900:2, 932:4, 966:1, 967:1, 1000:13, 1013:1, 1017:1, 1025:3, 1028:4, 1030:5, 1046:2, 1052:1, 1061:1, 1069:5, 1079:4, 1081:2, 1084:1, 1090:3, 1100:475, 1105:2, 1108:1, 1109:1, 1110:1, 1111:1, 1117:1, 1119:2, 1120:1, 1127:1, 1128:1, 1133:1, 1135:1, 1138:1, 1141:1, 1142:1, 1143:1, 1147:2, 1155:1, 1180:1, 1186:2, 1192:1, 1200:2, 1220:4, 1222:1, 1231:2, 1240:2, 1253:4, 1283:1, 1300:5, 1303:1, 1330:3, 1331:1, 1332:1, 1350:719, 1365:1, 1366:5, 1378:1, 1380:4, 1383:4, 1393:1, 1472:1, 1700:2, 1808:17298, 2016:18755
- `end_date`: 18,633 populated, range 1350–2016; values/counts: 1350:507, 1451:2, 1808:796, 1810:9, 1820:1, 1830:1, 1832:4, 1839:2, 1852:1, 1861:1, 1873:1, 1880:4, 1885:1, 1888:1, 1916:4, 2016:17298
- `transform_date`: 80 populated, range 1106–1863; values/counts: 1106:3, 1295:2, 1297:1, 1306:1, 1321:2, 1330:1, 1332:2, 1348:1, 1400:3, 1435:2, 1437:2, 1439:2, 1444:5, 1450:2, 1475:1, 1478:2, 1500:1, 1501:1, 1503:1, 1505:1, 1525:2, 1531:1, 1535:1, 1548:1, 1553:1, 1556:2, 1565:1, 1575:1, 1577:1, 1580:1, 1581:2, 1582:4, 1584:2, 1588:1, 1602:1, 1635:1, 1641:1, 1652:2, 1663:1, 1680:2, 1705:4, 1709:1, 1736:1, 1743:1, 1753:1, 1762:1, 1779:2, 1794:1, 1807:1, 1839:1, 1863:1
- `fire_date`: 47 populated, range 976–1630; values/counts: 976:1, 1105:2, 1106:21, 1146:1, 1149:2, 1150:1, 1167:2, 1205:1, 1214:2, 1456:4, 1475:2, 1569:6, 1575:1, 1630:1

#### z13 / landcover: 112 features

Fields: `class`, `end_date`, `shp_id`, `start_date`, `subclass`.

- `end_date`: 112 populated, range 1100–1350; values/counts: 1100:59, 1350:53
- `start_date`: 112 populated, range 800–1100; values/counts: 800:59, 1100:53

#### z13 / landuse: 722 features

Fields: `class`, `end_date`, `shp_id`, `start_date`.

- `start_date`: 722 populated, range 800–2016; values/counts: 800:131, 1350:165, 1500:164, 1808:128, 2016:134
- `end_date`: 588 populated, range 1350–2016; values/counts: 1350:131, 1500:162, 1808:164, 2016:131

#### z13 / waterway: 1,228 features

Fields: `class`, `end_date`, `name`, `shp_id`, `start_date`.

- `end_date`: 1,228 populated, range 1350–2018; values/counts: 1350:455, 1500:191, 1808:289, 2018:293
- `start_date`: 1,228 populated, range 800–1899; values/counts: 800:455, 1350:191, 1500:289, 1899:293

#### z14 / building: 47,430 features

Fields: `class`, `end_date`, `fire_date`, `name`, `shp_id`, `start_date`, `transform_date`.

- `start_date`: 47,430 populated, range 365–2016; values/counts: 365:1, 800:1, 821:1, 827:2, 841:2, 847:1, 850:2, 853:4, 890:1, 899:1, 900:2, 932:4, 966:1, 967:1, 1000:15, 1013:1, 1017:1, 1025:4, 1028:4, 1030:5, 1046:2, 1052:1, 1061:1, 1069:5, 1079:4, 1081:1, 1084:1, 1090:3, 1100:496, 1105:2, 1108:1, 1109:1, 1110:1, 1111:1, 1117:1, 1119:2, 1120:1, 1127:1, 1128:1, 1133:1, 1135:1, 1138:1, 1141:1, 1142:1, 1143:1, 1147:2, 1155:1, 1180:1, 1186:2, 1192:1, 1200:2, 1220:3, 1222:1, 1231:4, 1240:2, 1253:4, 1283:1, 1300:5, 1303:1, 1330:5, 1331:1, 1332:1, 1350:764, 1365:1, 1366:5, 1378:2, 1380:4, 1383:4, 1393:1, 1472:1, 1700:2, 1808:23428, 2016:22595
- `end_date`: 24,835 populated, range 1350–2016; values/counts: 1350:527, 1451:2, 1595:2, 1808:844, 1810:11, 1820:1, 1830:1, 1832:4, 1839:2, 1852:1, 1861:1, 1873:1, 1880:4, 1885:1, 1888:1, 1916:4, 2016:23428
- `transform_date`: 85 populated, range 1106–1863; values/counts: 1106:3, 1295:4, 1297:1, 1306:1, 1321:1, 1330:1, 1332:2, 1348:1, 1400:3, 1435:2, 1437:2, 1439:2, 1444:5, 1450:3, 1475:1, 1478:4, 1500:1, 1501:1, 1503:1, 1505:1, 1525:2, 1531:1, 1535:1, 1548:1, 1553:1, 1556:2, 1565:1, 1575:1, 1577:1, 1580:1, 1581:2, 1582:4, 1584:2, 1588:1, 1602:1, 1635:1, 1641:1, 1652:2, 1663:1, 1680:2, 1705:4, 1709:1, 1736:1, 1743:1, 1753:1, 1762:1, 1779:2, 1794:2, 1807:1, 1839:1, 1863:1
- `fire_date`: 47 populated, range 976–1630; values/counts: 976:1, 1105:2, 1106:22, 1146:1, 1149:2, 1150:1, 1167:2, 1205:1, 1214:2, 1456:4, 1475:2, 1569:5, 1575:1, 1630:1

#### z14 / landcover: 148 features

Fields: `class`, `end_date`, `shp_id`, `start_date`, `subclass`.

- `end_date`: 148 populated, range 1100–1350; values/counts: 1100:79, 1350:69
- `start_date`: 148 populated, range 800–1100; values/counts: 800:79, 1100:69

#### z14 / landuse: 871 features

Fields: `class`, `end_date`, `shp_id`, `start_date`.

- `start_date`: 871 populated, range 800–2016; values/counts: 800:159, 1350:192, 1500:198, 1808:157, 2016:165
- `end_date`: 706 populated, range 1350–2016; values/counts: 1350:159, 1500:189, 1808:198, 2016:160

#### z14 / waterway: 1,520 features

Fields: `class`, `end_date`, `name`, `shp_id`, `start_date`.

- `end_date`: 1,520 populated, range 1350–2018; values/counts: 1350:662, 1500:228, 1808:332, 2018:298
- `start_date`: 1,520 populated, range 800–1899; values/counts: 800:662, 1350:228, 1500:332, 1899:298

#### z15 / building: 50,904 features

Fields: `class`, `end_date`, `fire_date`, `name`, `shp_id`, `start_date`, `transform_date`.

- `start_date`: 50,904 populated, range 365–2016; values/counts: 365:1, 800:1, 821:1, 827:2, 841:4, 847:1, 850:2, 853:5, 890:1, 899:1, 900:2, 932:4, 966:1, 967:1, 1000:15, 1013:1, 1017:1, 1025:4, 1028:4, 1030:7, 1046:2, 1052:1, 1061:1, 1069:5, 1079:6, 1081:1, 1084:1, 1090:3, 1100:532, 1105:4, 1108:1, 1109:1, 1110:1, 1111:1, 1117:1, 1119:2, 1120:1, 1127:1, 1128:1, 1133:1, 1135:1, 1138:1, 1141:2, 1142:1, 1143:1, 1147:2, 1155:1, 1180:1, 1186:2, 1192:1, 1200:2, 1220:4, 1222:1, 1231:8, 1240:2, 1253:4, 1283:1, 1300:5, 1303:1, 1330:4, 1331:1, 1332:1, 1350:831, 1365:1, 1366:5, 1378:1, 1380:4, 1383:4, 1393:1, 1472:1, 1700:2, 1808:25741, 2016:23640
- `end_date`: 27,264 populated, range 1350–2016; values/counts: 1350:570, 1451:4, 1595:1, 1808:914, 1810:11, 1820:1, 1830:1, 1832:6, 1839:2, 1852:1, 1861:1, 1873:1, 1880:4, 1885:1, 1888:1, 1916:4, 2016:25741
- `fire_date`: 51 populated, range 976–1630; values/counts: 976:1, 1105:2, 1106:25, 1146:1, 1149:2, 1150:1, 1167:2, 1205:1, 1214:2, 1456:4, 1475:2, 1569:6, 1575:1, 1630:1
- `transform_date`: 92 populated, range 1106–1863; values/counts: 1106:3, 1295:4, 1297:1, 1306:1, 1321:1, 1330:1, 1332:2, 1348:1, 1400:3, 1435:2, 1437:2, 1439:2, 1444:5, 1450:2, 1475:1, 1478:8, 1500:1, 1501:1, 1503:1, 1505:1, 1525:2, 1531:1, 1535:1, 1548:1, 1553:1, 1556:4, 1565:1, 1575:1, 1577:1, 1580:1, 1581:2, 1582:4, 1584:2, 1588:1, 1602:2, 1635:1, 1641:1, 1652:2, 1663:2, 1680:2, 1705:4, 1709:1, 1736:1, 1743:1, 1753:1, 1762:1, 1779:2, 1794:2, 1807:1, 1839:1, 1863:1

#### z15 / landcover: 180 features

Fields: `class`, `end_date`, `shp_id`, `start_date`, `subclass`.

- `end_date`: 180 populated, range 1100–1350; values/counts: 1100:96, 1350:84
- `start_date`: 180 populated, range 800–1100; values/counts: 800:96, 1100:84

#### z15 / landuse: 1,069 features

Fields: `class`, `end_date`, `shp_id`, `start_date`.

- `start_date`: 1,069 populated, range 800–2016; values/counts: 800:191, 1350:232, 1500:237, 1808:198, 2016:211
- `end_date`: 858 populated, range 1350–2016; values/counts: 1350:191, 1500:229, 1808:237, 2016:201

#### z15 / waterway: 1,872 features

Fields: `class`, `end_date`, `name`, `shp_id`, `start_date`.

- `end_date`: 1,872 populated, range 1350–2018; values/counts: 1350:796, 1500:293, 1808:420, 2018:363
- `start_date`: 1,872 populated, range 800–1899; values/counts: 800:796, 1350:293, 1500:420, 1899:363

#### z16 / building: 53,560 features

Fields: `class`, `end_date`, `fire_date`, `name`, `shp_id`, `start_date`, `transform_date`.

- `start_date`: 53,560 populated, range 365–2016; values/counts: 365:1, 800:2, 821:1, 827:2, 841:4, 847:1, 850:2, 853:4, 890:1, 899:1, 900:2, 932:2, 966:1, 967:2, 1000:17, 1013:1, 1017:1, 1025:4, 1028:4, 1030:3, 1046:2, 1052:1, 1061:1, 1069:6, 1079:6, 1081:1, 1084:2, 1090:3, 1100:567, 1105:4, 1108:1, 1109:2, 1110:1, 1111:1, 1117:2, 1119:2, 1120:1, 1127:1, 1128:1, 1133:1, 1135:2, 1138:1, 1141:1, 1142:1, 1143:2, 1147:2, 1155:1, 1180:1, 1186:2, 1192:3, 1200:2, 1220:3, 1222:1, 1231:6, 1240:2, 1253:2, 1283:1, 1300:6, 1303:1, 1330:4, 1331:1, 1332:1, 1350:859, 1365:1, 1366:5, 1378:1, 1380:4, 1383:4, 1393:1, 1472:1, 1700:2, 1808:27609, 2016:24365
- `end_date`: 29,195 populated, range 1350–2016; values/counts: 1350:604, 1451:4, 1595:1, 1808:947, 1810:11, 1820:1, 1830:1, 1832:2, 1839:2, 1852:1, 1861:3, 1873:1, 1880:4, 1885:1, 1888:1, 1916:2, 2016:27609
- `fire_date`: 56 populated, range 976–1630; values/counts: 976:1, 1105:2, 1106:28, 1146:2, 1149:2, 1150:2, 1167:3, 1205:1, 1214:2, 1456:4, 1475:2, 1569:5, 1575:1, 1630:1
- `transform_date`: 95 populated, range 1106–1863; values/counts: 1106:3, 1295:4, 1297:2, 1306:1, 1321:1, 1330:1, 1332:2, 1348:2, 1400:3, 1435:2, 1437:2, 1439:2, 1444:5, 1450:2, 1475:1, 1478:6, 1500:1, 1501:1, 1503:1, 1505:1, 1525:2, 1531:1, 1535:1, 1548:1, 1553:1, 1556:4, 1565:1, 1575:1, 1577:1, 1580:3, 1581:2, 1582:2, 1584:2, 1588:2, 1602:1, 1635:2, 1641:1, 1652:2, 1663:1, 1680:2, 1705:4, 1709:1, 1736:1, 1743:1, 1753:1, 1762:1, 1779:4, 1794:2, 1807:1, 1839:2, 1863:1

#### z16 / landcover: 250 features

Fields: `class`, `end_date`, `shp_id`, `start_date`, `subclass`.

- `end_date`: 250 populated, range 1100–1350; values/counts: 1100:136, 1350:114
- `start_date`: 250 populated, range 800–1100; values/counts: 800:136, 1100:114

#### z16 / landuse: 1,584 features

Fields: `class`, `end_date`, `shp_id`, `start_date`.

- `start_date`: 1,584 populated, range 800–2016; values/counts: 800:268, 1350:334, 1500:351, 1808:296, 2016:335
- `end_date`: 1,249 populated, range 1350–2016; values/counts: 1350:268, 1500:328, 1808:351, 2016:302

#### z16 / waterway: 2,475 features

Fields: `class`, `end_date`, `name`, `shp_id`, `start_date`.

- `end_date`: 2,475 populated, range 1350–2018; values/counts: 1350:922, 1500:407, 1808:629, 2018:517
- `start_date`: 2,475 populated, range 800–1899; values/counts: 800:922, 1350:407, 1500:629, 1899:517

### Search index

- `start_year`: 342 populated, 365–1700; 365:1, 800:1, 821:1, 827:2, 841:2, 847:1, 850:2, 853:4, 890:1, 899:1, 900:2, 932:2, 966:1, 967:1, 1000:13, 1013:1, 1017:1, 1025:3, 1028:4, 1030:3, 1046:2, 1052:1, 1061:1, 1069:5, 1079:4, 1081:1, 1084:1, 1090:3, 1100:110, 1105:2, 1108:1, 1109:1, 1110:1, 1111:1, 1117:1, 1119:1, 1120:1, 1127:1, 1128:1, 1133:1, 1135:1, 1138:1, 1141:1, 1142:1, 1143:1, 1147:2, 1155:1, 1180:1, 1186:2, 1192:1, 1200:2, 1220:3, 1222:1, 1231:2, 1240:2, 1253:2, 1283:1, 1300:5, 1303:1, 1330:3, 1331:1, 1332:1, 1350:100, 1365:1, 1366:5, 1378:1, 1380:4, 1383:4, 1393:1, 1472:1, 1700:2
- `end_year`: 29 populated, 1451–1916; 1451:2, 1595:1, 1808:3, 1810:8, 1820:1, 1830:1, 1832:2, 1839:2, 1852:1, 1861:1, 1873:1, 1880:2, 1885:1, 1888:1, 1916:2

### Dorigo record dates

- `date_start`: 12,536 populated, 976–1408; values/counts: 976:1, 1001:1, 1013:2, 1038:5, 1046:4, 1048:6, 1051:13, 1060:2, 1069:1, 1070:7, 1074:1, 1075:3, 1077:6, 1078:7, 1079:4, 1080:2, 1081:7, 1083:6, 1085:3, 1086:16, 1087:4, 1088:6, 1089:2, 1093:4, 1096:5, 1097:6, 1098:1, 1101:1, 1106:1, 1107:9, 1109:3, 1112:3, 1114:4, 1116:4, 1117:4, 1119:1, 1120:7, 1121:2, 1122:3, 1123:1, 1125:4, 1130:5, 1132:1, 1134:12, 1138:5, 1139:1, 1140:5, 1142:4, 1143:3, 1144:13, 1145:2, 1146:4, 1147:2, 1148:3, 1149:7, 1152:13, 1153:13, 1154:5, 1155:6, 1156:5, 1159:4, 1160:6, 1161:11, 1162:4, 1164:12, 1165:8, 1166:7, 1167:9, 1168:4, 1170:27, 1171:10, 1172:7, 1173:1, 1174:1, 1175:2, 1176:9, 1177:41, 1178:3, 1179:5, 1180:16, 1182:7, 1183:5, 1184:7, 1185:7, 1186:15, 1187:9, 1188:23, 1190:9, 1191:13, 1192:8, 1193:12, 1194:8, 1195:25, 1196:12, 1197:40, 1198:4, 1199:6, 1200:10, 1201:14, 1202:13, 1203:30, 1204:5, 1205:22, 1206:12, 1207:21, 1208:14, 1209:26, 1210:9, 1211:25, 1212:14, 1213:8, 1214:9, 1215:15, 1216:10, 1217:21, 1218:33, 1219:17, 1220:16, 1221:44, 1222:24, 1223:22, 1224:42, 1225:27, 1226:40, 1227:17, 1228:23, 1229:25, 1230:31, 1231:35, 1232:7, 1233:37, 1234:29, 1235:41, 1236:78, 1237:59, 1238:20, 1239:14, 1240:25, 1241:36, 1242:47, 1243:8, 1244:33, 1245:19, 1246:47, 1247:20, 1248:21, 1249:33, 1250:20, 1251:8, 1252:29, 1253:55, 1254:21, 1255:15, 1256:74, 1257:30, 1258:25, 1259:39, 1260:4, 1261:34, 1262:24, 1263:20, 1264:60, 1265:29, 1266:57, 1267:36, 1268:27, 1269:60, 1270:8, 1271:50, 1272:9, 1273:29, 1274:16, 1275:46, 1276:41, 1277:64, 1278:33, 1279:40, 1280:47, 1281:40, 1282:21, 1283:4, 1284:34, 1285:47, 1286:74, 1287:65, 1288:29, 1289:78, 1290:71, 1291:30, 1292:34, 1293:21, 1294:39, 1295:67, 1296:69, 1297:58, 1298:104, 1299:69, 1300:44, 1301:36, 1302:32, 1303:118, 1304:26, 1305:46, 1306:64, 1307:28, 1308:59, 1309:63, 1310:31, 1311:20, 1312:250, 1313:56, 1314:97, 1315:33, 1316:23, 1317:50, 1318:39, 1319:83, 1320:96, 1321:90, 1322:77, 1323:61, 1324:98, 1325:114, 1326:110, 1327:142, 1328:172, 1329:188, 1330:209, 1331:133, 1332:170, 1333:189, 1334:113, 1335:149, 1336:123, 1337:134, 1338:189, 1339:232, 1340:146, 1341:236, 1342:174, 1343:162, 1344:133, 1345:147, 1346:105, 1347:159, 1348:173, 1349:263, 1350:151, 1351:210, 1352:119, 1353:715, 1354:209, 1355:184, 1356:141, 1357:180, 1358:157, 1359:144, 1360:134, 1361:81, 1362:87, 1363:84, 1364:58, 1365:54, 1366:32, 1367:3, 1368:5, 1369:12, 1370:4, 1371:19, 1372:2, 1373:16, 1374:3, 1375:16, 1376:2, 1377:5, 1378:30, 1379:9, 1381:7, 1382:1, 1383:5, 1384:10, 1386:1, 1387:12, 1389:4, 1392:4, 1393:9, 1397:1, 1408:1
- `date_end`: 12,536 populated, 978–1408; values/counts: 978:1, 1001:1, 1013:2, 1038:5, 1046:4, 1048:6, 1051:13, 1060:2, 1069:1, 1070:7, 1074:1, 1075:3, 1077:6, 1078:7, 1079:4, 1080:2, 1081:7, 1083:6, 1085:3, 1086:16, 1087:4, 1088:6, 1089:2, 1093:4, 1096:5, 1097:6, 1098:1, 1101:1, 1106:1, 1107:9, 1109:3, 1112:3, 1114:4, 1116:4, 1117:4, 1119:1, 1120:7, 1121:2, 1122:3, 1123:1, 1125:4, 1130:5, 1132:1, 1134:12, 1138:5, 1139:1, 1140:5, 1142:4, 1143:3, 1144:13, 1145:2, 1146:4, 1147:2, 1148:3, 1149:7, 1152:13, 1153:13, 1154:5, 1155:6, 1156:5, 1159:4, 1160:6, 1161:11, 1162:4, 1164:12, 1165:8, 1166:7, 1167:9, 1168:4, 1170:27, 1171:10, 1172:7, 1173:1, 1174:1, 1175:2, 1176:9, 1177:41, 1178:3, 1179:5, 1180:16, 1182:7, 1183:5, 1184:7, 1185:4, 1186:18, 1187:9, 1188:23, 1190:9, 1191:13, 1192:8, 1193:12, 1194:8, 1195:25, 1196:12, 1197:40, 1198:4, 1199:6, 1200:10, 1201:14, 1202:13, 1203:30, 1204:5, 1205:22, 1206:12, 1207:21, 1208:14, 1209:26, 1210:9, 1211:25, 1212:14, 1213:8, 1214:9, 1215:15, 1216:10, 1217:21, 1218:33, 1219:17, 1220:16, 1221:44, 1222:24, 1223:22, 1224:42, 1225:27, 1226:40, 1227:17, 1228:23, 1229:25, 1230:31, 1231:35, 1232:7, 1233:37, 1234:29, 1235:41, 1236:78, 1237:59, 1238:20, 1239:14, 1240:25, 1241:36, 1242:47, 1243:8, 1244:33, 1245:19, 1246:47, 1247:20, 1248:21, 1249:33, 1250:20, 1251:8, 1252:29, 1253:49, 1254:21, 1255:15, 1256:74, 1257:30, 1258:25, 1259:39, 1260:4, 1261:34, 1262:24, 1263:20, 1264:59, 1265:29, 1266:57, 1267:31, 1268:27, 1269:61, 1270:8, 1271:50, 1272:9, 1273:29, 1274:16, 1275:51, 1276:41, 1277:64, 1278:33, 1279:40, 1280:47, 1281:40, 1282:21, 1283:3, 1284:34, 1285:47, 1286:74, 1287:65, 1288:29, 1289:78, 1290:72, 1291:30, 1292:34, 1293:21, 1294:39, 1295:67, 1296:69, 1297:58, 1298:104, 1299:69, 1300:50, 1301:36, 1302:32, 1303:117, 1304:26, 1305:46, 1306:64, 1307:28, 1308:59, 1309:64, 1310:31, 1311:20, 1312:250, 1313:56, 1314:97, 1315:33, 1316:23, 1317:50, 1318:39, 1319:83, 1320:96, 1321:90, 1322:77, 1323:61, 1324:98, 1325:113, 1326:110, 1327:142, 1328:172, 1329:188, 1330:208, 1331:134, 1332:170, 1333:189, 1334:113, 1335:149, 1336:123, 1337:134, 1338:189, 1339:232, 1340:143, 1341:236, 1342:174, 1343:162, 1344:132, 1345:147, 1346:108, 1347:159, 1348:173, 1349:264, 1350:151, 1351:211, 1352:119, 1353:715, 1354:209, 1355:184, 1356:141, 1357:180, 1358:157, 1359:144, 1360:134, 1361:81, 1362:87, 1363:84, 1364:58, 1365:54, 1366:32, 1367:3, 1368:5, 1369:12, 1370:4, 1371:19, 1372:2, 1373:16, 1374:3, 1375:16, 1376:2, 1377:5, 1378:30, 1379:9, 1381:7, 1382:1, 1383:5, 1384:10, 1386:1, 1387:12, 1389:4, 1392:4, 1393:9, 1397:1, 1408:1

### Dorigo polygon/centroid year disagreements

| Zone id | Polygon start/end | Centroid start/end |
|---|---|---|
| `122_27` | `1255-01-01T00:00:00Z` / `1306-12-31T23:59:59Z` | `1256-01-01T00:00:00+00:00` / `1306-12-31T23:59:59+00:00` |
| `122_45` | `1224-01-01T00:00:00Z` / `1328-12-31T23:59:59Z` | `1224-01-01T00:00:00+00:00` / `1317-12-31T23:59:59+00:00` |
| `122_46` | `1240-01-01T00:00:00Z` / `1372-12-31T23:59:59Z` | `1349-01-01T00:00:00+00:00` / `1372-12-31T23:59:59+00:00` |
| `148_52` | `1238-01-01T00:00:00Z` / `1271-12-31T23:59:59Z` | `1222-01-01T00:00:00+00:00` / `1271-12-31T23:59:59+00:00` |
| `148_53` | `1222-01-01T00:00:00Z` / `1352-12-31T23:59:59Z` | `1338-01-01T00:00:00+00:00` / `1352-12-31T23:59:59+00:00` |
| `148_54` | `1222-01-01T00:00:00Z` / `1361-12-31T23:59:59Z` | `1277-01-01T00:00:00+00:00` / `1361-12-31T23:59:59+00:00` |
| `148_56` | `1222-01-01T00:00:00Z` / `1336-12-31T23:59:59Z` | `1291-01-01T00:00:00+00:00` / `1336-12-31T23:59:59+00:00` |
| `148_57` | `1222-01-01T00:00:00Z` / `1348-12-31T23:59:59Z` | `1348-01-01T00:00:00+00:00` / `1348-12-31T23:59:59+00:00` |
| `148_58` | `1222-01-01T00:00:00Z` / `1355-12-31T23:59:59Z` | `1315-01-01T00:00:00+00:00` / `1355-12-31T23:59:59+00:00` |
| `162_35` | `1301-01-01T00:00:00Z` / `1329-12-31T23:59:59Z` | `1013-01-01T00:00:00+00:00` / `1329-12-31T23:59:59+00:00` |
| `162_36` | `1013-01-01T00:00:00Z` / `1319-12-31T23:59:59Z` | `1268-01-01T00:00:00+00:00` / `1319-12-31T23:59:59+00:00` |
| `162_37` | `1013-01-01T00:00:00Z` / `1355-12-31T23:59:59Z` | `1229-01-01T00:00:00+00:00` / `1355-12-31T23:59:59+00:00` |
| `162_38` | `1013-01-01T00:00:00Z` / `1332-12-31T23:59:59Z` | `1281-01-01T00:00:00+00:00` / `1332-12-31T23:59:59+00:00` |
| `176_4` | `1284-01-01T00:00:00Z` / `1349-12-31T23:59:59Z` | `1075-01-01T00:00:00+00:00` / `1349-12-31T23:59:59+00:00` |
| `176_40` | `1075-01-01T00:00:00Z` / `1345-12-31T23:59:59Z` | `1256-01-01T00:00:00+00:00` / `1345-12-31T23:59:59+00:00` |
| `184_13` | `1264-01-01T00:00:00Z` / `1338-12-31T23:59:59Z` | `1079-01-01T00:00:00+00:00` / `1360-12-31T23:59:59+00:00` |
| `192_1` | `1228-01-01T00:00:00Z` / `1236-12-31T23:59:59Z` | `1228-01-01T00:00:00+00:00` / `1363-12-31T23:59:59+00:00` |
| `192_8` | `1326-01-01T00:00:00Z` / `1342-12-31T23:59:59Z` | `1328-01-01T00:00:00+00:00` / `1342-12-31T23:59:59+00:00` |
| `53_4` | `1319-01-01T00:00:00Z` / `1355-12-31T23:59:59Z` | `1339-01-01T00:00:00+00:00` / `1355-12-31T23:59:59+00:00` |
| `90_22` | `1241-01-01T00:00:00Z` / `1353-12-31T23:59:59Z` | `1241-01-01T00:00:00+00:00` / `1333-12-31T23:59:59+00:00` |

### Conservative building-prose extraction candidates

These42 matches on40 feature IDs are screening results, not a complete/validated building-age table. Round century-like values, foundation versus rebuilding, multiple components and cited edition year must be adjudicated.

| EDIFI_ID | Literal numeric value | Quoted matched construction/foundation/reconstruction phrase |
|---:|---:|---|
| 15 | 1388 | eretto nel 1388 |
| 22 | 1600 | costruzione è del 1600 |
| 31 | 1000 | costruzione è del 1000 |
| 31 | 1105 | ricostruito nel 1105 |
| 137 | 1500 | costruzione del 1500 |
| 566 | 1300 | costruzione del 1300 |
| 711 | 1600 | costruzione del 1600 |
| 934 | 1600 | costruzione del 1600 |
| 967 | 1600 | costruzione del 1600 |
| 1045 | 1623 | eretta nel 1623 |
| 1424 | 1600 | costruito nel 1600 |
| 1459 | 1600 | eretto nel 1600 |
| 1620 | 1580 | eretto nel 1580 |
| 1680 | 1598 | eretto nel 1598 |
| 2155 | 1600 | costruzione del 1600 |
| 2909 | 1500 | eretto nel 1500 |
| 2909 | 1822 | ricostruito nel 1822 |
| 3147 | 1900 | costruzione del 1900 |
| 3206 | 1500 | costruzione del 1500 |
| 3232 | 1956 | ricostruito nel 1956 |
| 3259 | 1506 | eretta nel 1506 |
| 3327 | 1736 | eretta nel 1736 |
| 3426 | 1432 | fondato nel 1432 |
| 3488 | 1677 | costruzione del 1677 |
| 3941 | 1693 | eretta nel 1693 |
| 4032 | 1600 | Costruzione del 1600 |
| 4116 | 1709 | costruzione del 1709 |
| 6394 | 1531 | eretta nel 1531 |
| 6427 | 1400 | costruzione del 1400 |
| 6597 | 1700 | Costruzione del 1700 |
| 6866 | 1300 | eretto nel 1300 |
| 6915 | 1500 | Costruzione del 1500 |
| 7312 | 1800 | Costruzione del 1800 |
| 7440 | 1559 | eretto nel 1559 |
| 7451 | 1500 | Eretto nel 1500 |
| 7496 | 1395 | fondato nel 1395 |
| 7706 | 1600 | costruzione del 1600 |
| 7956 | 1600 | costruzione del 1600 |
| 8142 | 1904 | eretta nel 1904 |
| 8297 | 1700 | costruzione del 1700 |
| 8397 | 1663 | ricostruita nel 1663 |
| 8510 | 1960 | costruzione del 1960 |
