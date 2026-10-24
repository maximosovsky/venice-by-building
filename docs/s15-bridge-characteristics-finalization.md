# S15 bridge characteristics finalization

## Artifact and populations

`web/data/bridge-characteristics.json`: 1,575,895 bytes; SHA256 `6bb5d50f091452320969f5ea1430862664819a6c6f61ba424b007076e2d3dcec`.

The authoritative audit matches 328 of the unchanged 346 route bridges to 331 municipal records/polygon parts from the actual 1,259-record PONTE source. Eighteen route bridges lack an accepted strong municipal match; absence is not deletion evidence. There are 327 rendered GID links to 327 matched bridges. `w121674081` has municipal evidence but no accepted atlas GID and remains in the full bridge catalog.

Materials: 324 `03=muratura`, 4 `01=calcestruzzo`. Purposes: 327 `04=pedonale`, 1 `02=stradale`. All 328 are `01=ponte`. Class/use is not a current public-access assertion. All 328 long/short dimensions are derived minimum-rotated-envelope dimensions of complete footprint unions, not surveyed span or usable deck width.

## Additive compatibility and exact raw preservation

The real consumer's `declaredCount` previously returned null, and `recordsForGid` treated an inline identity-only object as the complete characteristics record. Failing targeted tests reproduced these producer/consumer contract mismatches. The export now supplies `record_count:328`; `by_gid` contains literal `by_bridge_id` catalog keys. The complete former `by_gid` identity objects are preserved in the additional `gid_identity` field. No evidence/catalog record was dropped, and no consumer/UI code was changed.

All 331 raw native EPSG:6706 shapefile geometries, including original vertex order, complete rings, Z coordinates and numeric precision, are now additionally preserved under each bridge's `geometry_source`. Existing `geometry_local` polygons remain unchanged: exact ring/vertex correspondence to the explicitly projected EPSG:32633 source is verified at the declared four-decimal local-coordinate precision. These local coordinates are not described as unrounded raw source geometry. The producer's optional `source_geometries` parameter is wired to actual native source geometry in its CLI path.

All seven numeric/extrusion evidence fields remain raw and uninterpreted as measured height: 1,324 numeric `92.0` values and 993 string `92` values across 331 municipal parts. All 2,317 values have null measured value and unit. Raw polygon Z is retained but has no established vertical datum/unit and is not promoted to bridge height. Verified height measurement count is zero. No bridge construction date is inferred from the 2010 edition or GIS metadata.

## Real verification

Initial targeted suite: 19 passed. Expanded S13/S15 suite: 27 passed in 96.72 s. After additive native-geometry preservation, all 9 bridge cases passed; the final augmented exhaustive bridge check passed in 8.83 s. Tests read the actual ZIP shapefile, every accepted audit/FID/strong-overlap record, source attributes and complete polygon rings; compare all dimensions/classifications; reject unknown heights; rederive every signed GID link; and run the actual data-enrichment Node consumer. A full producer rebuild using all actual native and projected geometries exactly reproduces all 328 written bridge entries. No full repository suite or UI/browser was run.

Source hashes were read and matched for archive, dictionary, route, config and attributes. ZIP/component integrity and dictionary evidence originate in the authoritative audit; this finalization additionally read the actual source layer and official dictionary pages. Source ZIP SHA256: `6c83cdc4b97f269c752d9c9be4d0609631570580dd45ae12db3cd4851f9ca336`; layer `ComuneVenezia_aree/PONTE.shp`; source CRS EPSG:6706. Exact original 2010 download request is missing from the existing manifest and is not invented.

## Rights evidence and publication limitation

`read_file` evidence: `data/raw/Venice_Geodata_20261022_2004/README.md`, line 32, states that dataset redistribution licensing was not independently established. `docs/municipal-ponte-audit-20261024_091400Z.md`, lines 86–100, records the source/dictionary, missing download-manifest entry and unresolved municipal rights. Official DB Topografico Versione 2.6 PDF pages 14 and 57–58 were actually read: enum `92=Non assegnato`, documented material/use/type labels and extrusion semantics are confirmed. Numeric 92 is conservatively retained as missing-information candidate rather than falsely claimed as measured height.

Municipal source and publication licenses remain null; `actual_geometry` remains `blocked_pending_municipal_license`. These are internal preparation artifacts until municipal redistribution permission is established. The repository LICENSE's CC BY 4.0 claim for **VPRG Citta Antica classification** is not proof of PONTE GEODBT rights. OSM contribution attribution is retained separately as ODbL 1.0; software MIT does not license third-party source geometry. Download availability does not establish redistribution permission.

No routes, meshes, UI/app, unrelated producers/tests, commits, pushes, memories or skills were changed.
