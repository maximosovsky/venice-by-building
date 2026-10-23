"""Contract test: read the exported viewer data the way web/worker.js and web/app.js read it.

This is the test that matters for "the map loads": it replays the viewer's own parse order,
offsets and bounds checks against the files in web/data, and fails loudly on any mismatch.

Run:  python tests/test_viewer_contract.py
"""
import gzip
import json
import pathlib
import struct
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
    check(total_buildings == cfg["stats"]["buildings"],
          f"tiles hold {total_buildings} buildings, config says {cfg['stats']['buildings']}")

    # ---- attrs.bin, read with the offsets and stride the app uses ----
    raw = fetch_bin(DATA / "attrs.bin")
    stride = cfg["attrStride"]
    check(len(raw) % stride == 0, f"attrs.bin is {len(raw)} bytes, not a multiple of the {stride}-byte stride")
    check(len(raw) // stride == cfg["stats"]["buildings"], "attrs.bin record count differs from the building count")
    field_offset = {name: off for name, (off, _kind) in cfg["attrFields"].items()}
    for name in ("osm", "year", "yfrom", "yto", "h", "hsrc", "flag", "wk", "nm", "x", "z"):
        check(name in field_offset, f"attrs.bin layout lacks {name}")
    check(max(field_offset.values()) < stride, "an attribute offset lies past the record stride")
    sample = 0
    for rec in range(0, len(raw) // stride, max(1, len(raw) // stride // 500)):
        off = rec * stride
        h = struct.unpack_from("<H", raw, off + field_offset["h"])[0]
        year = struct.unpack_from("<h", raw, off + field_offset["year"])[0]
        flag = struct.unpack_from("<B", raw, off + field_offset["flag"])[0]
        check(h > 0, f"record {rec}: height {h} decimetres")
        check(cfg["yearMin"] <= year <= cfg["yearMax"], f"record {rec}: year {year} outside the timeline")
        check(0 <= flag <= 2, f"record {rec}: date flag {flag}")
        sample += 1
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

    # ---- the page's own assets: index.html loads the module, which imports the vendor files ----
    page = (ROOT / "web" / "index.html").read_text(encoding="utf-8")
    app = (ROOT / "web" / "app.js").read_text(encoding="utf-8")
    for asset in ("styles.css", "app.js", "favicon.svg", "fonts/inter-latin.woff2"):
        check(asset.split("/")[-1] in page, f"index.html never references {asset}")
        check((ROOT / "web" / asset).exists(), f"index.html needs {asset}, which is missing")
    check("data/venezia.json" in app, "app.js does not fetch data/venezia.json")
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