// Three lightweight GLB ships across Bacino San Marco and Giudecca: draggable, with localStorage positions.
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';
import { fetchBytes, preloadShips } from './startup-resources.js';
import { SHIP_ASSETS } from './ship-assets.js';

// Approved WGS84 centres (lon, lat), projected via EPSG:32633 from
// (12.3387, 45.4340): x = easting delta, z = negative northing delta.
// Mini: (12.3379, 45.4312), outside the Grand Canal mouth on the Bacino side.
// R: (12.3308, 45.4279), opposite Zattere, west of Punta della Dogana.
// Aleksandr: (12.3430, 45.4320), open Bacino between Riva and San Giorgio.
// Actual zero-rotation GLBs: Mini/Aleksandr length along Z, R along X.
const SHIPS = [
  { path: 'models/mini_pirate_ship_light_v2.glb', name: 'mini_pirate', targetLength: 50, start: { x: -72.877, z: 308.991, rotY: 0.35 }, rotFix: { x: 0, y: 0, z: 0 }, waterOffset: 0 },
  { path: 'models/ship_r_optimized_light_v2.glb', name: 'ship_r', targetLength: 56.25, start: { x: -640.420, z: 657.181, rotY: -0.22 }, rotFix: { x: 0, y: 0, z: 0 }, waterOffset: 0 },
  { path: 'models/aleksandr_optimized_light_v2.glb', name: 'aleksandr', targetLength: 75, start: { x: 328.987, z: 233.317, rotY: -Math.PI * 0.25 }, rotFix: { x: 0, y: 0, z: 0 }, waterOffset: 0 },
];
// Start the approved composition once for returning visitors; never erase
// their legacy venice-ships-pos data. Drag/save continues on this version.
const STORAGE_KEY = 'venice-ships-pos-v2';
const WATER_Y = -0.4;
const SHIP_Y_OFFSET = 0.0; // ships sit exactly on water surface

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const shipURL = cfg => SHIP_ASSETS[cfg.path.slice('models/'.length)];
preloadShips(SHIPS.map(shipURL));

function loadPositions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return {};
}

function savePositions(all) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}

export async function installShips(scene, camera, renderer, controls) {
  if (typeof window !== 'undefined') {
    window.__veniceShipsReady ??= { status: 'pending', loaded: 0, total: SHIPS.length, gpuPrepared: false, rendered: false };
    window.__veniceShipsLoaded = 0;
  }
  // The ships use PBR materials, the city shades itself; add lights for the ships only.
  if (!scene.userData.veniceShipLights) {
    // Standard PBR divides irradiance by pi. The atlas intentionally bypasses
    // sRGB output conversion; compensate with real lights, not emissive/unlit.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb6b8, 3.0));
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 2.5);
    sunLight.position.set(-0.55, 0.55, -0.62).multiplyScalar(400);
    scene.add(sunLight);
    scene.userData.veniceShipLights = true;
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y);
  let dragging = null; // { group, offset }
  const dom = renderer.domElement;
  const stored = loadPositions();

  function getPointer(e) {
    const rect = dom.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((cx - rect.left) / rect.width) * 2 - 1, y: -((cy - rect.top) / rect.height) * 2 + 1 };
  }

  function hitShip(p) {
    raycaster.setFromCamera(p, camera);
    const ships = scene.children.filter(c => c.userData.isVeniceShip);
    const hits = raycaster.intersectObjects(ships, true);
    return hits.length ? hits[0].object.parent || hits[0].object : null;
  }

  function findShipGroup(obj) {
    let cur = obj;
    while (cur) {
      if (cur.userData && cur.userData.isVeniceShip) return cur;
      cur = cur.parent;
    }
    return null;
  }

  function onDown(e) {
    const p = getPointer(e);
    const hitObj = hitShip(p);
    if (!hitObj) return;
    const group = findShipGroup(hitObj);
    if (!group) return;
    dragging = { group, offset: new THREE.Vector3() };
    controls.enabled = false;
    raycaster.setFromCamera(p, camera);
    const target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, target)) dragging.offset.copy(group.position).sub(target);
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const p = getPointer(e);
    raycaster.setFromCamera(p, camera);
    const target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, target)) {
      dragging.group.position.copy(target.add(dragging.offset));
      saveAll();
    }
    e.preventDefault();
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = null;
    controls.enabled = true;
  }

  function onWheel(e) {
    const p = getPointer(e);
    const hitObj = hitShip(p);
    if (!hitObj) return;
    const group = findShipGroup(hitObj);
    if (!group) return;
    group.rotation.y += Math.sign(e.deltaY) * 0.05;
    saveAll();
    e.preventDefault();
  }

  const shipGroups = [];
  function saveAll() {
    const all = {};
    shipGroups.forEach(g => {
      all[g.userData.shipName] = { x: g.position.x, z: g.position.z, rotY: g.rotation.y };
    });
    savePositions(all);
  }

  const failures = [];
  await Promise.all(SHIPS.map(async cfg => {
    try {
      const gltf = await loader.parseAsync(await fetchBytes(shipURL(cfg)), new URL('models/', document.baseURI).href);
      const model = gltf.scene;
      const origBox = new THREE.Box3().setFromObject(model);
      const origSize = origBox.getSize(new THREE.Vector3());
      const scale = cfg.targetLength / Math.max(origSize.x, origSize.y, origSize.z);
      model.scale.setScalar(scale);

      // Apply per-model orientation fix before computing final bbox.
      model.rotation.x = (cfg.rotFix?.x || 0);
      model.rotation.y = (cfg.rotFix?.y || 0);
      model.rotation.z = (cfg.rotFix?.z || 0);

      // Recompute bbox after scaling so the hull sits exactly on the water.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());

      const group = new THREE.Group();
      group.userData.isVeniceShip = true;
      group.userData.shipName = cfg.name;
      const centre = box.getCenter(new THREE.Vector3());
      // Center horizontally only. Keep the original vertical bounds consistent
      // with the keel-to-water correction (subtracting centre.y would sink it).
      model.position.x -= centre.x;
      model.position.z -= centre.z;
      model.position.y += WATER_Y - box.min.y + (cfg.waterOffset || 0);
      group.add(model);

      const pos = stored[cfg.name] || cfg.start;
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = pos.rotY || cfg.start.rotY;
      scene.add(group);
      shipGroups.push(group);
      if (typeof window !== 'undefined') window.__veniceShipsLoaded = shipGroups.length;
      console.log('ship loaded', cfg.name, 'size', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2), 'scale', scale.toFixed(2), 'pos', group.position.x, group.position.z);
    } catch (err) {
      console.warn('ship failed', cfg.name, err);
      failures.push(new Error(cfg.name + ': ' + (err?.message || String(err))));
    }
  }));
  if (failures.length) throw new AggregateError(failures, 'Ships failed: ' + failures.map(e => e.message).join('; '));

  // GLB decode is not GPU readiness. Prepare PBR programs with the real scene
  // lights and submit an actual frame before the atlas may reveal the ships.
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);
  const culling = [];
  shipGroups.forEach(group => group.traverse(object => {
    if (object.isMesh || object.isLine) {
      culling.push([object, object.frustumCulled]);
      object.frustumCulled = false;
    }
  }));
  try { renderer.render(scene, camera); }
  finally { culling.forEach(([object, original]) => { object.frustumCulled = original; }); }
  if (renderer.info.programs?.some(program => program.diagnostics?.runnable === false)) {
    throw new Error('Ship GPU shader compilation failed');
  }
  if (typeof window !== 'undefined') {
    window.__veniceShipsReady.gpuPrepared = true;
    window.__veniceShipsReady.rendered = true;
  }

  dom.addEventListener('mousedown', onDown, { passive: false });
  dom.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  return shipGroups;
}
