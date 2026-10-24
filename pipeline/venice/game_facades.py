"""Build the gondola game's façade atlas: one picture file for every dated building.

The viewer already keeps a credited local copy of each building's Wikidata/Wikipedia photo in
web/media/Q<id>.webp (stage 11) and points wiki.json at it. A game that wants a picture on each
canal-facing wall cannot fetch a thousand files, so this stage packs the photos of the buildings
inside the play area into one square atlas of 128 px tiles, and writes the building -> tile
lookup the shader needs.

Output contract, read by web/gondola-3d.js (one file carries its own geometry):
  web/data/facades.bin   gzipped: magic 'FAC1', u16 tile, u16 cols, u16 rows, u32 count,
                         then count * i16 - the atlas slice of every building record, -1 none.
                         Records are indexed by the building id the tile worker reports as bld,
                         which is the row number in attrs.bin.
  web/img/facades.webp   cols x rows tiles of 128 px, each photo centre-cropped to a square.

Attribution stays with the project's rule: wiki.json and web/media/manifest.json keep the author,
licence and file page of every photo, and the game prints the Commons credit line.

Run: python pipeline/venice/game_facades.py
"""
import gzip
import json
import struct
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'web' / 'data'
MEDIA = ROOT / 'web' / 'media'
ATLAS = ROOT / 'web' / 'img' / 'facades.webp'
INDEX = DATA / 'facades.bin'

TILE = 128
START = (-354.0, -340.0)
RADIUS = 2400.0          # the square of tiles web/gondola-3d.js loads
QUALITY = 80


def building_records():
    """(x, z, wk) of every building record, in attrs.bin row order."""
    cfg = json.loads((DATA / 'venezia.json').read_text(encoding='utf-8'))
    raw = gzip.decompress((DATA / 'attrs.bin').read_bytes())
    stride = cfg['attrStride']
    fmt = {'<f8': 'd', '<i2': 'h', '<u2': 'H', '<u4': 'I', '<i4': 'i', '|u1': 'B', '<f4': 'f'}
    off = {k: (o, fmt[f]) for k, (o, f) in cfg['attrFields'].items()}

    def at(row, key):
        o, f = off[key]
        return struct.unpack_from(f, raw, row * stride + o)[0]

    return [(at(i, 'x'), at(i, 'z'), at(i, 'wk')) for i in range(len(raw) // stride)]


def pick():
    """The atlas slice of every building gid: 0..count-1 for the ones with a photo, else -1."""
    wiki = json.loads((DATA / 'wiki.json').read_text(encoding='utf-8'))
    records = building_records()
    index = [-1] * len(records)
    sources = []
    for gid, (x, z, wk) in enumerate(records):
        if not (0 <= wk < len(wiki)):
            continue
        if abs(x - START[0]) > RADIUS or abs(z - START[1]) > RADIUS:
            continue
        thumb = (wiki[wk].get('image') or {}).get('thumb')
        if not thumb:
            continue
        path = ROOT / 'web' / thumb
        if not path.exists():
            continue
        index[gid] = len(sources)
        sources.append((path, wiki[wk].get('label', '')))
    return index, sources


def main():
    index, sources = pick()
    count = len(sources)
    cols = 1
    while cols * cols < count:
        cols += 1
    rows = -(-count // cols)
    atlas = Image.new('RGB', (cols * TILE, rows * TILE), (243, 240, 234))

    skipped = 0
    for slice_id, (path, _label) in enumerate(sources):
        try:
            im = Image.open(path).convert('RGB')
        except Exception as exc:                                  # a broken file must not stop the build
            print(f'  skipped {path.name}: {exc}', file=sys.stderr)
            skipped += 1
            continue
        side = min(im.size)                                       # the photo's centre square
        left = (im.width - side) // 2
        top = (im.height - side) // 2
        im = im.crop((left, top, left + side, top + side)).resize((TILE, TILE), Image.LANCZOS)
        atlas.paste(im, ((slice_id % cols) * TILE, (slice_id // cols) * TILE))

    ATLAS.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS, quality=QUALITY, method=6)

    header = struct.pack('<4sHHHI', b'FAC1', TILE, cols, rows, len(index))
    body = header + struct.pack(f'<{len(index)}h', *index)
    INDEX.write_bytes(gzip.compress(body, 9))

    placed = sum(1 for v in index if v >= 0)
    print(f'{ATLAS.name}: {cols} x {rows} tiles of {TILE} px = {atlas.width} x {atlas.height}, '
          f'{ATLAS.stat().st_size / 1e6:.1f} MB')
    print(f'{INDEX.name}: {placed} of {len(index)} building records have a photo, '
          f'{INDEX.stat().st_size / 1024:.0f} KB gzipped'
          + (f', {skipped} unreadable' if skipped else ''))


if __name__ == '__main__':
    main()