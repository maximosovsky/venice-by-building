"""Локальные копии фотографий: маленькие, в репозитории, с сохранением автора и лицензии.

Карточки сейчас показывают фотографии прямо с Викисклада. Это работает, но зависит от чужого сервера,
его ограничений и латентности. Здесь мы скачиваем исходную миниатюру Викисклада (960 px), уменьшаем её
до 560 px по ширине и сохраняем в WebP — файл получается в разы легче, а карточка грузится с нашего
домена. Автор, лицензия и страница файла остаются в данных карточки: производная работа по CC BY-SA
требует указания авторства, и оно сохраняется.

Повторный запуск не качает заново: готовые файлы пропускаются, поэтому шаг можно прерывать.
"""
from __future__ import annotations

import io
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

from . import config

MEDIA = config.WEB_DATA.parent / "media"
MANIFEST = MEDIA / "manifest.json"
WIDTH = 560          # ширина локальной копии: в карточке больше не нужно
QUALITY = 76         # WebP: заметно легче JPEG при том же виде
UA = "venice-atlas/1.0 (building-by-building atlas; contact: local)"


def fetch(url: str) -> bytes | None:
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return urllib.request.urlopen(req, timeout=90).read()
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
            if exc.code != 429 and attempt == 4:
                raise
            wait = 20 + 25 * attempt
            print(f"   {exc.code} от Викисклада, ждём {wait} с")
            time.sleep(wait)
        except Exception as exc:                       # обрыв связи: подождать и повторить
            if attempt == 4:
                print(f"   не удалось: {type(exc).__name__} {str(exc)[:60]}")
                return None
            time.sleep(10 + 10 * attempt)
    return None


def shrink(raw: bytes) -> bytes | None:
    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        return None
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    if img.width > WIDTH:
        img = img.resize((WIDTH, max(1, round(img.height * WIDTH / img.width))), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="WEBP", quality=QUALITY, method=6)
    return out.getvalue()


def main(area: str = "centro") -> None:
    MEDIA.mkdir(parents=True, exist_ok=True)
    cards = json.loads((config.WEB_DATA / "wiki.json").read_text(encoding="utf-8"))
    cards = cards["cards"] if isinstance(cards, dict) else cards
    have = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}

    # Источник берём из remote: карточка хранит адрес Викисклада, а показывать может только локальную копию.
    todo = [(c["qid"], (c["image"] or {}).get("remote") or (c["image"] or {}).get("thumb"), c["image"]) for c in cards
            if c.get("qid") and ((c.get("image") or {}).get("remote") or (c.get("image") or {}).get("thumb"))]
    print(f"карточек с фотографией: {len(todo)} | уже скачано: {len(have)}")

    done = skipped = failed = 0
    total_in = total_out = 0
    for i, (qid, url, meta) in enumerate(todo, 1):
        target = MEDIA / f"{qid}.webp"
        # Файл на диске считается готовым и без записи в манифесте: так прерванный запуск не качает заново.
        if target.exists() and qid not in have:
            have[qid] = {"file": f"media/{qid}.webp", "bytes": target.stat().st_size, "source_bytes": None,
                         "page": meta.get("page"), "artist": meta.get("artist"),
                         "license": meta.get("license"), "licenseUrl": meta.get("licenseUrl")}
        if target.exists():
            skipped += 1
            continue
        raw = fetch(url)
        if not raw:
            failed += 1
            continue
        small = shrink(raw)
        if not small:
            failed += 1
            continue
        target.write_bytes(small)
        have[qid] = {"file": f"media/{qid}.webp", "bytes": len(small), "source_bytes": len(raw),
                     "page": meta.get("page"), "artist": meta.get("artist"),
                     "license": meta.get("license"), "licenseUrl": meta.get("licenseUrl")}
        done += 1
        total_in += len(raw)
        total_out += len(small)
        if done % 25 == 0:
            MANIFEST.write_text(json.dumps(have, ensure_ascii=False, indent=1), encoding="utf-8")   # чтобы прерывание не теряло учёт
        if done % 25 == 0 or i == len(todo):
            print(f"   {i}/{len(todo)}: записано {done}, пропущено {skipped}, ошибок {failed}, "
                  f"на диске {sum(v['bytes'] for v in have.values()) / 1048576:.1f} МБ")
        time.sleep(0.4)

    MANIFEST.write_text(json.dumps(have, ensure_ascii=False, indent=1), encoding="utf-8")
    size = sum(v["bytes"] for v in have.values())
    print(f"итог: файлов {len(have)}, на диске {size / 1048576:.1f} МБ, "
          f"скачано за этот запуск {total_in / 1048576:.1f} МБ → сжато до {total_out / 1048576:.1f} МБ, ошибок {failed}")
    print("папка:", MEDIA)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "centro")