"""Stage 4: link buildings to Wikidata, Wikipedia articles and Wikimedia Commons photos.

Nothing is fetched when a card is opened: all links, labels, articles and photo credits are
resolved here, cached on disk, and written as one table the viewer reads.

Two kinds of link are kept apart on purpose:
  confirmed - the OSM footprint carries wikidata= or wikipedia= itself;
  candidate - a Wikipedia article found near a named building; a nearby article is not
              proof of identity, so it is labelled and can be rejected later.

Outputs:
  data/processed/wikimedia_<area>.json     per building: qid, label, articles, image credit
  data/ready/wikimedia.json                one merged table for the viewer
  data/processed/api_cache/                raw API answers, so a rerun costs no requests
"""
import json
import sys
import time
import urllib.parse
import urllib.request

from venice import config

UA = "venice-building-atlas/1.0 (research pipeline; contact: project owner)"
CACHE = config.PROCESSED / "api_cache"
CACHE.mkdir(parents=True, exist_ok=True)
PAUSE = 0.35


def api(url, params):
    q = urllib.parse.urlencode(params)
    key = urllib.parse.quote_plus(url + "?" + q)
    cache_file = CACHE / (key[:180] + ".json")
    if cache_file.exists():
        return json.loads(cache_file.read_text(encoding="utf-8"))
    req = urllib.request.Request(f"{url}?{q}", headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=45) as fh:
                data = json.loads(fh.read().decode("utf-8"))
            cache_file.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            time.sleep(PAUSE)
            return data
        except Exception as exc:
            if attempt == 3:
                print(f"  ! {url} {type(exc).__name__}: {exc}")
                return {}
            time.sleep(2 + 3 * attempt)
    return {}


def wikidata_entities(qids):
    """Labels in three languages, sitelinks, image, inception, architect, heritage status."""
    out = {}
    qids = list(qids)
    for i in range(0, len(qids), 40):
        chunk = qids[i:i + 40]
        data = api("https://www.wikidata.org/w/api.php", {
            "action": "wbgetentities", "ids": "|".join(chunk), "format": "json",
            "props": "labels|sitelinks|claims|descriptions", "languages": "it|en|ru",
            "sitefilter": "itwiki|enwiki|ruwiki"})
        for qid, ent in (data.get("entities") or {}).items():
            claims = ent.get("claims") or {}

            def first(prop, source="value"):
                for c in claims.get(prop, []):
                    try:
                        return c["mainsnak"]["datavalue"]["value"][source] if source == "value" \
                            else c["mainsnak"]["datavalue"]["value"]
                    except (KeyError, TypeError):
                        continue
                return None

            inception = first("P571")
            inception_year = None
            if isinstance(inception, dict) and inception.get("time"):
                t = inception["time"]
                try:
                    inception_year = int(t[1:5])
                except ValueError:
                    inception_year = None
            out[qid] = {
                "labels": {k: v["value"] for k, v in (ent.get("labels") or {}).items()},
                "descriptions": {k: v["value"] for k, v in (ent.get("descriptions") or {}).items()},
                "sitelinks": {k: v["title"] for k, v in (ent.get("sitelinks") or {}).items()},
                "image": first("P18"),
                "inception": inception.get("time") if isinstance(inception, dict) else None,
                "inception_year": inception_year,
                "architect_qid": (first("P84") or {}).get("id") if isinstance(first("P84"), dict) else None,
                "heritage": (first("P1435") or {}).get("id") if isinstance(first("P1435"), dict) else None,
            }
    return out


def commons_files(titles):
    """Photo credit, licence and source page for each Commons file title."""
    out = {}
    titles = [t for t in titles if t]
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        data = api("https://commons.wikimedia.org/w/api.php", {
            "action": "query", "titles": "|".join(chunk), "format": "json",
            "prop": "imageinfo", "iiprop": "extmetadata|url|user|size", "iiurlwidth": 640})
        for page in ((data.get("query") or {}).get("pages") or {}).values():
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata") or {}

            def field(name):
                v = meta.get(name) or {}
                return (v.get("value") or "").strip() if isinstance(v, dict) else None

            out[page.get("title")] = {
                "artist": field("Artist"), "license": field("LicenseShortName"),
                "license_url": field("LicenseUrl"), "credit": field("Credit"),
                "description": field("ImageDescription"), "date": field("DateTimeOriginal"),
                "page": info.get("descriptionurl"), "thumb": info.get("thumburl"),
                "width": info.get("width"), "height": info.get("height"),
                "uploader": info.get("user"),
            }
    return out


def wikipedia_geosearch(lat, lon, lang="it", radius=60):
    data = api(f"https://{lang}.wikipedia.org/w/api.php", {
        "action": "query", "list": "geosearch", "gscoord": f"{lat}|{lon}", "gsradius": radius,
        "gslimit": 3, "format": "json"})
    return [{"title": r["title"], "dist_m": round(r["dist"]), "pageid": r["pageid"],
             "lang": lang, "url": f"https://{lang}.wikipedia.org/wiki/" + urllib.parse.quote(r['title'].replace(' ', '_'))}
            for r in ((data.get("query") or {}).get("geosearch") or [])]


def main(areas):
    links = {}
    for area in areas:
        path = config.PROCESSED / f"buildings_dated_{area}.geojson"
        feats = json.loads(path.read_text(encoding="utf-8"))["features"]
        qids, named = set(), []
        for f in feats:
            pr = f["properties"]
            if pr.get("wikidata"):
                qids.add(pr["wikidata"])
            elif pr.get("name") and pr.get("label_lon") is not None:
                named.append((pr["building_id"], pr["name"], pr["label_lat"], pr["label_lon"],
                              pr.get("wikipedia") or pr.get("wikipedia:it") or pr.get("wikipedia:en")))
        print(f"[{area}] buildings={len(feats)} qids={len(qids)} named_without_qid={len(named)}")
        ents = wikidata_entities(sorted(qids))
        print(f"[{area}] wikidata entities resolved: {len(ents)}")

        # candidates for named buildings with no wikidata link
        cand = {}
        for bid, name, lat, lon, wiki in named:
            hits = wikipedia_geosearch(lat, lon)
            if hits:
                cand[bid] = {"name": name, "tagged_article": wiki, "candidates": hits}
        print(f"[{area}] geosearch candidates: {len(cand)}")

        titles = [e["image"] for e in ents.values() if e.get("image")]
        files = commons_files(titles)
        print(f"[{area}] commons files resolved: {len(files)}")

        for f in feats:
            pr = f["properties"]
            bid = pr["building_id"]
            rec = {"building_id": bid, "area": area}
            qid = pr.get("wikidata")
            if qid and qid in ents:
                e = ents[qid]
                rec.update({"qid": qid, "status": "confirmed",
                            "label": e["labels"].get("it") or e["labels"].get("en") or pr.get("name"),
                            "labels": e["labels"], "descriptions": e["descriptions"],
                            "sitelinks": e["sitelinks"], "inception_year": e["inception_year"],
                            "inception": e["inception"], "architect_qid": e["architect_qid"],
                            "heritage": e["heritage"]})
                if e.get("image"):
                    rec["photo"] = files.get("File:" + e["image"].replace(" ", "_"), {})
            elif bid in cand:
                rec.update({"qid": None, "status": "candidate", "name": pr.get("name"),
                            "geosearch": cand[bid]["candidates"], "tagged_article": cand[bid]["tagged_article"]})
            if len(rec) > 2:
                links[bid] = rec
        (config.PROCESSED / f"wikimedia_{area}.json").write_text(
            json.dumps(links, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[{area}] links kept: {len(links)}")
    config.READY.mkdir(parents=True, exist_ok=True)
    (config.READY / "wikimedia.json").write_text(json.dumps(links, ensure_ascii=False, indent=1),
                                                 encoding="utf-8")
    print("wrote", config.READY / "wikimedia.json", "entries:", len(links))


if __name__ == "__main__":
    main(sys.argv[1:] or list(config.EXTRACTS))