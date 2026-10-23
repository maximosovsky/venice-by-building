"""Contract test: read the exported viewer data the way web/worker.js and web/app.js read it.

This is the test that matters for "the map loads": it replays the viewer's own parse order,
offsets and bounds checks against the files in web/data, and fails loudly on any mismatch.

Run:  python tests/test_viewer_contract.py
"""
import gzip
import json
import pathlib
import struct
from collections import Counter
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "web" / "data"
failures, checks = [], 0


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        failures.append(message)


def fetch_bin(path):
    raw = path.read_bytes()
    return gzip.decompress(raw) if raw[:2] == b"\x1f\x8b" else raw


def parse_tile(buf):
    """Exactly the layout web/worker.js parse() expects."""
    h = memoryview(buf)
    nB, nP, nR, nV, nMV, nMT = (struct.unpack_from("<I", buf, off)[0] for off in (4, 8, 12, 16, 20, 24))
    ox, oz = struct.unpack_from("<2f", buf, 28)
    o = 36
    out = {"nB": nB, "nP": nP, "nR": nR, "nV": nV, "origin": (ox, oz)}

    def take(fmt, n):
        nonlocal o
        size = struct.calcsize(fmt) * n
        values = struct.unpack_from(f"<{n}{fmt}", buf, o) if n else ()
        o += (size + 3) // 4 * 4
        return values

    out["gid"] = take("I", nB)
    out["year"] = take("h", nB)
    out["flag"] = take("B", nB)
    out["period"] = take("B", nB)
    out["floors"] = take("B", nB)
    out["heritage"] = take("B", nB)
    out["lay0"] = take("I", nB)
    out["lay1"] = take("I", nB)
    out["partStart"] = take("I", nB + 1)
    out["height"] = take("f", nP)
    out["base"] = take("f", nP)
    out["ringStart"] = take("I", nP + 1)
    out["vertStart"] = take("I", nR + 1)
    out["hole"] = take("B", nR)
    out["xz"] = take("h", 2 * nV)
    out["meshBld"] = take("H", nMV)
    out["meshPos"] = take("h", 3 * nMV)
    out["meshTri"] = take("H", 3 * nMT)
    out["end_offset"] = o
    return out


def main():
    required = ["venezia.json", "attrs.bin", "wiki.json", "names.json", "heritage.json",
                "labels.json", "layers.json", "quests.json", "land.bin", "water.bin", "context.bin"]
    for name in required:
        check((DATA / name).exists(), f"missing viewer file {name}")
    if failures:
        print("\n".join(failures)); return 1

    cfg = json.loads((DATA / "venezia.json").read_text(encoding="utf-8"))
    for key in ("packs", "tiles", "periods", "histogram", "attrFields", "attrStride", "home", "stats"):
        check(key in cfg, f"venezia.json lacks {key}")

    # ---- tiles, read exactly as the worker reads them ----
    total_buildings = total_parts = total_rings = total_vertices = 0
    gid_global = []
    for pack in cfg["packs"]:
        blob = fetch_bin(DATA / pack)
        for tile in [t for t in cfg["tiles"] if t["pack"] == pack]:
            check(tile["offset"] + tile["length"] <= len(blob),
                  f"{pack}: tile {tile['file']} runs past the end of the pack")
            buf = blob[tile["offset"]:tile["offset"] + tile["length"]]
            magic = struct.unpack_from("<I", buf, 0)[0]
            check(magic == 0x3A5A3356, f"{tile['file']}: magic {magic:#x} is not this project's tile marker")
            t = parse_tile(buf)
            check(t["end_offset"] <= len(buf), f"{tile['file']}: arrays read past the tile end")
            check(t["nB"] == tile["n"], f"{tile['file']}: header says {t['nB']} buildings, index says {tile['n']}")
            check(t["partStart"][0] == 0 and t["partStart"][-1] == t["nP"],
                  f"{tile['file']}: part starts do not span the parts")
            check(t["ringStart"][0] == 0 and t["ringStart"][-1] == t["nR"],
                  f"{tile['file']}: ring starts do not span the rings")
            check(t["vertStart"][0] == 0 and t["vertStart"][-1] == t["nV"],
                  f"{tile['file']}: vertex starts do not span the vertices")
            check(len(t["hole"]) == t["nR"], f"{tile['file']}: hole flags do not match the ring count")
            for prev, nxt in zip(t["partStart"], t["partStart"][1:]):
                check(nxt >= prev, f"{tile['file']}: partStart is not monotonic")
            for prev, nxt in zip(t["vertStart"], t["vertStart"][1:]):
                check(nxt >= prev, f"{tile['file']}: vertStart is not monotonic")
            for b in range(t["nB"]):
                check(0 <= t["period"][b] < len(cfg["periods"]),
                      f"{tile['file']}: building {b} has period {t['period'][b]} outside the palette")
                check(0 <= t["flag"][b] <= 2, f"{tile['file']}: building {b} has date flag {t['flag'][b]}")
                check(cfg["yearMin"] <= t["year"][b] <= cfg["yearMax"],
                      f"{tile['file']}: building {b} year {t['year'][b]} outside the timeline")
            for p in range(t["nP"]):
                check(t["height"][p] > 0, f"{tile['file']}: part {p} has height {t['height'][p]}")
                check(t["base"][p] >= 0, f"{tile['file']}: part {p} has base {t['base'][p]}")
                n_rings = t["ringStart"][p + 1] - t["ringStart"][p]
                check(n_rings >= 1, f"{tile['file']}: part {p} has no ring")
                for r in range(t["ringStart"][p], t["ringStart"][p + 1]):
                    n = t["vertStart"][r + 1] - t["vertStart"][r]
                    check(n >= 3, f"{tile['file']}: ring {r} has {n} vertices")
            total_buildings += t["nB"]; total_parts += t["nP"]
            total_rings += t["nR"]; total_vertices += t["nV"]
            gid_global.extend(t["gid"])

    check(len(gid_global) == len(set(gid_global)), "a building id appears in more than one tile")
    check(total_buildings == cfg["stats"]["objects"],
          f"tiles hold {total_buildings} objects, config says {cfg['stats']['objects']}")
    check(cfg["stats"]["objects"] == cfg["stats"]["buildings"] + cfg["stats"].get("bridges", 0),
          "buildings and bridges do not add up to the number of objects in the tiles")

    # ---- attrs.bin, read with the offsets and stride the app uses ----
    raw = fetch_bin(DATA / "attrs.bin")
    stride = cfg["attrStride"]
    check(len(raw) % stride == 0, f"attrs.bin is {len(raw)} bytes, not a multiple of the {stride}-byte stride")
    check(len(raw) // stride == cfg["stats"]["objects"], "attrs.bin record count differs from the object count")
    field_offset = {name: off for name, (off, _kind) in cfg["attrFields"].items()}
    for name in ("osm", "year", "yfrom", "yto", "h", "hsrc", "flag", "wk", "nm", "x", "z", "src"):
        check(name in field_offset, f"attrs.bin layout lacks {name}")
    check(max(field_offset.values()) < stride, "an attribute offset lies past the record stride")
    sample = 0
    bridges_seen = 0
    for rec in range(len(raw) // stride):
        off = rec * stride
        h = struct.unpack_from("<H", raw, off + field_offset["h"])[0]
        year = struct.unpack_from("<h", raw, off + field_offset["year"])[0]
        flag = struct.unpack_from("<B", raw, off + field_offset["flag"])[0]
        src = struct.unpack_from("<B", raw, off + field_offset["src"])[0]
        dsrc = struct.unpack_from("<B", raw, off + field_offset["dsrc"])[0]
        check(h > 0, f"record {rec}: height {h} decimetres")
        check(cfg["yearMin"] <= year <= cfg["yearMax"], f"record {rec}: year {year} outside the timeline")
        check(0 <= flag <= 2, f"record {rec}: date flag {flag}")
        if src == 1:
            bridges_seen += 1
            check(h == 30, f"bridge record {rec}: height {h} dm, the deck is drawn as an assumed slab")
            # У моста либо дата неизвестна, либо она пришла из Викиданных: в OSM дат нет.
            check(flag == 2 or dsrc == 2, f"bridge record {rec}: date flag {flag}, source {dsrc}")
        sample += 1
    check(bridges_seen == cfg["stats"].get("bridges", 0),
          f"{bridges_seen} records are marked as bridges, config says {cfg['stats'].get('bridges')}")
    check(sample > 0, "no attribute record sampled")

    # ---- cards, and the ground polygons the app parses itself ----
    wiki = json.loads((DATA / "wiki.json").read_text(encoding="utf-8"))
    photos = [c for c in wiki if c.get("image")]
    for card in photos[:50]:
        image = card["image"]
        check(bool(image.get("thumb")), "a card photo has no thumbnail")
        check(bool(image.get("license")), f"card {card.get('label')!r}: photo without a licence")
        check(bool(image.get("page")), f"card {card.get('label')!r}: photo without a source page")
    for name in ("land.bin", "water.bin", "context.bin"):
        buf = fetch_bin(DATA / name)
        n_poly, n_ring, n_vert = struct.unpack_from("<3I", buf, 0)
        ring_start = struct.unpack_from(f"<{n_poly + 1}I", buf, 12)
        vert_start_off = 12 + 4 * (n_poly + 1)
        vert_start = struct.unpack_from(f"<{n_ring + 1}I", buf, vert_start_off)
        xz_off = vert_start_off + 4 * (n_ring + 1)
        check(len(buf) == xz_off + 8 * n_vert, f"{name}: size does not match its own header")
        check(ring_start[-1] == n_ring and vert_start[-1] == n_vert, f"{name}: index arrays do not span the data")
        check(n_poly > 0, f"{name}: no polygons, the ground would be missing")
        check(len(buf) == xz_off + 8 * n_vert, f"{name}: size does not match its own header")
        coords = struct.unpack_from(f"<{2 * n_vert}f", buf, xz_off)
        span = max(abs(v) for v in coords) if coords else 0
        check(span < 60000, f"{name}: a ground vertex sits {span:.0f} m from the city origin, "
                            "which means a layer was written in the wrong coordinate system")

    # ---- bridges: a layer of their own, and streets and bridges named in the labels ----
    layers = json.loads((DATA / "layers.json").read_text(encoding="utf-8"))
    works = [g for L in layers for g in L.get("groups", []) if g.get("bit") == 12]
    check(bool(works), "no layer uses the bridge bit, so bridges cannot be switched on")
    check(all(g.get("count", 0) > 0 for g in works), "the bridge layer is present but counts nothing")
    labels = json.loads((DATA / "labels.json").read_text(encoding="utf-8"))
    streets = [L for L in labels if L.get("tier", 9) <= 3 and not L.get("water") and not L.get("bridge")]
    bridges_labelled = [L for L in labels if L.get("bridge")]
    check(len(streets) > 500, f"only {len(streets)} street labels: names of streets and embankments would not show")
    check(len(bridges_labelled) > 100, f"only {len(bridges_labelled)} named bridges in the labels")
    check(any(L["name"].startswith(("Fondamenta", "Riva")) for L in streets),
          "no embankment (fondamenta or riva) is labelled")
    for L in labels[:400]:
        check(len(L["pts"][0]) == 5, f"label {L['name']!r} does not carry a length and a width")
        check(L["pts"][0][3] > 0 and L["pts"][0][4] > 0, f"label {L['name']!r} has a zero length or width")
        check(-360 <= L["pts"][0][2] <= 360, f"label {L['name']!r} has an impossible angle")
    check(labels == sorted(labels, key=lambda L: (L["tier"], -L["pts"][0][3])),
          "labels are not ordered by importance, so search would return a back alley over a fondamenta")

    # ---- обогащение из Викиданных: связи по геометрии, даты, охрана, высоты, места ----
    wd_counts = Counter()
    for rec in range(len(raw) // stride):
        off = rec * stride
        dsrc = struct.unpack_from("<B", raw, off + field_offset["dsrc"])[0]
        hsrc = struct.unpack_from("<B", raw, off + field_offset["hsrc"])[0]
        heritage = struct.unpack_from("<B", raw, off + field_offset["heritage"])[0]
        wd_counts[(dsrc, "dsrc")] += 1
        wd_counts[(hsrc, "hsrc")] += 1
        wd_counts[(heritage, "heritage")] += 1
    wikidata_dates = wd_counts[(2, "dsrc")]
    wikidata_heights = wd_counts.get((5, "hsrc"), 0)
    heritage_wikidata = wd_counts.get((2, "heritage"), 0)
    wiki_heritage_expected = range(heritage_wikidata)
    check(wikidata_dates > 200, f"только {wikidata_dates} объектов датированы Викиданными — обогащение не доехало")
    # Высоты P2048 в Викиданных редки и почти все стоят у мостов, где означают просвет,
    # а не высоту здания: у наших зданий их полтора десятка, и меньше быть не должно.
    check(wikidata_heights >= 8, f"только {wikidata_heights} высот из Викиданных")
    check(heritage_wikidata > 10, f"только {heritage_wikidata} объектов с охранным статусом из Викиданных")
    check(len(cfg["heritage"]["labels"]) >= 2, "у наследия должна быть и подпись для статуса из Викиданных")
    # Зритель берёт подпись labels[i] с числом counts[i + 1] и цвет colors[i + 1],
    # то есть в counts на одну запись больше: первая — общее число объектов.
    check(len(cfg["heritage"]["counts"]) == len(cfg["heritage"]["labels"]) + 1,
          "числа наследия должны быть на одну длиннее подписей")
    check(len(cfg["heritage"]["colors"]) == len(cfg["heritage"]["labels"]) + 1,
          "цветов наследия должно быть на один больше подписей")
    check(cfg["heritage"]["counts"][1] + cfg["heritage"]["counts"][2] == len(wiki_heritage_expected),
          "числа наследия не сходятся с числом записей")


    rich = [c for c in wiki if c.get("byGeometry")]
    check(len(wiki) > 900, f"карточек {len(wiki)}: связи по координатам не попали в карточки")
    check(len(rich) > 400, f"карточек, найденных по координатам: {len(rich)}")
    for card in rich[:60]:
        check(bool(card.get("qid")), "карточка по координатам без Q-номера")
        check(bool(card.get("la") or card.get("label")), f"карточка {card.get('qid')} без названия")
    with_facts = [c for c in wiki if c.get("styles") or c.get("architects") or c.get("heritageItems")]
    check(sum(1 for c in wiki if c.get("styles_la") or c.get("styles")) > 100, "стили из Викиданных не доехали")
    check(sum(1 for c in wiki if c.get("architects_la") or c.get("architects")) > 50, "архитекторы из Викиданных не доехали")
    pois = [L for L in labels if L.get("poi")]
    check(len(pois) > 100, f"подписей-мест из Викиданных: {len(pois)}")
    for L in pois[:40]:
        check(bool((L.get("poi") or {}).get("it")), f"место {L['name']!r} без вида на итальянском")

    # ---- the page's own assets: index.html loads the module, which imports the vendor files ----
    page = (ROOT / "web" / "index.html").read_text(encoding="utf-8")
    app = (ROOT / "web" / "app.js").read_text(encoding="utf-8")
    for asset in ("styles.css", "app.js", "favicon.svg", "fonts/inter-latin.woff2"):
        check(asset.split("/")[-1] in page, f"index.html never references {asset}")
        check((ROOT / "web" / asset).exists(), f"index.html needs {asset}, which is missing")
    check("data/venezia.json" in app, "app.js does not fetch data/venezia.json")
    # Управление должно оставаться картографическим: левая кнопка сдвигает, правая и Shift поворачивают,
    # колесо приближает и работает в любом месте над городом, а не только над холстом.
    check("LEFT: THREE.MOUSE.PAN" in app, "the left button no longer pans the map")
    check("RIGHT: THREE.MOUSE.ROTATE" in app, "the right button no longer turns the city")
    check("controls.enableZoom = true" in app, "zoom is no longer switched on")
    check("new WheelEvent('wheel'" in app, "the wheel is no longer forwarded from the panels to the canvas")
    check("leftButtonRotates" in app, "Shift with the left button no longer turns the city")
    check("левой кнопкой" in page, "the notes no longer explain how to move the map")
    for asset in ("vendor/three.module.js", "vendor/MapControls.js"):
        check(asset in app, f"app.js never imports {asset}")
        check((ROOT / "web" / asset).exists(), f"app.js imports {asset}, which is missing")
    worker = (ROOT / "web" / "worker.js").read_text(encoding="utf-8")
    check("vendor/three.core.js" in worker, "worker.js does not import vendor/three.core.js")
    check((ROOT / "web" / "vendor/three.core.js").exists(), "worker.js imports vendor/three.core.js, which is missing")

    print(f"buildings {total_buildings}, parts {total_parts}, rings {total_rings}, vertices {total_vertices}")
    print(f"cards {len(wiki)}, with photo {len(photos)}")
    print(f"checks run: {checks}, failures: {len(failures)}")
    for f in failures[:40]:
        print("  FAIL:", f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())