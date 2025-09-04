// components/Map3D.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import './Map3D.css';

/** Sample data — replace with live values */
const BUILDING_DATA = {
  E1: { type: 'Academic', electricity: { value: 1820, unit: 'kWh', percent: 64, status: 'Normal' }, water: { value: 38.6, unit: 'm³', percent: 42, status: 'Normal' } },
  E2: { type: 'Academic', electricity: { value: 2115, unit: 'kWh', percent: 73, status: 'High' },  water: { value: 41.2, unit: 'm³', percent: 49, status: 'Normal' } },
  Library2: { type: 'Library', electricity: { value: 950, unit: 'kWh', percent: 35, status: 'Normal' }, water: { value: 22.3, unit: 'm³', percent: 27, status: 'Normal' } },
  Library3: { type: 'Library', electricity: { value: 1180, unit: 'kWh', percent: 44, status: 'Normal' }, water: { value: 25.9, unit: 'm³', percent: 31, status: 'Normal' } },
  Library4: { type: 'Library', electricity: { value: 1275, unit: 'kWh', percent: 47, status: 'Normal' }, water: { value: 28.1, unit: 'm³', percent: 34, status: 'Normal' } },
  Library5: { type: 'Library', electricity: { value: 1408, unit: 'kWh', percent: 52, status: 'Normal' }, water: { value: 29.7, unit: 'm³', percent: 36, status: 'Normal' } },
  AV: { type: 'Auditorium', electricity: { value: 2750, unit: 'kWh', percent: 88, status: 'High' }, water: { value: 58.2, unit: 'm³', percent: 69, status: 'High' } },
  'Exabation Hall': { type: 'Exhibition', electricity: { value: 1620, unit: 'kWh', percent: 58, status: 'Normal' }, water: { value: 33.4, unit: 'm³', percent: 38, status: 'Normal' } },
};

function baseKeyFrom(name) {
  if (!name) return null;
  const m1 = name.match(/^(E\d+)/i);
  if (m1) return m1[1];
  const m2 = name.match(/^(Library\d+)/i);
  if (m2) return m2[1];
  return BUILDING_DATA[name] ? name : name;
}

/** Camera fit helper */
function approachCameraToBox({
  camera,
  box,
  aspect,
  azimuthDeg = 0,
  offset = 6.6,
  proximity = 1.2,
  eyeAboveBaseFrac = 5.0,
  floorFrac = 0.0,
  animateMs = 1500,
  ensureForward = true,
}) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const fitH = (size.y / 2) / Math.tan(vFOV / 2);
  const fitW = (size.x / 2) / (Math.tan(vFOV / 2) * aspect);
  const fitDistance = offset * Math.max(fitH, fitW, size.z);

  const minDistance = Math.max(size.length() * 0.12, 3);
  const targetDistance = Math.max(minDistance, fitDistance * proximity);

  const az = THREE.MathUtils.degToRad(azimuthDeg);
  const dir = new THREE.Vector3(Math.sin(az), 0, Math.cos(az)).normalize();

  const baseY = box.min.y + size.y * floorFrac;
  const eyeY  = Math.max(baseY, box.min.y + size.y * eyeAboveBaseFrac);

  const targetPos = new THREE.Vector3().copy(center).add(dir.clone().multiplyScalar(targetDistance));
  targetPos.y = eyeY;

  if (ensureForward) {
    const currentDist = camera.position.clone().sub(center).length();
    if (currentDist <= targetDistance) {
      const farPos = new THREE.Vector3().copy(center).add(dir.clone().multiplyScalar(targetDistance * 2.2));
      farPos.y = eyeY;
      camera.position.copy(farPos);
    }
  }

  camera.near = Math.max(0.05, targetDistance / 300);
  camera.far  = Math.max(camera.far, targetDistance * 200);
  camera.updateProjectionMatrix();

  gsap.to(camera.position, {
    duration: animateMs / 1000,
    x: targetPos.x, y: targetPos.y, z: targetPos.z,
    ease: 'power2.out',
    onUpdate: () => camera.lookAt(center),
    onComplete: () => camera.lookAt(center),
  });
}

/** GLTF + ground detection */
function Model({ setOriginalColors, setInitialFocusBox, setGroundMeshes }) {
  const { scene } = useGLTF('/assets/final4.glb', true);
  const originalColors = useRef(new Map());

  scene.scale.set(0.1, 0.1, 0.1);
  scene.rotation.y = Math.PI / 2;
  scene.position.set(0, -10, 0);

  scene.traverse((child) => {
    if (child.isMesh) {
      if (!originalColors.current.has(child)) {
        originalColors.current.set(child, child.material.color.clone());
      }
      child.material = child.material.clone();
      child.userData.name = child.name;
    }
  });

  useEffect(() => {
    setOriginalColors && setOriginalColors(originalColors.current);
    scene.updateMatrixWorld(true);

    // Initial focus on (E1,E2)
    const matches = [];
    const startsWithE1orE2 = (name) =>
      !!name && (/^E1($|[^a-z0-9])/i.test(name) || /^E2($|[^a-z0-9])/i.test(name));
    scene.traverse((obj) => { if (startsWithE1orE2(obj.name)) matches.push(obj); });

    let targetBox = new THREE.Box3();
    if (matches.length) { matches.forEach((o) => targetBox.expandByObject(o)); }
    else {
      const e1 = scene.getObjectByName('E1');
      const e2 = scene.getObjectByName('E2');
      let foundAny = false;
      if (e1) { targetBox.expandByObject(e1); foundAny = true; }
      if (e2) { targetBox.expandByObject(e2); foundAny = true; }
      if (!foundAny) targetBox = new THREE.Box3().setFromObject(scene);
    }
    setInitialFocusBox && setInitialFocusBox(targetBox);

    // Detect likely ground meshes
    const groundNameRe = /(terrain|ground|gis|base|map|sat|earth)/i;
    const buildingLikeRe = /^(e\d|library|av|exabation|exhibition|hall|block|building)/i;
    const candidates = [];
    scene.traverse((obj) => {
      if (obj.isMesh) {
        try {
          const bbox = new THREE.Box3().setFromObject(obj);
          const size = bbox.getSize(new THREE.Vector3());
          const areaXZ = Math.max(0.0001, size.x * size.z);
          candidates.push({ mesh: obj, size, areaXZ });
        } catch {}
      }
    });

    const grounds = candidates
      .sort((a, b) => b.areaXZ - a.areaXZ)
      .filter((c) => {
        const n = (c.mesh.name || '').toLowerCase();
        const thin = c.size.y < 60;
        const isGroundName = groundNameRe.test(n);
        const isBuildingLike = buildingLikeRe.test(n);
        return !isBuildingLike && (isGroundName || thin);
      })
      .slice(0, 12)
      .map((c) => c.mesh);

    setGroundMeshes && setGroundMeshes(grounds);
  }, [scene, setOriginalColors, setInitialFocusBox, setGroundMeshes]);

  return <primitive object={scene} />;
}

/** Walk & Drone constants */
const WALK = { eyeHeight: 1.7, clearance: 0.25, stepMeters: 6, moveSpeed: 8 };
const DRONE = { raiseMin: 120, speed: 30 };
const ROTATE = { yaw: 1.8, pitch: 1.2 };

const Map3D = ({
  setPopupData,
  originalColors,
  resetColors,
  setResetColors,
  setOriginalColors,
  controllerCommand,
  mode = 'drone',
  stepNudge,
  stepNudgeTick,
}) => {
  const { camera, gl, scene, size } = useThree();
  const [initialFocusBox, setInitialFocusBox] = useState(null);
  const didFitRef = useRef(false);

  const [highlightedGroup, setHighlightedGroup] = useState(null);
  const savedColors = useRef(null);

  // Ground lock
  const groundMeshesRef = useRef([]);
  const groundRay = useRef(new THREE.Raycaster());
  const tmp = useRef(new THREE.Vector3());
  const DOWN = useRef(new THREE.Vector3(0, -1, 0));
  const sceneMinYRef = useRef(null);
  const lastGroundY = useRef(null);

  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});

  useEffect(() => { gl.toneMappingExposure = 1.25; }, [gl]);

  // Fallback scene floor
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const bb = new THREE.Box3().setFromObject(scene);
        sceneMinYRef.current = bb.min.y;
      } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [scene]);

  // Cursor hint in walk mode
  useEffect(() => {
    const el = gl.domElement;
    if (mode === 'walk') el.classList.add('walk-mode');
    else el.classList.remove('walk-mode');
    return () => el.classList.remove('walk-mode');
  }, [gl, mode]);

  // Adjust altitude when switching modes
  useEffect(() => {
    const origin = tmp.current.set(camera.position.x, 1e6, camera.position.z);
    groundRay.current.set(origin, DOWN.current);

    let groundY = (sceneMinYRef.current ?? 0);
    const grounds = groundMeshesRef.current;
    if (grounds?.length) {
      const hits = groundRay.current.intersectObjects(grounds, true);
      if (hits.length) groundY = hits[0].point.y;
    }
    lastGroundY.current = groundY;

    if (mode === 'walk') {
      const targetY = groundY + WALK.eyeHeight;
      gsap.to(camera.position, { y: targetY, duration: 0.35, ease: 'power2.out' });
    } else {
      const minDroneY = Math.max(groundY + DRONE.raiseMin, camera.position.y);
      gsap.to(camera.position, { y: minDroneY, duration: 0.5, ease: 'power2.out' });
    }
  }, [mode, camera]);

  // Mouse look (drag)
  useEffect(() => {
    let isDragging = false;
    let prev = { x: 0, y: 0 };
    const onDown = (e) => { isDragging = true; prev = { x: e.clientX, y: e.clientY }; };
    const onMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev = { x: e.clientX, y: e.clientY };
      camera.rotation.order = 'YXZ';
      camera.rotation.y -= dx * 0.002;
      camera.rotation.x -= dy * 0.002;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    };
    const onUp = () => { isDragging = false; };
    gl.domElement.addEventListener('mousedown', onDown);
    gl.domElement.addEventListener('mousemove', onMove);
    gl.domElement.addEventListener('mouseup', onUp);
    return () => {
      gl.domElement.removeEventListener('mousedown', onDown);
      gl.domElement.removeEventListener('mousemove', onMove);
      gl.domElement.removeEventListener('mouseup', onUp);
    };
  }, [camera, gl]);

  // Keys
  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true;
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
      if (e.code === 'Escape') {
        if (highlightedGroup) restoreGroupColors(highlightedGroup);
        setPopupData && setPopupData(null);
        setHighlightedGroup(null);
      }
    };
    const up = (e) => { keys.current[e.code] = false; };
    document.addEventListener('keydown', down, { passive: false });
    document.addEventListener('keyup', up);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
    };
  }, [highlightedGroup, setPopupData]);

  // Movement + ground lock + nudges
  const lastNudgeTick = useRef(-1);
  useFrame((_, delta) => {
    // Rotate with arrows
    const yawLeft  = keys.current['ArrowLeft']  ? 1 : 0;
    const yawRight = keys.current['ArrowRight'] ? 1 : 0;
    const pitchUp  = keys.current['ArrowUp']    ? 1 : 0;
    const pitchDn  = keys.current['ArrowDown']  ? 1 : 0;

    if (yawLeft || yawRight || pitchUp || pitchDn) {
      camera.rotation.order = 'YXZ';
      camera.rotation.y += (yawLeft - yawRight) * ROTATE.yaw * delta;
      camera.rotation.x -= (pitchUp - pitchDn) * ROTATE.pitch * delta;
      const HALF = Math.PI / 2;
      camera.rotation.x = Math.max(-HALF, Math.min(HALF, camera.rotation.x));
    }

    // WASD (+ Space/Shift in drone)
    const dir = direction.current.set(0, 0, 0);
    if (keys.current['KeyW']) dir.z -= 1;
    if (keys.current['KeyS']) dir.z += 1;
    if (keys.current['KeyA']) dir.x -= 1;
    if (keys.current['KeyD']) dir.x += 1;

    if (mode === 'drone') {
      if (keys.current['Space']) dir.y += 1;
      if (keys.current['ShiftLeft']) dir.y -= 1;
    }

    if (controllerCommand) {
      if (controllerCommand.moveForward) dir.z -= 1;
      if (controllerCommand.moveBackward) dir.z += 1;
      if (controllerCommand.moveLeft) dir.x -= 1;
      if (controllerCommand.moveRight) dir.x += 1;
      if (mode === 'drone') {
        if (controllerCommand.moveUp) dir.y += 1;
        if (controllerCommand.moveDown) dir.y -= 1;
      }
    }

    dir.normalize();
    const moveSpeed = (mode === 'drone') ? DRONE.speed : WALK.moveSpeed;

    const yawOnly = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    const horiz = new THREE.Vector3(dir.x, 0, dir.z).applyEuler(yawOnly);
    const vY = (mode === 'drone') ? dir.y : 0;
    camera.position.addScaledVector(new THREE.Vector3(horiz.x, vY, horiz.z), moveSpeed * delta);

    // Street-View button nudges (fixed forward/left/right)
    if (mode === 'walk' && stepNudge && stepNudgeTick !== lastNudgeTick.current) {
      lastNudgeTick.current = stepNudgeTick;
      const worldUp = new THREE.Vector3(0,1,0);
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(yawOnly).setY(0).normalize();
      const left = new THREE.Vector3().crossVectors(worldUp, forward).normalize(); // LEFT vector
      let stepDir = forward;
      if (stepNudge.dir === 'left')  stepDir = left;                  // left arrow = left
      if (stepNudge.dir === 'right') stepDir = left.clone().multiplyScalar(-1); // right arrow = -left (right)
      camera.position.addScaledVector(stepDir, WALK.stepMeters);
    }

    // Ground lock
    const origin = tmp.current.set(camera.position.x, 1e6, camera.position.z);
    groundRay.current.set(origin, new THREE.Vector3(0,-1,0));
    let groundY = (sceneMinYRef.current ?? 0);
    const grounds = groundMeshesRef.current;
    if (grounds?.length) {
      const hits = groundRay.current.intersectObjects(grounds, true);
      if (hits.length) groundY = hits[0].point.y;
    }
    lastGroundY.current = groundY;

    if (mode === 'walk') {
      const desired = groundY + WALK.eyeHeight;
      const t = 1 - Math.pow(0.0001, delta);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, desired, t);
    } else {
      const minY = groundY + WALK.clearance;
      if (camera.position.y < minY) camera.position.y = minY;
    }
  });

  // Seed + initial fit
  useEffect(() => {
    camera.position.set(480, 320, 480);
    camera.rotation.set(0, 0, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    if (initialFocusBox && !didFitRef.current) {
      const aspect = size.width / size.height;
      approachCameraToBox({
        camera,
        box: initialFocusBox,
        aspect,
        azimuthDeg: 0,
        offset: 6.6,
        proximity: 1.2,
        eyeAboveBaseFrac: 5.0,
        floorFrac: 0,
        animateMs: 1500,
        ensureForward: true,
      });
      didFitRef.current = true;
    }
  }, [initialFocusBox, camera, size]);

  // Helpers show/hide
  const showByNames = useCallback((names) => {
    names.forEach((name) => { const b = scene.getObjectByName(name); if (b) b.visible = true; });
  }, [scene]);
  const hideByNames = useCallback((names) => {
    names.forEach((name) => { const b = scene.getObjectByName(name); if (b) b.visible = false; });
  }, [scene]);

  const restoreCascadesForName = useCallback((n) => {
    if (!n) return;
    if (n === 'Library2') showByNames(['AV', 'Library5', 'Library4', 'Library3']);
    else if (n === 'Library3') showByNames(['AV', 'Library5', 'Library4']);
    else if (n === 'Library4') showByNames(['AV', 'Library5']);
    else if (n === 'Library5') showByNames(['AV']);
    else if (n === 'E1-4') showByNames(['E1']);
    else if (n === 'E1-3') showByNames(['E1', 'E1-4']);
    else if (n === 'E1-2') showByNames(['E1', 'E1-4', 'E1-3']);
    else if (n === 'E1-1') showByNames(['E1', 'E1-4', 'E1-3', 'E1-2']);
    else if (n === 'E1-G') showByNames(['E1', 'E1-4', 'E1-3', 'E1-2', 'E1-1']);
    else if (n === 'E2-4') showByNames(['E2']);
    else if (n === 'E2-3') showByNames(['E2', 'E2-4']);
    else if (n === 'E2-2') showByNames(['E2', 'E2-4', 'E2-3']);
    else if (n === 'E2-1') showByNames(['E2', 'E2-4', 'E2-3', 'E2-2']);
    else if (n === 'E2-G') showByNames(['E2', 'E2-4', 'E2-3', 'E2-2', 'E2-1']);
  }, [showByNames]);

  const restoreGroupColors = useCallback((group) => {
    if (!group || !savedColors.current) return;
    group.traverse((child) => {
      if (child.isMesh) {
        const orig = savedColors.current.get(child);
        if (orig) {
          gsap.killTweensOf(child.material.color);
          child.material.color.copy(orig);
        }
        if (child.name === 'ex_roof_1' || child.name === 'ex_roof_2') child.visible = true;
      }
    });
    restoreCascadesForName(group.userData.name);
  }, [restoreCascadesForName]);

  const highlightGroup = useCallback((group) => {
    group.traverse((child) => {
      if (child.isMesh) {
        gsap.killTweensOf(child.material.color);
        gsap.to(child.material.color, { r: 0, g: 0.28, b: 0.67, duration: 0.4, ease: 'power2.out' });
      }
      if (group.userData.name === 'Exabation Hall') {
        if (child.name === 'ex_roof_1' || child.name === 'ex_roof_2') child.visible = false;
      }
    });
  }, []);

  // Picking
  useEffect(() => {
    const onClick = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (!intersects.length) {
        if (highlightedGroup) restoreGroupColors(highlightedGroup);
        setPopupData && setPopupData(null);
        setHighlightedGroup(null);
        return;
      }

      const hit = intersects[0];
      const clickedObject = hit.object;
      if (!clickedObject.userData.name) return;

      let parentGroup = clickedObject.parent;
      while (parentGroup && !parentGroup.userData.name) parentGroup = parentGroup.parent;
      if (!parentGroup) return;

      if (highlightedGroup && highlightedGroup !== parentGroup) restoreGroupColors(highlightedGroup);
      if (highlightedGroup === parentGroup) return;

      setHighlightedGroup(parentGroup);
      highlightGroup(parentGroup);

      const n = parentGroup.userData.name;
      if (n === 'Library5') hideByNames(['AV']);
      if (n === 'Library4') hideByNames(['AV', 'Library5']);
      if (n === 'Library3') hideByNames(['AV', 'Library5', 'Library4']);
      if (n === 'Library2') hideByNames(['AV', 'Library5', 'Library4', 'Library3']);
      if (n === 'E1-4') hideByNames(['E1']);
      if (n === 'E1-3') hideByNames(['E1', 'E1-4']);
      if (n === 'E1-2') hideByNames(['E1', 'E1-4', 'E1-3']);
      if (n === 'E1-1') hideByNames(['E1', 'E1-4', 'E1-3', 'E1-2']);
      if (n === 'E1-G') hideByNames(['E1', 'E1-4', 'E1-3', 'E1-2', 'E1-1']);
      if (n === 'E2-4') hideByNames(['E2']);
      if (n === 'E2-3') hideByNames(['E2', 'E2-4']);
      if (n === 'E2-2') hideByNames(['E2', 'E2-4', 'E2-3']);
      if (n === 'E2-1') hideByNames(['E2', 'E2-4', 'E2-3', 'E2-2']);
      if (n === 'E2-G') hideByNames(['E2', 'E2-4', 'E2-3', 'E2-2', 'E2-1']);

      // Popup
      const box = new THREE.Box3().setFromObject(parentGroup);
      const center = box.getCenter(new THREE.Vector3());
      const rawName = parentGroup.userData.name;
      const key = baseKeyFrom(rawName);
      const info = BUILDING_DATA[key] || {
        type: 'Facility',
        electricity: { value: 0, unit: 'kWh', percent: 0, status: 'N/A' },
        water: { value: 0, unit: 'm³', percent: 0, status: 'N/A' },
      };

      setPopupData && setPopupData({
        name: rawName,
        type: info.type,
        world: { x: center.x, y: center.y, z: center.z },
        electricity: info.electricity,
        water: info.water,
      });
    };

    gl.domElement.addEventListener('click', onClick);
    return () => { gl.domElement.removeEventListener('click', onClick); };
  }, [camera, scene, gl, highlightedGroup, highlightGroup, setPopupData, hideByNames, restoreGroupColors]);

  // Respond to "close popup" from App: restore colors & hidden floors
  useEffect(() => {
    if (!resetColors) return;
    if (highlightedGroup) {
      restoreGroupColors(highlightedGroup);
      setHighlightedGroup(null);
    }
    setPopupData && setPopupData(null);
    setResetColors && setResetColors(false);
  }, [resetColors, highlightedGroup, restoreGroupColors, setPopupData, setResetColors]);

  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} />
      <directionalLight position={[-10, 20, -10]} intensity={1.5} />
      <hemisphereLight skyColor={new THREE.Color(0x87CEEB)} groundColor={new THREE.Color(0xffffff)} intensity={0.8} />
      <Model
        setOriginalColors={(map) => { savedColors.current = map; setOriginalColors && setOriginalColors(map); }}
        setInitialFocusBox={setInitialFocusBox}
        setGroundMeshes={(arr) => { groundMeshesRef.current = Array.isArray(arr) ? arr : []; }}
      />
    </>
  );
};

export default Map3D;

useGLTF.preload('/assets/final4.glb');
