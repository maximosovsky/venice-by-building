# Venice building atlas: engine audit

## Scope and verification

This audit read public source code, renderer workers, data packers, application JavaScript, small configuration files and licensing information. Applications were not executed and runtime performance was not benchmarked. Source snapshots and machine-readable audit manifests are preserved under research/engines/. Downloaded Venice source data are under data/raw/.

## Recommendation

Use SydMap as the primary rendering/UI base, with an independent Venice GIS pipeline and exporter. Its per-part bottom/top elevations fit Veneto EDIFC buildings and UN_VOL volumetric parts better than workers that place every part on the ground. Use Sion's interval classification as a semantic reference, not unverified point dates. Delft is the alternative if measured roof surfaces become available. No engine has been selected by an implementation test yet.

Earlier MapLibre + PMTiles recommendation was preliminary. It remains a simpler alternative for conventional extruded maps, but an existing Three.js viewer is closer to the requested architectural atlas. Do not build a new renderer unless the existing renderer fails a verified requirement.

## Engine comparison

| Projects | Rendering/data architecture | Venice implications |
|---|---|---|
| Amsterdam / Delft | Three.js r186; custom binary geometry packs; workers build combined meshes; GPU picking | Parts and LoD2 roof faces supported. Delft adds historical cadastral comparison. Requires a dedicated exporter. |
| Saint Petersburg | Three.js; ABB2 binary geometry | Pipeline mainly emits one flat-roof part per building; has explicit unknown-date category. |
| Sydney / SydMap | Three.js r186; SYD2 packs; per-part bottom/top; optional ready meshes | Best fit for volumetric parts; prepared Wikipedia/Commons cards. |
| Seville / Aljarafe / cities-spain | Three.js r186; SQV3 packs and sharded attributes | Multi-city organization; different binary contract; mostly LoD1 roofs. |
| Montpellier / Nantes | MapLibre basemap + Three.js building meshes; Delft-derived custom packs | Flat-roof extrusion in reviewed worker; provides Wikipedia/Commons cards. |
| Milan / Italy multi-city | MapLibre + MVT/PMTiles | Standard tile transport and viewport loading; ordinary extrusions. Do not assume the two sites have identical data quality or counts. |
| Sao Paulo | deck.gl 8.9.36 + MVT/PMTiles; aggregate distant views | Different schema, no ready per-part contract or Commons photo adapter. |
| Mexico City | React, MapLibre + deck.gl; PMTiles | Cadastre-specific compact schema, extrusion and GPU animation. |
| London | deck.gl 9.2.11; embedded base64/gzip custom binary | Flat-roof polygons; no confirmed ready Wikimedia cards. |
| Paris | Three.js; CGPB v4 tiles; worker-built parts, taper, terrain and point-cloud landmarks | Rich functionality; application reuse license not established. |
| Rome | Three.js; geometry packs, attrs.bin and wiki.json | Multipart buildings with flat roofs; dates can be census-derived estimates. Separate application license not established. |
| Sion | Three.js; pretriangulated meshes and building metadata | Best interval semantics; requires meshes, not raw footprints. |
| Geneva | Three.js; packed JSON mesh chunks and photomesh | All-rights-reserved terms; written permission required for copying application code. |
| Helsinki / Kruununhaka | Public page resolved to Wix wrapper | Embedded renderer and data contract not established. Do not classify from Wix alone. |

## Critical compatibility points

- Sharing Three.js does not make binary data interchangeable. ABB4, ABB2, SYD2, SQV3 and CGPB are different contracts.
- GeoJSON is an interchange/source format, not a direct input to these custom Three.js viewers.
- Many Three.js forks immediately request all city packs and build tiles progressively. This is NOT viewport-dependent streaming. MVT/PMTiles-based viewers can request only visible tiles.
- Current workers often treat a second exterior ring as a hole. Split MultiPolygon into individual Polygon parts before export, preserving building identity.
- Quantized local coordinates and index widths impose limits. Check overflow, tile extents, mesh vertex/index counts and identifier mapping before packaging.
- Building identity and volumetric part identity must remain separate. Building totals must not count parts or historical/tile duplicates as buildings.
- Dates in GIS metadata are not construction dates. A cadastral observation is not evidence of construction in that year.
- Code licenses do not license the source geodata, Wikipedia prose or Commons photos.

## Data contracts

### Amsterdam / Delft

Initial browser inputs: amsterdam.json or delft.json, layers.json, attrs.bin; land.bin, water.bin, labels.json; pack*.bin and wiki.json. Metric grid tiles are 600 m; packs carry offsets and lengths.

ABB4 little-endian tile, arrays aligned to four bytes:

- Header: uint32 magic, nBuildings, nParts, nRings, nVertices; float32 originX, originZ.
- Buildings: gid:uint32; year:int16; flag, period, floors, energy:uint8; lay0/lay1:uint32; partStart:uint32[nBuildings+1].
- Parts: height:float32; ringStart:uint32[nParts+1].
- Rings: vertStart:uint32[nRings+1]; hole:uint8.
- Vertices: xz:int16[2*nVertices], y:int16[nVertices], in decimetres.
- height >= 0: prism with flat roof; height = -1: roof face with per-vertex elevations.
- attrs.bin stride 44 bytes; includes source numeric ID, height, source/date flags, year, original year, monument, layer masks, wiki index, energy and centroid.

Native pipeline expects Netherlands BAG/3D BAG layers and EPSG:28992. Browser RD New coordinate conversions must be replaced, not just the origin.

SPB differs: ABB2, no roof vertex y array, attrs stride 32, OSM identifier/source-code conventions. Date-flag meanings differ between forks: flag 5 is Wikidata in Amsterdam/Delft but unknown in SPB.

### SydMap

Intermediate geometry: building bid; parts bid,height,base,geometry. height is the TOP elevation relative to the shared zero, not the extrusion thickness; base is the bottom elevation.

SYD2 inputs: sydney.json, gzip-compressed pack*.bin, attrs.bin, wiki.json and related dictionaries.

- Header 36 bytes: counts for buildings, parts, rings, vertices, ready-mesh vertices and triangles, plus tile origin.
- Buildings: gid:uint32; year:int16; flag/period/floors/heritage:uint8; layer masks; part pointers.
- Parts: height/base:float32; ring pointers.
- Rings: vertex pointers and hole flags.
- Vertices: xz:int16, in decimetres.
- Ready meshes: mesh building IDs:uint16, mesh xyz:int16, triangles:uint16.
- attrs stride 56 bytes: osm, year, yfrom, yto, height/source flags, heritage, masks, wiki/name/history/source indexes, floors, date source and centroid.

Sydney metric projection is EPSG:7856. Venice exporter should use its own CRS, with local x east, z south and y up, and matching browser coordinate transforms.

SydMap retains date intervals in cards, but current animation uses a representative year. Its date parser and allocation of estimated years must not be copied blindly into medieval Venice.

### cities-spain

Building/BuildingPart GML becomes GeoParquet, linked by cadastral reference. SQV3 includes municipality/use/monument, building ground base and part heights. Base is per building, not per part. Unknown dates can be imputed from neighbors or 1980: this behavior must be removed for Venice. Current photo handling lacks full individual attribution metadata.

### MapLibre / deck.gl PMTiles variants

PMTiles is the tile container; MVT holds polygons and attributes. Minimal Venice export should explicitly declare id/building_id/part_id, base/top or extrusion height, date interval, date type and source linkage. Native fill-extrusion produces blocks, not measured roof surfaces.

Milan uses buildings source-layer, height and year, source_tier, year_min/year_max, date_source and provenance fields; stats.json is separate. Its cutoff still uses representative year. Italy multi-city also uses city metadata and building PMTiles; reviewed visible-count code estimates counts using a progress formula, so it should not be copied as a true filtered count.

Sao Paulo exports d,h,y0,y1,pav,addr,uso,pad,bairro and heritage/land-use attributes. Viewer date uses yh || y0; y1 is not an interval filter. Mexico City uses compact cadastre-specific fields and data/ciudad.json; no generic Venice adapter exists.

### Paris / Rome / Sion

Paris CGPB v4 supports parts, base/height/ground/skirt and taper; data indices and card facts are separate. Landmark CGEP point clouds are not polygon building geometry. Code availability does not imply permission to reuse.

Rome uses 600 m packs and an attrs stride 44 with year/y0/y1/use/period/wiki/height-source fields. Worker places flat-roof parts on zero base. Browser origin and UTM33 conversions are Rome-specific.

Sion buildings.bin is Float32 interleaved x,y,z,buildingId for ready-triangulated geometry. Dates metadata includes dateKind and interval[lo,hi], preserving null lower bounds. classify(): unknown stays unknown; selected year below lo is future; at/after hi is dated; remaining interval is possible. This is a suitable reference for uncertainty display, but historical existence/sno dates require a separate model.

## Independent Venice model and export

Maintain authoritative data outside the renderer format:

1. buildings: stable string building_id, footprint, name/address.
2. building_parts: stable part_id, building_id, polygon, base_z/top_z, height source and vertical datum.
3. dating_evidence: building_id, event type, interval bounds, original wording, source, review status.
4. wikimedia: building_id, QID, language article URLs/extracts, image thumbnail/file page, artist, license, license URL.
5. historical_states: separate geometry, observed time, source and many-to-many links to contemporary buildings.
6. export lookup: compact numeric gid mapped to original identifiers.

Use metric CRS EPSG:32633 for Venice spatial operations after confirming original CRS and vertical units. Do not confuse EPSG:25833, EPSG:32633 and original national coordinate systems; transform explicitly. Web interchange is EPSG:4326. Store processing layers as GeoPackage/Parquet; preserve raw data unchanged.

Exporter should map EDIFC to buildings and UN_VOL to parts. Keep original base/eaves/extrusion semantics; only calculate heights after validation against documentation and sample objects. eaves minus base does not describe a pitched roof.

Wikidata/Commons enrichment is prepared in the pipeline, not fetched on every click. Preserve QID, article language, date-event meaning, image authorship and license. A nearby Wikidata point is a candidate, not proof of identity.

## Required first implementation test

Test actual Venice examples before deciding the renderer:
- ordinary building;
- multipart palace;
- courtyard/hole;
- elevated part;
- exact date, open-ended period and unknown date;
- Wikimedia card.

Check geometry, coordinate placement, part grouping/picking, interval rendering, photo attribution and measured runtime performance. No such test was performed during this audit.

## Licenses

Amsterdam, SPB, Delft, SydMap, cities-spain and camadas-sp have MIT code licenses with attribution retention. SydMap's GlobalBuildingAtlas source has CC BY-NC constraints; do not import it if using our independent Veneto geometry. Paris/Rome/London application reuse licenses were not established. Geneva terms forbid copying without permission. Sion publishes MIT attribution for its Amsterdam base. Check individual derivative additions and all dataset licenses separately before publication.

## Sources

https://github.com/alexbarakov/amsterdam-by-building
https://github.com/alexbarakov/spb-by-building
https://github.com/alexbarakov/delft-by-building
https://github.com/amarashi/SydMap
https://github.com/thaisadeodato-k/camadas-sp
https://github.com/juaquicar/cities-spain
https://github.com/amarashi/SydMap/blob/main/pipeline/s03_tiles.py
https://github.com/amarashi/SydMap/blob/main/web/worker.js
https://github.com/alexbarakov/delft-by-building/blob/main/web/worker.js
https://sion.conexkt.com/dates.js
https://3dcities.ar-go.co/montpellier/worker.js
https://3dcities.ar-go.co/nantes/worker.js
https://milano-by-building-production.up.railway.app/app.js
https://italia-by-building-production.up.railway.app/app.js
https://paris.bogachev.fr/prism-worker.js
https://jacopoottaviani.com/rome/worker.js
https://plotbrief.co.uk/Londonbyyear
https://cdmx-edificios.vercel.app/assets/index-CYr8CXsr.js
https://geneva3d.ch/web/cgu.html
