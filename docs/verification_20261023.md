# Verification of the Venice atlas

Run after every export. Both tests read the produced files exactly the way the viewer reads them.

```bash
python tests/test_viewer_contract.py          # layout, bounds, cards, ground, assets
node   tests/worker_smoke.mjs                 # the viewer's own worker code on real tiles
node   tests/i18n_coverage.mjs                # every text has Italian and English
VENICE_DATA=/path/to/downloaded/data node tests/worker_smoke.mjs   # the same, for a deployment
```

`tests/test_viewer_contract.py` replays the viewer's parse order for every tile: header fields, array
order, pad-to-four-byte alignment, monotonic part/ring/vertex indexes, period indexes inside the
palette, dates inside the timeline, part heights and bases, and the ground polygon layout. It also
checks that the page references files that exist and that app.js fetches the file names we export.
Result on the current data: **110 637 checks, 0 failures**.

`tests/worker_smoke.mjs` imports `web/worker.js` itself, gives it a `self` to attach to, feeds it every
tile of a pack and inspects what comes back: triangle indexes inside the vertex array, building ids per
vertex, int16 coordinate range, world position against the frame the centroids sit in, and genuinely
degenerate triangles (area measured in three dimensions, because walls have no area in plan).
Result on the current data: **11 602 objects built from pack0, 0 wrapped coordinates, 0 degenerate
triangles, 0 vertices outside the frame**.

The contract test also covers the two additions: the bridge layer exists and counts 465, every bridge
record carries the assumed deck height and an unknown date, and the labels hold at least 500 street
names including fondamenta and riva, 375 named bridges, each with a length, a width and an angle, and
are ordered by importance so that search offers a fondamenta before a back alley.

## What the first deployment got wrong

The site opened with an empty scene. Three separate faults, all on the pipeline side, each of which the
tests above now catch:

1. **Two bytes where the viewer reads four.** The tile carries `flag`, `period`, `floors` and `heritage`
   as four separate byte arrays; the exporter packed period and date flag into one byte, so every
   following array was shifted and the geometry read as noise. The contract test now walks the arrays
   in the viewer's order and bounds-checks them.
2. **Vertices in the projected CRS instead of the local frame.** Tile vertices must be decimetres from
   the tile corner *in the city's local frame*; the exporter subtracted the tile origin from EPSG:32633
   metres, leaving coordinates about 500 km out, which then wrapped inside int16. Buildings were placed
   outside the camera. The smoke test now compares vertex world positions with the centroid frame.
3. **Ground layers assembled from two coordinate systems.** Land and water polygons came from OSM in
   degrees while the administrative outlines were already projected, so the flat ground was a union of
   metres and degrees. Both are projected now, and the contract test rejects any ground vertex more than
   60 km from the origin.

The page also gained an error overlay: if the module fails to load, a fetch fails or the boot stalls for
30 seconds, the reason is printed on screen instead of leaving a blank map.

## What these tests cannot check

WebGL rendering, shaders, camera framing and interaction. The scene has never been looked at in a
browser from here: the cloud browser refuses localhost and carries no WebGL, and no local Chrome with
a debugging port was available. A visual pass by a person is still outstanding.

## Checked in a real browser, through the debug protocol

A headless Chrome driven over the DevTools protocol, with the software renderer, at a small window
size: the wheels and buttons were sent as real input events and the page was read back. This is how
three faults were caught that no file-level test could see — the left button turning the city instead
of moving it, the wheel only working over the bare canvas, and (after the translation) a name clash in
`app.js` that stopped the module entirely.

On the live site: `?lang=it` and `?lang=en` load the map with the scene ready and **0 errors**; the
switch goes Russian → Italian → English → Russian and back in any order; the notes, the search labels
("Building, year unknown", "Street, waterfront", "Canal, lagoon") and a building card ("anno ignoto",
"Year of construction unknown") all follow the chosen language; a search for *Salute* offers the
building, the canal and the fondamenta, each named as its own kind.