"""Stage 5: streets as ordered rows of facades.

For every named street of an area, the buildings that front it are ordered along the street
and given a side (left or right of the direction of travel), so the viewer can open a street
as two rows of facades with each house at its true position.

Outputs: data/ready/streets_<area>.json  and  data/ready/streets.json (both areas merged)
Also data/ready/buildings_render_<area>.json: the geometry the viewer actually draws.
"""
import json
import math
import sys
from collections import defaultdict

from pyproj import Transformer
from shapely.geometry import shape as shp_shape, Point, LineString, mapping
from shapely.ops import transform as shp_transform

from venice import config

INTEREST_HIGHWAY = {"footway", "pedestrian", "residential", "service", "living_street", "unclassified",
                    "tertiary", "secondary", "primary", "steps", "path", "cycleway"}
BUFFER_M = 22.0
MIN_HOUSES = 3


def projector():
    return Transformer.from_crs(config.CRS_WEB, config.CRS_METRIC, always_xy=True).transform


def to_metric(geom, fn):
    return shp_transform(fn, geom)


def main(areas):
    fn = projector()
    all_streets = {}
    for area in areas:
        buildings = json.loads((config.PROCESSED / f"buildings_dated_{area}.geojson").read_text(encoding="utf-8"))["features"]
        networks = json.loads((config.PROCESSED / f"networks_{area}.geojson").read_text(encoding="utf-8"))["features"]

        points, meta = [], {}
        for b in buildings:
            pr = b["properties"]
            if pr.get("label_lon") is None:
                continue
            pt = to_metric(Point(pr["label_lon"], pr["label_lat"]), fn)
            points.append((pr["building_id"], pt))
            meta[pr["building_id"]] = pr
        print(f"[{area}] buildings with label point: {len(points)}")

        streets = defaultdict(lambda: {"ways": [], "houses": {}, "area": area})
        for n in networks:
            pr = n["properties"]
            if pr.get("highway") not in INTEREST_HIGHWAY or not pr.get("name"):
                continue
            line = to_metric(shp_shape(n["geometry"]), fn)
            if line.length < 8:
                continue
            name = pr["name"]
            buf = line.buffer(BUFFER_M)
            for bid, pt in points:
                if not buf.contains(pt):
                    continue
                pos = line.project(pt)
                # side: cross product of the street direction and the vector to the building
                p = line.interpolate(pos)
                ahead = line.interpolate(min(pos + 0.5, line.length))
                vx, vy = ahead.x - p.x, ahead.y - p.y
                wx, wy = pt.x - p.x, pt.y - p.y
                cross = vx * wy - vy * wx
                side = "left" if cross > 0 else "right"
                rec = streets[name]["houses"].get(bid)
                if rec is None or rec["dist_m"] > pt.distance(line):
                    streets[name]["houses"][bid] = {"building_id": bid, "pos_m": round(pos, 1),
                                                    "dist_m": round(pt.distance(line), 1), "side": side}
            streets[name]["ways"].append(n["properties"].get("osm_id"))

        kept = {}
        for name, s in streets.items():
            if len(s["houses"]) < MIN_HOUSES:
                continue
            houses = sorted(s["houses"].values(), key=lambda h: h["pos_m"])
            kept[name] = {"name": name, "area": area, "way_ids": s["ways"], "houses": houses,
                          "n_houses": len(houses)}
        all_streets.update({f"{area}:{k}": v for k, v in kept.items()})
        (config.READY / f"streets_{area}.json").write_text(json.dumps(kept, ensure_ascii=False),
                                                           encoding="utf-8")
        print(f"[{area}] streets kept: {len(kept)}")

    (config.READY / "streets.json").write_text(json.dumps(all_streets, ensure_ascii=False), encoding="utf-8")
    print("wrote", config.READY / "streets.json", "streets:", len(all_streets))


if __name__ == "__main__":
    main(sys.argv[1:] or list(config.EXTRACTS))