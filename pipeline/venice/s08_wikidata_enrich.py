"""Обогащение из Викиданных: готовим для карты всё, что нашлось при сопоставлении.

Читает data/processed/wikidata_match_{area}.json и кэш свойств, забирает у Викисклада сведения
о фотографиях и у Википедии — первые абзацы статей, и пишет data/ready/wikidata_enriched.json:

  objects — по идентификатору нашего объекта: имя на трёх языках, статья, дата с точностью,
            архитектор, стиль, охранный статус, высота, изображение, классы;
  pois    — предметы, которым не нашлось здания: причалы, отели, школы, музеи — с координатами;
  labels  — подписи для архитекторов, стилей, статусов и классов на трёх языках.

Повторный запуск берёт всё из кэша и в сеть не ходит.
"""
from __future__ import annotations

import json
import sys
import time

from venice import config
from venice import s04_wikimedia as s04


def labels_of(entity, langs=("ru", "it", "en")):
    lab = entity.get("labels") or {}
    return {lang: (lab.get(lang) or {}).get("value") for lang in langs if (lab.get(lang) or {}).get("value")}


def sitelinks_of(entity, langs=("ru", "it", "en")):
    sl = entity.get("sitelinks") or {}
    return {lang: (sl.get(lang + "wiki") or {}).get("title") for lang in langs if (sl.get(lang + "wiki") or {}).get("title")}


def claims(entity, prop):
    return (entity.get("claims", {}) or {}).get(prop, []) or []


def items_of(entity, prop, follow=8):
    """Значения свойства как список ссылок на предметы (Q-номера или файлы)."""
    out = []
    for claim in claims(entity, prop)[:follow]:
        dv = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value")
        if dv is None:
            continue
        if isinstance(dv, dict) and dv.get("id"):
            out.append(dv["id"])
        elif isinstance(dv, str):
            out.append(dv)
    return out


def date_of(entity):
    """P571 → год и точность. День, месяц и год — точная дата; десятилетие и век — интервал."""
    for claim in claims(entity, "P571"):
        dv = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value") or {}
        raw = dv.get("time")
        if not raw:
            continue
        negative = raw.startswith("-")
        digits = raw.lstrip("+-").split("-")
        year = int(digits[0][:4] or 0)
        if negative:
            year = -year
        precision = dv.get("timePrecision") or dv.get("precision")
        if precision in (11, 10, 9):
            return {"year": year, "kind": "year", "precision": precision}
        if precision == 8:
            return {"year": year, "kind": "interval", "from": year, "to": year + 9, "precision": precision}
        if precision == 7:
            century = (year // 100) * 100
            return {"year": century, "kind": "interval", "from": century, "to": century + 99, "precision": precision}
        return None
    return None


def number_of(entity, prop):
    for claim in claims(entity, prop):
        dv = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value")
        if isinstance(dv, dict) and "amount" in dv:
            try:
                return float(dv["amount"])
            except (TypeError, ValueError):
                return None
    return None


def main(area="centro"):
    match = json.loads((config.PROCESSED / f"wikidata_match_{area}.json").read_text(encoding="utf-8"))
    entities = {}
    for path in (config.PROCESSED / "api_cache" / "wikidata_entities").glob("*.json"):
        entities.update(json.loads(path.read_text(encoding="utf-8")).get("entities", {}))
    if not entities:
        raise SystemExit("нет кэша свойств: сначала запустите s07_wikidata")

    # Предметы, которым не нашлось здания (причалы, отели, школы), тоже спрашиваем — иначе у них нет имён.
    from venice import s07_wikidata as s07
    poi_qids = [it["qid"] for it in match.get("unmatched_items", [])]
    if poi_qids:
        entities.update(s07.entities(poi_qids))
        print(f"спрошено предметов вне зданий: {len(poi_qids)}")
    print(f"сопоставленных объектов: {len(match['objects'])}, свойств в кэше: {len(entities)}")

    # 1. Подписи тех предметов, на которые ссылаются свойства: архитекторы, стили, статусы, классы.
    need = set()
    for oid, o in match["objects"].items():
        e = entities.get(o["qid"]) or {}
        for prop in ("P84", "P149", "P1435", "P31"):
            need.update(items_of(e, prop))
    for it in match.get("unmatched_items", []):
        e = entities.get(it["qid"]) or {}
        need.update(items_of(e, "P31"))
    need = {q for q in need if q.startswith("Q")}
    print(f"нужны подписи для {len(need)} предметов")
    picked = s04.wikidata_entities(sorted(need))
    labels = {q: (v.get("labels") or {}) for q, v in picked.items()}

    # 2. Фотографии: собираем имена файлов и спрашиваем Викисклад.
    wanted_files = []
    for _, o in match["objects"].items():
        wanted_files += items_of(entities.get(o["qid"]) or {}, "P18", 1)
    for it in match.get("unmatched_items", []):
        wanted_files += items_of(entities.get(it["qid"]) or {}, "P18", 1)
    wanted_files = sorted(set(wanted_files))
    print(f"файлов на Викискладе: {len(wanted_files)}")
    files = s04.commons_files(wanted_files)
    print(f"сведений о файлах получено: {len(files)}")

    def photo_for(qid):
        e = entities.get(qid) or {}
        names = items_of(e, "P18", 1)
        if not names:
            return None
        info = s04.photo_of(files, names[0])
        return info

    # 3. Объекты.
    objects = {}
    for oid, o in match["objects"].items():
        e = entities.get(o["qid"]) or {}
        if not e:
            continue
        rec = {"qid": o["qid"], "distance": o.get("distance"),
               "la": labels_of(e), "sl": sitelinks_of(e),
               "classes": [{"qid": c, "la": labels.get(c)} for c in items_of(e, "P31")],
               "date": date_of(e),
               "architects": [{"qid": c, "la": labels.get(c)} for c in items_of(e, "P84")],
               "styles": [{"qid": c, "la": labels.get(c)} for c in items_of(e, "P149")],
               "heritage": [{"qid": c, "la": labels.get(c)} for c in items_of(e, "P1435")],
               "height": number_of(e, "P2048"),
               "photo": photo_for(o["qid"])}
        objects[oid] = {k: v for k, v in rec.items() if v not in (None, [], {})}
        objects[oid]["qid"] = o["qid"]
    print(f"объектов с данными: {len(objects)}")

    # 4. Предметы без здания: причалы, отели, школы, музеи — пойдут подписями на карту.
    pois = []
    for it in match.get("unmatched_items", []):
        e = entities.get(it["qid"]) or {}
        la = labels_of(e)
        if not la.get("it"):
            continue
        pois.append({"qid": it["qid"], "la": la, "sl": sitelinks_of(e), "lat": it["lat"], "lon": it["lon"],
                     "classes": [{"qid": c, "la": labels.get(c)} for c in items_of(e, "P31")],
                     "date": date_of(e), "photo": photo_for(it["qid"])})
    print(f"предметов вне зданий (для подписей): {len(pois)}")

    out = config.READY / "wikidata_enriched.json"
    out.write_text(json.dumps({"objects": objects, "pois": pois, "labels": labels}, ensure_ascii=False),
                   encoding="utf-8")
    print("готово:", out)

    # 5. Первые абзацы статей для новых связей.
    old = json.loads((config.READY / "extracts.json").read_text(encoding="utf-8")) if (config.READY / "extracts.json").exists() else {}
    pairs, seen = [], set()
    for oid, rec in objects.items():
        for lang, title in (rec.get("sl") or {}).items():
            if (lang, title) not in seen:
                seen.add((lang, title))
                pairs.append((lang, title))
    todo = [(lang, title) for lang, title in pairs if f"{lang}:{title}" not in old]
    print(f"статей к загрузке: {len(todo)} (уже было {len(old)})")
    if todo:
        fresh = s04.wikipedia_extracts(todo)
        old.update(fresh)
        (config.READY / "extracts.json").write_text(json.dumps(old, ensure_ascii=False), encoding="utf-8")
        print("выдержек теперь:", len(old))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "centro")