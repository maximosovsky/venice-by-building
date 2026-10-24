"""Build the gondola game's water mask: a fine raster of the real water polygons.

The viewer draws Venice from the polygons in web/data/water.bin, but a game that drives the
canals needs to ask "is this square metre water?" thousands of times a second, and the coarse
400x280 preview mask used earlier answers that at 49 m a cell - five times wider than a side
canal. This stage rasterises the same water.bin with the even-odd rule at 3 m a cell, which is
narrow enough for the real canals, and writes it as a PNG (33 KB for 2.8 M cells, because a
one-bit image compresses well).

Output contract, read by web/gondola-3d.js:
  web/img/water-fine.png   1667 x 1667, 8-bit grey, 255 = water, row 0 = Z0 (lowest z)
  region: x0 = -2854, z0 = -2840, cell = 3 m  (covers X -2854..2147, Z -2840..2161,
  a 5 x 5 km square around the Canal Grande start at -354, -340)

Run: python pipeline/venice/game_mask.py
"""
import gzip
import pathlib
import struct

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / 'web' / 'data'
OUT = ROOT / 'web' / 'img' / 'water-fine.png'

CELL = 3.0
X0, Z0 = -2854.0, -2840.0
W = H = 1667


def rings(name):
    """Yield the ring vertex indices of every polygon in an exported polygon file."""
    raw = gzip.decompress((DATA / name).read_bytes())
    n_poly, n_ring, n_vert = struct.unpack_from('<3I', raw, 0)
    ring_start = np.frombuffer(raw, dtype='<u4', count=n_poly + 1, offset=12)
    off = 12 + 4 * (n_poly + 1)
    vert_start = np.frombuffer(raw, dtype='<u4', count=n_ring + 1, offset=off)
    off += 4 * (n_ring + 1)
    xz = np.frombuffer(raw, dtype='<f4', count=2 * n_vert, offset=off)
    yield xz[0::2].astype(np.float64), xz[1::2].astype(np.float64), ring_start, vert_start, n_poly


def edges(name):
    """All ring edges of the file, as four arrays ax, az, bx, bz."""
    out = [[], [], [], []]
    for xs, zs, ring_start, vert_start, n_poly in rings(name):
        for p in range(n_poly):
            for r in range(ring_start[p], ring_start[p + 1]):
                s, e = int(vert_start[r]), int(vert_start[r + 1])
                n = e - s
                if n < 3:
                    continue
                idx = np.arange(s, e)
                nxt = s + (idx - s + 1) % n
                out[0].append(xs[idx]); out[1].append(zs[idx])
                out[2].append(xs[nxt]); out[3].append(zs[nxt])
    return tuple(np.concatenate(a) for a in out)


def rasterise(name):
    """Even-odd fill of every ring of the file on the CELL grid; 1 = inside."""
    ax, az, bx, bz = edges(name)
    xmax, zmax = X0 + W * CELL, Z0 + H * CELL
    keep = ((np.minimum(az, bz) < zmax) & (np.maximum(az, bz) >= Z0)
            & (np.minimum(ax, bx) < xmax) & (np.maximum(ax, bx) >= X0))
    ax, az, bx, bz = ax[keep], az[keep], bx[keep], bz[keep]
    dy = bz - az
    dy[dy == 0] = 1e-9
    inv = (bx - ax) / dy
    out = np.zeros((H, W), dtype=np.uint8)
    for row, zc in enumerate(Z0 + (np.arange(H) + 0.5) * CELL):
        m = ((az <= zc) & (bz > zc)) | ((bz <= zc) & (az > zc))
        if not m.any():
            continue
        xs = np.sort(ax[m] + (zc - az[m]) * inv[m])
        if xs.size < 2:
            continue
        pairs = xs[: xs.size - xs.size % 2].reshape(-1, 2)
        c0 = np.ceil((pairs[:, 0] - X0) / CELL - 0.5).astype(np.int64)
        c1 = np.floor((pairs[:, 1] - X0) / CELL - 0.5).astype(np.int64)
        np.clip(c0, 0, W, out=c0); np.clip(c1, -1, W - 1, out=c1)
        for a, b in zip(c0, c1):
            if b >= a:
                out[row, a:b + 1] = 1
    return out


def main():
    water = rasterise('water.bin')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.where(water == 1, 255, 0).astype(np.uint8), mode='L').save(OUT, optimize=True)
    start = int(water[int((-340 - Z0) // CELL), int((-354 - X0) // CELL)])
    print(f'{OUT}: {W}x{H} at {CELL} m, water {100 * water.mean():.1f}% of the box, {OUT.stat().st_size} bytes')
    print(f'start (-354, -340) is {"water" if start else "LAND - check the region"}')
    if not start:
        raise SystemExit('the start point must be water')


if __name__ == '__main__':
    main()