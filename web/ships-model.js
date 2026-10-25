// Two GLB ships on Canale della Giudecca: draggable, with localStorage positions.
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const SHIPS = [
  { path: 'models/aleksandr_ship.glb', name: 'aleksandr', targetLength: 55, start: { x: -350, z: 500, rotY: -Math.PI * 0.35 } },
  { path: 'models/ship_r.glb', name: 'ship_r', targetLength: 40, start: { x: -150, z: 420, rotY: -Math.PI * 0.25 } },
];
const STORAGE_KEY = 'venice-ships-pos';
const WATER_Y = -0.35;

const loader = new GLTFLoader();

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
    const gltf = await new Promise((resolve, reject) => loader.load(cfg.path, resolve, undefined, reject));
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = cfg.targetLength / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);

    const group = new THREE.Group();
    group.userData.isVeniceShip = true;
    group.userData.shipName = cfg.name;
    const centre = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    model.position.sub(centre);
    model.position.y += WATER_Y - box.min.y * scale;
    group.add(model);

    const pos = stored[cfg.name] || cfg.start;
    group.position.set(pos.x, 0, pos.z);
    group.rotation.y = pos.rotY || cfg.start.rotY;
    scene.add(group);
    shipGroups.push(group);
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
