"""Project paths, coordinate systems and shared constants for the Venice atlas."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
READY = ROOT / "data" / "ready"
WEB_DATA = ROOT / "web" / "data"
DOCS = ROOT / "docs"

OSM = RAW / "osm"
EXTRACTS = {
    "island": OSM / "venezia_island.osm.pbf",
    "centro": OSM / "venezia_historic_centre.osm.pbf",
}
OSM_POLYGONS = {
    "island": OSM / "venice_island_polygon_osm_4817103.geojson",
    "centro": OSM / "venice_historic_centre_polygon_osm_6628638.geojson",
}
VPRG = RAW / "vprg"
TOPO = RAW / "Venice_Geodata_20261022_2004"
HISTORICAL = RAW / "Venice_Historical_20261022_2025"

# Working metric CRS for Venice (UTM zone 33N covers 12E-18E) and the web CRS.
CRS_METRIC = "EPSG:32633"
CRS_WEB = "EPSG:4326"

# Local origin for quantised viewer coordinates, in degrees (San Marco area).
ORIGIN_LONLAT = (12.3387, 45.4340)

for d in (PROCESSED, READY, WEB_DATA):
    d.mkdir(parents=True, exist_ok=True)