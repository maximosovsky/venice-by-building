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
import re
import struct
import sys
from collections import Counter, defaultdict

import numpy as np
from pyproj import Transformer
from shapely.geometry import shape as shp_shape, Point, mapping
from shapely.ops import unary_union, transform as shp_transform
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

HERITAGE = ["Объект наследия (тег OSM)", "Охранный статус (Wikidata)"]

ATTR_DTYPE = np.dtype([
    ("osm", "<f8"), ("year", "<i2"), ("yfrom", "<i2"), ("yto", "<i2"),
    ("h", "<u2"), ("hsrc", "u1"), ("fsrc", "u1"), ("flag", "u1"), ("heritage", "u1"),
    ("lay0", "<u4"), ("lay1", "<u4"), ("wk", "<i4"), ("nm", "<i4"), ("hi", "<i4"), ("sp", "<u4"),
    ("src", "u1"), ("floors", "u1"), ("dsrc", "u1"), ("pad", "u1"), ("x", "<f4"), ("z", "<f4"),
])

# 2 — измеренная высота муниципальной съёмки 2010 года: карниз минус собственное основание.
# Ниже двух метров это не дом, а парапет, ступень или ограда: такие отметки не берём.
MIN_BUILDING_HEIGHT = 2.0
H_SRC = {"osm_height": 0, "osm_levels_estimate": 1, "municipal_survey_2010": 2,
         "epoch_median_estimate": 3, "bridge_assumed": 4, "wikidata_height": 5}
# 4 — год из статьи итальянской Википедии: он берётся только там, где Викиданные молчат,
# и показывается со фразой-свидетельством, потому что говорит иногда о части комплекса.
D_SRC = {"osm": 0, "vprg": 1, "wikidata": 2, "none": 3, "itwiki": 4}

# Layer bits the story lens switches on and off.
BIT_ISLAND, BIT_OTHER_ISLANDS, BIT_PRE, BIT_OTT, BIT_NOVE, BIT_TRANSFORMED, BIT_UNDATED = 0, 1, 2, 3, 4, 5, 6
BIT_HOLE, BIT_PART, BIT_PHOTO, BIT_ARTICLE, BIT_CANDIDATE, BIT_BRIDGE = 7, 8, 9, 10, 11, 12

BRIDGE_DECK_TOP = 3.0        # metres above water: assumed, OSM carries no bridge heights
BRIDGE_DECK_BASE = 1.5       # the deck hovers over the canal instead of filling it

STREET_WIDTH = {"pedestrian": 3.5, "footway": 3.0, "steps": 2.0, "residential": 5.0, "service": 4.0,
                "unclassified": 4.0, "living_street": 4.0, "cycleway": 3.0, "path": 2.5,
                "tertiary": 7.0, "secondary": 8.0, "primary": 9.0}


MEDIA_MANIFEST = config.WEB_DATA.parent / "media" / "manifest.json"
_MEDIA_CACHE = None


def local_photo(qid):
    """Файл локальной копии фотографии, если ступень s11_media его уже сделала."""
    global _MEDIA_CACHE
    if _MEDIA_CACHE is None:
        _MEDIA_CACHE = {}
        if MEDIA_MANIFEST.exists():
            try:
                _MEDIA_CACHE = json.loads(MEDIA_MANIFEST.read_text(encoding="utf-8"))
            except Exception as exc:                       # битый манифест не должен ломать выгрузку
                print("   манифест фотографий не прочитан:", exc)
                _MEDIA_CACHE = {}
    return (_MEDIA_CACHE.get(qid) or {}).get("file")

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


def extracts_for(cards, extracts):
    """Первый абзац статьи на каждом языке, где он есть: карточка показывает его на языке карты."""
    out = {}
    for lang in ("ru", "it", "en"):
        title = (cards or {}).get(lang)
        if title and extracts.get(f"{lang}:{title}"):
            out[lang] = extracts[f"{lang}:{title}"]
    return out or None


# A street, a canal or a square is not a building: Wikidata items for those sit inside or beside a
# footprint and would otherwise put a street's name on a house. A bridge matched to a bridge deck is
# the right link and stays.
PLACE_WORDS = re.compile(
    r"^(via|viale|calle|calletta|salizada|traversa|campo|campiello|corte|ramo|sotoportego|"
    r"fondamenta|riva|molo|lista|strada|piazza|piazzetta|rio|riello|canale|canal|laguna|"
    r"ponte|banchina|lungofiume)" r"(\s|$)", re.I)
PLACE_CLASSES = re.compile(
    r"street|calle|salizada|campo|campiello|corte|square|piazza|piazzetta|canal|canale|waterway|"
    r"rio\b|riello|road|quay|banchina|fondamenta|riva|molo|lungofiume|embankment|landing|pier|"
    r"stop|ferry|harbour|harbor|bridge|ponte|district|distretto|island|sestiere", re.I)


def place_like(wd, name, is_bridge):
    """True when an item is a place in the city rather than a building standing here."""
    head = (name or "").strip().lower()
    if head and PLACE_WORDS.match(head) and not (is_bridge and head.startswith("ponte")):
        return True
    for c in wd.get("classes") or ():
        la = c.get("la") or {}
        text = ((la.get("it") or "") + " " + (la.get("en") or "")).strip()
        if not text:
            continue
        # Мост, привязанный к настилу моста, — верная связь, а не чужое место.
        if is_bridge and re.search(r"bridge|ponte", text):
            continue
        if PLACE_CLASSES.search(text):
            return True
    return False


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
    island_geom = shp_transform(fn, shp_shape(json.loads(config.OSM_POLYGONS["island"].read_text(encoding="utf-8"))["features"][0]["geometry"]))
    vprg_geom = shp_transform(fn, shp_shape(json.loads(config.OSM_POLYGONS["centro"].read_text(encoding="utf-8"))["features"][0]["geometry"]))
    networks = load_geojson(config.PROCESSED / f"networks_{area}.geojson")

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

    # ---- bridges: mapped decks, drawn as their own layer ----
    bridges = bridge_records(networks, fn, ox, oy)
    bridges.sort(key=lambda r: (r["cz"], r["x"]))
    print(f"bridges: {len(bridges)}")

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
        {"id": "works", "section": "Сооружения", "title": "Мосты",
         "era": "как стоят сегодня",
         "text": "465 мостовых сооружений, нанесённых в OpenStreetMap отдельными площадками: настил показан "
                 "плитой над каналом. У 375 мостов есть имя — от Понте-деи-Соспири до Понте-делла-Коституцьоне; "
                 "имена видны на карте и находятся через поиск.",
         "caveat": "В OSM у венецианских мостов нет ни высот, ни дат постройки: высота настила принята за "
                   "3 метра, год не указан. Это сооружение, а не здание.",
         "source": {"label": "OpenStreetMap, man_made=bridge, ODbL 1.0",
                    "url": "https://www.openstreetmap.org"},
         "groups": [{"key": "bridges", "label": "Мосты", "bit": 12}]},
    ]

    # ---- wiki.json, names.json, heritage.json ----
    # Обогащение из Викиданных: связь по геометрии, а не только по тегу wikidata в OSM.
    enriched_path = config.READY / "wikidata_enriched.json"
    enriched = json.loads(enriched_path.read_text(encoding="utf-8")) if enriched_path.exists() else {}
    # Измеренные высоты муниципальной съёмки 2010 года (ступень s09).
    muni_path = config.PROCESSED / f"municipal_heights_{area}.geojson"
    municipal = {}
    if muni_path.exists():
        for f in json.loads(muni_path.read_text(encoding="utf-8"))["features"]:
            pr_m = f.get("properties") or {}
            if pr_m.get("building_id") and pr_m.get("height_m"):
                municipal[pr_m["building_id"]] = float(pr_m["height_m"])
    print(f"муниципальные высоты: {len(municipal)} зданий")
    # Годы из статей итальянской Википедии (ступень s10): только принятые, без спорных.
    article_dates = {}
    itwiki_path = config.PROCESSED / f"itwiki_dates_{area}.json"
    if itwiki_path.exists():
        article_dates = json.loads(itwiki_path.read_text(encoding="utf-8")).get("accepted") or {}
    print(f"годы из статей итальянской Википедии: {len(article_dates)}")
    wd_objects = enriched.get("objects") or {}
    wd_pois = enriched.get("pois") or []
    print(f"wikidata: объектов обогащения={len(wd_objects)} подписей-точек={len(wd_pois)}")

    def wd_lang(items, lang):
        """Названия свойств (архитектор, стиль, статус) на языке карты, иначе на итальянском."""
        out = []
        for item in items or []:
            la = (item or {}).get("la") or {}
            out.append(la.get(lang) or la.get("it") or la.get("en") or "")
        return [x for x in out if x]

    wiki, names, heritage, wk_of, nm_of, hi_of = [], [], [], {}, {}, {}
    for r in recs + bridges:
        pr = r["pr"]
        bid = pr["building_id"]
        is_bridge = bool(pr.get("is_bridge"))
        w = wikimedia.get(bid)
        wd = wd_objects.get(bid) or {}
        # Связь по тегу wikidata в OSM — или, если тега нет, по геометрии из Викиданных.
        covered = bool(w and w.get("status") == "confirmed")
        cards = (w.get("sitelinks") if covered else None) or (wd.get("sl") or {})
        qid = (w.get("qid") if covered else None) or wd.get("qid")
        photo = (w.get("photo") if covered else None) or wd.get("photo") or {}
        labels_la = ({"it": w.get("label")} if covered and w.get("label") else {}) or (wd.get("la") or {})
        ex = extracts_for(cards, extracts) or {}
        url = None
        for lang in ("it", "en", "ru"):
            if cards.get(lang):
                url = f"https://{lang}.wikipedia.org/wiki/" + cards[lang].replace(" ", "_")
                break
        image = ({"thumb": photo.get("thumb"), "page": photo.get("page") or photo.get("thumb"),
                  "artist": photo.get("artist"), "license": photo.get("license"),
                  "licenseUrl": photo.get("license_url")} if photo.get("thumb") else None)
        if image:
            # Локальная уменьшенная копия: карточка берёт её, а страница файла и автор остаются для атрибуции.
            local = local_photo(qid)
            if local:
                image["remote"] = image["thumb"]
                image["thumb"] = local
                image["local"] = True
        rich = {"qid": qid, "label": labels_la.get("it") or pr.get("name"), "la": labels_la,
                "architects": wd_lang(wd.get("architects"), "it"), "styles": wd_lang(wd.get("styles"), "it"),
                "architects_la": {k: wd_lang(wd.get("architects"), k) for k in ("ru", "it", "en")},
                "styles_la": {k: wd_lang(wd.get("styles"), k) for k in ("ru", "it", "en")},
                "image": image, "inception": (w.get("inception_year") if covered else None) or (wd.get("date") or {}).get("year"),
                "height": wd.get("height"), "byGeometry": not covered,
                "wiki": {"url": url, "title": cards.get("it") or cards.get("en"),
                         "extract": ex.get("it") or ex.get("en") or ex.get("ru")},
                "ex": ex, "area": area}
        # Год из статьи итальянской Википедии: показываем только там, где Викиданные молчат,
        # и всегда вместе с фразой, из которой он взят.
        article = article_dates.get(wd.get("qid")) if not wd.get("date") else None
        if article and article.get("evidence"):
            rich["date_from_article"] = {"year": int(article["year"]),
                                         "from": article.get("source"),
                                         "sentence": str(article["evidence"])[:180],
                                         "title": article.get("title")}
        # Пустые поля не пишем: карточек теперь много, и каждая должна быть лёгкой.
        rich = {k: v for k, v in rich.items() if v not in (None, [], {}, "")}
        named = bool(rich.get("la") or rich.get("label"))
        if covered and named:
            wk_of[bid] = len(wiki)
            wiki.append(rich)
        elif wd and named and not place_like(wd, labels_la.get("it") or "", is_bridge):
            # Новое: имя, фотография или статья, найденные сопоставлением по координатам.
            wk_of[bid] = len(wiki)
            wiki.append(rich)
        elif pr.get("name"):
            nm_of[bid] = len(names)
            names.append(pr["name"])
        heritage_items = wd.get("heritage") or []
        if heritage_items or pr.get("heritage"):
            hi_of[bid] = len(heritage)
            heritage.append({"kind": "wd" if heritage_items else pr.get("heritage"),
                             "name": {"ru": wd_lang(heritage_items, "ru"), "it": wd_lang(heritage_items, "it"),
                                      "en": wd_lang(heritage_items, "en")} if heritage_items
                                     else (pr.get("name") or bid),
                             "qid": qid})
    print(f"wiki cards={len(wiki)} names={len(names)} heritage={len(heritage)}")

    # ---- per-building records ----
    rows, attr_list = [], []
    hist = defaultdict(lambda: [0, 0, 0, 0])
    layer_counts = Counter()
    layer_years = defaultdict(Counter)
    for gid, r in enumerate(recs + bridges):
        pr = r["pr"]
        is_bridge = bool(pr.get("is_bridge"))
        epoch = pr.get("vprg_epoch")
        date_kind = pr.get("date_kind")
        wd = wd_objects.get(pr["building_id"]) or {}
        if is_bridge:
            # a bridge is a structure as the city stands today; no age is claimed for it
            year, yfrom, yto, period, flag, dsrc_code = 1000, 0, 0, 3, 2, D_SRC["none"]
        elif date_kind == "year":
            year = int(pr["osm_year"]); yfrom = yto = year; period, flag = 2, 0
            dsrc_code = D_SRC["osm"]
        elif epoch == "preottocentesche":
            year, yfrom, yto, period, flag, dsrc_code = 1000, 0, 1800, 0, 1, D_SRC["vprg"]
        elif epoch == "ottocentesche":
            year, yfrom, yto, period, flag, dsrc_code = 1800, 1800, 1899, 1, 1, D_SRC["vprg"]
        elif epoch == "novecentesche":
            year, yfrom, yto, period, flag, dsrc_code = 1900, 1900, 2026, 2, 1, D_SRC["vprg"]
        else:
            year, yfrom, yto, period, flag, dsrc_code = 1000, 0, 0, 3, 2, D_SRC["none"]
        # Викиданные: год постройки, найденный по координатам. День, месяц и год — точная дата;
        # десятилетие и век — интервал, и он показывается как эпоха, а не как год.
        wd_date = wd.get("date") or {}
        if wd_date and flag != 0:
            wy = int(wd_date.get("year") or 0)
            if wd_date.get("kind") == "year" and 1000 <= wy <= 2026:
                year, yfrom, yto, period, flag = wy, wy, wy, (0 if wy < 1800 else 1 if wy < 1900 else 2), 0
                dsrc_code = D_SRC["wikidata"]
            elif wd_date.get("kind") == "interval":
                yfrom = max(1000, int(wd_date.get("from") or wy))
                yto = min(2026, int(wd_date.get("to") or wy))
                year, period, flag = yfrom, (0 if yto < 1800 else 1 if yfrom < 1900 else 2), 1
                dsrc_code = D_SRC["wikidata"]
        # Год из статьи итальянской Википедии — только там, где Викиданные молчат.
        article = article_dates.get(wd.get("qid")) if not wd_date else None
        if article and flag != 0:
            ay = int(article.get("year") or 0)
            if 1000 <= ay <= 2026:
                year, yfrom, yto, period, flag = ay, ay, ay, (0 if ay < 1800 else 1 if ay < 1900 else 2), 0
                dsrc_code = D_SRC["itwiki"]
        hist[year][period] += 1 if not is_bridge else 0

        h, hsrc = pr.get("height_used"), pr.get("height_source")
        # Измеренная съёмка города старше и тега OSM, и наших оценок: она измеряет карниз.
        muni_h = municipal.get(pr["building_id"])
        if muni_h and not is_bridge:
            h, hsrc = muni_h, "municipal_survey_2010"
        # Измеренная высота из Викиданных старше любой нашей оценки — но только правдоподобная:
        # в Викиданных попадаются ошибки единиц (1000 м, 395 м, 0,99 м у моста) и они не должны
        # ломать модель. У зданий Венеции разумный предел — 120 м (кампанила Сан-Марко 98,6).
        # У мостов высота из Викиданных — это просвет или высота пролёта, а не настил: настил
        # остаётся принятой плитой, а измеренная высота показывается в карточке отдельной строкой.
        wd_h = wd.get("height")
        if not (muni_h and not is_bridge) and wd_h and not is_bridge and 2.0 <= float(wd_h) <= 120.0:
            h, hsrc = float(wd_h), "wikidata_height"
        # Очень низкая отметка означает не здание, а парапет или ступень: такой тег не используем.
        if not h or float(h) < MIN_BUILDING_HEIGHT:
            h = medians.get(epoch) or global_median
            hsrc = "epoch_median_estimate"
        try:
            floors = max(1, min(120, int(float(pr.get("building:levels")))))
            floors_src = 0
        except (TypeError, ValueError):
            floors = max(1, min(120, round(h / 3.0)))
            floors_src = 1

        lay0 = 0
        bits = []
        if is_bridge:
            bits = [BIT_BRIDGE]          # a bridge is its own layer; it belongs to no age and no island set
        else:
            if island_geom.intersects(r["geom"]):
                bits.append(BIT_ISLAND)
            if not vprg_geom.contains(r["pt"]):
                bits.append(BIT_OTHER_ISLANDS)
            bits.append({"preottocentesche": BIT_PRE, "ottocentesche": BIT_OTT,
                         "novecentesche": BIT_NOVE}.get(epoch, BIT_UNDATED))
            flags_txt = pr.get("vprg_state_flags") or ""
            if any(f in flags_txt for f in ("partial", "merged", "rebuilt")):
                bits.append(BIT_TRANSFORMED)
            if pr.get("has_hole"):
                bits.append(BIT_HOLE)
            if gid in parts_by_idx:
                bits.append(BIT_PART)
            w = wikimedia.get(pr["building_id"])
            # Фотография и статья теперь считаются по карточке: она может прийти и от связи
            # по координатам, а не только от тега wikidata в самом здании.
            wk = wk_of.get(pr["building_id"], -1)
            card = wiki[wk] if 0 <= wk < len(wiki) else None
            if card and (card.get("image") or {}).get("thumb"):
                bits.append(BIT_PHOTO)
            if card and (card.get("wiki") or {}).get("url"):
                bits.append(BIT_ARTICLE)
            if (w and w.get("status") == "candidate") or (card and card.get("byGeometry")):
                bits.append(BIT_CANDIDATE)
        for b in bits:
            if b < 32:
                lay0 |= 1 << b
            layer_counts[b] += 1
            layer_years[b][year] += 1

        own_parts = None if is_bridge else parts_by_idx.get(gid)
        if is_bridge:
            parts = [(BRIDGE_DECK_TOP, BRIDGE_DECK_BASE, r["geom"])]
        elif own_parts:
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
                          "heritage": (2 if (wd.get("heritage") or []) else (1 if pr.get("heritage") else 0)),
                          "lay0": lay0, "lay1": 0,
                          "wk": wk_of.get(pr["building_id"], -1), "nm": nm_of.get(pr["building_id"], -1),
                          "hi": hi_of.get(pr["building_id"], -1), "sp": period,
                          "src": 1 if is_bridge else 0, "floors": floors,
                          "dsrc": dsrc_code,
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
        json.dumps(labels_from(networks, bridges, fn, ox, oy, wd_pois), ensure_ascii=False), encoding="utf-8")
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
        # The viewer pairs labels[i] with counts[i + 1] and paints code i + 1 with colors[i + 1]:
        # counts[0] is the total, and a heritage code of 1 or 2 picks the first or second label.
        "heritage": {"labels": HERITAGE, "colors": ["#f1eee8", "#6e2418", "#8a6b3f"],
                     "counts": [len(attr_list),
                                sum(1 for a in attr_list if int(a["heritage"]) == 1),
                                sum(1 for a in attr_list if int(a["heritage"]) == 2)]},
        "tiles": tile_index, "packs": packs, "shapes": {},
        "stats": {"buildings": len(recs), "bridges": len(bridges), "objects": len(rows),
                  "byArticle": sum(1 for a in attr_list if a.get("dsrc") == 4),
                  "measured": sum(1 for a in attr_list if a.get("hsrc") == 2),
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


def bridge_records(networks, fn, ox, oy):
    """Bridges as drawn objects: the mapped deck polygon, no date, an assumed deck height.

    OSM carries no height for any bridge in these extracts, so the deck is drawn as a slab
    hovering over the canal and the card says the height is assumed, not measured.
    """
    out = []
    for n in networks:
        pr = n["properties"]
        if pr.get("man_made") != "bridge":
            continue
        geom = shp_transform(fn, shp_shape(n["geometry"]))
        if geom.is_empty:
            continue
        if geom.geom_type == "MultiPolygon":
            geom = max(geom.geoms, key=lambda g: g.area)
        if geom.geom_type != "Polygon":
            continue
        c = geom.representative_point()
        out.append({"pr": {"building_id": f"b{pr.get('osm_id')}", "osm_type": "way", "osm_id": pr.get("osm_id"),
                           "name": pr.get("name"), "is_bridge": True, "date_kind": "unknown",
                           "vprg_epoch": None, "height_used": BRIDGE_DECK_TOP,
                           "height_source": "bridge_assumed", "has_hole": len(geom.interiors) > 0},
                    "geom": geom, "pt": c, "cx": c.x, "cz": -(c.y - oy), "x": c.x - ox})
    return out


def labels_from(networks, bridges, fn, ox, oy, pois=()):
    """Place labels for the map, in the viewer's own form: [[x, z, angle, stretch length, width]].

    angle is degrees from +x towards +z in the local frame, which is what the viewer's label
    rotation expects; the length lets the viewer drop a name that would spill over the buildings.
    """
    out = []
    for n in networks:
        pr = n["properties"]
        name = pr.get("name")
        if not name:
            continue
        geom = shp_transform(fn, shp_shape(n["geometry"]))
        if geom.is_empty:
            continue
        nat, water, place, highway = pr.get("natural"), pr.get("water"), pr.get("place"), pr.get("highway")
        if geom.geom_type == "Polygon":
            c = geom.representative_point()
            span = math.sqrt(geom.area)
            if nat == "water" or water:
                wide = water in ("lagoon", "bay", "harbour") and geom.area > 2e5
                out.append({"name": name, "water": True, "tier": 0 if wide else 1,
                            "pts": [[round(c.x - ox, 1), round(-(c.y - oy), 1), 0,
                                     round(max(span, 60), 1), round(max(30, span * 0.4), 1)]]})
            elif place in ("island", "islet", "square"):
                out.append({"name": name, "water": False, "tier": 1 if place == "island" else 2,
                            "pts": [[round(c.x - ox, 1), round(-(c.y - oy), 1), 0,
                                     round(max(span, 40), 1), round(max(24, span * 0.5), 1)]]})
        elif geom.geom_type == "LineString" and highway in STREET_WIDTH:
            length = geom.length
            if length < 14:
                continue
            p1 = geom.interpolate(length / 2)
            p2 = geom.interpolate(min(length / 2 + 2, length))
            ang = math.degrees(math.atan2(-(p2.y - p1.y), p2.x - p1.x))
            # Набережные и главные проходы читаются раньше и с большего расстояния, чем калле.
            waterfront = name.startswith(("Fondamenta", "Fond", "Riva", "Molo", "Lista", "Strada", "Via ",
                                          "Calle Larga", "Rio Ter", "Salizada"))
            tier = 1 if waterfront else (3 if highway == "steps" else 2)
            out.append({"name": name, "water": False, "tier": tier,
                        "pts": [[round(p1.x - ox, 1), round(-(p1.y - oy), 1), round(ang, 1),
                                 round(length, 1), round(max(STREET_WIDTH[highway], 5.5), 1)]]})
    for b in bridges:
        pr = b["pr"]
        name = pr.get("name")
        if not name:
            continue
        geom = b["geom"]
        c = geom.representative_point()
        coords = list(geom.minimum_rotated_rectangle.exterior.coords)
        lengths = [(math.dist(coords[i], coords[i + 1]), coords[i], coords[i + 1]) for i in range(4)]
        longest = max(lengths, key=lambda t: t[0])
        ang = math.degrees(math.atan2(-(longest[2][1] - longest[1][1]), longest[2][0] - longest[1][0]))
        width = min(l for l, _, _ in lengths)
        out.append({"name": name, "water": False, "tier": 2, "bridge": True,
                    "pts": [[round(c.x - ox, 1), round(-(c.y - oy), 1), round(ang, 1),
                             round(longest[0], 1), round(max(width, 4.0), 1)]]})
    # Предметы Викиданных, которым не нашлось здания: причалы, отели, школы, библиотеки.
    # Это подписи-точки: имя и вид места, без геометрии.
    for poi in pois or ():
        la = poi.get("la") or {}
        name = la.get("it") or la.get("en")
        if not name or not poi.get("lat"):
            continue
        x, y = fn(poi["lon"], poi["lat"])
        classes = [c for c in (poi.get("classes") or []) if (c.get("la") or {}).get("it")]
        kind = (classes[0].get("la") if classes else {}) or {}
        out.append({"name": name, "water": False, "tier": 2, "poi": kind,
                    "pts": [[round(x - ox, 1), round(-(y - oy), 1), 0.0, 90.0, 12.0]]})
    # most important first: this is also the order the viewer builds its search list in
    out.sort(key=lambda L: (L["tier"], -L["pts"][0][3]))
    return out


if __name__ == "__main__":
    main(*(sys.argv[1:] or ["centro"]))