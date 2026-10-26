"""Имена архитекторов из карточек: ссылки на Википедию и отдельная страница со списком.

Источник — Викиданные: свойство P84 у самого здания и подписи с сайтлинками у человека.
Ничего не выдумывается: если у имени нет статьи, оно остаётся без ссылки, и это видно на
странице. Скрипт запускается вручную после экспорта wiki.json и правит его же — добавляет
каждой записи список ссылок architects_links, выровненный по индексу с architects_la.
"""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API = 'https://www.wikidata.org/w/api.php'
USER_AGENT = 'venice-by-building/1.0 (architect list; Venice atlas, local run)'
LANGS = ('ru', 'it', 'en')
SITES = {'ru': 'ruwiki', 'it': 'itwiki', 'en': 'enwiki'}


def api(params, tries=4):
    query = dict(params, format='json')
    url = API + '?' + urllib.parse.urlencode(query)
    for attempt in range(tries):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(request, timeout=90) as response:
                return json.load(response)
        except Exception:
            if attempt == tries - 1:
                raise
            time.sleep(3 * (attempt + 1))


def batches(items, size=50):
    items = list(items)
    for start in range(0, len(items), size):
        yield items[start:start + size]


def wikipedia_url(lang, title):
    return f'https://{lang}.wikipedia.org/wiki/' + urllib.parse.quote(title.replace(' ', '_'))


def fetch_architect_ids(building_qids):
    """P84 у зданий: кто спроектировал; порядок заявлений в Викиданных сохраняем."""
    result = {}
    for batch in batches(building_qids):
        data = api({'action': 'wbgetentities', 'ids': '|'.join(batch), 'props': 'claims'})
        for qid, entity in data.get('entities', {}).items():
            ids = []
            for claim in entity.get('claims', {}).get('P84', []):
                value = claim.get('mainsnak', {}).get('datavalue', {}).get('value')
                if isinstance(value, dict) and value.get('id'):
                    ids.append(value['id'])
            if ids:
                result[qid] = ids
        time.sleep(0.3)
    return result


def fetch_people(architect_qids):
    """Подписи и сайтлинки людей: из них берём имя и статью на каждом языке."""
    people = {}
    for batch in batches(architect_qids):
        data = api({'action': 'wbgetentities', 'ids': '|'.join(batch), 'props': 'labels|sitelinks',
                    'languages': '|'.join(LANGS), 'sitefilter': '|'.join(SITES.values())})
        for qid, entity in data.get('entities', {}).items():
            labels = {lang: (entity.get('labels', {}).get(lang) or {}).get('value') for lang in LANGS}
            links = {}
            for lang, site in SITES.items():
                title = (entity.get('sitelinks', {}).get(site) or {}).get('title')
                if title:
                    links[lang] = wikipedia_url(lang, title)
            people[qid] = {'qid': qid, 'name': labels, 'wikipedia': links}
        time.sleep(0.3)
    return people


def main():
    wiki_path = ROOT / 'web/data/wiki.json'
    records = json.loads(wiki_path.read_text(encoding='utf-8'))
    # Записи с одинаковым qid встречаются дважды: карточку правим в каждой, словарь оставляет первую.
    by_qid = {}
    for record in records:
        if record.get('qid'):
            by_qid.setdefault(record['qid'], record)
    targets = [qid for qid, record in by_qid.items() if record.get('architects')]
    print(f'записей с архитекторами в карточках: {len(targets)}')

    architect_ids = fetch_architect_ids(targets)
    people = fetch_people(sorted({q for ids in architect_ids.values() for q in ids}))
    print(f'людей найдено: {len(people)}')

    by_building = {qid: [pid for pid in ids if pid in people] for qid, ids in architect_ids.items()}
    used = sorted({pid for ids in by_building.values() for pid in ids})
    # Индекс по именам: карточка знает имя, но не qid, — по нему и находим статью.
    by_name = {lang: {} for lang in LANGS}
    by_name_any = {}
    for pid in used:
        for lang in LANGS:
            label = people[pid]['name'].get(lang)
            if label:
                by_name[lang][label] = pid
                by_name_any.setdefault(label, pid)

    # Ссылки вписываем прямо в wiki.json, выровняв по индексу с architects_la — карточке не нужен
    # второй запрос: она рисует имя и подставляет ссылку из того же места.
    linked = plain = 0
    for record in records:
        qid = record.get('qid')
        names = record.get('architects_la') or {}
        if not qid or not record.get('architects'):
            continue
        links = {}
        for lang in LANGS:
            urls = []
            for name in names.get(lang) or record.get('architects') or []:
                # Имя в слоте языка иногда записано на другом языке: ищем и по всем подписям сразу.
                pid = by_name.get(lang, {}).get(name) or by_name_any.get(name)
                urls.append((people.get(pid, {}).get('wikipedia', {}).get(lang) if pid else None))
            links[lang] = urls
        record['architects_links'] = links
        for url in links.get('ru') or []:
            if url:
                linked += 1
            else:
                plain += 1

    payload = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'source': 'Wikidata P84 (architect) and entity sitelinks ru/it/en Wikipedia',
        'buildings_with_architects': len(by_building),
        'architects': [
            {
                'qid': pid,
                'name': people[pid]['name'],
                'wikipedia': people[pid]['wikipedia'],
                'buildings': [
                    {'qid': qid, 'label': (by_qid.get(qid, {}).get('label') or by_qid.get(qid, {}).get('la') or qid)}
                    for qid, ids in sorted(by_building.items()) if pid in ids
                ],
            }
            for pid in used
        ],
        'by_name': by_name,
    }
    out = ROOT / 'web/data/architects.json'
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    wiki_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    with_wiki = sum(1 for a in payload['architects'] if a['wikipedia'])
    without = [a['name'].get('en') or a['name'].get('it') or a['qid'] for a in payload['architects'] if not a['wikipedia']]
    print(json.dumps({'architects': len(payload['architects']), 'with_wikipedia': with_wiki,
                      'without_wikipedia': without, 'name_links_filled': linked, 'name_links_empty': plain,
                      'out': str(out)}, ensure_ascii=False))


if __name__ == '__main__':
    main()