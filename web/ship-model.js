// Sailing ship from Sketchfab (CC BY 4.0, 3ddans) placed on the water as a draggable 3D object.
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const SHIP_PATH = 'models/Sailing_Ship.gltf';
const STORAGE_KEY = 'venice-ship-pos';
const TARGET_LENGTH = 35; // metres in the local Venetian frame
const WATER_Y = -0.35;    // just above the water mesh at y = -0.4

const loader = new GLTFLoader();
const shipGroup = new THREE.Group();
shipGroup.name = 'sailing-ship';

function loadStoredPosition(defaultPos) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return defaultPos;
}

function savePosition(pos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch (e) { /* ignore */ }
}

export async function installShip(scene, camera, renderer, controls) {
  const gltf = await new Promise((resolve, reject) => loader.load(SHIP_PATH, resolve, undefined, reject));
  const model = gltf.scene;

  // Centre and scale the ship to a realistic size for Venice's canals.
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = TARGET_LENGTH / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);

  const centre = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
  model.position.sub(centre); // pivot at the centre
  model.position.y += WATER_Y - box.min.y * scale; // keel at water level

  shipGroup.add(model);

  // Default placement: Canal Grande near its labelled centre.
  const start = loadStoredPosition({ x: -354, z: -340, rotY: Math.PI * 0.15 });
  shipGroup.position.set(start.x, 0, start.z);
  shipGroup.rotation.y = start.rotY || 0;
  scene.add(shipGroup);

  // Drag interaction: raycast against an invisible water plane.
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let dragging = false;
  let dragOffset = new THREE.Vector3();

  const dom = renderer.domElement;

  function getPointer(e) {
    const rect = dom.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((cx - rect.left) / rect.width) * 2 - 1, y: -((cy - rect.top) / rect.height) * 2 + 1 };
  }

  function hitShip(p) {
    raycaster.setFromCamera(p, camera);
    const hits = raycaster.intersectObject(shipGroup, true);
    return hits.length ? hits[0] : null;
  }

  function onDown(e) {
    const p = getPointer(e);
    const hit = hitShip(p);
    if (!hit) return;
    dragging = true;
    controls.enabled = false;
    raycaster.setFromCamera(p, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    dragOffset.copy(shipGroup.position).sub(target);
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const p = getPointer(e);
    raycaster.setFromCamera(p, camera);
    const target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, target)) {
      shipGroup.position.copy(target.add(dragOffset));
      savePosition({ x: shipGroup.position.x, z: shipGroup.position.z, rotY: shipGroup.rotation.y });
    }
    e.preventDefault();
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    controls.enabled = true;
  }

  function onWheel(e) {
    if (!hitShip(getPointer(e))) return;
    shipGroup.rotation.y += Math.sign(e.deltaY) * 0.05;
    savePosition({ x: shipGroup.position.x, z: shipGroup.position.z, rotY: shipGroup.rotation.y });
    e.preventDefault();
  }

  dom.addEventListener('mousedown', onDown, { passive: false });
  dom.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  return shipGroup;
}
