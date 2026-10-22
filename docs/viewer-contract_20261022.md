# SydMap Three.js viewer: exact exporter data contract

**Audit date:** 2026-10-22. **Purpose:** enable an independent Venice GeoParquet exporter to feed the existing viewer without another loader audit. **Method:** static source analysis only; the app was not run and no source/data files were changed.

## 0. Scope, evidence and compatibility level

Source root: `D:\100_star\venice\research\engines\venice-repo-audit\SydMap`.

Line citations below use `web/app.js` (A), `web/worker.js` (W), `web/index.html` (H), `pipeline/s03_tiles.py` (T), `pipeline/s02_years.py` (Y), `pipeline/config.py` (C), and `pipeline/periods.py` (P). For example, **T:99–117** means those exact lines in `pipeline/s03_tiles.py`. JSON files are compact, single-line documents: their structural evidence is `web/data/sydney.json:1` and `web/data/wiki.json:1`; the first approximately 2 KB and top-level/nested keys were inspected, not reproduced wholesale.

The audited city JSON has 884 tile descriptors, 17 packs, `attrStride=56`, `yearMin=1788`, `yearMax=2026`, `tileSize=600`, and projected origin `[334214.0247711701,6251058.799147872]`. These are **Sydney instance values**, not required Venice counts or coordinates. Its wiki table is an array of 953 items. Counts and attribute offsets were obtained programmatically, not estimated.

Two compatibility levels matter:

* **Binary/runtime compatibility:** the unchanged loader can consume Venice assets under the same hardcoded relative paths, even with different origin, home camera, years and period definitions.
* **Truthful Venice presentation:** the unchanged app still says Sydney, cites Australian heritage and date evidence, uses an 1860 film pivot, and has Sydney-specific quest year bounds. JSON substitution alone cannot make those claims true. Those UI/source changes are outside this read-only task. Do not disguise Venice evidence as Australian strata or heritage evidence merely to fill an enum.

The archive does **not** contain `web/vendor/` or `web/styles.css` at the audited paths (read-only lookups returned path-not-found). Direct references to those assets are proved below; their transitive imports/CSS dependencies cannot be enumerated from this checkout. This is a deployment prerequisite, not a reason to invent a dependency list.

## 1. Runtime requests and their order

### 1.1 Document and code dependencies

There is no universal serial HTTP order: HTML parsing/preload, module dependency resolution, worker imports and `Promise.all` issue overlapping requests. The following is the **source-defined initiation/dependency order**, not a claim about network completion order.

| Stage | Requested resource | Role / evidence |
|---|---|---|
| Document | `index.html` (or hosting route serving it) | Viewer HTML and required DOM. |
| HTML head | `favicon.svg` | Favicon; H:17. Browser decides when to request it. |
| HTML head | `fonts/inter-latin.woff2`, `fonts/cormorant-garamond-latin.woff2` | Preloaded UI/street and water-label fonts; H:18–19. A:187,207–210 uses Inter and Cormorant Garamond. |
| HTML head | `styles.css` | Styling; H:20. Missing from this audited archive; additional CSS resources unverified. |
| HTML body | `img/the-third-script-symbol.webp`, `img/the-third-script-wordmark.webp` | Branding; repeated symbol uses may reuse cache. H:33–34,198–199,231. |
| HTML end | `app.js` | Module entry point; H:232. |
| App module dependencies | `vendor/three.module.js`, `vendor/MapControls.js` | Three.js and controls; A:1–2. Missing vendored files mean their own imports are unresolved in this audit. |
| Later, worker construction | `worker.js`, then `vendor/three.core.js` | Up to `min(4, hardwareConcurrency || 2)` module workers; A:24,495; W:3 imports ShapeUtils/Vector2. Shared URL/cache does not imply one network request per worker. |

Canonical, author, OpenGraph and download links are not loader fetches. `og.png` is referenced for social crawlers (H:11), not rendered by this app. External source links open only when activated. The linked council CSV/Parquet and `data/download/area.geojson` files (H:132–149) are user-initiated downloads, **not input assets needed to load Venice**.

### 1.2 Application data requests

All data paths below are relative to the HTML/module deployment base as used by the existing app.

1. **First parallel batch**, awaited together (A:44–50), in source initiation order:
   * `data/sydney.json`: city manifest, field descriptors, palette, time/histogram, home view, pack index.
   * `data/layers.json`: story/layer definitions and group-bit mapping.
   * `data/attrs.bin`: global building/card/search record table.
   * `data/suburbs.json`: optional suburb definitions/measures; errors become `null`.
   * `data/suburbs.bin`: optional gid-to-suburb byte lookup; errors become `null`.
2. **Second parallel batch**, after initial scene/home creation (A:110): `data/land.bin`, `data/water.bin`, `data/context.bin`. These are flat polygon surfaces and the ground extent/distance-fade context. All three are awaited without a recovery catch.
3. `data/labels.json`, awaited (A:177): street/water labels, also input to search.
4. **Conditional awaited request** `data/suburbs-land.bin` (A:269–270,309–314): requested only if suburb JSON and byte lookup exist and the lookup length exactly equals the building count. Same polygon layout as land; a missing file here is not caught.
5. Workers are constructed (A:495), then **every pack is fetched immediately** in `config.packs` array order (A:517). Current names are `data/pack0.bin`, `data/pack1.bin`, `data/pack2.bin`, `data/pack3.bin`, `data/pack4.bin`, `data/pack5.bin`, `data/pack6.bin`, `data/pack7.bin`, `data/pack8.bin`, `data/pack9.bin`, `data/pack10.bin`, `data/pack11.bin`, `data/pack12.bin`, `data/pack13.bin`, `data/pack14.bin`, `data/pack15.bin`, `data/pack16.bin` (`sydney.json:1`). Venice can choose other pack basenames in that array. Processing shifts descriptors from `config.tiles`; it waits on the descriptor's pack, slices the **decompressed** bytes, and transfers that tile to a worker (A:519–532). Pack requests are not viewport- or zoom-lazy.
6. **Reading metadata parallel batch**, created without a top-level await (A:574–579): `data/wiki.json`, `data/names.json`, `data/heritage.json`. The shared `ready` promise gates search construction (A:792), not the mesh loading loop. Missing/invalid metadata rejects that promise; those files should exist even if each is just `[]`.
7. `data/quests.json`, requested with empty-array/error fallback (A:866–867): optional walks/riddles. Source initiation follows the metadata batch; completion order is unconstrained.
8. **On interaction**, remote image URLs: `wiki[wk].image.thumb` on an opened building card (A:611–617,719); quest `step.clue.thumb` or a building image if `step.photo` (A:968–973,995,1004). These URLs are data-driven and cannot be enumerated without all metadata. Article extracts and attribution are already JSON; no runtime Wikipedia/Wikidata API fetch exists in the audited app.

**Not requested:** individual `data/tiles/{tx}_{tz}.bin` files, `parts.parquet`, `buildings_dated.parquet`, `meshes.npz`, `gid.parquet`, any separate search-index JSON. Descriptor `file` is only a worker correlation ID, not a URL (A:522–523). The writer deletes intermediate tile files after packing (T:191–193).

### 1.3 Transport envelope

Every binary request uses `fetchBin`. It reads the body as bytes and, only if the first two bytes are `1f 8b`, decompresses a gzip stream; otherwise it treats the body as raw binary (A:35–42). The writer stores gzip with compression level 9 and `mtime=0` (T:40–44). JSON is ordinary UTF-8 JSON, not an explicitly gzip-wrapped application payload.

Either raw binary or stored gzip works. Pack offsets/lengths always refer to the **uncompressed concatenation**. If the HTTP server applies `Content-Encoding: gzip` and the browser already decompresses, `fetchBin` normally sees raw binary and does not decompress again. Do not configure a header that causes the browser to decode a non-gzip body. `fetchBin` does not check `response.ok`; an HTML 404 body will be misread as binary. Validate actual bodies, not HTTP status alone.

## 2. Tile binary: exact layout

### 2.1 Convention

A tile is **structure-of-arrays**, not an array of fixed-size building or part structs. There is **no per-building tile record stride** and **no per-part tile record stride** across fields. Within each individual array, stride is its element width. All integers/floats are little-endian. Every section starts on a 4-byte boundary; pad bytes are zero in the writer and ignored by the reader (T:4–13,47–48,99–117; W:7–19).

Header DataView calls explicitly specify little-endian. Typed-array payload reads use the browser's native endianness; the format/writer assumes the usual little-endian browser host. There is no endian negotiation or byte-swapping path (W:7–11).

Define `B=nB`, `P=nP`, `R=nR`, `V=nV`, `MV=nMV`, `MT=nMT`, and `A4(n)=4*ceil(n/4)` for byte length `n`. For each table row, the next row begins at `start + padded bytes`; an item at index `i` begins at `start + i*element stride`. This recurrence gives exact absolute offsets for **any counts**, including odd counts; do not pack byte arrays into each other's alignment padding.

### 2.2 Header: bytes 0–35, stride 36

| Byte offset | Bytes | Type | Field |
|---:|---:|---|---|
| 0 | 4 | u32 LE | magic `0x32445953`, ASCII bytes `53 59 44 32` = `SYD2` |
| 4 | 4 | u32 LE | B: buildings in tile |
| 8 | 4 | u32 LE | P: extruded parts |
| 12 | 4 | u32 LE | R: rings |
| 16 | 4 | u32 LE | V: footprint vertices (pairs, not coordinate components) |
| 20 | 4 | u32 LE | MV: ready-mesh vertices |
| 24 | 4 | u32 LE | MT: ready-mesh triangles (triples, not index components) |
| 28 | 4 | f32 LE | tile origin X, metres in the city's local frame |
| 32 | 4 | f32 LE | tile origin Z, metres in the city's local frame |

Writer proof: T:32,99. Reader proof: W:7–10. **The reader never checks magic or a version**, so producing an invalid magic is not caught; an exporter/validator must enforce it.

### 2.3 Payload arrays: starts, widths and strides

Let `s0=36`, and `s(j+1)=sj+Lj`, using padded length `Lj` below. The table's ordering is normative.

| j | Start | Array / logical elements | Type, element stride | Actual data bytes | Padded bytes Lj |
|---:|---|---|---|---:|---:|
| 0 | s0=36 | gid[B] | u32, 4 | 4B | 4B |
| 1 | s1=36+4B | year[B] | i16, 2 | 2B | A4(2B) |
| 2 | s2=s1+A4(2B) | flag[B] | u8, 1 | B | A4(B) |
| 3 | s3=s2+A4(B) | period[B] | u8, 1 | B | A4(B) |
| 4 | s4=s3+A4(B) | floors[B] | u8, 1 | B | A4(B) |
| 5 | s5=s4+A4(B) | heritage[B] | u8, 1 | B | A4(B) |
| 6 | s6=s5+A4(B) | lay0[B] | u32, 4 | 4B | 4B |
| 7 | s7=s6+4B | lay1[B] | u32, 4 | 4B | 4B |
| 8 | s8=s7+4B | partStart[B+1] | u32, 4 | 4(B+1) | 4(B+1) |
| 9 | s9=s8+4(B+1) | height[P] | f32, 4 | 4P | 4P |
| 10 | s10=s9+4P | base[P] | f32, 4 | 4P | 4P |
| 11 | s11=s10+4P | ringStart[P+1] | u32, 4 | 4(P+1) | 4(P+1) |
| 12 | s12=s11+4(P+1) | vertStart[R+1] | u32, 4 | 4(R+1) | 4(R+1) |
| 13 | s13=s12+4(R+1) | hole[R] | u8, 1 | R | A4(R) |
| 14 | s14=s13+A4(R) | xz[2V] | i16, 2; pair stride 4 | 4V | 4V |
| 15 | s15=s14+4V | meshBld[MV] | u16, 2 | 2MV | A4(2MV) |
| 16 | s16=s15+A4(2MV) | meshPos[3MV] | i16, 2; triple stride 6 | 6MV | A4(6MV) |
| 17 | s17=s16+A4(6MV) | meshTri[3MT] | u16, 2; triangle stride 6 | 6MT | A4(6MT) |

Exact file byte length is `s17+A4(6MT)`. Empty arrays use zero bytes but nonempty sentinel arrays still exist. When MV=MT=0, the final mesh sections are zero-length; W still constructs their empty views. The original writer appends mesh sections only if MV>0, so do not emit MT>0 with MV=0 (T:114–117).

Header+all arrays must be contiguous; no directory, checksum, footer or pack-local tile header exists beyond the tile header. Proof: T:99–118; W:10–20.

### 2.4 Building identity and ownership

`gid[b]` is the global zero-based building row index into `attrs.bin`. In the supplied pipeline, `bid` must be `0..N-1`, then `gid=bid` (T:144,155–156); Venice need not use its authoritative IDs as gids but must create a stable dense mapping. All geometry parts and ready-mesh surfaces belonging to one building must use the same gid through its tile-local building index.

`partStart` starts at 0, is monotonically nondecreasing, ends at P, and gives half-open part interval `[partStart[b],partStart[b+1])`. Zero-part buildings are valid if they have a ready mesh; an entirely geometryless building will still exist in attrs/histogram but cannot be picked. Parts are grouped by building; rings by part; vertices by ring (T:66–68,80–93; W:35–42).

Tile-local index is limited to **15 bits**. The writer asserts `B < 32768` (not <=), reserving bit 15 for pale ready-mesh surfaces (T:33,95). The worker writes building indices into a u16 array (W:33,48,62). Global gid is u32 on disk, but is later represented by f32 in the GPU lookup and encoded into 24-bit pick RGB as `gid+1`; safest usable gid range is `0..16777214`, with all data IDs dense and identical across tables (W:73–76; A:461–463,555).

### 2.5 Parts, rings and footprint vertices

* `height[p]` is **top Y in metres**, not the thickness above base. Worker directly computes `top=round(height*10)` and `bottom=round(base*10)` (W:37), then builds walls between them (W:40–49). `base[p]` is bottom Y in metres above the chosen model datum. There is no ground-elevation array.
* `ringStart` has P+1 entries, begins at 0, ends at R; `vertStart` has R+1 entries, begins at 0, ends at V. Each part should have at least one valid exterior; each emitted ring has at least three vertices (T:81–92).
* A vertex at ring-global index v is `[i16 Xdm, i16 Zdm]` at bytes `s14+4v` and `s14+4v+2`. Units are **decimetres from the tile origin**, not metres or degrees (T:85–86; W:2,46).
* `hole[r]=0` means exterior; `1` means interior. Reader treats any nonzero value as hole. It accepts the **first non-hole ring as the only contour**; every later ring, including a second `hole=0`, becomes a hole (W:53–54).
* Therefore split MultiPolygon into **one Polygon per part**, duplicating the top/base values. The writer's `rings_of` can enumerate multiple Polygon exteriors (T:55–62), but putting those into one part is incompatible with the worker's roof semantics. A Venice exporter must fix this upstream rather than blindly duplicate that behavior.
* Store open rings: remove the duplicate closing coordinate (`[:-1]`, T:60,62). Walls implicitly close via `(i+1)%n` (W:45). Winding is not normalized by the audited writer and material is DoubleSide (A:487); use valid consistent outer/hole winding and check roof triangulation with the shipped Three.js. Do not assume the renderer repairs self-intersections or quantization-collapsed rings.
* Worker uses `ShapeUtils.triangulateShape(contour,holes)` for roofs, and adds a floor only if **rounded bottom>0** (W:57–64). Allocation uses unrounded `base>0` (W:26–29), a minor threshold discrepancy. There is no bottom slab for base<=0. No roof slope, roof material, per-part date or per-part picking ID exists.
* All worker position components, including rounded height/base, are ultimately stored in i16 (W:33,37,47). Their legal representable range is `-32768..32767 dm` = `-3276.8..3276.7 m`; bounds must be checked before casts. The writer casts without clipping XY/mesh positions (T:73,86).

### 2.6 Ready meshes

Ready meshes support surfaces extrusion cannot draw. They are optional; zero counts suffice for normal buildings (T:11–13; W:67–71).

* At bytes `s15+2v`, `meshBld[v]` = tile-local building index `b | (pale ? 0x8000 : 0)`. Low 15 bits identify owner; bit 15 marks pale surfaces. Extruded vertices never carry that bit.
* At `s16+6v`, `+2`, `+4`, `meshPos` holds `[Xdm,Ydm,Zdm]`. X/Z are tile-relative; Y is relative to the global model Y=0, since tile origin contains only X/Z. The writer receives source mesh `[E,N,Ymetres]`, transforms E/N to local/tile coordinates, reorders to XYZ and multiplies by 10 (T:70–76).
* At `s17+6t`, `+2`, `+4`, a triangle stores three u16 indices **into the ready-mesh vertex array of this tile**, not into footprint vertices, extruded vertices or one building's mesh. Writer increments by previous mesh vertex count (T:75–76). Worker appends mesh vertices after extrusions and adds the output-vertex offset (W:68–71).
* `MV<=65536` is asserted; each triangle index must be `<MV` and <=65535 (T:98). MT is u32 in the header and is not limited to 65535.
* No normals, UVs, materials or colors are stored. Normals/light are derived in the fragment shader (A:465–472). Bit 15 makes color 30% white and changes lighting (A:379–381,437–438,469–470). It is **not** a heritage/date flag.

### 2.7 Worker output and GPU lookup (not files to export)

Worker returns trimmed arrays: `pos:i16[3*nOutputVertices]`, `bld:u16[nOutputVertices]`, `idx:u32[nOutputIndices]`, `attr:f32[B*8]`, `origin`, `nB` (W:33,73–83). App scales positions by 0.1 and translates by tile origin in metres (A:497–512).

Per-building `attr` stride is **8 f32 / 32 bytes**, two RGBA texels:

| Relative bytes | f32 value |
|---:|---|
| 0 | year |
| 4 | period + 16*flag |
| 8 | min(floors,127) + 128*heritage |
| 12 | gid |
| 16 | lay0 low 16 bits |
| 20 | lay0 high 16 bits |
| 24 | lay1 low 16 bits |
| 28 | lay1 high 16 bits |

Proof: W:72–76. Texture width is 512 RGBA texels; 256 buildings per row; rows=`ceil(B/256)`; building b starts at texel `(2*(b%256),floor(b/256))` (A:23,502–505,382–384). This table is constructed by the worker; **do not emit it instead of tile metadata**. Floors above 127 survive in attrs.bin/card up to 255 but become 127 for GPU coloring.

## 3. Global `attrs.bin`: exact 56-byte records

No header, count or alignment gaps between records. N=`uncompressedByteLength/56`; record gid begins at byte `56*gid`. All types are little-endian; byte fields have no endian distinction. The writer uses an unaligned NumPy dtype; offsets below were calculated and matched against the supplied JSON (T:121–137,195–216,228–229; A:559–568).

| Offset | Width | Type token | Field / meaning |
|---:|---:|---|---|
| 0 | 8 | `<f8` | osm: positive OSM way ID; negative relation ID; 0 absent |
| 8 | 2 | `<i2` | year: the single displayed/animated year |
| 10 | 2 | `<i2` | yfrom: lower date/evidence bound |
| 12 | 2 | `<i2` | yto: upper date/evidence bound |
| 14 | 2 | `<u2` | h: building/card top height in decimetres |
| 16 | 1 | `|u1` | hsrc: height source enum |
| 17 | 1 | `|u1` | fsrc: floor-count source enum |
| 18 | 1 | `|u1` | flag: date-confidence/method enum |
| 19 | 1 | `|u1` | heritage: heritage category enum |
| 20 | 4 | `<u4` | lay0: group bits 0–31 |
| 24 | 4 | `<u4` | lay1: group bits 32–63 |
| 28 | 4 | `<i4` | wk: zero-based wiki.json index, -1 absent |
| 32 | 4 | `<i4` | nm: zero-based names.json index, -1 absent |
| 36 | 4 | `<i4` | hi: zero-based heritage.json index, -1 absent |
| 40 | 4 | `<u4` | sp: strata plan number, 0 absent |
| 44 | 1 | `|u1` | src: footprint provenance enum |
| 45 | 1 | `|u1` | floors: floor count, 0–255 stored |
| 46 | 1 | `|u1` | dsrc: date source enum |
| 47 | 1 | `|u1` | pad: reserved, zero; not exposed in attrFields |
| 48 | 4 | `<f4` | x: building centroid local X, metres |
| 52 | 4 | `<f4` | z: building centroid local Z, metres |

`h=round(building.height*10)` clipped to 0..65535 in the original writer (T:201); card divides by 10 (A:566). This u16 range is broader than the **i16 geometric Y range**: a card can otherwise claim a height the mesh has overflowed. Keep them consistent. Global card height is not a list of part heights. x/z derive from the simplified building footprint centroid, not necessarily the tile polygon/part centroid (T:153,157,215).

Although generic `READ` supports `<f8`, `<f4`, `<i4`, `<u4`, `<i2`, `<u2`, `|u1` (A:560–565), **search hardcodes** wk/nm as i32, year as i16, h as u16, x/z as f32 (A:794–801), and the ground fade hardcodes x/z f32 (A:119–122). A custom attrFields descriptor does not permit freely changing those types. Emit the exact 56-byte dtype above.

## 4. Flags and small integer fields

These fields are **enums**, not independent bit flags, except layer masks and the ready-mesh pale bit.

### 4.1 Date flag (`flag`, input `date_flag`)

| Value | Meaning proved by source |
|---:|---|
| 0 | documented/exact year; Y:6,375–388,403–405; A:595 |
| 1 | documented approximate (decade, century, circa or some intervals); Y:7,72–95,160–176; A:596 |
| 2 | inferred from strata plan registration/calibration; Y:8–10,440–447; A:597–598 |
| 3 | heritage-area/listing estimate; Y:11–14,423–428,455–472; with dsrc=4 specifically a listing's dates, A:599–600 |
| 4 | estimated from dated neighboring buildings of similar height; Y:15,476–501; A:601 |

Any flag>=1 adds `c.` and optional date range to cards (A:643–644), and mixes period color 32% toward maquette (A:413–414). With `uDocOnly=1`, **flag>=2 is completely maquette-colored**, not removed. Flag 1 remains colored/pale. The UI tooltip's phrase about keeping strata years (A:1296) conflicts with the shader, which whitens flag 2 as well. The shader is the executable truth. Unknown values >=5 fall into the card's neighbor-estimate default and the same shader thresholds; they have **no documented custom meaning**.

Negative `date_flag=-1` is an upstream unresolved marker (Y:337), not a valid serialized unknown enum. The pipeline resolves all dates, clips to 1788..2026, spreads flags>=2 within bounds using a seeded CRC-derived fraction, then computes period from the resulting year (Y:63–64,504–514). This is a Sydney estimation policy, **not a requirement to fabricate Venice years**. There is no nullable/unknown-year binary representation or uncertainty rendering. A faithful Venice adapter needs a documented policy for undated buildings or a later viewer change; do not silently encode year=0 or an invented medieval date.

### 4.2 Date source (`dsrc`)

T:134 and A:593,599 establish: 0 Wikidata, 1 Wikipedia, 2 OpenStreetMap, 3 other, 4 its heritage listing. `sp` and flag 2 convey strata dating; the exact mapping from every upstream `date_src` string to dsrc is not implemented in the audited files, so do not infer additional enums. Values not 0/1/2 use generic 'a documented source' in flag 0/1 notes. No source URL for generic dsrc=3 is carried in attrs.bin.

### 4.3 Heritage category

T:34–37; Y:42,267,302–304; A:418,624,1303–1305:

| Value | Meaning | Current color |
|---:|---|---|
| 0 | none | #f1eee8 |
| 1 | State Heritage Register | #6e2418 |
| 2 | Local heritage item | #c0594e |
| 3 | Contributing building | #dfbd6c |
| 4 | Neutral building | #8fa8b0 |
| 5 | Detracting building | #4f5a5c |

Heritage is independent of date flag. It is encoded in GPU texel 0 component z above floors. Color uses `heritage.colors[category]`; card label uses `heritage.labels[category-1]`. Original assignment precedence is contributions < local item < SHR (Y:302–304). Venice can provide different labels/colors for a compatible taxonomy, but category 5 still triggers Sydney-specific later-fabric wording in the default date note (A:601). Keep categories in palette range; no shader guard exists.

### 4.4 Height/floor/footprint source

* `hsrc` values as the card presents them: **0** measured, OpenStreetMap; **1** from storeys, OpenStreetMap; **2** modelled, GlobalBuildingAtlas; **3** assumed two storeys; **4** highest point above sea level, Wikipedia (A:589,619; T:202). This is the viewer's exact label table. The underlying height derivation is outside these audited files; no other values can be assigned a meaning. The hsrc=4 sea-level wording does not itself add terrain/datum transformation in the worker.
* `fsrc=0`: OpenStreetMap storeys; `fsrc=1`: derived height/3.2 m (T:238; A:621). The viewer treats **every nonzero value** as height-derived, with no further enum meanings. Floors are u8; writer clips/count-limits to 255 (T:78,213); GPU caps to 127 (W:75). Positive floors are needed for `log(f)` in floor coloring (A:363–367). There is no reliable null floor count in a binary u8.
* `src=0`: OpenStreetMap footprint; `src=1`: Microsoft via Overture according to dtype comment (T:132). Actual write logic maps **any source other than the string 'osm' to 1** (T:212), so the bytes cannot distinguish all non-OSM origins. It does not affect rendering in the audited app. A Venice exporter should not mislabel another provider as Microsoft without preserving true provenance separately.
* `osm` uses float64, not an integer or string field; the sign decides way vs relation URL (T:123,197; A:629). Keep integer-valued IDs exactly representable in float64; use 0 when unavailable. Do not coerce arbitrary Venice source IDs into this field.

### 4.5 Layer masks and remaining indexes

Bits 0..31 are `lay0`; 32..63 are `lay1`. Group bit k means membership in the group whose JSON `bit=k`; there is **no built-in semantic meaning per bit number** (T:7,127; A:562,567). Bit 31/63 works through unsigned shifts and 16-bit GPU words (W:76; A:372–375). Allocate bits globally across all layers, not independently per layer. For k<32 set `lay0 |= 1<<k`; otherwise set `lay1 |= 1<<(k-32)`, serializing unsigned u32.

At most **8 active groups** have colors in one story; colors are assigned by group order, not bit value. First matching enabled group wins for a multiply classified building (A:21–22,421–428,1152–1154). `setLayer` caps groups to 8, but `setMode` does not apply the same cap (A:1328–1330), so keep each layer at <=8 groups rather than relying on truncation. Group toggles remove highlight, not building geometry. Per-layer visible counts sum group histograms and can double-count overlaps (A:1407); preferably make groups within a story exclusive or accept that UI limitation.

`period` is a zero-based palette index, not the string key 'p1', nor a year. It occupies a 4-bit logical field in GPU packing: `period=pf%16`, `flag=pf/16` (A:386–388). Require `0<=period<min(periods.length,16)`. `hole` and pale bit meanings are specified in section 2. wk/nm/hi are table indexes with -1 absent; sp=0 absent; pad=0 has no semantic bit usage.

## 5. JSON and lookup schemas

This section distinguishes **required to run/use the named feature** from optional enrichment. It does not elevate every key observed in Sydney output to a loader requirement. Arrays may be empty unless explicitly constrained. All index references must resolve, all coordinates must be finite, and all displayed counts must be numbers (not null/string), because the UI calls numeric formatting directly.

### 5.1 `data/sydney.json` (city manifest)

Required keys for the normal app:

```text
{
  home: {x:number, z:number, azimuth:number, elevation:number, span:number},
  periods: [{label:string, from:integer, to:integer, color:string}],
  yearMin:integer, yearMax:integer,
  histogram: {"YEAR": [nonnegative integer per period]},
  attrStride:56,
  attrFields: {FIELD: [byteOffset, TYPE_TOKEN]},
  heritage: {labels:[string], colors:[color], counts:[nonnegative integer]},
  tiles: [{file:string, pack:string, offset:nonnegative integer, length:positive integer}],
  packs:[string],
  stats:{buildings:integer, flags:{"ENUM":integer}}
}
```

`periods` must be nonempty, sorted by increasing `from`, nonoverlapping and cover every emitted year; <=16 entries. Each histogram vector has exactly `periods.length` entries. Missing years can be omitted; require a nonempty histogram for the app's max/year calculations. Counts must count **buildings**, not parts/mesh vertices. `heritage.colors` and `counts` include category 0; labels omit category 0. `tiles` must be nonempty for the existing loading indicator to complete (A:529). Every tile pack must appear in packs; slice length/header/arrays must match exactly. Offset and length are uncompressed byte offsets; descriptor `file` only identifies the tile. Proof of use: A:75–83,119–122,269,280–285,494,517–529,560–565,1104–1105,1304–1305,1354–1364,1539–1544. Writer proof: T:222–242.

Emit the complete `attrFields` mapping from section 3, **omitting pad**. Required core/search names include x,z,wk,nm,year,h, and building card fields use osm,yfrom,yto,hsrc,fsrc,flag,heritage,lay0,lay1,hi,sp,floors,dsrc (A:565–568,587–648,794–801). Preserve src too for exact published dtype compatibility even though the app does not display it.

Original output also carries `city`, `label`, `tileSize`, `origin`, `crs`, period `key`, tile `tx,tz,n,bytes,dist`, and extra stats (`heightSrc,floorsTagged,floorsHeight,osm,ml,byLga`). These are useful provenance/index diagnostics, but **not accessed by this app's loader/rendering logic**. For an exact exporter manifest include them, substituting Venice values; do not assume `city:'venice'` redirects `data/sydney.json`. That URL is hardcoded (A:45). `origin` and `crs` document the projection; the viewer does not reproject geometry based on them.

Optional `shapes` is `{ "gid": [description:string, sourceLabel:string, sourceURL:string] }`, used for shape provenance/card storey suppression (A:615,620–621); omit if unused.

### 5.2 `data/wiki.json`

Top-level **array**, indexed by attrs.wk, not object keyed by QID (`wiki.json:1`; A:587,611). For the minimum runtime a file containing `[]` and wk=-1 for all buildings is valid. Strictly, no key on an individual object is unconditionally dereferenced: optional chaining guards all displayed enrichments. For a usable named wiki record, provide `label:string`; **no date/coordinate keys are needed here**.

Feature-dependent shape (only supply fields used by a feature):

```text
{
  label:string,                         # name/search if provided
  qid:string,                           # Wikidata source link if provided
  architects:[string], styles:[string], # optional card facts
  wiki:{url:string, extract:string},    # article link and extract, independently optional
  image:{thumb:string}                 # needed to show an image
}
```

Image attribution fields `page,artist,license,licenseUrl` are optional in code but should accompany real media for legal/provenance reasons (A:617). `wiki.title` is observed in the source JSON but is not read by this app. `image`/`wiki` can be null. Observed full item keys are `qid,label,architects,styles,image,wiki`; nested wiki keys are `url,title,extract`; image keys are `thumb,page,artist,license,licenseUrl` (`wiki.json:1`). These are not an instruction to insert invented metadata.

### 5.3 `data/names.json` and `data/heritage.json`

* names: **array of strings**, indexed by nm; `[]` if all nm=-1 (A:577,587,797). nm is normally an OSM name for a building without wiki (T:129). Card name prefers a truthy wiki label then nm fallback; search does **not** use nm fallback when wk>=0 but its wiki label is missing (A:587 versus A:797). Supply a label for every searchable wiki record or set wk=-1 and use names.
* heritage: **array of objects**, indexed by hi; `[]` if all hi=-1. No object key is unconditionally required. Conditional facts/notes read `name:string`, `kind:string` (value 'shr' changes fact wording), `hca:string`, and `shrId:string|number` (Australian register link). A:578,599–600,612,625–626,633. This specification derives the viewer-consumed shape, not an unseen heritage-file writer schema. Source/datum/provenance beyond these fields is not supported by the card code.

### 5.4 `data/labels.json`

Top-level **array**. Required per label for geometry/search/priority:

```text
{ name:string, tier:integer, pts:[[x:number,z:number,angleDegrees:number,lengthMetres:number, ...]] }
```

Each point tuple contains x,z,angle,len and optionally width at index 4. Width missing/0/falsy defaults to 20 m. `water:boolean` is optional (omission is treated as street/false); include it explicitly for water. Tier 0=wide label, tier 1=main/big street, all other tiers use small/near behavior; lower tier sorts earlier (A:205–206,227–230). Angle is measured from +X toward +Z in the ground plane; applied as negative Y rotation in degrees (A:241). Coordinates/length/width are **metres in the city local frame**, not tile decimetres. All `pts` arrays must exist because initial expansion calls `L.pts.map` without a guard (A:205). Empty `[]` labels file is valid. Names use both their point geometry and camera-relative placement for draw/collision checks (A:209–254); first point becomes search target (A:805).

### 5.5 `data/layers.json`

Top-level **array**. `[]` works if no stories and masks are zero. Startup requires every present layer to contain `groups` (A:562). To make the full Stories UI, color toggles and histogram work, required keys are:

```text
{
  id:string, section:string, title:string, count:integer, era:string, text:string,
  source:{url:string,label:string},
  groups:[{bit:integer_0_to_63,label:string,count:integer,years:{"YEAR":integer}}]
}
```

Source/metadata strings drive story display (A:1123–1143); bit/group order drives highlights (A:1152–1154,1316–1318); years drives counts/histogram (A:1407,1449–1454). `groups` length<=8. `id` must be unique and string-valued because dataset selection compares string IDs (A:1127–1129). JSON does not contain a building-ID membership list for rendering: the masks in both attrs.bin and tiles are authoritative.

Optional `caveat:string`. Optional `notes:{"gid":{...}}`: `story` is shown on building cards; `source` optionally links the note; `name` and `at:[xMetres,zMetres]` are both needed to list a named place that can fly/open its card; `story` may be omitted for that list (A:637–639,1134,1140,1145–1146). All note-key gids must be valid global records. Section names are data-driven, but known sorting/icons are hardcoded to Country, Architecture, Faith and community, Everyday life, The changing city, The modern city (A:1107,1111–1123); unknown sections have no custom icon.

### 5.6 Search index: generated, no export file

There is **no `search.json`, `search.bin` or independent search-index asset**. The app builds `findIndex` from attrs.bin plus wiki/names, labels and optional suburbs after the metadata promise resolves (A:790–809).

Building entry internal required shape: `{label,kind:'building',gid,h,known,year,x,z,key}`; h is the stored decimetre height, known means wk>=0, key is normalized label. Same exact label deduplicates to the **tallest** building (first wins ties, A:799–801). Street/water entry: `{label,kind:'street'|'water',x,z,key}`, using first point of the first label with that name (A:804–806). Suburb entry: `{label,kind:'suburb',s,x,z,key}` (A:807–808). NFD diacritics are stripped and strings lowercased (A:791). Queries under two characters have no hits; maximum eight hits; exact word/start/prefix/substring and type ranks are code-defined (A:811–819). An exporter only supplies the input lookup tables, not these ephemeral objects.

### 5.7 Optional suburbs: exact consumed schemas

If no Venice suburb/district lens is intended, omit both optional assets or make the fetch fail safely; the app hides the Suburbs button if no measure (A:1344). For a complete file set, `suburbs.json={"suburbs":[],"measures":[],"poly":[]}` and an empty raw `suburbs.bin` will have length!=N for N>0, disabling this branch; this is not a nonempty functioning suburb dataset. A valid byte lookup with valid JSON triggers `suburbs-land.bin`, even when there are no measures (A:270,309–310).

For the active feature:

```text
suburbs.json = {
  suburbs:[{name:string,x:number,z:number,km2:number,buildings:integer}],
  measures:[{
    key:string,short:string,label:string,what:string,unit:string,
    years:[ascending integer],values:[[number|null per year] per suburb],
    domain:[number,number],decimals:integer,source:{url:string,label:string}
  }],
  poly:[suburbIndex per polygon in suburbs-land.bin]
}
```

`postcode` optional on suburbs. Optional measure switches are `interp,log,money,pct,year,asc,census,domainCut`, plus `note`. These change interpolation/scaling/text, not binary layout (A:1162–1189,1193–1204,1207,1215–1231,1255–1261,1311–1312). Require nonempty years/measures for meaningful UI, nondegenerate domain, positive endpoints/values for log scale, and matching matrix dimensions.

`suburbs.bin` is **exactly N u8 bytes without header**, indexed by gid; 0..254 indexes a suburb, **255=none** (A:49,269–299,433–435,1208). Therefore at most 255 addressable districts. GPU value texture has 256 cells, sentinel -1 for no figure (A:278,1201–1204). `suburbs-land.bin` has the flat-polygon layout in section 6, with `poly.length=nPoly` and every index valid. Coordinates are local metres.

### 5.8 Optional `data/quests.json`

Top-level **array**, `[]` valid. If authoring walks, required common quest shape is `{id:string,title:string,intro:string,level:1|2|3,steps:[step]}` (A:878–895). Each step needs `kind`, `gids:[integer]`, `reveal:string`; valid nonnegative gids identify building stops (A:913–918,1023–1031). `find` additionally needs `riddle:string,hints:[string]`; `year` needs `ask:string,year:integer`; `choice` (the else branch) needs `ask:string,options:[string]`, with options[0] the correct answer (A:991–1015,1046–1049). Keep steps/gids nonempty where centering, flight or card opening uses them; negative gids are filtered out, not geometry proxies.

Optional `sources:[URL]`, `photo:boolean`, `clue:{thumb,page,artist,license}`, and find `mode:'floors'|'period'` (A:968–973,1000,1028,1038). The code accepts other named mode keys through MODE but the find button only labels floors vs ages. Year riddle slider bounds are hardcoded **1788..2026**, not config.yearMin/yearMax (A:1007–1008); pre-1788 Venice quests need a code change. localStorage persistence key is `syd-quests`, so quest IDs should avoid collision with unrelated deployments (A:869–871).

## 6. Flat polygon binaries (`land`, `water`, `context`, `suburbs-land`)

All four use the same layout, **no magic, no version, no per-ring hole byte**. Endianness is native typed-array little-endian assumption; emit little-endian. Coordinates are float32 **city-local metres**, not quantized tile-relative positions. Reader proof: A:87–106,310–323.

Let Q=nPoly, R=nRing, V=nVert:

| Absolute offset | Field / width / stride |
|---|---|
| 0 | Q: u32, 4 bytes |
| 4 | R: u32, 4 bytes |
| 8 | V: u32, 4 bytes |
| 12 | ringStart[Q+1]: u32, stride 4, bytes 4(Q+1) |
| 12+4(Q+1) | vertStart[R+1]: u32, stride 4, bytes 4(R+1) |
| 12+4(Q+1)+4(R+1) | xz[2V]: f32 pairs, X then Z, pair stride 8, bytes 8V |

Total length=`12+4(Q+1)+4(R+1)+8V`. Starts/ends/sentinels are 0,R and 0,V respectively. First ring of each polygon is exterior; all later rings are holes (A:100–101,318–319). Split MultiPolygon into polygon records. Use open, valid rings. No per-polygon color or ownership exists except the parallel JSON `subData.poly` for suburb polygons.

The loader constructs 2D points `(X,-Z)` and rotates ShapeGeometry by -pi/2 about X, giving final world `(X,0,Z)` (A:95,104–106). Do **not** negate Z again in the file. Land is placed Y=-0.05 m, context=-0.1 m, water=-0.4 m (A:170–172), while suburb fill=-0.03 m and outlines=+0.05 m (A:340,344). Those offsets are viewer constants. There is no terrain triangulation/elevation support here. Context geometry must have a meaningful finite extent because it determines the ground fade grid (A:114–140); an empty context is not a safe practical minimal asset.

## 7. Coordinate quantization and the Venice frame

### 7.1 Exact Sydney transformation

Original CRS is **EPSG:7856, GDA2020 / MGA zone 56**, metric easting/northing (C:5–6,10). GPO source coordinate is lon/lat `(151.20765,-33.86778)` and transformed with `always_xy=True` (C:30,41–44). Supplied projected origin is the city JSON value in section 0.

Given projected `(E,N)`, model origin `(E0,N0)`:

```text
X = E-E0 metres (east positive)
Z = -(N-N0) metres (south positive)
Y = up metres relative to the chosen zero datum
```

Proof: T:3,28,51–52. Tile assignment is by **centroid of simplified building footprint**, not every part or vertex:

```text
tx=floor(Xcentroid/600), tz=floor(Zcentroid/600)
OX=600*tx, OZ=600*tz  # city-local metres
Xdm=round((X-OX)*10), Zdm=round((Z-OZ)*10)
```

T:29,153,157–164,85–86. No clipping to tile edges; all parts remain owned by their building's centroid tile, even if crossing edges. Header origin is `(OX,OZ)` float32. The viewer/worker does **not** read tx,tz,tileSize to restore positions; it uses the header origin plus 0.1 scaling (W:9,46; A:510–511).

Worker conversion of part Y is `Math.round(topMetres*10)` and `Math.round(baseMetres*10)` (W:37). Writer XY/mesh rounding is NumPy `round` (T:73,86), i.e. ties-to-even; JavaScript `Math.round` has a different half-tie rule. To reproduce original bytes, use NumPy-compatible XY/mesh rounding and retain f32 part heights for worker rounding; normal compatibility does not require identical half-tie bytes as long as geometry remains valid. Quantization error for ordinary nearest rounding is at most 0.05 m per component, before f32 origin/height precision effects.

### 7.2 What Venice must replicate (and what can change)

Use a suitable **metric projected Venice CRS** and choose/document a Venice `(E0,N0)`. Do not use Sydney EPSG:7856 for Venice. Transform all building/part polygons, ready meshes, flat context/water/land, centroid attributes, label points, layer note `at` and suburb coordinates into the **same local east/south/up frame**. Maintain the negative northing-to-Z sign. The app does not transform geographic longitude/latitude, inspect GeoParquet CRS, or apply a CRS named in JSON at runtime.

For byte/pipeline-equivalent output, keep 600 m centroid tiles and 0.25 m topology-preserving simplification (T:29,31,147,153). Simplification is an exporter preprocessing choice, not something the decoder requires. Different tile dimensions can technically work because origins drive placement, but keeping 600 m reproduces the established pack organization and leaves int16 headroom. Quantization **must remain decimetres**, and mesh.scale must remain the existing 0.1 for an unchanged viewer.

Do not assume that a 600 m centroid tile bounds all vertices: check outlying multipart polygons/meshes relative to their assigned origin against int16 limits. To avoid overflow, subdivide/reassign geometry carefully while preserving a coherent global building identity; naive duplicated gids across tiles are not produced by this pipeline and can duplicate drawing/count assumptions.

Vertical reference is **not declared by a metadata field or converted** in these files. The model assumes flat ground at Y=0; top/base must already share an exporter-chosen datum. A building part with bottom=5 m and physical thickness=10 m requires top=15 m, not height=10 m. Raised parts get a bottom face when rounded base>0. For Venice tides/terrain/sea-level heights, either normalize to a documented flat display datum or later extend the viewer; hsrc labels alone do not correct elevations.

## 8. Period color and time behavior

### 8.1 Palette and classification

Original period definitions (P:7–16) are:

| Index | Key | Inclusive years | Label | Color |
|---:|---|---|---|---|
| 0 | p1 | 1788–1839 | Before 1840 The convict town | #491321 |
| 1 | p2 | 1840–1869 | 1840–1869 Free colony and gold | #7c2d18 |
| 2 | p3 | 1870–1890 | 1870–1890 The boom years | #c0594e |
| 3 | p4 | 1891–1918 | 1891–1918 Depression and Federation | #e38752 |
| 4 | p5 | 1919–1945 | 1919–1945 Interwar and the Bridge | #e0ca78 |
| 5 | p6 | 1946–1960 | 1946–1960 Post-war | #859f55 |
| 6 | p7 | 1961–1975 | 1961–1975 The first towers | #35816a |
| 7 | p8 | 1976–1999 | 1976–1999 Darling Harbour to the Games | #77b0b7 |
| 8 | p9 | 2000–2014 | 2000–2014 The apartment city | #4a798d |
| 9 | p10 | 2015–2100 | 2015– Barangaroo and Green Square | #5b4087 |

Pipeline assigns period from the **final scalar year**, inclusively; below first period falls back to 0, above last to last (P:20–24; Y:514). Runtime shader reads the stored tile index and uses `uPalette[period]` populated from city JSON (A:284,386–388,411–414). Card/tooltip recomputes period using JSON inclusive bounds, falling back to periods[0] if no match (A:571,614,695); this differs from pipeline's above-last fallback. Ensure consistency instead of depending on fallbacks.

Ages mode is MODE=0; period mask only affects Ages mode (A:25,391). Choosing a station solos that palette index; choosing it again restores all (A:1367–1377). Masks do not change year. Colors are authored sRGB, Three.ColorManagement is disabled, output color space is LinearSRGBColorSpace, shader adds lighting/fog and special pale/selection tints (A:7–8,59,437–443,465–475). A hex color is therefore the base palette, not a guarantee of identical screen pixels.

Venice can author its own <=16 inclusive periods and colors in the existing JSON filename, with tile period indexes and histograms computed from those definitions. Period keys are metadata only. Label date/name splitting recognizes 'Before NNNN' or a four-digit range using an en dash (A:586); other label formats display as an undivided name. The UI has four year digit flaps (A:1414–1421), so unusual/BCE/long years require presentation changes despite i16 storage supporting signed values.

### 8.2 The one field that determines presence

The **tile's `year[b]`** (transferred to GPU attr[0]) drives visible geometry through uYear, in every lens. `yfrom`, `yto`, dsrc and heritage do **not** control appearance time; yfrom/yto are only in global card records. There is no disappearance/end-year field. The film shows the present-day building stock accumulating, not historical demolished stock (W:14,75; A:385,391–394,643–644).

Exact shader entrance factor before smoothing:

```text
g0=clamp((uYear-year+1)/uRise,0,1)
g=g0*g0*(3-2*g0)
if g<=0.003 or periodVisibility<=0.003: move vertex offscreen and return
```

A:392–394. When not playing, uRise=0.01 (A:288,1529), so integer scrubbing hides at year-1 and shows at year. Fractional film time begins an entrance during the preceding year because of `+1`; the visible-count UI instead counts histogram keys satisfying `year<=uYear` (A:1405–1410). Thus animation and counter are not exactly identical during fractional transitions.

`uYearFrom`, initially yearMin-1, is a **color emphasis boundary**, not a lower visibility cutoff: year<=uYearFrom is mixed 80% to maquette (A:282,439). Scrub handlers keep from<to (A:1487–1490). No buildings disappear because they are older than uYearFrom.

### 8.3 Playback, loading and layer animations

Initial uYear=yearMax (A:281). Timeline T0=`floor(yearMin/25)*25`, T1=`yearMax+1` (A:1354). Playback duration is 30 s by default, overridable with `?film=SECONDS`; hardcoded pivot=1860 consumes the first 20% of duration, remainder reaches yearMax (A:1511–1515). Playback resumes by searching normalized film time in increments of .001; if at today, it restarts from T0 (A:1516–1523). Each frame updates uYear and widens uRise to `max(2, playYear(min(1,t+800/DURATION))-playYear(t))` (A:1570–1576). Stop rounds uYear, resets uPlaying and uRise (A:1525–1532).

Tiles have their own arrival timestamp uBorn and seeded gid flight: approximately .9 s load drop with a seeded stagger, sideways/up offsets authored in decimetres (A:507,396–408). During playing, `fly=max(loadFly,1-g)`, so entrance follows date interpolation; scrubbing normally changes visibility immediately apart from tiles still arriving. Coordinates are not altered in files for animation. Layer opening has its own .55 s wave/overshoot that scales local p.y; first matching group controls color/animation (A:421–428,1150).

For Venice years far before 1788, the loader can still read i16 dates, but the fixed 1860 pivot gives a much different pacing. If yearMax<1860 or T0>=1860, monotonic/useful playback is not guaranteed. Config does not expose pivot or film phase fractions. Preserve or intentionally patch this later; it cannot be solved by adding a JSON key the app never reads.

## 9. Concrete Venice exporter checklist

### 9.1 Normalize GeoParquet inputs before binary writing

- [ ] Read/validate actual building and building-part GeoParquet schemas and CRS metadata. Use stable authoritative string building IDs plus part IDs and parent IDs; do not require OSM IDs to exist.
- [ ] Reproject to one suitable Venice metric CRS. Preserve original CRS and vertical datum in preparation/provenance tables. Choose/document E0,N0 and common flat display Y datum.
- [ ] Create a reversible dense `gid=0..N-1` mapping, store it in exporter outputs/provenance outside runtime assets if desired. Merge cards/masks by stable source ID, then explicitly restore gid order. Do not trust joins to preserve row order (original asserts order, T:143–144).
- [ ] Define the building-level top/card height, floors, provenance and heritage taxonomy separately from part-level top/base. Convert thickness/base-height inputs to **top = bottom + thickness** where that is the input meaning. Do not add base twice to an already absolute top.
- [ ] Normalize parts to Polygon records; split MultiPolygon exteriors into separate parts, retain interior rings as holes, remove ring closure, reject invalid/empty/sub-three-vertex rings. Keep every part attached to its global building.
- [ ] Supply parent-footprint fallback as one or more Polygon parts at base=0 if no usable parts/ready mesh; original fallback is T:167. Avoid overlapping duplicate fallback and actual parts. Ready mesh and extrusions can coexist intentionally.
- [ ] Decide a truthful undated-building policy before export. Binary dates are mandatory i16 scalars; no nullable year exists. Keep date evidence/event/bounds separately. Do not clone Sydney's seeded neighbor/strata guesses unless explicitly intended and honestly presented.
- [ ] Assign finite year/yfrom/yto with yfrom<=year<=yto, date flag and dsrc consistent with evidence. Compute stored period from final year; define <=16 sorted inclusive Venice periods covering every scalar year. Keep any randomized display date separate from original evidence.
- [ ] Build wiki/names/heritage arrays and stable indexes; use -1 for absent references, 0 for absent osm/sp. Retain photo-specific author/license/page metadata if using Commons. Do not invent Australian sources for Venice.
- [ ] Assign globally unique group bits 0..63; write the same masks into global attrs and tile fields. Keep <=8 groups per layer; produce counts/year histograms from actual unique gids, documenting overlap limitations.

### 9.2 Emit these runtime assets

Place files in the existing viewer's `web/data/` deployment directory:

- [ ] `sydney.json` **with Venice values**, full field descriptors and local-frame provenance; the filename must stay unless app.js is changed.
- [ ] `attrs.bin`: N consecutive 56-byte LE records exactly as section 3; zero pad byte; headerless. Gzip with mtime=0 or emit raw.
- [ ] `pack0.bin`, ... (or manifest-listed basenames): concatenated complete SYD2 tiles, outer stored gzip/raw, no extra pack header. Individual tiles must be raw inside packs.
- [ ] `land.bin`, `water.bin`, `context.bin`: flat-polygon format, all local metres, valid context extent and consistent shoreline geometry.
- [ ] `labels.json`, `layers.json`, `wiki.json`, `names.json`, `heritage.json`: correct top-level arrays; use [] where feature absent, not null/object maps.
- [ ] `quests.json=[]` for no walks, or valid Venice quests with the known year-slider caveat.
- [ ] If enabling districts/suburbs: `suburbs.json`, N-byte `suburbs.bin`, and `suburbs-land.bin` together with consistent district indexes/polygon map. Otherwise deliberately disable optional lookup; do not emit a falsely valid N-byte mapping that triggers missing ground.
- [ ] Obtain/restore the viewer shell assets: HTML/app/worker, compatible vendored Three.js/MapControls, stylesheet, fonts and branding or intentionally revised shell. Those missing vendor/style dependencies are not generated by a GeoParquet data exporter.

### 9.3 Tile algorithm and pack organization

- [ ] Simplify safely if desired (original tolerance .25 m). Compute simplified building centroid in projected coordinates, transform to X/Z, and assign tx/tz=floor(centroid/600). Origin=(600tx,600tz).
- [ ] Group buildings per tile in deterministic order. Append each building's metadata once, its Polygon parts/rings/vertices, then ready mesh ownership/positions/indices. Start all sentinel arrays at 0; add end sentinel per owner. Validate B<32768, MV<=65536.
- [ ] Quantize tile-relative X/Z and mesh XYZ to signed decimetres; preserve part top/base as f32 metres. Validate int16 bounds **before casts**, including Y. Reject collapsed rings introduced by quantization; revalidate courtyard/roof geometry after quantization.
- [ ] Pack `<7I2f` header and each SoA in exact order with 4-byte per-section alignment. Use MT=number of triangle rows, V=number of XY pairs, MV=number of XYZ rows. Never confuse counts with component counts.
- [ ] Sort tile descriptors center-out by distance from tile center to model origin, as original does (T:173–176), if reproducing loading behavior. App follows descriptor array order without recomputing distance.
- [ ] Append whole raw tile to current pack; descriptor gets basename, current uncompressed offset, exact raw length. Original flushes **after** appending when accumulated bytes>=800000 or last tile, so 800000 is a target not a maximum (T:30,183–190). Do not split a tile across packs. Compression does not change descriptor offsets.
- [ ] Include each used pack once in packs list. Provide meaningful manifest diagnostic n/bytes/tx/tz/dist if emulating writer output; bytes and length both equal raw tile bytes in the original.

### 9.4 Independent validation / acceptance gates

No web-app execution was performed for this audit; these are concrete gates for exporter implementation, not claims that Venice output already passed them.

- [ ] Decode every generated tile with a separate reader using section-2 offsets; verify magic, exact final byte length, aligned starts, sentinel lengths/ends, monotonic ranges and index bounds. Include odd B/R/MV counts to expose padding bugs.
- [ ] Decompress every pack and verify every descriptor slice exactly covers a complete tile; detect overlapping/gapped slices and undefined pack names. Reconcile all decoded building ownership with global gid mapping and manifest N; no missing/duplicated original buildings.
- [ ] Check attrs.bin length=56N, x/z/search types and all lookup indexes. Verify tile gid/year/flag/floors/heritage/masks agree with corresponding global records (floors GPU cap is deliberate). Check all u8/u16/i16/u32 values for range before serialization.
- [ ] Decode every flat polygon binary; verify count/length formula, open valid outer/hole rings, common coordinate frame, and nonempty finite context bounds. If using districts, verify byte lookup length=N, indices<=254 or sentinel255, values matrix lengths and poly mapping length.
- [ ] Recompute city histogram/period totals, stats.flags, heritage.counts and layer group years from final building records; reconcile programmatically, not by eye. Histogram counts parents, not volumetric parts.
- [ ] Use representative real Venice cases: ordinary footprint, courtyard/hole, disjoint MultiPolygon, multiple heights, raised bridge/part, very large multipart building, named wiki record, uncertain date, optional ready mesh/pale surface. Verify geographic placement, top/base datum, parent picking/card linkage and no quantization overflow.
- [ ] At subsequent permitted integration time, verify vendor/stylesheet deployment, actual fetch bodies and gzip headers, worker triangulation, camera home/label placement, search, temporal entrances and palette/card consistency in the real browser. Static layout agreement alone cannot prove visual validity or performance.

## 10. Findings and unresolved limits

1. The data ABI is precisely reconstructable from the writer/worker pair: 36-byte SYD2 header plus padded SoA payload; global attrs are a separate headerless 56-byte AoS table; background polygons are a third distinct headerless format.
2. The most consequential exporter trap is **one exterior per extruded part**. The writer accepts MultiPolygon rings, but the worker interprets every exterior after the first as a hole. Split them.
3. Part `height` means top elevation in metres; coordinate vertices and ready meshes are signed decimetres. Global h is unsigned decimetres. These are not interchangeable numeric fields.
4. Temporal presence uses only the scalar year in tiles; bounds are explanatory metadata, not birth/death intervals. Date flags are enums. The shader contradicts UI tooltip wording about flag-2 strata under documented-only coloring.
5. Origin/CRS/tileSize in JSON document the exporter frame; they do not cause reprojection in the viewer. All asset families must arrive pretransformed to the same local east/south/up coordinates.
6. Additional transitive vendor/CSS asset requests cannot be proved because those files are absent from this archive. Height-source labels are known from the viewer, but the full upstream height derivation and upstream date-src-to-dsrc mapping are outside the supplied source set. No semantics were invented for missing code.
7. An unchanged data-only Venice adapter is mechanically possible, but city wording, evidence labels, film pivot, year-riddle slider and four-digit-year display remain source-level limits. Accurate undated/historical-demolished-building support would require an explicit model/viewer extension, not a guessed binary sentinel.
