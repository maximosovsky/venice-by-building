# S13 address export finalization

## Written artifact and tested populations

`web/data/addresses.json`: 12,597,860 bytes; SHA256 `d485872139b326b729110b21c6d5ed9fff99f1796ab02e4d91aa7fec55e1b456`.

All 31,623 actual Civici2024 source rows survive, with 31,623 unique content-hash/occurrence record IDs. There are 31,618 distinct coordinate pairs: coincident points are retained, not merged. No exact duplicate feature rows; the repeated label `SP 2347` has two separately preserved records. Source feature IDs are absent. Actual source fields are exactly `CIVICI`, `sestiere`, `number`, `letter`; labels and sestieri are strings, all 31,623 numbers are integers, and letters are 7,590 strings plus 24,033 nulls. Export aliases `label`, `sestiere`, `number`, `letter` preserve these values and types.

Sestieri: CN 7,765; CS 7,341; SM 5,533; DD 4,366; SP 3,704; SC 2,914. Original EPSG:32633 easting/northing is preserved exactly; lon/lat is explicitly transformed and x/z uses the actual atlas origin `[291839.403,5034609.585]`.

Matches: 3,065 contained address-point associations to 990 rendered building GIDs; 18,635 boundary, 209 ambiguous, 9,714 unmatched. Only contained records receive a GID. These are **not verified entrances, access points, dwellings or independent building identities**. There is no nearest-building inference or geographic filtering. A unique signed writer identity, actual nonempty mesh GID, original-footprint containment and simplified-footprint containment with a 0.35 m boundary guard are required. The atlas has 11,137 building writer rows; 11,126 uniquely resolved footprints. Eleven GIDs with duplicate source/writer relation identities remain unresolved. All 465 nonbuilding writer rows are excluded.

## Tests and changes

Initial targeted tests: 19 passed. New failing tests caught acceptance of an unsupported source OSM type and the separately owned bridge consumer mismatch. S13 now rejects source types other than way/relation and nonpositive/noninteger/bool OSM IDs; literal building identity consistency remains required. No address JSON regeneration was necessary: its actual rows already satisfy the stricter guard.

Expanded two-module targeted run: 27 passed in 96.72 s (18 address cases, 9 bridge cases). Address tests recompute **every source row**, candidate list, status, ID, coordinate and reciprocal GID index from the actual sources and packed inventory; they also execute `declaredCount`, `recordsForGid` and address search from the real `web/data-enrichment.js` under Node, without opening the UI. No full repository suite was run. One initial 120 s invocation timed out; the subsequent targeted invocation completed successfully.

## Source and rights evidence

Source: `data/raw/Venice_Historical_20261022_2025/repositories/venice-data-week-data/venice-data-week-data-main/2024-geometries/2024_Civici_EPSG32633.geojson`, 6,728,890 bytes; SHA256 `df672cc2626b38d877b0b63bf045132dd931fd4e3e8119b1b65a45d9078c7fff`. Source, building source, atlas config, attributes and pack hashes were checked against artifact metadata.

`read_file` evidence: the historical archive README, line 6, explicitly requires checking individual licenses and says reusable licensing was not established for every repository. All twelve repository README files were read; none contains a license/copyright/Creative Commons/rights statement. File discovery found no root/2024 README or LICENSE in this local snapshot. Therefore `source.license` remains null and `license_status` remains `not_established_in_local_source_snapshot`. This is a local evidence limitation, not a claim that the publisher has no license anywhere. CC BY 4.0 for the separate 1808 Zenodo release and VPRG classification, and MIT for software, do **not** establish Civici2024 rights. Do not represent the address export as cleared for unrestricted public redistribution.

Scope: only S13/S15 producers, their tests, bridge JSON compatibility/raw-geometry additions and these owned documentation files were modified. No UI/app, routes, meshes, commits, pushes, memories or skills were changed.
