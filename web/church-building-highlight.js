// Additive exact-GID overlay: copy every indexed triangle, including shaped roofs.
// No footprint fabrication, height assumptions, proximity matching or atlas material edits.
export function extractChurchGeometry(THREE, tile, gids) {
  const local = new Set();
  for (let b = 0; b < tile.nB; b++) if (gids.has(tile.attr[b * 8 + 3])) local.add(b);
  if (!local.size) return null;
  const remap = new Map(), positions = [], indices = [], shaped = [];
  for (let i = 0; i < tile.idx.length; i += 3) {
    const tri = [tile.idx[i], tile.idx[i + 1], tile.idx[i + 2]];
    if (!tri.every(v => local.has(tile.bld[v] & 0x7fff))) continue;
    for (const v of tri) {
      if (!remap.has(v)) { remap.set(v, remap.size); positions.push(tile.pos[v * 3], tile.pos[v * 3 + 1], tile.pos[v * 3 + 2]); shaped.push(tile.bld[v] >= 32768 ? 1 : 0); }
      indices.push(remap.get(v));
    }
  }
  if (!indices.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Int16Array(positions), 3));
  geometry.setAttribute('shaped', new THREE.BufferAttribute(new Float32Array(shaped), 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function installChurchBuildingHighlight({ THREE, fetchData = url => fetch(url) }) {
  const tiles = [], overlays = [], sources = new Set();
  let manifest = null, pending = null, disposed = false, picking = false, error = null;
  const materials = new Map([['#436817', new THREE.MeshBasicMaterial({ color: '#436817', side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })]]);
  function materialFor(color, ageShading, parent) {
    if (ageShading) {
      const key = `age:${color}`;
      if (!materials.has(key)) materials.set(key, new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        uniforms: { uColor: { value: new THREE.Color(color) },
          uFogColor: parent.userData?.draw?.uniforms.uFogColor || { value: new THREE.Color('#ffffff') },
          uFog: parent.userData?.draw?.uniforms.uFog || { value: new THREE.Vector2(9000, 26000) } },
        vertexShader: `in float shaped; uniform vec3 uColor; out vec3 vColor; out vec3 vWorld; out float vShaped;
          void main() { vShaped = shaped; vColor = shaped > 0.5 ? mix(uColor, vec3(1.0), 0.3) : uColor;
            vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `precision highp float; uniform vec3 uFogColor; uniform vec2 uFog;
          in vec3 vColor; in vec3 vWorld; in float vShaped; out vec4 outColor;
          void main() {
            vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
            float sun = max(dot(n, normalize(vec3(-0.55, 0.55, -0.62))), 0.0);
            float light = mix(0.66 + 0.34 * sun, 1.04, smoothstep(0.86, 0.94, n.y));
            if (vShaped > 0.5) light = 0.6 + 0.3 * sun + 0.2 * max(dot(n, normalize(vec3(0.6, 0.45, 0.66))), 0.0);
            float foot = mix(0.82, 1.0, clamp(vWorld.y / 12.0, 0.0, 1.0));
            vec3 c = vColor * light * foot;
            c = mix(c, uFogColor, smoothstep(uFog.x, uFog.y, length(vWorld - cameraPosition)));
            outColor = vec4(c, 1.0);
          }`,
      }));
      return materials.get(key);
    }
    if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    return materials.get(color);
  }
  const sync = () => { for (const mesh of overlays) mesh.visible = !disposed && !picking && sources.size > 0; };
  function attach(entry) {
    if (!manifest || entry.attached || disposed) return;
    entry.attached = true;
    // Disjoint GID sets: special-color geometry is never also drawn in green.
    for (const color of new Set(manifest.buildings.map(b => (b.highlight_color || '#436817').toLowerCase()))) {
      const ageShading = manifest.buildings.some(b => b.highlight_color?.toLowerCase() === color && b.highlight_shading === 'atlas_age');
      const overlayMaterial = materialFor(color, ageShading, entry.parent);
      const gids = new Set(manifest.buildings.filter(b => (b.highlight_color || '#436817').toLowerCase() === color).map(b => b.gid));
      const geometry = extractChurchGeometry(THREE, entry.tile, gids);
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, overlayMaterial);
      mesh.name = color === '#436817' ? 'church-building-highlight' : 'synagogue-building-highlight';mesh.renderOrder = 30;
      mesh.userData.geometry_source = manifest.geometry_source;
      mesh.userData.gids = [...gids];
      mesh.userData.identities = manifest.buildings.filter(b => gids.has(b.gid)).flatMap(b => b.identities || [{ qid: b.qid, stop_id: b.stop_id }]);
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
        if (data.version !== 1 || !Array.isArray(data.buildings) || !data.buildings.every(b => Number.isInteger(b.gid) && b.gid >= 0 && /^Q\d+$/.test(b.qid) && (!Object.hasOwn(b, 'highlight_color') || (typeof b.highlight_color === 'string' && /^#[0-9a-f]{6}$/i.test(b.highlight_color))))) throw new Error('Invalid church buildings manifest');
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
    dispose() { if (disposed) return;disposed = true;sources.clear();for (const mesh of overlays) { mesh.removeFromParent();mesh.geometry.dispose(); }overlays.length = 0;tiles.length = 0;for (const material of materials.values()) material.dispose();materials.clear(); }
  };
}
