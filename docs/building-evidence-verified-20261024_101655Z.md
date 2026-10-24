# Edifici2024 / VPRG building evidence: verified local handoff

{
  "descriptions": 929,
  "description_records_matched": 278,
  "description_gids": 281,
  "vprg_catalog": 5662,
  "links": 5371,
  "safe_links": 5371,
  "unsafe_links_retained_raw": 0,
  "matched_link_records": 313,
  "unmatched_link_records": 5058,
  "note_records": 229,
  "state_records": 575,
  "pack_tiles": 263,
  "pack_gids": 11602,
  "public_bytes": 5622375,
  "private_bytes": 5997615,
  "public_fulltext": false,
  "verbatim_private_verified": true
}

## Artifacts

- Public metadata sidecar: `web/data/building-evidence.json`
- Private Italian fulltext (NOT publishable): `C:\Users\1\AppData\Local\hermes\cache\scratch\venice-s14-building-evidence-private.json`
- Generator: `pipeline/venice/s14_building_evidence.py`
- Tests: `tests/test_building_evidence.py` (18 passed; targeted suite only).

## Matching and rights

All source catalog entries survive, including unmatched records and literal unsafe LINK_SCHEDA values. No invented sheet URLs or inferred dates. Exact signed OSM identities and non-coordinate-derived QIDs take precedence; unique reciprocal polygon overlap >= 0.8 is explicitly an association, not identity. The actual app.js pack decompression and worker.js byte-36 uint32 GID reader were inspected. Full packs are decompressed before slicing config tile offsets, and source/src, signed OSM and s06 projected position are checked. No assigned-but-unrendered building rows remain in this current dataset.

Source fulltext redistribution rights remain unestablished: public `text`, `note`, `state` are null with per-field publication status `blocked_rights_unestablished` when source text exists. Private text is byte-for-string preserved in Italian and marked `private_review_only`. This is not a license grant or publication approval.

## Consumer issue outside ownership

Inspected `web/data-enrichment.js` without modifying it. `recordsForGid` accepts the sidecar object, and `r.descriptions` is traversed, but `r.vprg` is an array whereas cardHTML lines 85–87 expect one object and read `sheet_url` instead of the actual per-record `url`; VPRG links/notes currently will not render. Blocked description text currently passes through the generic unknown placeholder, not the actual publication-status field. `declaredCount` does not read `audit`/`source_catalog`, so evidence catalog count remains unknown. Consumer owner must iterate VPRG records, use validated `url`, display rights blocking instead of a fabricated description, and expose source versus matched counts separately. No UI/app files, commit, push, skills or memory changed by this task.
