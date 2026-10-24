// Additive exact-GID overlay: copy every indexed triangle, including shaped roofs.
// No footprint fabrication, height assumptions, proximity matching or atlas material edits.
export function extractChurchGeometry(THREE, tile, gids) {
  const local = new Set();
  for (let b = 0; b < tile.nB; b++) if (gids.has(tile.attr[b * 8 + 3])) local.add(b);
  if (!local.size) return null;
  const remap = new Map(), positions = [], indices = [];
  for (let i = 0; i < tile.idx.length; i += 3) {
    const tri = [tile.idx[i], tile.idx[i + 1], tile.idx[i + 2]];
    if (!tri.every(v => local.has(tile.bld[v] & 0x7fff))) continue;
    for (const v of tri) {
      if (!remap.has(v)) { remap.set(v, remap.size); positions.push(tile.pos[v * 3], tile.pos[v * 3 + 1], tile.pos[v * 3 + 2]); }
      indices.push(remap.get(v));
    }
  }
  if (!indices.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Int16Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function installChurchBuildingHighlight({ THREE, fetchData = url => fetch(url) }) {
  const tiles = [], overlays = [], sources = new Set();
  let manifest = null, pending = null, disposed = false, picking = false, error = null;
  const material = new THREE.MeshBasicMaterial({ color: '#436817', side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const blueMaterial = new THREE.MeshBasicMaterial({ color: '#0000ff', side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const sync = () => { for (const mesh of overlays) mesh.visible = !disposed && !picking && sources.size > 0; };
  function attach(entry) {
    if (!manifest || entry.attached || disposed) return;
    entry.attached = true;
    // Disjoint GID sets: blue geometry is never also drawn in green.
    for (const [color, overlayMaterial] of [['#436817', material], ['#0000ff', blueMaterial]]) {
      const gids = new Set(manifest.buildings.filter(b => (b.highlight_color || '#436817') === color).map(b => b.gid));
      const geometry = extractChurchGeometry(THREE, entry.tile, gids);
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, overlayMaterial);
      mesh.name = color === '#0000ff' ? 'canton-building-highlight' : 'church-building-highlight';mesh.renderOrder = 30;
      mesh.userData.geometry_source = manifest.geometry_source;
      mesh.userData.gids = [...gids];
      // Child transform preserves the atlas's decimetres and tile origin exactly.
      entry.parent.add(mesh);overlays.push(mesh);
    }
    sync();
  }
  async function load() {
    if (disposed || manifest) return manifest;
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetchData('data/church-buildings.json');
        if (!response.ok) throw new Error(`Church buildings HTTP ${response.status}`);
        const data = await response.json();
        if (data.version !== 1 || !Array.isArray(data.buildings) || !data.buildings.every(b => Number.isInteger(b.gid) && b.gid >= 0 && /^Q\d+$/.test(b.qid))) throw new Error('Invalid church buildings manifest');
        if (!disposed) { manifest = data;error = null;tiles.forEach(attach); }
      } catch (e) { error = e.message; }
      finally { pending = null; }
      return manifest;
    })();
    return pending;
  }
  return {
    load, registerTile(tile, parent) { if (disposed) return;const entry = { tile, parent };tiles.push(entry);attach(entry); },
    setSourceVisible(source, visible) { if (disposed) return;if (visible) { sources.add(source);void load(); } else sources.delete(source);sync(); },
    setPicking(value) { picking = !!value;sync(); },
    get overlays() { return overlays; }, get manifest() { return manifest; }, get error() { return error; },
    dispose() { if (disposed) return;disposed = true;sources.clear();for (const mesh of overlays) { mesh.removeFromParent();mesh.geometry.dispose(); }overlays.length = 0;tiles.length = 0;material.dispose();blueMaterial.dispose(); }
  };
}
