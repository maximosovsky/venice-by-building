# Venice building atlas workspace

## Saved material

- data/raw/Venice_All_Data_20261022_2025.zip: verified combined download package.
- data/raw/Venice_Geodata_20261022_2004_verified.zip: verified Veneto topographic package.
- data/raw/Venice_Geodata_20261022_2004/: original topographic downloads, catalog and manifest.
- data/raw/Venice_Historical_20261022_2025/: historical datasets, repository archives and extracted data, Atlas tiles, derived MBTiles/GeoJSON, municipal PDFs, README and verification summary.
- docs/engine-analysis_20261022.md: renderer comparison, exact data contracts, limitations, licensing and proposed Venice adaptation.
- research/engines/: downloaded source-code snapshots and audit evidence for all inspected engines.
- research/provenance/: source ledgers, download/verification scripts and initial probes.
- research/transcripts/: completed research transcripts.
- research/copy_manifest_20261022_2109.json: 920 copied files, sizes and source/destination SHA-256 verification.

Files were copied, not moved. The originals in Downloads and scratch were left unchanged. Archived and extracted copies are intentionally retained; this workspace includes duplicate representations.

## Incomplete download remnants

Preserved for completeness, but DO NOT USE AS VALID GEODATA:
- data/raw/Venice_Geodata_20261022_2004/2010_Venezia_aree.zip
- data/raw/Venice_Geodata_20261022_2004/2006_Laguna_aree.zip

These were interrupted downloads. Use the verified replacements:
- 2010_Venezia_aree_retry.zip
- 2006_Laguna_aree_complete.zip

## OSM extracts (22.10.2026)

- data/raw/osm/veneto.osm.pbf: regional source extract (281 015 629 bytes, openstreetmap.fr).
- data/raw/osm/venice_island_polygon_osm_4817103.geojson: the island of Venice, OSM relation 4817103.
- data/raw/osm/venice_historic_centre_polygon_osm_6628638.geojson: Venezia-Murano-Burano, OSM relation 6628638.
- data/raw/osm/venezia_island.osm.pbf: island extract — 148 251 nodes, 22 998 ways, 849 relations, 5 714 building ways, 1 399 building parts, 16 394 address nodes.
- data/raw/osm/venezia_historic_centre.osm.pbf: historic centre incl. Giudecca, San Giorgio, La Certosa, Murano, Burano — 346 792 nodes, 37 289 ways, 1 089 relations, 10 650 building ways, 22 622 address nodes.
- data/raw/osm/venice_island_osm_manifest.json: sizes, SHA-256, object counts.
- data/raw/osm/themes/: tag coverage per extract and polygons of buildings that actually carry a date tag.
- License: OpenStreetMap contributors, ODbL 1.0 — attribution and share-alike required.

Date tags in OSM are nearly absent: on the island 21 building ways carry `start_date` and 1 carries `year_of_construction`, so OSM cannot supply building ages. Dating has to come from the municipal classification and the historical registers.

## Municipal VPRG classification and A8a sheets (22.10.2026)

- data/raw/vprg/venezia_classificazione_unita_edilizie.geojson: 15 584 units, EPSG:4326, 56 classes, 14 387 units intersecting the island.
- data/raw/vprg/A8a/: 17 A8a sheet PDFs, one page each, 37.9 MB total.
- data/raw/vprg/vprg_manifest_20261022.json: hashes, field list, class table, period totals, caveats.
- docs/vprg-classification_20261022.md: what the classes mean, how to use them for interval dating, and their limits.

The classification gives three coarse periods (pre-19th c 10 028 units, 19th c 899, 20th c 4 115, undated 542), not construction years. `DATA_CSC` is the date of the Commissione Scientifica decision, not a building date.

Atlas source dates are historical-state intervals, not automatically construction dates. Source-code downloads are research material; their presence does not imply a reuse license for every application.

No web application, production data normalization or renderer implementation has been created. No Git repository or deployment was initialized by this saving task.
