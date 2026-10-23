"""Measured heights from the municipal 2010 topographic survey.

The 2010 lot of the Comune di Venezia carries, next to the footprint layer (EDIFC), a layer of
volumetric parts (UN_VOL) whose elevation fields are real measured numbers: base UN_VOL_QB, eaves
UN_VOL_QG, ridge UN_VOL_QE and volume height UN_VOL_AV. The parts carry no key to the footprints, so
they are attached to our own buildings spatially.

The elevations are quoted against the survey's own vertical datum, which the archive does not
document. The height of a building is therefore taken as eaves minus its own base: the datum cancels.
That was checked against the 492 buildings whose OpenStreetMap entry carries a measured `height`
tag; the median difference is 0,18 m.

The 2006 lot (measured base/eaves over the whole lagoon) does NOT cover the historic centre at all —
zero features fall inside it — and neither do the 2005 CTRN5000 sheets nor the 2010 roof elements
(ELE_CP, which cover Murano). The 2010 volumes are the only municipal measurement of the centre.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
import pyogrio
from shapely.geometry import box

from . import config

ZIP_2010 = config.TOPO / "2010_Venezia_aree_retry.zip"
DIR_2010 = "ComuneVenezia_aree"
VOL_COLS = ["UN_VOL_AV", "UN_VOL_QB", "UN_VOL_QG", "UN_VOL_QE", "UN_VOL_POR"]

# Plausibility window for a Venice building. The survey contains parts up to 94 m (the campanile of
# San Marco is 98,6 m), so the ceiling is generous; below two metres it is a wall or a step, not a house.
MIN_HEIGHT = 2.0
MAX_HEIGHT = 80.0
OVERLAP = 0.5          # a part counts for a building when at least half of the part lies inside it


def layer(name: str) -> str:
    return f"/vsizip/{ZIP_2010.as_posix()}/{DIR_2010}/{name}.shp"


def read_volumes(bbox_degrees) -> gpd.GeoDataFrame:
    parts = pyogrio.read_dataframe(layer("UN_VOL"), bbox=tuple(bbox_degrees), columns=VOL_COLS)
    return parts.to_crs(config.CRS_METRIC)


def attach(bld: gpd.GeoDataFrame, parts: gpd.GeoDataFrame) -> pd.DataFrame:
    """Attach every volume part to a building, first by a point inside, then by area overlap."""
    parts = parts.copy()
    parts["part_area"] = parts.geometry.area          # площадь части — по ней выбираем корпус
    parts["geometry_point"] = parts.representative_point()
    inside = gpd.sjoin(
        parts.set_geometry("geometry_point")[VOL_COLS + ["geometry_point", "part_area"]],
        bld[["building_id", "geometry"]], predicate="within", how="inner")
    taken = set(inside.index)
    rows = [{"building_id": r["building_id"], "method": "point", "part_area": r["part_area"],
             **{c: r[c] for c in VOL_COLS}}
            for _, r in inside.iterrows()]

    rest = parts[~parts.index.isin(taken)]
    if len(rest):
        hit = gpd.sjoin(rest[VOL_COLS + ["geometry", "part_area"]],
                        bld[["building_id", "geometry"]], predicate="intersects", how="inner")
        if len(hit):
            hit = hit.copy()
            # Три отношения в наших данных разбиты на две строки с одним building_id, поэтому
            # площадь берём словарём: reindex по индексу с повторами не работает.
            area_of = bld.assign(area=bld.geometry.area).groupby("building_id")["area"].max()
            share = hit["part_area"] / hit["building_id"].map(area_of).replace(0, pd.NA)
            hit = hit[share.fillna(0) >= OVERLAP]
            rows += [{"building_id": r["building_id"], "method": "overlap", "part_area": r["part_area"],
                      **{c: r[c] for c in VOL_COLS}}
                     for _, r in hit.iterrows()]
    return pd.DataFrame(rows)


def summarise(raw: pd.DataFrame) -> pd.DataFrame:
    """One record per building: base, eaves, ridge and the height above its own base."""
    if raw.empty:
        return pd.DataFrame(columns=["base_m", "eaves_m", "ridge_m", "height_m", "height_max_m",
                                     "parts", "method"]).set_index(pd.Index([], name="building_id"))
    raw = raw.copy()
    # Высоту считаем по каждой части отдельно: карниз минус её собственное основание.
    raw["part_height"] = raw["UN_VOL_QG"] - raw["UN_VOL_QB"]
    rows = []
    for bid, grp in raw.groupby("building_id"):
        main = grp.loc[grp["part_area"].idxmax()]          # самая крупная часть — корпус здания
        rows.append({
            "building_id": bid,
            "base_m": float(main["UN_VOL_QB"]),
            "eaves_m": float(main["UN_VOL_QG"]),
            "ridge_m": float(main["UN_VOL_QE"]),
            "height_m": round(float(main["part_height"]), 2),
            # Самая высокая измеренная часть: у церквей это обычно кампанила, а не корпус.
            "height_max_m": round(float(grp["part_height"].max()), 2),
            "parts": int(len(grp)),
            "method": "point" if (grp["method"] == "point").all() else "overlap",
        })
    return pd.DataFrame(rows).set_index("building_id")


def main(area: str = "centro") -> None:
    bld = gpd.read_file(config.PROCESSED / f"buildings_dated_{area}.geojson").to_crs(config.CRS_METRIC)
    dupes = int(bld["building_id"].duplicated().sum())
    if dupes:
        print(f"повторяющихся building_id: {dupes} — для сопоставления берём первую строку")
        bld = bld.drop_duplicates("building_id")
    bbox = gpd.GeoSeries([box(*bld.total_bounds)], crs=config.CRS_METRIC).to_crs(config.CRS_WEB).total_bounds
    parts = read_volumes(bbox)
    print(f"зданий: {len(bld)} | объёмных частей в границах атласа: {len(parts)}")

    raw = attach(bld, parts)
    print(f"частей привязано: {len(raw)} (внутри контура: {(raw['method'] == 'point').sum()})")
    all_heights = summarise(raw)
    good = all_heights["height_m"].between(MIN_HEIGHT, MAX_HEIGHT)
    heights = all_heights[good]
    low, high = int((all_heights["height_m"] < MIN_HEIGHT).sum()), int((all_heights["height_m"] > MAX_HEIGHT).sum())
    print(f"зданий с измеренной высотой: {len(heights)} из {len(bld)} "
          f"({100 * len(heights) / len(bld):.0f}%) | отброшено: {low} ниже {MIN_HEIGHT} м, {high} выше {MAX_HEIGHT} м")

    # Посадка системы координат: насколько центр здания далеко от ближайшей его части.
    if len(heights):
        join = bld.set_index("building_id").loc[heights.index]
        pts = parts.copy()
        pts["geometry"] = pts.representative_point()
        near = gpd.sjoin_nearest(join[["geometry"]].reset_index(),
                                 pts[["geometry"]],
                                 how="inner", distance_col="сдвиг_м")
        print(f"сдвиг контуров: медиана {near['сдвиг_м'].median():.2f} м, "
              f"90-й процентиль {near['сдвиг_м'].quantile(.9):.2f} м")

    print("высоты (карниз − основание): медиана %.2f м, 10%% %.2f, 90%% %.2f, макс %.2f"
          % (heights["height_m"].median(), heights["height_m"].quantile(.1),
             heights["height_m"].quantile(.9), heights["height_m"].max()))
    top = heights.nlargest(5, "eaves_m")[["eaves_m", "ridge_m", "height_m", "parts"]]
    print("самые высокие отметки:\n" + top.to_string())

    out = gpd.GeoDataFrame(
        heights.join(bld.set_index("building_id")[["geometry"]]).reset_index(),
        geometry="geometry", crs=config.CRS_METRIC)
    path = config.PROCESSED / f"municipal_heights_{area}.geojson"
    out.to_file(path, driver="GeoJSON")
    (config.PROCESSED / f"municipal_heights_{area}_report.json").write_text(json.dumps({
        "area": area, "buildings": len(bld), "parts_read": int(len(parts)),
        "parts_attached": int(len(raw)), "buildings_measured": int(len(heights)),
        "dropped_below_min": low, "dropped_above_max": high,
        "height_median": float(heights["height_m"].median()),
        "height_p10": float(heights["height_m"].quantile(.1)),
        "height_p90": float(heights["height_m"].quantile(.9)),
        "rim_shift_median_m": float(near["сдвиг_м"].median()) if len(heights) else None,
        "source": "Comune di Venezia, 2010 lot, layer UN_VOL (EPSG:6706), record updated 2013-03-25",
        "note": "height is eaves minus the building's own base, so the undocumented vertical datum cancels",
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print("записано:", path)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "centro")