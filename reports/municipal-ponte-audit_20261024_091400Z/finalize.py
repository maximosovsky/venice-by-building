"""Finalize English report from written evidence, new paths only."""
import json,csv,hashlib,subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
O=Path(__file__).resolve().parent;R=Path('D:/100_star/venice');L=lambda p:json.loads(p.read_text(encoding='utf-8'))
s=L(O/'summary.json'); rows=L(O/'municipal-census.json'); groups=L(O/'physical-groups.json'); reviews=L(O/'review-candidates-enriched.json'); manifest=L(O/'source-manifest.json'); verification=L(O/'verification.json');baseline=L(O/'baseline.json')
final=[]
for c in reviews:
 evid=c['nearby_source_evidence_15m']; overlapping_rail=[e for e in evid if e['tags'].get('railway') and e['tags'].get('bridge') not in [None,'no'] and e['distance_m']==0 and e['overlap_length_m']>2]
 near_decks=[e for e in evid if e['tags'].get('man_made')=='bridge']
 if overlapping_rail and c['municipal_attributes'][0]['PONTE_USO']=='03':cl='known_osm_railway_not_public_pedestrian_required';why='Municipal PONTE_USO=03 ferroviario; original OSM bridge-tagged rail spur overlaps. No pedestrian highway crossing overlaps.';rank=4
 elif c['final_classification']=='osm_known_port_transport_not_route_required':cl=c['final_classification'];why='Existing port/transport exclusions or Ponte della Libertà deck source tags; not a missing historic pedestrian crossing.';rank=4
 elif c['status']=='ambiguous_osm_identity':cl='known_osm_parallel_deck_path_identity_ambiguous_transport';why='Multiple real bridge deck/path identities overlap one municipal polygon. Tronchetto transport context retained; no collapse by shared landing.';rank=4
 elif c['status']=='osm_known_unresolved':cl='known_osm_deck_public_access_connectivity_unresolved';why='Exact OSM deck overlap but no overlapping pedestrian highway; lack of topology is not proof of private access.';rank=3
 elif near_decks:
  nearest=min(near_decks,key=lambda e:e['distance_m']);cl='candidate_geometry_mismatch_near_known_osm_bridge';why=f"Nearby OSM deck way/{nearest['osm_way_id']} at {nearest['distance_m']} m; evidence only, NOT accepted identity or snapped crossing. Private tags, if present, apply to that OSM object, not automatically the municipal polygon.";rank=2
 else:cl='candidate_missing_osm_bridge_identity_no_verified_network';why='No exact/strong OSM bridge match and no continuous original-node public highway through-crossing. Nearby buildings/water alone do not establish access, survival or physical identity.';rank=2
 final.append({'municipal_ids':c['municipal_ids'],'group_id':c['group_id'],'lon':c['lon'],'lat':c['lat'],'classification':cl,'priority':rank,'reason':why,'strong_osm_identities':c['strong_osm_identities'],'nearby_deck_ids':[e['osm_way_id'] for e in near_decks],'overlapping_rail_way_ids':[e['osm_way_id'] for e in overlapping_rail],'source_evidence_artifact':'review-candidates-enriched.json','decision':'review_only_no_autoadd','construction_year':None})
final.sort(key=lambda c:(c['priority'],c['group_id']))
with (O/'final-dispositions.json').open('x',encoding='utf-8') as f:json.dump(final,f,ensure_ascii=False,indent=2)
with (O/'final-dispositions.csv').open('x',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(final[0]));w.writeheader()
 for r in final:w.writerow({k:json.dumps(v) if isinstance(v,list) else v for k,v in r.items()})
count=Counter(c['classification'] for c in final)
strictped=sum(g['scope_zones']==['route_inside'] and all(rows[int(sid.split('fID')[1])]['port_overlap_fraction']<=.01 for sid in g['municipal_ids']) for g in groups)
by_status=Counter(g['status'] for g in groups if any(z.startswith('route_') for z in g['scope_zones']))
# Actual fully enumerated named island evidence is an overlap census, not a fabricated geographical partition.
named=s['named_island_row_counts_overlapping_not_partition'];parts=L(O/'part-grouping-evidence.json')['merge_edges']
md=f'''# Municipal PONTE 2010 versus OSM and current bridge route — FIRST stage only

Audit batch: `{s['timestamp_utc']}`. Report completed: `{datetime.now(timezone.utc).isoformat()}`.

## Decision and scope

Read-only audit complete. **No bridge added, route regenerated, website/card edited, source dataset changed, commit or push performed by this audit.** Retain the current **346** bridge route. This report is a review ledger, not authority to add any candidate.

The geometric route boundary is the exact original Venezia island polygon (relation/4817103) union the existing San Pietro land and two bridge deck polygons. Existing port/transport exclusion polygons are evaluated separately. No buffered scope and no proximity node snapping were used.

**Important scope correction:** the file named `venice_historic_centre_polygon_osm_6628638.geojson` is actually OSM administrative relation **Venezia-Murano-Burano**, `admin_level=10`, not a narrow historic-centre land census. Its 559 intersecting municipal rows must NOT be called 559 historic pedestrian bridges. Named island source overlap is reported separately below. A formally agreed broader historic-centre land boundary remains an acceptance gap; the current approved route boundary is fully audited.

## Exhaustive municipal reconciliation

| Geographic class | Municipal source polygons |
|---|---:|
| Inside route (>=99% polygon area) | {s['scope_rows']['route_inside']} |
| Route boundary ambiguous (positive partial overlap) | {s['scope_rows']['route_boundary_ambiguous']} |
| Broader administrative boundary, outside route | {s['scope_rows']['broader_centro_outside_route']} |
| Broader administrative boundary ambiguous | {s['scope_rows']['centro_boundary_ambiguous']} |
| Outside broader administrative boundary | {s['scope_rows']['outside_broader_centro']} |
| **All source records** | **{s['source_rows']}** |

The strictly route-inside population contains 4 records overlapping excluded port polygons by >1%: **387 municipal records / {strictped} conservatively grouped objects** remain strictly inside and outside those port polygons. These are municipal objects, not a claim of verified publicly accessible bridges. Nine partial-boundary records remain separately ambiguous. Outside the available OSM extracts, the ledger does not claim OSM absence.

All source records have stable audit IDs `PONTE2010:fIDNNNNNN` (zero-based shapefile record index bound to ZIP/layer SHA256). The source DBF has **no unique bridge ID or name**. `CODICE=020301` is a class code, not identity.

## Physical parts and route correspondence

**1259 source polygons → {s['inferred_physical_groups']} inferred groups**, with {s['multipart_groups']} two-part groups / {s['merged_extra_parts']} extra parts consolidated. One overlap-compatible pair and three compatible municipal pairs tied to the same single OSM deck are grouped. This is conservative source interpretation, not field confirmation. Six contact pairs are retained for review; touching/shared landings do not imply one bridge.

Within route-intersecting geography: **{s['route_scoped_group_count']} groups** = {dict(by_status)}.

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
'''
for c in final:
 ids=', '.join(c['municipal_ids']); evidence=', '.join(c['strong_osm_identities']) or ('near decks '+','.join(map(str,c['nearby_deck_ids'])) if c['nearby_deck_ids'] else 'no strong bridge identity')
 md+=f"| {c['priority']} | `{ids}` | {c['lon']:.7f} | {c['lat']:.7f} | {c['classification']} | {evidence}; {c['reason']} |\n"
md+='\nFinal classification counts: `'+json.dumps(dict(count))+'`. All 14 exact source/tag evidence records are in `review-candidates-enriched.json`; final human-review decisions are in `final-dispositions.csv/json`.\n'
md+='''
## Other-island evidence (not route requirements)

These are municipal polygon overlaps with real OSM island way/relation geometry, not public bridge totals. Overlap counts can include boundary/approach records and **must not be added together**. `island-partition.json` provides an exclusive deterministic reporting partition while retaining all overlapping source evidence.

| Named source island | Municipal polygon overlap records |
|---|---:|
'''
for name in ['Giudecca','Sacca Fisola','Isola di San Giorgio Maggiore','Murano','Burano',"Sant'Erasmo",'Isola Le Vignole','Mazzorbo','Isola Torcello']:
 md+=f'| {name} | {named.get(name,0)} |\n'
md+=f'''
## Source schema, dates and reuse rights

Original archive: `{manifest['municipal_archive']['path']}`; internal layer `{manifest['municipal_archive']['layer']}`; ZIP SHA256 `{manifest['municipal_archive']['sha256']}`. CRC tested for the complete real archive. All 21 nongeometry DBF fields, value counts, component hashes and catalog rows are preserved in `source-manifest.json`.

The local official **DB Topografico, Versione 2.6** PDF dictionary (pages **14, 57–58**) establishes actual meanings: material `03=muratura`; use `04=pedonale`, `03=ferroviario`; type `01=ponte`; structure `08=fisso non specificato`. Enum `92=Non assegnato` is missing information, not a structure property. Repeated numeric `92` values are retained raw and are not promoted to surveyed elevations/heights. Materials/type/use are source classifications, not public access or current condition.

`2010` is the catalog edition/update. `DATA_CRE` and `DATA_MOD` are GIS metadata; **no construction-year field** exists. No precise bridge year is invented.

Existing `download_manifest.json` lacks the 2010 archive/PDF download entry. The local archive, catalog 2010 ETRF2000 lot and component hashes are verified, but the exact original download request is not invented. The raw README explicitly states that **municipal redistribution licensing was not independently established**. OSM is attributed to OpenStreetMap contributors, ODbL 1.0. Keep these audit artifacts internal for parent review until municipal reuse rights are checked; do not upload raw geometry or publish this report as an unrestricted dataset.

## Verification and acceptance gaps

All **{len(verification['checks'])} census verification assertions** passed, plus CSV readback count checks: 1259 unique records, complete geographic/status reconciliation, group coverage once-only, 424 OSM ledger identities, 14 unique candidate decisions, valid coordinate/CRS ranges and ZIP CRC. {verification['protected_file_count']} pre-existing protected files were fingerprinted; no protected changes occurred during the successful batch. Source and working route hashes remained identical.

Acceptance gaps are explicit: broader historic-centre land definition; municipal reuse rights and missing original download entry; field confirmation of candidate survival/access/two-bank identity; conservative physical-part joins; outside-extract OSM coverage. No candidate warrants automatic route insertion.

## Artifacts and reproducibility

Primary artifact directory: `{str(O)}`.

- `municipal-census.csv/json`: exhaustive 1259 source rows and geometry/tag evidence.
- `physical-groups.csv/json` and `part-grouping-evidence.json`: inferred parts and unresolved contacts.
- `osm-route-reconciliation.csv/json`: all 424 original OSM identities, included/excluded/unresolved source evidence.
- `review-candidates-enriched.csv/json`, `final-dispositions.csv/json`: exact candidate review evidence and final classifications.
- `summary.json`, `context-summary.json`, `island-partition.json`: written populations and separate island evidence.
- `source-manifest.json`, `baseline.json`, `verification.json`: source/rights/schema, hashes and quality checks.
- `checkpoint-00.json` through `checkpoint-12.json`: persisted extraction batches.
- `audit.py`, `context_review.py`, `finalize.py`: exercised audit-only scripts. They use exclusive-create writes and refuse overwriting earlier artifacts. To repeat, copy scripts to a **new timestamp directory** before execution.

Earlier new audit attempt directories `municipal-ponte-audit_20261024_090316Z` and `municipal-ponte-audit_20261024_091018Z` are deliberately preserved, **not final deliverables**. The first caught a concurrent parent website change and an area-boundary false positive; the second is an unexecuted intermediate syntax-error script. Only this successful `091400Z` batch and this report are authoritative. No earlier repository file was overwritten.
'''
report=R/'docs'/f'municipal-ponte-audit-{s["timestamp_utc"]}.md'
with report.open('x',encoding='utf-8') as f:f.write(md)
# Readback exact written outputs and final protected hashes, accounting for the newly authorized report.
assert len(L(O/'final-dispositions.json'))==14
assert report.read_text(encoding='utf-8')==md
hashes=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
changed=[k for k,v in baseline['protected_sha256'].items() if not (R/k).exists() or hashes(R/k)!=v]
assert not changed,changed
end={'report_path':str(report),'report_sha256':hashes(report),'classification_counts':dict(count),'strict_inside_nonport_physical_groups':strictped,'protected_files_unchanged':True,'candidate_count':len(final),'complete':True,'git_status':subprocess.check_output(['git','status','--short'],cwd=R,text=True),'artifacts':[{'path':str(p),'bytes':p.stat().st_size,'sha256':hashes(p)} for p in O.iterdir() if p.is_file()]}
with (O/'final-verification.json').open('x',encoding='utf-8') as f:json.dump(end,f,ensure_ascii=False,indent=2)
print(json.dumps({k:v for k,v in end.items() if k!='artifacts'},ensure_ascii=True,indent=2))
