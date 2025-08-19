// components/Map3D.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
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

/** GLB loader + initial focus box (E1/E2 union; fallback whole scene) */
function Model({ setOriginalColors, setInitialFocusBox }) {
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
      child.material = child.material.clone(); // isolate materials
      child.userData.name = child.name;
    }
  });

  useEffect(() => {
    setOriginalColors(originalColors.current);
    scene.updateMatrixWorld(true);

    const matches = [];
    const startsWithE1orE2 = (name) =>
      !!name && (/^E1($|[^a-z0-9])/i.test(name) || /^E2($|[^a-z0-9])/i.test(name));
    scene.traverse((obj) => { if (startsWithE1orE2(obj.name)) matches.push(obj); });

    let targetBox = new THREE.Box3();
    if (matches.length) {
      matches.forEach((o) => targetBox.expandByObject(o));
    } else {
      const e1 = scene.getObjectByName('E1');
      const e2 = scene.getObjectByName('E2');
      let foundAny = false;
      if (e1) { targetBox.expandByObject(e1); foundAny = true; }
      if (e2) { targetBox.expandByObject(e2); foundAny = true; }
      if (!foundAny) targetBox = new THREE.Box3().setFromObject(scene);
    }
    setInitialFocusBox && setInitialFocusBox(targetBox);
  }, [scene, setOriginalColors, setInitialFocusBox]);

  return <primitive object={scene} />;
}

/** Initial camera fit (same behavior as your original) */
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
  theCenter: {
    // The label does nothing; it's just a visual anchor for readability
  }
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

const Map3D = ({ controllerCommand }) => {
  const { camera, gl, scene, size } = useThree();
  const [originalColors, setOriginalColors] = useState(null);
  const [initialFocusBox, setInitialFocusBox] = useState(null);
  const didFitRef = useRef(false);

  const [highlightedGroup, setHighlightedGroup] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});

  useEffect(() => { gl.toneMappingExposure = 1.25; }, [gl]);

  // Mouse look
  useEffect(() => {
    let isDragging = false;
    let previous = { x: 0, y: 0 };
    const onMouseDown = (e) => { isDragging = true; previous = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - previous.x;
      const dy = e.clientY - previous.y;
      previous = { x: e.clientX, y: e.clientY };
      const yaw = dx * 0.002;
      const pitch = dy * 0.002;
      camera.rotation.order = 'YXZ';
      camera.rotation.y -= yaw;
      camera.rotation.x -= pitch;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    };
    const onMouseUp = () => { isDragging = false; };
    gl.domElement.addEventListener('mousedown', onMouseDown);
    gl.domElement.addEventListener('mousemove', onMouseMove);
    gl.domElement.addEventListener('mouseup', onMouseUp);
    return () => {
      gl.domElement.removeEventListener('mousedown', onMouseDown);
      gl.domElement.removeEventListener('mousemove', onMouseMove);
      gl.domElement.removeEventListener('mouseup', onMouseUp);
    };
  }, [camera, gl]);

  // Keyboard
  useEffect(() => {
    const down = (e) => { keys.current[e.code] = true; };
    const up = (e) => { keys.current[e.code] = false; };
    const esc = (e) => { if (e.code === 'Escape') closePopup(); };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  // Movement (user only)
  useFrame((_, delta) => {
    direction.current.set(0, 0, 0);
    if (keys.current['KeyW']) direction.current.z -= 1;
    if (keys.current['KeyS']) direction.current.z += 1;
    if (keys.current['KeyA']) direction.current.x -= 1;
    if (keys.current['KeyD']) direction.current.x += 1;
    if (keys.current['Space']) direction.current.y += 1;
    if (keys.current['ShiftLeft']) direction.current.y -= 1;

    if (controllerCommand) {
      if (controllerCommand.moveForward) direction.current.z -= 1;
      if (controllerCommand.moveBackward) direction.current.z += 1;
      if (controllerCommand.moveLeft) direction.current.x -= 1;
      if (controllerCommand.moveRight) direction.current.x += 1;
    }

    direction.current.normalize();
    const moveSpeed = controllerCommand ? 30 : 10;
    const yawOnly = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    const horizontalDir = new THREE.Vector3(direction.current.x, 0, direction.current.z).applyEuler(yawOnly);
    horizontalDir.y = direction.current.y;
    camera.position.addScaledVector(horizontalDir, moveSpeed * delta);
  });

  // Seed + initial fit (original behavior)
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
    if (!group || !originalColors) return;
    group.traverse((child) => {
      if (child.isMesh) {
        const orig = originalColors.get(child);
        if (orig) {
          gsap.killTweensOf(child.material.color);
          child.material.color.copy(orig);
        }
        if (child.name === 'ex_roof_1' || child.name === 'ex_roof_2') child.visible = true;
      }
    });
  }, [originalColors]);

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

  const applyCascadingHides = useCallback((n) => {
    if (!n) return;
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
  }, [hideByNames]);

  const closePopup = useCallback(() => {
    if (highlightedGroup) {
      restoreGroupColors(highlightedGroup);
      restoreCascadesForName(highlightedGroup.userData?.name);
      setHighlightedGroup(null);
    }
    setPopupInfo(null);
  }, [highlightedGroup, restoreGroupColors, restoreCascadesForName]);

  // Picking (no camera change on click)
  useEffect(() => {
    const handleClick = (event) => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length === 0) return;

      const clickedObject = intersects[0].object;
      if (!clickedObject.userData.name) return;

      let parentGroup = clickedObject.parent;
      while (parentGroup && !parentGroup.userData.name) parentGroup = parentGroup.parent;
      if (!parentGroup) return;

      if (highlightedGroup && highlightedGroup !== parentGroup) {
        restoreGroupColors(highlightedGroup);
        restoreCascadesForName(highlightedGroup.userData?.name);
      }

      setHighlightedGroup(parentGroup);
      highlightGroup(parentGroup);
      applyCascadingHides(parentGroup.userData.name);

      const box = new THREE.Box3().setFromObject(parentGroup);
      const sizeV = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const topCenter = new THREE.Vector3(center.x, box.max.y + Math.max(sizeV.y * 0.06, 2), center.z);

      const rawName = parentGroup.userData.name;
      const key = baseKeyFrom(rawName);
      const info = BUILDING_DATA[key] || {
        type: 'Facility',
        electricity: { value: 0, unit: 'kWh', percent: 0, status: 'N/A' },
        water: { value: 0, unit: 'm³', percent: 0, status: 'N/A' },
      };

      setPopupInfo({
        name: rawName,
        type: info.type,
        pos: topCenter,
        world: { x: center.x, y: center.y, z: center.z },
        electricity: info.electricity,
        water: info.water,
      });
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [
    camera, scene, gl,
    highlightedGroup, restoreGroupColors, restoreCascadesForName,
    highlightGroup, applyCascadingHides,
  ]);

  const popupPosition = useMemo(
    () => (popupInfo?.pos ? [popupInfo.pos.x, popupInfo.pos.y, popupInfo.pos.z] : null),
    [popupInfo]
  );

  const clampPct = (n) => Math.max(0, Math.min(100, n || 0));

  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} />
      <directionalLight position={[-10, 20, -10]} intensity={1.5} />
      <hemisphereLight skyColor={new THREE.Color(0x87CEEB)} groundColor={new THREE.Color(0xffffff)} intensity={0.8} />

      <Model setOriginalColors={setOriginalColors} setInitialFocusBox={setInitialFocusBox} />

      {popupInfo && popupPosition && (
        <Html position={popupPosition} transform={false} pointerEvents="auto" className="map3d-html">
          <div className="map3d-popup scientific" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <div className="head-left">
                <div className="eyebrow">SMART CAMPUS · MFU</div>
                <div className="title">{popupInfo.name}</div>
                <div className="subtitle">{popupInfo.type}</div>
              </div>
              <button className="popup-close" aria-label="Close" onClick={closePopup}>×</button>
            </div>

            <div className="popup-body">
              <div className="location-card">
                <div className="loc-title">Location (World)</div>
                <div className="loc-grid">
                  <div className="kv"><div className="k">X</div><div className="v">{popupInfo.world.x.toFixed(2)}</div></div>
                  <div className="kv"><div className="k">Y</div><div className="v">{popupInfo.world.y.toFixed(2)}</div></div>
                  <div className="kv"><div className="k">Z</div><div className="v">{popupInfo.world.z.toFixed(2)}</div></div>
                </div>
              </div>

              <div className="metrics-grid">
                {/* Electricity */}
                <div className={`metric-card ${popupInfo.electricity.status === 'High' ? 'risk' : ''}`}>
                  <div className="metric-head">
                    <div className="metric-name"><span className="dot" />Electricity</div>
                    <span className={`badge ${String(popupInfo.electricity.status).toLowerCase()}`}>
                      {popupInfo.electricity.status}
                    </span>
                  </div>
                  <div className="metric-value"><span className="num">{popupInfo.electricity.value}</span><span className="unit">{popupInfo.electricity.unit}</span></div>
                  <div className="meter"><div className="bar" style={{ width: `${clampPct(popupInfo.electricity.percent)}%` }} /></div>
                  <div className="meter-labels"><span>0%</span><span>{clampPct(popupInfo.electricity.percent)}%</span><span>100%</span></div>
                </div>

                {/* Water */}
                <div className={`metric-card ${popupInfo.water.status === 'High' ? 'risk' : ''}`}>
                  <div className="metric-head">
                    <div className="metric-name"><span className="dot alt" />Water</div>
                    <span className={`badge ${String(popupInfo.water.status).toLowerCase()}`}>
                      {popupInfo.water.status}
                    </span>
                  </div>
                  <div className="metric-value"><span className="num">{popupInfo.water.value}</span><span className="unit">{popupInfo.water.unit}</span></div>
                  <div className="meter alt"><div className="bar" style={{ width: `${clampPct(popupInfo.water.percent)}%` }} /></div>
                  <div className="meter-labels"><span>0%</span><span>{clampPct(popupInfo.water.percent)}%</span><span>100%</span></div>
                </div>
              </div>

              <div className="popup-actions">
                <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); closePopup(); }}>Close</button>
              </div>
            </div>
          </div>
        </Html>
      )}
    </>
  );
};

export default Map3D;

useGLTF.preload('/assets/final4.glb');
