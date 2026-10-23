"""Связывание зданий Венеции с Викиданными.

Что делает шаг:
  1. Забирает все предметы Викиданных, которые «находятся в Венеции» (P131 = Q641), с координатами,
     классом и датой — это пул кандидатов.
  2. Забирает свойства предметов: дата (с точностью), архитектор, стиль, охранный статус, высота,
     изображение, названия и ссылки на Википедию на трёх языках.
  3. Сопоставляет предметы с нашими объектами геометрически: точка предмета внутри контура здания
     или моста, иначе — ближайший в пределах допуска.
  4. Пишет результат в data/processed/wikidata_match_{area}.json — по одному словарю на объект.

Всё кэшируется в data/processed/api_cache/, поэтому повторный запуск не ходит в сеть.
"""
from __future__ import annotations

import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict

from pyproj import Transformer
from shapely.geometry import Point
from shapely.geometry import shape as shp_shape
from shapely.ops import transform as shp_transform
from shapely.strtree import STRtree

from venice import config

WD_API = "https://www.wikidata.org/w/api.php"
WD_QUERY = "https://query.wikidata.org/sparql"
UA = "VeniceByBuilding/1.0 (atlas data pipeline; https://github.com/maximosovsky/venice-by-building)"
CACHE = config.PROCESSED / "api_cache"
MATCH_TOLERANCE_M = 18.0        # ближайший объект дальше этого не считается тем же зданием
BRIDGE_CLASSES = {"Q3397526", "Q1068842", "Q158438", "Q12280"}     # каменный, пешеходный, арочный, мост
BUILDING_CLASSES = {"Q16560", "Q16970", "Q3950", "Q27686", "Q41176", "Q23413", "Q1497364", "Q3947",
                    "Q11755880", "Q19844914", "Q15243209", "Q1370598", "Q15848826", "Q16917", "Q7075",
                    "Q9842", "Q126807", "Q166118", "Q385994", "Q4303352", "Q2293362", "Q132775089"}
PROPS = ("P571", "P84", "P149", "P1435", "P2048", "P625", "P31", "P276", "P88", "P1619")


def fetch(url, params=None, tries=4, timeout=120):
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/sparql-results+json, application/json"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as exc:                      # сеть и лимиты: повторяем с паузой
            last = exc
            time.sleep(6 * (attempt + 1))
    raise RuntimeError(f"{url} не отвечает: {last}")


def cached(name, make):
    path = CACHE / name
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    value = make()
    path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
    return value


def venice_items():
    """Предметы «в Венеции» с координатами, классом и датой."""
    def make():
        rows = fetch(WD_QUERY, {"query": """
SELECT ?item ?class ?date ?prec ?lat ?lon WHERE {
  ?item wdt:P131 wd:Q641 ; wdt:P625 ?coords .
  OPTIONAL { ?item wdt:P31 ?class }
  OPTIONAL { ?item wdt:P571 ?date . ?item p:P571/psv:P571 ?n . ?n wikibase:timePrecision ?prec }
  ?item p:P625/psv:P625 ?c . ?c wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon .
}""", "format": "json"})["results"]["bindings"]
        out = {}
        for r in rows:
            qid = r["item"]["value"].rsplit("/", 1)[-1]
            it = out.setdefault(qid, {"classes": [], "date": None, "precision": None,
                                      "lat": float(r["lat"]["value"]), "lon": float(r["lon"]["value"])})
            cls = r.get("class", {}).get("value", "").rsplit("/", 1)[-1]
            if cls and cls not in it["classes"]:
                it["classes"].append(cls)
            if r.get("date"):
                it["date"] = r["date"]["value"]
                it["precision"] = int(r.get("prec", {}).get("value", 0) or 0)
        return out
    return cached("wikidata_venice_items.json", make)


def entities(qids):
    """Свойства предметов, по 50 за запрос."""
    getter = lambda ids: cached("wikidata_entities/" + ids[0].replace(":", "_") + f"_{len(ids)}.json",
                               lambda: fetch(WD_API, {"action": "wbgetentities", "format": "json",
                                                      "ids": "|".join(ids), "props": "claims|labels|sitelinks",
                                                      "languages": "ru|it|en", "sitefilter": "ruwiki|itwiki|enwiki"}))
    out = {}
    ordered = sorted(qids)
    for i in range(0, len(ordered), 50):
        chunk = ordered[i:i + 50]
        data = getter(chunk)
        out.update(data.get("entities", {}))
        time.sleep(0.3)
    return out


def claim_values(entity, prop, limit=8):
    vals = []
    for claim in (entity.get("claims", {}) or {}).get(prop, []) or []:
        dv = (((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value"))
        if dv is None:
            continue
        vals.append(dv)
        if len(vals) >= limit:
            break
    return vals


def time_of(entity):
    """Дата P571 и её точность: 11 день, 10 месяц, 9 год, 8 десятилетие, 7 век."""
    for claim in (entity.get("claims", {}) or {}).get("P571", []) or []:
        dv = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value") or {}
        if "time" not in dv:
            continue
        raw = dv["time"].lstrip("+")
        year = int(raw[1:5]) if raw[:1] == "-" else int(raw.split("-")[0])
        if dv.get("time", "").startswith("-"):
            year = -int(dv["time"].lstrip("+-").split("-")[0][:4] or 0)
        return {"year": year, "precision": dv.get("timePrecision"), "raw": dv["time"]}
    return None


def match(items, area):
    """Точка предмета внутри контура объекта; иначе ближайший в пределах допуска."""
    fn = Transformer.from_crs("EPSG:4326", config.CRS_METRIC, always_xy=True).transform
    objects = []
    for kind, path, key in (("building", config.PROCESSED / f"buildings_dated_{area}.geojson", "building_id"),
                            ("bridge", config.PROCESSED / f"networks_{area}.geojson", None)):
        feats = json.loads(path.read_text(encoding="utf-8"))["features"]
        for n, f in enumerate(feats):
            pr = f.get("properties") or {}
            if key is None and pr.get("man_made") != "bridge":
                continue
            geom = shp_shape(f["geometry"])
            if geom.is_empty:
                continue
            objects.append({"kind": kind, "idx": n, "id": pr.get("building_id") or f"b{pr.get('osm_id')}",
                            "name": pr.get("name"), "geom": shp_transform(fn, geom)})
    tree = STRtree([o["geom"] for o in objects])
    print(f"объектов для сопоставления: {len(objects)}")

    found, taken = {}, set()
    for qid, it in items.items():
        pt = Point(*fn(it["lon"], it["lat"]))
        hit, dist = None, None
        for cand in tree.query(pt, predicate="intersects"):
            if objects[cand]["geom"].covers(pt):
                hit, dist = cand, 0.0
                break
        if hit is None:
            near = tree.query(pt.buffer(MATCH_TOLERANCE_M))
            best = None
            for cand in near:
                d = objects[cand]["geom"].distance(pt)
                if d <= MATCH_TOLERANCE_M and (best is None or d < best[1]):
                    best = (cand, d)
            if best:
                hit, dist = best
        if hit is None:
            continue
        obj = objects[hit]
        found.setdefault(obj["id"], []).append({"qid": qid, "distance": round(dist, 1), "kind": obj["kind"]})
        taken.add(qid)
    return objects, found, taken


def main(area="centro"):
    items = venice_items()
    print(f"предметов Венеции с координатами: {len(items)}")

    from venice import s04_wikimedia as s04

    wm = json.loads((config.READY / "wikimedia.json").read_text(encoding="utf-8"))
    entries = wm if isinstance(wm, list) else list(wm.values())
    ours = {e["qid"]: e for e in entries if e.get("qid")}
    print(f"наших связей уже: {len(ours)}")

    objects, found, taken = match(items, area)
    print(f"предметов сопоставлено с нашими объектами: {len(taken)}")

    extra_qids = sorted(set(ours) | taken)
    ents = entities(extra_qids)
    print(f"свойств получено для: {len(ents)}")

    # мосты: ищем предметы, которых у нас ещё нет, по координатам
    result = {"objects": {}, "unmatched_items": [], "counts": {}}
    for obj_id, hits in found.items():
        hit = sorted(hits, key=lambda h: h["distance"])[0]
        e = ents.get(hit["qid"]) or {}
        result["objects"][obj_id] = {"qid": hit["qid"], "distance": hit["distance"], "kind": hit["kind"],
                                     "n_claims": len(e.get("claims", {}) or {})}

    matched_qids = {h["qid"] for hits in found.values() for h in hits}
    for qid, it in items.items():
        if qid in matched_qids:
            continue
        e = ents.get(qid) or {}
        result["unmatched_items"].append({"qid": qid, "classes": it["classes"], "date": it["date"],
                                          "lat": it["lat"], "lon": it["lon"],
                                          "name": ((e.get("labels") or {}).get("it") or {}).get("value")})

    result["counts"] = {"items": len(items), "matched_objects": len(result["objects"]),
                        "matched_items": len(matched_qids), "unmatched": len(result["unmatched_items"])}
    out = config.PROCESSED / f"wikidata_match_{area}.json"
    out.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"готово: {out} {result['counts']}")


if __name__ == "__main__":
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else "centro")