"""Stage 6: export the viewer's data for Venice.

The binary contract is the one the SydMap viewer reads (MIT, see research/engines/sydmap-full):
  web/data/venezia.json   city config: periods, histogram, tile index, attribute layout
  web/data/pack*.bin      gzipped 600 m tiles, 'SYD2' magic
  web/data/attrs.bin      gzipped fixed-stride per-building records, 56 bytes
  web/data/wiki.json      Wikipedia/Wikidata cards, indexed by the wk field
  web/data/names.json     names of buildings that have no card
  web/data/heritage.json  heritage listings, indexed by the hi field
  web/data/labels.json    place, water and street labels
  web/data/layers.json    the story lens: groups of buildings with a bit each
  web/data/quests.json    empty here
  web/data/land.bin, water.bin, context.bin   ground polygons in the local frame

Age semantics for Venice, kept honest:
  * an OSM/Wikidata year is drawn as a documented year (flag 0);
  * a VPRG epoch is an interval: the building is drawn when the epoch starts and the
    card says the exact year is unknown (flag 1);
  * a building the municipal classification does not cover keeps a grey unknown period (flag 2).
Heights are never invented: an explicit tag, then a level count, then the median of the
epoch's measured buildings, and the source is recorded in the hsrc field either way.
"""
import gzip
import json
import math
import struct
import sys
from collections import Counter, defaultdict

import numpy as np
from pyproj import Transformer
from shapely.geometry import shape as shp_shape, Point, mapping
from shapely.ops import unary_union
from shapely.strtree import STRtree

from venice import config

TILE = 600.0
PACK_BYTES = 800_000
MAGIC = 0x3A5A3356          # 'VZ3:' marker, so a Venice pack is never mistaken for another city's
SIMPLIFY = 0.25
PALE = 0x8000

PERIODS = [
    {"key": "pre", "label": "До 1800 — средневековое ядро и Ренессанс",
     "from": 1000, "to": 1799, "color": "#2f3f6b"},
    {"key": "ott", "label": "1800–1899 — от наполеоновской эпохи до объединения",
     "from": 1800, "to": 1899, "color": "#b06a2c"},
    {"key": "nove", "label": "1900– — XX век и современность",
     "from": 1900, "to": 2026, "color": "#c8b06a"},
    {"key": "unknown", "label": "Год постройки неизвестен",
     "from": 1000, "to": 2026, "color": "#9aa0a6"},
]

HERITAGE = ["Объект наследия (тег OSM)"]

ATTR_DTYPE = np.dtype([
    ("osm", "<f8"), ("year", "<i2"), ("yfrom", "<i2"), ("yto", "<i2"),
    ("h", "<u2"), ("hsrc", "u1"), ("fsrc", "u1"), ("flag", "u1"), ("heritage", "u1"),
    ("lay0", "<u4"), ("lay1", "<u4"), ("wk", "<i4"), ("nm", "<i4"), ("hi", "<i4"), ("sp", "<u4"),
    ("src", "u1"), ("floors", "u1"), ("dsrc", "u1"), ("pad", "u1"), ("x", "<f4"), ("z", "<f4"),
])

H_SRC = {"osm_height": 0, "osm_levels_estimate": 1, "epoch_median_estimate": 3}
D_SRC = {"osm": 0, "vprg": 1, "wikidata": 2, "none": 3}


def write_bin(path, blob):
    path.write_bytes(gzip.compress(bytes(blob), compresslevel=9, mtime=0))


def pad4(b):
    return b + b"\0" * (-len(b) % 4)


def load_geojson(path):
    return json.loads(path.read_text(encoding="utf-8"))["features"]


def transformer():
    return Transformer.from_crs(config.CRS_WEB, config.CRS_METRIC, always_xy=True).transform


def rings_of(geom):
    for poly in getattr(geom, "geoms", [geom]):
        if poly.is_empty or poly.geom_type != "Polygon":
            continue
        yield np.asarray(poly.exterior.coords)[:-1], 0
        for hole in poly.interiors:
            yield np.asarray(hole.coords)[:-1], 1


def pack_tile(origin, rows, base):
    """origin: the tile's corner in the local frame, base: the city origin in the projected CRS."""
    gid, year, flag, period, floors, heritage, lay0, lay1, part_start = [], [], [], [], [], [], [], [], [0]
    heights, bases, ring_start, vert_start, holes, verts = [], [], [0], [0], [], []
    for b in rows:
        gid.append(b["gid"])
        year.append(b["year"])
        # the worker reads four separate bytes in this order: flag, period, floors, heritage
        flag.append(b["flag"] % 256)
        period.append(b["period"] % 256)
        floors.append(min(b["floors"], 255))
        heritage.append(b["heritage"])
        lay0.append(b["lay0"]); lay1.append(b["lay1"])
        for top, base_z, geom in b["parts"]:
            n0 = len(holes)
            for ring, hole in rings_of(geom):
                if len(ring) < 3:
                    continue
                loc = (np.c_[ring[:, 0] - base[0] - origin[0], -(ring[:, 1] - base[1]) - origin[1]]) * 10
                verts.append(np.round(loc).astype(np.int16))
                holes.append(hole)
                vert_start.append(vert_start[-1] + len(ring))
            if len(holes) == n0:
                continue
            heights.append(top); bases.append(base_z)
            ring_start.append(len(holes))
        part_start.append(len(heights))
    nB, nP, nR = len(gid), len(heights), len(holes)
    assert nB < PALE, "the viewer keeps a building index in 15 bits"
    V = np.concatenate(verts) if verts else np.zeros((0, 2), np.int16)
    out = struct.pack("<7I2f", MAGIC, nB, nP, nR, len(V), 0, 0, float(origin[0]), float(origin[1]))
    out += pad4(np.array(gid, "<u4").tobytes())
    out += pad4(np.array(year, "<i2").tobytes())
    out += pad4(np.array(flag, "u1").tobytes())
    out += pad4(np.array(period, "u1").tobytes())
    out += pad4(np.array(floors, "u1").tobytes())
    out += pad4(np.array(heritage, "u1").tobytes())
    out += np.array(lay0, "<u4").tobytes() + np.array(lay1, "<u4").tobytes()
    out += pad4(np.array(part_start, "<u4").tobytes())
    out += pad4(np.array(heights, "<f4").tobytes())
    out += pad4(np.array(bases, "<f4").tobytes())
    out += pad4(np.array(ring_start, "<u4").tobytes())
    out += pad4(np.array(vert_start, "<u4").tobytes())
    out += pad4(np.array(holes, "u1").tobytes())
    out += pad4(V.astype("<i2").tobytes())
    return out


def polygon_bin(polys, base):
    """land/water/context: u32 nPoly, nRing, nVert; ringStart; vertStart; f32 xz[] in the local frame."""
    rings, ring_start, vert_start, verts = [], [0], [0], []
    for geom in polys:
        if geom.is_empty:
            continue
        n0 = len(rings)
        for ring, _hole in rings_of(geom):
            if len(ring) < 3:
                continue
            loc = np.c_[ring[:, 0] - base[0], -(ring[:, 1] - base[1])]
            verts.append(loc.astype(np.float32))
            rings.append(ring)
            vert_start.append(vert_start[-1] + len(ring))
        if len(rings) > n0:
            ring_start.append(len(rings))
    nR = len(rings)
    nV = vert_start[-1]
    xz = np.concatenate(verts) if verts else np.zeros((0, 2), np.float32)
    out = struct.pack("<3I", len(ring_start) - 1, nR, nV)
    out += np.array(ring_start, "<u4").tobytes()
    out += np.array(vert_start, "<u4").tobytes()
    out += xz.astype("<f4").tobytes()
    return out


def extract_for(cards, extracts):
    """The first paragraph in the first language we have, Italian preferred."""
    for lang in ("it", "en", "ru"):
        title = (cards or {}).get(lang)
        if title and extracts.get(f"{lang}:{title}"):
            return extracts[f"{lang}:{title}"]
    return None


def main(area="centro"):
    fn = transformer()
    ox, oy = fn(*config.ORIGIN_LONLAT)
    print(f"origin EPSG:32633 = {ox:.1f}, {oy:.1f}")

    feats = load_geojson(config.PROCESSED / f"buildings_dated_{area}.geojson")
    parts_feats = load_geojson(config.PROCESSED / f"parts_{area}.geojson")
    wikimedia_path = config.READY / "wikimedia.json"
    wikimedia = json.loads(wikimedia_path.read_text(encoding="utf-8")) if wikimedia_path.exists() else {}
    if not wikimedia:
        print("note: data/ready/wikimedia.json not present yet - exporting without wiki cards")
    extracts_path = config.READY / "extracts.json"
    extracts = json.loads(extracts_path.read_text(encoding="utf-8")) if extracts_path.exists() else {}
    print(f"wiki links={len(wikimedia)} article summaries={len(extracts)}")
    from shapely.ops import transform as shp_transform
    island_geom = shp_transform(fn, shp_shape(json.loads(config.OSM_POLYGONS["island"].read_text(encoding="utf-8"))["features"][0]["geometry"]))
    vprg_geom = shp_transform(fn, shp_shape(json.loads(config.OSM_POLYGONS["centro"].read_text(encoding="utf-8"))["features"][0]["geometry"]))

    # ---- geometry into the local metric frame ----
    recs = []
    for f in feats:
        pr = f["properties"]
        geom = shp_transform(fn, shp_shape(f["geometry"])).simplify(SIMPLIFY, preserve_topology=True)
        if geom.is_empty:
            continue
        c = geom.representative_point()
        recs.append({"pr": pr, "geom": geom, "pt": c, "cx": c.x, "cz": -(c.y - oy), "x": c.x - ox})
    recs.sort(key=lambda r: (r["cz"], r["x"]))
    print(f"buildings: {len(recs)}")

    # ---- heights, with a labelled epoch median as the last resort ----
    def level_height(pr):
        return pr.get("height_used"), pr.get("height_source")

    by_epoch = defaultdict(list)
    for r in recs:
        h, src = level_height(r["pr"])
        if h and src == "osm_height":
            by_epoch[r["pr"].get("vprg_epoch") or "none"].append(h)
    medians = {k: float(np.median(v)) for k, v in by_epoch.items() if v}
    global_median = float(np.median([h for v in by_epoch.values() for h in v])) if by_epoch else 12.0
    print("median height by epoch:", {k: round(v, 1) for k, v in medians.items()}, "global", round(global_median, 1))

    # ---- parts: attach each building:part to the building that contains it ----
    tree = STRtree([r["geom"] for r in recs])
    parts_by_idx = defaultdict(list)
    for pf in parts_feats:
        ppr = pf["properties"]
        pgeom = shp_transform(fn, shp_shape(pf["geometry"]))
        if pgeom.is_empty:
            continue
        p = pgeom.representative_point()
        owner = None
        for idx in tree.query(p, predicate="intersects"):
            if recs[idx]["geom"].contains(p):
                owner = idx
                break
        if owner is None:
            continue
        top = ppr.get("height_used") or None
        base = None
        try:
            base = float(ppr.get("min_height")) if ppr.get("min_height") else None
        except (TypeError, ValueError):
            base = None
        parts_by_idx[owner].append((top, base, pgeom))
    print(f"building parts attached: {sum(len(v) for v in parts_by_idx.values())} of {len(parts_feats)}")

    # ---- layers (story lens) and per-building bits ----
    LAYERS = [
        {"id": "geo", "section": "География", "title": "Остров Венеции и лагуна",
         "era": "вся история города",
         "text": "Граница острова взята из OpenStreetMap (relation 4817103), исторический центр — "
                 "муниципалитет Venezia-Murano-Burano (relation 6628638). Слой показывает, какие "
                 "здания стоят на самом острове, а какие на Джудекке, Сан-Джорджо, Мурано и Бурано.",
         "caveat": "Остров и центр — разные области: остров входит в центр, но не наоборот.",
         "source": {"label": "OpenStreetMap, ODbL 1.0", "url": "https://www.openstreetmap.org/relation/4817103"},
         "groups": [{"key": "island", "label": "Остров Венеции", "bit": 0},
                    {"key": "centro", "label": "Прочие острова центра", "bit": 1}]},
        {"id": "dating", "section": "Датировка", "title": "Как известен возраст",
         "era": "до 1800 / XIX / XX век",
         "text": "Муниципальная классификация VPRG делит застройку на три эпохи: preottocentesche, "
                 "ottocentesche, novecentesche — и отдельно помечает перестроенные, слитые и "
                 "частично изменённые единицы. Это эпоха, а не год.",
         "caveat": "Класс описывает типологию и сохранность, а не дату постройки.",
         "source": {"label": "VPRG Città Antica, Comune di Venezia",
                    "url": "https://www.comune.venezia.it/it/content/clone-vprg-venezia-analisi"},
         "groups": [{"key": "pre", "label": "До 1800", "bit": 2},
                    {"key": "ott", "label": "XIX век", "bit": 3},
                    {"key": "nove", "label": "XX век", "bit": 4},
                    {"key": "transformed", "label": "Перестроено или слито", "bit": 5},
                    {"key": "undated", "label": "Класс отсутствует", "bit": 6}]},
        {"id": "form", "section": "Форма", "title": "Дворы, части и крыши",
         "era": "по данным OSM",
         "text": "У части зданий есть внутренние дворы (кольца-отверстия в контуре) и отдельные "
                 "объёмные части building:part с собственными высотами — ими заданы крыши и "
                 "надстройки, которые видно с воздуха.",
         "caveat": "Части есть только там, где их нанёс OSM; у остальных зданий одна призма.",
         "source": {"label": "OpenStreetMap, ODbL 1.0", "url": "https://www.openstreetmap.org"},
         "groups": [{"key": "hole", "label": "Есть двор", "bit": 7},
                    {"key": "part", "label": "Есть объёмные части", "bit": 8}]},
        {"id": "media", "section": "Источники", "title": "Фотографии и статьи",
         "era": "Wikimedia",
         "text": "Связи со зданиями идут по тегу wikidata: от него к статьям Википедии и файлам "
                 "Викисклада с автором и лицензией. Где тега нет, рядом со зданием ищется статья, "
                 "и такая связь помечена как предположение.",
         "caveat": "Ближайшая статья не доказывает, что она описывает это здание.",
         "source": {"label": "Wikidata, Wikipedia, Wikimedia Commons",
                    "url": "https://www.wikidata.org"},
         "groups": [{"key": "photo", "label": "Есть фотография", "bit": 9},
                    {"key": "article", "label": "Есть статья", "bit": 10},
                    {"key": "candidate", "label": "Связь предположительная", "bit": 11}]},
    ]

    # ---- wiki.json, names.json, heritage.json ----
    wiki, names, heritage, wk_of, nm_of, hi_of = [], [], [], {}, {}, {}
    for r in recs:
        pr = r["pr"]
        bid = pr["building_id"]
        w = wikimedia.get(bid)
        if w and w.get("status") == "confirmed":
            cards = w.get("sitelinks") or {}
            url = None
            for lang in ("it", "en", "ru"):
                if cards.get(lang):
                    url = f"https://{lang}.wikipedia.org/wiki/" + cards[lang].replace(" ", "_")
                    break
            photo = w.get("photo") or {}
            wk_of[bid] = len(wiki)
            wiki.append({"qid": w.get("qid"), "label": w.get("label") or pr.get("name"),
                         "architects": [], "styles": [],
                         "image": ({"thumb": photo.get("thumb"), "page": photo.get("page") or photo.get("thumb"),
                                    "artist": photo.get("artist"), "license": photo.get("license"),
                                    "licenseUrl": photo.get("license_url")} if photo.get("thumb") else None),
                         "inception": w.get("inception_year"),
                         "wiki": {"url": url, "title": cards.get("it") or cards.get("en"),
                                  "extract": extract_for(cards, extracts)},
                         "area": area})
        elif pr.get("name"):
            nm_of[bid] = len(names)
            names.append(pr["name"])
        if pr.get("heritage"):
            hi_of[bid] = len(heritage)
            heritage.append({"kind": pr.get("heritage"), "name": pr.get("name") or bid})
    print(f"wiki cards={len(wiki)} names={len(names)} heritage={len(heritage)}")

    # ---- per-building records ----
    rows, attr_list = [], []
    hist = defaultdict(lambda: [0, 0, 0, 0])
    layer_counts = Counter()
    layer_years = defaultdict(Counter)
    for gid, r in enumerate(recs):
        pr = r["pr"]
        epoch = pr.get("vprg_epoch")
        date_kind = pr.get("date_kind")
        if date_kind == "year":
            year = int(pr["osm_year"]); yfrom = yto = year; period, flag = 2, 0
        elif epoch == "preottocentesche":
            year, yfrom, yto, period, flag = 1000, 0, 1800, 0, 1
        elif epoch == "ottocentesche":
            year, yfrom, yto, period, flag = 1800, 1800, 1899, 1, 1
        elif epoch == "novecentesche":
            year, yfrom, yto, period, flag = 1900, 1900, 2026, 2, 1
        else:
            year, yfrom, yto, period, flag = 1000, 0, 0, 3, 2
        hist[year][period] += 1

        h, hsrc = pr.get("height_used"), pr.get("height_source")
        if not h:
            h = medians.get(epoch) or global_median
            hsrc = "epoch_median_estimate"
        try:
            floors = max(1, int(float(pr.get("building:levels"))))
            floors_src = 0
        except (TypeError, ValueError):
            floors = max(1, round(h / 3.0))
            floors_src = 1

        lay0 = 0
        bits = []
        if island_geom.intersects(r["geom"]):
            bits.append(0)
        if not vprg_geom.contains(r["pt"]):
            bits.append(1)
        bits.append({"preottocentesche": 2, "ottocentesche": 3, "novecentesche": 4}.get(epoch, 6))
        flags_txt = pr.get("vprg_state_flags") or ""
        if any(f in flags_txt for f in ("partial", "merged", "rebuilt")):
            bits.append(5)
        if pr.get("has_hole"):
            bits.append(7)
        if gid in parts_by_idx:
            bits.append(8)
        w = wikimedia.get(pr["building_id"])
        if w and w.get("status") == "confirmed" and (w.get("photo") or {}).get("thumb"):
            bits.append(9)
        if w and w.get("status") == "confirmed":
            bits.append(10)
        if w and w.get("status") == "candidate":
            bits.append(11)
        for b in bits:
            if b < 32:
                lay0 |= 1 << b
            layer_counts[b] += 1
            layer_years[b][year] += 1

        own_parts = parts_by_idx.get(gid)
        if own_parts:
            parts = []
            for top, base, pgeom in own_parts:
                parts.append((float(top) if top else float(h), float(base or 0.0), pgeom))
        else:
            parts = [(float(h), 0.0, r["geom"])]

        rows.append({"gid": gid, "year": year, "flag": flag, "period": period, "floors": floors,
                     "heritage": hi_of.get(pr["building_id"], -1) + 1 if pr["building_id"] in hi_of else 0,
                     "lay0": lay0, "lay1": 0, "parts": parts})
        attr_list.append({"osm": pr["osm_id"] * (1 if pr["osm_type"] == "way" else -1),
                          "year": year, "yfrom": yfrom, "yto": yto,
                          "h": int(round(h * 10)), "hsrc": H_SRC.get(hsrc, 3),
                          "fsrc": floors_src, "flag": flag,
                          "heritage": 0, "lay0": lay0, "lay1": 0,
                          "wk": wk_of.get(pr["building_id"], -1), "nm": nm_of.get(pr["building_id"], -1),
                          "hi": hi_of.get(pr["building_id"], -1), "sp": period, "src": 0, "floors": floors,
                          "dsrc": D_SRC["osm"] if date_kind == "year" else (D_SRC["vprg"] if date_kind == "interval" else D_SRC["none"]),
                          "x": r["cx"] - ox, "z": r["cz"]})

    # ---- tiles and packs ----
    out_dir = config.WEB_DATA
    for old in list(out_dir.glob("pack*.bin")):
        old.unlink()
    tile_index, blob, packs = [], bytearray(), []
    groups = defaultdict(list)
    for i, row in enumerate(rows):
        tx = math.floor(attr_list[i]["x"] / TILE); tz = math.floor(attr_list[i]["z"] / TILE)
        groups[(tx, tz)].append(i)
    for (tx, tz), idxs in groups.items():
        origin = (tx * TILE, tz * TILE)
        data = pack_tile(origin, [rows[i] for i in idxs], base=(ox, oy))
        cx, cz = origin[0] + TILE / 2, origin[1] + TILE / 2
        tile_index.append({"file": f"{tx}_{tz}.bin", "tx": tx, "tz": tz, "n": len(idxs),
                           "bytes": len(data), "dist": round(math.hypot(cx, cz))})
        tile_index[-1]["_data"] = data
    tile_index.sort(key=lambda t: t["dist"])
    for i, t in enumerate(tile_index):
        t["pack"] = f"pack{len(packs)}.bin"; t["offset"] = len(blob); t["length"] = t["bytes"]
        blob += t.pop("_data")
        if len(blob) >= PACK_BYTES or i == len(tile_index) - 1:
            packs.append(t["pack"])
            write_bin(out_dir / t["pack"], blob)
            blob = bytearray()

    attrs = np.zeros(len(attr_list), dtype=ATTR_DTYPE)
    for name in ATTR_DTYPE.names:
        attrs[name] = [a.get(name, 0) for a in attr_list]
    write_bin(out_dir / "attrs.bin", attrs.tobytes())

    # ---- ground: land, water, context ----
    networks = load_geojson(config.PROCESSED / f"networks_{area}.geojson")
    land_parts, water_parts = [], []
    for n in networks:
        pr = n["properties"]; geom = shp_shape(n["geometry"])
        if geom.geom_type != "Polygon":
            continue
        nat, lu, water = pr.get("natural"), pr.get("landuse"), pr.get("water")
        if nat == "water" or water:
            water_parts.append(shp_transform(fn, geom))
        elif nat in ("wetland", "wood", "scrub", "grassland", "heath") or lu or pr.get("leisure") == "park" \
                or pr.get("place") in ("island", "islet", "square"):
            land_parts.append(shp_transform(fn, geom))
    if not land_parts:                      # no land polygons mapped: fall back to the administrative outlines
        for name in ("island", "centro"):
            g = shp_shape(json.loads(config.OSM_POLYGONS[name].read_text(encoding="utf-8"))["features"][0]["geometry"])
            land_parts.append(shp_transform(fn, g))
    land = unary_union(land_parts) if land_parts else None
    water = unary_union(water_parts) if water_parts else None
    origin = (0.0, 0.0)
    write_bin(out_dir / "land.bin", polygon_bin([land], base=(ox, oy)) if land else polygon_bin([], base=(ox, oy)))
    write_bin(out_dir / "water.bin", polygon_bin([water], base=(ox, oy)) if water else polygon_bin([], base=(ox, oy)))
    write_bin(out_dir / "context.bin", polygon_bin([land], base=(ox, oy)) if land else polygon_bin([], base=(ox, oy)))
    (out_dir / "labels.json").write_text(
        json.dumps(labels_from(networks, fn, ox, oy), ensure_ascii=False), encoding="utf-8")
    (out_dir / "wiki.json").write_text(json.dumps(wiki, ensure_ascii=False), encoding="utf-8")
    (out_dir / "names.json").write_text(json.dumps(names, ensure_ascii=False), encoding="utf-8")
    (out_dir / "heritage.json").write_text(json.dumps(heritage, ensure_ascii=False), encoding="utf-8")
    (out_dir / "quests.json").write_text("[]", encoding="utf-8")

    layers_out = []
    for L in LAYERS:
        gs = []
        for g in L["groups"]:
            bit = g["bit"]
            gs.append({**g, "count": int(layer_counts.get(bit, 0)),
                       "years": {str(y): c for y, c in sorted(layer_years.get(bit, {}).items())[:400]}})
        layers_out.append({**L, "groups": gs})
    (out_dir / "layers.json").write_text(json.dumps(layers_out, ensure_ascii=False, indent=1), encoding="utf-8")

    cfg = {
        "city": "venezia", "label": "Венеция", "tileSize": TILE,
        "origin": [round(ox, 3), round(oy, 3)], "crs": config.CRS_METRIC,
        "home": {"x": -260, "z": -180, "azimuth": 20, "elevation": 30, "span": 3000},
        "periods": PERIODS, "yearMin": 1000, "yearMax": 2026,
        "histogram": {str(k): v for k, v in sorted(hist.items())},
        "attrStride": ATTR_DTYPE.itemsize,
        "attrFields": {n: [ATTR_DTYPE.fields[n][1], ATTR_DTYPE.fields[n][0].str] for n in ATTR_DTYPE.names if n != "pad"},
        "heritage": {"labels": HERITAGE, "colors": ["#f1eee8", "#6e2418"],
                     "counts": [len(recs) - len(heritage), len(heritage)]},
        "tiles": tile_index, "packs": packs, "shapes": {},
        "stats": {"buildings": len(recs),
                  "flags": {k: int(v) for k, v in Counter(r["flag"] for r in rows).items()},
                  "heightSrc": {k: int(v) for k, v in Counter(int(a["hsrc"]) for a in attr_list).items()},
                  "floorsTagged": sum(1 for a in attr_list if a["fsrc"] == 0),
                  "floorsHeight": sum(1 for a in attr_list if a["fsrc"] == 1),
                  "osm": len(recs), "ml": 0, "byLga": {}},
        "dateKind": dict(Counter(r["pr"].get("date_kind") for r in recs)),
        "area": area,
    }
    (out_dir / "venezia.json").write_text(json.dumps(cfg, ensure_ascii=False, separators=(",", ":")),
                                          encoding="utf-8")
    print(f"tiles={len(tile_index)} packs={len(packs)} attrs={attrs.nbytes} bytes")
    print("layers:", {g["label"]: g["count"] for L in layers_out for g in L["groups"]})
    print("date kinds:", cfg["dateKind"])


def labels_from(networks, fn, ox, oy):
    """Place labels for the map: canals and squares, from OSM names, in the local frame."""
    out = []
    seen = set()
    for n in networks:
        pr = n["properties"]
        name = pr.get("name")
        if not name or name in seen:
            continue
        water = pr.get("water") in ("canal", "river", "lagoon", "harbour") or pr.get("natural") == "water"
        square = pr.get("place") in ("square", "island", "islet") or pr.get("highway") == "pedestrian"
        if not (water or square):
            continue
        geom = shp_shape(n["geometry"])
        if geom.is_empty:
            continue
        c = geom.representative_point()
        lx, lz = c.x - ox, -(c.y - oy)
        seen.add(name)
        out.append({"name": name, "water": bool(water),
                    "tier": 1 if water else 2,
                    "pts": [[round(lx, 1), round(lz, 1), 0.0, 600, 200]]})
    return out


if __name__ == "__main__":
    main(*(sys.argv[1:] or ["centro"]))