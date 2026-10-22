"""Stage 1: turn an OSM extract into the project's own tables.

Outputs, per area (island, centro), under data/processed/:
  buildings_<area>.geojson|.parquet   one row per building footprint
  parts_<area>.geojson|.parquet       one row per building:part (roof/volume detail)
  addresses_<area>.geojson|.parquet   address nodes with street and number
  networks_<area>.geojson|.parquet    streets, canals, bridges, railways, land use
  stats_<area>.json                   counts and tag coverage of this stage

Rules kept deliberately strict:
  * geometry comes from OSM as drawn; no footprint is invented or buffered;
  * a height is never derived from a neighbour or from the mean of something else:
    height_used is filled only from an explicit height tag, otherwise from a level
    count with an honest height_source label, otherwise left empty;
  * MultiPolygon is split into single polygons with the same building id, because
    several viewers treat a second exterior ring as a hole.
"""
import json
import math
import sys

from shapely.geometry import Polygon, mapping, shape as shp_shape
from shapely.ops import unary_union

from venice import config
from venice.osm_load import read_osm

LEVEL_M = 3.0  # only ever used to label an estimate, never as a documented height

BUILDING_KEYS = ("building", "building:part", "building:levels", "building:min_level", "height", "min_height",
                 "roof:height", "roof:levels", "roof:shape", "name", "name:it", "name:en",
                 "addr:housenumber", "addr:street", "addr:city", "addr:postcode",
                 "wikidata", "wikipedia", "wikipedia:it", "wikipedia:en", "image", "architect",
                 "start_date", "year_of_construction", "construction_date", "opening_date", "end_date",
                 "heritage", "heritage:operator", "historic", "amenity", "shop", "tourism", "office",
                 "leisure", "man_made", "source", "building:use", "building:architecture", "ref:regione:veneto")
NETWORK_KEYS = ("highway", "railway", "waterway", "natural", "landuse", "barrier", "man_made", "bridge",
                "tunnel", "layer", "name", "surface", "oneway", "service", "water", "place")
ADDRESS_KEYS = ("addr:housenumber", "addr:street", "addr:city", "addr:postcode", "addr:unit", "addr:floor",
                "name", "entrance", "amenity", "shop", "tourism")


def as_float(v):
    try:
        return float(str(v).replace(",", ".").strip())
    except (TypeError, ValueError):
        return None


def closed(coords):
    return len(coords) >= 4 and coords[0] == coords[-1]


def polygon_from(coords):
    if not closed(coords):
        return None
    p = Polygon(coords)
    if not p.is_valid:
        p = p.buffer(0)
    if p.is_empty or p.area <= 0:
        return None
    return p


def height_fields(tags):
    """Explicit height first, then a labelled level estimate, otherwise nothing."""
    h = as_float(tags.get("height"))
    if h and h > 0:
        return round(h, 2), "osm_height"
    levels = as_float(tags.get("building:levels"))
    if levels and levels > 0:
        return round(levels * LEVEL_M, 2), "osm_levels_estimate"
    return None, None


def pick(tags, keys):
    return {k: tags[k] for k in keys if k in tags}


def split_polygons(geom):
    if geom.geom_type == "Polygon":
        return [geom]
    if geom.geom_type == "MultiPolygon":
        return list(geom.geoms)
    return []


def build_relation_geometry(data, rel):
    outers, inners = [], []
    for mtype, ref, role in rel["members"]:
        if mtype != "w":
            continue
        coords = data.coordinates(ref)
        if not closed(coords):
            continue
        p = polygon_from(coords)
        if p is None:
            continue
        (inners if role == "inner" else outers).append(p)
    if not outers:
        return []
    merged = unary_union(outers)
    holes = [p for p in inners if not p.is_empty]
    if holes:
        merged = merged.difference(unary_union(holes))
    return split_polygons(merged)


def feature(geom, props):
    return {"type": "Feature", "properties": props, "geometry": mapping(geom)}


def collect(data, area):
    buildings, parts, addresses, networks = [], [], [], []
    stats = {"area": area, "buildings": 0, "building_parts": 0, "address_nodes": 0, "networks": 0,
             "skipped_unclosed_buildings": 0, "relation_buildings": 0, "closed_ring_buildings": 0,
             "buildings_with_hole": 0, "height_from_tag": 0, "height_from_levels": 0, "height_missing": 0}

    for way_id, tags in data.way_tags.items():
        is_building = tags.get("building") not in (None, "no")
        is_part = "building:part" in tags or tags.get("building") == "part"
        if is_building or is_part:
            coords = data.coordinates(way_id)
            geom = polygon_from(coords)
            if geom is None:
                stats["skipped_unclosed_buildings"] += 1
                continue
            height, hsrc = height_fields(tags)
            props = {"building_id": f"w{way_id}", "osm_type": "way", "osm_id": way_id,
                     "height_used": height, "height_source": hsrc, "nodes": len(coords)}
            props.update(pick(tags, BUILDING_KEYS))
            props["has_hole"] = len(geom.interiors) > 0
            row = feature(geom, props)
            if is_part:
                parts.append(row)
                stats["building_parts"] += 1
            else:
                buildings.append(row)
                stats["buildings"] += 1
                stats["closed_ring_buildings"] += 1
                stats["buildings_with_hole"] += 1 if props["has_hole"] else 0
                stats["height_from_tag"] += 1 if hsrc == "osm_height" else 0
                stats["height_from_levels"] += 1 if hsrc == "osm_levels_estimate" else 0
                stats["height_missing"] += 1 if hsrc is None else 0
        elif any(k in tags for k in NETWORK_KEYS):
            coords = data.coordinates(way_id)
            if len(coords) < 2:
                continue
            if closed(coords):
                geom = {"type": "Polygon", "coordinates": [coords]}
            else:
                geom = {"type": "LineString", "coordinates": coords}
            networks.append({"type": "Feature", "properties": {"osm_type": "way", "osm_id": way_id,
                                                               **pick(tags, NETWORK_KEYS)},
                             "geometry": geom})
            stats["networks"] += 1

    for rel in data.relations:
        tags = rel["tags"]
        if tags.get("type") != "multipolygon":
            continue
        is_building = tags.get("building") not in (None, "no")
        is_part = "building:part" in tags or tags.get("building") == "part"
        if not (is_building or is_part):
            continue
        for i, geom in enumerate(build_relation_geometry(data, rel)):
            height, hsrc = height_fields(tags)
            props = {"building_id": f"r{rel['id']}", "osm_type": "relation", "osm_id": rel["id"],
                     "height_used": height, "height_source": hsrc, "part_index": i,
                     "has_hole": len(geom.interiors) > 0}
            props.update(pick(tags, BUILDING_KEYS))
            row = feature(geom, props)
            if is_part:
                parts.append(row)
                stats["building_parts"] += 1
            else:
                buildings.append(row)
                stats["buildings"] += 1
                stats["relation_buildings"] += 1
                stats["buildings_with_hole"] += 1 if props["has_hole"] else 0
                stats["height_from_tag"] += 1 if hsrc == "osm_height" else 0
                stats["height_from_levels"] += 1 if hsrc == "osm_levels_estimate" else 0
                stats["height_missing"] += 1 if hsrc is None else 0

    for node_id, tags in data.node_tags.items():
        if "addr:housenumber" not in tags:
            continue
        lon, lat = data.nodes[node_id]
        addresses.append({"type": "Feature", "properties": {"osm_id": node_id, **pick(tags, ADDRESS_KEYS)},
                          "geometry": {"type": "Point", "coordinates": [lon, lat]}})
        stats["address_nodes"] += 1

    # interior point per building: a stable label anchor that needs no projection
    for row in buildings:
        g = shp_shape(row["geometry"])
        p = g.representative_point()
        row["properties"]["label_lon"] = round(p.x, 7)
        row["properties"]["label_lat"] = round(p.y, 7)
    return buildings, parts, addresses, networks, stats


def write_layer(rows, path_stem, stats_only=False):
    gj = path_stem.with_suffix(".geojson")
    gj.write_text(json.dumps({"type": "FeatureCollection", "features": rows}, ensure_ascii=False),
                  encoding="utf-8", newline="")
    written = [gj]
    try:
        import geopandas as gpd
        gdf = gpd.GeoDataFrame.from_features(rows, crs=config.CRS_WEB)
        pq = path_stem.with_suffix(".parquet")
        gdf.to_parquet(pq, index=False)
        written.append(pq)
    except Exception as exc:  # parquet is a convenience, GeoJSON is authoritative
        print(f"  (parquet skipped for {path_stem.name}: {type(exc).__name__})")
    return written


def main(area):
    path = config.EXTRACTS[area]
    print(f"[{area}] reading {path.name}")
    data = read_osm(path)
    print(f"[{area}] nodes={len(data.nodes)} ways={len(data.ways)} relations={len(data.relations)}")
    buildings, parts, addresses, networks, stats = collect(data, area)
    files = []
    for rows, stem in ((buildings, "buildings"), (parts, "parts"), (addresses, "addresses"),
                       (networks, "networks")):
        files += write_layer(rows, config.PROCESSED / f"{stem}_{area}")
    stats["files"] = [f.name for f in files]
    (config.PROCESSED / f"stats_{area}.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2),
                                                         encoding="utf-8")
    print(f"[{area}] buildings={stats['buildings']} parts={stats['building_parts']} "
          f"addresses={stats['address_nodes']} networks={stats['networks']}")
    print(f"[{area}] holes={stats['buildings_with_hole']} height_tag={stats['height_from_tag']} "
          f"level_estimate={stats['height_from_levels']} missing={stats['height_missing']}")
    return stats


if __name__ == "__main__":
    areas = sys.argv[1:] or list(config.EXTRACTS)
    for a in areas:
        main(a)