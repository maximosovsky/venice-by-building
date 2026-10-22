# Local Veneto / Venezia topographic vector inventory — 2026-10-22

## Scope, method and verified totals

Raw source directory: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004`. This is a read-only examination of the existing local holdings, not a download or a claim of complete regional coverage. No archive was unpacked; ZIP members were read in memory. Python standard-library ZIP/DBF/SHP/SHX parsing was used because geopandas, pyogrio and fiona are not installed. PDF text was read with PyMuPDF. Every valid archive passed ZIP CRC checking; every shapefile DBF record count matched its SHX record count. Actual Z arrays were examined for the building, volume, roof and spot-height layers. Record counts are physical shapefile feature counts, not deduplicated buildings. Selected detailed DBFs contain no deleted rows. Other layers are enumerated by header/index counts, not a full topology-validity audit.

Verified: **124 valid archives; 3169 shapefile layer instances; 96 distinct complete DBF schemas**. The legacy archives additionally contain **122 DXF annotation drawings, 1,441 drawing-layer instances, 139,265 TEXT entities**. Two incomplete ZIP files are retained locally but excluded from geodata totals.
| Release | Valid archives | Distinct shapefile layer names | Shapefile instances | All-layer feature records |
| --- | --- | --- | --- | --- |
| 1987 | 31 | 36 | 602 | 314640 |
| 1994 | 45 | 41 | 1215 | 1099193 |
| 2005 | 46 | 43 | 1282 | 795434 |
| 2006 | 1 | 25 | 25 | 402907 |
| 2010 | 1 | 45 | 45 | 609588 |

Map-sheet archives intersect the municipality but are not necessarily clipped to its boundary. The 2006 lagoon lot is much broader than the 2010 municipality lot. Counts across releases are not comparable municipal building totals; FABBRIC also includes courtyards, structures, precincts and similar non-building categories. Survey/update labels are not construction dates.

## Releases and coordinate reference systems

| Release / source | Horizontal CRS actually available | Evidence and limitations |
| --- | --- | --- |
| 1987 CTRN5000 | Inferred Monte Mario / Italy zone 1 (Gauss–Boaga west), EPSG:3003; metres | 31 sheet ZIPs under `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987`; catalog fuso="Fuso Ovest"; no .prj in these shapefiles. Coordinates approximately 1.77 million E, 5.05 million N. EPSG assignment is an interpretation, not an embedded authority code. |
| 1994 CTRN5000 | Same inferred EPSG:3003; metres | 45 sheet ZIPs under `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994`; no .prj; catalog "Fuso Ovest". |
| 2005 CTRN5000 | Same inferred EPSG:3003; metres | 46 sheet ZIPs under `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005`; no .prj; catalog "Fuso Ovest". |
| 2006 GEODBT LOTTO LAGUNA DI VENEZIA | RDN2008 geographic 2D, EPSG:6706; longitude/latitude in degrees | `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2006_Laguna_aree_complete.zip`; all 25 layers have identical .prj. Catalog/download label ETRF2000 is not a projected UTM CRS. |
| 2010 GEODBT LOTTO COMUNE DI VENEZIA | RDN2008 geographic 2D, EPSG:6706; longitude/latitude in degrees | `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_aree_retry.zip`; all 45 layers have identical .prj. |

Exact embedded GEODBT WKT (70 matching .prj files):
```text
GEOGCS["GCS_RDN2008",DATUM["D_RDN2008",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433],AUTHORITY["EPSG","6706"]]
```

The EPSG:6706 .prj declares only the horizontal datum and angular XY units; it does **not** establish a vertical datum or make Z/height values degrees. The catalog also lists GEODBT representations FUSO12 and GB and a second CTRN zone, but these are catalog alternatives, not extra locally held releases. Only areal GEODBT archives are held; separate line/point GEODBT exports are not present. Exact archive paths and members appear below.

## Building geometry, elevations and volumetric content

| Release / layer | Geometry / count | Heights and 3D usefulness |
| --- | --- | --- |
| 1987 / FABBRIC | PolygonZ / 4,070 | Real nonzero vertex Z values; QUOTABAS, QUOTAGRO, QUOTACOL are all blank. No stored per-building ground/eaves pair or closed volume. |
| 1994 / FABBRIC | PolygonZ / 64,322 | Nonzero Z in 64,246 features; all three explicit quota fields blank. Extreme vertex Z=2395.64 is an obvious quality warning for this region, not a reliable height. |
| 2005 / FABBRIC | PolygonZ / 27,937 | QUOTABAS populated in 27,260 rows; QUOTAGRO in 27,373; paired in 27,260. 27,181 positive differences, 79 zero; difference range 0–54.4. QUOTACOL entirely blank. Useful footprint extrusions after classification/quality filtering. |
| 2006 / EDIFC | PolygonZ / 167,939 | EDIFC_QBAS and EDIFC_QGRO populated in every row; base range -4.1199998–22.184, eaves -1.7039999–70.7699966. Useful extrusions, not ready-made solids. Vertex Z is often ground-like and can be 0 or -1; do not equate it automatically to eaves. |
| 2006 / EDI_MIN | PolygonZ / 82,164 | EDI_MIN_QB and EDI_MIN_QG populated in every row. Minor-building/structure class, not EDIFC; useful elevation pairs. |
| 2006 / UN_VOL | Absent | There is no UN_VOL shapefile in the actual complete lagoon archive. |
| 2010 / EDIFC | 2D Polygon / 40,320 | Building footprints and descriptive metadata only; no height/quota attributes and no Z coordinates. |
| 2010 / UN_VOL | PolygonZ / 181,113 | Building volumetric parts; explicit volume HEIGHT UN_VOL_AV, base UN_VOL_QB, eaves UN_VOL_QG, extrusion quota UN_VOL_QE. These are populated real numbers. No cubic-volume attribute or closed-solid mesh. |
| 2010 / ELE_CP | PolygonZ / 187,161 | Roof/covering elements with real vertex Z and roof typology, valuable for roof-surface geometry; not a closed building shell. |
| 2010 / EDI_MIN | 2D Polygon / 29,477 | No stored base/eaves fields or Z in this export. |

**Units and vertical datum:** height/quota/Z magnitudes and documented Italian field meanings are consistent with **metres**. This is a strong operational inference, not an explicit unit declaration attached to each field in the held PDFs. Near-zero and negative coastal base levels and the specification's distinction between orthometric and ellipsoidal control-point quotas make a local/orthometric sea-level reference plausible. However, **the building vertical datum is not named in the held .prj, catalog or documentation**: do not claim Genova 1942, a particular geoid, ellipsoidal height or tidal zero. A production integration needs an authoritative vertical-reference statement. Numeric zero is not automatically nodata; M no-data extremes in headers are not Z values.

### Verified numeric consistency and quality gates

```json
{
  "2006_base_to_eaves_differences": {
    "EDI_MIN": {
      "paired": 82164,
      "positive": 81873,
      "zero": 251,
      "negative": 40,
      "min": -16.1380004,
      "max": 35.675999149999996
    },
    "EDIFC": {
      "paired": 167939,
      "positive": 167620,
      "zero": 247,
      "negative": 72,
      "min": -11.0959997,
      "max": 61.8639984
    }
  },
  "2010_UN_VOL_consistency_tolerance_metres": 0.011,
  "2010_UN_VOL_checks": {
    "n": 181113,
    "AV_equals_QG_minus_QB": 181059,
    "AV_equals_QE_minus_QB": 12163,
    "QE_equals_QG": 12167,
    "negative_AV": 17,
    "zero_AV": 2,
    "zmax_equals_QG": 38191,
    "zmin_equals_QB": 27,
    "POR": {
      "01": 175825,
      "04": 4435,
      "03": 825,
      "02": 2,
      "09": 1,
      "06": 23,
      "07": 2
    },
    "EX": {
      "92": 181113
    }
  }
}
```

UN_VOL_AV equals QG−QB within 0.011 in 181,059/181,113 rows; 54 fail this check. There are 17 negative heights and 2 zero heights. QE equals QG only in 12,167 rows; **QE must not be silently substituted for eaves**. Every UN_VOL_EX="92" means *not assigned*, despite EX being specified as 01 (extrusion to altitude) or 02 (thickness). Vertex Z is neither reliably base nor uniformly eaves: the first part has Z=2.61–2.65, QB=-0.19, QG=3.53, QE=3.53 and AV=3.72. Preserve these distinct source signals and validate any reconstruction rather than assuming an implicit extrusion rule.

ELE_CP has 187,147 nonzero-Z features, Z range -3.66–152.36; 165,464 polygons have variable vertex Z. Such polygons can encode sloped roofs, but no triangulation/planarity/closedness validation was performed. Its numeric-looking ELE_CP_QE is actually C(8): 2,640 blank values and two comma-decimal strings ("6,56", "7,33") occur. ELE_CP_EX is blank throughout. Heights as large as 152.36 and negative Z require inspection, not automatic rejection or acceptance.

### Complete meaning of EDIFC / UN_VOL attributes

Definitions are grounded in the held 2010 specification, printed pages 19–20 and 39–44. The held 2006 PDF is only eight pages (DB Cartografico v1.5) and refers to separate attribute appendices not supplied; old-field interpretations corresponding to the new names are marked as such. Full physical schemas, widths and numeric precision are listed in the schema dictionary.

| Attribute | Present in | Meaning / caution |
| --- | --- | --- |
| ID | 2006 EDIFC | Unique territorial-object identifier within a lot (documented ID semantics); not a guaranteed inter-release identity. |
| OBJECTID | 2006 EDIFC | Export/database object identifier; exact generation contract not documented locally; not unique in EDIFC. |
| LIVCOD | 2006 EDIFC | Legacy cartographic classification code (interpretation from legacy DESCRZ/LIVCOD rows). |
| DATA_CRE | Both EDIFC; UN_VOL | GIS-object creation date, nominal YYYYMMDD, not construction date; 2006 stored as numeric with decimals. |
| DATA_MOD | Both EDIFC; UN_VOL | GIS-object modification date; not renovation/completion date. |
| TIPO_MOD | Both EDIFC; UN_VOL | Change relative to previous map edition: 00 unchanged existing; 01 new/replacement mapped object; 02 geometric change; 03 recoding; 04 both; 05 no longer present. Does not establish construction/demolition dates. |
| ORIGINE | Both EDIFC; UN_VOL | Source/provenance category. 01 new aerial or satellite survey; 02 orthophoto; 03 direct instrumental survey; other codes in specification pp.19–20. |
| SCALA | Both EDIFC; UN_VOL | Representation scale code: 01=1:2000; 02=1:5000; 03=1:10000; 04=1:25000; 05=1:50000. |
| CODICE | 2010 EDIFC; UN_VOL | CLASS code, not building ID: EDIFC=020102; UN_VOL=020101. |
| EDIFC_TY | Both EDIFC | Building typology (generic, industrial shed, church, bell tower, tower, etc.); not building age. |
| EDIFC_USO | Both EDIFC | Use-category code (residential, administration, public service, industrial, etc.); not construction period. |
| EDIFC_SOT | Both EDIFC | Underground status: 01 non-underground; 02 underground. |
| EDIFC_STAT | Both EDIFC | State: 01 under construction; 02 disused/ruined; 03 in operation/use. 2006 decoding is a compatible interpretation from the newer specification and matching legacy codes, not a held v1.5 attribute appendix. |
| EDIFC_PORZ | Both EDIFC | Extent/portion: 01 ground footprint; 02 overhang; 03 portico; 04 underpass. |
| EDIFC_CONT | Both EDIFC | Contour type: 01 real; 02 fictitious. |
| EDIFC_NOM | Both EDIFC | Building name. 2006 width is just 1 character, unlike 2010 width 50; no reliable rich name source in old export. |
| EDIFC_QBAS | 2006 EDIFC | Base-level quota (interpreted quota alla base): absolute/source-referenced elevation, not height. |
| EDIFC_QGRO | 2006 EDIFC | Eaves-level quota (interpreted quota in gronda): absolute/source-referenced elevation, not ridge altitude. |
| GEOMETRY_S | 2006 EDIFC | Export geometry/database reference, exact meaning not documented in held PDFs; not unique. |
| GID | 2006 EDIFC | Export/database identifier, exact contract undocumented; not unique. |
| UN_VOL_AV | 2010 UN_VOL | Documented altezza volume: volumetric-unit HEIGHT, apparently metres. It is not cubic volume. |
| UN_VOL_POR | 2010 UN_VOL | Portion type: 01 ground; 02 overhang; 03 portico ceiling; 04 underpass ceiling; 05 loggia ceiling; 06 intermediate/overlapping; 07 attic; 08 underground; 09 archway/covered corridor. |
| UN_VOL_QE | 2010 UN_VOL | Documented quota estrusione: extrusion elevation/parameter, distinct from eaves and base. Do not treat as thickness without valid EX semantics. |
| UN_VOL_EX | 2010 UN_VOL | Extrusion type: 01 to altitude; 02 thickness. Actual 92=not assigned in all rows. |
| UN_VOL_QB | 2010 UN_VOL | Documented quota alla base: base elevation of volumetric part; for raised parts this is not necessarily terrain. |
| UN_VOL_QG | 2010 UN_VOL | Documented quota in gronda: eaves elevation of volumetric part, not roof-ridge elevation. |

Related legacy FABBRIC quota meanings inferred from the names: QUOTABAS=base elevation; QUOTAGRO=eaves elevation; QUOTACOL=ridge elevation (colmo), but the last is blank in all three editions. PUNTI_Q.QUOTA stores spot elevations; LIVCOD=1104 / DESCRZ="quote linee di gronda" explicitly identifies 27,270 eaves spot-height records in 2005. The legacy points have no building foreign key. 1987/1994 point categories are ground and bathymetric, not explicit eaves. 2006 EDI_MIN_QB/QG correspond to minor-structure base/eaves, again without a supplied old attribute dictionary.

### Actual sample rows — unmodified DBF strings and real vertex Z

DBF strings below deliberately preserve leading zeros, raw decimal artefacts, blanks and raw dates. Record numbers are 1-based SHP/DBF positions, not stable object identifiers.

#### 1987 / FABBRIC

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128022.zip::128022o/FABBRIC.shp`

```json
[
  {
    "record": 1,
    "NUMERO": "218",
    "NUME_E_S": "128022",
    "DESCRZ": "edificio civile",
    "LIVCOD": "0101",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "1987430",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 0.298,
      "zmax": 4.708,
      "z_first": [
        4.32,
        4.61,
        0.78,
        0.958,
        0.568,
        0.298,
        4.708,
        4.639
      ]
    }
  },
  {
    "record": 2,
    "NUMERO": "219",
    "NUME_E_S": "128022",
    "DESCRZ": "baracca",
    "LIVCOD": "0103",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "1987430",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": -0.07,
      "zmax": 0.848,
      "z_first": [
        0.848,
        0.408,
        -0.07,
        0.25,
        0.848
      ]
    }
  },
  {
    "record": 3,
    "NUMERO": "220",
    "NUME_E_S": "128022",
    "DESCRZ": "stalla o allevamento agricolo o fienile",
    "LIVCOD": "0109",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "1987430",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 3.778,
      "zmax": 5.589,
      "z_first": [
        3.91,
        5.589,
        5.23,
        3.778,
        3.91
      ]
    }
  }
]
```
#### 1994 / FABBRIC

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127033.zip::127033o/FABBRIC.shp`

```json
[
  {
    "record": 1,
    "NUMERO": "1973",
    "NUME_E_S": "127033",
    "DESCRZ": "baracca",
    "LIVCOD": "0103",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "1994430",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 13.538,
      "zmax": 13.75,
      "z_first": [
        13.75,
        13.72,
        13.57,
        13.538,
        13.75
      ]
    }
  },
  {
    "record": 2,
    "NUMERO": "1974",
    "NUME_E_S": "127033",
    "DESCRZ": "baracca",
    "LIVCOD": "0103",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "1994430",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 13.189,
      "zmax": 13.362,
      "z_first": [
        13.362,
        13.3,
        13.189,
        13.307,
        13.307,
        13.362
      ]
    }
  },
  {
    "record": 3,
    "NUMERO": "1976",
    "NUME_E_S": "127033",
    "DESCRZ": "edificio civile",
    "LIVCOD": "0101",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "1994430",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 13.078,
      "zmax": 16.03,
      "z_first": [
        13.078,
        16.03,
        16.01,
        16.01,
        14.511,
        14.511,
        13.078
      ]
    }
  }
]
```
#### 2005 / FABBRIC

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127033.zip::127033o/FABBRIC.Shp`

```json
[
  {
    "record": 1,
    "NUMERO": "5718",
    "NUME_E_S": "127033",
    "DESCRZ": "cortile interno",
    "LIVCOD": "0125",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "199411",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 19.49,
      "zmax": 19.5,
      "z_first": [
        19.49,
        19.5,
        19.5,
        19.49,
        19.49
      ]
    }
  },
  {
    "record": 2,
    "NUMERO": "5719",
    "NUME_E_S": "127033",
    "DESCRZ": "cortile interno",
    "LIVCOD": "0125",
    "COD_FACC": "",
    "ATT_FACC": "",
    "DATA_CRE": "200541",
    "DATA_MOD": "0",
    "TIPO_MOD": "1",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 12.71,
      "zmax": 18.08,
      "z_first": [
        18.08,
        12.71,
        12.71,
        12.71,
        12.71,
        12.87,
        12.87,
        17.9
      ]
    }
  },
  {
    "record": 3,
    "NUMERO": "9424",
    "NUME_E_S": "127033",
    "DESCRZ": "tendone presurizzato",
    "LIVCOD": "0118",
    "COD_FACC": "AL015",
    "ATT_FACC": "BFC999",
    "DATA_CRE": "199411",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "",
    "QUOTAGRO": "",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": "",
    "actual_geometry_Z": {
      "zmin": 13.2,
      "zmax": 13.82,
      "z_first": [
        13.2,
        13.82,
        13.58,
        13.255,
        13.2
      ]
    }
  }
]
```
#### 2006 / EDIFC

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2006_Laguna_aree_complete.zip::LagunaVenazia_aree/EDIFC.shp`

```json
[
  {
    "record": 1,
    "ID": "157",
    "OBJECTID": "66.0000000000000000",
    "LIVCOD": "0108",
    "DATA_CRE": "19990101.0000000000000000",
    "DATA_MOD": "20110801.0000000000000000",
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "EDIFC_TY": "01",
    "EDIFC_USO": "01",
    "EDIFC_SOT": "01",
    "EDIFC_STAT": "02",
    "EDIFC_PORZ": "01",
    "EDIFC_CONT": "01",
    "EDIFC_NOM": "",
    "EDIFC_QBAS": "2.5429999800000000",
    "EDIFC_QGRO": "8.8109998700000000",
    "GEOMETRY_S": "157",
    "GID": "157.0000000000000000",
    "actual_geometry_Z": {
      "zmin": -1.0,
      "zmax": -1.0,
      "z_first": [
        -1.0,
        -1.0,
        -1.0,
        -1.0,
        -1.0
      ]
    }
  },
  {
    "record": 2,
    "ID": "158",
    "OBJECTID": "67.0000000000000000",
    "LIVCOD": "0107",
    "DATA_CRE": "19990101.0000000000000000",
    "DATA_MOD": "20110801.0000000000000000",
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "EDIFC_TY": "01",
    "EDIFC_USO": "01",
    "EDIFC_SOT": "01",
    "EDIFC_STAT": "01",
    "EDIFC_PORZ": "01",
    "EDIFC_CONT": "01",
    "EDIFC_NOM": "",
    "EDIFC_QBAS": "3.3550000100000000",
    "EDIFC_QGRO": "3.6579999900000000",
    "GEOMETRY_S": "158",
    "GID": "158.0000000000000000",
    "actual_geometry_Z": {
      "zmin": 0.0,
      "zmax": 0.0,
      "z_first": [
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0
      ]
    }
  },
  {
    "record": 3,
    "ID": "178",
    "OBJECTID": "68.0000000000000000",
    "LIVCOD": "0101",
    "DATA_CRE": "19990101.0000000000000000",
    "DATA_MOD": "20110801.0000000000000000",
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "EDIFC_TY": "01",
    "EDIFC_USO": "01",
    "EDIFC_SOT": "01",
    "EDIFC_STAT": "03",
    "EDIFC_PORZ": "01",
    "EDIFC_CONT": "01",
    "EDIFC_NOM": "",
    "EDIFC_QBAS": "2.8499999000000000",
    "EDIFC_QGRO": "7.4390001200000000",
    "GEOMETRY_S": "178",
    "GID": "178.0000000000000000",
    "actual_geometry_Z": {
      "zmin": 2.699125,
      "zmax": 2.78766666666667,
      "z_first": [
        2.699125,
        2.78766666666667,
        2.757875,
        2.709875,
        2.699125
      ]
    }
  }
]
```
#### 2006 / EDI_MIN

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2006_Laguna_aree_complete.zip::LagunaVenazia_aree/EDI_MIN.shp`

```json
[
  {
    "record": 1,
    "ID": "223",
    "OBJECTID": "72.0000000000000000",
    "LIVCOD": "0103",
    "DATA_CRE": "19990101.0000000000000000",
    "DATA_MOD": "20110801.0000000000000000",
    "TIPO_MOD": "00",
    "ORIGINE": "01",
    "SCALA": "02",
    "EDI_MIN_TY": "01",
    "EDI_MIN_PR": "01",
    "EDI_MIN_ST": "01",
    "EDI_MIN_CO": "01",
    "EDI_MIN_QB": "1.5820000100000000",
    "EDI_MIN_QG": "5.3200001700000000",
    "GEOMETRY_S": "223",
    "GID": "223.0000000000000000",
    "actual_geometry_Z": {
      "zmin": 1.628375,
      "zmax": 1.8373125,
      "z_first": [
        1.755875,
        1.628375,
        1.74325,
        1.8373125,
        1.755875
      ]
    }
  },
  {
    "record": 2,
    "ID": "224",
    "OBJECTID": "73.0000000000000000",
    "LIVCOD": "0104",
    "DATA_CRE": "19990101.0000000000000000",
    "DATA_MOD": "20110801.0000000000000000",
    "TIPO_MOD": "00",
    "ORIGINE": "01",
    "SCALA": "02",
    "EDI_MIN_TY": "50",
    "EDI_MIN_PR": "01",
    "EDI_MIN_ST": "01",
    "EDI_MIN_CO": "01",
    "EDI_MIN_QB": "2.9219999300000000",
    "EDI_MIN_QG": "9.1730003300000000",
    "GEOMETRY_S": "224",
    "GID": "224.0000000000000000",
    "actual_geometry_Z": {
      "zmin": 2.681625,
      "zmax": 2.82975,
      "z_first": [
        2.82975,
        2.700375,
        2.681625,
        2.704125,
        2.745375,
        2.811625,
        2.82975
      ]
    }
  },
  {
    "record": 3,
    "ID": "246",
    "OBJECTID": "74.0000000000000000",
    "LIVCOD": "0103",
    "DATA_CRE": "19990101.0000000000000000",
    "DATA_MOD": "20050401.0000000000000000",
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "EDI_MIN_TY": "01",
    "EDI_MIN_PR": "01",
    "EDI_MIN_ST": "01",
    "EDI_MIN_CO": "01",
    "EDI_MIN_QB": "8.1929998300000000",
    "EDI_MIN_QG": "10.4060001000000000",
    "GEOMETRY_S": "246",
    "GID": "246.0000000000000000",
    "actual_geometry_Z": {
      "zmin": -1.0,
      "zmax": -1.0,
      "z_first": [
        -1.0,
        -1.0,
        -1.0,
        -1.0,
        -1.0
      ]
    }
  }
]
```
#### 2010 / EDIFC

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_aree_retry.zip::ComuneVenezia_aree/EDIFC.shp`

```json
[
  {
    "record": 1,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "CODICE": "020102",
    "EDIFC_TY": "01",
    "EDIFC_USO": "09",
    "EDIFC_SOT": "01",
    "EDIFC_STAT": "03",
    "EDIFC_PORZ": "01",
    "EDIFC_CONT": "01",
    "EDIFC_NOM": "",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325"
  },
  {
    "record": 2,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "CODICE": "020102",
    "EDIFC_TY": "01",
    "EDIFC_USO": "09",
    "EDIFC_SOT": "01",
    "EDIFC_STAT": "03",
    "EDIFC_PORZ": "01",
    "EDIFC_CONT": "01",
    "EDIFC_NOM": "",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325"
  },
  {
    "record": 3,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "CODICE": "020102",
    "EDIFC_TY": "01",
    "EDIFC_USO": "09",
    "EDIFC_SOT": "01",
    "EDIFC_STAT": "03",
    "EDIFC_PORZ": "01",
    "EDIFC_CONT": "01",
    "EDIFC_NOM": "",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325"
  }
]
```
#### 2010 / UN_VOL

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_aree_retry.zip::ComuneVenezia_aree/UN_VOL.shp`

```json
[
  {
    "record": 1,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "CODICE": "020101",
    "UN_VOL_AV": "3.720000000000000",
    "UN_VOL_POR": "01",
    "UN_VOL_QE": "3.530000000000000",
    "UN_VOL_EX": "92",
    "UN_VOL_QB": "-0.190000000000000",
    "UN_VOL_QG": "3.530000000000000",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325",
    "actual_geometry_Z": {
      "zmin": 2.61,
      "zmax": 2.65,
      "z_first": [
        2.64,
        2.61,
        2.62,
        2.65,
        2.64
      ]
    }
  },
  {
    "record": 2,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "CODICE": "020101",
    "UN_VOL_AV": "3.760000000000000",
    "UN_VOL_POR": "01",
    "UN_VOL_QE": "3.530000000000000",
    "UN_VOL_EX": "92",
    "UN_VOL_QB": "-0.230000000000000",
    "UN_VOL_QG": "3.530000000000000",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325",
    "actual_geometry_Z": {
      "zmin": 2.6,
      "zmax": 2.64,
      "z_first": [
        2.64,
        2.6,
        2.61,
        2.64,
        2.64
      ]
    }
  },
  {
    "record": 3,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "02",
    "CODICE": "020101",
    "UN_VOL_AV": "3.720000000000000",
    "UN_VOL_POR": "01",
    "UN_VOL_QE": "3.530000000000000",
    "UN_VOL_EX": "92",
    "UN_VOL_QB": "-0.190000000000000",
    "UN_VOL_QG": "3.530000000000000",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325",
    "actual_geometry_Z": {
      "zmin": 2.6,
      "zmax": 2.64,
      "z_first": [
        2.63,
        2.6,
        2.6,
        2.64,
        2.63
      ]
    }
  }
]
```
#### 2010 / ELE_CP

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_aree_retry.zip::ComuneVenezia_aree/ELE_CP.shp`

```json
[
  {
    "record": 1,
    "ELE_CP_TY": "01",
    "ELE_CP_QE": "14.32",
    "ELE_CP_EX": "",
    "ELE_CP_CON": "",
    "DATA_CRE": "20130325",
    "DATA_MOD": "20130325",
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "CODICE": "020104",
    "SCALA": "01",
    "actual_geometry_Z": {
      "zmin": 11.77,
      "zmax": 14.32,
      "z_first": [
        14.32,
        11.77,
        11.77,
        14.32,
        14.32
      ]
    }
  },
  {
    "record": 2,
    "ELE_CP_TY": "01",
    "ELE_CP_QE": "11.85",
    "ELE_CP_EX": "",
    "ELE_CP_CON": "",
    "DATA_CRE": "20130325",
    "DATA_MOD": "20130325",
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "CODICE": "020104",
    "SCALA": "01",
    "actual_geometry_Z": {
      "zmin": 11.77,
      "zmax": 14.32,
      "z_first": [
        11.85,
        14.32,
        14.32,
        11.77,
        11.85
      ]
    }
  },
  {
    "record": 3,
    "ELE_CP_TY": "01",
    "ELE_CP_QE": "11.77",
    "ELE_CP_EX": "",
    "ELE_CP_CON": "",
    "DATA_CRE": "20130325",
    "DATA_MOD": "20130325",
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "CODICE": "020104",
    "SCALA": "01",
    "actual_geometry_Z": {
      "zmin": 11.77,
      "zmax": 14.32,
      "z_first": [
        11.77,
        14.32,
        11.77,
        11.77
      ]
    }
  }
]
```

Additional 2010 UN_VOL rows where QE differs from QG:

```json
[
  {
    "record": 122,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "01",
    "CODICE": "020101",
    "UN_VOL_AV": "5.410000000000000",
    "UN_VOL_POR": "01",
    "UN_VOL_QE": "13.700000000000000",
    "UN_VOL_EX": "92",
    "UN_VOL_QB": "5.650000000000000",
    "UN_VOL_QG": "11.060000000000000",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325",
    "geometry_z_min": 11.06,
    "geometry_z_max": 11.45
  },
  {
    "record": 123,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "01",
    "CODICE": "020101",
    "UN_VOL_AV": "2.870000000000000",
    "UN_VOL_POR": "01",
    "UN_VOL_QE": "9.680000000000000",
    "UN_VOL_EX": "92",
    "UN_VOL_QB": "4.560000000000000",
    "UN_VOL_QG": "7.430000000000000",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325",
    "geometry_z_min": 7.43,
    "geometry_z_max": 8.14
  },
  {
    "record": 124,
    "TIPO_MOD": "01",
    "ORIGINE": "01",
    "SCALA": "01",
    "CODICE": "020101",
    "UN_VOL_AV": "2.810000000000000",
    "UN_VOL_POR": "01",
    "UN_VOL_QE": "7.850000000000000",
    "UN_VOL_EX": "92",
    "UN_VOL_QB": "4.060000000000000",
    "UN_VOL_QG": "6.870000000000000",
    "DATA_MOD": "20130325",
    "DATA_CRE": "20130325",
    "geometry_z_min": 6.87,
    "geometry_z_max": 8.76
  }
]
```
### Additional populated legacy elevation samples

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127033.zip::127033o/FABBRIC.Shp`

```json
[
  {
    "record": 49,
    "NUMERO": "17852",
    "NUME_E_S": "127033",
    "DESCRZ": "chiesa",
    "LIVCOD": "0105",
    "COD_FACC": "AL015",
    "ATT_FACC": "BFC050",
    "DATA_CRE": "199411",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "9.1",
    "QUOTAGRO": "13.6",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": ""
  },
  {
    "record": 50,
    "NUMERO": "17853",
    "NUME_E_S": "127033",
    "DESCRZ": "edificio civile",
    "LIVCOD": "0101",
    "COD_FACC": "AL015",
    "ATT_FACC": "USE044",
    "DATA_CRE": "199411",
    "DATA_MOD": "0",
    "TIPO_MOD": "0",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "9.1",
    "QUOTAGRO": "11.9",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": ""
  },
  {
    "record": 51,
    "NUMERO": "17854",
    "NUME_E_S": "127033",
    "DESCRZ": "edificio civile",
    "LIVCOD": "0101",
    "COD_FACC": "AL015",
    "ATT_FACC": "USE044",
    "DATA_CRE": "200541",
    "DATA_MOD": "0",
    "TIPO_MOD": "1",
    "FLG_CONT": "",
    "NOME": "",
    "SUPERFIC": "",
    "PERIMETR": "",
    "QUOTABAS": "11.7",
    "QUOTAGRO": "14.4",
    "QUOTACOL": "",
    "FUS_ORIG": "",
    "COD_VIS": "0",
    "COD_LOT": "",
    "ORIGINE": ""
  }
]
```

Exact source: `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127033.zip::127033o/PUNTI_Q.Shp`

```json
[
  {
    "record": 1,
    "AREA": "",
    "PERIMETER": "",
    "PUNTI_Q_": "",
    "PUNTI_Q_ID": "",
    "NUMERO": "5729",
    "NUME_E_S": "127033",
    "DESCRZ": "quote linee di gronda",
    "LIVCOD": "1104",
    "COD_FACC": "CA030",
    "ATT_FACC": "",
    "DATA_CRE": "200541",
    "DATA_MOD": "0",
    "TIPO_MOD": "1",
    "QUOTA": "15.91",
    "ANG_ROT": "0.00",
    "FUS_ORIG": "",
    "COD_LOT": "",
    "ORIGINE": ""
  },
  {
    "record": 2,
    "AREA": "",
    "PERIMETER": "",
    "PUNTI_Q_": "",
    "PUNTI_Q_ID": "",
    "NUMERO": "5730",
    "NUME_E_S": "127033",
    "DESCRZ": "quote linee di gronda",
    "LIVCOD": "1104",
    "COD_FACC": "CA030",
    "ATT_FACC": "",
    "DATA_CRE": "200541",
    "DATA_MOD": "0",
    "TIPO_MOD": "1",
    "QUOTA": "13.45",
    "ANG_ROT": "0.00",
    "FUS_ORIG": "",
    "COD_LOT": "",
    "ORIGINE": ""
  },
  {
    "record": 3,
    "AREA": "",
    "PERIMETER": "",
    "PUNTI_Q_": "",
    "PUNTI_Q_ID": "",
    "NUMERO": "5731",
    "NUME_E_S": "127033",
    "DESCRZ": "quote linee di gronda",
    "LIVCOD": "1104",
    "COD_FACC": "CA030",
    "ATT_FACC": "",
    "DATA_CRE": "200541",
    "DATA_MOD": "0",
    "TIPO_MOD": "1",
    "QUOTA": "14.83",
    "ANG_ROT": "0.00",
    "FUS_ORIG": "",
    "COD_LOT": "",
    "ORIGINE": ""
  }
]
```

## Cross-release building identifiers

**No stable authoritative building identifier spans 1987, 1994, 2005, 2006 and 2010 in these holdings.** Legacy NUMERO is sheet-local and is demonstrably reused; NUME_E_S is the sheet identifier, not a building ID. Tested shared (NUME_E_S, NUMERO) keys below, comparing all four XY bounding-box coordinates with a 2-metre tolerance. This is a conservative mismatch screen, not a geometric identity proof. Every shared tested key maps to a different bounding box. Legacy 1987 and 1994 local sheet sets do not overlap; 2005 overlaps subsets of both.

```json
{
  "1987 vs 2005": {
    "common_sheets": 24,
    "shared_ids": 17,
    "bbox_near": 0,
    "bbox_far": 17,
    "code_equal": 3,
    "examples": [
      {
        "sheet": "128061",
        "key": [
          "128061",
          "54"
        ],
        "1987": [
          [
            1770013.33,
            5049529.4,
            1770020.54,
            5049535.48
          ],
          "0103"
        ],
        "2005": [
          [
            1770000.7948012133,
            5049540.113767642,
            1770006.7775342357,
            5049546.783675412
          ],
          "0103"
        ]
      },
      {
        "sheet": "128031",
        "key": [
          "128031",
          "16270"
        ],
        "1987": [
          [
            1779214.98,
            5053540.9,
            1779218.04,
            5053543.96
          ],
          "0117"
        ],
        "2005": [
          [
            1777807.5852344153,
            5054235.981546091,
            1777813.4654781476,
            5054248.121390984
          ],
          "0103"
        ]
      },
      {
        "sheet": "128031",
        "key": [
          "128031",
          "16290"
        ],
        "1987": [
          [
            1778167.26,
            5054545.97,
            1778190.35,
            5054565.84
          ],
          "0101"
        ],
        "2005": [
          [
            1776880.0862306517,
            5053217.025052306,
            1776886.3343890079,
            5053229.926998734
          ],
          "0103"
        ]
      }
    ]
  },
  "1994 vs 2005": {
    "common_sheets": 16,
    "shared_ids": 907,
    "bbox_near": 0,
    "bbox_far": 907,
    "code_equal": 437,
    "examples": [
      {
        "sheet": "127154",
        "key": [
          "127154",
          "16000"
        ],
        "1994": [
          [
            1750427.69,
            5036093.19,
            1750433.41,
            5036108.92
          ],
          "0101"
        ],
        "2005": [
          [
            1747845.8662434993,
            5037701.362050443,
            1747868.1414208643,
            5037719.247152045
          ],
          "0101"
        ]
      },
      {
        "sheet": "127154",
        "key": [
          "127154",
          "3368"
        ],
        "1994": [
          [
            1748369.23,
            5037490.66,
            1748389.56,
            5037504.64
          ],
          "0101"
        ],
        "2005": [
          [
            1749342.7457232834,
            5035544.812214104,
            1749350.5486910143,
            5035566.429914492
          ],
          "0125"
        ]
      },
      {
        "sheet": "127154",
        "key": [
          "127154",
          "8063"
        ],
        "1994": [
          [
            1749760.19,
            5036194.41,
            1749765.48,
            5036199.78
          ],
          "0103"
        ],
        "2005": [
          [
            1750412.0166941036,
            5035991.296055038,
            1750481.1916608142,
            5036120.854050422
          ],
          "0110P"
        ]
      }
    ]
  }
}
```

The 2006 EDIFC ID is unique across its 167,939 records, but OBJECTID, GEOMETRY_S and GID each have only 167,769 distinct values. No supplied crosswalk links these IDs to CTRN NUMERO. In 2010 EDIFC and UN_VOL there is **no ID, OBJECTID, GID or building-part foreign key at all**. CODICE is the constant class code, not an identifier. SHP record numbers/FIDs are positional. Thus even EDIFC-to-UN_VOL linkage within 2010 requires spatial/topological matching; historical linkage needs an explicit spatial-matching workflow with split/merge and coverage uncertainty, not an ID join. No such matching was performed in this inventory.

## Construction dates, age classes and state

No held shapefile schema contains an identified building-construction-date or building-age-class attribute. All actual schema field names were enumerated. DATA_CRE/DATA_MOD are object metadata; catalog agg is edition/update year. Do not normalize malformed legacy date tokens into precise dates: examples 1987430, 1994430, 199411 and 200541 are printed exactly as stored.

| Release / state field | Actual values and counts | Interpretation |
| --- | --- | --- |
| 2006 EDIFC_STAT | 01:525; 02:1,184; 03:166,230 | 01 under construction; 02 disused/ruined; 03 in use (compatible new-spec interpretation). |
| 2010 EDIFC_STAT | 01:90; 02:367; 03:39,863 | Same EDIFC dictionary, explicitly documented p.44. |
| 2006 EDI_MIN_ST | 01:82,164 | Minor-structure state: 01 in use (compatible interpretation). |
| 2010 EDI_MIN_ST | 01:29,457; 02:6; 03:14 | 01 in use; 02 under construction; 03 disused/ruined, documented p.47. Note codes differ from EDIFC_STAT. |

Legacy construction/ruin classes are encoded in LIVCOD plus human-readable DESCRZ rather than age dates:

| Release | Layer | LIVCOD | Exact DESCRZ | Records |
| --- | --- | --- | --- | --- |
| 1987 | FABBRIC | 0107 | edificio in costruzione | 1 |
| 1987 | FABBRIC | 0108 | rudere o edificio semi diroccato | 27 |
| 1987 | FABBR_L | 0108 | rudere o edificio semi diroccato | 16 |
| 1994 | FABBRIC | 0107 | edificio in costruzione | 49 |
| 1994 | FABBRIC | 0108 | rudere o edificio semi diroccato | 13 |
| 1994 | FABBR_L | 0108 | rudere o edificio semi diroccato | 237 |
| 2005 | FABBRIC | 0107 | edificio in costruzione | 30 |
| 2005 | FABBRIC | 0108 | rudere o edificio semi diroccato | 151 |
| 2005 | FABBR_L | 1707 | edificio in costruzione | 226 |

Actual GEODBT date/change distributions (all rows, not only samples):

```json
{
  "2006/EDI_MIN": {
    "DATA_CRE": {
      "19990101.0000000000000000": 82164
    },
    "DATA_MOD": {
      "20110801.0000000000000000": 60620,
      "20050401.0000000000000000": 12896,
      "0.0000000000000000": 8618,
      "20090326.0000000000000000": 30
    },
    "TIPO_MOD": {
      "00": 37368,
      "01": 44796
    },
    "EDI_MIN_ST": {
      "01": 82164
    }
  },
  "2006/EDIFC": {
    "DATA_CRE": {
      "19990101.0000000000000000": 167939
    },
    "DATA_MOD": {
      "20110801.0000000000000000": 126464,
      "20050401.0000000000000000": 11551,
      "20110303.0000000000000000": 157,
      "0.0000000000000000": 29745,
      "20090326.0000000000000000": 22
    },
    "TIPO_MOD": {
      "01": 42728,
      "00": 125211
    },
    "EDIFC_STAT": {
      "02": 1184,
      "01": 525,
      "03": 166230
    }
  },
  "2010/EDI_MIN": {
    "TIPO_MOD": {
      "01": 29477
    },
    "EDI_MIN_ST": {
      "01": 29457,
      "02": 6,
      "03": 14
    },
    "DATA_MOD": {
      "20130325": 29477
    },
    "DATA_CRE": {
      "20130325": 29477
    }
  },
  "2010/EDIFC": {
    "TIPO_MOD": {
      "01": 40320
    },
    "EDIFC_STAT": {
      "03": 39863,
      "02": 367,
      "01": 90
    },
    "DATA_MOD": {
      "20130325": 40320
    },
    "DATA_CRE": {
      "20130325": 40320
    }
  },
  "2010/UN_VOL": {
    "TIPO_MOD": {
      "01": 181113
    },
    "DATA_MOD": {
      "20130325": 181113
    },
    "DATA_CRE": {
      "20130325": 181113
    }
  }
}
```
2006 EDIFC creation metadata is identical (19990101) despite the release label 2006 and modifications as late as 20110801. Both 2010 building and volume tables use 20130325 throughout. Neither observation supports an individual construction chronology. All 2010 TIPO_MOD values are 01, making it particularly unsafe to interpret them as newly constructed buildings.

## Licence / usage statements

The locally held catalog `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\catalog.json` has no licence/rights field or grant, and `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\download_manifest.json` records download provenance/verification, not permissions. Neither held PDF provides an explicit dataset redistribution licence, copyright licence or named Creative Commons grant. **Licence is unestablished for all five releases from these local holdings**; availability on a public portal is not itself a licence. This report does not assert that reuse is prohibited, only that permission has not been evidenced here.

Exact usage caution in local `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\README.md`, line 32:

> No dataset redistribution license was independently established in this download task. Consult portal terms and metadata before public redistribution.

This README is a prior local download note, not the authority's legal licence. The 2006 PDF p.8 includes a technical CAD-use statement (line wrapping normalized, quoted verbatim otherwise):

> Inoltre, per un utilizzo finalizzato ad una gestione semplificata in ambiente CAD, si richiede la fornitura dei dati anche nel formato DXF da predisporre con le medesime modalità prevista per gli shape files: un file DXF per ognuna delle classi definite nel presente documento e denominato con il nome della rispettiva classe.

That is a delivery-format requirement, **not a redistribution grant**. PDFs identify Regione del Veneto and the CTR formation law L.R. 16.07.1976 n°28, neither of which substitutes for licence terms. External portal terms were not fetched; the task is a local read-only inventory.

## Inventory appendix A — release-level layer summary

All vector shapefile names, geometry types, summed feature counts and every schema variant are shown here. Appendix B resolves schema IDs to full ordered attribute lists including DBF type/width/precision. Appendix C lists every physical occurrence with exact archive path and member. No absent layer is invented. PolygonZ means a shapefile polygon with a Z array, **not** a watertight solid; Polygon can contain multipart polygons/rings. PolyLineZ is a line primitive, not a building footprint.

### 1987

| Layer name (case-normalized) | Geometry type(s) | Feature records | Physical instances | Complete schemas |
| --- | --- | --- | --- | --- |
| AREE_TER | PolygonZ | 2 | 1 | S062 |
| ASTEVIA | PolyLineZ | 99 | 3 | S060 |
| CAM_FABB | PolyLineZ | 3734 | 19 | S059 |
| CAM_TER | PolyLineZ | 2231 | 1 | S059 |
| CORNICI | PolyLineZ | 606 | 31 | S066 |
| CURVE | PolyLineZ | 171 | 15 | S065 |
| DISCONT | PolyLineZ | 112642 | 28 | S059 |
| ELE_DIV | PolyLineZ | 2115 | 23 | S059 |
| ERR_A | PolygonZ | 12 | 1 | S062 |
| FABBRIC | PolygonZ | 4070 | 31 | S063 |
| FABBR_L | PolyLineZ | 43 | 9 | S057 |
| FABB_OLD | PolygonZ | 33 | 1 | S063 |
| IDROGRAF | PolyLineZ | 28142 | 31 | S059 |
| IDROGR_A | PolygonZ | 1336 | 23 | S062 |
| INFRASTR | PolyLineZ | 365 | 14 | S059 |
| INFRAS_A | PolygonZ | 70 | 15 | S062 |
| INQUADRA | PointZ | 59 | 13 | S001 |
| LIM_AMM | PolyLineZ | 405 | 23 | S059 |
| NODOVIA | PointZ | 132 | 3 | S004 |
| OPERE | PolyLineZ | 54178 | 29 | S059 |
| OPERE_A | PolygonZ | 10 | 7 | S062 |
| PUNTI_Q | PointZ | 39076 | 31 | S005 |
| SIM_CORN | PointZ | 1085 | 30 | S006 |
| SIM_DISC | PointZ | 1065 | 2 | S007 |
| SIM_ELEM | PointZ | 4050 | 21 | S008 |
| SIM_FABB | PointZ | 31 | 10 | S009 |
| SIM_IDRO | PointZ | 1774 | 28 | S011 |
| SIM_INFR | PointZ | 410 | 16 | S012 |
| SIM_OPER | PointZ | 535 | 12 | S013 |
| SIM_VEGE | PointZ | 4297 | 27 | S014 |
| SIM_VIAB | PointZ | 35 | 10 | S015 |
| TESTI | PointZ | 42741 | 31 | S016 |
| VEGETAZ | PolyLineZ | 972 | 18 | S059 |
| VEGET_A | PolygonZ | 437 | 18 | S062 |
| VIABILIT | PolyLineZ | 7658 | 26 | S059 |
| ZONENC | PolyLineZ | 19 | 1 | S059 |

### 1994

| Layer name (case-normalized) | Geometry type(s) | Feature records | Physical instances | Complete schemas |
| --- | --- | --- | --- | --- |
| AREE_TER | PolygonZ | 22 | 13 | S062 |
| ASTEVIA | PolyLineZ | 9236 | 33 | S060 |
| CAM_FABB | PolyLineZ | 358674 | 42 | S059 |
| CAM_TER | PolyLineZ | 16142 | 12 | S059 |
| CORNICI | PolyLineZ | 681 | 45 | S066 |
| CURVE | PolyLineZ | 2384 | 28 | S065 |
| DISCONT | PolyLineZ | 225980 | 42 | S059 |
| ELE_DIV | PolyLineZ | 58505 | 45 | S059 |
| ERR_A | PolygonZ | 20463 | 34 | S062 |
| ERR_L | PolyLineZ | 15 | 4 | S062 |
| ERR_T | PointZ | 33 | 12 | S062 |
| FABBRIC | PolygonZ | 64322 | 45 | S063 |
| FABBR_L | PolyLineZ | 916 | 36 | S057 |
| FABB_OLD | PolygonZ | 1152 | 26 | S063 |
| FERROVIE | PolyLineZ | 1616 | 16 | S059 |
| FERR_A | PolygonZ | 16 | 3 | S059 |
| IDROGRAF | PolyLineZ | 26457 | 45 | S059 |
| IDROGR_A | PolygonZ | 922 | 30 | S062 |
| INFRASTR | PolyLineZ | 16656 | 38 | S059 |
| INFRAS_A | PolygonZ | 2003 | 35 | S062 |
| INQUADRA | PointZ | 42 | 17 | S001 |
| LIM_AMM | PolyLineZ | 544 | 16 | S059 |
| NODOVIA | PointZ | 10137 | 33 | S004 |
| OPERE | PolyLineZ | 24563 | 44 | S059 |
| OPERE_A | PolygonZ | 9 | 2 | S062 |
| PUNTI_Q | PointZ | 43909 | 45 | S005 |
| SIM_CORN | PointZ | 1620 | 45 | S006 |
| SIM_ELEM | PointZ | 56027 | 45 | S008 |
| SIM_FABB | PointZ | 868 | 35 | S009 |
| SIM_FERR | PointZ | 65 | 12 | S010 |
| SIM_IDRO | PointZ | 7298 | 43 | S011 |
| SIM_INFR | PointZ | 3579 | 39 | S012 |
| SIM_OPER | PointZ | 1825 | 36 | S013 |
| SIM_TER | PointZ | 95 | 2 | S015 |
| SIM_VEGE | PointZ | 46775 | 43 | S014 |
| SIM_VIAB | PointZ | 204 | 15 | S015 |
| TESTI | PointZ | 49263 | 45 | S016 |
| VEGETAZ | PolyLineZ | 7613 | 40 | S059 |
| VEGET_A | PolygonZ | 1441 | 30 | S062 |
| VIABILIT | PolyLineZ | 37103 | 43 | S059 |
| ZONENC | PolyLineZ | 18 | 1 | S059 |

### 2005

| Layer name (case-normalized) | Geometry type(s) | Feature records | Physical instances | Complete schemas |
| --- | --- | --- | --- | --- |
| AREE_TER | PolygonZ | 8 | 3 | S062 |
| ASTEFER | PolyLineZ | 90 | 5 | S058 |
| ASTEFLU | PolyLineZ | 1565 | 45 | S064 |
| ASTEVIA | PolyLineZ | 6303 | 30 | S060 |
| CAM_FABB | PolyLineZ | 14405 | 40 | S059 |
| CORNICI | PolyLineZ | 26870 | 46 | S066 |
| CURVE | PolyLineZ | 848 | 13 | S065 |
| DISCONT | PolyLineZ | 46967 | 37 | S059 |
| ELE_DIV | PolyLineZ | 20386 | 39 | S059 |
| ERR_A | PolygonZ | 4 | 1 | S062 |
| ERR_L | PolyLineZ | 3554 | 34 | S062 |
| ERR_S | PointZ | 14149 | 4 | S062 |
| FABBRIC | PolygonZ | 27937 | 40 | S063 |
| FABBR_L | PolyLineZ | 100823 | 34 | S057 |
| FERROVIE | PolyLineZ | 141 | 5 | S059 |
| IDROGRAF | PolyLineZ | 25661 | 46 | S059 |
| IDROGR_A | PolygonZ | 2092 | 46 | S062 |
| INFRASTR | PolyLineZ | 1239 | 29 | S059 |
| INFRAS_A | PolygonZ | 260 | 28 | S062 |
| INQUADRA | PointZ | 79 | 23 | S001 |
| LIMAMM_A | PolygonZ | 104 | 46 | S061 |
| LIM_AMM | PolyLineZ | 682 | 44 | S059 |
| NODOFER | PointZ | 139 | 5 | S002 |
| NODOFLU | PointZ | 2402 | 45 | S003 |
| NODOVIA | PointZ | 14349 | 30 | S004 |
| OPERE | PolyLineZ | 841 | 32 | S059 |
| OPERE_A | PolygonZ | 1 | 1 | S062 |
| PUNTI_Q | PointZ | 78167 | 46 | S005 |
| SIM_CORN | PointZ | 1817 | 46 | S006 |
| SIM_DISC | PointZ | 184313 | 37 | S007 |
| SIM_ELEM | PointZ | 33067 | 38 | S008 |
| SIM_FABB | PointZ | 27429 | 40 | S009 |
| SIM_FERR | PointZ | 2 | 1 | S010 |
| SIM_IDRO | PointZ | 3804 | 39 | S011 |
| SIM_INFR | PointZ | 1596 | 30 | S012 |
| SIM_OPER | PointZ | 1863 | 28 | S013 |
| SIM_VEGE | PointZ | 29288 | 36 | S014 |
| SIM_VIAB | PointZ | 72 | 16 | S015 |
| TESTI | PointZ | 65783 | 46 | S016 |
| VEGETAZ | PolyLineZ | 7641 | 29 | S059 |
| VEGET_A | PolygonZ | 2508 | 33 | S062 |
| VIABILIT | PolyLineZ | 37851 | 36 | S059 |
| VIAB_A | PolygonZ | 8334 | 30 | S059 |

### 2006

| Layer name (case-normalized) | Geometry type(s) | Feature records | Physical instances | Complete schemas |
| --- | --- | --- | --- | --- |
| AATT | PolygonZ | 380 | 1 | S032 |
| AB_CDA | PolygonZ | 1368 | 1 | S033 |
| AC_VEI | PolygonZ | 63575 | 1 | S034 |
| ALVEO | PolygonZ | 2396 | 1 | S035 |
| AR_MAR | PolygonZ | 61 | 1 | S036 |
| AR_STR | PolygonZ | 63076 | 1 | S037 |
| ATTR_SP | PolygonZ | 453 | 1 | S038 |
| BOSCO | PolygonZ | 1168 | 1 | S039 |
| CAN_LAG | PolygonZ | 702 | 1 | S040 |
| CL_AGR | PolygonZ | 5608 | 1 | S041 |
| COMUNE | Polygon | 47 | 1 | S054 |
| EDIFC | PolygonZ | 167939 | 1 | S049 |
| EDI_MIN | PolygonZ | 82164 | 1 | S042 |
| F_NTER | PolygonZ | 41 | 1 | S043 |
| GRAD | PolygonZ | 65 | 1 | S044 |
| MN_EDI | PolygonZ | 6913 | 1 | S050 |
| MN_MAU | PolygonZ | 90 | 1 | S051 |
| OP_POR | PolygonZ | 5 | 1 | S045 |
| PAR_AR | PolygonZ | 166 | 1 | S046 |
| PE_UINS | PolygonZ | 1084 | 1 | S052 |
| PONTE | PolygonZ | 2265 | 1 | S047 |
| PS_INC | PolygonZ | 38 | 1 | S048 |
| SP_ACQ | PolygonZ | 3128 | 1 | S053 |
| SV_FER | PolygonZ | 32 | 1 | S055 |
| SV_STR | PolygonZ | 143 | 1 | S056 |

### 2010

| Layer name (case-normalized) | Geometry type(s) | Feature records | Physical instances | Complete schemas |
| --- | --- | --- | --- | --- |
| AATT | PolygonZ | 45716 | 1 | S067 |
| AB_CDA | PolygonZ | 960 | 1 | S068 |
| AC_CIC | PolygonZ | 714 | 1 | S017 |
| AC_PED | PolygonZ | 16684 | 1 | S069 |
| AC_VEI | PolygonZ | 13966 | 1 | S070 |
| AR_STR | PolygonZ | 10587 | 1 | S071 |
| AR_VMS | PolygonZ | 916 | 1 | S072 |
| AR_VRD | PolygonZ | 26898 | 1 | S073 |
| ATTR_SP | PolygonZ | 589 | 1 | S074 |
| AT_NAV | PolygonZ | 52 | 1 | S075 |
| A_PVEG | PolygonZ | 1 | 1 | S018 |
| A_TRAS | PolygonZ | 359 | 1 | S076 |
| BOSCO | PolygonZ | 278 | 1 | S077 |
| CAN_LAG | PolygonZ | 590 | 1 | S096 |
| CL_AGR | PolygonZ | 8396 | 1 | S078 |
| DIGA | PolygonZ | 6 | 1 | S019 |
| EDIFC | Polygon | 40320 | 1 | S081 |
| EDI_MIN | Polygon | 29477 | 1 | S082 |
| ELE_CP | PolygonZ | 187161 | 1 | S030 |
| FOR_PC | PolygonZ | 32 | 1 | S031 |
| F_NTER | PolygonZ | 142 | 1 | S083 |
| GALLER | PolygonZ | 9 | 1 | S020 |
| GRAD | PolygonZ | 111 | 1 | S021 |
| MAN_TR | PolygonZ | 1294 | 1 | S084 |
| MN_CON | PolygonZ | 1507 | 1 | S085 |
| MN_EDI | PolygonZ | 4265 | 1 | S086 |
| MN_MAU | PolygonZ | 142 | 1 | S022 |
| MU_DIV | PolygonZ | 502 | 1 | S023 |
| MU_SOS | PolygonZ | 1938 | 1 | S087 |
| OP_POR | PolygonZ | 2729 | 1 | S088 |
| OP_REG | PolygonZ | 65 | 1 | S089 |
| PAR_AR | PolygonZ | 4336 | 1 | S024 |
| PE_UINS | PolygonZ | 46 | 1 | S025 |
| PONTE | PolygonZ | 1259 | 1 | S090 |
| PS_INC | PolygonZ | 3177 | 1 | S091 |
| SCARPT | PolygonZ | 10656 | 1 | S079 |
| SD_FER | PolygonZ | 224 | 1 | S092 |
| SP_ACQ | PolygonZ | 617 | 1 | S093 |
| SV_AER | PolygonZ | 1 | 1 | S026 |
| SV_FER | Polygon | 298 | 1 | S027 |
| SV_POR | PolygonZ | 9 | 1 | S029 |
| SV_STR | PolygonZ | 111 | 1 | S028 |
| TP_STR | Polygon | 10587 | 1 | S080 |
| TRALIC | PolygonZ | 748 | 1 | S094 |
| UN_VOL | PolygonZ | 181113 | 1 | S095 |

## Inventory appendix B — full ordered schemas

DBF notation: C=character string; N=numeric; D=date; L=logical. `FIELD:TYPE(width,decimals)` is the literal DBF descriptor, not an inferred semantic type. Fields not listed are absent. Geometry and positional FID are not DBF attributes. Repeated schema IDs apply only to byte-identical ordered field descriptors.

### S001

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `INQUADRA_:N(11,0)`, `INQUADRA_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `QUOTA:N(20,2)`, `N_MONOGR:C(20,0)`, `N_LOTTO:C(20,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S002

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `NODOFER_:N(11,0)`, `NODOFER_ID:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S003

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `NODOFLU_:N(11,0)`, `NODOFLU_ID:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S004

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `NODOVIA_:N(11,0)`, `NODOVIA_ID:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S005

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `PUNTI_Q_:N(11,0)`, `PUNTI_Q_ID:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `QUOTA:N(20,2)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S006

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_CORN_:N(11,0)`, `SIM_CORN_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S007

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_DISC_:N(11,0)`, `SIM_DISC_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S008

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_ELEM_:N(11,0)`, `SIM_ELEM_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S009

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_FABB_:N(11,0)`, `SIM_FABB_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S010

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_FERR_:N(11,0)`, `SIM_FERR_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S011

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_IDRO_:N(11,0)`, `SIM_IDRO_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S012

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_INFR_:N(11,0)`, `SIM_INFR_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S013

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_OPER_:N(11,0)`, `SIM_OPER_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S014

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_VEGE_:N(11,0)`, `SIM_VEGE_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S015

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `SIM_VIAB_:N(11,0)`, `SIM_VIAB_I:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `NOME:C(60,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S016

`AREA:N(20,5)`, `PERIMETER:N(20,5)`, `TESTI_:N(11,0)`, `TESTI_ID:N(11,0)`, `NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `TESTO:C(80,0)`, `ANG_ROT:N(20,2)`, `FUS_ORIG:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S017

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AC_CIC_POS:C(8,0)`, `AC_CIC_FON:C(8,0)`, `AC_CIC_SED:C(8,0)`, `AC_CIC_LIV:C(8,0)`, `AC_CIC_CON:C(8,0)`

### S018

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `A_PVEG_CAU:C(8,0)`, `A_PVEG_LIM:C(8,0)`

### S019

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `DIGA_TY:C(8,0)`, `DIGA_MAT:C(8,0)`, `DIGA_CT:C(8,0)`, `DIGA_ZONA:C(8,0)`, `DIGA_CONT:C(8,0)`, `DIGA_SE_QE:N(31,15)`, `DIGA_SE_EX:C(8,0)`, `DIGA_SI_QE:N(31,15)`, `DIGA_SI_EX:C(8,0)`, `DIGA_CR_QE:N(31,15)`, `DIGA_CR_EX:C(8,0)`

### S020

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `GALLER_USO:C(8,0)`, `GALLER_TY:C(8,0)`, `GALLER_CON:C(8,0)`, `GALLER_ALT:N(31,15)`

### S021

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `GRAD_QE:N(31,15)`, `GRAD_EX:C(8,0)`, `GRAD_CONT:C(8,0)`

### S022

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `MN_MAU_TY:C(8,0)`, `MN_MAU_QE:N(31,15)`, `MN_MAU_EX:C(8,0)`, `MN_MAU_SZQ:N(31,15)`, `MN_MAU_SZE:C(8,0)`, `MN_MAU_CPQ:N(31,15)`, `MN_MAU_CPE:C(8,0)`, `MN_MAU_CON:C(8,0)`, `MN_MAU_QB:N(31,15)`, `MN_MAU_QG:N(31,15)`

### S023

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `MU_DIV_TY:C(8,0)`, `MU_DIV_QE:N(31,15)`, `MU_DIV_EX:C(8,0)`, `MU_DIV_SZQ:N(31,15)`, `MU_DIV_SZE:C(8,0)`, `MU_DIV_CPQ:N(31,15)`, `MU_DIV_CPE:C(8,0)`, `MU_DIV_CON:C(8,0)`

### S024

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `PAR_AR_TY:C(8,0)`, `PAR_AR_QE:N(31,15)`, `PAR_AR_EX:C(8,0)`, `PAR_AR_CON:C(8,0)`

### S025

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `PE_UINS_TY:C(8,0)`, `PE_UINS_NO:C(50,0)`, `PE_UINS_PA:C(8,0)`

### S026

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `SV_AER_NOM:C(50,0)`, `SV_AER_USO:C(8,0)`, `SV_AER_TY:C(8,0)`

### S027

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `SV_FER_NOM:C(50,0)`, `SV_FER_FUN:C(8,0)`, `SV_FER_INF:C(8,0)`

### S028

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `SV_STR_NOM:C(50,0)`, `SV_STR_TY:C(8,0)`

### S029

`DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(50,0)`, `ORIGINE:C(50,0)`, `SV_POR_NOM:C(50,0)`, `SV_POR_TY:C(50,0)`, `SV_POR_USO:C(50,0)`, `SCALA:C(50,0)`

### S030

`ELE_CP_TY:C(8,0)`, `ELE_CP_QE:C(8,0)`, `ELE_CP_EX:C(8,0)`, `ELE_CP_CON:C(8,0)`, `DATA_CRE:C(20,0)`, `DATA_MOD:C(20,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `CODICE:C(8,0)`, `SCALA:C(2,0)`

### S031

`FOR_PC_TY:C(50,0)`, `FOR_PC_SOV:C(50,0)`, `FOR_PC_LIM:C(50,0)`, `DATA_CRE:C(8,0)`, `DATA_MOD:C(8,0)`, `SCALA:C(50,0)`, `ORIGINE:C(50,0)`, `CODICE:C(50,0)`, `TIPO_MOD:C(50,0)`

### S032

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `AATT_TY:C(2,0)`, `AATT_CONT:C(2,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S033

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `AB_CDA_SED:C(2,0)`, `AB_CDA_LIV:C(1,0)`, `AB_CDA_SPO:C(1,0)`, `AB_CDA_TY:C(2,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S034

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `AC_VEI_ZON:C(4,0)`, `AC_VEI_FON:C(2,0)`, `AC_VEI_SED:C(2,0)`, `AC_VEI_LIV:C(2,0)`, `AC_VEI_CON:C(2,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S035

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `ALVEO_REG:C(2,0)`, `ALVEO_AQTY:C(1,0)`, `ALVEO_LIM:C(1,0)`, `ID_CNCA:C(2,0)`, `ALVEO_NOM:C(44,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S036

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `AR_MAR_TY:C(1,0)`, `AR_MAR_NOM:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S037

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `AR_STR_CF:C(2,0)`, `AR_STR_STA:C(2,0)`, `AR_STR_SED:C(2,0)`, `AR_STR_LIV:C(2,0)`, `AR_STR_CON:C(2,0)`, `ID_PERC:C(1,0)`, `AR_STR_NOM:C(46,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S038

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `ATTR_SP_TY:C(2,0)`, `ATTR_SP_QE:N(33,16)`, `ATTR_SP_EX:C(1,0)`, `ATTR_SP_CO:C(2,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S039

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `BOSCO_TY:C(2,0)`, `BOSCO_ESSZ:C(4,0)`, `BOSCO_GOV:C(2,0)`, `BOSCO_LIM:C(2,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S040

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CAN_LAG_TY:C(2,0)`, `CAN_LAG_NO:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S041

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CL_AGR_TY:C(2,0)`, `CL_AGR_LIM:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S042

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `EDI_MIN_TY:C(2,0)`, `EDI_MIN_PR:C(2,0)`, `EDI_MIN_ST:C(2,0)`, `EDI_MIN_CO:C(2,0)`, `EDI_MIN_QB:N(33,16)`, `EDI_MIN_QG:N(33,16)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S043

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `F_NTER_TY:C(2,0)`, `F_NTER_LIM:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S044

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `GRAD_QE:N(33,16)`, `GRAD_EX:C(2,0)`, `GRAD_CONT:C(2,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S045

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `OP_POR_TY:C(2,0)`, `OP_POR_ZON:C(1,0)`, `OP_POR_CON:C(1,0)`, `OPPR_ST_QE:N(33,16)`, `OPPR_ST_EX:C(1,0)`, `OPPR_CR_QE:N(33,16)`, `OPPR_CR_EX:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S046

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `PAR_AR_TY:C(2,0)`, `PAR_AR_QE:N(33,16)`, `PAR_AR_EX:C(1,0)`, `PAR_AR_CON:C(2,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S047

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `PONTE_MAT:C(2,0)`, `PONTE_USO:C(2,0)`, `PONTE_STRU:C(2,0)`, `PONTE_VIE:C(2,0)`, `PONTE_CP:C(2,0)`, `PONTE_LL:N(33,16)`, `PONTE_TY:C(2,0)`, `PONTE_LIV:C(2,0)`, `PONTE_CONT:C(2,0)`, `PONTE_SEQE:N(33,16)`, `PONTE_SEEX:C(2,0)`, `PONTE_SPQE:N(33,16)`, `PONTE_SPEX:C(2,0)`, `PONTE_SOQE:N(33,16)`, `PONTE_SOEX:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S048

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `PS_INC_TY:C(2,0)`, `PS_INC_LIM:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S049

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(5,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `EDIFC_TY:C(2,0)`, `EDIFC_USO:C(6,0)`, `EDIFC_SOT:C(2,0)`, `EDIFC_STAT:C(2,0)`, `EDIFC_PORZ:C(2,0)`, `EDIFC_CONT:C(2,0)`, `EDIFC_NOM:C(1,0)`, `EDIFC_QBAS:N(33,16)`, `EDIFC_QGRO:N(33,16)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S050

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(5,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `MN_EDI_TY:C(6,0)`, `MN_EDI_QE:N(33,16)`, `MN_EDI_EX:C(1,0)`, `MN_EDI_SZQ:N(33,16)`, `MN_EDI_SZE:C(1,0)`, `MN_EDI_CPQ:N(33,16)`, `MN_EDI_CPE:C(1,0)`, `MN_EDI_CON:C(1,0)`, `MN_EDI_QB:N(33,16)`, `MN_EDI_QG:N(33,16)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S051

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(5,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `MN_MAU_TY:C(2,0)`, `MN_MAU_QE:N(33,16)`, `MN_MAU_EX:C(1,0)`, `MN_MAU_SZQ:N(33,16)`, `MN_MAU_SZE:C(1,0)`, `MN_MAU_CPQ:N(33,16)`, `MN_MAU_CPE:C(1,0)`, `MN_MAU_CON:C(1,0)`, `MN_MAU_QB:N(33,16)`, `MN_MAU_QG:N(33,16)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S052

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(5,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `PE_UINS_TY:C(4,0)`, `PE_UINS_NO:C(1,0)`, `PE_UNIS_PA:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S053

`ID:N(11,0)`, `OBJECTID:N(33,16)`, `LIVCOD:C(5,0)`, `DATA_CRE:N(33,16)`, `DATA_MOD:N(33,16)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `SP_ACQ_TY:C(2,0)`, `SP_ACQ_UID:C(1,0)`, `SP_ACQ_NOM:C(1,0)`, `SP_ACQ_QA:N(33,16)`, `SP_ACQ_SPO:C(1,0)`, `SP_ACQ_ACQ:C(1,0)`, `GEOMETRY_S:C(6,0)`, `GID:N(33,16)`

### S054

`Id:N(11,0)`, `OBJECTID:N(11,0)`, `LIVCOD:C(4,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `COMUNE_IST:C(6,0)`, `COMUNE_NOM:C(29,0)`, `COMUNE_TLI:C(1,0)`, `Geometry_S:C(2,0)`, `GID:N(11,0)`

### S055

`Id:N(11,0)`, `OBJECTID:N(11,0)`, `LIVCOD:C(5,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `SV_FER_NOM:C(1,0)`, `SV_FER_INF:C(2,0)`, `SV_FER_FUN:C(1,0)`, `Geometry_S:C(6,0)`, `GID:N(11,0)`

### S056

`Id:N(11,0)`, `OBJECTID:N(11,0)`, `LIVCOD:C(5,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `SV_STR_NOM:C(1,0)`, `SV_STR_TY:C(2,0)`, `Geometry_S:C(6,0)`, `GID:N(11,0)`

### S057

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S058

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `NOME:C(60,0)`, `BINARI:N(6,0)`, `SEDE:C(1,0)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S059

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `NOME:C(60,0)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S060

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `NOME:C(60,0)`, `RANGO:C(1,0)`, `SEDE:C(1,0)`, `LARGHEZZ:N(4,1)`, `ALTEZZA:N(4,1)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S061

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `NOME:C(60,0)`, `SUPERFIC:N(15,2)`, `PERIMETR:N(15,2)`, `CODISTAT:C(10,0)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S062

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `NOME:C(60,0)`, `SUPERFIC:N(15,2)`, `PERIMETR:N(15,2)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S063

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `NOME:C(60,0)`, `SUPERFIC:N(15,2)`, `PERIMETR:N(15,2)`, `QUOTABAS:N(5,1)`, `QUOTAGRO:N(5,1)`, `QUOTACOL:N(5,1)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S064

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `NOME:C(60,0)`, `TIPO:C(1,0)`, `MOD_SCOR:C(1,0)`, `LARGHEZZ:N(5,1)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S065

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FLG_CONT:N(6,0)`, `QUOTA:N(15,2)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S066

`NUMERO:N(11,0)`, `NUME_E_S:C(6,0)`, `DESCRZ:C(60,0)`, `LIVCOD:C(20,0)`, `COD_FACC:C(10,0)`, `ATT_FACC:C(10,0)`, `DATA_CRE:N(11,0)`, `DATA_MOD:N(11,0)`, `TIPO_MOD:N(6,0)`, `FUS_ORIG:C(1,0)`, `COD_VIS:C(1,0)`, `COD_LOT:C(2,0)`, `ORIGINE:N(1,0)`

### S067

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AATT_TY:C(8,0)`, `AATT_CONT:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S068

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AB_CDA_SED:C(8,0)`, `AB_CDA_LIV:C(8,0)`, `AB_CDA_SPO:C(8,0)`, `AB_CDA_TY:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S069

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AC_PED_POS:C(8,0)`, `AC_PED_ZON:C(8,0)`, `AC_PED_FON:C(8,0)`, `AC_PED_SED:C(8,0)`, `AC_PED_LIV:C(8,0)`, `AC_PED_CON:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S070

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AC_VEI_ZON:C(8,0)`, `AC_VEI_FON:C(8,0)`, `AC_VEI_SED:C(8,0)`, `AC_VEI_LIV:C(8,0)`, `AC_VEI_CON:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S071

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AR_STR_CF:C(8,0)`, `AR_STR_STA:C(8,0)`, `AR_STR_SED:C(8,0)`, `AR_STR_LIV:C(8,0)`, `AR_STR_CON:C(8,0)`, `AR_STR_NOM:C(50,0)`, `AR_STR_CL:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S072

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AR_VMS_TY:C(8,0)`, `AR_VMS_SED:C(8,0)`, `AR_VMS_LIV:C(8,0)`, `AR_VMS_CON:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S073

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AR_VRD_TY:C(8,0)`, `AR_VRD_CON:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S074

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `ATTR_SP_TY:C(8,0)`, `ATTR_SP_QE:N(31,15)`, `ATTR_SP_EX:C(8,0)`, `ATTR_SP_CO:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S075

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `AT_NAV_TY:C(8,0)`, `AT_NAV_QE:N(31,15)`, `AT_NAV_EX:C(8,0)`, `AT_NAV_CON:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S076

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `A_TRAS_TY:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S077

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `BOSCO_TY:C(8,0)`, `BOSCO_ESSZ:C(8,0)`, `BOSCO_GOV:C(8,0)`, `BOSCO_LIM:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S078

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `CL_AGR_TY:C(8,0)`, `CL_AGR_LIM:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S079

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`, `SCARPT_CON:C(8,0)`, `SCARPT_TY:C(8,0)`

### S080

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`, `TP_STR_COD:C(50,0)`, `TP_STR_NOM:C(100,0)`, `TP_STR_TOP:C(8,0)`, `TP_STR_LOC:C(50,0)`

### S081

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `EDIFC_TY:C(8,0)`, `EDIFC_USO:C(8,0)`, `EDIFC_SOT:C(8,0)`, `EDIFC_STAT:C(8,0)`, `EDIFC_PORZ:C(8,0)`, `EDIFC_CONT:C(8,0)`, `EDIFC_NOM:C(50,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S082

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `EDI_MIN_TY:C(8,0)`, `EDI_MIN_PR:C(8,0)`, `EDI_MIN_ST:C(8,0)`, `EDI_MIN_CO:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S083

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `F_NTER_TY:C(8,0)`, `F_NTER_LIM:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S084

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `MAN_TR_TY:C(8,0)`, `MAN_TR_QE:N(31,15)`, `MAN_TR_EX:C(8,0)`, `MAN_TR_CON:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S085

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `MN_CON_TY:C(8,0)`, `MN_CON_SED:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S086

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `MN_EDI_TY:C(8,0)`, `MN_EDI_QE:C(254,0)`, `MN_EDI_EX:C(8,0)`, `MN_EDI_SZQ:C(254,0)`, `MN_EDI_SZE:C(8,0)`, `MN_EDI_CPQ:C(254,0)`, `MN_EDI_CPE:C(8,0)`, `MN_EDI_CON:C(8,0)`, `MN_EDI_QB:N(31,15)`, `MN_EDI_QG:N(31,15)`, `DATA_CRE:C(8,0)`, `DATA_MOD:C(8,0)`

### S087

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `MU_SOS_TY:C(8,0)`, `MU_SOS_ZON:C(8,0)`, `MU_SOS_CON:C(8,0)`, `MUOS_SE_QE:N(31,15)`, `MUOS_SE_EX:C(8,0)`, `MUOS_SI_QE:N(31,15)`, `MUOS_SI_EX:C(8,0)`, `MUOS_CR_QE:N(31,15)`, `MUOS_CR_EX:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S088

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `OP_POR_TY:C(8,0)`, `OP_POR_ZON:C(8,0)`, `OP_POR_CON:C(8,0)`, `OPPR_ST_QE:N(31,15)`, `OPPR_ST_EX:C(8,0)`, `OPPR_CR_QE:N(31,15)`, `OPPR_CR_EX:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S089

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `OP_REG_TY:C(8,0)`, `OP_REG_AFF:C(8,0)`, `OP_REG_CON:C(8,0)`, `OP_REG_QE:N(31,15)`, `OP_REG_EX:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S090

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `PONTE_MAT:C(8,0)`, `PONTE_USO:C(8,0)`, `PONTE_STRU:C(8,0)`, `PONTE_VIE:C(8,0)`, `PONTE_CP:C(8,0)`, `PONTE_LL:N(31,15)`, `PONTE_TY:C(8,0)`, `PONTE_LIV:C(8,0)`, `PONTE_CONT:C(8,0)`, `PONTE_SEQE:N(31,15)`, `PONTE_SEEX:C(8,0)`, `PONTE_SPQE:N(31,15)`, `PONTE_SPEX:C(8,0)`, `PONTE_SOQE:N(31,15)`, `PONTE_SOEX:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S091

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `PS_INC_TY:C(8,0)`, `PS_INC_LIM:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S092

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `SD_FER_TY:C(8,0)`, `SD_FER_FON:C(8,0)`, `SD_FER_SED:C(8,0)`, `SD_FER_LIV:C(8,0)`, `SD_FER_CON:C(8,0)`, `SD_FER_NOM:C(50,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S093

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `SP_ACQ_TY:C(8,0)`, `SP_ACQ_UID:C(8,0)`, `SP_ACQ_NOM:C(8,0)`, `SP_ACQ_QA:N(31,15)`, `SP_ACQ_SPO:C(8,0)`, `SP_ACQ_ACQ:C(8,0)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S094

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `TRALIC_TY:C(8,0)`, `TRALIC_IMP:C(8,0)`, `TRALIC_QSO:N(31,15)`, `TRAL_QC_MX:N(31,15)`, `TRAL_QC_MN:N(31,15)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S095

`TIPO_MOD:C(2,0)`, `ORIGINE:C(2,0)`, `SCALA:C(2,0)`, `CODICE:C(8,0)`, `UN_VOL_AV:N(31,15)`, `UN_VOL_POR:C(8,0)`, `UN_VOL_QE:N(31,15)`, `UN_VOL_EX:C(8,0)`, `UN_VOL_QB:N(31,15)`, `UN_VOL_QG:N(31,15)`, `DATA_MOD:C(8,0)`, `DATA_CRE:C(8,0)`

### S096

`TIPO_MOD:C(50,0)`, `ORIGINE:C(50,0)`, `SCALA:C(50,0)`, `CODICE:C(8,0)`, `CAN_LAG_TY:C(50,0)`, `DATA_CRE:C(8,0)`, `DATA_MOD:C(8,0)`

## Inventory appendix C — every physical shapefile

An archive-member location written `absolute ZIP path::member` identifies data stored inside the ZIP, not an unpacked file. Each heading supplies the exact absolute ZIP path; combining it with its member column is the full logical location. Counts include all SHX/DBF records. Every count was reconciled programmatically.

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128022.zip`

Release 1987; 606647 bytes; 83 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128022o/CAM_FABB.shp | PolyLineZ | 50 | S059 |
| 128022o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 128022o/CURVE.shp | PolyLineZ | 3 | S065 |
| 128022o/DISCONT.shp | PolyLineZ | 5130 | S059 |
| 128022o/ELE_DIV.shp | PolyLineZ | 31 | S059 |
| 128022o/FABBRIC.shp | PolygonZ | 79 | S063 |
| 128022o/FABBR_L.shp | PolyLineZ | 6 | S057 |
| 128022o/IDROGRAF.shp | PolyLineZ | 1275 | S059 |
| 128022o/IDROGR_A.shp | PolygonZ | 27 | S062 |
| 128022o/INFRASTR.shp | PolyLineZ | 32 | S059 |
| 128022o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 128022o/INQUADRA.shp | PointZ | 4 | S001 |
| 128022o/LIM_AMM.shp | PolyLineZ | 45 | S059 |
| 128022o/OPERE.shp | PolyLineZ | 2494 | S059 |
| 128022o/OPERE_A.shp | PolygonZ | 1 | S062 |
| 128022o/PUNTI_Q.shp | PointZ | 1136 | S005 |
| 128022o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128022o/SIM_ELEM.shp | PointZ | 47 | S008 |
| 128022o/SIM_IDRO.shp | PointZ | 16 | S011 |
| 128022o/SIM_INFR.shp | PointZ | 32 | S012 |
| 128022o/SIM_VEGE.shp | PointZ | 76 | S014 |
| 128022o/SIM_VIAB.shp | PointZ | 3 | S015 |
| 128022o/testi.shp | PointZ | 1279 | S016 |
| 128022o/VEGETAZ.shp | PolyLineZ | 9 | S059 |
| 128022o/VEGET_A.shp | PolygonZ | 5 | S062 |
| 128022o/VIABILIT.shp | PolyLineZ | 217 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128023.zip`

Release 1987; 862888 bytes; 86 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128023o/CAM_FABB.shp | PolyLineZ | 106 | S059 |
| 128023o/CORNICI.shp | PolyLineZ | 19 | S066 |
| 128023o/DISCONT.shp | PolyLineZ | 13718 | S059 |
| 128023o/ELE_DIV.shp | PolyLineZ | 366 | S059 |
| 128023o/FABBRIC.shp | PolygonZ | 383 | S063 |
| 128023o/FABBR_L.shp | PolyLineZ | 4 | S057 |
| 128023o/IDROGRAF.shp | PolyLineZ | 1772 | S059 |
| 128023o/IDROGR_A.shp | PolygonZ | 135 | S062 |
| 128023o/INFRASTR.shp | PolyLineZ | 55 | S059 |
| 128023o/INFRAS_A.shp | PolygonZ | 12 | S062 |
| 128023o/INQUADRA.shp | PointZ | 9 | S001 |
| 128023o/LIM_AMM.shp | PolyLineZ | 24 | S059 |
| 128023o/OPERE.shp | PolyLineZ | 1399 | S059 |
| 128023o/PUNTI_Q.shp | PointZ | 842 | S005 |
| 128023o/SIM_CORN.shp | PointZ | 38 | S006 |
| 128023o/SIM_ELEM.shp | PointZ | 548 | S008 |
| 128023o/SIM_FABB.shp | PointZ | 4 | S009 |
| 128023o/SIM_IDRO.shp | PointZ | 58 | S011 |
| 128023o/SIM_INFR.shp | PointZ | 61 | S012 |
| 128023o/SIM_OPER.shp | PointZ | 14 | S013 |
| 128023o/SIM_VEGE.shp | PointZ | 386 | S014 |
| 128023o/SIM_VIAB.shp | PointZ | 4 | S015 |
| 128023o/testi.shp | PointZ | 1025 | S016 |
| 128023o/VEGETAZ.shp | PolyLineZ | 21 | S059 |
| 128023o/VEGET_A.shp | PolygonZ | 18 | S062 |
| 128023o/VIABILIT.shp | PolyLineZ | 852 | S059 |
| 128023o/ZONENC.shp | PolyLineZ | 19 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128031.zip`

Release 1987; 849226 bytes; 86 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128031o/CAM_FABB.shp | PolyLineZ | 424 | S059 |
| 128031o/CORNICI.shp | PolyLineZ | 18 | S066 |
| 128031o/CURVE.shp | PolyLineZ | 9 | S065 |
| 128031o/DISCONT.shp | PolyLineZ | 9374 | S059 |
| 128031o/ELE_DIV.shp | PolyLineZ | 314 | S059 |
| 128031o/FABBRIC.shp | PolygonZ | 796 | S063 |
| 128031o/FABBR_L.shp | PolyLineZ | 4 | S057 |
| 128031o/IDROGRAF.shp | PolyLineZ | 2090 | S059 |
| 128031o/IDROGR_A.shp | PolygonZ | 166 | S062 |
| 128031o/INFRASTR.shp | PolyLineZ | 35 | S059 |
| 128031o/INFRAS_A.shp | PolygonZ | 10 | S062 |
| 128031o/INQUADRA.shp | PointZ | 7 | S001 |
| 128031o/LIM_AMM.shp | PolyLineZ | 26 | S059 |
| 128031o/OPERE.shp | PolyLineZ | 1740 | S059 |
| 128031o/PUNTI_Q.shp | PointZ | 819 | S005 |
| 128031o/SIM_CORN.shp | PointZ | 37 | S006 |
| 128031o/SIM_ELEM.shp | PointZ | 527 | S008 |
| 128031o/SIM_FABB.shp | PointZ | 8 | S009 |
| 128031o/SIM_IDRO.shp | PointZ | 22 | S011 |
| 128031o/SIM_INFR.shp | PointZ | 42 | S012 |
| 128031o/SIM_OPER.shp | PointZ | 2 | S013 |
| 128031o/SIM_VEGE.shp | PointZ | 739 | S014 |
| 128031o/SIM_VIAB.shp | PointZ | 2 | S015 |
| 128031o/testi.shp | PointZ | 994 | S016 |
| 128031o/VEGETAZ.shp | PolyLineZ | 280 | S059 |
| 128031o/VEGET_A.shp | PolygonZ | 46 | S062 |
| 128031o/VIABILIT.shp | PolyLineZ | 1237 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128032.zip`

Release 1987; 752944 bytes; 80 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128032o/CAM_FABB.shp | PolyLineZ | 43 | S059 |
| 128032o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128032o/CURVE.shp | PolyLineZ | 20 | S065 |
| 128032o/DISCONT.shp | PolyLineZ | 5769 | S059 |
| 128032o/ELE_DIV.shp | PolyLineZ | 38 | S059 |
| 128032o/FABBRIC.shp | PolygonZ | 136 | S063 |
| 128032o/FABBR_L.shp | PolyLineZ | 2 | S057 |
| 128032o/IDROGRAF.shp | PolyLineZ | 1692 | S059 |
| 128032o/IDROGR_A.shp | PolygonZ | 54 | S062 |
| 128032o/INFRASTR.shp | PolyLineZ | 27 | S059 |
| 128032o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 128032o/INQUADRA.shp | PointZ | 5 | S001 |
| 128032o/LIM_AMM.shp | PolyLineZ | 42 | S059 |
| 128032o/OPERE.shp | PolyLineZ | 5338 | S059 |
| 128032o/PUNTI_Q.shp | PointZ | 1109 | S005 |
| 128032o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128032o/SIM_ELEM.shp | PointZ | 74 | S008 |
| 128032o/SIM_IDRO.shp | PointZ | 10 | S011 |
| 128032o/SIM_INFR.shp | PointZ | 28 | S012 |
| 128032o/SIM_VEGE.shp | PointZ | 273 | S014 |
| 128032o/SIM_VIAB.shp | PointZ | 3 | S015 |
| 128032o/testi.shp | PointZ | 1277 | S016 |
| 128032o/VEGETAZ.shp | PolyLineZ | 33 | S059 |
| 128032o/VEGET_A.shp | PolygonZ | 32 | S062 |
| 128032o/VIABILIT.shp | PolyLineZ | 389 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128033.zip`

Release 1987; 597060 bytes; 80 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128033o/CAM_FABB.shp | PolyLineZ | 23 | S059 |
| 128033o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128033o/CURVE.shp | PolyLineZ | 5 | S065 |
| 128033o/DISCONT.shp | PolyLineZ | 1458 | S059 |
| 128033o/ELE_DIV.shp | PolyLineZ | 10 | S059 |
| 128033o/FABBRIC.shp | PolygonZ | 42 | S063 |
| 128033o/IDROGRAF.shp | PolyLineZ | 1412 | S059 |
| 128033o/IDROGR_A.shp | PolygonZ | 24 | S062 |
| 128033o/INFRASTR.shp | PolyLineZ | 11 | S059 |
| 128033o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 128033o/INQUADRA.shp | PointZ | 2 | S001 |
| 128033o/LIM_AMM.shp | PolyLineZ | 19 | S059 |
| 128033o/OPERE.shp | PolyLineZ | 3940 | S059 |
| 128033o/PUNTI_Q.shp | PointZ | 1319 | S005 |
| 128033o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128033o/SIM_ELEM.shp | PointZ | 15 | S008 |
| 128033o/SIM_IDRO.shp | PointZ | 5 | S011 |
| 128033o/SIM_INFR.shp | PointZ | 10 | S012 |
| 128033o/SIM_OPER.shp | PointZ | 70 | S013 |
| 128033o/SIM_VEGE.shp | PointZ | 52 | S014 |
| 128033o/SIM_VIAB.shp | PointZ | 2 | S015 |
| 128033o/testi.shp | PointZ | 1473 | S016 |
| 128033o/VEGETAZ.shp | PolyLineZ | 6 | S059 |
| 128033o/VEGET_A.shp | PolygonZ | 2 | S062 |
| 128033o/VIABILIT.shp | PolyLineZ | 74 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128034.zip`

Release 1987; 578087 bytes; 86 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128034o/CAM_FABB.shp | PolyLineZ | 208 | S059 |
| 128034o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128034o/CURVE.shp | PolyLineZ | 2 | S065 |
| 128034o/DISCONT.shp | PolyLineZ | 7811 | S059 |
| 128034o/ELE_DIV.shp | PolyLineZ | 202 | S059 |
| 128034o/FABBRIC.shp | PolygonZ | 461 | S063 |
| 128034o/FABBR_L.shp | PolyLineZ | 3 | S057 |
| 128034o/IDROGRAF.shp | PolyLineZ | 1439 | S059 |
| 128034o/IDROGR_A.shp | PolygonZ | 57 | S062 |
| 128034o/INFRASTR.shp | PolyLineZ | 30 | S059 |
| 128034o/INFRAS_A.shp | PolygonZ | 7 | S062 |
| 128034o/INQUADRA.shp | PointZ | 7 | S001 |
| 128034o/LIM_AMM.shp | PolyLineZ | 7 | S059 |
| 128034o/OPERE.shp | PolyLineZ | 162 | S059 |
| 128034o/PUNTI_Q.shp | PointZ | 720 | S005 |
| 128034o/SIM_CORN.shp | PointZ | 37 | S006 |
| 128034o/SIM_ELEM.shp | PointZ | 323 | S008 |
| 128034o/SIM_FABB.shp | PointZ | 2 | S009 |
| 128034o/SIM_IDRO.shp | PointZ | 28 | S011 |
| 128034o/SIM_INFR.shp | PointZ | 31 | S012 |
| 128034o/SIM_OPER.shp | PointZ | 64 | S013 |
| 128034o/SIM_VEGE.shp | PointZ | 326 | S014 |
| 128034o/SIM_VIAB.shp | PointZ | 1 | S015 |
| 128034o/testi.shp | PointZ | 865 | S016 |
| 128034o/VEGETAZ.shp | PolyLineZ | 120 | S059 |
| 128034o/VEGET_A.shp | PolygonZ | 67 | S062 |
| 128034o/VIABILIT.shp | PolyLineZ | 858 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128051.zip`

Release 1987; 967718 bytes; 83 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128051o/CAM_FABB.shp | PolyLineZ | 97 | S059 |
| 128051o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128051o/DISCONT.shp | PolyLineZ | 12750 | S059 |
| 128051o/ELE_DIV.shp | PolyLineZ | 67 | S059 |
| 128051o/FABBRIC.shp | PolygonZ | 194 | S063 |
| 128051o/FABBR_L.shp | PolyLineZ | 2 | S057 |
| 128051o/IDROGRAF.shp | PolyLineZ | 1795 | S059 |
| 128051o/IDROGR_A.shp | PolygonZ | 143 | S062 |
| 128051o/INFRASTR.shp | PolyLineZ | 27 | S059 |
| 128051o/INFRAS_A.shp | PolygonZ | 6 | S062 |
| 128051o/INQUADRA.shp | PointZ | 5 | S001 |
| 128051o/LIM_AMM.shp | PolyLineZ | 44 | S059 |
| 128051o/OPERE.shp | PolyLineZ | 5120 | S059 |
| 128051o/PUNTI_Q.shp | PointZ | 776 | S005 |
| 128051o/SIM_CORN.shp | PointZ | 34 | S006 |
| 128051o/SIM_ELEM.shp | PointZ | 310 | S008 |
| 128051o/SIM_FABB.shp | PointZ | 2 | S009 |
| 128051o/SIM_IDRO.shp | PointZ | 14 | S011 |
| 128051o/SIM_INFR.shp | PointZ | 31 | S012 |
| 128051o/SIM_OPER.shp | PointZ | 34 | S013 |
| 128051o/SIM_VEGE.shp | PointZ | 250 | S014 |
| 128051o/SIM_VIAB.shp | PointZ | 4 | S015 |
| 128051o/testi.shp | PointZ | 936 | S016 |
| 128051o/VEGETAZ.shp | PolyLineZ | 14 | S059 |
| 128051o/VEGET_A.shp | PolygonZ | 13 | S062 |
| 128051o/VIABILIT.shp | PolyLineZ | 562 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128052.zip`

Release 1987; 499148 bytes; 62 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128052o/CAM_FABB.shp | PolyLineZ | 77 | S059 |
| 128052o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128052o/CURVE.shp | PolyLineZ | 6 | S065 |
| 128052o/DISCONT.shp | PolyLineZ | 1915 | S059 |
| 128052o/ELE_DIV.shp | PolyLineZ | 8 | S059 |
| 128052o/FABBRIC.shp | PolygonZ | 85 | S063 |
| 128052o/IDROGRAF.shp | PolyLineZ | 1456 | S059 |
| 128052o/IDROGR_A.shp | PolygonZ | 74 | S062 |
| 128052o/INFRASTR.shp | PolyLineZ | 2 | S059 |
| 128052o/OPERE.shp | PolyLineZ | 823 | S059 |
| 128052o/PUNTI_Q.shp | PointZ | 1261 | S005 |
| 128052o/SIM_CORN.shp | PointZ | 37 | S006 |
| 128052o/SIM_ELEM.shp | PointZ | 4 | S008 |
| 128052o/SIM_IDRO.shp | PointZ | 102 | S011 |
| 128052o/SIM_INFR.shp | PointZ | 7 | S012 |
| 128052o/SIM_VEGE.shp | PointZ | 23 | S014 |
| 128052o/testi.shp | PointZ | 1400 | S016 |
| 128052o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 128052o/VIABILIT.shp | PolyLineZ | 82 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128053.zip`

Release 1987; 711114 bytes; 89 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128053o/ASTEVIA.shp | PolyLineZ | 95 | S060 |
| 128053o/CAM_FABB.shp | PolyLineZ | 1953 | S059 |
| 128053o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128053o/DISCONT.shp | PolyLineZ | 6629 | S059 |
| 128053o/ELE_DIV.shp | PolyLineZ | 461 | S059 |
| 128053o/err_a.shp | PolygonZ | 12 | S062 |
| 128053o/FABBRIC.shp | PolygonZ | 400 | S063 |
| 128053o/FABBR_L.shp | PolyLineZ | 12 | S057 |
| 128053o/FABB_OLD.shp | PolygonZ | 33 | S063 |
| 128053o/IDROGRAF.shp | PolyLineZ | 970 | S059 |
| 128053o/IDROGR_A.shp | PolygonZ | 12 | S062 |
| 128053o/INFRASTR.shp | PolyLineZ | 29 | S059 |
| 128053o/INFRAS_A.shp | PolygonZ | 6 | S062 |
| 128053o/NODOVIA.shp | PointZ | 122 | S004 |
| 128053o/OPERE.shp | PolyLineZ | 54 | S059 |
| 128053o/PUNTI_Q.shp | PointZ | 895 | S005 |
| 128053o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128053o/SIM_ELEM.shp | PointZ | 773 | S008 |
| 128053o/SIM_FABB.shp | PointZ | 3 | S009 |
| 128053o/SIM_IDRO.shp | PointZ | 7 | S011 |
| 128053o/SIM_INFR.shp | PointZ | 20 | S012 |
| 128053o/SIM_OPER.shp | PointZ | 4 | S013 |
| 128053o/SIM_VEGE.shp | PointZ | 912 | S014 |
| 128053o/SIM_VIAB.shp | PointZ | 12 | S015 |
| 128053o/TESTI.shp | PointZ | 964 | S016 |
| 128053o/VEGETAZ.shp | PolyLineZ | 102 | S059 |
| 128053o/VEGET_A.shp | PolygonZ | 17 | S062 |
| 128053o/VIABILIT.shp | PolyLineZ | 856 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128054.zip`

Release 1987; 597751 bytes; 83 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128054o/CAM_FABB.shp | PolyLineZ | 91 | S059 |
| 128054o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128054o/DISCONT.shp | PolyLineZ | 5477 | S059 |
| 128054o/ELE_DIV.shp | PolyLineZ | 307 | S059 |
| 128054o/FABBRIC.shp | PolygonZ | 338 | S063 |
| 128054o/FABBR_L.shp | PolyLineZ | 6 | S057 |
| 128054o/IDROGRAF.shp | PolyLineZ | 2087 | S059 |
| 128054o/IDROGR_A.shp | PolygonZ | 136 | S062 |
| 128054o/INFRASTR.shp | PolyLineZ | 45 | S059 |
| 128054o/INFRAS_A.shp | PolygonZ | 7 | S062 |
| 128054o/INQUADRA.shp | PointZ | 6 | S001 |
| 128054o/LIM_AMM.shp | PolyLineZ | 21 | S059 |
| 128054o/OPERE.shp | PolyLineZ | 2943 | S059 |
| 128054o/PUNTI_Q.shp | PointZ | 481 | S005 |
| 128054o/SIM_CORN.shp | PointZ | 37 | S006 |
| 128054o/SIM_ELEM.shp | PointZ | 626 | S008 |
| 128054o/SIM_FABB.shp | PointZ | 1 | S009 |
| 128054o/SIM_IDRO.shp | PointZ | 13 | S011 |
| 128054o/SIM_INFR.shp | PointZ | 49 | S012 |
| 128054o/SIM_OPER.shp | PointZ | 10 | S013 |
| 128054o/SIM_VEGE.shp | PointZ | 347 | S014 |
| 128054o/SIM_VIAB.shp | PointZ | 1 | S015 |
| 128054o/testi.shp | PointZ | 650 | S016 |
| 128054o/VEGETAZ.shp | PolyLineZ | 44 | S059 |
| 128054o/VEGET_A.shp | PolygonZ | 24 | S062 |
| 128054o/VIABILIT.shp | PolyLineZ | 776 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128061.zip`

Release 1987; 253185 bytes; 44 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128061o/CAM_FABB.shp | PolyLineZ | 2 | S059 |
| 128061o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128061o/CURVE.shp | PolyLineZ | 5 | S065 |
| 128061o/DISCONT.shp | PolyLineZ | 177 | S059 |
| 128061o/FABBRIC.shp | PolygonZ | 2 | S063 |
| 128061o/IDROGRAF.shp | PolyLineZ | 637 | S059 |
| 128061o/LIM_AMM.shp | PolyLineZ | 4 | S059 |
| 128061o/OPERE.shp | PolyLineZ | 219 | S059 |
| 128061o/PUNTI_Q.shp | PointZ | 1409 | S005 |
| 128061o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128061o/SIM_VEGE.shp | PointZ | 5 | S014 |
| 128061o/testi.shp | PointZ | 1513 | S016 |
| 128061o/VIABILIT.shp | PolyLineZ | 2 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128062.zip`

Release 1987; 328098 bytes; 50 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128062o/CAM_FABB.shp | PolyLineZ | 18 | S059 |
| 128062o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128062o/CURVE.shp | PolyLineZ | 25 | S065 |
| 128062o/DISCONT.shp | PolyLineZ | 1252 | S059 |
| 128062o/ELE_DIV.shp | PolyLineZ | 3 | S059 |
| 128062o/FABBRIC.shp | PolygonZ | 24 | S063 |
| 128062o/IDROGRAF.shp | PolyLineZ | 473 | S059 |
| 128062o/IDROGR_A.shp | PolygonZ | 7 | S062 |
| 128062o/OPERE.shp | PolyLineZ | 223 | S059 |
| 128062o/PUNTI_Q.shp | PointZ | 1496 | S005 |
| 128062o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128062o/SIM_IDRO.shp | PointZ | 57 | S011 |
| 128062o/SIM_VEGE.shp | PointZ | 6 | S014 |
| 128062o/testi.shp | PointZ | 1604 | S016 |
| 128062o/VIABILIT.shp | PolyLineZ | 13 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128063.zip`

Release 1987; 434283 bytes; 65 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128063o/CAM_FABB.shp | PolyLineZ | 31 | S059 |
| 128063o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 128063o/CURVE.shp | PolyLineZ | 5 | S065 |
| 128063o/DISCONT.shp | PolyLineZ | 1199 | S059 |
| 128063o/ELE_DIV.shp | PolyLineZ | 30 | S059 |
| 128063o/FABBRIC.shp | PolygonZ | 41 | S063 |
| 128063o/IDROGRAF.shp | PolyLineZ | 797 | S059 |
| 128063o/IDROGR_A.shp | PolygonZ | 5 | S062 |
| 128063o/OPERE.shp | PolyLineZ | 1945 | S059 |
| 128063o/OPERE_A.shp | PolygonZ | 3 | S062 |
| 128063o/PUNTI_Q.shp | PointZ | 1273 | S005 |
| 128063o/SIM_CORN.shp | PointZ | 37 | S006 |
| 128063o/SIM_ELEM.shp | PointZ | 75 | S008 |
| 128063o/SIM_FABB.shp | PointZ | 5 | S009 |
| 128063o/SIM_IDRO.shp | PointZ | 17 | S011 |
| 128063o/SIM_OPER.shp | PointZ | 14 | S013 |
| 128063o/SIM_VEGE.shp | PointZ | 49 | S014 |
| 128063o/testi.shp | PointZ | 1392 | S016 |
| 128063o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 128063o/VIABILIT.shp | PolyLineZ | 18 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128064.zip`

Release 1987; 626257 bytes; 68 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128064o/CAM_FABB.shp | PolyLineZ | 9 | S059 |
| 128064o/CORNICI.shp | PolyLineZ | 19 | S066 |
| 128064o/DISCONT.shp | PolyLineZ | 6580 | S059 |
| 128064o/ELE_DIV.shp | PolyLineZ | 27 | S059 |
| 128064o/FABBRIC.shp | PolygonZ | 27 | S063 |
| 128064o/IDROGRAF.shp | PolyLineZ | 1202 | S059 |
| 128064o/IDROGR_A.shp | PolygonZ | 69 | S062 |
| 128064o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 128064o/INQUADRA.shp | PointZ | 2 | S001 |
| 128064o/LIM_AMM.shp | PolyLineZ | 21 | S059 |
| 128064o/OPERE.shp | PolyLineZ | 4526 | S059 |
| 128064o/PUNTI_Q.shp | PointZ | 880 | S005 |
| 128064o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128064o/SIM_ELEM.shp | PointZ | 51 | S008 |
| 128064o/SIM_IDRO.shp | PointZ | 1 | S011 |
| 128064o/SIM_INFR.shp | PointZ | 2 | S012 |
| 128064o/SIM_VEGE.shp | PointZ | 80 | S014 |
| 128064o/testi.shp | PointZ | 1011 | S016 |
| 128064o/VEGETAZ.shp | PolyLineZ | 1 | S059 |
| 128064o/VEGET_A.shp | PolygonZ | 2 | S062 |
| 128064o/VIABILIT.shp | PolyLineZ | 194 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128071.zip`

Release 1987; 713376 bytes; 62 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128071o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128071o/DISCONT.shp | PolyLineZ | 1097 | S059 |
| 128071o/ELE_DIV.shp | PolyLineZ | 1 | S059 |
| 128071o/FABBRIC.shp | PolygonZ | 8 | S063 |
| 128071o/IDROGRAF.shp | PolyLineZ | 1843 | S059 |
| 128071o/IDROGR_A.shp | PolygonZ | 32 | S062 |
| 128071o/INFRASTR.shp | PolyLineZ | 16 | S059 |
| 128071o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 128071o/LIM_AMM.shp | PolyLineZ | 16 | S059 |
| 128071o/OPERE.shp | PolyLineZ | 6312 | S059 |
| 128071o/OPERE_A.shp | PolygonZ | 1 | S062 |
| 128071o/PUNTI_Q.shp | PointZ | 1486 | S005 |
| 128071o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128071o/SIM_ELEM.shp | PointZ | 1 | S008 |
| 128071o/SIM_INFR.shp | PointZ | 14 | S012 |
| 128071o/SIM_VEGE.shp | PointZ | 25 | S014 |
| 128071o/testi.shp | PointZ | 1610 | S016 |
| 128071o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 128071o/VIABILIT.shp | PolyLineZ | 47 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128072.zip`

Release 1987; 951783 bytes; 71 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128072o/CAM_FABB.shp | PolyLineZ | 2 | S059 |
| 128072o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128072o/DISCONT.shp | PolyLineZ | 13350 | S059 |
| 128072o/ELE_DIV.shp | PolyLineZ | 5 | S059 |
| 128072o/FABBRIC.shp | PolygonZ | 58 | S063 |
| 128072o/IDROGRAF.shp | PolyLineZ | 1430 | S059 |
| 128072o/IDROGR_A.shp | PolygonZ | 45 | S062 |
| 128072o/INFRASTR.shp | PolyLineZ | 6 | S059 |
| 128072o/INFRAS_A.shp | PolygonZ | 4 | S062 |
| 128072o/LIM_AMM.shp | PolyLineZ | 22 | S059 |
| 128072o/OPERE.shp | PolyLineZ | 588 | S059 |
| 128072o/PUNTI_Q.shp | PointZ | 1471 | S005 |
| 128072o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128072o/SIM_ELEM.shp | PointZ | 16 | S008 |
| 128072o/SIM_FABB.shp | PointZ | 4 | S009 |
| 128072o/SIM_IDRO.shp | PointZ | 19 | S011 |
| 128072o/SIM_INFR.shp | PointZ | 12 | S012 |
| 128072o/SIM_VEGE.shp | PointZ | 28 | S014 |
| 128072o/testi.shp | PointZ | 1593 | S016 |
| 128072o/VEGETAZ.shp | PolyLineZ | 14 | S059 |
| 128072o/VEGET_A.shp | PolygonZ | 9 | S062 |
| 128072o/VIABILIT.shp | PolyLineZ | 145 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128073.zip`

Release 1987; 564510 bytes; 59 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128073o/CAM_FABB.shp | PolyLineZ | 14 | S059 |
| 128073o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128073o/CURVE.shp | PolyLineZ | 12 | S065 |
| 128073o/DISCONT.shp | PolyLineZ | 3233 | S059 |
| 128073o/ELE_DIV.shp | PolyLineZ | 2 | S059 |
| 128073o/FABBRIC.shp | PolygonZ | 37 | S063 |
| 128073o/IDROGRAF.shp | PolyLineZ | 813 | S059 |
| 128073o/IDROGR_A.shp | PolygonZ | 13 | S062 |
| 128073o/LIM_AMM.shp | PolyLineZ | 33 | S059 |
| 128073o/OPERE.shp | PolyLineZ | 3403 | S059 |
| 128073o/PUNTI_Q.shp | PointZ | 1553 | S005 |
| 128073o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128073o/SIM_IDRO.shp | PointZ | 8 | S011 |
| 128073o/SIM_VEGE.shp | PointZ | 6 | S014 |
| 128073o/testi.shp | PointZ | 1666 | S016 |
| 128073o/VEGETAZ.shp | PolyLineZ | 8 | S059 |
| 128073o/VEGET_A.shp | PolygonZ | 3 | S062 |
| 128073o/VIABILIT.shp | PolyLineZ | 17 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128074.zip`

Release 1987; 289870 bytes; 38 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128074o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 128074o/DISCONT.shp | PolyLineZ | 29 | S059 |
| 128074o/ELE_DIV.shp | PolyLineZ | 3 | S059 |
| 128074o/FABBRIC.shp | PolygonZ | 11 | S063 |
| 128074o/IDROGRAF.shp | PolyLineZ | 528 | S059 |
| 128074o/OPERE.shp | PolyLineZ | 2441 | S059 |
| 128074o/PUNTI_Q.shp | PointZ | 1205 | S005 |
| 128074o/SIM_ELEM.shp | PointZ | 22 | S008 |
| 128074o/SIM_VEGE.shp | PointZ | 19 | S014 |
| 128074o/TESTI.shp | PointZ | 1229 | S016 |
| 128074o/VIABILIT.shp | PolyLineZ | 15 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128084.zip`

Release 1987; 665074 bytes; 77 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128084o/CAM_FABB.shp | PolyLineZ | 97 | S059 |
| 128084o/CORNICI.shp | PolyLineZ | 28 | S066 |
| 128084o/DISCONT.shp | PolyLineZ | 7707 | S059 |
| 128084o/ELE_DIV.shp | PolyLineZ | 67 | S059 |
| 128084o/FABBRIC.shp | PolygonZ | 212 | S063 |
| 128084o/IDROGRAF.shp | PolyLineZ | 1443 | S059 |
| 128084o/IDROGR_A.shp | PolygonZ | 128 | S062 |
| 128084o/INFRASTR.shp | PolyLineZ | 49 | S059 |
| 128084o/INFRAS_A.shp | PolygonZ | 7 | S062 |
| 128084o/INQUADRA.shp | PointZ | 2 | S001 |
| 128084o/LIM_AMM.shp | PolyLineZ | 31 | S059 |
| 128084o/OPERE.shp | PolyLineZ | 1736 | S059 |
| 128084o/PUNTI_Q.shp | PointZ | 1129 | S005 |
| 128084o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128084o/SIM_ELEM.shp | PointZ | 197 | S008 |
| 128084o/SIM_FABB.shp | PointZ | 1 | S009 |
| 128084o/SIM_IDRO.shp | PointZ | 16 | S011 |
| 128084o/SIM_INFR.shp | PointZ | 52 | S012 |
| 128084o/SIM_VEGE.shp | PointZ | 194 | S014 |
| 128084o/SIM_VIAB.shp | PointZ | 3 | S015 |
| 128084o/testi.shp | PointZ | 1286 | S016 |
| 128084o/VEGETAZ.shp | PolyLineZ | 20 | S059 |
| 128084o/VEGET_A.shp | PolygonZ | 58 | S062 |
| 128084o/VIABILIT.shp | PolyLineZ | 476 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128092.zip`

Release 1987; 418184 bytes; 68 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128092o/CORNICI.shp | PolyLineZ | 28 | S066 |
| 128092o/DISCONT.shp | PolyLineZ | 541 | S059 |
| 128092o/ELE_DIV.shp | PolyLineZ | 126 | S059 |
| 128092o/FABBRIC.shp | PolygonZ | 460 | S063 |
| 128092o/FABBR_L.shp | PolyLineZ | 4 | S057 |
| 128092o/IDROGRAF.shp | PolyLineZ | 639 | S059 |
| 128092o/IDROGR_A.shp | PolygonZ | 54 | S062 |
| 128092o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 128092o/INQUADRA.shp | PointZ | 7 | S001 |
| 128092o/OPERE.shp | PolyLineZ | 619 | S059 |
| 128092o/PUNTI_Q.shp | PointZ | 1427 | S005 |
| 128092o/SIM_CORN.shp | PointZ | 37 | S006 |
| 128092o/SIM_ELEM.shp | PointZ | 250 | S008 |
| 128092o/SIM_IDRO.shp | PointZ | 202 | S011 |
| 128092o/SIM_INFR.shp | PointZ | 1 | S012 |
| 128092o/SIM_OPER.shp | PointZ | 169 | S013 |
| 128092o/SIM_VEGE.shp | PointZ | 206 | S014 |
| 128092o/testi.shp | PointZ | 1539 | S016 |
| 128092o/VEGETAZ.shp | PolyLineZ | 196 | S059 |
| 128092o/VEGET_A.shp | PolygonZ | 95 | S062 |
| 128092o/VIABILIT.shp | PolyLineZ | 561 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128101.zip`

Release 1987; 800112 bytes; 68 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128101o/CORNICI.shp | PolyLineZ | 30 | S066 |
| 128101o/DISCONT.shp | PolyLineZ | 4480 | S059 |
| 128101o/ELE_DIV.shp | PolyLineZ | 3 | S059 |
| 128101o/FABBRIC.shp | PolygonZ | 105 | S063 |
| 128101o/IDROGRAF.shp | PolyLineZ | 1281 | S059 |
| 128101o/IDROGR_A.shp | PolygonZ | 92 | S062 |
| 128101o/INFRASTR.shp | PolyLineZ | 1 | S059 |
| 128101o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 128101o/OPERE.shp | PolyLineZ | 3800 | S059 |
| 128101o/OPERE_A.shp | PolygonZ | 1 | S062 |
| 128101o/PUNTI_Q.shp | PointZ | 1722 | S005 |
| 128101o/SIM_CORN.shp | PointZ | 38 | S006 |
| 128101o/SIM_ELEM.shp | PointZ | 11 | S008 |
| 128101o/SIM_FABB.shp | PointZ | 1 | S009 |
| 128101o/SIM_IDRO.shp | PointZ | 80 | S011 |
| 128101o/SIM_INFR.shp | PointZ | 18 | S012 |
| 128101o/SIM_VEGE.shp | PointZ | 36 | S014 |
| 128101o/testi.shp | PointZ | 1835 | S016 |
| 128101o/VEGETAZ.shp | PolyLineZ | 90 | S059 |
| 128101o/VEGET_A.shp | PolygonZ | 43 | S062 |
| 128101o/VIABILIT.shp | PolyLineZ | 193 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148031.zip`

Release 1987; 452001 bytes; 41 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148031o/CORNICI.shp | PolyLineZ | 30 | S066 |
| 148031o/CURVE.shp | PolyLineZ | 9 | S065 |
| 148031o/FABBRIC.shp | PolygonZ | 2 | S063 |
| 148031o/IDROGRAF.shp | PolyLineZ | 493 | S059 |
| 148031o/LIM_AMM.shp | PolyLineZ | 1 | S059 |
| 148031o/OPERE.shp | PolyLineZ | 3992 | S059 |
| 148031o/PUNTI_Q.shp | PointZ | 817 | S005 |
| 148031o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148031o/SIM_IDRO.shp | PointZ | 1 | S011 |
| 148031o/SIM_VEGE.shp | PointZ | 19 | S014 |
| 148031o/testi.shp | PointZ | 926 | S016 |
| 148031o/VIABILIT.shp | PolyLineZ | 5 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148041.zip`

Release 1987; 148668 bytes; 56 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148041o/CORNICI.shp | PolyLineZ | 29 | S066 |
| 148041o/CURVE.shp | PolyLineZ | 7 | S065 |
| 148041o/DISCONT.shp | PolyLineZ | 269 | S059 |
| 148041o/ELE_DIV.shp | PolyLineZ | 4 | S059 |
| 148041o/FABBRIC.shp | PolygonZ | 19 | S063 |
| 148041o/IDROGRAF.shp | PolyLineZ | 44 | S059 |
| 148041o/OPERE.shp | PolyLineZ | 3 | S059 |
| 148041o/OPERE_A.shp | PolygonZ | 1 | S062 |
| 148041o/PUNTI_Q.shp | PointZ | 1536 | S005 |
| 148041o/SIM_CORN.shp | PointZ | 36 | S006 |
| 148041o/SIM_ELEM.shp | PointZ | 13 | S008 |
| 148041o/SIM_IDRO.shp | PointZ | 73 | S011 |
| 148041o/SIM_OPER.shp | PointZ | 16 | S013 |
| 148041o/SIM_VEGE.shp | PointZ | 28 | S014 |
| 148041o/testi.shp | PointZ | 1638 | S016 |
| 148041o/VEGETAZ.shp | PolyLineZ | 8 | S059 |
| 148041o/VIABILIT.shp | PolyLineZ | 7 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148043.zip`

Release 1987; 180304 bytes; 47 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148043o/CORNICI.shp | PolyLineZ | 26 | S066 |
| 148043o/DISCONT.shp | PolyLineZ | 641 | S059 |
| 148043o/FABBRIC.shp | PolygonZ | 12 | S063 |
| 148043o/IDROGRAF.shp | PolyLineZ | 41 | S059 |
| 148043o/IDROGR_A.shp | PolygonZ | 1 | S062 |
| 148043o/LIM_AMM.shp | PolyLineZ | 6 | S059 |
| 148043o/OPERE.shp | PolyLineZ | 88 | S059 |
| 148043o/OPERE_A.shp | PolygonZ | 1 | S062 |
| 148043o/PUNTI_Q.shp | PointZ | 1691 | S005 |
| 148043o/SIM_CORN.shp | PointZ | 35 | S006 |
| 148043o/SIM_IDRO.shp | PointZ | 263 | S011 |
| 148043o/SIM_VEGE.shp | PointZ | 14 | S014 |
| 148043o/testi.shp | PointZ | 1797 | S016 |
| 148043o/VIABILIT.shp | PolyLineZ | 6 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148044.zip`

Release 1987; 179591 bytes; 38 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148044o/CORNICI.shp | PolyLineZ | 25 | S066 |
| 148044o/DISCONT.shp | PolyLineZ | 923 | S059 |
| 148044o/FABBRIC.shp | PolygonZ | 3 | S063 |
| 148044o/IDROGRAF.shp | PolyLineZ | 84 | S059 |
| 148044o/LIM_AMM.shp | PolyLineZ | 9 | S059 |
| 148044o/OPERE.shp | PolyLineZ | 194 | S059 |
| 148044o/PUNTI_Q.shp | PointZ | 1222 | S005 |
| 148044o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148044o/SIM_IDRO.shp | PointZ | 161 | S011 |
| 148044o/SIM_VEGE.shp | PointZ | 42 | S014 |
| 148044o/testi.shp | PointZ | 1316 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148071.zip`

Release 1987; 233914 bytes; 38 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148071o/CORNICI.shp | PolyLineZ | 29 | S066 |
| 148071o/CURVE.shp | PolyLineZ | 23 | S065 |
| 148071o/FABBRIC.shp | PolygonZ | 2 | S063 |
| 148071o/IDROGRAF.shp | PolyLineZ | 172 | S059 |
| 148071o/LIM_AMM.shp | PolyLineZ | 10 | S059 |
| 148071o/OPERE.shp | PolyLineZ | 1 | S059 |
| 148071o/OPERE_A.shp | PolygonZ | 2 | S062 |
| 148071o/PUNTI_Q.shp | PointZ | 1706 | S005 |
| 148071o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148071o/SIM_IDRO.shp | PointZ | 126 | S011 |
| 148071o/testi.shp | PointZ | 1807 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148084.zip`

Release 1987; 159287 bytes; 35 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148084o/CORNICI.shp | PolyLineZ | 26 | S066 |
| 148084o/DISCONT.shp | PolyLineZ | 22 | S059 |
| 148084o/FABBRIC.shp | PolygonZ | 11 | S063 |
| 148084o/IDROGRAF.shp | PolyLineZ | 87 | S059 |
| 148084o/LIM_AMM.shp | PolyLineZ | 15 | S059 |
| 148084o/OPERE.shp | PolyLineZ | 4 | S059 |
| 148084o/PUNTI_Q.shp | PointZ | 1774 | S005 |
| 148084o/SIM_CORN.shp | PointZ | 36 | S006 |
| 148084o/SIM_IDRO.shp | PointZ | 154 | S011 |
| 148084o/testi.shp | PointZ | 1875 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148123.zip`

Release 1987; 135107 bytes; 32 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148123o/CORNICI.shp | PolyLineZ | 28 | S066 |
| 148123o/FABBRIC.shp | PolygonZ | 11 | S063 |
| 148123o/IDROGRAF.shp | PolyLineZ | 50 | S059 |
| 148123o/IDROGR_A.shp | PolygonZ | 1 | S062 |
| 148123o/LIM_AMM.shp | PolyLineZ | 5 | S059 |
| 148123o/PUNTI_Q.shp | PointZ | 1637 | S005 |
| 148123o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148123o/SIM_IDRO.shp | PointZ | 84 | S011 |
| 148123o/testi.shp | PointZ | 1737 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148124.zip`

Release 1987; 116264 bytes; 32 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148124o/CORNICI.shp | PolyLineZ | 28 | S066 |
| 148124o/DISCONT.shp | PolyLineZ | 29 | S059 |
| 148124o/FABBRIC.shp | PolygonZ | 3 | S063 |
| 148124o/IDROGRAF.shp | PolyLineZ | 41 | S059 |
| 148124o/LIM_AMM.shp | PolyLineZ | 2 | S059 |
| 148124o/PUNTI_Q.shp | PointZ | 1392 | S005 |
| 148124o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148124o/SIM_IDRO.shp | PointZ | 68 | S011 |
| 148124o/testi.shp | PointZ | 1498 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148161.zip`

Release 1987; 291665 bytes; 80 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148161o/AREE_TER.shp | PolygonZ | 2 | S062 |
| 148161o/ASTEVIA.shp | PolyLineZ | 3 | S060 |
| 148161o/CAM_FABB.shp | PolyLineZ | 292 | S059 |
| 148161o/CAM_TER.shp | PolyLineZ | 2231 | S059 |
| 148161o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 148161o/CURVE.shp | PolyLineZ | 16 | S065 |
| 148161o/DISCONT.shp | PolyLineZ | 892 | S059 |
| 148161o/ELE_DIV.shp | PolyLineZ | 31 | S059 |
| 148161o/FABBRIC.shp | PolygonZ | 74 | S063 |
| 148161o/IDROGRAF.shp | PolyLineZ | 25 | S059 |
| 148161o/IDROGR_A.shp | PolygonZ | 2 | S062 |
| 148161o/INQUADRA.shp | PointZ | 2 | S001 |
| 148161o/LIM_AMM.shp | PolyLineZ | 1 | S059 |
| 148161o/NODOVIA.shp | PointZ | 8 | S004 |
| 148161o/OPERE.shp | PolyLineZ | 35 | S059 |
| 148161o/PUNTI_Q.shp | PointZ | 881 | S005 |
| 148161o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148161o/SIM_DISC.shp | PointZ | 880 | S007 |
| 148161o/SIM_ELEM.shp | PointZ | 130 | S008 |
| 148161o/SIM_IDRO.shp | PointZ | 22 | S011 |
| 148161o/SIM_OPER.shp | PointZ | 86 | S013 |
| 148161o/SIM_VEGE.shp | PointZ | 107 | S014 |
| 148161o/testi.shp | PointZ | 939 | S016 |
| 148161o/VEGETAZ.shp | PolyLineZ | 4 | S059 |
| 148161o/VIABILIT.shp | PolyLineZ | 31 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148164.zip`

Release 1987; 233076 bytes; 74 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148164o/ASTEVIA.shp | PolyLineZ | 1 | S060 |
| 148164o/CAM_FABB.shp | PolyLineZ | 197 | S059 |
| 148164o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 148164o/CURVE.shp | PolyLineZ | 24 | S065 |
| 148164o/DISCONT.shp | PolyLineZ | 190 | S059 |
| 148164o/ELE_DIV.shp | PolyLineZ | 9 | S059 |
| 148164o/FABBRIC.shp | PolygonZ | 34 | S063 |
| 148164o/IDROGRAF.shp | PolyLineZ | 31 | S059 |
| 148164o/IDROGR_A.shp | PolygonZ | 59 | S062 |
| 148164o/INQUADRA.shp | PointZ | 1 | S001 |
| 148164o/LIM_AMM.shp | PolyLineZ | 1 | S059 |
| 148164o/NODOVIA.shp | PointZ | 2 | S004 |
| 148164o/OPERE.shp | PolyLineZ | 36 | S059 |
| 148164o/PUNTI_Q.shp | PointZ | 2011 | S005 |
| 148164o/SIM_CORN.shp | PointZ | 34 | S006 |
| 148164o/SIM_DISC.shp | PointZ | 185 | S007 |
| 148164o/SIM_ELEM.shp | PointZ | 37 | S008 |
| 148164o/SIM_IDRO.shp | PointZ | 147 | S011 |
| 148164o/SIM_OPER.shp | PointZ | 52 | S013 |
| 148164o/SIM_VEGE.shp | PointZ | 49 | S014 |
| 148164o/TESTI.shp | PointZ | 2067 | S016 |
| 148164o/VEGETAZ.shp | PolyLineZ | 2 | S059 |
| 148164o/VIABILIT.shp | PolyLineZ | 25 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127033.zip`

Release 1994; 846790 bytes; 83 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127033o/CAM_FABB.shp | PolyLineZ | 628 | S059 |
| 127033o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127033o/DISCONT.shp | PolyLineZ | 688 | S059 |
| 127033o/ELE_DIV.shp | PolyLineZ | 1747 | S059 |
| 127033o/FABBRIC.shp | PolygonZ | 1849 | S063 |
| 127033o/FABBR_L.shp | PolyLineZ | 19 | S057 |
| 127033o/IDROGRAF.shp | PolyLineZ | 1967 | S059 |
| 127033o/IDROGR_A.shp | PolygonZ | 212 | S062 |
| 127033o/INFRASTR.shp | PolyLineZ | 714 | S059 |
| 127033o/INFRAS_A.shp | PolygonZ | 93 | S062 |
| 127033o/INQUADRA.shp | PointZ | 4 | S001 |
| 127033o/LIM_AMM.shp | PolyLineZ | 50 | S059 |
| 127033o/OPERE.shp | PolyLineZ | 1371 | S059 |
| 127033o/PUNTI_Q.shp | PointZ | 418 | S005 |
| 127033o/SIM_CORN.shp | PointZ | 37 | S006 |
| 127033o/SIM_ELEM.shp | PointZ | 2745 | S008 |
| 127033o/SIM_FABB.shp | PointZ | 20 | S009 |
| 127033o/SIM_IDRO.shp | PointZ | 23 | S011 |
| 127033o/SIM_INFR.shp | PointZ | 66 | S012 |
| 127033o/SIM_OPER.shp | PointZ | 6 | S013 |
| 127033o/SIM_VEGE.shp | PointZ | 1370 | S014 |
| 127033o/testi.shp | PointZ | 568 | S016 |
| 127033o/VEGETAZ.shp | PolyLineZ | 271 | S059 |
| 127033o/VEGET_A.shp | PolygonZ | 83 | S062 |
| 127033o/VIABILIT.shp | PolyLineZ | 2430 | S059 |
| 127033o/ZONENC.shp | PolyLineZ | 18 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127071.zip`

Release 1994; 1562490 bytes; 101 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127071o/ASTEVIA.shp | PolyLineZ | 336 | S060 |
| 127071o/CAM_FABB.shp | PolyLineZ | 9017 | S059 |
| 127071o/CORNICI.shp | PolyLineZ | 16 | S066 |
| 127071o/DISCONT.shp | PolyLineZ | 12624 | S059 |
| 127071o/ELE_DIV.shp | PolyLineZ | 2193 | S059 |
| 127071o/err_a.shp | PolygonZ | 35 | S062 |
| 127071o/err_t.shp | PointZ | 3 | S062 |
| 127071o/FABBRIC.shp | PolygonZ | 1613 | S063 |
| 127071o/FABBR_L.shp | PolyLineZ | 16 | S057 |
| 127071o/FABB_OLD.shp | PolygonZ | 26 | S063 |
| 127071o/FERROVIE.shp | PolyLineZ | 52 | S059 |
| 127071o/IDROGRAF.shp | PolyLineZ | 1160 | S059 |
| 127071o/IDROGR_A.shp | PolygonZ | 14 | S062 |
| 127071o/INFRASTR.shp | PolyLineZ | 126 | S059 |
| 127071o/INFRAS_A.shp | PolygonZ | 17 | S062 |
| 127071o/LIM_AMM.shp | PolyLineZ | 31 | S059 |
| 127071o/NODOVIA.shp | PointZ | 418 | S004 |
| 127071o/OPERE.shp | PolyLineZ | 40 | S059 |
| 127071o/PUNTI_Q.shp | PointZ | 799 | S005 |
| 127071o/SIM_CORN.shp | PointZ | 34 | S006 |
| 127071o/SIM_ELEM.shp | PointZ | 2029 | S008 |
| 127071o/SIM_FABB.shp | PointZ | 15 | S009 |
| 127071o/SIM_FERR.shp | PointZ | 4 | S010 |
| 127071o/SIM_IDRO.shp | PointZ | 255 | S011 |
| 127071o/SIM_INFR.shp | PointZ | 101 | S012 |
| 127071o/SIM_OPER.shp | PointZ | 69 | S013 |
| 127071o/SIM_VEGE.shp | PointZ | 2797 | S014 |
| 127071o/SIM_VIAB.shp | PointZ | 25 | S015 |
| 127071o/TESTI.shp | PointZ | 966 | S016 |
| 127071o/VEGETAZ.shp | PolyLineZ | 225 | S059 |
| 127071o/VEGET_A.shp | PolygonZ | 111 | S062 |
| 127071o/VIABILIT.shp | PolyLineZ | 1622 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127072.zip`

Release 1994; 2005207 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127072o/ASTEVIA.shp | PolyLineZ | 798 | S060 |
| 127072o/CAM_FABB.shp | PolyLineZ | 16596 | S059 |
| 127072o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 127072o/DISCONT.shp | PolyLineZ | 11415 | S059 |
| 127072o/ELE_DIV.shp | PolyLineZ | 3162 | S059 |
| 127072o/err_a.shp | PolygonZ | 180 | S062 |
| 127072o/err_t.shp | PointZ | 5 | S062 |
| 127072o/FABBRIC.shp | PolygonZ | 3310 | S063 |
| 127072o/FABBR_L.shp | PolyLineZ | 7 | S057 |
| 127072o/FABB_OLD.shp | PolygonZ | 50 | S063 |
| 127072o/FERROVIE.shp | PolyLineZ | 52 | S059 |
| 127072o/IDROGRAF.shp | PolyLineZ | 646 | S059 |
| 127072o/IDROGR_A.shp | PolygonZ | 3 | S062 |
| 127072o/INFRASTR.shp | PolyLineZ | 122 | S059 |
| 127072o/INFRAS_A.shp | PolygonZ | 34 | S062 |
| 127072o/NODOVIA.shp | PointZ | 924 | S004 |
| 127072o/OPERE.shp | PolyLineZ | 18 | S059 |
| 127072o/PUNTI_Q.shp | PointZ | 538 | S005 |
| 127072o/SIM_CORN.shp | PointZ | 38 | S006 |
| 127072o/SIM_ELEM.shp | PointZ | 1229 | S008 |
| 127072o/SIM_FABB.shp | PointZ | 12 | S009 |
| 127072o/SIM_FERR.shp | PointZ | 6 | S010 |
| 127072o/SIM_IDRO.shp | PointZ | 293 | S011 |
| 127072o/SIM_INFR.shp | PointZ | 67 | S012 |
| 127072o/SIM_OPER.shp | PointZ | 121 | S013 |
| 127072o/SIM_VEGE.shp | PointZ | 2158 | S014 |
| 127072o/SIM_VIAB.shp | PointZ | 7 | S015 |
| 127072o/TESTI.shp | PointZ | 748 | S016 |
| 127072o/VEGETAZ.shp | PolyLineZ | 358 | S059 |
| 127072o/VEGET_A.shp | PolygonZ | 19 | S062 |
| 127072o/VIABILIT.shp | PolyLineZ | 1608 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127073.zip`

Release 1994; 1979414 bytes; 101 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127073o/ASTEVIA.shp | PolyLineZ | 455 | S060 |
| 127073o/CAM_FABB.shp | PolyLineZ | 12309 | S059 |
| 127073o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 127073o/CURVE.shp | PolyLineZ | 5 | S065 |
| 127073o/DISCONT.shp | PolyLineZ | 11623 | S059 |
| 127073o/ELE_DIV.shp | PolyLineZ | 2627 | S059 |
| 127073o/err_a.shp | PolygonZ | 90 | S062 |
| 127073o/err_t.shp | PointZ | 1 | S062 |
| 127073o/FABBRIC.shp | PolygonZ | 2867 | S063 |
| 127073o/FABBR_L.shp | PolyLineZ | 15 | S057 |
| 127073o/FABB_OLD.shp | PolygonZ | 42 | S063 |
| 127073o/FERROVIE.shp | PolyLineZ | 42 | S059 |
| 127073o/IDROGRAF.shp | PolyLineZ | 649 | S059 |
| 127073o/IDROGR_A.shp | PolygonZ | 3 | S062 |
| 127073o/INFRASTR.shp | PolyLineZ | 135 | S059 |
| 127073o/INFRAS_A.shp | PolygonZ | 32 | S062 |
| 127073o/LIM_AMM.shp | PolyLineZ | 110 | S059 |
| 127073o/NODOVIA.shp | PointZ | 489 | S004 |
| 127073o/OPERE.shp | PolyLineZ | 1767 | S059 |
| 127073o/PUNTI_Q.shp | PointZ | 707 | S005 |
| 127073o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127073o/SIM_ELEM.shp | PointZ | 3901 | S008 |
| 127073o/SIM_FABB.shp | PointZ | 8 | S009 |
| 127073o/SIM_FERR.shp | PointZ | 4 | S010 |
| 127073o/SIM_IDRO.shp | PointZ | 185 | S011 |
| 127073o/SIM_INFR.shp | PointZ | 127 | S012 |
| 127073o/SIM_VEGE.shp | PointZ | 4810 | S014 |
| 127073o/SIM_VIAB.shp | PointZ | 6 | S015 |
| 127073o/TESTI.shp | PointZ | 877 | S016 |
| 127073o/VEGETAZ.shp | PolyLineZ | 716 | S059 |
| 127073o/VEGET_A.shp | PolygonZ | 31 | S062 |
| 127073o/VIABILIT.shp | PolyLineZ | 1690 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127074.zip`

Release 1994; 1706332 bytes; 95 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127074o/ASTEVIA.shp | PolyLineZ | 412 | S060 |
| 127074o/CAM_FABB.shp | PolyLineZ | 9231 | S059 |
| 127074o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 127074o/DISCONT.shp | PolyLineZ | 11141 | S059 |
| 127074o/ELE_DIV.shp | PolyLineZ | 2180 | S059 |
| 127074o/err_a.shp | PolygonZ | 53 | S062 |
| 127074o/err_t.shp | PointZ | 3 | S062 |
| 127074o/FABBRIC.shp | PolygonZ | 2014 | S063 |
| 127074o/FABBR_L.shp | PolyLineZ | 22 | S057 |
| 127074o/FABB_OLD.shp | PolygonZ | 28 | S063 |
| 127074o/IDROGRAF.shp | PolyLineZ | 925 | S059 |
| 127074o/IDROGR_A.shp | PolygonZ | 4 | S062 |
| 127074o/INFRASTR.shp | PolyLineZ | 211 | S059 |
| 127074o/INFRAS_A.shp | PolygonZ | 37 | S062 |
| 127074o/LIM_AMM.shp | PolyLineZ | 74 | S059 |
| 127074o/NODOVIA.shp | PointZ | 531 | S004 |
| 127074o/OPERE.shp | PolyLineZ | 1258 | S059 |
| 127074o/PUNTI_Q.shp | PointZ | 728 | S005 |
| 127074o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127074o/SIM_ELEM.shp | PointZ | 2143 | S008 |
| 127074o/SIM_FABB.shp | PointZ | 14 | S009 |
| 127074o/SIM_IDRO.shp | PointZ | 200 | S011 |
| 127074o/SIM_INFR.shp | PointZ | 203 | S012 |
| 127074o/SIM_OPER.shp | PointZ | 1 | S013 |
| 127074o/SIM_VEGE.shp | PointZ | 3712 | S014 |
| 127074o/SIM_VIAB.shp | PointZ | 37 | S015 |
| 127074o/TESTI.shp | PointZ | 891 | S016 |
| 127074o/VEGETAZ.shp | PolyLineZ | 520 | S059 |
| 127074o/VEGET_A.shp | PolygonZ | 106 | S062 |
| 127074o/VIABILIT.shp | PolyLineZ | 1765 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127081.zip`

Release 1994; 1560015 bytes; 95 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127081o/ASTEVIA.shp | PolyLineZ | 283 | S060 |
| 127081o/CAM_FABB.shp | PolyLineZ | 6723 | S059 |
| 127081o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127081o/DISCONT.shp | PolyLineZ | 11857 | S059 |
| 127081o/ELE_DIV.shp | PolyLineZ | 1200 | S059 |
| 127081o/err_t.shp | PointZ | 3 | S062 |
| 127081o/FABBRIC.shp | PolygonZ | 1093 | S063 |
| 127081o/FABBR_L.shp | PolyLineZ | 7 | S057 |
| 127081o/FERROVIE.shp | PolyLineZ | 34 | S059 |
| 127081o/IDROGRAF.shp | PolyLineZ | 1215 | S059 |
| 127081o/IDROGR_A.shp | PolygonZ | 1 | S062 |
| 127081o/INFRASTR.shp | PolyLineZ | 112 | S059 |
| 127081o/INFRAS_A.shp | PolygonZ | 23 | S062 |
| 127081o/LIM_AMM.shp | PolyLineZ | 57 | S059 |
| 127081o/NODOVIA.shp | PointZ | 380 | S004 |
| 127081o/OPERE.shp | PolyLineZ | 5567 | S059 |
| 127081o/PUNTI_Q.shp | PointZ | 951 | S005 |
| 127081o/SIM_CORN.shp | PointZ | 37 | S006 |
| 127081o/SIM_ELEM.shp | PointZ | 2301 | S008 |
| 127081o/SIM_FABB.shp | PointZ | 9 | S009 |
| 127081o/SIM_FERR.shp | PointZ | 3 | S010 |
| 127081o/SIM_IDRO.shp | PointZ | 196 | S011 |
| 127081o/SIM_INFR.shp | PointZ | 169 | S012 |
| 127081o/SIM_OPER.shp | PointZ | 98 | S013 |
| 127081o/SIM_VEGE.shp | PointZ | 1524 | S014 |
| 127081o/SIM_VIAB.shp | PointZ | 23 | S015 |
| 127081o/TESTI.shp | PointZ | 1082 | S016 |
| 127081o/VEGETAZ.shp | PolyLineZ | 191 | S059 |
| 127081o/VEGET_A.shp | PolygonZ | 60 | S062 |
| 127081o/VIABILIT.shp | PolyLineZ | 1428 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127082.zip`

Release 1994; 782674 bytes; 92 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127082o/ASTEVIA.shp | PolyLineZ | 207 | S060 |
| 127082o/CAM_FABB.shp | PolyLineZ | 3953 | S059 |
| 127082o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127082o/DISCONT.shp | PolyLineZ | 5011 | S059 |
| 127082o/ELE_DIV.shp | PolyLineZ | 732 | S059 |
| 127082o/err_a.shp | PolygonZ | 46 | S062 |
| 127082o/err_t.shp | PointZ | 2 | S062 |
| 127082o/FABBRIC.shp | PolygonZ | 919 | S063 |
| 127082o/FABBR_L.shp | PolyLineZ | 5 | S057 |
| 127082o/FABB_OLD.shp | PolygonZ | 38 | S063 |
| 127082o/IDROGRAF.shp | PolyLineZ | 1216 | S059 |
| 127082o/IDROGR_A.shp | PolygonZ | 2 | S062 |
| 127082o/INFRASTR.shp | PolyLineZ | 83 | S059 |
| 127082o/INFRAS_A.shp | PolygonZ | 6 | S062 |
| 127082o/NODOVIA.shp | PointZ | 251 | S004 |
| 127082o/OPERE.shp | PolyLineZ | 1 | S059 |
| 127082o/PUNTI_Q.shp | PointZ | 495 | S005 |
| 127082o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127082o/SIM_ELEM.shp | PointZ | 1262 | S008 |
| 127082o/SIM_FABB.shp | PointZ | 10 | S009 |
| 127082o/SIM_IDRO.shp | PointZ | 131 | S011 |
| 127082o/SIM_INFR.shp | PointZ | 109 | S012 |
| 127082o/SIM_OPER.shp | PointZ | 11 | S013 |
| 127082o/SIM_VEGE.shp | PointZ | 493 | S014 |
| 127082o/SIM_VIAB.shp | PointZ | 2 | S015 |
| 127082o/TESTI.shp | PointZ | 604 | S016 |
| 127082o/VEGETAZ.shp | PolyLineZ | 245 | S059 |
| 127082o/VEGET_A.shp | PolygonZ | 5 | S062 |
| 127082o/VIABILIT.shp | PolyLineZ | 804 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127083.zip`

Release 1994; 2493811 bytes; 95 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127083o/ASTEVIA.shp | PolyLineZ | 859 | S060 |
| 127083o/CAM_FABB.shp | PolyLineZ | 28662 | S059 |
| 127083o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 127083o/DISCONT.shp | PolyLineZ | 7508 | S059 |
| 127083o/ELE_DIV.shp | PolyLineZ | 6133 | S059 |
| 127083o/err_a.shp | PolygonZ | 359 | S062 |
| 127083o/FABBRIC.shp | PolygonZ | 5683 | S063 |
| 127083o/FABBR_L.shp | PolyLineZ | 28 | S057 |
| 127083o/FABB_OLD.shp | PolygonZ | 89 | S063 |
| 127083o/FERROVIE.shp | PolyLineZ | 34 | S059 |
| 127083o/IDROGRAF.shp | PolyLineZ | 819 | S059 |
| 127083o/IDROGR_A.shp | PolygonZ | 2 | S062 |
| 127083o/INFRASTR.shp | PolyLineZ | 86 | S059 |
| 127083o/INFRAS_A.shp | PolygonZ | 25 | S062 |
| 127083o/NODOVIA.shp | PointZ | 954 | S004 |
| 127083o/OPERE.shp | PolyLineZ | 12 | S059 |
| 127083o/PUNTI_Q.shp | PointZ | 428 | S005 |
| 127083o/SIM_CORN.shp | PointZ | 35 | S006 |
| 127083o/SIM_ELEM.shp | PointZ | 882 | S008 |
| 127083o/SIM_FABB.shp | PointZ | 20 | S009 |
| 127083o/SIM_FERR.shp | PointZ | 3 | S010 |
| 127083o/SIM_IDRO.shp | PointZ | 162 | S011 |
| 127083o/SIM_INFR.shp | PointZ | 74 | S012 |
| 127083o/SIM_OPER.shp | PointZ | 35 | S013 |
| 127083o/SIM_VEGE.shp | PointZ | 1650 | S014 |
| 127083o/SIM_VIAB.shp | PointZ | 2 | S015 |
| 127083o/TESTI.shp | PointZ | 643 | S016 |
| 127083o/VEGETAZ.shp | PolyLineZ | 334 | S059 |
| 127083o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 127083o/VIABILIT.shp | PolyLineZ | 1876 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127084.zip`

Release 1994; 1333321 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127084o/ASTEVIA.shp | PolyLineZ | 328 | S060 |
| 127084o/CAM_FABB.shp | PolyLineZ | 3587 | S059 |
| 127084o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127084o/DISCONT.shp | PolyLineZ | 17431 | S059 |
| 127084o/ELE_DIV.shp | PolyLineZ | 677 | S059 |
| 127084o/err_a.shp | PolygonZ | 2 | S062 |
| 127084o/err_t.shp | PointZ | 1 | S062 |
| 127084o/FABBRIC.shp | PolygonZ | 643 | S063 |
| 127084o/FABBR_L.shp | PolyLineZ | 1 | S057 |
| 127084o/FABB_OLD.shp | PolygonZ | 5 | S063 |
| 127084o/FERROVIE.shp | PolyLineZ | 25 | S059 |
| 127084o/IDROGRAF.shp | PolyLineZ | 1127 | S059 |
| 127084o/IDROGR_A.shp | PolygonZ | 2 | S062 |
| 127084o/INFRASTR.shp | PolyLineZ | 121 | S059 |
| 127084o/INFRAS_A.shp | PolygonZ | 25 | S062 |
| 127084o/LIM_AMM.shp | PolyLineZ | 50 | S059 |
| 127084o/NODOVIA.shp | PointZ | 328 | S004 |
| 127084o/OPERE.shp | PolyLineZ | 435 | S059 |
| 127084o/PUNTI_Q.shp | PointZ | 984 | S005 |
| 127084o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127084o/SIM_ELEM.shp | PointZ | 1402 | S008 |
| 127084o/SIM_FABB.shp | PointZ | 6 | S009 |
| 127084o/SIM_FERR.shp | PointZ | 1 | S010 |
| 127084o/SIM_IDRO.shp | PointZ | 206 | S011 |
| 127084o/SIM_INFR.shp | PointZ | 78 | S012 |
| 127084o/SIM_VEGE.shp | PointZ | 1322 | S014 |
| 127084o/SIM_VIAB.shp | PointZ | 13 | S015 |
| 127084o/TESTI.shp | PointZ | 1100 | S016 |
| 127084o/VEGETAZ.shp | PolyLineZ | 130 | S059 |
| 127084o/VEGET_A.shp | PolygonZ | 79 | S062 |
| 127084o/VIABILIT.shp | PolyLineZ | 1027 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127111.zip`

Release 1994; 3410910 bytes; 101 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127111o/ASTEVIA.shp | PolyLineZ | 1635 | S060 |
| 127111o/CAM_FABB.shp | PolyLineZ | 48207 | S059 |
| 127111o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127111o/DISCONT.shp | PolyLineZ | 4228 | S059 |
| 127111o/ELE_DIV.shp | PolyLineZ | 6618 | S059 |
| 127111o/err_a.shp | PolygonZ | 291 | S062 |
| 127111o/err_t.shp | PointZ | 3 | S062 |
| 127111o/FABBRIC.shp | PolygonZ | 7928 | S063 |
| 127111o/FABBR_L.shp | PolyLineZ | 64 | S057 |
| 127111o/FABB_OLD.shp | PolygonZ | 118 | S063 |
| 127111o/FERROVIE.shp | PolyLineZ | 499 | S059 |
| 127111o/FERR_A.shp | PolygonZ | 12 | S059 |
| 127111o/IDROGRAF.shp | PolyLineZ | 159 | S059 |
| 127111o/IDROGR_A.shp | PolygonZ | 13 | S062 |
| 127111o/INFRASTR.shp | PolyLineZ | 190 | S059 |
| 127111o/INFRAS_A.shp | PolygonZ | 47 | S062 |
| 127111o/NODOVIA.shp | PointZ | 1541 | S004 |
| 127111o/OPERE.shp | PolyLineZ | 20 | S059 |
| 127111o/PUNTI_Q.shp | PointZ | 500 | S005 |
| 127111o/SIM_CORN.shp | PointZ | 37 | S006 |
| 127111o/SIM_ELEM.shp | PointZ | 827 | S008 |
| 127111o/SIM_FABB.shp | PointZ | 17 | S009 |
| 127111o/SIM_FERR.shp | PointZ | 10 | S010 |
| 127111o/SIM_IDRO.shp | PointZ | 48 | S011 |
| 127111o/SIM_INFR.shp | PointZ | 137 | S012 |
| 127111o/SIM_OPER.shp | PointZ | 37 | S013 |
| 127111o/SIM_VEGE.shp | PointZ | 2220 | S014 |
| 127111o/SIM_VIAB.shp | PointZ | 3 | S015 |
| 127111o/TESTI.shp | PointZ | 889 | S016 |
| 127111o/VEGETAZ.shp | PolyLineZ | 57 | S059 |
| 127111o/VEGET_A.shp | PolygonZ | 2 | S062 |
| 127111o/VIABILIT.shp | PolyLineZ | 2107 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127112.zip`

Release 1994; 2181875 bytes; 95 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127112o/ASTEVIA.shp | PolyLineZ | 454 | S060 |
| 127112o/CAM_FABB.shp | PolyLineZ | 24204 | S059 |
| 127112o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 127112o/DISCONT.shp | PolyLineZ | 9242 | S059 |
| 127112o/ELE_DIV.shp | PolyLineZ | 2271 | S059 |
| 127112o/err_a.shp | PolygonZ | 93 | S062 |
| 127112o/FABBRIC.shp | PolygonZ | 2857 | S063 |
| 127112o/FABBR_L.shp | PolyLineZ | 31 | S057 |
| 127112o/FABB_OLD.shp | PolygonZ | 239 | S063 |
| 127112o/FERROVIE.shp | PolyLineZ | 317 | S059 |
| 127112o/IDROGRAF.shp | PolyLineZ | 183 | S059 |
| 127112o/IDROGR_A.shp | PolygonZ | 323 | S062 |
| 127112o/INFRASTR.shp | PolyLineZ | 966 | S059 |
| 127112o/INFRAS_A.shp | PolygonZ | 71 | S062 |
| 127112o/NODOVIA.shp | PointZ | 471 | S004 |
| 127112o/OPERE.shp | PolyLineZ | 552 | S059 |
| 127112o/PUNTI_Q.shp | PointZ | 686 | S005 |
| 127112o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127112o/SIM_ELEM.shp | PointZ | 1358 | S008 |
| 127112o/SIM_FABB.shp | PointZ | 351 | S009 |
| 127112o/SIM_FERR.shp | PointZ | 14 | S010 |
| 127112o/SIM_IDRO.shp | PointZ | 211 | S011 |
| 127112o/SIM_INFR.shp | PointZ | 965 | S012 |
| 127112o/SIM_OPER.shp | PointZ | 147 | S013 |
| 127112o/SIM_VEGE.shp | PointZ | 1298 | S014 |
| 127112o/SIM_VIAB.shp | PointZ | 2 | S015 |
| 127112o/TESTI.shp | PointZ | 879 | S016 |
| 127112o/VEGETAZ.shp | PolyLineZ | 26 | S059 |
| 127112o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 127112o/VIABILIT.shp | PolyLineZ | 1502 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127113.zip`

Release 1994; 2350410 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127113o/ASTEVIA.shp | PolyLineZ | 495 | S060 |
| 127113o/CAM_FABB.shp | PolyLineZ | 14739 | S059 |
| 127113o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127113o/DISCONT.shp | PolyLineZ | 16963 | S059 |
| 127113o/ELE_DIV.shp | PolyLineZ | 3716 | S059 |
| 127113o/err_a.shp | PolygonZ | 42 | S062 |
| 127113o/err_t.shp | PointZ | 5 | S062 |
| 127113o/FABBRIC.shp | PolygonZ | 2840 | S063 |
| 127113o/FABBR_L.shp | PolyLineZ | 45 | S057 |
| 127113o/FABB_OLD.shp | PolygonZ | 28 | S063 |
| 127113o/FERROVIE.shp | PolyLineZ | 45 | S059 |
| 127113o/IDROGRAF.shp | PolyLineZ | 1015 | S059 |
| 127113o/INFRASTR.shp | PolyLineZ | 386 | S059 |
| 127113o/INFRAS_A.shp | PolygonZ | 68 | S062 |
| 127113o/LIM_AMM.shp | PolyLineZ | 44 | S059 |
| 127113o/NODOVIA.shp | PointZ | 565 | S004 |
| 127113o/OPERE.shp | PolyLineZ | 3658 | S059 |
| 127113o/PUNTI_Q.shp | PointZ | 838 | S005 |
| 127113o/SIM_CORN.shp | PointZ | 37 | S006 |
| 127113o/SIM_ELEM.shp | PointZ | 4531 | S008 |
| 127113o/SIM_FABB.shp | PointZ | 39 | S009 |
| 127113o/SIM_FERR.shp | PointZ | 4 | S010 |
| 127113o/SIM_IDRO.shp | PointZ | 173 | S011 |
| 127113o/SIM_INFR.shp | PointZ | 259 | S012 |
| 127113o/SIM_OPER.shp | PointZ | 238 | S013 |
| 127113o/SIM_VEGE.shp | PointZ | 3001 | S014 |
| 127113o/SIM_VIAB.shp | PointZ | 55 | S015 |
| 127113o/TESTI.shp | PointZ | 1049 | S016 |
| 127113o/VEGETAZ.shp | PolyLineZ | 253 | S059 |
| 127113o/VEGET_A.shp | PolygonZ | 57 | S062 |
| 127113o/VIABILIT.shp | PolyLineZ | 1701 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127114.zip`

Release 1994; 2215939 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127114o/ASTEVIA.shp | PolyLineZ | 708 | S060 |
| 127114o/CAM_FABB.shp | PolyLineZ | 24396 | S059 |
| 127114o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127114o/CURVE.shp | PolyLineZ | 1 | S065 |
| 127114o/DISCONT.shp | PolyLineZ | 6159 | S059 |
| 127114o/ELE_DIV.shp | PolyLineZ | 4298 | S059 |
| 127114o/err_a.shp | PolygonZ | 93 | S062 |
| 127114o/FABBRIC.shp | PolygonZ | 5113 | S063 |
| 127114o/FABBR_L.shp | PolyLineZ | 32 | S057 |
| 127114o/FABB_OLD.shp | PolygonZ | 51 | S063 |
| 127114o/FERROVIE.shp | PolyLineZ | 174 | S059 |
| 127114o/IDROGRAF.shp | PolyLineZ | 561 | S059 |
| 127114o/IDROGR_A.shp | PolygonZ | 1 | S062 |
| 127114o/INFRASTR.shp | PolyLineZ | 240 | S059 |
| 127114o/INFRAS_A.shp | PolygonZ | 48 | S062 |
| 127114o/LIM_AMM.shp | PolyLineZ | 38 | S059 |
| 127114o/NODOVIA.shp | PointZ | 719 | S004 |
| 127114o/OPERE.shp | PolyLineZ | 5 | S059 |
| 127114o/PUNTI_Q.shp | PointZ | 626 | S005 |
| 127114o/SIM_CORN.shp | PointZ | 34 | S006 |
| 127114o/SIM_ELEM.shp | PointZ | 3050 | S008 |
| 127114o/SIM_FABB.shp | PointZ | 14 | S009 |
| 127114o/SIM_FERR.shp | PointZ | 6 | S010 |
| 127114o/SIM_IDRO.shp | PointZ | 120 | S011 |
| 127114o/SIM_INFR.shp | PointZ | 145 | S012 |
| 127114o/SIM_OPER.shp | PointZ | 15 | S013 |
| 127114o/SIM_VEGE.shp | PointZ | 2179 | S014 |
| 127114o/TESTI.shp | PointZ | 813 | S016 |
| 127114o/VEGETAZ.shp | PolyLineZ | 437 | S059 |
| 127114o/VEGET_A.shp | PolygonZ | 10 | S062 |
| 127114o/VIABILIT.shp | PolyLineZ | 1786 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127121.zip`

Release 1994; 1291428 bytes; 92 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127121o/ASTEVIA.shp | PolyLineZ | 145 | S060 |
| 127121o/CAM_FABB.shp | PolyLineZ | 5839 | S059 |
| 127121o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 127121o/DISCONT.shp | PolyLineZ | 10558 | S059 |
| 127121o/ELE_DIV.shp | PolyLineZ | 1261 | S059 |
| 127121o/err_a.shp | PolygonZ | 37 | S062 |
| 127121o/err_t.shp | PointZ | 3 | S062 |
| 127121o/FABBRIC.shp | PolygonZ | 1069 | S063 |
| 127121o/FABBR_L.shp | PolyLineZ | 16 | S057 |
| 127121o/FABB_OLD.shp | PolygonZ | 18 | S063 |
| 127121o/IDROGRAF.shp | PolyLineZ | 1059 | S059 |
| 127121o/IDROGR_A.shp | PolygonZ | 1 | S062 |
| 127121o/INFRASTR.shp | PolyLineZ | 92 | S059 |
| 127121o/INFRAS_A.shp | PolygonZ | 16 | S062 |
| 127121o/NODOVIA.shp | PointZ | 189 | S004 |
| 127121o/OPERE.shp | PolyLineZ | 26 | S059 |
| 127121o/PUNTI_Q.shp | PointZ | 1192 | S005 |
| 127121o/SIM_CORN.shp | PointZ | 38 | S006 |
| 127121o/SIM_ELEM.shp | PointZ | 1028 | S008 |
| 127121o/SIM_FABB.shp | PointZ | 6 | S009 |
| 127121o/SIM_IDRO.shp | PointZ | 98 | S011 |
| 127121o/SIM_INFR.shp | PointZ | 78 | S012 |
| 127121o/SIM_OPER.shp | PointZ | 110 | S013 |
| 127121o/SIM_VEGE.shp | PointZ | 965 | S014 |
| 127121o/SIM_VIAB.shp | PointZ | 17 | S015 |
| 127121o/TESTI.shp | PointZ | 1301 | S016 |
| 127121o/VEGETAZ.shp | PolyLineZ | 82 | S059 |
| 127121o/VEGET_A.shp | PolygonZ | 28 | S062 |
| 127121o/VIABILIT.shp | PolyLineZ | 700 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127122.zip`

Release 1994; 138735 bytes; 59 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127122o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 127122o/CURVE.shp | PolyLineZ | 5 | S065 |
| 127122o/DISCONT.shp | PolyLineZ | 263 | S059 |
| 127122o/ELE_DIV.shp | PolyLineZ | 83 | S059 |
| 127122o/FABBRIC.shp | PolygonZ | 2 | S063 |
| 127122o/FERROVIE.shp | PolyLineZ | 3 | S059 |
| 127122o/IDROGRAF.shp | PolyLineZ | 24 | S059 |
| 127122o/INFRASTR.shp | PolyLineZ | 45 | S059 |
| 127122o/OPERE.shp | PolyLineZ | 2 | S059 |
| 127122o/PUNTI_Q.shp | PointZ | 1346 | S005 |
| 127122o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127122o/SIM_ELEM.shp | PointZ | 277 | S008 |
| 127122o/SIM_IDRO.shp | PointZ | 164 | S011 |
| 127122o/SIM_INFR.shp | PointZ | 43 | S012 |
| 127122o/SIM_OPER.shp | PointZ | 5 | S013 |
| 127122o/SIM_VEGE.shp | PointZ | 14 | S014 |
| 127122o/testi.shp | PointZ | 1446 | S016 |
| 127122o/VIABILIT.shp | PolyLineZ | 6 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127123.zip`

Release 1994; 871991 bytes; 104 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127123o/ASTEVIA.shp | PolyLineZ | 74 | S060 |
| 127123o/CAM_FABB.shp | PolyLineZ | 5948 | S059 |
| 127123o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127123o/CURVE.shp | PolyLineZ | 31 | S065 |
| 127123o/DISCONT.shp | PolyLineZ | 5271 | S059 |
| 127123o/ELE_DIV.shp | PolyLineZ | 436 | S059 |
| 127123o/err_a.shp | PolygonZ | 13 | S062 |
| 127123o/err_t.shp | PointZ | 2 | S062 |
| 127123o/FABBRIC.shp | PolygonZ | 646 | S063 |
| 127123o/FABBR_L.shp | PolyLineZ | 5 | S057 |
| 127123o/FABB_OLD.shp | PolygonZ | 79 | S063 |
| 127123o/FERROVIE.shp | PolyLineZ | 150 | S059 |
| 127123o/FERR_A.shp | PolygonZ | 2 | S059 |
| 127123o/IDROGRAF.shp | PolyLineZ | 236 | S059 |
| 127123o/IDROGR_A.shp | PolygonZ | 122 | S062 |
| 127123o/INFRASTR.shp | PolyLineZ | 257 | S059 |
| 127123o/INFRAS_A.shp | PolygonZ | 13 | S062 |
| 127123o/NODOVIA.shp | PointZ | 97 | S004 |
| 127123o/OPERE.shp | PolyLineZ | 121 | S059 |
| 127123o/PUNTI_Q.shp | PointZ | 1074 | S005 |
| 127123o/SIM_CORN.shp | PointZ | 35 | S006 |
| 127123o/SIM_ELEM.shp | PointZ | 1241 | S008 |
| 127123o/SIM_FABB.shp | PointZ | 77 | S009 |
| 127123o/SIM_FERR.shp | PointZ | 9 | S010 |
| 127123o/SIM_IDRO.shp | PointZ | 63 | S011 |
| 127123o/SIM_INFR.shp | PointZ | 237 | S012 |
| 127123o/SIM_OPER.shp | PointZ | 4 | S013 |
| 127123o/SIM_VEGE.shp | PointZ | 190 | S014 |
| 127123o/SIM_VIAB.shp | PointZ | 2 | S015 |
| 127123o/TESTI.shp | PointZ | 1175 | S016 |
| 127123o/VEGETAZ.shp | PolyLineZ | 2 | S059 |
| 127123o/VEGET_A.shp | PolygonZ | 2 | S062 |
| 127123o/VIABILIT.shp | PolyLineZ | 307 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127124.zip`

Release 1994; 2093568 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127124o/ASTEVIA.shp | PolyLineZ | 720 | S060 |
| 127124o/CAM_FABB.shp | PolyLineZ | 21591 | S059 |
| 127124o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127124o/CURVE.shp | PolyLineZ | 1 | S065 |
| 127124o/DISCONT.shp | PolyLineZ | 9642 | S059 |
| 127124o/ELE_DIV.shp | PolyLineZ | 3130 | S059 |
| 127124o/err_a.shp | PolygonZ | 135 | S062 |
| 127124o/err_t.shp | PointZ | 2 | S062 |
| 127124o/FABBRIC.shp | PolygonZ | 3732 | S063 |
| 127124o/FABBR_L.shp | PolyLineZ | 34 | S057 |
| 127124o/FABB_OLD.shp | PolygonZ | 61 | S063 |
| 127124o/FERROVIE.shp | PolyLineZ | 36 | S059 |
| 127124o/IDROGRAF.shp | PolyLineZ | 542 | S059 |
| 127124o/IDROGR_A.shp | PolygonZ | 29 | S062 |
| 127124o/INFRASTR.shp | PolyLineZ | 243 | S059 |
| 127124o/INFRAS_A.shp | PolygonZ | 42 | S062 |
| 127124o/NODOVIA.shp | PointZ | 719 | S004 |
| 127124o/OPERE.shp | PolyLineZ | 27 | S059 |
| 127124o/PUNTI_Q.shp | PointZ | 549 | S005 |
| 127124o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127124o/SIM_ELEM.shp | PointZ | 1695 | S008 |
| 127124o/SIM_FABB.shp | PointZ | 11 | S009 |
| 127124o/SIM_IDRO.shp | PointZ | 126 | S011 |
| 127124o/SIM_INFR.shp | PointZ | 264 | S012 |
| 127124o/SIM_OPER.shp | PointZ | 11 | S013 |
| 127124o/SIM_VEGE.shp | PointZ | 2193 | S014 |
| 127124o/SIM_VIAB.shp | PointZ | 2 | S015 |
| 127124o/TESTI.shp | PointZ | 787 | S016 |
| 127124o/VEGETAZ.shp | PolyLineZ | 249 | S059 |
| 127124o/VEGET_A.shp | PolygonZ | 4 | S062 |
| 127124o/VIABILIT.shp | PolyLineZ | 1968 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127151.zip`

Release 1994; 1353934 bytes; 83 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127151o/CAM_FABB.shp | PolyLineZ | 309 | S059 |
| 127151o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 127151o/CURVE.shp | PolyLineZ | 8 | S065 |
| 127151o/DISCONT.shp | PolyLineZ | 14930 | S059 |
| 127151o/ELE_DIV.shp | PolyLineZ | 599 | S059 |
| 127151o/FABBRIC.shp | PolygonZ | 844 | S063 |
| 127151o/FABBR_L.shp | PolyLineZ | 4 | S057 |
| 127151o/FERROVIE.shp | PolyLineZ | 33 | S059 |
| 127151o/IDROGRAF.shp | PolyLineZ | 755 | S059 |
| 127151o/IDROGR_A.shp | PolygonZ | 71 | S062 |
| 127151o/INFRASTR.shp | PolyLineZ | 7504 | S059 |
| 127151o/INFRAS_A.shp | PolygonZ | 816 | S062 |
| 127151o/lim_amm.shp | PolyLineZ | 21 | S059 |
| 127151o/OPERE.shp | PolyLineZ | 43 | S059 |
| 127151o/OPERE_A.shp | PolygonZ | 7 | S062 |
| 127151o/PUNTI_Q.shp | PointZ | 875 | S005 |
| 127151o/SIM_CORN.shp | PointZ | 35 | S006 |
| 127151o/SIM_ELEM.shp | PointZ | 2805 | S008 |
| 127151o/SIM_IDRO.shp | PointZ | 61 | S011 |
| 127151o/SIM_INFR.shp | PointZ | 90 | S012 |
| 127151o/SIM_OPER.shp | PointZ | 82 | S013 |
| 127151o/SIM_VEGE.shp | PointZ | 1016 | S014 |
| 127151o/testi.shp | PointZ | 985 | S016 |
| 127151o/VEGETAZ.shp | PolyLineZ | 39 | S059 |
| 127151o/VEGET_A.shp | PolygonZ | 10 | S062 |
| 127151o/VIABILIT.shp | PolyLineZ | 1025 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127152.zip`

Release 1994; 709558 bytes; 71 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127152o/CAM_FABB.shp | PolyLineZ | 3 | S059 |
| 127152o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127152o/CURVE.shp | PolyLineZ | 1 | S065 |
| 127152o/DISCONT.shp | PolyLineZ | 5024 | S059 |
| 127152o/ELE_DIV.shp | PolyLineZ | 6 | S059 |
| 127152o/FABBRIC.shp | PolygonZ | 15 | S063 |
| 127152o/IDROGRAF.shp | PolyLineZ | 1803 | S059 |
| 127152o/IDROGR_A.shp | PolygonZ | 1 | S062 |
| 127152o/INFRASTR.shp | PolyLineZ | 3 | S059 |
| 127152o/INQUADRA.shp | PointZ | 1 | S001 |
| 127152o/lim_amm.shp | PolyLineZ | 3 | S059 |
| 127152o/OPERE.shp | PolyLineZ | 5 | S059 |
| 127152o/PUNTI_Q.shp | PointZ | 1185 | S005 |
| 127152o/SIM_CORN.shp | PointZ | 35 | S006 |
| 127152o/SIM_ELEM.shp | PointZ | 6 | S008 |
| 127152o/SIM_IDRO.shp | PointZ | 4 | S011 |
| 127152o/SIM_INFR.shp | PointZ | 2 | S012 |
| 127152o/SIM_OPER.shp | PointZ | 6 | S013 |
| 127152o/SIM_VEGE.shp | PointZ | 175 | S014 |
| 127152o/testi.shp | PointZ | 1289 | S016 |
| 127152o/VEGETAZ.shp | PolyLineZ | 2 | S059 |
| 127152o/VIABILIT.shp | PolyLineZ | 88 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127154.zip`

Release 1994; 1173976 bytes; 83 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127154o/CAM_FABB.shp | PolyLineZ | 549 | S059 |
| 127154o/CORNICI.shp | PolyLineZ | 18 | S066 |
| 127154o/DISCONT.shp | PolyLineZ | 11778 | S059 |
| 127154o/ELE_DIV.shp | PolyLineZ | 1927 | S059 |
| 127154o/FABBRIC.shp | PolygonZ | 1700 | S063 |
| 127154o/FABBR_L.shp | PolyLineZ | 11 | S057 |
| 127154o/IDROGRAF.shp | PolyLineZ | 913 | S059 |
| 127154o/IDROGR_A.shp | PolygonZ | 1 | S062 |
| 127154o/INFRASTR.shp | PolyLineZ | 2678 | S059 |
| 127154o/INFRAS_A.shp | PolygonZ | 287 | S062 |
| 127154o/INQUADRA.shp | PointZ | 5 | S001 |
| 127154o/lim_amm.shp | PolyLineZ | 16 | S059 |
| 127154o/OPERE.shp | PolyLineZ | 17 | S059 |
| 127154o/PUNTI_Q.shp | PointZ | 798 | S005 |
| 127154o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127154o/SIM_ELEM.shp | PointZ | 3336 | S008 |
| 127154o/SIM_FABB.shp | PointZ | 19 | S009 |
| 127154o/SIM_IDRO.shp | PointZ | 35 | S011 |
| 127154o/SIM_INFR.shp | PointZ | 64 | S012 |
| 127154o/SIM_OPER.shp | PointZ | 51 | S013 |
| 127154o/SIM_VEGE.shp | PointZ | 1532 | S014 |
| 127154o/SIM_VIAB.shp | PointZ | 8 | S015 |
| 127154o/testi.shp | PointZ | 943 | S016 |
| 127154o/VEGETAZ.shp | PolyLineZ | 215 | S059 |
| 127154o/VEGET_A.shp | PolygonZ | 52 | S062 |
| 127154o/VIABILIT.shp | PolyLineZ | 1395 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127161.zip`

Release 1994; 2631537 bytes; 95 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127161o/ASTEVIA.shp | PolyLineZ | 1 | S060 |
| 127161o/CAM_FABB.shp | PolyLineZ | 31047 | S059 |
| 127161o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 127161o/CURVE.shp | PolyLineZ | 13 | S065 |
| 127161o/DISCONT.shp | PolyLineZ | 324 | S059 |
| 127161o/ELE_DIV.shp | PolyLineZ | 1182 | S059 |
| 127161o/err_a.shp | PolygonZ | 7617 | S062 |
| 127161o/FABBRIC.shp | PolygonZ | 2416 | S063 |
| 127161o/FABBR_L.shp | PolyLineZ | 66 | S057 |
| 127161o/FABB_OLD.shp | PolygonZ | 92 | S063 |
| 127161o/FERROVIE.shp | PolyLineZ | 113 | S059 |
| 127161o/FERR_A.shp | PolygonZ | 2 | S059 |
| 127161o/IDROGRAF.shp | PolyLineZ | 53 | S059 |
| 127161o/IDROGR_A.shp | PolygonZ | 4 | S062 |
| 127161o/INFRASTR.shp | PolyLineZ | 25 | S059 |
| 127161o/INFRAS_A.shp | PolygonZ | 7 | S062 |
| 127161o/NODOVIA.shp | PointZ | 4 | S004 |
| 127161o/OPERE.shp | PolyLineZ | 1075 | S059 |
| 127161o/PUNTI_Q.shp | PointZ | 1402 | S005 |
| 127161o/SIM_CORN.shp | PointZ | 35 | S006 |
| 127161o/SIM_ELEM.shp | PointZ | 1430 | S008 |
| 127161o/SIM_FABB.shp | PointZ | 50 | S009 |
| 127161o/SIM_FERR.shp | PointZ | 1 | S010 |
| 127161o/SIM_IDRO.shp | PointZ | 42 | S011 |
| 127161o/SIM_INFR.shp | PointZ | 14 | S012 |
| 127161o/SIM_OPER.shp | PointZ | 99 | S013 |
| 127161o/SIM_VEGE.shp | PointZ | 1266 | S014 |
| 127161o/TESTI.shp | PointZ | 1475 | S016 |
| 127161o/VEGETAZ.shp | PolyLineZ | 2 | S059 |
| 127161o/VIABILIT.shp | PolyLineZ | 507 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127162.zip`

Release 1994; 212542 bytes; 77 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127162o/CAM_FABB.shp | PolyLineZ | 504 | S059 |
| 127162o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127162o/CURVE.shp | PolyLineZ | 11 | S065 |
| 127162o/DISCONT.shp | PolyLineZ | 294 | S059 |
| 127162o/ELE_DIV.shp | PolyLineZ | 262 | S059 |
| 127162o/err_a.shp | PolygonZ | 33 | S062 |
| 127162o/FABBRIC.shp | PolygonZ | 107 | S063 |
| 127162o/FABBR_L.shp | PolyLineZ | 3 | S057 |
| 127162o/IDROGRAF.shp | PolyLineZ | 28 | S059 |
| 127162o/INFRASTR.shp | PolyLineZ | 8 | S059 |
| 127162o/INQUADRA.shp | PointZ | 1 | S001 |
| 127162o/OPERE.shp | PolyLineZ | 16 | S059 |
| 127162o/PUNTI_Q.shp | PointZ | 1460 | S005 |
| 127162o/SIM_CORN.shp | PointZ | 35 | S006 |
| 127162o/SIM_ELEM.shp | PointZ | 601 | S008 |
| 127162o/SIM_FABB.shp | PointZ | 1 | S009 |
| 127162o/SIM_IDRO.shp | PointZ | 154 | S011 |
| 127162o/SIM_INFR.shp | PointZ | 7 | S012 |
| 127162o/SIM_OPER.shp | PointZ | 61 | S013 |
| 127162o/SIM_VEGE.shp | PointZ | 124 | S014 |
| 127162o/testi.shp | PointZ | 1551 | S016 |
| 127162o/VEGETAZ.shp | PolyLineZ | 1 | S059 |
| 127162o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 127162o/VIABILIT.shp | PolyLineZ | 87 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127163.zip`

Release 1994; 242878 bytes; 80 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127163o/CAM_FABB.shp | PolyLineZ | 70 | S059 |
| 127163o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127163o/CURVE.shp | PolyLineZ | 8 | S065 |
| 127163o/DISCONT.shp | PolyLineZ | 1512 | S059 |
| 127163o/ELE_DIV.shp | PolyLineZ | 99 | S059 |
| 127163o/FABBRIC.shp | PolygonZ | 136 | S063 |
| 127163o/IDROGRAF.shp | PolyLineZ | 210 | S059 |
| 127163o/IDROGR_A.shp | PolygonZ | 15 | S062 |
| 127163o/INFRASTR.shp | PolyLineZ | 20 | S059 |
| 127163o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 127163o/INQUADRA.shp | PointZ | 7 | S001 |
| 127163o/lim_amm.shp | PolyLineZ | 21 | S059 |
| 127163o/OPERE.shp | PolyLineZ | 18 | S059 |
| 127163o/OPERE_A.shp | PolygonZ | 2 | S062 |
| 127163o/PUNTI_Q.shp | PointZ | 1150 | S005 |
| 127163o/SIM_CORN.shp | PointZ | 36 | S006 |
| 127163o/SIM_ELEM.shp | PointZ | 279 | S008 |
| 127163o/SIM_FABB.shp | PointZ | 3 | S009 |
| 127163o/SIM_IDRO.shp | PointZ | 246 | S011 |
| 127163o/SIM_INFR.shp | PointZ | 20 | S012 |
| 127163o/SIM_OPER.shp | PointZ | 25 | S013 |
| 127163o/SIM_VEGE.shp | PointZ | 87 | S014 |
| 127163o/testi.shp | PointZ | 1250 | S016 |
| 127163o/VEGETAZ.shp | PolyLineZ | 2 | S059 |
| 127163o/VIABILIT.shp | PolyLineZ | 107 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127164.zip`

Release 1994; 389937 bytes; 71 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127164o/CAM_FABB.shp | PolyLineZ | 51 | S059 |
| 127164o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 127164o/CURVE.shp | PolyLineZ | 10 | S065 |
| 127164o/DISCONT.shp | PolyLineZ | 2282 | S059 |
| 127164o/ELE_DIV.shp | PolyLineZ | 141 | S059 |
| 127164o/FABBRIC.shp | PolygonZ | 222 | S063 |
| 127164o/FERROVIE.shp | PolyLineZ | 7 | S059 |
| 127164o/IDROGRAF.shp | PolyLineZ | 97 | S059 |
| 127164o/IDROGR_A.shp | PolygonZ | 30 | S062 |
| 127164o/INFRASTR.shp | PolyLineZ | 2060 | S059 |
| 127164o/INFRAS_A.shp | PolygonZ | 230 | S062 |
| 127164o/OPERE.shp | PolyLineZ | 31 | S059 |
| 127164o/PUNTI_Q.shp | PointZ | 1247 | S005 |
| 127164o/SIM_CORN.shp | PointZ | 38 | S006 |
| 127164o/SIM_ELEM.shp | PointZ | 722 | S008 |
| 127164o/SIM_IDRO.shp | PointZ | 233 | S011 |
| 127164o/SIM_INFR.shp | PointZ | 31 | S012 |
| 127164o/SIM_OPER.shp | PointZ | 80 | S013 |
| 127164o/SIM_VEGE.shp | PointZ | 177 | S014 |
| 127164o/testi.shp | PointZ | 1341 | S016 |
| 127164o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 127164o/VIABILIT.shp | PolyLineZ | 196 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128091.zip`

Release 1994; 521864 bytes; 86 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128091o/ASTEVIA.shp | PolyLineZ | 16 | S060 |
| 128091o/CAM_FABB.shp | PolyLineZ | 1276 | S059 |
| 128091o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128091o/CURVE.shp | PolyLineZ | 351 | S065 |
| 128091o/DISCONT.shp | PolyLineZ | 3518 | S059 |
| 128091o/ELE_DIV.shp | PolyLineZ | 277 | S059 |
| 128091o/err_a.shp | PolygonZ | 2 | S062 |
| 128091o/FABBRIC.shp | PolygonZ | 276 | S063 |
| 128091o/FABBR_L.shp | PolyLineZ | 19 | S057 |
| 128091o/FABB_OLD.shp | PolygonZ | 1 | S063 |
| 128091o/IDROGRAF.shp | PolyLineZ | 1613 | S059 |
| 128091o/INFRASTR.shp | PolyLineZ | 6 | S059 |
| 128091o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 128091o/NODOVIA.shp | PointZ | 16 | S004 |
| 128091o/OPERE.shp | PolyLineZ | 53 | S059 |
| 128091o/PUNTI_Q.shp | PointZ | 1408 | S005 |
| 128091o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128091o/SIM_ELEM.shp | PointZ | 464 | S008 |
| 128091o/SIM_FABB.shp | PointZ | 10 | S009 |
| 128091o/SIM_IDRO.shp | PointZ | 239 | S011 |
| 128091o/SIM_INFR.shp | PointZ | 1 | S012 |
| 128091o/SIM_OPER.shp | PointZ | 20 | S013 |
| 128091o/SIM_VEGE.shp | PointZ | 270 | S014 |
| 128091o/TESTI.shp | PointZ | 1470 | S016 |
| 128091o/VEGETAZ.shp | PolyLineZ | 42 | S059 |
| 128091o/VEGET_A.shp | PolygonZ | 7 | S062 |
| 128091o/VIABILIT.shp | PolyLineZ | 97 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128093.zip`

Release 1994; 913798 bytes; 77 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128093o/CAM_FABB.shp | PolyLineZ | 9323 | S059 |
| 128093o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128093o/CURVE.shp | PolyLineZ | 21 | S065 |
| 128093o/DISCONT.shp | PolyLineZ | 1089 | S059 |
| 128093o/ELE_DIV.shp | PolyLineZ | 568 | S059 |
| 128093o/err_a.shp | PolygonZ | 2228 | S062 |
| 128093o/FABBRIC.shp | PolygonZ | 962 | S063 |
| 128093o/FABBR_L.shp | PolyLineZ | 65 | S057 |
| 128093o/FABB_OLD.shp | PolygonZ | 37 | S063 |
| 128093o/IDROGRAF.shp | PolyLineZ | 356 | S059 |
| 128093o/INFRASTR.shp | PolyLineZ | 24 | S059 |
| 128093o/INFRAS_A.shp | PolygonZ | 5 | S062 |
| 128093o/OPERE.shp | PolyLineZ | 280 | S059 |
| 128093o/PUNTI_Q.shp | PointZ | 1575 | S005 |
| 128093o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128093o/SIM_ELEM.shp | PointZ | 689 | S008 |
| 128093o/SIM_FABB.shp | PointZ | 13 | S009 |
| 128093o/SIM_IDRO.shp | PointZ | 406 | S011 |
| 128093o/SIM_INFR.shp | PointZ | 26 | S012 |
| 128093o/SIM_OPER.shp | PointZ | 9 | S013 |
| 128093o/SIM_VEGE.shp | PointZ | 516 | S014 |
| 128093o/TESTI.shp | PointZ | 1637 | S016 |
| 128093o/VEGETAZ.shp | PolyLineZ | 9 | S059 |
| 128093o/VIABILIT.shp | PolyLineZ | 134 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128094.zip`

Release 1994; 275155 bytes; 59 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128094o/ASTEVIA.shp | PolyLineZ | 6 | S060 |
| 128094o/CAM_FABB.shp | PolyLineZ | 21 | S059 |
| 128094o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128094o/DISCONT.shp | PolyLineZ | 1908 | S059 |
| 128094o/ELE_DIV.shp | PolyLineZ | 13 | S059 |
| 128094o/FABBRIC.shp | PolygonZ | 12 | S063 |
| 128094o/FABBR_L.shp | PolyLineZ | 2 | S057 |
| 128094o/IDROGRAF.shp | PolyLineZ | 169 | S059 |
| 128094o/NODOVIA.shp | PointZ | 11 | S004 |
| 128094o/OPERE.shp | PolyLineZ | 16 | S059 |
| 128094o/PUNTI_Q.shp | PointZ | 1274 | S005 |
| 128094o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128094o/SIM_ELEM.shp | PointZ | 135 | S008 |
| 128094o/SIM_IDRO.shp | PointZ | 121 | S011 |
| 128094o/SIM_VEGE.shp | PointZ | 29 | S014 |
| 128094o/TESTI.shp | PointZ | 1322 | S016 |
| 128094o/VEGETAZ.shp | PolyLineZ | 2 | S059 |
| 128094o/VIABILIT.shp | PolyLineZ | 31 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128102.zip`

Release 1994; 1677395 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128102o/AREE_TER.shp | PolygonZ | 1 | S062 |
| 128102o/ASTEVIA.shp | PolyLineZ | 267 | S060 |
| 128102o/CAM_FABB.shp | PolyLineZ | 9850 | S059 |
| 128102o/CAM_TER.shp | PolyLineZ | 1352 | S059 |
| 128102o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128102o/DISCONT.shp | PolyLineZ | 9031 | S059 |
| 128102o/ELE_DIV.shp | PolyLineZ | 1693 | S059 |
| 128102o/err_a.shp | PolygonZ | 127 | S062 |
| 128102o/FABBRIC.shp | PolygonZ | 2834 | S063 |
| 128102o/FABBR_L.shp | PolyLineZ | 26 | S057 |
| 128102o/FABB_OLD.shp | PolygonZ | 52 | S063 |
| 128102o/IDROGRAF.shp | PolyLineZ | 873 | S059 |
| 128102o/IDROGR_A.shp | PolygonZ | 16 | S062 |
| 128102o/INFRASTR.shp | PolyLineZ | 78 | S059 |
| 128102o/INFRAS_A.shp | PolygonZ | 19 | S062 |
| 128102o/INQUADRA.shp | PointZ | 6 | S001 |
| 128102o/NODOVIA.shp | PointZ | 286 | S004 |
| 128102o/OPERE.shp | PolyLineZ | 706 | S059 |
| 128102o/PUNTI_Q.shp | PointZ | 631 | S005 |
| 128102o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128102o/SIM_ELEM.shp | PointZ | 1322 | S008 |
| 128102o/SIM_FABB.shp | PointZ | 5 | S009 |
| 128102o/SIM_IDRO.shp | PointZ | 401 | S011 |
| 128102o/SIM_INFR.shp | PointZ | 89 | S012 |
| 128102o/SIM_OPER.shp | PointZ | 41 | S013 |
| 128102o/SIM_TER.shp | PointZ | 4 | S015 |
| 128102o/SIM_VEGE.shp | PointZ | 1903 | S014 |
| 128102o/TESTI.shp | PointZ | 856 | S016 |
| 128102o/VEGETAZ.shp | PolyLineZ | 1095 | S059 |
| 128102o/VEGET_A.shp | PolygonZ | 369 | S062 |
| 128102o/VIABILIT.shp | PolyLineZ | 2365 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128103.zip`

Release 1994; 1147908 bytes; 92 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128103o/ASTEVIA.shp | PolyLineZ | 247 | S060 |
| 128103o/CAM_FABB.shp | PolyLineZ | 6409 | S059 |
| 128103o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128103o/CURVE.shp | PolyLineZ | 541 | S065 |
| 128103o/DISCONT.shp | PolyLineZ | 7254 | S059 |
| 128103o/ELE_DIV.shp | PolyLineZ | 1211 | S059 |
| 128103o/err_a.shp | PolygonZ | 70 | S062 |
| 128103o/FABBRIC.shp | PolygonZ | 1589 | S063 |
| 128103o/FABBR_L.shp | PolyLineZ | 17 | S057 |
| 128103o/FABB_OLD.shp | PolygonZ | 21 | S063 |
| 128103o/IDROGRAF.shp | PolyLineZ | 818 | S059 |
| 128103o/IDROGR_A.shp | PolygonZ | 8 | S062 |
| 128103o/INFRASTR.shp | PolyLineZ | 47 | S059 |
| 128103o/INFRAS_A.shp | PolygonZ | 13 | S062 |
| 128103o/INQUADRA.shp | PointZ | 4 | S001 |
| 128103o/NODOVIA.shp | PointZ | 244 | S004 |
| 128103o/OPERE.shp | PolyLineZ | 72 | S059 |
| 128103o/PUNTI_Q.shp | PointZ | 1235 | S005 |
| 128103o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128103o/SIM_ELEM.shp | PointZ | 719 | S008 |
| 128103o/SIM_FABB.shp | PointZ | 13 | S009 |
| 128103o/SIM_IDRO.shp | PointZ | 288 | S011 |
| 128103o/SIM_INFR.shp | PointZ | 56 | S012 |
| 128103o/SIM_OPER.shp | PointZ | 86 | S013 |
| 128103o/SIM_VEGE.shp | PointZ | 1417 | S014 |
| 128103o/TESTI.shp | PointZ | 1388 | S016 |
| 128103o/VEGETAZ.shp | PolyLineZ | 550 | S059 |
| 128103o/VEGET_A.shp | PolygonZ | 116 | S062 |
| 128103o/VIABILIT.shp | PolyLineZ | 1351 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128104.zip`

Release 1994; 615423 bytes; 86 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128104o/ASTEVIA.shp | PolyLineZ | 4 | S060 |
| 128104o/CAM_FABB.shp | PolyLineZ | 1999 | S059 |
| 128104o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128104o/CURVE.shp | PolyLineZ | 1053 | S065 |
| 128104o/DISCONT.shp | PolyLineZ | 1201 | S059 |
| 128104o/ELE_DIV.shp | PolyLineZ | 225 | S059 |
| 128104o/err_a.shp | PolygonZ | 40 | S062 |
| 128104o/FABBRIC.shp | PolygonZ | 233 | S063 |
| 128104o/FABBR_L.shp | PolyLineZ | 2 | S057 |
| 128104o/FABB_OLD.shp | PolygonZ | 4 | S063 |
| 128104o/IDROGRAF.shp | PolyLineZ | 1206 | S059 |
| 128104o/IDROGR_A.shp | PolygonZ | 2 | S062 |
| 128104o/INQUADRA.shp | PointZ | 2 | S001 |
| 128104o/NODOVIA.shp | PointZ | 6 | S004 |
| 128104o/OPERE.shp | PolyLineZ | 43 | S059 |
| 128104o/PUNTI_Q.shp | PointZ | 1858 | S005 |
| 128104o/SIM_CORN.shp | PointZ | 35 | S006 |
| 128104o/SIM_ELEM.shp | PointZ | 44 | S008 |
| 128104o/SIM_FABB.shp | PointZ | 5 | S009 |
| 128104o/SIM_IDRO.shp | PointZ | 210 | S011 |
| 128104o/SIM_INFR.shp | PointZ | 1 | S012 |
| 128104o/SIM_OPER.shp | PointZ | 5 | S013 |
| 128104o/SIM_VEGE.shp | PointZ | 112 | S014 |
| 128104o/TESTI.shp | PointZ | 1940 | S016 |
| 128104o/VEGETAZ.shp | PolyLineZ | 3 | S059 |
| 128104o/VEGET_A.shp | PolygonZ | 1 | S062 |
| 128104o/VIABILIT.shp | PolyLineZ | 85 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128114.zip`

Release 1994; 897274 bytes; 95 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128114o/ASTEVIA.shp | PolyLineZ | 60 | S060 |
| 128114o/CAM_FABB.shp | PolyLineZ | 923 | S059 |
| 128114o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 128114o/CURVE.shp | PolyLineZ | 98 | S065 |
| 128114o/DISCONT.shp | PolyLineZ | 4113 | S059 |
| 128114o/ELE_DIV.shp | PolyLineZ | 80 | S059 |
| 128114o/err_a.shp | PolygonZ | 6 | S062 |
| 128114o/FABBRIC.shp | PolygonZ | 296 | S063 |
| 128114o/FABBR_L.shp | PolyLineZ | 1 | S057 |
| 128114o/FABB_OLD.shp | PolygonZ | 6 | S063 |
| 128114o/IDROGRAF.shp | PolyLineZ | 2139 | S059 |
| 128114o/IDROGR_A.shp | PolygonZ | 24 | S062 |
| 128114o/INFRASTR.shp | PolyLineZ | 12 | S059 |
| 128114o/INFRAS_A.shp | PolygonZ | 3 | S062 |
| 128114o/INQUADRA.shp | PointZ | 2 | S001 |
| 128114o/LIM_AMM.shp | PolyLineZ | 13 | S059 |
| 128114o/NODOVIA.shp | PointZ | 62 | S004 |
| 128114o/OPERE.shp | PolyLineZ | 4755 | S059 |
| 128114o/PUNTI_Q.shp | PointZ | 1645 | S005 |
| 128114o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128114o/SIM_ELEM.shp | PointZ | 84 | S008 |
| 128114o/SIM_FABB.shp | PointZ | 1 | S009 |
| 128114o/SIM_IDRO.shp | PointZ | 172 | S011 |
| 128114o/SIM_INFR.shp | PointZ | 5 | S012 |
| 128114o/SIM_OPER.shp | PointZ | 66 | S013 |
| 128114o/SIM_VEGE.shp | PointZ | 154 | S014 |
| 128114o/TESTI.shp | PointZ | 1752 | S016 |
| 128114o/VEGETAZ.shp | PolyLineZ | 319 | S059 |
| 128114o/VEGET_A.shp | PolygonZ | 141 | S062 |
| 128114o/VIABILIT.shp | PolyLineZ | 370 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128131.zip`

Release 1994; 558408 bytes; 92 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128131o/AREE_TER.shp | PolygonZ | 3 | S062 |
| 128131o/ASTEVIA.shp | PolyLineZ | 16 | S060 |
| 128131o/CAM_FABB.shp | PolyLineZ | 1967 | S059 |
| 128131o/CAM_TER.shp | PolyLineZ | 1137 | S059 |
| 128131o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128131o/CURVE.shp | PolyLineZ | 51 | S065 |
| 128131o/DISCONT.shp | PolyLineZ | 1030 | S059 |
| 128131o/ELE_DIV.shp | PolyLineZ | 358 | S059 |
| 128131o/err_a.shp | PolygonZ | 87 | S062 |
| 128131o/FABBRIC.shp | PolygonZ | 414 | S063 |
| 128131o/FABBR_L.shp | PolyLineZ | 32 | S057 |
| 128131o/IDROGRAF.shp | PolyLineZ | 261 | S059 |
| 128131o/INFRASTR.shp | PolyLineZ | 12 | S059 |
| 128131o/INFRAS_A.shp | PolygonZ | 3 | S062 |
| 128131o/INQUADRA.shp | PointZ | 1 | S001 |
| 128131o/NODOVIA.shp | PointZ | 33 | S004 |
| 128131o/OPERE.shp | PolyLineZ | 913 | S059 |
| 128131o/PUNTI_Q.shp | PointZ | 1904 | S005 |
| 128131o/SIM_CORN.shp | PointZ | 34 | S006 |
| 128131o/SIM_ELEM.shp | PointZ | 994 | S008 |
| 128131o/SIM_FABB.shp | PointZ | 10 | S009 |
| 128131o/SIM_IDRO.shp | PointZ | 134 | S011 |
| 128131o/SIM_INFR.shp | PointZ | 13 | S012 |
| 128131o/SIM_OPER.shp | PointZ | 13 | S013 |
| 128131o/SIM_VEGE.shp | PointZ | 606 | S014 |
| 128131o/TESTI.shp | PointZ | 1966 | S016 |
| 128131o/VEGETAZ.shp | PolyLineZ | 76 | S059 |
| 128131o/VEGET_A.shp | PolygonZ | 5 | S062 |
| 128131o/VIABILIT.shp | PolyLineZ | 410 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128132.zip`

Release 1994; 414247 bytes; 80 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128132o/AREE_TER.shp | PolygonZ | 4 | S062 |
| 128132o/ASTEVIA.shp | PolyLineZ | 93 | S060 |
| 128132o/CAM_FABB.shp | PolyLineZ | 3135 | S059 |
| 128132o/CAM_TER.shp | PolyLineZ | 1728 | S059 |
| 128132o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 128132o/CURVE.shp | PolyLineZ | 2 | S065 |
| 128132o/ELE_DIV.shp | PolyLineZ | 765 | S059 |
| 128132o/err_a.shp | PolygonZ | 177 | S062 |
| 128132o/FABBRIC.shp | PolygonZ | 635 | S063 |
| 128132o/FABBR_L.shp | PolyLineZ | 30 | S057 |
| 128132o/IDROGRAF.shp | PolyLineZ | 25 | S059 |
| 128132o/IDROGR_A.shp | PolygonZ | 4 | S062 |
| 128132o/INFRASTR.shp | PolyLineZ | 3 | S059 |
| 128132o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 128132o/NODOVIA.shp | PointZ | 160 | S004 |
| 128132o/OPERE.shp | PolyLineZ | 7 | S059 |
| 128132o/PUNTI_Q.shp | PointZ | 205 | S005 |
| 128132o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128132o/SIM_ELEM.shp | PointZ | 1107 | S008 |
| 128132o/SIM_FABB.shp | PointZ | 13 | S009 |
| 128132o/SIM_INFR.shp | PointZ | 1 | S012 |
| 128132o/SIM_VEGE.shp | PointZ | 327 | S014 |
| 128132o/TESTI.shp | PointZ | 254 | S016 |
| 128132o/VEGETAZ.shp | PolyLineZ | 37 | S059 |
| 128132o/VIABILIT.shp | PolyLineZ | 294 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128133.zip`

Release 1994; 963337 bytes; 95 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128133o/AREE_TER.shp | PolygonZ | 1 | S062 |
| 128133o/ASTEVIA.shp | PolyLineZ | 200 | S060 |
| 128133o/CAM_FABB.shp | PolyLineZ | 9104 | S059 |
| 128133o/CAM_TER.shp | PolyLineZ | 973 | S059 |
| 128133o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128133o/CURVE.shp | PolyLineZ | 18 | S065 |
| 128133o/DISCONT.shp | PolyLineZ | 11 | S059 |
| 128133o/ELE_DIV.shp | PolyLineZ | 1899 | S059 |
| 128133o/err_a.shp | PolygonZ | 456 | S062 |
| 128133o/err_l.shp | PolyLineZ | 6 | S062 |
| 128133o/FABBRIC.shp | PolygonZ | 1302 | S063 |
| 128133o/FABBR_L.shp | PolyLineZ | 42 | S057 |
| 128133o/IDROGRAF.shp | PolyLineZ | 180 | S059 |
| 128133o/IDROGR_A.shp | PolygonZ | 4 | S062 |
| 128133o/INFRASTR.shp | PolyLineZ | 2 | S059 |
| 128133o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 128133o/INQUADRA.shp | PointZ | 1 | S001 |
| 128133o/NODOVIA.shp | PointZ | 241 | S004 |
| 128133o/OPERE.shp | PolyLineZ | 121 | S059 |
| 128133o/PUNTI_Q.shp | PointZ | 1504 | S005 |
| 128133o/SIM_CORN.shp | PointZ | 38 | S006 |
| 128133o/SIM_ELEM.shp | PointZ | 2656 | S008 |
| 128133o/SIM_FABB.shp | PointZ | 5 | S009 |
| 128133o/SIM_IDRO.shp | PointZ | 601 | S011 |
| 128133o/SIM_INFR.shp | PointZ | 2 | S012 |
| 128133o/SIM_OPER.shp | PointZ | 8 | S013 |
| 128133o/SIM_VEGE.shp | PointZ | 845 | S014 |
| 128133o/TESTI.shp | PointZ | 1582 | S016 |
| 128133o/VEGETAZ.shp | PolyLineZ | 77 | S059 |
| 128133o/VIABILIT.shp | PolyLineZ | 501 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128134.zip`

Release 1994; 2423981 bytes; 80 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128134o/AREE_TER.shp | PolygonZ | 1 | S062 |
| 128134o/CAM_FABB.shp | PolyLineZ | 28717 | S059 |
| 128134o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128134o/CURVE.shp | PolyLineZ | 60 | S065 |
| 128134o/DISCONT.shp | PolyLineZ | 125 | S059 |
| 128134o/ELE_DIV.shp | PolyLineZ | 622 | S059 |
| 128134o/err_a.shp | PolygonZ | 7275 | S062 |
| 128134o/FABBRIC.shp | PolygonZ | 2362 | S063 |
| 128134o/FABBR_L.shp | PolyLineZ | 192 | S057 |
| 128134o/FABB_OLD.shp | PolygonZ | 27 | S063 |
| 128134o/IDROGRAF.shp | PolyLineZ | 83 | S059 |
| 128134o/IDROGR_A.shp | PolygonZ | 2 | S062 |
| 128134o/INQUADRA.shp | PointZ | 1 | S001 |
| 128134o/OPERE.shp | PolyLineZ | 1110 | S059 |
| 128134o/PUNTI_Q.shp | PointZ | 1772 | S005 |
| 128134o/SIM_CORN.shp | PointZ | 40 | S006 |
| 128134o/SIM_ELEM.shp | PointZ | 801 | S008 |
| 128134o/SIM_FABB.shp | PointZ | 57 | S009 |
| 128134o/SIM_IDRO.shp | PointZ | 452 | S011 |
| 128134o/SIM_OPER.shp | PointZ | 59 | S013 |
| 128134o/SIM_VEGE.shp | PointZ | 1085 | S014 |
| 128134o/TESTI.shp | PointZ | 1876 | S016 |
| 128134o/VEGETAZ.shp | PolyLineZ | 25 | S059 |
| 128134o/VEGET_A.shp | PolygonZ | 2 | S062 |
| 128134o/VIABILIT.shp | PolyLineZ | 488 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128143.zip`

Release 1994; 45689 bytes; 32 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128143o/CORNICI.shp | PolyLineZ | 28 | S066 |
| 128143o/ELE_DIV.shp | PolyLineZ | 1 | S059 |
| 128143o/FABBRIC.shp | PolygonZ | 1 | S063 |
| 128143o/IDROGRAF.shp | PolyLineZ | 7 | S059 |
| 128143o/OPERE.shp | PolyLineZ | 9 | S059 |
| 128143o/PUNTI_Q.shp | PointZ | 469 | S005 |
| 128143o/SIM_CORN.shp | PointZ | 36 | S006 |
| 128143o/SIM_ELEM.shp | PointZ | 22 | S008 |
| 128143o/testi.shp | PointZ | 553 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128144.zip`

Release 1994; 968737 bytes; 101 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128144o/AREE_TER.shp | PolygonZ | 2 | S062 |
| 128144o/ASTEVIA.shp | PolyLineZ | 235 | S060 |
| 128144o/CAM_FABB.shp | PolyLineZ | 4279 | S059 |
| 128144o/CAM_TER.shp | PolyLineZ | 4639 | S059 |
| 128144o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 128144o/CURVE.shp | PolyLineZ | 13 | S065 |
| 128144o/DISCONT.shp | PolyLineZ | 2470 | S059 |
| 128144o/ELE_DIV.shp | PolyLineZ | 484 | S059 |
| 128144o/err_a.shp | PolygonZ | 54 | S062 |
| 128144o/FABBRIC.shp | PolygonZ | 1477 | S063 |
| 128144o/FABBR_L.shp | PolyLineZ | 13 | S057 |
| 128144o/FABB_OLD.shp | PolygonZ | 23 | S063 |
| 128144o/IDROGRAF.shp | PolyLineZ | 582 | S059 |
| 128144o/IDROGR_A.shp | PolygonZ | 6 | S062 |
| 128144o/INFRASTR.shp | PolyLineZ | 26 | S059 |
| 128144o/INFRAS_A.shp | PolygonZ | 10 | S062 |
| 128144o/INQUADRA.shp | PointZ | 2 | S001 |
| 128144o/NODOVIA.shp | PointZ | 199 | S004 |
| 128144o/OPERE.shp | PolyLineZ | 21 | S059 |
| 128144o/PUNTI_Q.shp | PointZ | 1049 | S005 |
| 128144o/SIM_CORN.shp | PointZ | 37 | S006 |
| 128144o/SIM_ELEM.shp | PointZ | 582 | S008 |
| 128144o/SIM_FABB.shp | PointZ | 4 | S009 |
| 128144o/SIM_IDRO.shp | PointZ | 198 | S011 |
| 128144o/SIM_INFR.shp | PointZ | 27 | S012 |
| 128144o/SIM_OPER.shp | PointZ | 51 | S013 |
| 128144o/SIM_TER.shp | PointZ | 91 | S015 |
| 128144o/SIM_VEGE.shp | PointZ | 1846 | S014 |
| 128144o/TESTI.shp | PointZ | 1173 | S016 |
| 128144o/VEGETAZ.shp | PolyLineZ | 722 | S059 |
| 128144o/VEGET_A.shp | PolygonZ | 132 | S062 |
| 128144o/VIABILIT.shp | PolyLineZ | 1584 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148042.zip`

Release 1994; 338073 bytes; 71 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148042o/AREE_TER.shp | PolygonZ | 1 | S062 |
| 148042o/ASTEVIA.shp | PolyLineZ | 23 | S060 |
| 148042o/CAM_FABB.shp | PolyLineZ | 899 | S059 |
| 148042o/CAM_TER.shp | PolyLineZ | 1112 | S059 |
| 148042o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 148042o/CURVE.shp | PolyLineZ | 14 | S065 |
| 148042o/DISCONT.shp | PolyLineZ | 164 | S059 |
| 148042o/ELE_DIV.shp | PolyLineZ | 271 | S059 |
| 148042o/err_a.shp | PolygonZ | 59 | S062 |
| 148042o/FABBRIC.shp | PolygonZ | 161 | S063 |
| 148042o/IDROGRAF.shp | PolyLineZ | 60 | S059 |
| 148042o/NODOVIA.shp | PointZ | 39 | S004 |
| 148042o/OPERE.shp | PolyLineZ | 10 | S059 |
| 148042o/PUNTI_Q.shp | PointZ | 1570 | S005 |
| 148042o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148042o/SIM_ELEM.shp | PointZ | 545 | S008 |
| 148042o/SIM_IDRO.shp | PointZ | 178 | S011 |
| 148042o/SIM_VEGE.shp | PointZ | 149 | S014 |
| 148042o/TESTI.shp | PointZ | 1630 | S016 |
| 148042o/VEGETAZ.shp | PolyLineZ | 50 | S059 |
| 148042o/VEGET_A.shp | PolygonZ | 3 | S062 |
| 148042o/VIABILIT.shp | PolyLineZ | 227 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148081.zip`

Release 1994; 541824 bytes; 92 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148081o/AREE_TER.shp | PolygonZ | 2 | S062 |
| 148081o/ASTEVIA.shp | PolyLineZ | 55 | S060 |
| 148081o/CAM_FABB.shp | PolyLineZ | 1625 | S059 |
| 148081o/CAM_TER.shp | PolyLineZ | 2203 | S059 |
| 148081o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 148081o/CURVE.shp | PolyLineZ | 39 | S065 |
| 148081o/DISCONT.shp | PolyLineZ | 1844 | S059 |
| 148081o/ELE_DIV.shp | PolyLineZ | 375 | S059 |
| 148081o/err_a.shp | PolygonZ | 90 | S062 |
| 148081o/FABBRIC.shp | PolygonZ | 305 | S063 |
| 148081o/FABBR_L.shp | PolyLineZ | 8 | S057 |
| 148081o/IDROGRAF.shp | PolyLineZ | 96 | S059 |
| 148081o/INFRASTR.shp | PolyLineZ | 5 | S059 |
| 148081o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 148081o/INQUADRA.shp | PointZ | 1 | S001 |
| 148081o/LIM_AMM.shp | PolyLineZ | 5 | S059 |
| 148081o/NODOVIA.shp | PointZ | 86 | S004 |
| 148081o/OPERE.shp | PolyLineZ | 56 | S059 |
| 148081o/PUNTI_Q.shp | PointZ | 1515 | S005 |
| 148081o/SIM_CORN.shp | PointZ | 36 | S006 |
| 148081o/SIM_ELEM.shp | PointZ | 915 | S008 |
| 148081o/SIM_IDRO.shp | PointZ | 140 | S011 |
| 148081o/SIM_INFR.shp | PointZ | 2 | S012 |
| 148081o/SIM_OPER.shp | PointZ | 61 | S013 |
| 148081o/SIM_VEGE.shp | PointZ | 552 | S014 |
| 148081o/TESTI.shp | PointZ | 1564 | S016 |
| 148081o/VEGETAZ.shp | PolyLineZ | 74 | S059 |
| 148081o/VEGET_A.shp | PolygonZ | 2 | S062 |
| 148081o/VIABILIT.shp | PolyLineZ | 347 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148082.zip`

Release 1994; 344899 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148082o/AREE_TER.shp | PolygonZ | 2 | S062 |
| 148082o/ASTEVIA.shp | PolyLineZ | 25 | S060 |
| 148082o/CAM_FABB.shp | PolyLineZ | 1799 | S059 |
| 148082o/CAM_TER.shp | PolyLineZ | 755 | S059 |
| 148082o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 148082o/CURVE.shp | PolyLineZ | 6 | S065 |
| 148082o/DISCONT.shp | PolyLineZ | 1236 | S059 |
| 148082o/ELE_DIV.shp | PolyLineZ | 430 | S059 |
| 148082o/err_a.shp | PolygonZ | 6 | S062 |
| 148082o/err_l.shp | PolyLineZ | 2 | S062 |
| 148082o/FABBRIC.shp | PolygonZ | 301 | S063 |
| 148082o/FABBR_L.shp | PolyLineZ | 8 | S057 |
| 148082o/FABB_OLD.shp | PolygonZ | 7 | S063 |
| 148082o/IDROGRAF.shp | PolyLineZ | 171 | S059 |
| 148082o/INFRASTR.shp | PolyLineZ | 3 | S059 |
| 148082o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 148082o/INQUADRA.shp | PointZ | 2 | S001 |
| 148082o/LIM_AMM.shp | PolyLineZ | 6 | S059 |
| 148082o/NODOVIA.shp | PointZ | 40 | S004 |
| 148082o/OPERE.shp | PolyLineZ | 22 | S059 |
| 148082o/PUNTI_Q.shp | PointZ | 854 | S005 |
| 148082o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148082o/SIM_ELEM.shp | PointZ | 413 | S008 |
| 148082o/SIM_FABB.shp | PointZ | 9 | S009 |
| 148082o/SIM_IDRO.shp | PointZ | 66 | S011 |
| 148082o/SIM_INFR.shp | PointZ | 1 | S012 |
| 148082o/SIM_OPER.shp | PointZ | 62 | S013 |
| 148082o/SIM_VEGE.shp | PointZ | 66 | S014 |
| 148082o/TESTI.shp | PointZ | 914 | S016 |
| 148082o/VEGETAZ.shp | PolyLineZ | 5 | S059 |
| 148082o/VIABILIT.shp | PolyLineZ | 153 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148121.zip`

Release 1994; 312150 bytes; 98 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148121o/AREE_TER.shp | PolygonZ | 1 | S062 |
| 148121o/ASTEVIA.shp | PolyLineZ | 5 | S060 |
| 148121o/CAM_FABB.shp | PolyLineZ | 2140 | S059 |
| 148121o/CAM_TER.shp | PolyLineZ | 622 | S059 |
| 148121o/CORNICI.shp | PolyLineZ | 15 | S066 |
| 148121o/CURVE.shp | PolyLineZ | 3 | S065 |
| 148121o/DISCONT.shp | PolyLineZ | 903 | S059 |
| 148121o/ELE_DIV.shp | PolyLineZ | 520 | S059 |
| 148121o/err_a.shp | PolygonZ | 4 | S062 |
| 148121o/err_l.shp | PolyLineZ | 4 | S062 |
| 148121o/FABBRIC.shp | PolygonZ | 339 | S063 |
| 148121o/FABBR_L.shp | PolyLineZ | 1 | S057 |
| 148121o/FABB_OLD.shp | PolygonZ | 9 | S063 |
| 148121o/IDROGRAF.shp | PolyLineZ | 246 | S059 |
| 148121o/INFRASTR.shp | PolyLineZ | 2 | S059 |
| 148121o/INFRAS_A.shp | PolygonZ | 1 | S062 |
| 148121o/INQUADRA.shp | PointZ | 1 | S001 |
| 148121o/LIM_AMM.shp | PolyLineZ | 5 | S059 |
| 148121o/NODOVIA.shp | PointZ | 13 | S004 |
| 148121o/OPERE.shp | PolyLineZ | 179 | S059 |
| 148121o/PUNTI_Q.shp | PointZ | 540 | S005 |
| 148121o/SIM_CORN.shp | PointZ | 34 | S006 |
| 148121o/SIM_ELEM.shp | PointZ | 418 | S008 |
| 148121o/SIM_FABB.shp | PointZ | 6 | S009 |
| 148121o/SIM_IDRO.shp | PointZ | 111 | S011 |
| 148121o/SIM_INFR.shp | PointZ | 1 | S012 |
| 148121o/SIM_OPER.shp | PointZ | 4 | S013 |
| 148121o/SIM_VEGE.shp | PointZ | 72 | S014 |
| 148121o/TESTI.shp | PointZ | 593 | S016 |
| 148121o/VEGETAZ.shp | PolyLineZ | 1 | S059 |
| 148121o/VIABILIT.shp | PolyLineZ | 132 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148122.zip`

Release 1994; 229930 bytes; 86 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148122o/AREE_TER.shp | PolygonZ | 1 | S062 |
| 148122o/ASTEVIA.shp | PolyLineZ | 3 | S060 |
| 148122o/CAM_FABB.shp | PolyLineZ | 1757 | S059 |
| 148122o/CAM_TER.shp | PolyLineZ | 682 | S059 |
| 148122o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 148122o/CURVE.shp | PolyLineZ | 12 | S065 |
| 148122o/DISCONT.shp | PolyLineZ | 165 | S059 |
| 148122o/ELE_DIV.shp | PolyLineZ | 311 | S059 |
| 148122o/err_a.shp | PolygonZ | 9 | S062 |
| 148122o/err_l.shp | PolyLineZ | 3 | S062 |
| 148122o/FABBRIC.shp | PolygonZ | 262 | S063 |
| 148122o/FABB_OLD.shp | PolygonZ | 1 | S063 |
| 148122o/IDROGRAF.shp | PolyLineZ | 26 | S059 |
| 148122o/INFRASTR.shp | PolyLineZ | 4 | S059 |
| 148122o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 148122o/NODOVIA.shp | PointZ | 8 | S004 |
| 148122o/OPERE.shp | PolyLineZ | 66 | S059 |
| 148122o/PUNTI_Q.shp | PointZ | 497 | S005 |
| 148122o/SIM_CORN.shp | PointZ | 37 | S006 |
| 148122o/SIM_ELEM.shp | PointZ | 138 | S008 |
| 148122o/SIM_FABB.shp | PointZ | 10 | S009 |
| 148122o/SIM_IDRO.shp | PointZ | 90 | S011 |
| 148122o/SIM_INFR.shp | PointZ | 2 | S012 |
| 148122o/SIM_OPER.shp | PointZ | 28 | S013 |
| 148122o/SIM_VEGE.shp | PointZ | 18 | S014 |
| 148122o/TESTI.shp | PointZ | 544 | S016 |
| 148122o/VIABILIT.shp | PolyLineZ | 69 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\149013.zip`

Release 1994; 289240 bytes; 74 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 149013o/AREE_TER.shp | PolygonZ | 1 | S062 |
| 149013o/ASTEVIA.shp | PolyLineZ | 13 | S060 |
| 149013o/cam_fabb.shp | PolyLineZ | 1412 | S059 |
| 149013o/CAM_TER.shp | PolyLineZ | 287 | S059 |
| 149013o/CORNICI.shp | PolyLineZ | 13 | S066 |
| 149013o/CURVE.shp | PolyLineZ | 3 | S065 |
| 149013o/DISCONT.shp | PolyLineZ | 1043 | S059 |
| 149013o/ELE_DIV.shp | PolyLineZ | 454 | S059 |
| 149013o/err_a.shp | PolygonZ | 273 | S062 |
| 149013o/FABBRIC.shp | PolygonZ | 273 | S063 |
| 149013o/IDROGRAF.shp | PolyLineZ | 113 | S059 |
| 149013o/INQUADRA.shp | PointZ | 1 | S001 |
| 149013o/NODOVIA.shp | PointZ | 24 | S004 |
| 149013o/OPERE.shp | PolyLineZ | 11 | S059 |
| 149013o/PUNTI_Q.shp | PointZ | 141 | S005 |
| 149013o/SIM_CORN.shp | PointZ | 36 | S006 |
| 149013o/SIM_ELEM.shp | PointZ | 659 | S008 |
| 149013o/SIM_FABB.shp | PointZ | 5 | S009 |
| 149013o/SIM_IDRO.shp | PointZ | 55 | S011 |
| 149013o/SIM_VEGE.shp | PointZ | 112 | S014 |
| 149013o/TESTI.shp | PointZ | 181 | S016 |
| 149013o/VEGETAZ.shp | PolyLineZ | 55 | S059 |
| 149013o/VIABILIT.shp | PolyLineZ | 254 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\149014.zip`

Release 1994; 607738 bytes; 83 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 149014o/AREE_TER.shp | PolygonZ | 2 | S062 |
| 149014o/ASTEVIA.shp | PolyLineZ | 58 | S060 |
| 149014o/cam_fabb.shp | PolyLineZ | 3876 | S059 |
| 149014o/CAM_TER.shp | PolyLineZ | 652 | S059 |
| 149014o/CORNICI.shp | PolyLineZ | 14 | S066 |
| 149014o/CURVE.shp | PolyLineZ | 5 | S065 |
| 149014o/DISCONT.shp | PolyLineZ | 1107 | S059 |
| 149014o/ELE_DIV.shp | PolyLineZ | 1265 | S059 |
| 149014o/err_a.shp | PolygonZ | 381 | S062 |
| 149014o/FABBRIC.shp | PolygonZ | 664 | S063 |
| 149014o/FABBR_L.shp | PolyLineZ | 27 | S057 |
| 149014o/IDROGRAF.shp | PolyLineZ | 65 | S059 |
| 149014o/IDROGR_A.shp | PolygonZ | 2 | S062 |
| 149014o/INFRASTR.shp | PolyLineZ | 5 | S059 |
| 149014o/INFRAS_A.shp | PolygonZ | 2 | S062 |
| 149014o/NODOVIA.shp | PointZ | 89 | S004 |
| 149014o/OPERE.shp | PolyLineZ | 28 | S059 |
| 149014o/PUNTI_Q.shp | PointZ | 648 | S005 |
| 149014o/SIM_CORN.shp | PointZ | 35 | S006 |
| 149014o/SIM_ELEM.shp | PointZ | 2136 | S008 |
| 149014o/SIM_IDRO.shp | PointZ | 3 | S011 |
| 149014o/SIM_INFR.shp | PointZ | 2 | S012 |
| 149014o/SIM_VEGE.shp | PointZ | 423 | S014 |
| 149014o/TESTI.shp | PointZ | 693 | S016 |
| 149014o/VEGETAZ.shp | PolyLineZ | 114 | S059 |
| 149014o/VIABILIT.shp | PolyLineZ | 479 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\149054.zip`

Release 1994; 58203 bytes; 32 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 149054o/CORNICI.shp | PolyLineZ | 29 | S066 |
| 149054o/ELE_DIV.shp | PolyLineZ | 3 | S059 |
| 149054o/FABBRIC.shp | PolygonZ | 6 | S063 |
| 149054o/idrograf.shp | PolyLineZ | 6 | S059 |
| 149054o/PUNTI_Q.shp | PointZ | 639 | S005 |
| 149054o/SIM_CORN.shp | PointZ | 34 | S006 |
| 149054o/SIM_ELEM.shp | PointZ | 104 | S008 |
| 149054o/SIM_IDRO.shp | PointZ | 4 | S011 |
| 149054o/testi.shp | PointZ | 723 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127033.zip`

Release 2005; 2516393 bytes; 105 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127033o/ASTEFLU.Shp | PolyLineZ | 88 | S064 |
| 127033o/ASTEVIA.Shp | PolyLineZ | 544 | S060 |
| 127033o/CAM_FABB.Shp | PolyLineZ | 968 | S059 |
| 127033o/CORNICI.Shp | PolyLineZ | 593 | S066 |
| 127033o/DISCONT.Shp | PolyLineZ | 178 | S059 |
| 127033o/ELE_DIV.Shp | PolyLineZ | 2521 | S059 |
| 127033o/err_l.Shp | PolyLineZ | 421 | S062 |
| 127033o/FABBRIC.Shp | PolygonZ | 2603 | S063 |
| 127033o/FABBR_L.Shp | PolyLineZ | 12679 | S057 |
| 127033o/IDROGRAF.Shp | PolyLineZ | 978 | S059 |
| 127033o/IDROGR_A.Shp | PolygonZ | 44 | S062 |
| 127033o/INFRASTR.Shp | PolyLineZ | 86 | S059 |
| 127033o/INFRAS_A.Shp | PolygonZ | 17 | S062 |
| 127033o/INQUADRA.Shp | PointZ | 4 | S001 |
| 127033o/LIMAMM_A.Shp | PolygonZ | 9 | S061 |
| 127033o/LIM_AMM.Shp | PolyLineZ | 48 | S059 |
| 127033o/NODOFLU.Shp | PointZ | 139 | S003 |
| 127033o/NODOVIA.Shp | PointZ | 1637 | S004 |
| 127033o/OPERE.Shp | PolyLineZ | 7 | S059 |
| 127033o/PUNTI_Q.Shp | PointZ | 2973 | S005 |
| 127033o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 127033o/SIM_DISC.Shp | PointZ | 2560 | S007 |
| 127033o/SIM_ELEM.Shp | PointZ | 3662 | S008 |
| 127033o/SIM_FABB.Shp | PointZ | 2587 | S009 |
| 127033o/SIM_IDRO.Shp | PointZ | 185 | S011 |
| 127033o/SIM_INFR.Shp | PointZ | 129 | S012 |
| 127033o/SIM_OPER.Shp | PointZ | 8 | S013 |
| 127033o/SIM_VEGE.Shp | PointZ | 1923 | S014 |
| 127033o/SIM_VIAB.Shp | PointZ | 2 | S015 |
| 127033o/TESTI.Shp | PointZ | 789 | S016 |
| 127033o/VEGETAZ.Shp | PolyLineZ | 436 | S059 |
| 127033o/VEGET_A.Shp | PolygonZ | 94 | S062 |
| 127033o/VIABILIT.Shp | PolyLineZ | 3475 | S059 |
| 127033o/VIAB_A.Shp | PolygonZ | 666 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127071.zip`

Release 2005; 1277293 bytes; 117 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127071o_p/ASTEFER.Shp | PolyLineZ | 16 | S058 |
| 127071o_p/ASTEFLU.Shp | PolyLineZ | 46 | S064 |
| 127071o_p/ASTEVIA.Shp | PolyLineZ | 215 | S060 |
| 127071o_p/CAM_FABB.Shp | PolyLineZ | 241 | S059 |
| 127071o_p/CORNICI.Shp | PolyLineZ | 582 | S066 |
| 127071o_p/DISCONT.Shp | PolyLineZ | 116 | S059 |
| 127071o_p/ELE_DIV.Shp | PolyLineZ | 700 | S059 |
| 127071o_p/err_l.Shp | PolyLineZ | 46 | S062 |
| 127071o_p/FABBRIC.Shp | PolygonZ | 858 | S063 |
| 127071o_p/FABBR_L.Shp | PolyLineZ | 4696 | S057 |
| 127071o_p/FERROVIE.Shp | PolyLineZ | 17 | S059 |
| 127071o_p/IDROGRAF.Shp | PolyLineZ | 485 | S059 |
| 127071o_p/IDROGR_A.Shp | PolygonZ | 49 | S062 |
| 127071o_p/INFRASTR.Shp | PolyLineZ | 47 | S059 |
| 127071o_p/INFRAS_A.Shp | PolygonZ | 10 | S062 |
| 127071o_p/INQUADRA.Shp | PointZ | 1 | S001 |
| 127071o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 127071o_p/LIM_AMM.Shp | PolyLineZ | 30 | S059 |
| 127071o_p/NODOFER.Shp | PointZ | 26 | S002 |
| 127071o_p/NODOFLU.Shp | PointZ | 77 | S003 |
| 127071o_p/NODOVIA.Shp | PointZ | 506 | S004 |
| 127071o_p/OPERE.Shp | PolyLineZ | 66 | S059 |
| 127071o_p/PUNTI_Q.Shp | PointZ | 1250 | S005 |
| 127071o_p/SIM_CORN.Shp | PointZ | 39 | S006 |
| 127071o_p/SIM_DISC.Shp | PointZ | 7448 | S007 |
| 127071o_p/SIM_ELEM.Shp | PointZ | 1665 | S008 |
| 127071o_p/SIM_FABB.Shp | PointZ | 849 | S009 |
| 127071o_p/SIM_FERR.Shp | PointZ | 2 | S010 |
| 127071o_p/SIM_IDRO.Shp | PointZ | 70 | S011 |
| 127071o_p/SIM_INFR.Shp | PointZ | 53 | S012 |
| 127071o_p/SIM_OPER.Shp | PointZ | 113 | S013 |
| 127071o_p/SIM_VEGE.Shp | PointZ | 1490 | S014 |
| 127071o_p/SIM_VIAB.Shp | PointZ | 14 | S015 |
| 127071o_p/TESTI.Shp | PointZ | 759 | S016 |
| 127071o_p/VEGETAZ.Shp | PolyLineZ | 58 | S059 |
| 127071o_p/VEGET_A.Shp | PolygonZ | 43 | S062 |
| 127071o_p/VIABILIT.Shp | PolyLineZ | 1231 | S059 |
| 127071o_p/VIAB_A.Shp | PolygonZ | 280 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127073.zip`

Release 2005; 2260601 bytes; 111 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127073o_p/ASTEFER.Shp | PolyLineZ | 16 | S058 |
| 127073o_p/ASTEFLU.Shp | PolyLineZ | 39 | S064 |
| 127073o_p/ASTEVIA.Shp | PolyLineZ | 367 | S060 |
| 127073o_p/CAM_FABB.Shp | PolyLineZ | 906 | S059 |
| 127073o_p/CORNICI.Shp | PolyLineZ | 585 | S066 |
| 127073o_p/DISCONT.Shp | PolyLineZ | 459 | S059 |
| 127073o_p/ELE_DIV.Shp | PolyLineZ | 2127 | S059 |
| 127073o_p/err_l.Shp | PolyLineZ | 180 | S062 |
| 127073o_p/FABBRIC.Shp | PolygonZ | 2210 | S063 |
| 127073o_p/FABBR_L.Shp | PolyLineZ | 8057 | S057 |
| 127073o_p/FERROVIE.Shp | PolyLineZ | 29 | S059 |
| 127073o_p/IDROGRAF.Shp | PolyLineZ | 537 | S059 |
| 127073o_p/IDROGR_A.Shp | PolygonZ | 9 | S062 |
| 127073o_p/INFRASTR.Shp | PolyLineZ | 72 | S059 |
| 127073o_p/INFRAS_A.Shp | PolygonZ | 21 | S062 |
| 127073o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 127073o_p/LIM_AMM.Shp | PolyLineZ | 113 | S059 |
| 127073o_p/NODOFER.Shp | PointZ | 24 | S002 |
| 127073o_p/NODOFLU.Shp | PointZ | 63 | S003 |
| 127073o_p/NODOVIA.Shp | PointZ | 950 | S004 |
| 127073o_p/OPERE.Shp | PolyLineZ | 17 | S059 |
| 127073o_p/PUNTI_Q.Shp | PointZ | 2610 | S005 |
| 127073o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 127073o_p/SIM_DISC.Shp | PointZ | 7774 | S007 |
| 127073o_p/SIM_ELEM.Shp | PointZ | 3375 | S008 |
| 127073o_p/SIM_FABB.Shp | PointZ | 2138 | S009 |
| 127073o_p/SIM_IDRO.Shp | PointZ | 68 | S011 |
| 127073o_p/SIM_INFR.Shp | PointZ | 76 | S012 |
| 127073o_p/SIM_OPER.Shp | PointZ | 8 | S013 |
| 127073o_p/SIM_VEGE.Shp | PointZ | 3628 | S014 |
| 127073o_p/SIM_VIAB.Shp | PointZ | 4 | S015 |
| 127073o_p/TESTI.Shp | PointZ | 828 | S016 |
| 127073o_p/VEGETAZ.Shp | PolyLineZ | 476 | S059 |
| 127073o_p/VEGET_A.Shp | PolygonZ | 22 | S062 |
| 127073o_p/VIABILIT.Shp | PolyLineZ | 2745 | S059 |
| 127073o_p/VIAB_A.Shp | PolygonZ | 491 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127074.zip`

Release 2005; 1224429 bytes; 96 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127074o_p/ASTEFLU.Shp | PolyLineZ | 33 | S064 |
| 127074o_p/ASTEVIA.Shp | PolyLineZ | 230 | S060 |
| 127074o_p/CAM_FABB.Shp | PolyLineZ | 388 | S059 |
| 127074o_p/CORNICI.Shp | PolyLineZ | 590 | S066 |
| 127074o_p/DISCONT.Shp | PolyLineZ | 289 | S059 |
| 127074o_p/ELE_DIV.Shp | PolyLineZ | 674 | S059 |
| 127074o_p/err_l.Shp | PolyLineZ | 107 | S062 |
| 127074o_p/FABBRIC.Shp | PolygonZ | 946 | S063 |
| 127074o_p/FABBR_L.Shp | PolyLineZ | 4084 | S057 |
| 127074o_p/IDROGRAF.Shp | PolyLineZ | 289 | S059 |
| 127074o_p/IDROGR_A.Shp | PolygonZ | 22 | S062 |
| 127074o_p/INFRASTR.Shp | PolyLineZ | 110 | S059 |
| 127074o_p/INFRAS_A.Shp | PolygonZ | 22 | S062 |
| 127074o_p/LIMAMM_A.Shp | PolygonZ | 5 | S061 |
| 127074o_p/LIM_AMM.Shp | PolyLineZ | 75 | S059 |
| 127074o_p/NODOFLU.Shp | PointZ | 54 | S003 |
| 127074o_p/NODOVIA.Shp | PointZ | 528 | S004 |
| 127074o_p/PUNTI_Q.Shp | PointZ | 1230 | S005 |
| 127074o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 127074o_p/SIM_DISC.Shp | PointZ | 4676 | S007 |
| 127074o_p/SIM_ELEM.Shp | PointZ | 1325 | S008 |
| 127074o_p/SIM_FABB.Shp | PointZ | 933 | S009 |
| 127074o_p/SIM_IDRO.Shp | PointZ | 43 | S011 |
| 127074o_p/SIM_INFR.Shp | PointZ | 151 | S012 |
| 127074o_p/SIM_VEGE.Shp | PointZ | 2017 | S014 |
| 127074o_p/SIM_VIAB.Shp | PointZ | 1 | S015 |
| 127074o_p/TESTI.Shp | PointZ | 636 | S016 |
| 127074o_p/VEGETAZ.Shp | PolyLineZ | 219 | S059 |
| 127074o_p/VEGET_A.Shp | PolygonZ | 23 | S062 |
| 127074o_p/VIABILIT.Shp | PolyLineZ | 1262 | S059 |
| 127074o_p/VIAB_A.Shp | PolygonZ | 266 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127081.zip`

Release 2005; 1225707 bytes; 111 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127081o_p/ASTEFER.Shp | PolyLineZ | 8 | S058 |
| 127081o_p/ASTEFLU.Shp | PolyLineZ | 42 | S064 |
| 127081o_p/ASTEVIA.Shp | PolyLineZ | 202 | S060 |
| 127081o_p/CAM_FABB.Shp | PolyLineZ | 278 | S059 |
| 127081o_p/CORNICI.Shp | PolyLineZ | 587 | S066 |
| 127081o_p/DISCONT.Shp | PolyLineZ | 216 | S059 |
| 127081o_p/ELE_DIV.Shp | PolyLineZ | 511 | S059 |
| 127081o_p/err_l.Shp | PolyLineZ | 89 | S062 |
| 127081o_p/FABBRIC.Shp | PolygonZ | 626 | S063 |
| 127081o_p/FABBR_L.Shp | PolyLineZ | 5028 | S057 |
| 127081o_p/FERROVIE.Shp | PolyLineZ | 22 | S059 |
| 127081o_p/IDROGRAF.Shp | PolyLineZ | 424 | S059 |
| 127081o_p/IDROGR_A.Shp | PolygonZ | 28 | S062 |
| 127081o_p/INFRASTR.Shp | PolyLineZ | 81 | S059 |
| 127081o_p/INFRAS_A.Shp | PolygonZ | 16 | S062 |
| 127081o_p/INQUADRA.Shp | PointZ | 1 | S001 |
| 127081o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 127081o_p/LIM_AMM.Shp | PolyLineZ | 8 | S059 |
| 127081o_p/NODOFER.Shp | PointZ | 14 | S002 |
| 127081o_p/NODOFLU.Shp | PointZ | 70 | S003 |
| 127081o_p/NODOVIA.Shp | PointZ | 428 | S004 |
| 127081o_p/OPERE.Shp | PolyLineZ | 11 | S059 |
| 127081o_p/PUNTI_Q.Shp | PointZ | 963 | S005 |
| 127081o_p/SIM_CORN.Shp | PointZ | 41 | S006 |
| 127081o_p/SIM_DISC.Shp | PointZ | 9342 | S007 |
| 127081o_p/SIM_ELEM.Shp | PointZ | 939 | S008 |
| 127081o_p/SIM_FABB.Shp | PointZ | 609 | S009 |
| 127081o_p/SIM_IDRO.Shp | PointZ | 15 | S011 |
| 127081o_p/SIM_INFR.Shp | PointZ | 70 | S012 |
| 127081o_p/SIM_OPER.Shp | PointZ | 12 | S013 |
| 127081o_p/SIM_VEGE.Shp | PointZ | 285 | S014 |
| 127081o_p/TESTI.Shp | PointZ | 683 | S016 |
| 127081o_p/VEGETAZ.Shp | PolyLineZ | 41 | S059 |
| 127081o_p/VEGET_A.Shp | PolygonZ | 10 | S062 |
| 127081o_p/VIABILIT.Shp | PolyLineZ | 1104 | S059 |
| 127081o_p/VIAB_A.Shp | PolygonZ | 221 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127084.zip`

Release 2005; 1008532 bytes; 102 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127084o_p/ASTEFLU.Shp | PolyLineZ | 23 | S064 |
| 127084o_p/ASTEVIA.Shp | PolyLineZ | 194 | S060 |
| 127084o_p/CAM_FABB.Shp | PolyLineZ | 273 | S059 |
| 127084o_p/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 127084o_p/DISCONT.Shp | PolyLineZ | 425 | S059 |
| 127084o_p/ELE_DIV.Shp | PolyLineZ | 449 | S059 |
| 127084o_p/err_l.Shp | PolyLineZ | 89 | S062 |
| 127084o_p/FABBRIC.Shp | PolygonZ | 623 | S063 |
| 127084o_p/FABBR_L.Shp | PolyLineZ | 3038 | S057 |
| 127084o_p/IDROGRAF.Shp | PolyLineZ | 610 | S059 |
| 127084o_p/IDROGR_A.Shp | PolygonZ | 9 | S062 |
| 127084o_p/INFRASTR.Shp | PolyLineZ | 56 | S059 |
| 127084o_p/INFRAS_A.Shp | PolygonZ | 11 | S062 |
| 127084o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 127084o_p/LIM_AMM.Shp | PolyLineZ | 45 | S059 |
| 127084o_p/NODOFLU.Shp | PointZ | 36 | S003 |
| 127084o_p/NODOVIA.Shp | PointZ | 428 | S004 |
| 127084o_p/OPERE.Shp | PolyLineZ | 4 | S059 |
| 127084o_p/PUNTI_Q.Shp | PointZ | 1150 | S005 |
| 127084o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 127084o_p/SIM_DISC.Shp | PointZ | 4622 | S007 |
| 127084o_p/SIM_ELEM.Shp | PointZ | 1000 | S008 |
| 127084o_p/SIM_FABB.Shp | PointZ | 632 | S009 |
| 127084o_p/SIM_IDRO.Shp | PointZ | 81 | S011 |
| 127084o_p/SIM_INFR.Shp | PointZ | 53 | S012 |
| 127084o_p/SIM_OPER.Shp | PointZ | 3 | S013 |
| 127084o_p/SIM_VEGE.Shp | PointZ | 932 | S014 |
| 127084o_p/SIM_VIAB.Shp | PointZ | 8 | S015 |
| 127084o_p/TESTI.Shp | PointZ | 874 | S016 |
| 127084o_p/VEGETAZ.Shp | PolyLineZ | 85 | S059 |
| 127084o_p/VEGET_A.Shp | PolygonZ | 54 | S062 |
| 127084o_p/VIABILIT.Shp | PolyLineZ | 1112 | S059 |
| 127084o_p/VIAB_A.Shp | PolygonZ | 183 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127113.zip`

Release 2005; 2486287 bytes; 111 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127113o_p/ASTEFER.Shp | PolyLineZ | 28 | S058 |
| 127113o_p/ASTEFLU.Shp | PolyLineZ | 21 | S064 |
| 127113o_p/ASTEVIA.Shp | PolyLineZ | 487 | S060 |
| 127113o_p/CAM_FABB.Shp | PolyLineZ | 955 | S059 |
| 127113o_p/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 127113o_p/DISCONT.Shp | PolyLineZ | 1047 | S059 |
| 127113o_p/ELE_DIV.Shp | PolyLineZ | 3020 | S059 |
| 127113o_p/err_l.Shp | PolyLineZ | 157 | S062 |
| 127113o_p/FABBRIC.Shp | PolygonZ | 2525 | S063 |
| 127113o_p/FABBR_L.Shp | PolyLineZ | 10777 | S057 |
| 127113o_p/FERROVIE.Shp | PolyLineZ | 37 | S059 |
| 127113o_p/IDROGRAF.Shp | PolyLineZ | 409 | S059 |
| 127113o_p/IDROGR_A.Shp | PolygonZ | 18 | S062 |
| 127113o_p/INFRASTR.Shp | PolyLineZ | 54 | S059 |
| 127113o_p/INFRAS_A.Shp | PolygonZ | 13 | S062 |
| 127113o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 127113o_p/LIM_AMM.Shp | PolyLineZ | 45 | S059 |
| 127113o_p/NODOFER.Shp | PointZ | 40 | S002 |
| 127113o_p/NODOFLU.Shp | PointZ | 54 | S003 |
| 127113o_p/NODOVIA.Shp | PointZ | 1524 | S004 |
| 127113o_p/OPERE.Shp | PolyLineZ | 38 | S059 |
| 127113o_p/PUNTI_Q.Shp | PointZ | 2914 | S005 |
| 127113o_p/SIM_CORN.Shp | PointZ | 41 | S006 |
| 127113o_p/SIM_DISC.Shp | PointZ | 8704 | S007 |
| 127113o_p/SIM_ELEM.Shp | PointZ | 2479 | S008 |
| 127113o_p/SIM_FABB.Shp | PointZ | 2457 | S009 |
| 127113o_p/SIM_IDRO.Shp | PointZ | 27 | S011 |
| 127113o_p/SIM_INFR.Shp | PointZ | 70 | S012 |
| 127113o_p/SIM_OPER.Shp | PointZ | 146 | S013 |
| 127113o_p/SIM_VEGE.Shp | PointZ | 2002 | S014 |
| 127113o_p/SIM_VIAB.Shp | PointZ | 11 | S015 |
| 127113o_p/TESTI.Shp | PointZ | 866 | S016 |
| 127113o_p/VEGETAZ.Shp | PolyLineZ | 181 | S059 |
| 127113o_p/VEGET_A.Shp | PolygonZ | 15 | S062 |
| 127113o_p/VIABILIT.Shp | PolyLineZ | 2439 | S059 |
| 127113o_p/VIAB_A.Shp | PolygonZ | 674 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127114.zip`

Release 2005; 1539902 bytes; 108 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127114o_p/ASTEFER.Shp | PolyLineZ | 22 | S058 |
| 127114o_p/ASTEFLU.Shp | PolyLineZ | 37 | S064 |
| 127114o_p/ASTEVIA.Shp | PolyLineZ | 434 | S060 |
| 127114o_p/CAM_FABB.Shp | PolyLineZ | 551 | S059 |
| 127114o_p/CORNICI.Shp | PolyLineZ | 582 | S066 |
| 127114o_p/DISCONT.Shp | PolyLineZ | 268 | S059 |
| 127114o_p/ELE_DIV.Shp | PolyLineZ | 1459 | S059 |
| 127114o_p/err_l.Shp | PolyLineZ | 69 | S062 |
| 127114o_p/FABBRIC.Shp | PolygonZ | 1750 | S063 |
| 127114o_p/FABBR_L.Shp | PolyLineZ | 7670 | S057 |
| 127114o_p/FERROVIE.Shp | PolyLineZ | 36 | S059 |
| 127114o_p/IDROGRAF.Shp | PolyLineZ | 199 | S059 |
| 127114o_p/IDROGR_A.Shp | PolygonZ | 7 | S062 |
| 127114o_p/INFRASTR.Shp | PolyLineZ | 89 | S059 |
| 127114o_p/INFRAS_A.Shp | PolygonZ | 22 | S062 |
| 127114o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 127114o_p/LIM_AMM.Shp | PolyLineZ | 2 | S059 |
| 127114o_p/NODOFER.Shp | PointZ | 35 | S002 |
| 127114o_p/NODOFLU.Shp | PointZ | 63 | S003 |
| 127114o_p/NODOVIA.Shp | PointZ | 1078 | S004 |
| 127114o_p/OPERE.Shp | PolyLineZ | 20 | S059 |
| 127114o_p/PUNTI_Q.Shp | PointZ | 1905 | S005 |
| 127114o_p/SIM_CORN.Shp | PointZ | 38 | S006 |
| 127114o_p/SIM_DISC.Shp | PointZ | 2884 | S007 |
| 127114o_p/SIM_ELEM.Shp | PointZ | 1999 | S008 |
| 127114o_p/SIM_FABB.Shp | PointZ | 1673 | S009 |
| 127114o_p/SIM_IDRO.Shp | PointZ | 10 | S011 |
| 127114o_p/SIM_INFR.Shp | PointZ | 46 | S012 |
| 127114o_p/SIM_OPER.Shp | PointZ | 23 | S013 |
| 127114o_p/SIM_VEGE.Shp | PointZ | 1018 | S014 |
| 127114o_p/TESTI.Shp | PointZ | 570 | S016 |
| 127114o_p/VEGETAZ.Shp | PolyLineZ | 142 | S059 |
| 127114o_p/VEGET_A.Shp | PolygonZ | 1 | S062 |
| 127114o_p/VIABILIT.Shp | PolyLineZ | 1953 | S059 |
| 127114o_p/VIAB_A.Shp | PolygonZ | 517 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127151.zip`

Release 2005; 421978 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127151o_p/ASTEFLU.Shp | PolyLineZ | 8 | S064 |
| 127151o_p/ASTEVIA.Shp | PolyLineZ | 55 | S060 |
| 127151o_p/CAM_FABB.Shp | PolyLineZ | 50 | S059 |
| 127151o_p/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 127151o_p/DISCONT.Shp | PolyLineZ | 407 | S059 |
| 127151o_p/ELE_DIV.Shp | PolyLineZ | 89 | S059 |
| 127151o_p/err_l.Shp | PolyLineZ | 1 | S062 |
| 127151o_p/FABBRIC.Shp | PolygonZ | 163 | S063 |
| 127151o_p/FABBR_L.Shp | PolyLineZ | 681 | S057 |
| 127151o_p/IDROGRAF.Shp | PolyLineZ | 210 | S059 |
| 127151o_p/IDROGR_A.Shp | PolygonZ | 9 | S062 |
| 127151o_p/INFRASTR.Shp | PolyLineZ | 11 | S059 |
| 127151o_p/INFRAS_A.Shp | PolygonZ | 1 | S062 |
| 127151o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 127151o_p/LIM_AMM.Shp | PolyLineZ | 21 | S059 |
| 127151o_p/NODOFLU.Shp | PointZ | 12 | S003 |
| 127151o_p/NODOVIA.Shp | PointZ | 98 | S004 |
| 127151o_p/OPERE.Shp | PolyLineZ | 9 | S059 |
| 127151o_p/PUNTI_Q.Shp | PointZ | 230 | S005 |
| 127151o_p/SIM_CORN.Shp | PointZ | 39 | S006 |
| 127151o_p/SIM_DISC.Shp | PointZ | 2889 | S007 |
| 127151o_p/SIM_ELEM.Shp | PointZ | 236 | S008 |
| 127151o_p/SIM_FABB.Shp | PointZ | 104 | S009 |
| 127151o_p/SIM_IDRO.Shp | PointZ | 10 | S011 |
| 127151o_p/SIM_INFR.Shp | PointZ | 117 | S012 |
| 127151o_p/SIM_OPER.Shp | PointZ | 29 | S013 |
| 127151o_p/SIM_VEGE.Shp | PointZ | 202 | S014 |
| 127151o_p/TESTI.Shp | PointZ | 426 | S016 |
| 127151o_p/VEGETAZ.Shp | PolyLineZ | 23 | S059 |
| 127151o_p/VEGET_A.Shp | PolygonZ | 7 | S062 |
| 127151o_p/VIABILIT.Shp | PolyLineZ | 301 | S059 |
| 127151o_p/VIAB_A.Shp | PolygonZ | 82 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127152.zip`

Release 2005; 2257186 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127152o/ASTEFLU.Shp | PolyLineZ | 208 | S064 |
| 127152o/ASTEVIA.Shp | PolyLineZ | 7 | S060 |
| 127152o/CAM_FABB.Shp | PolyLineZ | 11 | S059 |
| 127152o/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 127152o/DISCONT.Shp | PolyLineZ | 400 | S059 |
| 127152o/ELE_DIV.Shp | PolyLineZ | 86 | S059 |
| 127152o/FABBRIC.Shp | PolygonZ | 143 | S063 |
| 127152o/FABBR_L.Shp | PolyLineZ | 428 | S057 |
| 127152o/IDROGRAF.Shp | PolyLineZ | 2731 | S059 |
| 127152o/IDROGR_A.Shp | PolygonZ | 201 | S062 |
| 127152o/INFRASTR.Shp | PolyLineZ | 8 | S059 |
| 127152o/INFRAS_A.Shp | PolygonZ | 2 | S062 |
| 127152o/INQUADRA.Shp | PointZ | 1 | S001 |
| 127152o/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 127152o/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 127152o/NODOFLU.Shp | PointZ | 179 | S003 |
| 127152o/NODOVIA.Shp | PointZ | 13 | S004 |
| 127152o/OPERE.Shp | PolyLineZ | 7 | S059 |
| 127152o/PUNTI_Q.Shp | PointZ | 1884 | S005 |
| 127152o/SIM_CORN.Shp | PointZ | 39 | S006 |
| 127152o/SIM_DISC.Shp | PointZ | 7874 | S007 |
| 127152o/SIM_ELEM.Shp | PointZ | 599 | S008 |
| 127152o/SIM_FABB.Shp | PointZ | 143 | S009 |
| 127152o/SIM_IDRO.Shp | PointZ | 7 | S011 |
| 127152o/SIM_INFR.Shp | PointZ | 4 | S012 |
| 127152o/SIM_OPER.Shp | PointZ | 11 | S013 |
| 127152o/SIM_VEGE.Shp | PointZ | 467 | S014 |
| 127152o/TESTI.Shp | PointZ | 2052 | S016 |
| 127152o/VEGETAZ.Shp | PolyLineZ | 8 | S059 |
| 127152o/VEGET_A.Shp | PolygonZ | 34 | S062 |
| 127152o/VIABILIT.Shp | PolyLineZ | 241 | S059 |
| 127152o/VIAB_A.Shp | PolygonZ | 9 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127154.zip`

Release 2005; 2049823 bytes; 108 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127154o_p/ASTEFLU.Shp | PolyLineZ | 58 | S064 |
| 127154o_p/ASTEVIA.Shp | PolyLineZ | 278 | S060 |
| 127154o_p/CAM_FABB.Shp | PolyLineZ | 905 | S059 |
| 127154o_p/CORNICI.Shp | PolyLineZ | 587 | S066 |
| 127154o_p/DISCONT.Shp | PolyLineZ | 302 | S059 |
| 127154o_p/ELE_DIV.Shp | PolyLineZ | 1703 | S059 |
| 127154o_p/err_a.Shp | PolygonZ | 4 | S062 |
| 127154o_p/err_l.Shp | PolyLineZ | 121 | S062 |
| 127154o_p/FABBRIC.Shp | PolygonZ | 2198 | S063 |
| 127154o_p/FABBR_L.Shp | PolyLineZ | 8448 | S057 |
| 127154o_p/IDROGRAF.Shp | PolyLineZ | 858 | S059 |
| 127154o_p/IDROGR_A.Shp | PolygonZ | 15 | S062 |
| 127154o_p/INFRASTR.Shp | PolyLineZ | 71 | S059 |
| 127154o_p/INFRAS_A.Shp | PolygonZ | 15 | S062 |
| 127154o_p/INQUADRA.Shp | PointZ | 4 | S001 |
| 127154o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 127154o_p/LIM_AMM.Shp | PolyLineZ | 16 | S059 |
| 127154o_p/NODOFLU.Shp | PointZ | 97 | S003 |
| 127154o_p/NODOVIA.Shp | PointZ | 741 | S004 |
| 127154o_p/OPERE.Shp | PolyLineZ | 51 | S059 |
| 127154o_p/PUNTI_Q.Shp | PointZ | 2824 | S005 |
| 127154o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 127154o_p/SIM_DISC.Shp | PointZ | 11104 | S007 |
| 127154o_p/SIM_ELEM.Shp | PointZ | 2650 | S008 |
| 127154o_p/SIM_FABB.Shp | PointZ | 2193 | S009 |
| 127154o_p/SIM_IDRO.Shp | PointZ | 31 | S011 |
| 127154o_p/SIM_INFR.Shp | PointZ | 155 | S012 |
| 127154o_p/SIM_OPER.Shp | PointZ | 77 | S013 |
| 127154o_p/SIM_VEGE.Shp | PointZ | 2030 | S014 |
| 127154o_p/SIM_VIAB.Shp | PointZ | 4 | S015 |
| 127154o_p/TESTI.Shp | PointZ | 995 | S016 |
| 127154o_p/VEGETAZ.Shp | PolyLineZ | 306 | S059 |
| 127154o_p/VEGET_A.Shp | PolygonZ | 65 | S062 |
| 127154o_p/VIABILIT.Shp | PolyLineZ | 1953 | S059 |
| 127154o_p/VIAB_A.Shp | PolygonZ | 354 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127163.zip`

Release 2005; 258527 bytes; 84 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 127163o_p/ASTEFLU.Shp | PolyLineZ | 12 | S064 |
| 127163o_p/CAM_FABB.Shp | PolyLineZ | 1 | S059 |
| 127163o_p/CORNICI.Shp | PolyLineZ | 582 | S066 |
| 127163o_p/CURVE.Shp | PolyLineZ | 5 | S065 |
| 127163o_p/DISCONT.Shp | PolyLineZ | 210 | S059 |
| 127163o_p/ELE_DIV.Shp | PolyLineZ | 14 | S059 |
| 127163o_p/FABBRIC.Shp | PolygonZ | 5 | S063 |
| 127163o_p/IDROGRAF.Shp | PolyLineZ | 98 | S059 |
| 127163o_p/IDROGR_A.Shp | PolygonZ | 14 | S062 |
| 127163o_p/INFRASTR.Shp | PolyLineZ | 4 | S059 |
| 127163o_p/INQUADRA.Shp | PointZ | 4 | S001 |
| 127163o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 127163o_p/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 127163o_p/NODOFLU.Shp | PointZ | 17 | S003 |
| 127163o_p/OPERE.Shp | PolyLineZ | 7 | S059 |
| 127163o_p/PUNTI_Q.Shp | PointZ | 227 | S005 |
| 127163o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 127163o_p/SIM_DISC.Shp | PointZ | 1224 | S007 |
| 127163o_p/SIM_ELEM.Shp | PointZ | 127 | S008 |
| 127163o_p/SIM_FABB.Shp | PointZ | 5 | S009 |
| 127163o_p/SIM_IDRO.Shp | PointZ | 20 | S011 |
| 127163o_p/SIM_INFR.Shp | PointZ | 3 | S012 |
| 127163o_p/SIM_OPER.Shp | PointZ | 7 | S013 |
| 127163o_p/SIM_VEGE.Shp | PointZ | 24 | S014 |
| 127163o_p/TESTI.Shp | PointZ | 513 | S016 |
| 127163o_p/VEGETAZ.Shp | PolyLineZ | 3 | S059 |
| 127163o_p/VIABILIT.Shp | PolyLineZ | 92 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128022.zip`

Release 2005; 1039009 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128022o/ASTEFLU.Shp | PolyLineZ | 27 | S064 |
| 128022o/ASTEVIA.Shp | PolyLineZ | 12 | S060 |
| 128022o/CAM_FABB.Shp | PolyLineZ | 44 | S059 |
| 128022o/CORNICI.Shp | PolyLineZ | 585 | S066 |
| 128022o/DISCONT.Shp | PolyLineZ | 3324 | S059 |
| 128022o/ELE_DIV.Shp | PolyLineZ | 28 | S059 |
| 128022o/err_l.Shp | PolyLineZ | 35 | S062 |
| 128022o/FABBRIC.Shp | PolygonZ | 89 | S063 |
| 128022o/FABBR_L.Shp | PolyLineZ | 382 | S057 |
| 128022o/IDROGRAF.Shp | PolyLineZ | 1150 | S059 |
| 128022o/IDROGR_A.Shp | PolygonZ | 10 | S062 |
| 128022o/INFRASTR.Shp | PolyLineZ | 3 | S059 |
| 128022o/INFRAS_A.Shp | PolygonZ | 1 | S062 |
| 128022o/INQUADRA.Shp | PointZ | 4 | S001 |
| 128022o/LIMAMM_A.Shp | PolygonZ | 5 | S061 |
| 128022o/LIM_AMM.Shp | PolyLineZ | 5 | S059 |
| 128022o/NODOFLU.Shp | PointZ | 43 | S003 |
| 128022o/NODOVIA.Shp | PointZ | 39 | S004 |
| 128022o/PUNTI_Q.Shp | PointZ | 1666 | S005 |
| 128022o/SIM_CORN.Shp | PointZ | 39 | S006 |
| 128022o/SIM_DISC.Shp | PointZ | 6777 | S007 |
| 128022o/SIM_ELEM.Shp | PointZ | 56 | S008 |
| 128022o/SIM_FABB.Shp | PointZ | 89 | S009 |
| 128022o/SIM_IDRO.Shp | PointZ | 109 | S011 |
| 128022o/SIM_INFR.Shp | PointZ | 36 | S012 |
| 128022o/SIM_VEGE.Shp | PointZ | 75 | S014 |
| 128022o/SIM_VIAB.Shp | PointZ | 3 | S015 |
| 128022o/TESTI.Shp | PointZ | 1932 | S016 |
| 128022o/VEGETAZ.Shp | PolyLineZ | 10 | S059 |
| 128022o/VEGET_A.Shp | PolygonZ | 2 | S062 |
| 128022o/VIABILIT.Shp | PolyLineZ | 274 | S059 |
| 128022o/VIAB_A.Shp | PolygonZ | 12 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128023.zip`

Release 2005; 1673060 bytes; 108 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128023o/ASTEFLU.Shp | PolyLineZ | 29 | S064 |
| 128023o/ASTEVIA.Shp | PolyLineZ | 257 | S060 |
| 128023o/CAM_FABB.Shp | PolyLineZ | 177 | S059 |
| 128023o/CORNICI.Shp | PolyLineZ | 586 | S066 |
| 128023o/DISCONT.Shp | PolyLineZ | 9421 | S059 |
| 128023o/ELE_DIV.Shp | PolyLineZ | 314 | S059 |
| 128023o/err_l.Shp | PolyLineZ | 19 | S062 |
| 128023o/FABBRIC.Shp | PolygonZ | 564 | S063 |
| 128023o/FABBR_L.Shp | PolyLineZ | 2818 | S057 |
| 128023o/IDROGRAF.Shp | PolyLineZ | 1032 | S059 |
| 128023o/IDROGR_A.Shp | PolygonZ | 38 | S062 |
| 128023o/INFRASTR.Shp | PolyLineZ | 69 | S059 |
| 128023o/INFRAS_A.Shp | PolygonZ | 13 | S062 |
| 128023o/INQUADRA.Shp | PointZ | 9 | S001 |
| 128023o/LIMAMM_A.Shp | PolygonZ | 5 | S061 |
| 128023o/LIM_AMM.Shp | PolyLineZ | 24 | S059 |
| 128023o/NODOFLU.Shp | PointZ | 60 | S003 |
| 128023o/NODOVIA.Shp | PointZ | 501 | S004 |
| 128023o/OPERE.Shp | PolyLineZ | 19 | S059 |
| 128023o/OPERE_A.Shp | PolygonZ | 1 | S062 |
| 128023o/PUNTI_Q.Shp | PointZ | 1407 | S005 |
| 128023o/SIM_CORN.Shp | PointZ | 42 | S006 |
| 128023o/SIM_DISC.Shp | PointZ | 8367 | S007 |
| 128023o/SIM_ELEM.Shp | PointZ | 604 | S008 |
| 128023o/SIM_FABB.Shp | PointZ | 566 | S009 |
| 128023o/SIM_IDRO.Shp | PointZ | 159 | S011 |
| 128023o/SIM_INFR.Shp | PointZ | 63 | S012 |
| 128023o/SIM_OPER.Shp | PointZ | 42 | S013 |
| 128023o/SIM_VEGE.Shp | PointZ | 740 | S014 |
| 128023o/SIM_VIAB.Shp | PointZ | 8 | S015 |
| 128023o/TESTI.Shp | PointZ | 1232 | S016 |
| 128023o/VEGETAZ.Shp | PolyLineZ | 18 | S059 |
| 128023o/VEGET_A.Shp | PolygonZ | 20 | S062 |
| 128023o/VIABILIT.Shp | PolyLineZ | 1374 | S059 |
| 128023o/VIAB_A.Shp | PolygonZ | 355 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128031.zip`

Release 2005; 1890408 bytes; 108 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128031o/ASTEFLU.Shp | PolyLineZ | 33 | S064 |
| 128031o/ASTEVIA.Shp | PolyLineZ | 379 | S060 |
| 128031o/CAM_FABB.Shp | PolyLineZ | 607 | S059 |
| 128031o/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 128031o/CURVE.Shp | PolyLineZ | 2 | S065 |
| 128031o/DISCONT.Shp | PolyLineZ | 6208 | S059 |
| 128031o/ELE_DIV.Shp | PolyLineZ | 499 | S059 |
| 128031o/err_l.Shp | PolyLineZ | 161 | S062 |
| 128031o/FABBRIC.Shp | PolygonZ | 1091 | S063 |
| 128031o/FABBR_L.Shp | PolyLineZ | 3716 | S057 |
| 128031o/IDROGRAF.Shp | PolyLineZ | 1427 | S059 |
| 128031o/IDROGR_A.Shp | PolygonZ | 52 | S062 |
| 128031o/INFRASTR.Shp | PolyLineZ | 45 | S059 |
| 128031o/INFRAS_A.Shp | PolygonZ | 10 | S062 |
| 128031o/INQUADRA.Shp | PointZ | 7 | S001 |
| 128031o/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 128031o/LIM_AMM.Shp | PolyLineZ | 4 | S059 |
| 128031o/NODOFLU.Shp | PointZ | 96 | S003 |
| 128031o/NODOVIA.Shp | PointZ | 767 | S004 |
| 128031o/OPERE.Shp | PolyLineZ | 8 | S059 |
| 128031o/PUNTI_Q.Shp | PointZ | 1898 | S005 |
| 128031o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 128031o/SIM_DISC.Shp | PointZ | 7831 | S007 |
| 128031o/SIM_ELEM.Shp | PointZ | 866 | S008 |
| 128031o/SIM_FABB.Shp | PointZ | 1089 | S009 |
| 128031o/SIM_IDRO.Shp | PointZ | 217 | S011 |
| 128031o/SIM_INFR.Shp | PointZ | 49 | S012 |
| 128031o/SIM_OPER.Shp | PointZ | 9 | S013 |
| 128031o/SIM_VEGE.Shp | PointZ | 1201 | S014 |
| 128031o/SIM_VIAB.Shp | PointZ | 3 | S015 |
| 128031o/TESTI.Shp | PointZ | 1188 | S016 |
| 128031o/VEGETAZ.Shp | PolyLineZ | 157 | S059 |
| 128031o/VEGET_A.Shp | PolygonZ | 90 | S062 |
| 128031o/VIABILIT.Shp | PolyLineZ | 2089 | S059 |
| 128031o/VIAB_A.Shp | PolygonZ | 522 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128032.zip`

Release 2005; 731601 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128032o_p/ASTEFLU.Shp | PolyLineZ | 17 | S064 |
| 128032o_p/ASTEVIA.Shp | PolyLineZ | 174 | S060 |
| 128032o_p/CAM_FABB.Shp | PolyLineZ | 104 | S059 |
| 128032o_p/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 128032o_p/DISCONT.Shp | PolyLineZ | 2302 | S059 |
| 128032o_p/ELE_DIV.Shp | PolyLineZ | 103 | S059 |
| 128032o_p/err_l.Shp | PolyLineZ | 28 | S062 |
| 128032o_p/FABBRIC.Shp | PolygonZ | 243 | S063 |
| 128032o_p/FABBR_L.Shp | PolyLineZ | 721 | S057 |
| 128032o_p/IDROGRAF.Shp | PolyLineZ | 592 | S059 |
| 128032o_p/IDROGR_A.Shp | PolygonZ | 6 | S062 |
| 128032o_p/INFRASTR.Shp | PolyLineZ | 14 | S059 |
| 128032o_p/INFRAS_A.Shp | PolygonZ | 2 | S062 |
| 128032o_p/INQUADRA.Shp | PointZ | 4 | S001 |
| 128032o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 128032o_p/LIM_AMM.Shp | PolyLineZ | 5 | S059 |
| 128032o_p/NODOFLU.Shp | PointZ | 39 | S003 |
| 128032o_p/NODOVIA.Shp | PointZ | 259 | S004 |
| 128032o_p/PUNTI_Q.Shp | PointZ | 641 | S005 |
| 128032o_p/SIM_CORN.Shp | PointZ | 39 | S006 |
| 128032o_p/SIM_DISC.Shp | PointZ | 4836 | S007 |
| 128032o_p/SIM_ELEM.Shp | PointZ | 228 | S008 |
| 128032o_p/SIM_FABB.Shp | PointZ | 243 | S009 |
| 128032o_p/SIM_IDRO.Shp | PointZ | 68 | S011 |
| 128032o_p/SIM_INFR.Shp | PointZ | 36 | S012 |
| 128032o_p/SIM_VEGE.Shp | PointZ | 773 | S014 |
| 128032o_p/SIM_VIAB.Shp | PointZ | 3 | S015 |
| 128032o_p/TESTI.Shp | PointZ | 738 | S016 |
| 128032o_p/VEGETAZ.Shp | PolyLineZ | 42 | S059 |
| 128032o_p/VEGET_A.Shp | PolygonZ | 47 | S062 |
| 128032o_p/VIABILIT.Shp | PolyLineZ | 712 | S059 |
| 128032o_p/VIAB_A.Shp | PolygonZ | 247 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128033.zip`

Release 2005; 266925 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128033o_p/ASTEFLU.Shp | PolyLineZ | 16 | S064 |
| 128033o_p/ASTEVIA.Shp | PolyLineZ | 11 | S060 |
| 128033o_p/CAM_FABB.Shp | PolyLineZ | 13 | S059 |
| 128033o_p/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 128033o_p/DISCONT.Shp | PolyLineZ | 1055 | S059 |
| 128033o_p/ELE_DIV.Shp | PolyLineZ | 10 | S059 |
| 128033o_p/err_l.Shp | PolyLineZ | 4 | S062 |
| 128033o_p/FABBRIC.Shp | PolygonZ | 30 | S063 |
| 128033o_p/FABBR_L.Shp | PolyLineZ | 106 | S057 |
| 128033o_p/IDROGRAF.Shp | PolyLineZ | 132 | S059 |
| 128033o_p/IDROGR_A.Shp | PolygonZ | 7 | S062 |
| 128033o_p/INFRASTR.Shp | PolyLineZ | 24 | S059 |
| 128033o_p/INFRAS_A.Shp | PolygonZ | 1 | S062 |
| 128033o_p/INQUADRA.Shp | PointZ | 1 | S001 |
| 128033o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 128033o_p/LIM_AMM.Shp | PolyLineZ | 2 | S059 |
| 128033o_p/NODOFLU.Shp | PointZ | 22 | S003 |
| 128033o_p/NODOVIA.Shp | PointZ | 20 | S004 |
| 128033o_p/PUNTI_Q.Shp | PointZ | 126 | S005 |
| 128033o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 128033o_p/SIM_DISC.Shp | PointZ | 518 | S007 |
| 128033o_p/SIM_ELEM.Shp | PointZ | 21 | S008 |
| 128033o_p/SIM_FABB.Shp | PointZ | 31 | S009 |
| 128033o_p/SIM_IDRO.Shp | PointZ | 42 | S011 |
| 128033o_p/SIM_INFR.Shp | PointZ | 10 | S012 |
| 128033o_p/SIM_VEGE.Shp | PointZ | 64 | S014 |
| 128033o_p/SIM_VIAB.Shp | PointZ | 2 | S015 |
| 128033o_p/TESTI.Shp | PointZ | 407 | S016 |
| 128033o_p/VEGETAZ.Shp | PolyLineZ | 5 | S059 |
| 128033o_p/VEGET_A.Shp | PolygonZ | 5 | S062 |
| 128033o_p/VIABILIT.Shp | PolyLineZ | 74 | S059 |
| 128033o_p/VIAB_A.Shp | PolygonZ | 8 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128034.zip`

Release 2005; 1194934 bytes; 105 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128034o/ASTEFLU.Shp | PolyLineZ | 59 | S064 |
| 128034o/ASTEVIA.Shp | PolyLineZ | 54 | S060 |
| 128034o/CAM_FABB.Shp | PolyLineZ | 360 | S059 |
| 128034o/CORNICI.Shp | PolyLineZ | 581 | S066 |
| 128034o/DISCONT.Shp | PolyLineZ | 6523 | S059 |
| 128034o/ELE_DIV.Shp | PolyLineZ | 322 | S059 |
| 128034o/err_l.Shp | PolyLineZ | 104 | S062 |
| 128034o/FABBRIC.Shp | PolygonZ | 674 | S063 |
| 128034o/FABBR_L.Shp | PolyLineZ | 2274 | S057 |
| 128034o/IDROGRAF.Shp | PolyLineZ | 1197 | S059 |
| 128034o/IDROGR_A.Shp | PolygonZ | 8 | S062 |
| 128034o/INFRASTR.Shp | PolyLineZ | 33 | S059 |
| 128034o/INFRAS_A.Shp | PolygonZ | 7 | S062 |
| 128034o/INQUADRA.Shp | PointZ | 7 | S001 |
| 128034o/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 128034o/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 128034o/NODOFLU.Shp | PointZ | 98 | S003 |
| 128034o/NODOVIA.Shp | PointZ | 237 | S004 |
| 128034o/OPERE.Shp | PolyLineZ | 9 | S059 |
| 128034o/PUNTI_Q.Shp | PointZ | 1391 | S005 |
| 128034o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 128034o/SIM_DISC.Shp | PointZ | 2799 | S007 |
| 128034o/SIM_ELEM.Shp | PointZ | 557 | S008 |
| 128034o/SIM_FABB.Shp | PointZ | 675 | S009 |
| 128034o/SIM_IDRO.Shp | PointZ | 363 | S011 |
| 128034o/SIM_INFR.Shp | PointZ | 41 | S012 |
| 128034o/SIM_OPER.Shp | PointZ | 5 | S013 |
| 128034o/SIM_VEGE.Shp | PointZ | 852 | S014 |
| 128034o/SIM_VIAB.Shp | PointZ | 1 | S015 |
| 128034o/TESTI.Shp | PointZ | 1066 | S016 |
| 128034o/VEGETAZ.Shp | PolyLineZ | 66 | S059 |
| 128034o/VEGET_A.Shp | PolygonZ | 71 | S062 |
| 128034o/VIABILIT.Shp | PolyLineZ | 1140 | S059 |
| 128034o/VIAB_A.Shp | PolygonZ | 64 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128051.zip`

Release 2005; 861264 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128051o_p/ASTEFLU.Shp | PolyLineZ | 39 | S064 |
| 128051o_p/ASTEVIA.Shp | PolyLineZ | 79 | S060 |
| 128051o_p/CAM_FABB.Shp | PolyLineZ | 52 | S059 |
| 128051o_p/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 128051o_p/DISCONT.Shp | PolyLineZ | 3068 | S059 |
| 128051o_p/ELE_DIV.Shp | PolyLineZ | 43 | S059 |
| 128051o_p/FABBRIC.Shp | PolygonZ | 111 | S063 |
| 128051o_p/FABBR_L.Shp | PolyLineZ | 386 | S057 |
| 128051o_p/IDROGRAF.Shp | PolyLineZ | 326 | S059 |
| 128051o_p/IDROGR_A.Shp | PolygonZ | 32 | S062 |
| 128051o_p/INFRASTR.Shp | PolyLineZ | 48 | S059 |
| 128051o_p/INFRAS_A.Shp | PolygonZ | 6 | S062 |
| 128051o_p/INQUADRA.Shp | PointZ | 6 | S001 |
| 128051o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 128051o_p/LIM_AMM.Shp | PolyLineZ | 44 | S059 |
| 128051o_p/NODOFLU.Shp | PointZ | 55 | S003 |
| 128051o_p/NODOVIA.Shp | PointZ | 118 | S004 |
| 128051o_p/OPERE.Shp | PolyLineZ | 11 | S059 |
| 128051o_p/PUNTI_Q.Shp | PointZ | 430 | S005 |
| 128051o_p/SIM_CORN.Shp | PointZ | 38 | S006 |
| 128051o_p/SIM_DISC.Shp | PointZ | 10381 | S007 |
| 128051o_p/SIM_ELEM.Shp | PointZ | 154 | S008 |
| 128051o_p/SIM_FABB.Shp | PointZ | 98 | S009 |
| 128051o_p/SIM_IDRO.Shp | PointZ | 138 | S011 |
| 128051o_p/SIM_INFR.Shp | PointZ | 5 | S012 |
| 128051o_p/SIM_OPER.Shp | PointZ | 12 | S013 |
| 128051o_p/SIM_VEGE.Shp | PointZ | 130 | S014 |
| 128051o_p/SIM_VIAB.Shp | PointZ | 2 | S015 |
| 128051o_p/TESTI.Shp | PointZ | 658 | S016 |
| 128051o_p/VEGET_A.Shp | PolygonZ | 7 | S062 |
| 128051o_p/VIABILIT.Shp | PolyLineZ | 422 | S059 |
| 128051o_p/VIAB_A.Shp | PolygonZ | 106 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128054.zip`

Release 2005; 860667 bytes; 96 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128054o_p/ASTEFLU.Shp | PolyLineZ | 16 | S064 |
| 128054o_p/ASTEVIA.Shp | PolyLineZ | 98 | S060 |
| 128054o_p/CAM_FABB.Shp | PolyLineZ | 145 | S059 |
| 128054o_p/CORNICI.Shp | PolyLineZ | 581 | S066 |
| 128054o_p/DISCONT.Shp | PolyLineZ | 1040 | S059 |
| 128054o_p/ELE_DIV.Shp | PolyLineZ | 479 | S059 |
| 128054o_p/err_l.Shp | PolyLineZ | 90 | S062 |
| 128054o_p/FABBRIC.Shp | PolygonZ | 448 | S063 |
| 128054o_p/FABBR_L.Shp | PolyLineZ | 2133 | S057 |
| 128054o_p/IDROGRAF.Shp | PolyLineZ | 1075 | S059 |
| 128054o_p/IDROGR_A.Shp | PolygonZ | 16 | S062 |
| 128054o_p/INFRASTR.Shp | PolyLineZ | 29 | S059 |
| 128054o_p/INFRAS_A.Shp | PolygonZ | 5 | S062 |
| 128054o_p/INQUADRA.Shp | PointZ | 4 | S001 |
| 128054o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128054o_p/LIM_AMM.Shp | PolyLineZ | 21 | S059 |
| 128054o_p/NODOFLU.Shp | PointZ | 30 | S003 |
| 128054o_p/NODOVIA.Shp | PointZ | 262 | S004 |
| 128054o_p/PUNTI_Q.Shp | PointZ | 752 | S005 |
| 128054o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 128054o_p/SIM_DISC.Shp | PointZ | 5540 | S007 |
| 128054o_p/SIM_ELEM.Shp | PointZ | 707 | S008 |
| 128054o_p/SIM_FABB.Shp | PointZ | 436 | S009 |
| 128054o_p/SIM_IDRO.Shp | PointZ | 54 | S011 |
| 128054o_p/SIM_INFR.Shp | PointZ | 31 | S012 |
| 128054o_p/SIM_VEGE.Shp | PointZ | 360 | S014 |
| 128054o_p/TESTI.Shp | PointZ | 647 | S016 |
| 128054o_p/VEGETAZ.Shp | PolyLineZ | 12 | S059 |
| 128054o_p/VEGET_A.Shp | PolygonZ | 22 | S062 |
| 128054o_p/VIABILIT.Shp | PolyLineZ | 885 | S059 |
| 128054o_p/VIAB_A.Shp | PolygonZ | 135 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128061.zip`

Release 2005; 126046 bytes; 54 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128061o_p/ASTEFLU.Shp | PolyLineZ | 1 | S064 |
| 128061o_p/CAM_FABB.Shp | PolyLineZ | 2 | S059 |
| 128061o_p/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 128061o_p/DISCONT.Shp | PolyLineZ | 186 | S059 |
| 128061o_p/FABBRIC.Shp | PolygonZ | 2 | S063 |
| 128061o_p/IDROGRAF.Shp | PolyLineZ | 18 | S059 |
| 128061o_p/IDROGR_A.Shp | PolygonZ | 2 | S062 |
| 128061o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128061o_p/LIM_AMM.Shp | PolyLineZ | 4 | S059 |
| 128061o_p/NODOFLU.Shp | PointZ | 2 | S003 |
| 128061o_p/PUNTI_Q.Shp | PointZ | 12 | S005 |
| 128061o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 128061o_p/SIM_DISC.Shp | PointZ | 144 | S007 |
| 128061o_p/SIM_FABB.Shp | PointZ | 2 | S009 |
| 128061o_p/SIM_VEGE.Shp | PointZ | 5 | S014 |
| 128061o_p/TESTI.Shp | PointZ | 324 | S016 |
| 128061o_p/VIABILIT.Shp | PolyLineZ | 2 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128062.zip`

Release 2005; 112249 bytes; 36 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128062o_p/ASTEFLU.Shp | PolyLineZ | 1 | S064 |
| 128062o_p/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 128062o_p/CURVE.Shp | PolyLineZ | 3 | S065 |
| 128062o_p/IDROGRAF.Shp | PolyLineZ | 18 | S059 |
| 128062o_p/IDROGR_A.Shp | PolygonZ | 3 | S062 |
| 128062o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128062o_p/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 128062o_p/NODOFLU.Shp | PointZ | 2 | S003 |
| 128062o_p/PUNTI_Q.Shp | PointZ | 76 | S005 |
| 128062o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 128062o_p/TESTI.Shp | PointZ | 366 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128064.zip`

Release 2005; 414840 bytes; 93 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128064o_p/ASTEFLU.Shp | PolyLineZ | 24 | S064 |
| 128064o_p/ASTEVIA.Shp | PolyLineZ | 32 | S060 |
| 128064o_p/CAM_FABB.Shp | PolyLineZ | 1 | S059 |
| 128064o_p/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 128064o_p/DISCONT.Shp | PolyLineZ | 2266 | S059 |
| 128064o_p/ELE_DIV.Shp | PolyLineZ | 17 | S059 |
| 128064o_p/err_l.Shp | PolyLineZ | 1 | S062 |
| 128064o_p/FABBRIC.Shp | PolygonZ | 15 | S063 |
| 128064o_p/FABBR_L.Shp | PolyLineZ | 83 | S057 |
| 128064o_p/IDROGRAF.Shp | PolyLineZ | 164 | S059 |
| 128064o_p/IDROGR_A.Shp | PolygonZ | 12 | S062 |
| 128064o_p/INFRASTR.Shp | PolyLineZ | 3 | S059 |
| 128064o_p/INFRAS_A.Shp | PolygonZ | 1 | S062 |
| 128064o_p/INQUADRA.Shp | PointZ | 1 | S001 |
| 128064o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128064o_p/LIM_AMM.Shp | PolyLineZ | 21 | S059 |
| 128064o_p/NODOFLU.Shp | PointZ | 49 | S003 |
| 128064o_p/NODOVIA.Shp | PointZ | 63 | S004 |
| 128064o_p/PUNTI_Q.Shp | PointZ | 134 | S005 |
| 128064o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 128064o_p/SIM_DISC.Shp | PointZ | 3676 | S007 |
| 128064o_p/SIM_ELEM.Shp | PointZ | 43 | S008 |
| 128064o_p/SIM_FABB.Shp | PointZ | 15 | S009 |
| 128064o_p/SIM_IDRO.Shp | PointZ | 48 | S011 |
| 128064o_p/SIM_INFR.Shp | PointZ | 1 | S012 |
| 128064o_p/SIM_VEGE.Shp | PointZ | 51 | S014 |
| 128064o_p/TESTI.Shp | PointZ | 410 | S016 |
| 128064o_p/VEGET_A.Shp | PolygonZ | 3 | S062 |
| 128064o_p/VIABILIT.Shp | PolyLineZ | 167 | S059 |
| 128064o_p/VIAB_A.Shp | PolygonZ | 41 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128071.zip`

Release 2005; 202111 bytes; 78 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128071o_p/ASTEFLU.Shp | PolyLineZ | 5 | S064 |
| 128071o_p/ASTEVIA.Shp | PolyLineZ | 12 | S060 |
| 128071o_p/CORNICI.Shp | PolyLineZ | 581 | S066 |
| 128071o_p/DISCONT.Shp | PolyLineZ | 3 | S059 |
| 128071o_p/FABBRIC.Shp | PolygonZ | 3 | S063 |
| 128071o_p/FABBR_L.Shp | PolyLineZ | 18 | S057 |
| 128071o_p/IDROGRAF.Shp | PolyLineZ | 63 | S059 |
| 128071o_p/IDROGR_A.Shp | PolygonZ | 8 | S062 |
| 128071o_p/INFRASTR.Shp | PolyLineZ | 10 | S059 |
| 128071o_p/INFRAS_A.Shp | PolygonZ | 1 | S062 |
| 128071o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128071o_p/LIM_AMM.Shp | PolyLineZ | 16 | S059 |
| 128071o_p/NODOFLU.Shp | PointZ | 8 | S003 |
| 128071o_p/NODOVIA.Shp | PointZ | 16 | S004 |
| 128071o_p/PUNTI_Q.Shp | PointZ | 84 | S005 |
| 128071o_p/SIM_CORN.Shp | PointZ | 39 | S006 |
| 128071o_p/SIM_DISC.Shp | PointZ | 18 | S007 |
| 128071o_p/SIM_FABB.Shp | PointZ | 3 | S009 |
| 128071o_p/SIM_IDRO.Shp | PointZ | 24 | S011 |
| 128071o_p/SIM_INFR.Shp | PointZ | 12 | S012 |
| 128071o_p/SIM_VEGE.Shp | PointZ | 3 | S014 |
| 128071o_p/TESTI.Shp | PointZ | 372 | S016 |
| 128071o_p/VEGET_A.Shp | PolygonZ | 1 | S062 |
| 128071o_p/VIABILIT.Shp | PolyLineZ | 38 | S059 |
| 128071o_p/VIAB_A.Shp | PolygonZ | 14 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128072.zip`

Release 2005; 1731634 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128072o_p/ASTEFLU.Shp | PolyLineZ | 33 | S064 |
| 128072o_p/ASTEVIA.Shp | PolyLineZ | 71 | S060 |
| 128072o_p/CAM_FABB.Shp | PolyLineZ | 18 | S059 |
| 128072o_p/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 128072o_p/DISCONT.Shp | PolyLineZ | 97 | S059 |
| 128072o_p/ELE_DIV.Shp | PolyLineZ | 14 | S059 |
| 128072o_p/err_l.Shp | PolyLineZ | 9 | S062 |
| 128072o_p/FABBRIC.Shp | PolygonZ | 70 | S063 |
| 128072o_p/FABBR_L.Shp | PolyLineZ | 150 | S057 |
| 128072o_p/IDROGRAF.Shp | PolyLineZ | 2040 | S059 |
| 128072o_p/IDROGR_A.Shp | PolygonZ | 105 | S062 |
| 128072o_p/INFRASTR.Shp | PolyLineZ | 9 | S059 |
| 128072o_p/INFRAS_A.Shp | PolygonZ | 3 | S062 |
| 128072o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 128072o_p/LIM_AMM.Shp | PolyLineZ | 22 | S059 |
| 128072o_p/NODOFLU.Shp | PointZ | 55 | S003 |
| 128072o_p/NODOVIA.Shp | PointZ | 107 | S004 |
| 128072o_p/OPERE.Shp | PolyLineZ | 26 | S059 |
| 128072o_p/PUNTI_Q.Shp | PointZ | 3324 | S005 |
| 128072o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 128072o_p/SIM_DISC.Shp | PointZ | 9845 | S007 |
| 128072o_p/SIM_ELEM.Shp | PointZ | 110 | S008 |
| 128072o_p/SIM_FABB.Shp | PointZ | 74 | S009 |
| 128072o_p/SIM_IDRO.Shp | PointZ | 35 | S011 |
| 128072o_p/SIM_INFR.Shp | PointZ | 8 | S012 |
| 128072o_p/SIM_OPER.Shp | PointZ | 55 | S013 |
| 128072o_p/SIM_VEGE.Shp | PointZ | 144 | S014 |
| 128072o_p/TESTI.Shp | PointZ | 3578 | S016 |
| 128072o_p/VEGETAZ.Shp | PolyLineZ | 22 | S059 |
| 128072o_p/VEGET_A.Shp | PolygonZ | 11 | S062 |
| 128072o_p/VIABILIT.Shp | PolyLineZ | 312 | S059 |
| 128072o_p/VIAB_A.Shp | PolygonZ | 92 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128073.zip`

Release 2005; 738676 bytes; 96 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128073o_p/ASTEFLU.Shp | PolyLineZ | 12 | S064 |
| 128073o_p/ASTEVIA.Shp | PolyLineZ | 33 | S060 |
| 128073o_p/CAM_FABB.Shp | PolyLineZ | 23 | S059 |
| 128073o_p/CORNICI.Shp | PolyLineZ | 585 | S066 |
| 128073o_p/CURVE.Shp | PolyLineZ | 6 | S065 |
| 128073o_p/DISCONT.Shp | PolyLineZ | 48 | S059 |
| 128073o_p/ELE_DIV.Shp | PolyLineZ | 6 | S059 |
| 128073o_p/err_l.Shp | PolyLineZ | 5 | S062 |
| 128073o_p/FABBRIC.Shp | PolygonZ | 47 | S063 |
| 128073o_p/FABBR_L.Shp | PolyLineZ | 119 | S057 |
| 128073o_p/IDROGRAF.Shp | PolyLineZ | 595 | S059 |
| 128073o_p/IDROGR_A.Shp | PolygonZ | 65 | S062 |
| 128073o_p/INQUADRA.Shp | PointZ | 1 | S001 |
| 128073o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 128073o_p/LIM_AMM.Shp | PolyLineZ | 30 | S059 |
| 128073o_p/NODOFLU.Shp | PointZ | 15 | S003 |
| 128073o_p/NODOVIA.Shp | PointZ | 42 | S004 |
| 128073o_p/OPERE.Shp | PolyLineZ | 13 | S059 |
| 128073o_p/PUNTI_Q.Shp | PointZ | 604 | S005 |
| 128073o_p/SIM_CORN.Shp | PointZ | 39 | S006 |
| 128073o_p/SIM_DISC.Shp | PointZ | 4710 | S007 |
| 128073o_p/SIM_ELEM.Shp | PointZ | 2 | S008 |
| 128073o_p/SIM_FABB.Shp | PointZ | 47 | S009 |
| 128073o_p/SIM_IDRO.Shp | PointZ | 82 | S011 |
| 128073o_p/SIM_OPER.Shp | PointZ | 18 | S013 |
| 128073o_p/SIM_VEGE.Shp | PointZ | 124 | S014 |
| 128073o_p/TESTI.Shp | PointZ | 847 | S016 |
| 128073o_p/VEGETAZ.Shp | PolyLineZ | 11 | S059 |
| 128073o_p/VEGET_A.Shp | PolygonZ | 10 | S062 |
| 128073o_p/VIABILIT.Shp | PolyLineZ | 82 | S059 |
| 128073o_p/VIAB_A.Shp | PolygonZ | 48 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128084.zip`

Release 2005; 1192603 bytes; 105 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128084o_p/ASTEFLU.Shp | PolyLineZ | 44 | S064 |
| 128084o_p/ASTEVIA.Shp | PolyLineZ | 159 | S060 |
| 128084o_p/CAM_FABB.Shp | PolyLineZ | 116 | S059 |
| 128084o_p/CORNICI.Shp | PolyLineZ | 600 | S066 |
| 128084o_p/DISCONT.Shp | PolyLineZ | 4306 | S059 |
| 128084o_p/ELE_DIV.Shp | PolyLineZ | 82 | S059 |
| 128084o_p/err_l.Shp | PolyLineZ | 68 | S062 |
| 128084o_p/FABBRIC.Shp | PolygonZ | 230 | S063 |
| 128084o_p/FABBR_L.Shp | PolyLineZ | 854 | S057 |
| 128084o_p/IDROGRAF.Shp | PolyLineZ | 697 | S059 |
| 128084o_p/IDROGR_A.Shp | PolygonZ | 74 | S062 |
| 128084o_p/INFRASTR.Shp | PolyLineZ | 41 | S059 |
| 128084o_p/INFRAS_A.Shp | PolygonZ | 6 | S062 |
| 128084o_p/INQUADRA.Shp | PointZ | 2 | S001 |
| 128084o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 128084o_p/LIM_AMM.Shp | PolyLineZ | 31 | S059 |
| 128084o_p/NODOFLU.Shp | PointZ | 77 | S003 |
| 128084o_p/NODOVIA.Shp | PointZ | 201 | S004 |
| 128084o_p/OPERE.Shp | PolyLineZ | 12 | S059 |
| 128084o_p/PUNTI_Q.Shp | PointZ | 1239 | S005 |
| 128084o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 128084o_p/SIM_DISC.Shp | PointZ | 6414 | S007 |
| 128084o_p/SIM_ELEM.Shp | PointZ | 190 | S008 |
| 128084o_p/SIM_FABB.Shp | PointZ | 231 | S009 |
| 128084o_p/SIM_IDRO.Shp | PointZ | 108 | S011 |
| 128084o_p/SIM_INFR.Shp | PointZ | 71 | S012 |
| 128084o_p/SIM_OPER.Shp | PointZ | 15 | S013 |
| 128084o_p/SIM_VEGE.Shp | PointZ | 636 | S014 |
| 128084o_p/SIM_VIAB.Shp | PointZ | 4 | S015 |
| 128084o_p/TESTI.Shp | PointZ | 1375 | S016 |
| 128084o_p/VEGETAZ.Shp | PolyLineZ | 21 | S059 |
| 128084o_p/VEGET_A.Shp | PolygonZ | 40 | S062 |
| 128084o_p/VIABILIT.Shp | PolyLineZ | 665 | S059 |
| 128084o_p/VIAB_A.Shp | PolygonZ | 198 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128101.zip`

Release 2005; 1579046 bytes; 99 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128101o_p/ASTEFLU.Shp | PolyLineZ | 36 | S064 |
| 128101o_p/ASTEVIA.Shp | PolyLineZ | 46 | S060 |
| 128101o_p/CAM_FABB.Shp | PolyLineZ | 84 | S059 |
| 128101o_p/CORNICI.Shp | PolyLineZ | 587 | S066 |
| 128101o_p/DISCONT.Shp | PolyLineZ | 1011 | S059 |
| 128101o_p/ELE_DIV.Shp | PolyLineZ | 6 | S059 |
| 128101o_p/err_l.Shp | PolyLineZ | 76 | S062 |
| 128101o_p/FABBRIC.Shp | PolygonZ | 147 | S063 |
| 128101o_p/FABBR_L.Shp | PolyLineZ | 336 | S057 |
| 128101o_p/IDROGRAF.Shp | PolyLineZ | 1127 | S059 |
| 128101o_p/IDROGR_A.Shp | PolygonZ | 282 | S062 |
| 128101o_p/INFRASTR.Shp | PolyLineZ | 9 | S059 |
| 128101o_p/INFRAS_A.Shp | PolygonZ | 3 | S062 |
| 128101o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 128101o_p/LIM_AMM.Shp | PolyLineZ | 2 | S059 |
| 128101o_p/NODOFLU.Shp | PointZ | 47 | S003 |
| 128101o_p/NODOVIA.Shp | PointZ | 78 | S004 |
| 128101o_p/OPERE.Shp | PolyLineZ | 9 | S059 |
| 128101o_p/PUNTI_Q.Shp | PointZ | 2128 | S005 |
| 128101o_p/SIM_CORN.Shp | PointZ | 42 | S006 |
| 128101o_p/SIM_DISC.Shp | PointZ | 7928 | S007 |
| 128101o_p/SIM_ELEM.Shp | PointZ | 18 | S008 |
| 128101o_p/SIM_FABB.Shp | PointZ | 150 | S009 |
| 128101o_p/SIM_IDRO.Shp | PointZ | 192 | S011 |
| 128101o_p/SIM_INFR.Shp | PointZ | 21 | S012 |
| 128101o_p/SIM_OPER.Shp | PointZ | 11 | S013 |
| 128101o_p/SIM_VEGE.Shp | PointZ | 57 | S014 |
| 128101o_p/TESTI.Shp | PointZ | 2286 | S016 |
| 128101o_p/VEGETAZ.Shp | PolyLineZ | 211 | S059 |
| 128101o_p/VEGET_A.Shp | PolygonZ | 100 | S062 |
| 128101o_p/VIABILIT.Shp | PolyLineZ | 428 | S059 |
| 128101o_p/VIAB_A.Shp | PolygonZ | 69 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128102.zip`

Release 2005; 3946095 bytes; 105 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128102o_p/AREE_TER.Shp | PolygonZ | 2 | S062 |
| 128102o_p/ASTEFLU.Shp | PolyLineZ | 133 | S064 |
| 128102o_p/ASTEVIA.Shp | PolyLineZ | 800 | S060 |
| 128102o_p/CAM_FABB.Shp | PolyLineZ | 3284 | S059 |
| 128102o_p/CORNICI.Shp | PolyLineZ | 581 | S066 |
| 128102o_p/DISCONT.Shp | PolyLineZ | 560 | S059 |
| 128102o_p/ELE_DIV.Shp | PolyLineZ | 2584 | S059 |
| 128102o_p/err_l.Shp | PolyLineZ | 762 | S062 |
| 128102o_p/err_s.Shp | PointZ | 2659 | S062 |
| 128102o_p/FABBRIC.Shp | PolygonZ | 4111 | S063 |
| 128102o_p/FABBR_L.Shp | PolyLineZ | 9718 | S057 |
| 128102o_p/IDROGRAF.Shp | PolyLineZ | 961 | S059 |
| 128102o_p/IDROGR_A.Shp | PolygonZ | 239 | S062 |
| 128102o_p/INFRASTR.Shp | PolyLineZ | 113 | S059 |
| 128102o_p/INFRAS_A.Shp | PolygonZ | 24 | S062 |
| 128102o_p/INQUADRA.Shp | PointZ | 6 | S001 |
| 128102o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128102o_p/NODOFLU.Shp | PointZ | 246 | S003 |
| 128102o_p/NODOVIA.Shp | PointZ | 1799 | S004 |
| 128102o_p/OPERE.Shp | PolyLineZ | 105 | S059 |
| 128102o_p/PUNTI_Q.Shp | PointZ | 5030 | S005 |
| 128102o_p/SIM_CORN.Shp | PointZ | 16 | S006 |
| 128102o_p/SIM_DISC.Shp | PointZ | 10284 | S007 |
| 128102o_p/SIM_ELEM.Shp | PointZ | 4617 | S008 |
| 128102o_p/SIM_FABB.Shp | PointZ | 4003 | S009 |
| 128102o_p/SIM_IDRO.Shp | PointZ | 336 | S011 |
| 128102o_p/SIM_INFR.Shp | PointZ | 175 | S012 |
| 128102o_p/SIM_OPER.Shp | PointZ | 359 | S013 |
| 128102o_p/SIM_VEGE.Shp | PointZ | 2915 | S014 |
| 128102o_p/TESTI.Shp | PointZ | 1497 | S016 |
| 128102o_p/VEGETAZ.Shp | PolyLineZ | 2135 | S059 |
| 128102o_p/VEGET_A.Shp | PolygonZ | 596 | S062 |
| 128102o_p/VIABILIT.Shp | PolyLineZ | 4976 | S059 |
| 128102o_p/VIAB_A.Shp | PolygonZ | 1184 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128103.zip`

Release 2005; 2111441 bytes; 108 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128103o_p/ASTEFLU.Shp | PolyLineZ | 173 | S064 |
| 128103o_p/ASTEVIA.Shp | PolyLineZ | 571 | S060 |
| 128103o_p/CAM_FABB.Shp | PolyLineZ | 1285 | S059 |
| 128103o_p/CORNICI.Shp | PolyLineZ | 581 | S066 |
| 128103o_p/CURVE.Shp | PolyLineZ | 497 | S065 |
| 128103o_p/DISCONT.Shp | PolyLineZ | 89 | S059 |
| 128103o_p/ELE_DIV.Shp | PolyLineZ | 1538 | S059 |
| 128103o_p/err_l.Shp | PolyLineZ | 354 | S062 |
| 128103o_p/FABBRIC.Shp | PolygonZ | 2067 | S063 |
| 128103o_p/FABBR_L.Shp | PolyLineZ | 6095 | S057 |
| 128103o_p/IDROGRAF.Shp | PolyLineZ | 502 | S059 |
| 128103o_p/IDROGR_A.Shp | PolygonZ | 167 | S062 |
| 128103o_p/INFRASTR.Shp | PolyLineZ | 52 | S059 |
| 128103o_p/INFRAS_A.Shp | PolygonZ | 13 | S062 |
| 128103o_p/INQUADRA.Shp | PointZ | 5 | S001 |
| 128103o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 128103o_p/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 128103o_p/NODOFLU.Shp | PointZ | 232 | S003 |
| 128103o_p/NODOVIA.Shp | PointZ | 1032 | S004 |
| 128103o_p/OPERE.Shp | PolyLineZ | 173 | S059 |
| 128103o_p/PUNTI_Q.Shp | PointZ | 4034 | S005 |
| 128103o_p/SIM_CORN.Shp | PointZ | 39 | S006 |
| 128103o_p/SIM_DISC.Shp | PointZ | 3253 | S007 |
| 128103o_p/SIM_ELEM.Shp | PointZ | 2410 | S008 |
| 128103o_p/SIM_FABB.Shp | PointZ | 2030 | S009 |
| 128103o_p/SIM_IDRO.Shp | PointZ | 141 | S011 |
| 128103o_p/SIM_INFR.Shp | PointZ | 72 | S012 |
| 128103o_p/SIM_OPER.Shp | PointZ | 422 | S013 |
| 128103o_p/SIM_VEGE.Shp | PointZ | 1823 | S014 |
| 128103o_p/SIM_VIAB.Shp | PointZ | 2 | S015 |
| 128103o_p/TESTI.Shp | PointZ | 2396 | S016 |
| 128103o_p/VEGETAZ.Shp | PolyLineZ | 1055 | S059 |
| 128103o_p/VEGET_A.Shp | PolygonZ | 258 | S062 |
| 128103o_p/VIABILIT.Shp | PolyLineZ | 2497 | S059 |
| 128103o_p/VIAB_A.Shp | PolygonZ | 786 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128104.zip`

Release 2005; 120621 bytes; 42 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128104o/ASTEFLU.Shp | PolyLineZ | 1 | S064 |
| 128104o/CORNICI.Shp | PolyLineZ | 580 | S066 |
| 128104o/CURVE.Shp | PolyLineZ | 164 | S065 |
| 128104o/err_s.Shp | PointZ | 35 | S062 |
| 128104o/IDROGRAF.Shp | PolyLineZ | 13 | S059 |
| 128104o/IDROGR_A.Shp | PolygonZ | 1 | S062 |
| 128104o/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128104o/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 128104o/NODOFLU.Shp | PointZ | 2 | S003 |
| 128104o/PUNTI_Q.Shp | PointZ | 144 | S005 |
| 128104o/SIM_CORN.Shp | PointZ | 39 | S006 |
| 128104o/SIM_IDRO.Shp | PointZ | 12 | S011 |
| 128104o/TESTI.Shp | PointZ | 431 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128114.zip`

Release 2005; 1652322 bytes; 105 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128114o/ASTEFLU.Shp | PolyLineZ | 76 | S064 |
| 128114o/ASTEVIA.Shp | PolyLineZ | 97 | S060 |
| 128114o/CAM_FABB.Shp | PolyLineZ | 345 | S059 |
| 128114o/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 128114o/CURVE.Shp | PolyLineZ | 98 | S065 |
| 128114o/DISCONT.Shp | PolyLineZ | 319 | S059 |
| 128114o/ELE_DIV.Shp | PolyLineZ | 165 | S059 |
| 128114o/err_l.Shp | PolyLineZ | 269 | S062 |
| 128114o/FABBRIC.Shp | PolygonZ | 437 | S063 |
| 128114o/FABBR_L.Shp | PolyLineZ | 902 | S057 |
| 128114o/IDROGRAF.Shp | PolyLineZ | 2655 | S059 |
| 128114o/IDROGR_A.Shp | PolygonZ | 136 | S062 |
| 128114o/INFRASTR.Shp | PolyLineZ | 11 | S059 |
| 128114o/INFRAS_A.Shp | PolygonZ | 3 | S062 |
| 128114o/INQUADRA.Shp | PointZ | 2 | S001 |
| 128114o/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 128114o/LIM_AMM.Shp | PolyLineZ | 14 | S059 |
| 128114o/NODOFLU.Shp | PointZ | 126 | S003 |
| 128114o/NODOVIA.Shp | PointZ | 214 | S004 |
| 128114o/OPERE.Shp | PolyLineZ | 16 | S059 |
| 128114o/PUNTI_Q.Shp | PointZ | 3196 | S005 |
| 128114o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 128114o/SIM_DISC.Shp | PointZ | 7908 | S007 |
| 128114o/SIM_ELEM.Shp | PointZ | 242 | S008 |
| 128114o/SIM_FABB.Shp | PointZ | 437 | S009 |
| 128114o/SIM_IDRO.Shp | PointZ | 78 | S011 |
| 128114o/SIM_INFR.Shp | PointZ | 6 | S012 |
| 128114o/SIM_OPER.Shp | PointZ | 87 | S013 |
| 128114o/SIM_VEGE.Shp | PointZ | 216 | S014 |
| 128114o/TESTI.Shp | PointZ | 3106 | S016 |
| 128114o/VEGETAZ.Shp | PolyLineZ | 1156 | S059 |
| 128114o/VEGET_A.Shp | PolygonZ | 532 | S062 |
| 128114o/VIABILIT.Shp | PolyLineZ | 831 | S059 |
| 128114o/VIAB_A.Shp | PolygonZ | 141 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128143.zip`

Release 2005; 165743 bytes; 48 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128143o/ASTEFLU.Shp | PolyLineZ | 1 | S064 |
| 128143o/CORNICI.Shp | PolyLineZ | 583 | S066 |
| 128143o/ELE_DIV.Shp | PolyLineZ | 1 | S059 |
| 128143o/err_l.Shp | PolyLineZ | 5 | S062 |
| 128143o/IDROGRAF.Shp | PolyLineZ | 4 | S059 |
| 128143o/IDROGR_A.Shp | PolygonZ | 2 | S062 |
| 128143o/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128143o/NODOFLU.Shp | PointZ | 2 | S003 |
| 128143o/OPERE.Shp | PolyLineZ | 11 | S059 |
| 128143o/PUNTI_Q.Shp | PointZ | 841 | S005 |
| 128143o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 128143o/SIM_ELEM.Shp | PointZ | 9 | S008 |
| 128143o/SIM_OPER.Shp | PointZ | 1 | S013 |
| 128143o/TESTI.Shp | PointZ | 1146 | S016 |
| 128143o/VIABILIT.Shp | PolyLineZ | 1 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128144.zip`

Release 2005; 1916460 bytes; 111 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 128144o/AREE_TER.Shp | PolygonZ | 2 | S062 |
| 128144o/ASTEFLU.Shp | PolyLineZ | 28 | S064 |
| 128144o/ASTEVIA.Shp | PolyLineZ | 401 | S060 |
| 128144o/CAM_FABB.Shp | PolyLineZ | 1882 | S059 |
| 128144o/CORNICI.Shp | PolyLineZ | 582 | S066 |
| 128144o/CURVE.Shp | PolyLineZ | 3 | S065 |
| 128144o/DISCONT.Shp | PolyLineZ | 54 | S059 |
| 128144o/ELE_DIV.Shp | PolyLineZ | 680 | S059 |
| 128144o/err_l.Shp | PolyLineZ | 237 | S062 |
| 128144o/err_s.Shp | PointZ | 6657 | S062 |
| 128144o/FABBRIC.Shp | PolygonZ | 2506 | S063 |
| 128144o/FABBR_L.Shp | PolyLineZ | 3662 | S057 |
| 128144o/IDROGRAF.Shp | PolyLineZ | 480 | S059 |
| 128144o/IDROGR_A.Shp | PolygonZ | 14 | S062 |
| 128144o/INFRASTR.Shp | PolyLineZ | 37 | S059 |
| 128144o/INFRAS_A.Shp | PolygonZ | 11 | S062 |
| 128144o/INQUADRA.Shp | PointZ | 1 | S001 |
| 128144o/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 128144o/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 128144o/NODOFLU.Shp | PointZ | 63 | S003 |
| 128144o/NODOVIA.Shp | PointZ | 658 | S004 |
| 128144o/OPERE.Shp | PolyLineZ | 49 | S059 |
| 128144o/PUNTI_Q.Shp | PointZ | 4760 | S005 |
| 128144o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 128144o/SIM_DISC.Shp | PointZ | 1721 | S007 |
| 128144o/SIM_ELEM.Shp | PointZ | 1568 | S008 |
| 128144o/SIM_FABB.Shp | PointZ | 2488 | S009 |
| 128144o/SIM_IDRO.Shp | PointZ | 80 | S011 |
| 128144o/SIM_INFR.Shp | PointZ | 31 | S012 |
| 128144o/SIM_OPER.Shp | PointZ | 100 | S013 |
| 128144o/SIM_VEGE.Shp | PointZ | 1821 | S014 |
| 128144o/TESTI.Shp | PointZ | 2627 | S016 |
| 128144o/VEGETAZ.Shp | PolyLineZ | 737 | S059 |
| 128144o/VEGET_A.Shp | PolygonZ | 240 | S062 |
| 128144o/VIABILIT.Shp | PolyLineZ | 2848 | S059 |
| 128144o/VIAB_A.Shp | PolygonZ | 564 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148031.zip`

Release 2005; 1347637 bytes; 69 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148031o/ASTEFLU.Shp | PolyLineZ | 51 | S064 |
| 148031o/CAM_FABB.Shp | PolyLineZ | 6 | S059 |
| 148031o/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 148031o/CURVE.Shp | PolyLineZ | 6 | S065 |
| 148031o/DISCONT.Shp | PolyLineZ | 275 | S059 |
| 148031o/ELE_DIV.Shp | PolyLineZ | 27 | S059 |
| 148031o/err_l.Shp | PolyLineZ | 1 | S062 |
| 148031o/FABBRIC.Shp | PolygonZ | 7 | S063 |
| 148031o/IDROGRAF.Shp | PolyLineZ | 990 | S059 |
| 148031o/IDROGR_A.Shp | PolygonZ | 80 | S062 |
| 148031o/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 148031o/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 148031o/NODOFLU.Shp | PointZ | 51 | S003 |
| 148031o/OPERE.Shp | PolyLineZ | 4 | S059 |
| 148031o/PUNTI_Q.Shp | PointZ | 1718 | S005 |
| 148031o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 148031o/SIM_DISC.Shp | PointZ | 7149 | S007 |
| 148031o/SIM_ELEM.Shp | PointZ | 287 | S008 |
| 148031o/SIM_FABB.Shp | PointZ | 7 | S009 |
| 148031o/SIM_VEGE.Shp | PointZ | 171 | S014 |
| 148031o/TESTI.Shp | PointZ | 2026 | S016 |
| 148031o/VEGET_A.Shp | PolygonZ | 15 | S062 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148043.zip`

Release 2005; 294524 bytes; 78 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148043o_p/ASTEFLU.Shp | PolyLineZ | 3 | S064 |
| 148043o_p/CAM_FABB.Shp | PolyLineZ | 4 | S059 |
| 148043o_p/CORNICI.Shp | PolyLineZ | 587 | S066 |
| 148043o_p/DISCONT.Shp | PolyLineZ | 13 | S059 |
| 148043o_p/ELE_DIV.Shp | PolyLineZ | 5 | S059 |
| 148043o_p/err_l.Shp | PolyLineZ | 1 | S062 |
| 148043o_p/FABBRIC.Shp | PolygonZ | 6 | S063 |
| 148043o_p/FABBR_L.Shp | PolyLineZ | 12 | S057 |
| 148043o_p/IDROGRAF.Shp | PolyLineZ | 32 | S059 |
| 148043o_p/IDROGR_A.Shp | PolygonZ | 12 | S062 |
| 148043o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 148043o_p/LIM_AMM.Shp | PolyLineZ | 2 | S059 |
| 148043o_p/NODOFLU.Shp | PointZ | 6 | S003 |
| 148043o_p/OPERE.Shp | PolyLineZ | 20 | S059 |
| 148043o_p/PUNTI_Q.Shp | PointZ | 1535 | S005 |
| 148043o_p/SIM_CORN.Shp | PointZ | 39 | S006 |
| 148043o_p/SIM_DISC.Shp | PointZ | 232 | S007 |
| 148043o_p/SIM_ELEM.Shp | PointZ | 28 | S008 |
| 148043o_p/SIM_FABB.Shp | PointZ | 6 | S009 |
| 148043o_p/SIM_IDRO.Shp | PointZ | 192 | S011 |
| 148043o_p/SIM_OPER.Shp | PointZ | 70 | S013 |
| 148043o_p/SIM_VEGE.Shp | PointZ | 35 | S014 |
| 148043o_p/TESTI.Shp | PointZ | 1768 | S016 |
| 148043o_p/VEGET_A.Shp | PolygonZ | 7 | S062 |
| 148043o_p/VIABILIT.Shp | PolyLineZ | 12 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148044.zip`

Release 2005; 397031 bytes; 72 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148044o_p/ASTEFLU.Shp | PolyLineZ | 10 | S064 |
| 148044o_p/CAM_FABB.Shp | PolyLineZ | 4 | S059 |
| 148044o_p/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 148044o_p/DISCONT.Shp | PolyLineZ | 332 | S059 |
| 148044o_p/ELE_DIV.Shp | PolyLineZ | 1 | S059 |
| 148044o_p/FABBRIC.Shp | PolygonZ | 6 | S063 |
| 148044o_p/FABBR_L.Shp | PolyLineZ | 6 | S057 |
| 148044o_p/IDROGRAF.Shp | PolyLineZ | 77 | S059 |
| 148044o_p/IDROGR_A.Shp | PolygonZ | 16 | S062 |
| 148044o_p/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 148044o_p/LIM_AMM.Shp | PolyLineZ | 3 | S059 |
| 148044o_p/NODOFLU.Shp | PointZ | 14 | S003 |
| 148044o_p/OPERE.Shp | PolyLineZ | 11 | S059 |
| 148044o_p/PUNTI_Q.Shp | PointZ | 1058 | S005 |
| 148044o_p/SIM_CORN.Shp | PointZ | 41 | S006 |
| 148044o_p/SIM_DISC.Shp | PointZ | 1822 | S007 |
| 148044o_p/SIM_FABB.Shp | PointZ | 6 | S009 |
| 148044o_p/SIM_IDRO.Shp | PointZ | 139 | S011 |
| 148044o_p/SIM_OPER.Shp | PointZ | 16 | S013 |
| 148044o_p/SIM_VEGE.Shp | PointZ | 783 | S014 |
| 148044o_p/TESTI.Shp | PointZ | 1344 | S016 |
| 148044o_p/VEGET_A.Shp | PolygonZ | 59 | S062 |
| 148044o_p/VIABILIT.Shp | PolyLineZ | 4 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148071.zip`

Release 2005; 717341 bytes; 57 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148071o/ASTEFLU.Shp | PolyLineZ | 11 | S064 |
| 148071o/CAM_FABB.Shp | PolyLineZ | 2 | S059 |
| 148071o/CORNICI.Shp | PolyLineZ | 589 | S066 |
| 148071o/CURVE.Shp | PolyLineZ | 21 | S065 |
| 148071o/ELE_DIV.Shp | PolyLineZ | 8 | S059 |
| 148071o/FABBRIC.Shp | PolygonZ | 3 | S063 |
| 148071o/IDROGRAF.Shp | PolyLineZ | 165 | S059 |
| 148071o/IDROGR_A.Shp | PolygonZ | 50 | S062 |
| 148071o/LIMAMM_A.Shp | PolygonZ | 4 | S061 |
| 148071o/LIM_AMM.Shp | PolyLineZ | 4 | S059 |
| 148071o/NODOFLU.Shp | PointZ | 12 | S003 |
| 148071o/OPERE.Shp | PolyLineZ | 7 | S059 |
| 148071o/PUNTI_Q.Shp | PointZ | 3777 | S005 |
| 148071o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 148071o/SIM_ELEM.Shp | PointZ | 77 | S008 |
| 148071o/SIM_FABB.Shp | PointZ | 3 | S009 |
| 148071o/SIM_IDRO.Shp | PointZ | 109 | S011 |
| 148071o/TESTI.Shp | PointZ | 4083 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148081.zip`

Release 2005; 108347 bytes; 33 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148081o_p/CAM_FABB.Shp | PolyLineZ | 1 | S059 |
| 148081o_p/CORNICI.Shp | PolyLineZ | 582 | S066 |
| 148081o_p/err_l.Shp | PolyLineZ | 1 | S062 |
| 148081o_p/IDROGRAF.Shp | PolyLineZ | 3 | S059 |
| 148081o_p/IDROGR_A.Shp | PolygonZ | 2 | S062 |
| 148081o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 148081o_p/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 148081o_p/PUNTI_Q.Shp | PointZ | 120 | S005 |
| 148081o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 148081o_p/TESTI.Shp | PointZ | 409 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148082.zip`

Release 2005; 168616 bytes; 36 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148082o_p/ASTEFLU.Shp | PolyLineZ | 7 | S064 |
| 148082o_p/CORNICI.Shp | PolyLineZ | 581 | S066 |
| 148082o_p/CURVE.Shp | PolyLineZ | 1 | S065 |
| 148082o_p/IDROGRAF.Shp | PolyLineZ | 61 | S059 |
| 148082o_p/IDROGR_A.Shp | PolygonZ | 9 | S062 |
| 148082o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 148082o_p/LIM_AMM.Shp | PolyLineZ | 2 | S059 |
| 148082o_p/NODOFLU.Shp | PointZ | 9 | S003 |
| 148082o_p/PUNTI_Q.Shp | PointZ | 694 | S005 |
| 148082o_p/SIM_CORN.Shp | PointZ | 41 | S006 |
| 148082o_p/TESTI.Shp | PointZ | 982 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148084.zip`

Release 2005; 237732 bytes; 63 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148084o_p/ASTEFLU.Shp | PolyLineZ | 11 | S064 |
| 148084o_p/CAM_FABB.Shp | PolyLineZ | 1 | S059 |
| 148084o_p/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 148084o_p/DISCONT.Shp | PolyLineZ | 1 | S059 |
| 148084o_p/ELE_DIV.Shp | PolyLineZ | 4 | S059 |
| 148084o_p/err_l.Shp | PolyLineZ | 2 | S062 |
| 148084o_p/FABBRIC.Shp | PolygonZ | 2 | S063 |
| 148084o_p/IDROGRAF.Shp | PolyLineZ | 25 | S059 |
| 148084o_p/IDROGR_A.Shp | PolygonZ | 23 | S062 |
| 148084o_p/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 148084o_p/LIM_AMM.Shp | PolyLineZ | 3 | S059 |
| 148084o_p/NODOFLU.Shp | PointZ | 15 | S003 |
| 148084o_p/OPERE.Shp | PolyLineZ | 4 | S059 |
| 148084o_p/PUNTI_Q.Shp | PointZ | 1409 | S005 |
| 148084o_p/SIM_CORN.Shp | PointZ | 40 | S006 |
| 148084o_p/SIM_DISC.Shp | PointZ | 28 | S007 |
| 148084o_p/SIM_ELEM.Shp | PointZ | 3 | S008 |
| 148084o_p/SIM_FABB.Shp | PointZ | 1 | S009 |
| 148084o_p/SIM_IDRO.Shp | PointZ | 34 | S011 |
| 148084o_p/TESTI.Shp | PointZ | 1682 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148121.zip`

Release 2005; 123881 bytes; 33 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148121o_p/ASTEFLU.Shp | PolyLineZ | 4 | S064 |
| 148121o_p/CORNICI.Shp | PolyLineZ | 582 | S066 |
| 148121o_p/IDROGRAF.Shp | PolyLineZ | 85 | S059 |
| 148121o_p/IDROGR_A.Shp | PolygonZ | 9 | S062 |
| 148121o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 148121o_p/LIM_AMM.Shp | PolyLineZ | 3 | S059 |
| 148121o_p/NODOFLU.Shp | PointZ | 6 | S003 |
| 148121o_p/PUNTI_Q.Shp | PointZ | 196 | S005 |
| 148121o_p/SIM_CORN.Shp | PointZ | 38 | S006 |
| 148121o_p/TESTI.Shp | PointZ | 479 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148123.zip`

Release 2005; 393593 bytes; 60 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148123o_p/ASTEFLU.Shp | PolyLineZ | 10 | S064 |
| 148123o_p/CAM_FABB.Shp | PolyLineZ | 2 | S059 |
| 148123o_p/CORNICI.Shp | PolyLineZ | 585 | S066 |
| 148123o_p/ELE_DIV.Shp | PolyLineZ | 3 | S059 |
| 148123o_p/err_l.Shp | PolyLineZ | 4 | S062 |
| 148123o_p/FABBRIC.Shp | PolygonZ | 4 | S063 |
| 148123o_p/FABBR_L.Shp | PolyLineZ | 12 | S057 |
| 148123o_p/IDROGRAF.Shp | PolyLineZ | 21 | S059 |
| 148123o_p/IDROGR_A.Shp | PolygonZ | 43 | S062 |
| 148123o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 148123o_p/LIM_AMM.Shp | PolyLineZ | 5 | S059 |
| 148123o_p/NODOFLU.Shp | PointZ | 14 | S003 |
| 148123o_p/OPERE.Shp | PolyLineZ | 1 | S059 |
| 148123o_p/PUNTI_Q.Shp | PointZ | 3465 | S005 |
| 148123o_p/SIM_CORN.Shp | PointZ | 41 | S006 |
| 148123o_p/SIM_ELEM.Shp | PointZ | 9 | S008 |
| 148123o_p/SIM_FABB.Shp | PointZ | 4 | S009 |
| 148123o_p/SIM_IDRO.Shp | PointZ | 89 | S011 |
| 148123o_p/TESTI.Shp | PointZ | 3759 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148124.zip`

Release 2005; 369572 bytes; 51 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148124o_p/ASTEFLU.Shp | PolyLineZ | 12 | S064 |
| 148124o_p/CAM_FABB.Shp | PolyLineZ | 3 | S059 |
| 148124o_p/CORNICI.Shp | PolyLineZ | 584 | S066 |
| 148124o_p/ELE_DIV.Shp | PolyLineZ | 2 | S059 |
| 148124o_p/FABBRIC.Shp | PolygonZ | 3 | S063 |
| 148124o_p/IDROGRAF.Shp | PolyLineZ | 18 | S059 |
| 148124o_p/IDROGR_A.Shp | PolygonZ | 24 | S062 |
| 148124o_p/LIMAMM_A.Shp | PolygonZ | 1 | S061 |
| 148124o_p/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 148124o_p/NODOFLU.Shp | PointZ | 16 | S003 |
| 148124o_p/PUNTI_Q.Shp | PointZ | 3199 | S005 |
| 148124o_p/SIM_CORN.Shp | PointZ | 41 | S006 |
| 148124o_p/SIM_ELEM.Shp | PointZ | 2 | S008 |
| 148124o_p/SIM_FABB.Shp | PointZ | 3 | S009 |
| 148124o_p/SIM_IDRO.Shp | PointZ | 75 | S011 |
| 148124o_p/TESTI.Shp | PointZ | 3510 | S016 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148161.zip`

Release 2005; 552352 bytes; 105 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148161o/AREE_TER.Shp | PolygonZ | 4 | S062 |
| 148161o/ASTEFLU.Shp | PolyLineZ | 2 | S064 |
| 148161o/ASTEVIA.Shp | PolyLineZ | 4 | S060 |
| 148161o/CAM_FABB.Shp | PolyLineZ | 291 | S059 |
| 148161o/CORNICI.Shp | PolyLineZ | 582 | S066 |
| 148161o/CURVE.Shp | PolyLineZ | 17 | S065 |
| 148161o/DISCONT.Shp | PolyLineZ | 98 | S059 |
| 148161o/ELE_DIV.Shp | PolyLineZ | 73 | S059 |
| 148161o/err_l.Shp | PolyLineZ | 11 | S062 |
| 148161o/err_s.Shp | PointZ | 4798 | S062 |
| 148161o/FABBRIC.Shp | PolygonZ | 306 | S063 |
| 148161o/FABBR_L.Shp | PolyLineZ | 395 | S057 |
| 148161o/IDROGRAF.Shp | PolyLineZ | 32 | S059 |
| 148161o/IDROGR_A.Shp | PolygonZ | 11 | S062 |
| 148161o/INQUADRA.Shp | PointZ | 3 | S001 |
| 148161o/LIMAMM_A.Shp | PolygonZ | 2 | S061 |
| 148161o/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 148161o/NODOFLU.Shp | PointZ | 4 | S003 |
| 148161o/NODOVIA.Shp | PointZ | 5 | S004 |
| 148161o/OPERE.Shp | PolyLineZ | 47 | S059 |
| 148161o/PUNTI_Q.Shp | PointZ | 2089 | S005 |
| 148161o/SIM_CORN.Shp | PointZ | 41 | S006 |
| 148161o/SIM_DISC.Shp | PointZ | 851 | S007 |
| 148161o/SIM_ELEM.Shp | PointZ | 149 | S008 |
| 148161o/SIM_FABB.Shp | PointZ | 304 | S009 |
| 148161o/SIM_IDRO.Shp | PointZ | 30 | S011 |
| 148161o/SIM_INFR.Shp | PointZ | 1 | S012 |
| 148161o/SIM_OPER.Shp | PointZ | 102 | S013 |
| 148161o/SIM_VEGE.Shp | PointZ | 242 | S014 |
| 148161o/TESTI.Shp | PointZ | 2069 | S016 |
| 148161o/VEGETAZ.Shp | PolyLineZ | 3 | S059 |
| 148161o/VEGET_A.Shp | PolygonZ | 4 | S062 |
| 148161o/VIABILIT.Shp | PolyLineZ | 91 | S059 |
| 148161o/VIAB_A.Shp | PolygonZ | 5 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148164.zip`

Release 2005; 626571 bytes; 84 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| 148164o/ASTEFLU.Shp | PolyLineZ | 25 | S064 |
| 148164o/CAM_FABB.Shp | PolyLineZ | 22 | S059 |
| 148164o/CORNICI.Shp | PolyLineZ | 581 | S066 |
| 148164o/CURVE.Shp | PolyLineZ | 25 | S065 |
| 148164o/DISCONT.Shp | PolyLineZ | 51 | S059 |
| 148164o/ELE_DIV.Shp | PolyLineZ | 19 | S059 |
| 148164o/err_l.Shp | PolyLineZ | 27 | S062 |
| 148164o/FABBRIC.Shp | PolygonZ | 65 | S063 |
| 148164o/FABBR_L.Shp | PolyLineZ | 339 | S057 |
| 148164o/IDROGRAF.Shp | PolyLineZ | 56 | S059 |
| 148164o/IDROGR_A.Shp | PolygonZ | 109 | S062 |
| 148164o/INQUADRA.Shp | PointZ | 1 | S001 |
| 148164o/LIMAMM_A.Shp | PolygonZ | 3 | S061 |
| 148164o/LIM_AMM.Shp | PolyLineZ | 1 | S059 |
| 148164o/NODOFLU.Shp | PointZ | 25 | S003 |
| 148164o/OPERE.Shp | PolyLineZ | 49 | S059 |
| 148164o/PUNTI_Q.Shp | PointZ | 4830 | S005 |
| 148164o/SIM_CORN.Shp | PointZ | 38 | S006 |
| 148164o/SIM_DISC.Shp | PointZ | 180 | S007 |
| 148164o/SIM_ELEM.Shp | PointZ | 54 | S008 |
| 148164o/SIM_FABB.Shp | PointZ | 65 | S009 |
| 148164o/SIM_IDRO.Shp | PointZ | 283 | S011 |
| 148164o/SIM_OPER.Shp | PointZ | 102 | S013 |
| 148164o/SIM_VEGE.Shp | PointZ | 49 | S014 |
| 148164o/TESTI.Shp | PointZ | 5052 | S016 |
| 148164o/VEGETAZ.Shp | PolyLineZ | 2 | S059 |
| 148164o/VIABILIT.Shp | PolyLineZ | 19 | S059 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2006_Laguna_aree_complete.zip`

Release 2006; 89904908 bytes; 100 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| LagunaVenazia_aree/AATT.shp | PolygonZ | 380 | S032 |
| LagunaVenazia_aree/AB_CDA.shp | PolygonZ | 1368 | S033 |
| LagunaVenazia_aree/AC_VEI.shp | PolygonZ | 63575 | S034 |
| LagunaVenazia_aree/ALVEO.shp | PolygonZ | 2396 | S035 |
| LagunaVenazia_aree/AR_MAR.shp | PolygonZ | 61 | S036 |
| LagunaVenazia_aree/AR_STR.shp | PolygonZ | 63076 | S037 |
| LagunaVenazia_aree/ATTR_SP.shp | PolygonZ | 453 | S038 |
| LagunaVenazia_aree/BOSCO.shp | PolygonZ | 1168 | S039 |
| LagunaVenazia_aree/CAN_LAG.shp | PolygonZ | 702 | S040 |
| LagunaVenazia_aree/CL_AGR.shp | PolygonZ | 5608 | S041 |
| LagunaVenazia_aree/comune.shp | Polygon | 47 | S054 |
| LagunaVenazia_aree/EDI_MIN.shp | PolygonZ | 82164 | S042 |
| LagunaVenazia_aree/EDIFC.shp | PolygonZ | 167939 | S049 |
| LagunaVenazia_aree/F_NTER.shp | PolygonZ | 41 | S043 |
| LagunaVenazia_aree/GRAD.shp | PolygonZ | 65 | S044 |
| LagunaVenazia_aree/MN_EDI.shp | PolygonZ | 6913 | S050 |
| LagunaVenazia_aree/MN_MAU.shp | PolygonZ | 90 | S051 |
| LagunaVenazia_aree/OP_POR.shp | PolygonZ | 5 | S045 |
| LagunaVenazia_aree/PAR_AR.shp | PolygonZ | 166 | S046 |
| LagunaVenazia_aree/PE_UINS.shp | PolygonZ | 1084 | S052 |
| LagunaVenazia_aree/PONTE.shp | PolygonZ | 2265 | S047 |
| LagunaVenazia_aree/PS_INC.shp | PolygonZ | 38 | S048 |
| LagunaVenazia_aree/SP_ACQ.shp | PolygonZ | 3128 | S053 |
| LagunaVenazia_aree/sv_fer.shp | PolygonZ | 32 | S055 |
| LagunaVenazia_aree/sv_str.shp | PolygonZ | 143 | S056 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_aree_retry.zip`

Release 2010; 155205253 bytes; 180 ZIP entries; CRC verified.

| Exact SHP member / layer | Geometry | Features | Full schema |
| --- | --- | --- | --- |
| ComuneVenezia_aree/A_PVEG.shp | PolygonZ | 1 | S018 |
| ComuneVenezia_aree/A_TRAS.shp | PolygonZ | 359 | S076 |
| ComuneVenezia_aree/AATT.shp | PolygonZ | 45716 | S067 |
| ComuneVenezia_aree/AB_CDA.shp | PolygonZ | 960 | S068 |
| ComuneVenezia_aree/AC_CIC.shp | PolygonZ | 714 | S017 |
| ComuneVenezia_aree/AC_PED.shp | PolygonZ | 16684 | S069 |
| ComuneVenezia_aree/AC_VEI.shp | PolygonZ | 13966 | S070 |
| ComuneVenezia_aree/AR_STR.shp | PolygonZ | 10587 | S071 |
| ComuneVenezia_aree/AR_VMS.shp | PolygonZ | 916 | S072 |
| ComuneVenezia_aree/AR_VRD.shp | PolygonZ | 26898 | S073 |
| ComuneVenezia_aree/AT_NAV.shp | PolygonZ | 52 | S075 |
| ComuneVenezia_aree/ATTR_SP.shp | PolygonZ | 589 | S074 |
| ComuneVenezia_aree/BOSCO.shp | PolygonZ | 278 | S077 |
| ComuneVenezia_aree/CAN_LAG.shp | PolygonZ | 590 | S096 |
| ComuneVenezia_aree/CL_AGR.shp | PolygonZ | 8396 | S078 |
| ComuneVenezia_aree/DIGA.shp | PolygonZ | 6 | S019 |
| ComuneVenezia_aree/EDI_MIN.shp | Polygon | 29477 | S082 |
| ComuneVenezia_aree/EDIFC.shp | Polygon | 40320 | S081 |
| ComuneVenezia_aree/ELE_CP.shp | PolygonZ | 187161 | S030 |
| ComuneVenezia_aree/F_NTER.shp | PolygonZ | 142 | S083 |
| ComuneVenezia_aree/FOR_PC.shp | PolygonZ | 32 | S031 |
| ComuneVenezia_aree/GALLER.shp | PolygonZ | 9 | S020 |
| ComuneVenezia_aree/GRAD.shp | PolygonZ | 111 | S021 |
| ComuneVenezia_aree/MAN_TR.shp | PolygonZ | 1294 | S084 |
| ComuneVenezia_aree/MN_CON.shp | PolygonZ | 1507 | S085 |
| ComuneVenezia_aree/MN_EDI.shp | PolygonZ | 4265 | S086 |
| ComuneVenezia_aree/MN_MAU.shp | PolygonZ | 142 | S022 |
| ComuneVenezia_aree/MU_DIV.shp | PolygonZ | 502 | S023 |
| ComuneVenezia_aree/MU_SOS.shp | PolygonZ | 1938 | S087 |
| ComuneVenezia_aree/OP_POR.shp | PolygonZ | 2729 | S088 |
| ComuneVenezia_aree/OP_REG.shp | PolygonZ | 65 | S089 |
| ComuneVenezia_aree/PAR_AR.shp | PolygonZ | 4336 | S024 |
| ComuneVenezia_aree/PE_UINS.shp | PolygonZ | 46 | S025 |
| ComuneVenezia_aree/PONTE.shp | PolygonZ | 1259 | S090 |
| ComuneVenezia_aree/PS_INC.shp | PolygonZ | 3177 | S091 |
| ComuneVenezia_aree/SCARPT.shp | PolygonZ | 10656 | S079 |
| ComuneVenezia_aree/SD_FER.shp | PolygonZ | 224 | S092 |
| ComuneVenezia_aree/SP_ACQ.shp | PolygonZ | 617 | S093 |
| ComuneVenezia_aree/SV_AER.shp | PolygonZ | 1 | S026 |
| ComuneVenezia_aree/SV_FER.shp | Polygon | 298 | S027 |
| ComuneVenezia_aree/SV_POR.shp | PolygonZ | 9 | S029 |
| ComuneVenezia_aree/SV_STR.shp | PolygonZ | 111 | S028 |
| ComuneVenezia_aree/TP_STR.shp | Polygon | 10587 | S080 |
| ComuneVenezia_aree/TRALIC.shp | PolygonZ | 748 | S094 |
| ComuneVenezia_aree/UN_VOL.shp | PolygonZ | 181113 | S095 |

## Inventory appendix D — DXF annotation layers

These are ancillary cartographic text drawings, not extra building datasets. DXF has group-code properties rather than DBF schemas. All parsed entities are TEXT (point-anchored annotation), so counts below are annotations, not buildings. CAD layer names and all actual group-code keys are recorded. Group codes: 1=text; 8=layer; 10/20/30=insertion X/Y/Z; 11/21/31=alignment X/Y/Z; 40=text height; 41=width factor; 50=rotation; 51=oblique angle; 7=text style; 62=colour; 67=space; 71=text generation flags; 72/73=alignment; 5=handle; 6=linetype. DXF CRS is not embedded; XY aligns with the legacy west-zone sheets. Annotation Z and text contents must not be treated as building volume geometry.

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128022.zip`

Exact member: `128022o/Testo/128022O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 58 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -0.76 … 2.93 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 2AC29 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 15 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 657 | 1, 5, 8, 10, 20, 30, 40 | -8.5 … 0.52 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14S19 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 479 | 1, 5, 8, 10, 20, 30, 40 | -2.68 … 3.5 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128023.zip`

Exact member: `128023o/Testo/128023O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 51 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 837 | 1, 5, 8, 10, 20, 30, 40 | -1.86 … 8.4 |
| 14Y25 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 2AC29 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.39 … 2.76 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14S19 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14R18 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40 | -3.7 … -3.4 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128031.zip`

Exact member: `128031o/Testo/128031O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 58 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 48 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14S19 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -0.4 … 2.69 |
| 11E5 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40 | -0.34 … 0.5 |
| 11A1 | TEXT / insertion point | 808 | 1, 5, 8, 10, 20, 30, 40 | -7.8 … 5.9 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 1.26 … 2.94 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128032.zip`

Exact member: `128032o/Testo/128032O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 23 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 372 | 1, 5, 8, 10, 20, 30, 40 | -1.78 … 8.03 |
| 14G7 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 20 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 2AC29 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.5 |
| 11E5 | TEXT / insertion point | 737 | 1, 5, 8, 10, 20, 30, 40 | -11.6 … 0.19 |
| 14M13 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.5 … 3.3 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14S19 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128033.zip`

Exact member: `128033o/Testo/128033O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 100 | 1, 5, 8, 10, 20, 30, 40 | -2.28 … 3.14 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -0.58 … 0.0 |
| 11E5 | TEXT / insertion point | 1218 | 1, 5, 8, 10, 20, 30, 40 | -7.65 … 0.9 |
| 14S19 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128034.zip`

Exact member: `128034o/Testo/128034O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40 | -1.18 … -0.13 |
| 11A1 | TEXT / insertion point | 710 | 1, 5, 8, 10, 20, 30, 40 | -5.25 … 2.9 |
| 14P16 | TEXT / insertion point | 25 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 2AC29 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -0.72 … 0.26 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -0.5 … -0.5 |
| 14S19 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128051.zip`

Exact member: `128051o/Testo/128051O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 27 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14Y25 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14X24 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 2.69 |
| 2AC29 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 409 | 1, 5, 8, 10, 20, 30, 40 | -5.4 … 0.38 |
| 14R18 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14S19 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11B2 | TEXT / insertion point | 367 | 1, 5, 8, 10, 20, 30, 40 | -2.25 … 5.54 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128052.zip`

Exact member: `128052o/Testo/128052O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 40 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14S19 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1207 | 1, 5, 8, 10, 20, 30, 40 | -16.35 … 1.0 |
| 11B2 | TEXT / insertion point | 53 | 1, 5, 8, 10, 20, 30, 40 | -1.25 … 3.29 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128053.zip`

Exact member: `128053o/Testo/128053O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 345 | 1, 5, 8, 10, 20, 30, 40, 50 | -4.0 … 0.44 |
| 11B2 | TEXT / insertion point | 550 | 1, 5, 8, 10, 20, 30, 40 | -1.44 … 6.87 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128054.zip`

Exact member: `128054o/Testo/128054O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 16C3 | TEXT / insertion point | 59 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 410 | 1, 5, 8, 10, 20, 30, 40 | -2.46 … 4.5 |
| 14P16 | TEXT / insertion point | 27 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14Y25 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 2AC29 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.35 … 2.23 |
| 11A1 | TEXT / insertion point | 71 | 1, 5, 8, 10, 20, 30, 40 | -0.57 … 4.93 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128061.zip`

Exact member: `128061o/Testo/128061O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1409 | 1, 5, 8, 10, 20, 30, 40 | -10.25 … 0.28 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128062.zip`

Exact member: `128062o/Testo/128062O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 13 | 1, 5, 8, 10, 20, 30, 40 | 0.6 … 1.8 |
| 14O15 | TEXT / insertion point | 15 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14W23 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1483 | 1, 5, 8, 10, 20, 30, 40 | -21.75 … 1.5 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128063.zip`

Exact member: `128063o/Testo/128063O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 23 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 58 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 26 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 23 | 1, 5, 8, 10, 20, 30, 40 | 0.5 … 2.6 |
| 14W23 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1250 | 1, 5, 8, 10, 20, 30, 40 | -6.4 … 1.2 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128064.zip`

Exact member: `128064o/Testo/128064O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 23 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11B2 | TEXT / insertion point | 39 | 1, 5, 8, 10, 20, 30, 40 | -1.55 … 3.3 |
| 11E5 | TEXT / insertion point | 729 | 1, 5, 8, 10, 20, 30, 40 | -5.25 … 0.36 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14R18 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 112 | 1, 5, 8, 10, 20, 30, 40 | -1.7 … 4.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128071.zip`

Exact member: `128071o/Testo/128071O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 59 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40 | -0.7 … 1.5 |
| 11E5 | TEXT / insertion point | 1465 | 1, 5, 8, 10, 20, 30, 40 | -3.95 … 0.55 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128072.zip`

Exact member: `128072o/Testo/128072O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 62 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 41 | 1, 5, 8, 10, 20, 30, 40 | -0.4 … 2.0 |
| 11E5 | TEXT / insertion point | 1429 | 1, 5, 8, 10, 20, 30, 40 | -4.05 … 0.4 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128073.zip`

Exact member: `128073o/Testo/128073O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 20 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 2.0 |
| 11E5 | TEXT / insertion point | 1532 | 1, 5, 8, 10, 20, 30, 40 | -12.15 … 0.75 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128074.zip`

Exact member: `128074o/Testo/128074O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14O15 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1202 | 1, 5, 8, 10, 20, 30, 40 | -6.0 … 1.0 |
| 11A1 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.24 … 1.0 |
| 14W23 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128084.zip`

Exact member: `128084o/Testo/128084O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14S19 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 2AC29 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.07 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14Y25 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 659 | 1, 5, 8, 10, 20, 30, 40 | -13.8 … 0.11 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.07 |
| 11A1 | TEXT / insertion point | 470 | 1, 5, 8, 10, 20, 30, 40 | -1.93 … 3.19 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128092.zip`

Exact member: `128092o/Testo/128092O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 59 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 124 | 1, 5, 8, 10, 20, 30, 40 | 0.3 … 2.0 |
| 14O15 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 13 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 1303 | 1, 5, 8, 10, 20, 30, 40 | -10.3 … 0.36 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\128101.zip`

Exact member: `128101o/Testo/128101O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 17 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1650 | 1, 5, 8, 10, 20, 30, 40 | -19.2 … 0.48 |
| 11A1 | TEXT / insertion point | 63 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 2.0 |
| 11B2 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40 | 0.1 … 2.5 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148031.zip`

Exact member: `148031o/Testo/148031O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11B2 | TEXT / insertion point | 139 | 1, 5, 8, 10, 20, 30, 40 | -0.67 … 4.57 |
| 11A1 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40 | 0.9 … 2.0 |
| 14O15 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 649 | 1, 5, 8, 10, 20, 30, 40 | -6.45 … 0.64 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148041.zip`

Exact member: `148041o/Testo/148041O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.41 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40 | 2.1 … 4.15 |
| 11E5 | TEXT / insertion point | 1529 | 1, 5, 8, 10, 20, 30, 40 | -9.6 … -0.54 |
| 14N14 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14W23 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148043.zip`

Exact member: `148043o/Testo/148043O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11B2 | TEXT / insertion point | 27 | 1, 5, 8, 10, 20, 30, 40 | 0.65 … 4.66 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1664 | 1, 5, 8, 10, 20, 30, 40 | -21.55 … 0.35 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148044.zip`

Exact member: `148044o/Testo/148044O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 58 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11B2 | TEXT / insertion point | 46 | 1, 5, 8, 10, 20, 30, 40 | 0.92 … 5.7 |
| 14N14 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14W23 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1176 | 1, 5, 8, 10, 20, 30, 40 | -14.05 … 0.56 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148071.zip`

Exact member: `148071o/Testo/148071O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1706 | 1, 5, 8, 10, 20, 30, 40 | -11.9 … 0.49 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148084.zip`

Exact member: `148084o/Testo/148084O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3310.01 |
| 14O15 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1772 | 1, 5, 8, 10, 20, 30, 40 | -20.6 … -0.22 |
| 16C3 | TEXT / insertion point | 59 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148123.zip`

Exact member: `148123o/Testo/148123O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1637 | 1, 5, 8, 10, 20, 30, 40 | -10.8 … 0.0 |
| 14O15 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 59 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148124.zip`

Exact member: `148124o/Testo/148124O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1392 | 1, 5, 8, 10, 20, 30, 40 | -10.3 … -0.38 |
| 14O15 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148161.zip`

Exact member: `148161o/Testo/148161O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 780 | 1, 5, 8, 10, 20, 30, 40, 50 | -21.0 … -0.36 |
| 11A1 | TEXT / insertion point | 40 | 1, 5, 8, 10, 20, 30, 40 | 0.6 … 7.0 |
| 11B2 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40 | 0.34 … 8.35 |
| 14G7 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 38 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1987\148164.zip`

Exact member: `148164o/Testo/148164O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1990 | 1, 5, 8, 10, 20, 30, 40, 50 | -32.8 … -0.19 |
| 11A1 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40 | 0.98 … 3.7 |
| 11B2 | TEXT / insertion point | 13 | 1, 5, 8, 10, 20, 30, 40 | 1.19 … 7.96 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127033.zip`

Exact member: `127033o/Testo/127033O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 15.36 |
| 11A1 | TEXT / insertion point | 89 | 1, 5, 8, 10, 20, 30, 40 | 8.22 … 11.95 |
| 11B2 | TEXT / insertion point | 327 | 1, 5, 8, 10, 20, 30, 40 | 6.92 … 12.17 |
| 14G7 | TEXT / insertion point | 53 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14R18 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14P16 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14F6 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 9.32 … 11.64 |
| 16C3 | TEXT / insertion point | 62 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127071.zip`

Exact member: `127071o/Testo/127071O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 236 | 1, 5, 8, 10, 20, 30, 40 | 3.7 … 8.5 |
| 11B2 | TEXT / insertion point | 563 | 1, 5, 8, 10, 20, 30, 40 | 0.37 … 12.08 |
| 14G7 | TEXT / insertion point | 109 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 26 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127072.zip`

Exact member: `127072o/Testo/127072O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 538 | 1, 5, 8, 10, 20, 30, 40 | 0.8 … 12.93 |
| 16C3 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 161 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127073.zip`

Exact member: `127073o/Testo/127073O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 273 | 1, 5, 8, 10, 20, 30, 40 | 2.81 … 15.49 |
| 11A1 | TEXT / insertion point | 434 | 1, 5, 8, 10, 20, 30, 40 | 4.0 … 9.5 |
| 16C3 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 106 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127074.zip`

Exact member: `127074o/Testo/127074O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 190 | 1, 5, 8, 10, 20, 30, 40 | 6.0 … 11.4 |
| 11B2 | TEXT / insertion point | 538 | 1, 5, 8, 10, 20, 30, 40 | 5.07 … 10.65 |
| 14G7 | TEXT / insertion point | 95 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127081.zip`

Exact member: `127081o/Testo/127081O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 273 | 1, 5, 8, 10, 20, 30, 40 | -0.64 … 13.92 |
| 11A1 | TEXT / insertion point | 678 | 1, 5, 8, 10, 20, 30, 40 | -2.0 … 10.2 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 69 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127082.zip`

Exact member: `127082o/Testo/127082O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 495 | 1, 5, 8, 10, 20, 30, 40 | -0.69 … 2.94 |
| 14G7 | TEXT / insertion point | 53 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 38 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127083.zip`

Exact member: `127083o/Testo/127083O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 428 | 1, 5, 8, 10, 20, 30, 40 | 1.08 … 12.24 |
| 14G7 | TEXT / insertion point | 162 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127084.zip`

Exact member: `127084o/Testo/127084O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 337 | 1, 5, 8, 10, 20, 30, 40 | 2.6 … 12.0 |
| 11B2 | TEXT / insertion point | 647 | 1, 5, 8, 10, 20, 30, 40 | -0.51 … 17.99 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127111.zip`

Exact member: `127111o/Testo/127111O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 500 | 1, 5, 8, 10, 20, 30, 40 | 0.96 … 17.98 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 336 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127112.zip`

Exact member: `127112o/Testo/127112O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 206 | 1, 5, 8, 10, 20, 30, 40 | -10.8 … -1.4 |
| 11B2 | TEXT / insertion point | 480 | 1, 5, 8, 10, 20, 30, 40, 50 | -0.52 … 10.31 |
| 16C3 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 19 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 133 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127113.zip`

Exact member: `127113o/Testo/127113O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 654 | 1, 5, 8, 10, 20, 30, 40 | -1.46 … 10.14 |
| 11A1 | TEXT / insertion point | 184 | 1, 5, 8, 10, 20, 30, 40 | 0.5 … 8.0 |
| 14G7 | TEXT / insertion point | 137 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 20 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127114.zip`

Exact member: `127114o/Testo/127114O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 202 | 1, 5, 8, 10, 20, 30, 40 | 1.2 … 8.3 |
| 11B2 | TEXT / insertion point | 424 | 1, 5, 8, 10, 20, 30, 40 | 1.35 … 12.96 |
| 14G7 | TEXT / insertion point | 137 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127121.zip`

Exact member: `127121o/Testo/127121O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 785 | 1, 5, 8, 10, 20, 30, 40, 50 | -4.0 … 1.2 |
| 11B2 | TEXT / insertion point | 407 | 1, 5, 8, 10, 20, 30, 40 | -0.99 … 4.21 |
| 16C3 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 62 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127122.zip`

Exact member: `127122o/Testo/127122O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40 | 0.4 … 4.5 |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1338 | 1, 5, 8, 10, 20, 30, 40 | -7.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127123.zip`

Exact member: `127123o/Testo/127123O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 50 | 1, 5, 8, 10, 20, 30, 40 | 1.2 … 6.2 |
| 11B2 | TEXT / insertion point | 147 | 1, 5, 8, 10, 20, 30, 40 | -0.03 … 4.43 |
| 11E5 | TEXT / insertion point | 877 | 1, 5, 8, 10, 20, 30, 40, 50 | -12.7 … 0.4 |
| 14N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 45 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127124.zip`

Exact member: `127124o/Testo/127124O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40 | 1.0 … 4.8 |
| 11E5 | TEXT / insertion point | 78 | 1, 5, 8, 10, 20, 30, 40, 50 | -3.55 … 3.21 |
| 11B2 | TEXT / insertion point | 465 | 1, 5, 8, 10, 20, 30, 40 | 0.22 … 9.21 |
| 14G7 | TEXT / insertion point | 182 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127151.zip`

Exact member: `127151o/Testo/127151O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 228 | 1, 5, 8, 10, 20, 30, 40 | -0.25 … 5.88 |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 20 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 162 | 1, 5, 8, 10, 20, 30, 40 | -12.05 … -1.7 |
| 11A1 | TEXT / insertion point | 486 | 1, 5, 8, 10, 20, 30, 40 | -0.56 … 4.17 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127152.zip`

Exact member: `127152o/Testo/127152O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 1.01 … 1.01 |
| 14P16 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -332.18 |
| 14N14 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11A1 | TEXT / insertion point | 154 | 1, 5, 8, 10, 20, 30, 40 | -0.57 … 2.7 |
| 16C3 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 1031 | 1, 5, 8, 10, 20, 30, 40 | -8.15 … 1.7 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127154.zip`

Exact member: `127154o/Testo/127154O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 642 | 1, 5, 8, 10, 20, 30, 40 | -1.08 … 8.48 |
| 11B2 | TEXT / insertion point | 155 | 1, 5, 8, 10, 20, 30, 40 | -0.11 … 8.42 |
| 12C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 8.17 … 8.17 |
| 14G7 | TEXT / insertion point | 27 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 62 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127161.zip`

Exact member: `127161o/Testo/127161O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1185 | 1, 5, 8, 10, 20, 30, 40, 50 | -13.5 … -0.04 |
| 11A1 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 1.8 … 3.92 |
| 11B2 | TEXT / insertion point | 214 | 1, 5, 8, 10, 20, 30, 40 | 0.3 … 10.8 |
| 14O15 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127162.zip`

Exact member: `127162o/Testo/127162O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 13 | 1, 5, 8, 10, 20, 30, 40 | 0.46 … 1.87 |
| 12C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 43.55 … 43.55 |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40 | 1.6 … 3.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 1439 | 1, 5, 8, 10, 20, 30, 40 | -10.4 … -0.2 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127163.zip`

Exact member: `127163o/Testo/127163O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 1.9 … 1.9 |
| 11B2 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40 | 1.37 … 1.97 |
| 11A1 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40 | 0.8 … 2.6 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 1125 | 1, 5, 8, 10, 20, 30, 40 | -12.3 … 0.34 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\127164.zip`

Exact member: `127164o/Testo/127164O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11B2 | TEXT / insertion point | 114 | 1, 5, 8, 10, 20, 30, 40 | -0.6 … 56.22 |
| 11E5 | TEXT / insertion point | 1133 | 1, 5, 8, 10, 20, 30, 40 | -13.3 … 1.12 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14O15 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14N14 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128091.zip`

Exact member: `128091o/Testo/128091O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1350 | 1, 5, 8, 10, 20, 30, 40, 50 | -16.35 … 0.37 |
| 11A1 | TEXT / insertion point | 58 | 1, 5, 8, 10, 20, 30, 40 | 0.6 … 3.0 |
| 16C3 | TEXT / insertion point | 38 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14U21 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128093.zip`

Exact member: `128093o/Testo/128093O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1481 | 1, 5, 8, 10, 20, 30, 40, 50 | -15.4 … 0.31 |
| 11B2 | TEXT / insertion point | 94 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.74 … 11.66 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 15 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14U21 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128094.zip`

Exact member: `128094o/Testo/128094O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1151 | 1, 5, 8, 10, 20, 30, 40 | -4.4 … 0.46 |
| 11B2 | TEXT / insertion point | 123 | 1, 5, 8, 10, 20, 30, 40 | -0.05 … 2.23 |
| 16C3 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14R18 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128102.zip`

Exact member: `128102o/Testo/128102O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 334 | 1, 5, 8, 10, 20, 30, 40 | -6.75 … 0.39 |
| 11B2 | TEXT / insertion point | 297 | 1, 5, 8, 10, 20, 30, 40 | -0.41 … 2.99 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 159 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128103.zip`

Exact member: `128103o/Testo/128103O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1034 | 1, 5, 8, 10, 20, 30, 40 | -21.2 … 0.33 |
| 11B2 | TEXT / insertion point | 141 | 1, 5, 8, 10, 20, 30, 40 | 0.21 … 2.48 |
| 11A1 | TEXT / insertion point | 60 | 1, 5, 8, 10, 20, 30, 40 | 0.1 … 2.8 |
| 16C3 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 89 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128104.zip`

Exact member: `128104o/Testo/128104O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1835 | 1, 5, 8, 10, 20, 30, 40 | -19.6 … 0.9 |
| 11A1 | TEXT / insertion point | 23 | 1, 5, 8, 10, 20, 30, 40 | 0.4 … 2.0 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 27 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14U21 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128114.zip`

Exact member: `128114o/Testo/128114O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1507 | 1, 5, 8, 10, 20, 30, 40 | -10.5 … 0.31 |
| 11B2 | TEXT / insertion point | 59 | 1, 5, 8, 10, 20, 30, 40 | 0.24 … 2.56 |
| 11A1 | TEXT / insertion point | 79 | 1, 5, 8, 10, 20, 30, 40 | -0.1 … 1.9 |
| 16C3 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 46 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128131.zip`

Exact member: `128131o/Testo/128131O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 65 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.5 … 3.5 |
| 11B2 | TEXT / insertion point | 64 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.16 … 6.78 |
| 11E5 | TEXT / insertion point | 1775 | 1, 5, 8, 10, 20, 30, 40, 50 | -26.2 … 0.58 |
| 14G7 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128132.zip`

Exact member: `128132o/Testo/128132O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 166 | 1, 5, 8, 10, 20, 30, 40 | -11.2 … -1.08 |
| 11B2 | TEXT / insertion point | 39 | 1, 5, 8, 10, 20, 30, 40 | 0.24 … 4.85 |
| 14G7 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128133.zip`

Exact member: `128133o/Testo/128133O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1405 | 1, 5, 8, 10, 20, 30, 40 | -13.5 … -0.35 |
| 11A1 | TEXT / insertion point | 17 | 1, 5, 8, 10, 20, 30, 40 | 0.8 … 2.0 |
| 11B2 | TEXT / insertion point | 82 | 1, 5, 8, 10, 20, 30, 40 | 0.1 … 5.11 |
| 14W23 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 22 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128134.zip`

Exact member: `128134o/Testo/128134O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1574 | 1, 5, 8, 10, 20, 30, 40, 50 | -21.6 … -0.05 |
| 11A1 | TEXT / insertion point | 24 | 1, 5, 8, 10, 20, 30, 40 | 0.8 … 3.68 |
| 11B2 | TEXT / insertion point | 174 | 1, 5, 8, 10, 20, 30, 40 | 0.28 … 8.14 |
| 14W23 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 19 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 24 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14V22 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128143.zip`

Exact member: `128143o/Testo/128143O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 2.01 … 2.01 |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 468 | 1, 5, 8, 10, 20, 30, 40 | -17.5 … -2.75 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\128144.zip`

Exact member: `128144o/Testo/128144O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 876 | 1, 5, 8, 10, 20, 30, 40 | -18.5 … 0.16 |
| 11B2 | TEXT / insertion point | 173 | 1, 5, 8, 10, 20, 30, 40 | 0.19 … 5.09 |
| 16C3 | TEXT / insertion point | 38 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14S19 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 78 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148042.zip`

Exact member: `148042o/Testo/148042O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1539 | 1, 5, 8, 10, 20, 30, 40 | -19.3 … -0.09 |
| 11B2 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40 | 0.34 … 7.42 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148081.zip`

Exact member: `148081o/Testo/148081O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1390 | 1, 5, 8, 10, 20, 30, 40 | -45.6 … 0.0 |
| 11B2 | TEXT / insertion point | 125 | 1, 5, 8, 10, 20, 30, 40 | 0.57 … 11.98 |
| 14N14 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148082.zip`

Exact member: `148082o/Testo/148082O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 793 | 1, 5, 8, 10, 20, 30, 40 | -7.1 … -0.37 |
| 11B2 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40 | 0.68 … 4.59 |
| 14O15 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148121.zip`

Exact member: `148121o/Testo/148121O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 463 | 1, 5, 8, 10, 20, 30, 40 | -6.3 … -0.28 |
| 11B2 | TEXT / insertion point | 77 | 1, 5, 8, 10, 20, 30, 40 | -0.1 … 4.17 |
| 14N14 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\148122.zip`

Exact member: `148122o/Testo/148122O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 452 | 1, 5, 8, 10, 20, 30, 40 | -15.2 … -0.32 |
| 11B2 | TEXT / insertion point | 45 | 1, 5, 8, 10, 20, 30, 40 | 0.43 … 4.09 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\149013.zip`

Exact member: `149013o/Testo/149013O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 98 | 1, 5, 8, 10, 20, 30, 40 | -12.95 … -0.68 |
| 11B2 | TEXT / insertion point | 43 | 1, 5, 8, 10, 20, 30, 40 | 0.1 … 4.28 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\149014.zip`

Exact member: `149014o/Testo/149014O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 538 | 1, 5, 8, 10, 20, 30, 40 | -10.95 … -0.71 |
| 11B2 | TEXT / insertion point | 110 | 1, 5, 8, 10, 20, 30, 40 | 0.4 … 6.91 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\1994\149054.zip`

Exact member: `149054o/Testo/149054O_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40 | 1.39 … 1.73 |
| 16D4 | TEXT / insertion point | 21 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 16C3 | TEXT / insertion point | 61 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50 | -3333.0 … -3333.0 |
| 11E5 | TEXT / insertion point | 632 | 1, 5, 8, 10, 20, 30, 40 | -38.3 … -0.1 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127033.zip`

Exact member: `127033o/testo/127033o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 418 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 57 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 236 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127071.zip`

Exact member: `127071o_p/testo/127071o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 55 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 407 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127073.zip`

Exact member: `127073o_p/testo/127073o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 56 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 473 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 234 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127074.zip`

Exact member: `127074o_p/testo/127074o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 298 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 235 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127081.zip`

Exact member: `127081o_p/testo/127081o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16Q17 | TEXT / insertion point | 235 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 349 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127084.zip`

Exact member: `127084o_p/testo/127084o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 39 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 530 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127113.zip`

Exact member: `127113o_p/testo/127113o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 89 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 468 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 13 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127114.zip`

Exact member: `127114o_p/testo/127114o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 46 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 234 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127151.zip`

Exact member: `127151o_p/testo/127151o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 123 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 230 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127152.zip`

Exact member: `127152o/testo/127152o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14N14 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 584 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 153 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127154.zip`

Exact member: `127154o_p/testo/127154o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 12C3 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 24 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 536 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 117 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 19 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\127163.zip`

Exact member: `127163o_p/testo/127163o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 87 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128022.zip`

Exact member: `128022o/testo/128022o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 445 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 17 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 15 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 478 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 234 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128023.zip`

Exact member: `128023o/testo/128023o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11A1 | TEXT / insertion point | 835 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 53 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 233 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128031.zip`

Exact member: `128031o/testo/128031o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 47 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 779 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 26 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 33 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128032.zip`

Exact member: `128032o_p/testo/128032o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14E5 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 36 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 364 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 235 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128033.zip`

Exact member: `128033o_p/testo/128033o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 76 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 19 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128034.zip`

Exact member: `128034o/testo/128034o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 20 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 708 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 25 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128051.zip`

Exact member: `128051o_p/testo/128051o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 12G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 26 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 217 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14X24 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128054.zip`

Exact member: `128054o_p/testo/128054o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 296 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 25 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 11 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128061.zip`

Exact member: `128061o_p/testo/128061o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128062.zip`

Exact member: `128062o_p/testo/128062o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 50 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128064.zip`

Exact member: `128064o_p/testo/128064o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 49 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128071.zip`

Exact member: `128071o_p/testo/128071o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128072.zip`

Exact member: `128072o_p/testo/128072o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 80 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 1467 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11C3 | TEXT / insertion point | 474 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 39 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 16 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 33 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128073.zip`

Exact member: `128073o_p/testo/128073o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 12G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 199 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 18 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 233 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128084.zip`

Exact member: `128084o_p/testo/128084o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 39 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 577 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 434 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 233 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128101.zip`

Exact member: `128101o_p/testo/128101o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 828 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14E5 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 58 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128102.zip`

Exact member: `128102o_p/testo/128102o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 401 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 159 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 296 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 230 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 28 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128103.zip`

Exact member: `128103o_p/testo/128103o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 1239 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 2AC29 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 138 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 83 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 12D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 12C3 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128104.zip`

Exact member: `128104o/testo/128104o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 230 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 30 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 91 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128114.zip`

Exact member: `128114o/testo/128114o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11C3 | TEXT / insertion point | 411 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 45 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 700 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 59 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 79 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128143.zip`

Exact member: `128143o/testo/128143o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14L12 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 370 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 229 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 23 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\128144.zip`

Exact member: `128144o/testo/128144o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14P16 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 1211 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 78 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 172 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148031.zip`

Exact member: `148031o/testo/148031o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 157 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 928 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 29 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 14 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 229 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148043.zip`

Exact member: `148043o_p/testo/148043o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 847 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 44 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 229 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148044.zip`

Exact member: `148044o_p/testo/148044o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 37 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 677 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 230 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148071.zip`

Exact member: `148071o/testo/148071o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11B2 | TEXT / insertion point | 359 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11C3 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 1711 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14V22 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 233 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148081.zip`

Exact member: `148081o_p/testo/148081o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 68 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148082.zip`

Exact member: `148082o_p/testo/148082o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 382 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 31 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148084.zip`

Exact member: `148084o_p/testo/148084o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14W23 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 787 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 4 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 233 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 34 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148121.zip`

Exact member: `148121o_p/testo/148121o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 109 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 28 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148123.zip`

Exact member: `148123o_p/testo/148123o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 11E5 | TEXT / insertion point | 1818 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 5 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 232 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 33 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148124.zip`

Exact member: `148124o_p/testo/148124o_p_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14W23 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 1803 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14O15 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 6 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14M13 | TEXT / insertion point | 7 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 35 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16C3 | TEXT / insertion point | 12 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148161.zip`

Exact member: `148161o/testo/148161o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 12F6 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 900 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 38 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 65 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14G7 | TEXT / insertion point | 10 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14L12 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 25 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

### `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2005\148164.zip`

Exact member: `148164o/testo/148164o_text.dxf`

| CAD layer | Entity / geometry | Count | Full property group-code list | Z range |
| --- | --- | --- | --- | --- |
| 14G7 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 11E5 | TEXT / insertion point | 2752 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11A1 | TEXT / insertion point | 8 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 11B2 | TEXT / insertion point | 13 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 12B2 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14N14 | TEXT / insertion point | 9 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 14Y25 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 100, 330 | 0.0 … 0.0 |
| 16K11 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16Q17 | TEXT / insertion point | 231 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16L12 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16M13 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16D4 | TEXT / insertion point | 3 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16P16 | TEXT / insertion point | 32 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16N14 | TEXT / insertion point | 1 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |
| 16O15 | TEXT / insertion point | 2 | 1, 5, 8, 10, 20, 30, 40, 50, 100, 330 | 0.0 … 0.0 |

## Source documentation and retained failures

- `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2006_Laguna_doc.pdf` — 8 pages; DB Cartografico v1.5, overview only.
- `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_doc.pdf` — 100 pages; DB Topografico v2.6, including class/attribute dictionaries.
- `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\catalog.json`
- `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\download_manifest.json`
- `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\README.md`

Invalid/incomplete archives (not counted as additional releases):

- `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2006_Laguna_aree.zip` — 42917493 bytes; ZIP central directory unavailable (`BadZipFile: File is not a zip file`). The complete/retry archive is used instead.
- `D:\100_star\venice\data\raw\Venice_Geodata_20261022_2004\2010_Venezia_aree.zip` — 30990016 bytes; ZIP central directory unavailable (`BadZipFile: File is not a zip file`). The complete/retry archive is used instead.

**Conclusion:** real elevation data and usable building volumetric-part inputs exist locally, especially 2005 FABBRIC, 2006 EDIFC/EDI_MIN and 2010 UN_VOL plus ELE_CP roof Z geometry. No held archive supplies ready-made closed building solids, a populated cubic-volume field, a stable five-release building identifier, verified construction dates, an explicit building vertical datum, or an established local redistribution licence.
