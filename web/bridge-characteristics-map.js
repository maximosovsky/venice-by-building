// Additive municipal bridge overlay: the material/purpose/type/size record drawn where the
// municipality surveyed it. Geometry comes only from the published characteristics file; nothing
// is synthesized from route or atlas geometry, and the installer owns one scene group only.
export const BRIDGE_UI = {
  material: { ru: 'Материал', it: 'Materiale', en: 'Material' },
  purpose: { ru: 'Назначение', it: 'Uso', en: 'Purpose' },
  type: { ru: 'Тип', it: 'Tipo', en: 'Type' },
  length: { ru: 'Длина', it: 'Lunghezza', en: 'Length' },
  width: { ru: 'Ширина', it: 'Larghezza', en: 'Width' },
  unknown: { ru: 'Не указано', it: 'Non indicato', en: 'Not specified' },
  legend: { ru: 'Цвет — материал моста (муниципальный каталог)', it: 'Il colore indica il materiale del ponte (catalogo comunale)', en: 'Colour is the municipal bridge material' },
  caveat: { ru: 'Размеры — конверт следа моста, не обследованный пролёт или проходимая ширина.', it: 'Le misure sono l’inviluppo dell’impronta del ponte, non la luce rilevata né la larghezza percorribile.', en: 'Sizes are the footprint envelope, not the surveyed span or usable width.' },
  unavailable: { ru: 'Муниципальные характеристики недоступны.', it: 'Caratteristiche comunali non disponibili.', en: 'Municipal characteristics are unavailable.' }
};
// Municipal material codes; the label always travels with the colour.
const MATERIAL_COLORS = { '01': '#3f7fb0', '02': '#7d5fa8', '03': '#c2703a', '04': '#4e8f63', '05': '#a9542f' };
const FALLBACK_COLOR = '#8a8f98';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function bridgeMaterialColor(record) {
  return MATERIAL_COLORS[String(record?.material?.code ?? '')] || FALLBACK_COLOR;
}

// One flat crescent per surveyed part, at survey scale, sitting just above the paving.
function partShapes(THREE, parts) {
  return parts.map(part => {
    const shape = new THREE.Shape((part[0] || []).map(([x, z]) => new THREE.Vector2(x, -z)));
    shape.holes = (part.slice(1) || []).map(ring => new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z))));
    return shape;
  });
}

export function installBridgeCharacteristics({ THREE, scene, pickText = value => typeof value === 'string' ? value : value.en,
  fetchData = url => fetch(url, { cache: 'no-store' }), url = 'data/enrichment-public/bridge-characteristics.json' }) {
  const materials = new Map();
  const records = new Map();
  let group = null, manifest = null, pending = null, disposed = false, visible = false, error = null;
  const t = key => pickText(BRIDGE_UI[key] || { ru: key, it: key, en: key });
  const label = value => value && typeof value === 'object' ? (value.label ?? value.code ?? null) : value;
  const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  function materialFor(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide,
      depthTest: false, depthWrite: false }));
    return materials.get(color);
  }
  function build(data) {
    const built = new THREE.Group();
    built.name = 'bridge-characteristics';
    for (const [gid, entry] of Object.entries(data.by_gid || {})) {
      // by_gid holds either the deck id itself or a reference object that names it.
      const deckId = typeof entry === 'string' ? entry : entry?.bridge_id ?? entry?.deck_id ?? entry?.id;
      const record = data.by_bridge_id?.[deckId];
      if (!record) continue;
      records.set(Number(gid), record);
      const parts = record.geometry_local;
      if (!Array.isArray(parts) || !parts.length) continue;
      const geometry = new THREE.ShapeGeometry(partShapes(THREE, parts));
      geometry.rotateX(-Math.PI / 2); geometry.translate(0, 26, 0);
      const mesh = new THREE.Mesh(geometry, materialFor(bridgeMaterialColor(record)));
      mesh.name = `bridge-characteristics:${gid}`;
      mesh.userData.gid = Number(gid);
      mesh.renderOrder = 29;
      built.add(mesh);
    }
    return built;
  }
  function sync() { if (group) group.visible = !disposed && visible; }
  async function load() {
    if (disposed || manifest) return manifest;
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetchData(url);
        if (!response.ok) throw new Error(`Bridge characteristics HTTP ${response.status}`);
        const data = await response.json();
        if (data.schema_version !== 1 || !data.by_bridge_id || !data.by_gid) throw new Error('Invalid bridge characteristics');
        if (disposed) return null;
        manifest = data; error = null;
        group = build(data); scene.add(group); sync();
      } catch (e) { error = e.message; }
      finally { pending = null; }
      return manifest;
    })();
    return pending;
  }
  // Rows for the map tip and for any host-rendered label; null when this bridge has no municipal record.
  function rows(gid) {
    const record = records.get(Number(gid));
    if (!record) return null;
    const size = [number(record.length_m), number(record.width_m)].filter(v => v !== null);
    return { material: label(record.material) || t('unknown'), purpose: label(record.purpose) || t('unknown'),
      type: label(record.type) || t('unknown'), size,
      colour: bridgeMaterialColor(record), method: record.dimensions_method || null };
  }
  function summary(gid) {
    const row = rows(gid);
    if (!row) return null;
    const dims = row.size.length === 2 ? `${row.size[0].toFixed(1)} × ${row.size[1].toFixed(1)} m` : '';
    return [row.material, row.purpose, row.type, dims].filter(Boolean).join(' · ');
  }
  return {
    load, rows, summary,
    get recordCount() { return records.size; },
    get manifest() { return manifest; }, get error() { return error; }, get overlays() { return group ? group.children : []; },
    setSourceVisible(source, next) { if (disposed) return; if (source !== 'bridges-tab') return; visible = !!next; if (visible) void load(); sync(); },
    setPicking() {},
    dispose() { disposed = true; if (group) { scene.remove(group); for (const mesh of group.children) mesh.geometry.dispose(); } group = null;
      for (const material of materials.values()) material.dispose(); materials.clear(); records.clear(); }
  };
}