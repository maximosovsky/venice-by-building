"""Construction dates from Italian Wikipedia articles.

Wikidata carries a date for 278 of the 1 536 objects we matched; the Italian articles of those same
objects often state one in prose or in an infobox. The trap, measured on the 711 articles we have:

* the generic infobox fields `anno` (403 hits) and `data` (190) are NOT construction dates — they give
  «Arsenale 1929», «San Marco 2006», «Frari 2010»;
* of 72 prose turns like «costruita nel 1457», many speak of a portal, an altarpiece or a restoration:
  the Arsenale's 1457 is its Porta Magna, the Frari's 1672 is an altar, Ca' Foscari's 1936 is a window.

So only two narrow readings are taken: the specific infobox keys (costruzione, inizio costruzione,
completamento, fondazione, consacrazione), and prose whose subject is the building itself. Every value
keeps the sentence it came from. Where the article disagrees with Wikidata by more than five years the
value is NOT exported: it goes to the review list, because neither source is automatically right
(San Pantalon: Wikidata says 1000, the article says 1744).

Titles and QIDs come from our own export, so nothing is fetched that we do not already show.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from . import config

API = "https://it.wikipedia.org/w/api.php"
CACHE = config.PROCESSED / "api_cache" / "itwiki"
CACHE.mkdir(parents=True, exist_ok=True)
BATCH = 25
PAUSE = 1.5
DISAGREE_YEARS = 5          # больше этого — статья и Викиданные спорят, значение не выводим

# Поля инфобокса, которые означают именно постройку: их годы идут на карту.
SPECIFIC = ("costruzione", "data di costruzione", "anno di costruzione", "anno costruzione",
            "inizio costruzione", "inizio", "completamento")
# Основание и освящение — события не о постройке здания. Храним для карточки, но на карту не выводим.
FOUNDING = ("fondazione", "consacrazione")
# Обороты прозы: начало постройки.
BUILD_VERB = re.compile(r"\b(?:costruit[ao]|edificat[ao]|erett[ao]|realizzat[ao])\s+"
                        r"(?:nel|tra\s+il|intorno\s+al)\s+(\d{3,4})", re.I)
SUBJECT = re.compile(r"\b(?:chiesa|basilica|palazzo|casa|edificio|ponte|teatro|scuola|torre|campanile|"
                     r"fabbrica|arsenale|seminario|convento|monastero|ospedale|villa|loggia|fontego|"
                     r"palazzetto|palazzina|biblioteca|museo|padiglione|stazione|mercato|forte|"
                     r"caserma|magazzino|fabbricato)\b", re.I)
NOT_THE_BUILDING = re.compile(r"\b(?:altare|cappella|cappelle|pala|dipinto|affresco|portale|facciata|"
                              r"polifora|restauro|ristrutturazione|riforma|campanile|organo|campo|"
                              r"ponteggio|decorazione|ingresso|abside|sagrestia|chiostro|atrio|"
                              r"loggetta|scalinata)\b", re.I)
YEAR = re.compile(r"(\d{3,4})")


def fetch(titles: list[str]) -> dict:
    digest = hashlib.md5("|".join(sorted(titles)).encode("utf-8")).hexdigest()[:16]
    key = CACHE / f"batch_{digest}.json"
    if key.exists():
        return json.loads(key.read_text(encoding="utf-8"))
    query = urllib.parse.urlencode({"action": "query", "prop": "revisions", "rvprop": "content",
                                    "rvslots": "main", "format": "json", "formatversion": "2",
                                    "titles": "|".join(titles)})
    req = urllib.request.Request(f"{API}?{query}",
                                 headers={"User-Agent": "venice-atlas/1.0 (building-by-building atlas)"})
    data = None
    for attempt in range(5):
        try:
            data = json.loads(urllib.request.urlopen(req, timeout=60).read().decode("utf-8"))
            break
        except urllib.error.HTTPError as exc:
            if exc.code != 429 or attempt == 4:
                raise
            wait = 30 + 15 * attempt
            print(f"   429 от it.wikipedia.org, ждём {wait} с")
            time.sleep(wait)
    key.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


def clean(sentence: str) -> str:
    """Убрать вики-разметку: сноски, шаблоны, ссылки и адреса, чтобы фраза читалась как фраза."""
    text = re.sub(r"<ref[^>]*>.*?</ref>|<ref[^>]*/>", " ", sentence, flags=re.S)
    text = re.sub(r"\{\{[^{}]*\}\}", " ", text)
    text = re.sub(r"\[\[([^\]|]*)\|([^\]]*)\]\]", r"\2", text)
    text = re.sub(r"\[\[([^\]]*)\]\]", r"\1", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"==+[^=]+==+", " ", text)
    text = re.sub(r"(?:File|Immagine|Image):[^\]]*", " ", text)
    # Хвосты картинок и шаблонов, у которых начало окна обрезано: |thumb|, |200px|, sito=…, accesso=…
    text = re.sub(r"\|\s*(?:thumb|miniatura|senza bordo|right|left|\d+px)\s*", "|", text, flags=re.I)
    text = re.sub(r"[A-Za-z_]+=[^\s|)\]}]*", " ", text)
    text = re.sub(r"\}{1,2}|\]{1,2}|<[^>]{0,20}>", " ", text)
    # Хвост подписи к картинке без префикса File: — оставляем часть после последней черты.
    if "|" in text:
        text = text.split("|")[-1]
    text = re.sub(r"\s+", " ", text)
    text = text.strip(" .,;:|-")
    # Обрезка окна может начаться посреди слова — начинаем с целого слова.
    return re.sub(r"^[^\s]{1,14}\s", "", text) if text[:20].find(" ") > 0 and text[0].islower() else text


# Прозаический год берём только у предмета, чей класс называет постройку. Улицы, каналы, районы,
# сады и пристани Викиданные помечают иначе, и их статьи называют год соседнего здания, а не своё.
BUILDING_CLASS = re.compile(r"chiesa|basilica|palazzo|casa|edificio|ponte|teatro|scuola|villa|museo|"
                            r"biblioteca|convento|monastero|ospedale|forte|caserma|padiglione|stazione|"
                            r"mercato|palazzetto|palazzina|torre|campanile|seminario|fabbricato|arsenale|"
                            r"church|palace|building|house|bridge|theatre|school|museum|library|"
                            r"convent|monastery|hospital|fort|barracks|pavilion|station|market|tower", re.I)


def is_building(rec: dict) -> bool:
    """True, когда класс предмета — именно постройка."""
    for cls in rec.get("classes") or ():
        la = cls.get("la") or {}
        if BUILDING_CLASS.search((la.get("it") or "") + " " + (la.get("en") or "")):
            return True
    return False


def infobox_years(text: str) -> list[tuple[str, int, str]]:
    """Годы из узких полей инфобокса: отдельно постройка, отдельно основание и освящение."""
    out = []
    for match in re.finditer(r"\|\s*([a-zà-ù_ ]+?)\s*=\s*([^\n|}]*)", text, re.I):
        name = match.group(1).strip().lower()
        value = match.group(2).strip()
        if name in SPECIFIC or name in FOUNDING:
            years = [int(y) for y in YEAR.findall(value) if 900 <= int(y) <= 2026]
            if years:
                # Диапазон «1537-1588» — это начало и конец: берём начало, как и в Викиданных.
                out.append(("постройка" if name in SPECIFIC else "событие", min(years),
                            f"{name} = {clean(value)[:80]}"))
    return out


def prose_year(text: str) -> tuple[int, str] | None:
    flat = re.sub(r"\s+", " ", text)
    best = None
    for match in BUILD_VERB.finditer(flat):
        year = int(match.group(1))
        if not 900 <= year <= 2026:
            continue
        sentence = clean(flat[max(0, match.start() - 110):match.end() + 70])
        # Подлежащее должно стоять рядом с глаголом, и это должно быть здание,
        # а не алтарь, фасад, реставрация или часть комплекса.
        near = clean(flat[max(0, match.start() - 60):match.start()])
        if SUBJECT.search(near) and not NOT_THE_BUILDING.search(sentence):
            best = (year, sentence)
            break
    return best


def main(area: str = "centro") -> None:
    enriched = json.loads((config.READY / "wikidata_enriched.json").read_text(encoding="utf-8"))
    all_recs = list(enriched["objects"].values()) + list(enriched.get("pois") or [])
    by_qid_rec = {rec["qid"]: rec for rec in all_recs if rec.get("qid")}
    titles: dict[str, str] = {}          # название статьи -> QID
    for rec in list(enriched["objects"].values()) + list(enriched.get("pois") or []):
        title = (rec.get("sl") or {}).get("it")
        if title and rec.get("qid"):
            titles.setdefault(title, rec["qid"])
    cards = json.loads((config.WEB_DATA / "wiki.json").read_text(encoding="utf-8"))
    cards = cards["cards"] if isinstance(cards, dict) else cards
    for card in cards:
        url = (card.get("wiki") or {}).get("url") or ""
        if "it.wikipedia.org/wiki/" in url:
            title = urllib.parse.unquote(url.split("/wiki/", 1)[1]).replace("_", " ")
            if card.get("qid"):
                titles.setdefault(title, card["qid"])
    print(f"итальянских статей: {len(titles)}")

    wikidata_year = {rec["qid"]: (rec.get("date") or {}).get("year")
                     for rec in list(enriched["objects"].values()) + list(enriched.get("pois") or [])
                     if rec.get("qid")}
    for card in cards:
        if card.get("qid") and card.get("inception"):
            wikidata_year.setdefault(card["qid"], card["inception"])

    names = sorted(titles)
    found: dict[str, dict] = {}
    events_only: dict[str, dict] = {}
    info_hits = prose_hits = rejected_prose = skipped_places = 0
    for i in range(0, len(names), BATCH):
        data = fetch(names[i:i + BATCH])
        for page in data.get("query", {}).get("pages", []):
            title = page.get("title")
            if "missing" in page or not page.get("revisions"):
                continue
            text = page["revisions"][0]["slots"]["main"]["content"]
            qid = titles.get(title)
            if not qid:
                continue
            boxes = infobox_years(text)
            construction = [b for b in boxes if b[0] == "постройка"]
            events = [b for b in boxes if b[0] == "событие"]
            prose = prose_year(text)
            if construction:
                info_hits += 1
            if prose:
                prose_hits += 1
            if construction or prose:
                _, year, evidence = construction[0] if construction else (0, prose[0], prose[1])
                # Прозаический год берём только у здания: у улицы, канала или района фраза
                # говорит о соседней постройке, а не о самом предмете.
                if construction or is_building(by_qid_rec.get(qid) or {}):
                    found[qid] = {"qid": qid, "title": title, "year": year,
                                  "source": "инфобокс" if construction else "статья",
                                  "evidence": evidence, "on_map": True}
                else:
                    skipped_places += 1
            elif events:
                # Основание или освящение: в карточке покажем, на карту год не выводим.
                _, year, evidence = events[0]
                events_only[qid] = {"qid": qid, "title": title, "year": year,
                                    "source": "инфобокс", "evidence": evidence, "on_map": False}
            elif not boxes:
                # Сколько оборотов отброшено фильтром по подлежащему — для отчёта.
                flat = re.sub(r"\s+", " ", text)
                if any(not (SUBJECT.search(flat[max(0, m.start() - 90):m.end() + 60]) and
                            not NOT_THE_BUILDING.search(flat[max(0, m.start() - 90):m.end() + 60]))
                       for m in BUILD_VERB.finditer(flat)):
                    rejected_prose += 1
        time.sleep(PAUSE)

    accepted, review, confirms = {}, [], 0
    for qid, rec in sorted(found.items(), key=lambda kv: kv[1]["title"]):
        wd = wikidata_year.get(qid)
        if wd is None:
            accepted[qid] = rec
        elif abs(int(wd) - rec["year"]) > DISAGREE_YEARS:
            review.append({**rec, "wikidata": wd})
        else:
            confirms += 1
    print(f"дат постройки найдено: {len(found)} | инфобокс {info_hits}, статья {prose_hits}, "
          f"только события {len(events_only)}, мест пропущено {skipped_places}, "
          f"оборотов отброшено фильтром {rejected_prose}")
    print(f"принято (в Викиданных даты нет): {len(accepted)} | подтверждают Викиданные: {confirms} | "
          f"спорят больше {DISAGREE_YEARS} лет: {len(review)}")

    (config.PROCESSED / f"itwiki_dates_{area}.json").write_text(
        json.dumps({"accepted": accepted, "review": review, "events": events_only,
                    "counts": {"articles": len(names), "found": len(found),
                               "events_only": len(events_only),
                               "infobox": info_hits, "prose": prose_hits,
                               "rejected_prose": rejected_prose,
                               "skipped_places": skipped_places,
                               "accepted": len(accepted), "confirms": confirms,
                               "review": len(review)}},
                   ensure_ascii=False, indent=1), encoding="utf-8")
    for rec in review[:6]:
        print(f"   спор: {rec['title'][:40]:42} Викиданные {rec['wikidata']} против статьи {rec['year']}")
    for rec in list(accepted.values())[:8]:
        print(f"   принято: {rec['title'][:36]:38} {rec['year']} ({rec['source']})")
    print("записано:", config.PROCESSED / f"itwiki_dates_{area}.json")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "centro")