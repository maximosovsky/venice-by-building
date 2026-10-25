"""Бирюзовый набор карты: все религиозные здания должны попадать в него, и вьюер обязан его читать.

Владелец атласа потребовал бирюзу для всех церквей, монастырей и синагог — включая островные,
которые маршрутный манифест не покрывал (Сан-Микеле ин Изола). Этот тест держит требование:
он пересчитывает религиозные здания по тегам OSM и сверяет их с набором, который читает вьюер.

Run:  python tests/test_church_turquoise.py
"""
import gzip
import hashlib
import json
import pathlib
import struct
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "web" / "data"
RELIGIOUS_BUILDINGS = {
    "church", "chapel", "cathedral", "basilica", "synagogue", "monastery",
    "convent", "abbey", "cloister", "shrine", "temple", "mosque", "wayside_shrine",
}
RELIGIOUS_AMENITIES = {"place_of_worship", "monastery", "convent", "chapel"}
failures, checks = [], 0


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        failures.append(message)


def main():
    card = ROOT / "pipeline" / "venice" / "church_turquoise.py"
    check(card.exists(), "the stage pipeline/venice/church_turquoise.py is missing")
    turquoise = json.loads((DATA / "church-turquoise.json").read_text(encoding="utf8"))
    config = json.loads((DATA / "venezia.json").read_text(encoding="utf8"))
    manifest = json.loads((DATA / "church-buildings.json").read_text(encoding="utf8"))
    features = json.loads((ROOT / "data/processed/buildings_centro.geojson").read_text(encoding="utf8"))["features"]

    raw = (DATA / "attrs.bin").read_bytes()
    check(hashlib.sha256(raw).hexdigest() == turquoise["atlas_attrs_sha256"],
          "church-turquoise.json was built from a different attrs.bin; rerun the stage")
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)

    # Точная идентичность: (osm_type, osm_id) из обработанных зданий -> gid атласа.
    objects, by_osm = {}, {}
    for f in features:
        p = f["properties"]
        objects.setdefault((p["osm_type"], p["osm_id"]), []).append(p)
        by_osm.setdefault(p["osm_id"], []).append(p)
    religious = set()
    for props in objects.values():
        if len(props) != 1:
            continue
        p = props[0]
        building = (p.get("building") or "").strip().lower()
        amenity = (p.get("amenity") or "").strip().lower()
        if amenity in RELIGIOUS_AMENITIES or building in RELIGIOUS_BUILDINGS:
            religious.add(p["building_id"])
    check(bool(religious), "no religious building found in the processed source")

    stride = config["attrStride"]
    osm_off = config["attrFields"]["osm"][0]
    src_off = config["attrFields"]["src"][0]
    gid_of = {}
    for gid, off in enumerate(range(0, len(raw), stride)):
        if raw[off + src_off] == 1:
            continue
        osm = int(struct.unpack_from("<d", raw, off + osm_off)[0])
        candidates = by_osm.get(abs(osm), [])
        bids = {p["building_id"] for p in candidates}
        if len(bids) == 1:
            gid_of[candidates[0]["building_id"]] = gid

    gids = set(turquoise["gids"])
    missing = sorted(bid for bid in religious if bid in gid_of and gid_of[bid] not in gids)
    check(not missing, f"religious buildings outside the turquoise set: {missing[:6]}")
    for bid in religious:
        check(bid not in gid_of or gid_of[bid] in gids, f"{bid} is religious but not turquoise")

    # Требование владельца: Сан-Микеле ин Изола обязан быть бирюзовым.
    michele = [bid for bid in religious if bid == "w142022168"]
    check(bool(michele), "San Michele in Isola (w142022168) is missing from the religious set")
    check(gid_of.get("w142022168") in gids, "San Michele in Isola is not in the turquoise set")

    route_gids = {b["gid"] for b in manifest.get("buildings", [])}
    check(route_gids <= gids, "the church route manifest is not fully inside the turquoise set")
    check(len(gids) >= len(route_gids), "the turquoise set is smaller than the route manifest")

    viewer = (ROOT / "web" / "app.js").read_text(encoding="utf8")
    check("church-turquoise.json" in viewer, "the viewer never fetches church-turquoise.json")
    check("...(churchTurquoise?.gids || [])" in viewer, "the viewer does not union the turquoise set into churchGids")

    print(f"religious buildings by tags: {len(religious)}, atlas gids: {len(gid_of)}")
    print(f"turquoise set: {len(gids)} gids "
          f"(route {len(route_gids)}, tagged {turquoise['counts']['tagged']}, added {turquoise['counts']['added_by_tags']})")
    print(f"checks run: {checks}, failures: {len(failures)}")
    for f in failures:
        print(f"  FAIL: {f}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())