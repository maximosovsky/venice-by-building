# Municipal PONTE 2010 versus OSM and current bridge route — FIRST stage only

Audit batch: `20261024_091400Z`. Report completed: `2026-10-24T09:16:00.890674+00:00`.

## Decision and scope

Read-only audit complete. **No bridge added, route regenerated, website/card edited, source dataset changed, commit or push performed by this audit.** Retain the current **346** bridge route. This report is a review ledger, not authority to add any candidate.

The geometric route boundary is the exact original Venezia island polygon (relation/4817103) union the existing San Pietro land and two bridge deck polygons. Existing port/transport exclusion polygons are evaluated separately. No buffered scope and no proximity node snapping were used.

**Important scope correction:** the file named `venice_historic_centre_polygon_osm_6628638.geojson` is actually OSM administrative relation **Venezia-Murano-Burano**, `admin_level=10`, not a narrow historic-centre land census. Its 559 intersecting municipal rows must NOT be called 559 historic pedestrian bridges. Named island source overlap is reported separately below. A formally agreed broader historic-centre land boundary remains an acceptance gap; the current approved route boundary is fully audited.

## Exhaustive municipal reconciliation

| Geographic class | Municipal source polygons |
|---|---:|
| Inside route (>=99% polygon area) | 391 |
| Route boundary ambiguous (positive partial overlap) | 9 |
| Broader administrative boundary, outside route | 157 |
| Broader administrative boundary ambiguous | 2 |
| Outside broader administrative boundary | 700 |
| **All source records** | **1259** |

The strictly route-inside population contains 4 records overlapping excluded port polygons by >1%: **387 municipal records / 384 conservatively grouped objects** remain strictly inside and outside those port polygons. These are municipal objects, not a claim of verified publicly accessible bridges. Nine partial-boundary records remain separately ambiguous. Outside the available OSM extracts, the ledger does not claim OSM absence.

All source records have stable audit IDs `PONTE2010:fIDNNNNNN` (zero-based shapefile record index bound to ZIP/layer SHA256). The source DBF has **no unique bridge ID or name**. `CODICE=020301` is a class code, not identity.

## Physical parts and route correspondence

**1259 source polygons → 1255 inferred groups**, with 4 two-part groups / 4 extra parts consolidated. One overlap-compatible pair and three compatible municipal pairs tied to the same single OSM deck are grouped. This is conservative source interpretation, not field confirmation. Six contact pairs are retained for review; touching/shared landings do not imply one bridge.

Within route-intersecting geography: **397 groups** = {'osm_known_excluded': 55, 'osm_known_unresolved': 3, 'route_included': 328, 'candidate_missing_osm_bridge_identity': 7, 'ambiguous_osm_identity': 3, 'osm_known_not_required': 1}.

The existing original OSM inventory is fully retained: **418 = 346 required + 71 excluded + 1 unresolved physical group**, plus **6 unmatched OSM deck records**. The bidirectional OSM ledger therefore has **424** identities. **328 / 346 current route bridges** have strong municipal correspondence; **18** have none under conservative overlap thresholds. Their exact IDs are in `summary.json` and `osm-route-reconciliation.csv`. Absence in the older municipal layer is not deletion evidence.

The 55 unambiguously matched municipal rows already excluded by the original route reconcile as **36 access:private, 16 immediate pedestrian dead ends, 2 disconnected, 1 port/transport**. Disconnection is explicitly not inferred private access. User/access/dead-end/transport policy from existing route evidence is preserved.

## Matching and network evidence

- Metric comparison: **EPSG:32633**. Source CRS is **EPSG:6706** (ETRF2000 geographic); WGS84 interchange uses explicit transforms. All 1259 source geometries were valid.
- Strong deck match: actual intersection >=1 m² and municipal- or deck-area fraction >=0.35.
- Strong bridge highway match: original bridge-tagged path overlap >=2 m and >=25% of that path length; mere landing intersection does not qualify.
- Every candidate includes literal raw municipal attributes, OSM deck/highway IDs/tags, original node IDs, overlapping adjacent node pairs, exact whole-way scope and reachable-node checks where applicable. No coordinate snapping or newly invented path is used.
- Supplementary 15 m nearby source context is **evidence search only**. It is not accepted identity, not an access override, and not a connector.
- Closed `area=yes` pedestrian polygons are rejected as proof of through-crossings. The initial proximity-looking case `fID000226` touches the closed Campiello della Fornasa Vecia boundary (way/240496222); it is **not** a confirmed missing bridge tag. Nearby Ponte Contarini deck is 0.954 m away, but is not auto-matched.

## Ranked review ledger (all 14 nonaccepted cases)

**Zero verified probable missing public crossings.** Seven municipal objects lack strong OSM bridge identity; all remain candidates, not asserted absent bridges. Two apparent unmatched decks are proven railway spurs by municipal use code plus overlapping original OSM rail tags. Remaining cases are exact known decks, transport geometry or ambiguous parallel path/deck identities.

| Priority | Municipal record | Longitude | Latitude | Disposition | Source/reason |
|---:|---|---:|---:|---|---|
| 2 | `PONTE2010:fID000226` | 12.3251576 | 45.4474024 | candidate_geometry_mismatch_near_known_osm_bridge | near decks 556123650; Nearby OSM deck way/556123650 at 0.954 m; evidence only, NOT accepted identity or snapped crossing. Private tags, if present, apply to that OSM object, not automatically the municipal polygon. |
| 2 | `PONTE2010:fID000436` | 12.3422376 | 45.4342378 | candidate_missing_osm_bridge_identity_no_verified_network | no strong bridge identity; No exact/strong OSM bridge match and no continuous original-node public highway through-crossing. Nearby buildings/water alone do not establish access, survival or physical identity. |
| 2 | `PONTE2010:fID000437` | 12.3422546 | 45.4340692 | candidate_missing_osm_bridge_identity_no_verified_network | no strong bridge identity; No exact/strong OSM bridge match and no continuous original-node public highway through-crossing. Nearby buildings/water alone do not establish access, survival or physical identity. |
| 2 | `PONTE2010:fID000887` | 12.3189057 | 45.4443828 | candidate_missing_osm_bridge_identity_no_verified_network | no strong bridge identity; No exact/strong OSM bridge match and no continuous original-node public highway through-crossing. Nearby buildings/water alone do not establish access, survival or physical identity. |
| 2 | `PONTE2010:fID000950` | 12.3413335 | 45.4367179 | candidate_geometry_mismatch_near_known_osm_bridge | near decks 556439303,556439304; Nearby OSM deck way/556439303 at 2.453 m; evidence only, NOT accepted identity or snapped crossing. Private tags, if present, apply to that OSM object, not automatically the municipal polygon. |
| 2 | `PONTE2010:fID000988` | 12.3529232 | 45.4367449 | candidate_missing_osm_bridge_identity_no_verified_network | no strong bridge identity; No exact/strong OSM bridge match and no continuous original-node public highway through-crossing. Nearby buildings/water alone do not establish access, survival or physical identity. |
| 2 | `PONTE2010:fID000989` | 12.3508615 | 45.4365977 | candidate_missing_osm_bridge_identity_no_verified_network | no strong bridge identity; No exact/strong OSM bridge match and no continuous original-node public highway through-crossing. Nearby buildings/water alone do not establish access, survival or physical identity. |
| 3 | `PONTE2010:fID000993` | 12.3517563 | 45.4384853 | known_osm_deck_public_access_connectivity_unresolved | d555841273; Exact OSM deck overlap but no overlapping pedestrian highway; lack of topology is not proof of private access. |
| 4 | `PONTE2010:fID000222` | 12.3147012 | 45.4378117 | known_osm_railway_not_public_pedestrian_required | d569427400; Municipal PONTE_USO=03 ferroviario; original OSM bridge-tagged rail spur overlaps. No pedestrian highway crossing overlaps. |
| 4 | `PONTE2010:fID000428` | 12.3163423 | 45.4399919 | osm_known_port_transport_not_route_required | d583724426, w161639264, w888348569, w898631459, w898914789; Existing port/transport exclusions or Ponte della Libertà deck source tags; not a missing historic pedestrian crossing. |
| 4 | `PONTE2010:fID000429` | 12.3113431 | 45.4412694 | known_osm_parallel_deck_path_identity_ambiguous_transport | d583725368, w277038769, w450261873, w450261875, w66331559; Multiple real bridge deck/path identities overlap one municipal polygon. Tronchetto transport context retained; no collapse by shared landing. |
| 4 | `PONTE2010:fID000430` | 12.3120529 | 45.4413287 | known_osm_parallel_deck_path_identity_ambiguous_transport | d1057613903, w1288085260; Multiple real bridge deck/path identities overlap one municipal polygon. Tronchetto transport context retained; no collapse by shared landing. |
| 4 | `PONTE2010:fID000806` | 12.3166397 | 45.4416737 | known_osm_railway_not_public_pedestrian_required | d1232707316; Municipal PONTE_USO=03 ferroviario; original OSM bridge-tagged rail spur overlaps. No pedestrian highway crossing overlaps. |
| 4 | `PONTE2010:fID001241` | 12.2987262 | 45.4540311 | known_osm_railway_not_public_pedestrian_required | d583727060; Municipal PONTE_USO=03 ferroviario; original OSM bridge-tagged rail spur overlaps. No pedestrian highway crossing overlaps. |

Final classification counts: `{"candidate_geometry_mismatch_near_known_osm_bridge": 2, "candidate_missing_osm_bridge_identity_no_verified_network": 5, "known_osm_deck_public_access_connectivity_unresolved": 1, "known_osm_railway_not_public_pedestrian_required": 3, "osm_known_port_transport_not_route_required": 1, "known_osm_parallel_deck_path_identity_ambiguous_transport": 2}`. All 14 exact source/tag evidence records are in `review-candidates-enriched.json`; final human-review decisions are in `final-dispositions.csv/json`.

## Other-island evidence (not route requirements)

These are municipal polygon overlaps with real OSM island way/relation geometry, not public bridge totals. Overlap counts can include boundary/approach records and **must not be added together**. `island-partition.json` provides an exclusive deterministic reporting partition while retaining all overlapping source evidence.

| Named source island | Municipal polygon overlap records |
|---|---:|
| Giudecca | 25 |
| Sacca Fisola | 7 |
| Isola di San Giorgio Maggiore | 1 |
| Murano | 10 |
| Burano | 10 |
| Sant'Erasmo | 32 |
| Isola Le Vignole | 9 |
| Mazzorbo | 3 |
| Isola Torcello | 18 |

## Source schema, dates and reuse rights

Original archive: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_aree_retry.zip`; internal layer `ComuneVenezia_aree/PONTE.shp`; ZIP SHA256 `6c83cdc4b97f269c752d9c9be4d0609631570580dd45ae12db3cd4851f9ca336`. CRC tested for the complete real archive. All 21 nongeometry DBF fields, value counts, component hashes and catalog rows are preserved in `source-manifest.json`.

The local official **DB Topografico, Versione 2.6** PDF dictionary (pages **14, 57–58**) establishes actual meanings: material `03=muratura`; use `04=pedonale`, `03=ferroviario`; type `01=ponte`; structure `08=fisso non specificato`. Enum `92=Non assegnato` is missing information, not a structure property. Repeated numeric `92` values are retained raw and are not promoted to surveyed elevations/heights. Materials/type/use are source classifications, not public access or current condition.

`2010` is the catalog edition/update. `DATA_CRE` and `DATA_MOD` are GIS metadata; **no construction-year field** exists. No precise bridge year is invented.

Existing `download_manifest.json` lacks the 2010 archive/PDF download entry. The local archive, catalog 2010 ETRF2000 lot and component hashes are verified, but the exact original download request is not invented. The raw README explicitly states that **municipal redistribution licensing was not independently established**. OSM is attributed to OpenStreetMap contributors, ODbL 1.0. Keep these audit artifacts internal for parent review until municipal reuse rights are checked; do not upload raw geometry or publish this report as an unrestricted dataset.

## Verification and acceptance gaps

All **15 census verification assertions** passed, plus CSV readback count checks: 1259 unique records, complete geographic/status reconciliation, group coverage once-only, 424 OSM ledger identities, 14 unique candidate decisions, valid coordinate/CRS ranges and ZIP CRC. 1148 pre-existing protected files were fingerprinted; no protected changes occurred during the successful batch. Source and working route hashes remained identical.

Acceptance gaps are explicit: broader historic-centre land definition; municipal reuse rights and missing original download entry; field confirmation of candidate survival/access/two-bank identity; conservative physical-part joins; outside-extract OSM coverage. No candidate warrants automatic route insertion.

## Artifacts and reproducibility

Primary artifact directory: `D:\100_star\venice\reports\municipal-ponte-audit_20261024_091400Z`.

- `municipal-census.csv/json`: exhaustive 1259 source rows and geometry/tag evidence.
- `physical-groups.csv/json` and `part-grouping-evidence.json`: inferred parts and unresolved contacts.
- `osm-route-reconciliation.csv/json`: all 424 original OSM identities, included/excluded/unresolved source evidence.
- `review-candidates-enriched.csv/json`, `final-dispositions.csv/json`: exact candidate review evidence and final classifications.
- `summary.json`, `context-summary.json`, `island-partition.json`: written populations and separate island evidence.
- `source-manifest.json`, `baseline.json`, `verification.json`: source/rights/schema, hashes and quality checks.
- `checkpoint-00.json` through `checkpoint-12.json`: persisted extraction batches.
- `audit.py`, `context_review.py`, `finalize.py`: exercised audit-only scripts. They use exclusive-create writes and refuse overwriting earlier artifacts. To repeat, copy scripts to a **new timestamp directory** before execution.

Earlier new audit attempt directories `municipal-ponte-audit_20261024_090316Z` and `municipal-ponte-audit_20261024_091018Z` are deliberately preserved, **not final deliverables**. The first caught a concurrent parent website change and an area-boundary false positive; the second is an unexecuted intermediate syntax-error script. Only this successful `091400Z` batch and this report are authoritative. No earlier repository file was overwritten.
