"""Бирюзовый набор карты: все религиозные здания по тегам OSM, а не только остановки маршрута.

`church_building_manifest.py` собирает набор из остановок церковного маршрута, а маршрут идёт по
центру: островные церкви — Сан-Микеле ин Изола, Торчелло, Мурано, Бурано, Маццорбо, Сан-Ладзаро —
в него не попадали и оставались терракотовыми. Владелец атласа потребовал бирюзу для всех церквей,
монастырей и синагог, поэтому набор строится по тегам самого здания.

Идентичность берётся точная: пара (osm_type, osm_id) из `buildings_centro.geojson`, никаких догадок
по соседству или геометрии. Набор маршрута объединяется с теговым: он содержит проверенные вручную
хосты, у которых тегов может не быть.

Run: python -m venice.church_turquoise
"""
from __future__ import annotations

import gzip
import hashlib
import json
import struct
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Классы зданий, которые атлас считает религиозными. Бывшая церковь остаётся церковью по
# конструкции: в Венеции таких немало (залы, выставочные площадки), и они тоже бирюзовые.
RELIGIOUS_BUILDINGS = {
    "church", "chapel", "cathedral", "basilica", "synagogue", "monastery",
    "convent", "abbey", "cloister", "shrine", "temple", "mosque", "wayside_shrine",
}
RELIGIOUS_AMENITIES = {"place_of_worship", "monastery", "convent", "chapel"}


def religious_tags(properties):
    """Почему здание попало в набор: теги, по которым это видно, или пусто."""
    tags = []
    building = (properties.get("building") or "").strip().lower()
    amenity = (properties.get("amenity") or "").strip().lower()
    if amenity in RELIGIOUS_AMENITIES:
        tags.append(f"amenity={amenity}")
    if building in RELIGIOUS_BUILDINGS:
        tags.append(f"building={building}")
    if (properties.get("religion") or "").lower() in ("christian", "jewish", "muslim"):
        tags.append(f"religion={properties['religion'].lower()}")
    return tags


def main():
    config = json.loads((ROOT / "web/data/venezia.json").read_text(encoding="utf8"))
    features = json.loads((ROOT / "data/processed/buildings_centro.geojson").read_text(encoding="utf8"))["features"]
    raw = (ROOT / "web/data/attrs.bin").read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)

    # Точная идентичность: объект OSM -> свойства здания. Коллизии номеров way/relation не угадываются.
    objects = {}
    for f in features:
        p = f["properties"]
        objects.setdefault((p["osm_type"], p["osm_id"]), []).append(p)

    by_id = {f["properties"]["building_id"]: f["properties"] for f in features}
    tagged = {}
    for key, props in objects.items():
        if len(props) != 1:
            continue
        tags = religious_tags(props[0])
        if tags:
            tagged[props[0]["building_id"]] = tags

    # Номер OSM -> свойства зданий: у way и relation номера могут совпасть, поэтому кандидатов
    # больше одного, и такая пара отбрасывается, а не угадывается.
    by_osm = {}
    for (osm_type, osm_id), props in objects.items():
        by_osm.setdefault(osm_id, []).extend(props)

    gids = {}
    for gid, off in enumerate(range(0, len(raw), config["attrStride"])):
        if raw[off + config["attrFields"]["src"][0]] == 1:
            continue  # настил моста церковью не бывает
        osm = int(struct.unpack_from("<d", raw, off + config["attrFields"]["osm"][0])[0])
        candidates = by_osm.get(abs(osm), [])
        bids = {p["building_id"] for p in candidates}
        if len(bids) != 1:
            continue
        bid = candidates[0]["building_id"]
        if bid in tagged:
            gids[gid] = {"building_id": bid, "tags": tagged[bid],
                         "name": candidates[0].get("name"), "wikidata": candidates[0].get("wikidata")}

    manifest = json.loads((ROOT / "web/data/church-buildings.json").read_text(encoding="utf8"))
    route_gids = {b["gid"] for b in manifest.get("buildings", [])}
    tagged_gids = set(gids)
    union = sorted(route_gids | tagged_gids)

    tag_counter = Counter(t for g in gids.values() for t in g["tags"])
    named = [g for g in gids.values() if g.get("name")]
    out = {
        "version": 1,
        "note": "Все религиозные здания по тегам OSM плюс проверенный маршрутный набор: карта красит "
                "их бирюзой. Вьюер берёт отсюда только gids; подсветка маршрута остаётся за church-buildings.json.",
        "atlas_attrs_sha256": digest,
        "gids": union,
        "counts": {
            "route_manifest": len(route_gids),
            "tagged": len(tagged_gids),
            "added_by_tags": len(tagged_gids - route_gids),
            "union": len(union),
            "by_tag": dict(tag_counter.most_common()),
        },
        "buildings": [{"gid": g, **gids[g]} for g in sorted(gids)],
        "named_sample": [g["name"] for g in named[:12]],
    }
    out_path = ROOT / "web/data/church-turquoise.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf8")

    # Сан-Микеле ин Изола — та церковь, ради которой это и делается: проверяем прямо здесь.
    michele = [g for g in gids.values() if (g.get("name") or "").startswith("San Michele in Isola")]
    islands = sorted({g["name"] for g in named if any(
        w in (g.get("name") or "") for w in ("Torcello", "Murano", "Burano", "Mazzorbo", "Isola", "Lazzaro", "Erasmo"))})
    print(json.dumps({"written": str(out_path), "union_gids": len(union), "addded_by_tags": len(tagged_gids - route_gids),
                      "tagged": len(tagged_gids), "by_tag": dict(tag_counter.most_common()),
                      "san_michele_in_isola": [{"building_id": m["building_id"], "tags": m["tags"]} for m in michele],
                      "island_names_sample": islands[:8]}, ensure_ascii=False))


if __name__ == "__main__":
    main()