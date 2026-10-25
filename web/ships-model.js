// Two GLB ships on Canale della Giudecca: draggable, with localStorage positions.
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';

const SHIPS = [
  { path: 'models/mini_pirate_ship.glb', name: 'mini_pirate', targetLength: 50, start: { x: -200, z: 200, rotY: -Math.PI * 0.35 } },
  { path: 'models/ship_r_optimized.glb', name: 'ship_r', targetLength: 45, start: { x: -280, z: 260, rotY: -Math.PI * 0.45 } },
  { path: 'models/aleksandr_optimized.glb', name: 'aleksandr', targetLength: 60, start: { x: -120, z: 140, rotY: -Math.PI * 0.25 } },
];
const STORAGE_KEY = 'venice-ships-pos';
const WATER_Y = -0.4;
const SHIP_Y_OFFSET = 0.0; // ships sit exactly on water surface

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

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
  // The ships use PBR materials, the city shades itself; add lights for the ships only.
  if (!scene.userData.veniceShipLights) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb6b8, 0.85));
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 0.7);
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

  for (const cfg of SHIPS) {
    try {
      const gltf = await new Promise((resolve, reject) => loader.load(cfg.path, resolve, undefined, reject));
      const model = gltf.scene;
      const origBox = new THREE.Box3().setFromObject(model);
      const origSize = origBox.getSize(new THREE.Vector3());
      const scale = cfg.targetLength / Math.max(origSize.x, origSize.y, origSize.z);
      model.scale.setScalar(scale);

      // Recompute bbox after scaling so the hull sits exactly on the water.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());

      const group = new THREE.Group();
      group.userData.isVeniceShip = true;
      group.userData.shipName = cfg.name;
      const centre = box.getCenter(new THREE.Vector3());
      model.position.sub(centre);
      model.position.y += WATER_Y - box.min.y + SHIP_Y_OFFSET;
      group.add(model);

      const pos = stored[cfg.name] || cfg.start;
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = pos.rotY || cfg.start.rotY;
      scene.add(group);
      shipGroups.push(group);
      console.log('ship loaded', cfg.name, 'size', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2), 'scale', scale.toFixed(2), 'pos', group.position.x, group.position.z);
    } catch (err) {
      console.warn('ship failed', cfg.name, err);
    }
  }

  dom.addEventListener('mousedown', onDown, { passive: false });
  dom.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  if (typeof window !== 'undefined') window.__veniceShipsLoaded = shipGroups.length;
  return shipGroups;
}
