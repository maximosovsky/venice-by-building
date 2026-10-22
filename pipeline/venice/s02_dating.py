"""Stage 2: dating evidence.

Every statement about the age of a building is stored as its own row with the wording it
came from, so the atlas can show intervals and uncertainty instead of pretending to know
a construction year it does not have.

Sources handled here:
  vprg  the municipal VPRG classification of unità edilizie, three coarse epochs;
  osm   date tags on the footprint itself (rare in Venice).
Historical registers are added by s03_historical.py once their wording is mapped.

Outputs per area:
  evidence_<area>.csv / .geojson   one row per statement, with the matched geometry
  buildings_dated_<area>.geojson|.parquet   buildings with the resolved epoch and flags
  dating_stats_<area>.json
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict

from shapely.geometry import shape as shp_shape, mapping
from shapely.strtree import STRtree

from venice import config
from venice import periods as P

MIN_OVERLAP_RATIO = 0.05
OSM_DATE_KEYS = ("start_date", "year_of_construction", "construction_date", "opening_date")
YEAR_RE = re.compile(r"(?<!\d)(1[0-9]{3}|20[0-2][0-9])(?!\d)")


def parse_years(text):
    """Years named in a date string; never invented, only read off."""
    if text is None:
        return None, None
    years = [int(y) for y in YEAR_RE.findall(str(text))]
    if not years:
        return None, None
    return min(years), max(years)


def load_vprg():
    path = config.VPRG / "venezia_classificazione_unita_edilizie.geojson"
    feats = json.loads(path.read_text(encoding="utf-8"))["features"]
    units = []
    for f in feats:
        pr = f["properties"]
        code = (pr.get("TP_CLS_ED") or "").strip()
        desc = (pr.get("DESC_TIPO") or "").strip()
        epoch = P.epoch_of(code, desc)
        ymin, ymax, label = P.interval(epoch)
        units.append({"geom": shp_shape(f["geometry"]), "objectid": pr.get("OBJECTID"), "code": code,
                      "desc": desc, "epoch": epoch, "year_min": ymin, "year_max": ymax, "label": label,
                      "flags": P.state_flags(desc), "stato": (pr.get("STATO_ALT") or "").strip(),
                      "note": (pr.get("NOTE") or "").strip(), "scheda": (pr.get("SCHEDA") or "").strip(),
                      "data_csc": (pr.get("DATA_CSC") or "").strip(),
                      "link": (pr.get("LINK_SCHEDA") or "").strip()})
    return units


def main(area):
    units = load_vprg()
    tree = STRtree([u["geom"] for u in units])
    path = config.PROCESSED / f"buildings_{area}.geojson"
    buildings = json.loads(path.read_text(encoding="utf-8"))["features"]
    print(f"[{area}] buildings={len(buildings)} vprg_units={len(units)}")

    evidence, dated, stats = [], [], Counter()
    epoch_by_building = {}
    for b in buildings:
        pr = b["properties"]
        bid = pr["building_id"]
        geom = shp_shape(b["geometry"])
        b_area = geom.area or 1e-12

        hits = []
        for idx in tree.query(geom, predicate="intersects"):
            u = units[idx]
            inter = geom.intersection(u["geom"]).area
            if inter / b_area >= MIN_OVERLAP_RATIO:
                hits.append((inter, u))
        hits.sort(key=lambda x: -x[0])

        if hits:
            best_inter, best = hits[0]
            epochs = {u["epoch"] for _, u in hits}
            ambiguous = len(epochs) > 1
            review = "ambiguous" if ambiguous else "auto"
            for inter, u in hits[:4]:
                evidence.append({
                    "building_id": bid, "source": "vprg", "event_type": "typology_class",
                    "year_min": u["year_min"], "year_max": u["year_max"],
                    "date_text": f"{u['code']} / {u['desc']} / CSC {u['data_csc']}".strip(" /"),
                    "epoch": u["epoch"], "epoch_label": u["label"], "state_flags": u["flags"],
                    "match_method": "spatial_intersection",
                    "match_value": round(inter / b_area, 3),
                    "review_status": ("rejected_extra" if (inter, u) != hits[0] else review),
                    "source_url": "https://arcgis-prd.comune.venezia.it/server/rest/services/URBANISTICA/VPRG_Citta_Antica_WGS84_15_01_2021/MapServer/14",
                    "source_object": u["objectid"],
                })
            epoch_by_building[bid] = best["epoch"]
            pr["vprg_code"] = best["code"]
            pr["vprg_epoch"] = best["epoch"]
            pr["vprg_epoch_label"] = best["label"]
            pr["vprg_year_min"] = best["year_min"]
            pr["vprg_year_max"] = best["year_max"]
            pr["vprg_state_flags"] = best["flags"]
            pr["vprg_units_matched"] = len(hits)
            pr["vprg_review"] = review
            stats["vprg_" + best["epoch"]] += 1
            if ambiguous:
                stats["ambiguous"] += 1
        else:
            pr["vprg_code"] = None
            pr["vprg_epoch"] = "неклассифицировано"
            pr["vprg_epoch_label"] = "неизвестно"
            pr["vprg_year_min"] = None
            pr["vprg_year_max"] = None
            pr["vprg_state_flags"] = ""
            pr["vprg_units_matched"] = 0
            pr["vprg_review"] = "no_match"
            stats["no_vprg_match"] += 1

        for key in OSM_DATE_KEYS:
            if key in pr and pr[key]:
                ymin, ymax = parse_years(pr[key])
                exact = ymin is not None and ymin == ymax
                evidence.append({"building_id": bid, "source": "osm", "event_type": "stated_date",
                                 "year_min": ymin, "year_max": ymax, "date_text": f"{key}={pr[key]}",
                                 "epoch": "", "epoch_label": "", "state_flags": "",
                                 "match_method": "osm_tag", "match_value": 1.0,
                                 "review_status": "documented" if exact else "interval",
                                 "source_url": f"https://www.openstreetmap.org/{pr['osm_type']}/{pr['osm_id']}",
                                 "source_object": pr["osm_id"]})
                if exact:
                    pr["osm_year"] = ymin
                    stats["osm_exact_dates"] += 1

        # resolved age: a stated date wins, otherwise the municipal epoch as an interval
        if pr.get("osm_year"):
            pr["year_min"], pr["year_max"] = pr["osm_year"], pr["osm_year"]
            pr["date_kind"] = "year"
            pr["date_source"] = "OpenStreetMap tag"
        elif pr.get("vprg_epoch") not in (None, "неклассифицировано"):
            pr["year_min"], pr["year_max"] = pr["vprg_year_min"], pr["vprg_year_max"]
            pr["date_kind"] = "interval"
            pr["date_source"] = "VPRG Città Antica classification"
        else:
            pr["year_min"], pr["year_max"] = None, None
            pr["date_kind"] = "unknown"
            pr["date_source"] = None
            stats["undated"] += 1
        dated.append(b)

    (config.PROCESSED / f"buildings_dated_{area}.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": dated}, ensure_ascii=False),
        encoding="utf-8", newline="")

    if evidence:
        cols = list(evidence[0].keys())
        with (config.PROCESSED / f"evidence_{area}.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=cols)
            w.writeheader()
            w.writerows(evidence)

    stats["evidence_rows"] = len(evidence)
    stats["evidence_by_source"] = dict(Counter(e["source"] for e in evidence))
    stats["date_kind"] = dict(Counter(b["properties"]["date_kind"] for b in dated))
    try:
        import geopandas as gpd
        gpd.GeoDataFrame.from_features(dated, crs=config.CRS_WEB).to_parquet(
            config.PROCESSED / f"buildings_dated_{area}.parquet", index=False)
    except Exception as exc:
        print(f"  (parquet skipped: {type(exc).__name__})")
    (config.PROCESSED / f"dating_stats_{area}.json").write_text(
        json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{area}] " + json.dumps(stats, ensure_ascii=False))
    return stats


if __name__ == "__main__":
    for a in (sys.argv[1:] or list(config.EXTRACTS)):
        main(a)