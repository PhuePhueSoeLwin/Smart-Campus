import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { SkyDome, RealCloudField, skyColorsByHour } from './CloudSky';
import RainMode from './RainMode';
import './Map3D.css';

function LightningFX({
  active = false,
  intensity = 0.8,
  exposureKick = 0.25,
  onFlash = () => {},
}) {
  const { camera, gl } = useThree();
  const dirRef = useRef();
  const ambRef = useRef();
  const targetRef = useRef();
  const flashRef = useRef(0);
  const nextTimeRef = useRef(0);
  const pulsesRef = useRef([]);
  const baseExposureRef = useRef(gl.toneMappingExposure);

  const schedule = (now) => {
    const t = THREE.MathUtils.clamp((intensity - 0.8) / 0.2, 0, 1);
    const minGap = THREE.MathUtils.lerp(2.8, 0.9, t);
    const maxGap = THREE.MathUtils.lerp(6.5, 2.2, t);
    const gap = THREE.MathUtils.lerp(minGap, maxGap, Math.random());
    const start = now + gap;

    const multi = Math.random() < (0.6 + 0.3 * t);
    const pulseDur = 0.10 + Math.random() * 0.12;
    const between = 0.06 + Math.random() * 0.14;

    const pulses = [{ start, end: start + pulseDur }];
    if (multi) {
      const s2 = start + pulseDur + between;
      pulses.push({ start: s2, end: s2 + pulseDur * (0.8 + Math.random() * 0.4) });
    }
    pulsesRef.current = pulses;
    nextTimeRef.current = start + 0.2 + (multi ? between + pulseDur : 0.0);
  };

  useFrame(({ clock }, dt) => {
    const now = clock.getElapsedTime();
    flashRef.current *= Math.pow(0.04, dt);

    if (!active) {
      onFlash(0);
      if (dirRef.current) dirRef.current.intensity = 0;
      if (ambRef.current) ambRef.current.intensity = 0;
      gl.toneMappingExposure = baseExposureRef.current;
      return;
    }

    if (pulsesRef.current.length === 0 && now > nextTimeRef.current) {
      schedule(now);
    }

    let inPulse = false;
    for (const p of pulsesRef.current) {
      if (now >= p.start && now <= p.end) { inPulse = true; break; }
    }
    pulsesRef.current = pulsesRef.current.filter((p) => now <= p.end + 0.02);

    if (inPulse) {
      const peak = THREE.MathUtils.lerp(0.7, 1.0, THREE.MathUtils.clamp((intensity - 0.8) / 0.2, 0, 1));
      flashRef.current = Math.max(flashRef.current, peak);
    }

    // place lightning somewhere around the camera
    const radius = 240 + Math.random() * 180;
    const a = now * 0.15 + Math.random() * 0.2;
    const lx = camera.position.x + Math.sin(a) * radius;
    const ly = camera.position.y + 380 + Math.random() * 60;
    const lz = camera.position.z + Math.cos(a) * radius;

    if (dirRef.current) {
      dirRef.current.position.set(lx, ly, lz);
      if (targetRef.current) {
        targetRef.current.position.copy(camera.position);
        dirRef.current.target = targetRef.current;
        dirRef.current.target.updateMatrixWorld();
      }
      dirRef.current.intensity = flashRef.current * THREE.MathUtils.lerp(14, 26, Math.random());
      dirRef.current.color.set("#D7E8FF");
    }
    if (ambRef.current) {
      ambRef.current.intensity = flashRef.current * 1.5;
      ambRef.current.color.set("#D7E8FF");
    }

    gl.toneMappingExposure =
      baseExposureRef.current + flashRef.current * exposureKick;

    onFlash(THREE.MathUtils.clamp(flashRef.current, 0, 1));
  });

  return (
    <>
      <directionalLight ref={dirRef} intensity={0} />
      <ambientLight ref={ambRef} intensity={0} />
      <object3D ref={targetRef} />
    </>
  );
}

/** ---------- Sample data ---------- */
const BUILDING_DATA = {
  E1: {
    type: 'Academic',
    electricity: { value: 1820, unit: 'kWh', percent: 64, status: 'Normal' },
    water: { value: 38.6, unit: 'm³', percent: 42, status: 'Normal' },
  },
  E2: {
    type: 'Academic',
    electricity: { value: 2115, unit: 'kWh', percent: 73, status: 'High' },
    water: { value: 41.2, unit: 'm³', percent: 49, status: 'Normal' },
  },
  Library2: {
    type: 'Library',
    electricity: { value: 950, unit: 'kWh', percent: 35, status: 'Normal' },
    water: { value: 22.3, unit: 'm³', percent: 27, status: 'Normal' },
  },
  Library3: {
    type: 'Library',
    electricity: { value: 1180, unit: 'kWh', percent: 44, status: 'Normal' },
    water: { value: 25.9, unit: 'm³', percent: 31, status: 'Normal' },
  },
  Library4: {
    type: 'Library',
    electricity: { value: 1275, unit: 'kWh', percent: 47, status: 'Normal' },
    water: { value: 28.1, unit: 'm³', percent: 34, status: 'Normal' },
  },
  Library5: {
    type: 'Library',
    electricity: { value: 1408, unit: 'kWh', percent: 52, status: 'Normal' },
    water: { value: 29.7, unit: 'm³', percent: 36, status: 'Normal' },
  },
  AV: {
    type: 'Library',
    electricity: { value: 1120, unit: 'kWh', percent: 39, status: 'Normal' },
    water: { value: 24.2, unit: 'm³', percent: 29, status: 'Normal' },
  },
  'Exabation Hall': {
    type: 'Exhibition',
    electricity: { value: 1620, unit: 'kWh', percent: 58, status: 'Normal' },
    water: { value: 33.4, unit: 'm³', percent: 38, status: 'Normal' },
  },
};

/** ---------- E1/E2/Library helpers ---------- */
const E1_CANON = ['E1', 'E1-1', 'E1-2', 'E1-3', 'E1-4', 'E1-G'];
const E1_FLOOR_ORDER = ['E1-G', 'E1-1', 'E1-2', 'E1-3', 'E1-4'];

const E2_CANON = ['E2', 'E2-1', 'E2-2', 'E2-3', 'E2-4', 'E2-G'];
const E2_FLOOR_ORDER = ['E2-G', 'E2-1', 'E2-2', 'E2-3', 'E2-4'];

/** Library building has NO parent "Library" node; only these floors */
const LIB_CANON = ['AV', 'Library2', 'Library3', 'Library4', 'Library5'];
const LIB_FLOOR_ORDER = ['AV', 'Library2', 'Library3', 'Library4', 'Library5'];

const canonE1 = (name = '') => {
  const s = String(name);
  for (const c of E1_CANON)
    if (new RegExp(`^${c}($|[^a-z0-9])`, 'i').test(s)) return c;
  const m = s.match(/^E1(?:-([1-4]|G))?/i);
  if (!m) return null;
  return m[1]
    ? `E1-${m[1].toUpperCase()}`.replace('E1-g', 'E1-G')
    : 'E1';
};

const canonE2 = (name = '') => {
  const s = String(name);
  for (const c of E2_CANON)
    if (new RegExp(`^${c}($|[^a-z0-9])`, 'i').test(s)) return c;
  const m = s.match(/^E2(?:-([1-4]|G))?/i);
  if (!m) return null;
  return m[1]
    ? `E2-${m[1].toUpperCase()}`.replace('E2-g', 'E2-G')
    : 'E2';
};

const canonLib = (name = '') => {
  const s = String(name);
  for (const c of LIB_CANON)
    if (new RegExp(`^${c}($|[^a-z0-9])`, 'i').test(s)) return c;
  return null;
};

function baseKeyFrom(name) {
  if (!name) return null;
  const m1 = name.match(/^(E\d+)/i);
  if (m1) return m1[1];
  const m2 = name.match(/^(Library\d+)/i);
  if (m2) return m2[1];
  if (/^AV($|[^a-z0-9])/i.test(name)) return 'AV';
  return BUILDING_DATA[name] ? name : name;
}

/** ---------- Initial fit helper ---------- */
function approachCameraToBox({
  camera,
  box,
  aspect,
  azimuthDeg = 0,
  offset = 6.6,
  proximity = 1.2,
  eyeAboveBaseFrac = 5.0,
  floorFrac = 0.0,
  animateMs = 0,
  ensureForward = false,
  immediate = true,
  onFinish = null,
  ease = 'power3.inOut',
  fovTarget = null,
  fovMs = null,
}) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const fitH = size.y / 2 / Math.tan(vFOV / 2);
  const fitW = size.x / 2 / (Math.tan(vFOV / 2) * aspect);
  const fitDistance = offset * Math.max(fitH, fitW, size.z);

  const minDistance = Math.max(size.length() * 0.12, 3);
  const targetDistance = Math.max(minDistance, fitDistance * proximity);

  const az = THREE.MathUtils.degToRad(azimuthDeg);
  const dir = new THREE.Vector3(Math.sin(az), 0, Math.cos(az)).normalize();

  const baseY = box.min.y + size.y * floorFrac;
  const eyeY = Math.max(baseY, box.min.y + size.y * eyeAboveBaseFrac);
  const targetPos = new THREE.Vector3()
    .copy(center)
    .add(dir.clone().multiplyScalar(targetDistance));
  targetPos.y = eyeY;

  camera.near = Math.max(0.05, targetDistance / 300);
  camera.far = Math.max(camera.far, targetDistance * 200);
  camera.updateProjectionMatrix();

  if (immediate || animateMs <= 0) {
    camera.position.copy(targetPos);
    camera.lookAt(center);
    if (typeof onFinish === 'function') onFinish();
    return;
  }

  gsap.to(camera.position, {
    duration: animateMs / 1000,
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    ease,
    onUpdate: () => camera.lookAt(center),
    onComplete: () => {
      camera.lookAt(center);
      if (typeof onFinish === 'function') onFinish();
    },
  });

  if (typeof fovTarget === 'number') {
    gsap.to(camera, {
      duration: (fovMs ?? animateMs) / 1000,
      fov: fovTarget,
      ease,
      onUpdate: () => camera.updateProjectionMatrix(),
    });
  }
}

/** ---------- GLTF + ground + E1/E2/Library tagging ---------- */
function Model({
  setOriginalColors,
  setInitialFocusBox,
  setGroundMeshes,
  setCollidableMeshes,
  setE1Index,
  setE2Index,
  setLibIndex,
}) {
  const { scene } = useGLTF('/assets/final4.30mb.glb', true);
  const originalColors = useRef(new Map());

  scene.scale.set(0.1, 0.1, 0.1);
  scene.rotation.y = Math.PI / 2;
  scene.position.set(0, -10, 0);

  // clone materials and capture base color
  scene.traverse((child) => {
    if (child.isMesh) {
      if (!originalColors.current.has(child)) {
        originalColors.current.set(
          child,
          child.material?.color?.clone?.() ?? new THREE.Color(1, 1, 1)
        );
      }
      child.material = child.material.clone();
      child.userData.name = child.name;
    } else {
      if (child.name && !child.userData.name) child.userData.name = child.name;
    }
  });

  useEffect(() => {
    setOriginalColors && setOriginalColors(originalColors.current);
    scene.updateMatrixWorld(true);

    const tagBuilding = (canonList, floorOrder, tagKey) => {
      const roots = new Map();
      for (const lab of canonList) {
        const node = scene.getObjectByName(lab);
        if (node) roots.set(lab, node);
      }
      for (const lab of (roots.size ? canonList : floorOrder)) {
        const node = scene.getObjectByName(lab);
        if (node)
          node.traverse((n) => {
            n.userData[`${tagKey.toLowerCase()}Tag`] = lab;
          });
      }
      const idx = new Map();
      for (const lab of canonList) idx.set(lab, new Set());
      for (const [lab, node] of roots) idx.get(lab).add(node);
      scene.traverse((n) => {
        const t = n.userData?.[`${tagKey.toLowerCase()}Tag`];
        if (t && idx.has(t) && idx.get(t).size === 0) idx.get(t).add(n);
      });
      return idx;
    };

    const e1Idx = tagBuilding(E1_CANON, E1_FLOOR_ORDER, 'E1');
    const e2Idx = tagBuilding(E2_CANON, E2_FLOOR_ORDER, 'E2');
    const libIdx = tagBuilding(LIB_CANON, LIB_FLOOR_ORDER, 'Library');

    setE1Index?.(e1Idx);
    setE2Index?.(e2Idx);
    setLibIndex?.(libIdx);

    /** Initial focus on (E1, E2) */
    const matches = [];
    const startsWithE1orE2 = (name) =>
      !!name &&
      (/^E1($|[^a-z0-9])/i.test(name) || /^E2($|[^a-z0-9])/i.test(name));
    scene.traverse((obj) => {
      if (startsWithE1orE2(obj.name)) matches.push(obj);
    });

    let targetBox = new THREE.Box3();
    if (matches.length) {
      matches.forEach((o) => targetBox.expandByObject(o));
    } else {
      const e1 = scene.getObjectByName('E1');
      const e2 = scene.getObjectByName('E2');
      let foundAny = false;
      if (e1) {
        targetBox.expandByObject(e1);
        foundAny = true;
      }
      if (e2) {
        targetBox.expandByObject(e2);
        foundAny = true;
      }
      if (!foundAny) targetBox = new THREE.Box3().setFromObject(scene);
    }
    setInitialFocusBox && setInitialFocusBox(targetBox);

    /** Detect ground meshes */
    const groundNameRe = /(terrain|ground|gis|base|map|sat|earth)/i;
    const buildingLikeRe =
      /^(e\d|library|av|exabation|exhibition|hall|block|building)/i;

    const candidates = [];
    const everyMesh = [];
    scene.traverse((obj) => {
      if (obj.isMesh) {
        try {
          const bbox = new THREE.Box3().setFromObject(obj);
          const size = bbox.getSize(new THREE.Vector3());
          const areaXZ = Math.max(0.0001, size.x * size.z);
          candidates.push({ mesh: obj, size, areaXZ });
          everyMesh.push(obj);
        } catch {
          everyMesh.push(obj);
        }
      }
    });

    // Ground meshes (also include “thin slabs”)
    const grounds = candidates
      .sort((a, b) => b.areaXZ - a.areaXZ)
      .filter((c) => {
        const n = (c.mesh.name || '').toLowerCase();
        const thin = c.size.y < 60;
        const isGroundName = groundNameRe.test(n);
        const isBuildingLike = buildingLikeRe.test(n);
        return !isBuildingLike && (isGroundName || thin);
      })
      .slice(0, 24)
      .map((c) => c.mesh);

    setGroundMeshes && setGroundMeshes(grounds);

    // Colliders = ALL meshes (buildings + props + ground)
    const colliders = everyMesh.slice();
    setCollidableMeshes && setCollidableMeshes(colliders);
  }, [
    scene,
    setOriginalColors,
    setInitialFocusBox,
    setGroundMeshes,
    setCollidableMeshes,
    setE1Index,
    setE2Index,
    setLibIndex,
  ]);

  return <primitive object={scene} />;
}

/** ---------- Original control constants ---------- */
const WALK = {
  eyeHeight: 1.7,
  clearance: 0.25,
  stepMetersDefault: 6,
  moveSpeed: 6,
};
const DRONE = { speed: 18, defaultY: 320 };
const ROTATE = { yaw: 1.0, pitch: 0.8 };
const SMOOTH = {
  accel: 5.0,
  rot: 8.0,
  mouseSens: 0.0013,
  nudgeMs: 240,
  yLock: 10.0,
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function dampFactor(kps, dt) {
  return 1 - Math.exp(-kps * dt);
}
function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

/** ---------- Main ---------- */
const Map3D = ({
  setPopupData,
  setOriginalColors,
  controllerCommand,
  mode = 'drone',
  stepNudge,
  stepNudgeTick,
  walkStepMeters = WALK.stepMetersDefault,
  walkVStepMeters = 2.6,
  walkStickToFloor = true,
  walkYTick = 0,
  walkYDir = null,
  popupOpen = false,
  restoreCameraTick = 0,

  envMode = 'realtime',
  envHour = 12,

  rainEnabled = false,
  rainIntensity = 0.5,
}) => {
  const { camera, gl, scene, size } = useThree();
  const [initialFocusBox, setInitialFocusBox] = useState(null);
  const didFitRef = useRef(false);
  const isolatedActiveRef = useRef(false);
  const visibilityBackupRef = useRef(new Map());
  const bgBackupRef = useRef(null);
  const BLACK = new THREE.Color(0x000000);
  const isolatedKeepSetRef = useRef(null);
  const currentIsolationKeyRef = useRef(null);
  const e1IndexRef = useRef(new Map());
  const e2IndexRef = useRef(new Map());
  const libIndexRef = useRef(new Map());
  const prevCamRef = useRef(null);
  const groundMeshesRef = useRef([]);
  const collidableMeshesRef = useRef([]);
  const groundRay = useRef(new THREE.Raycaster());
  const tmp = useRef(new THREE.Vector3());
  const DOWN = useRef(new THREE.Vector3(0, -1, 0));
  const sceneMinYRef = useRef(null);
  const velRef = useRef(new THREE.Vector3());
  const yawTargetRef = useRef(0);
  const pitchTargetRef = useRef(0);
  const suppressMoveUntilRef = useRef(0);
  const focusUntilRef = useRef(0);
  const nudgeTweenRef = useRef(null);
  const orbitTweenRef = useRef(null);
  const moveTweenRef = useRef(null);
  const fovTweenRef = useRef(null);
  const openingDroneYRef = useRef(null);
  const bootDoneRef = useRef(false);
  const baseExposureRef = useRef(1.15);
  useEffect(() => {
    gl.toneMappingExposure = baseExposureRef.current;
  }, [gl]);

  useFrame(() => {
    if (scene.fog) scene.fog = null;
  });

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const bb = new THREE.Box3().setFromObject(scene);
        sceneMinYRef.current = bb.min.y;
      } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [scene]);

  useEffect(() => {
    const el = gl.domElement;
    if (mode === 'walk') el.classList.add('walk-mode');
    else el.classList.remove('walk-mode');
    return () => el.classList.remove('walk-mode');
  }, [gl, mode]);

  useEffect(() => {
    let isDragging = false;
    let prev = { x: 0, y: 0 };
    const onDown = (e) => {
      isDragging = true;
      prev = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const curr = { x: e.clientX, y: e.clientY };
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      prev = curr;
      yawTargetRef.current -= dx * 0.0013;
      pitchTargetRef.current -= dy * 0.0013;
      const HALF = Math.PI / 2;
      pitchTargetRef.current = Math.max(
        -HALF,
        Math.min(HALF, pitchTargetRef.current)
      );
    };
    const onUp = () => {
      isDragging = false;
    };
    gl.domElement.addEventListener('mousedown', onDown);
    gl.domElement.addEventListener('mousemove', onMove);
    gl.domElement.addEventListener('mouseup', onUp);
    return () => {
      gl.domElement.removeEventListener('mousedown', onDown);
      gl.domElement.removeEventListener('mousemove', onMove);
      gl.domElement.removeEventListener('mouseup', onUp);
    };
  }, [gl]);

  /* ============ Touch look / pan / zoom ============ */
  useEffect(() => {
    const el = gl.domElement;
    let touchMode = null;
    let prevTouches = [];
    let prevDist = null;

    const avg = (arr) => {
      if (!arr.length) return { x: 0, y: 0 };
      let x = 0,
        y = 0;
      for (const t of arr) {
        x += t.x;
        y += t.y;
      }
      return { x: x / arr.length, y: y / arr.length };
    };
    const toPts = (touchList) =>
      Array.from(touchList).map((t) => ({ x: t.clientX, y: t.clientY }));

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchMode = 'rotate';
        prevTouches = toPts(e.touches);
      } else if (e.touches.length === 2) {
        touchMode = 'panzoom';
        prevTouches = toPts(e.touches);
        const [a, b] = prevTouches;
        prevDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };

    const onTouchMove = (e) => {
      if (touchMode === 'rotate' && e.touches.length === 1) {
        const curr = toPts(e.touches)[0];
        const prev = prevTouches[0];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        prevTouches = [curr];
        yawTargetRef.current -= dx * 0.0013 * 1.2;
        pitchTargetRef.current -= dy * 0.0013 * 1.2;
        const HALF = Math.PI / 2;
        pitchTargetRef.current = Math.max(-HALF, Math.min(HALF, pitchTargetRef.current));
      } else if (touchMode === 'panzoom' && e.touches.length === 2) {
        e.preventDefault();
        const currTouches = toPts(e.touches);
        const [a, b] = currTouches;
        const centerPrev = avg(prevTouches);
        const centerCurr = avg(currTouches);

        const yawOnly = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
        const right = new THREE.Vector3(1, 0, 0).applyEuler(yawOnly);
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(yawOnly);

        const panScale = 0.02 * (mode === 'drone' ? 1 : 0.3);
        camera.position.addScaledVector(right, -(centerCurr.x - centerPrev.x) * panScale);

        if (mode === 'drone') {
          const altScale = 0.05;
          camera.position.y += -(centerCurr.y - centerPrev.y) * altScale * -1;
        }

        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const dd = dist - (prevDist ?? dist);
        const zoomScale = 0.04;
        camera.position.addScaledVector(forward, -dd * zoomScale);

        prevTouches = currTouches;
        prevDist = dist;
      }
    };

    const onTouchEnd = () => {
      touchMode = null;
      prevTouches = [];
      prevDist = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [gl, camera, mode]);

  /* ============ Keyboard ============ */
  const keys = useRef({});
  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code))
        e.preventDefault();
      if (e.code === 'Escape') {
        restoreIsolation();
        if (prevCamRef.current) restoreCameraSmooth();
        setPopupData && setPopupData(null);
      }
    };
    const up = (e) => {
      keys.current[e.code] = false;
    };
    document.addEventListener('keydown', down, { passive: false });
    document.addEventListener('keyup', up);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
    };
  }, [setPopupData]);

  const boxFromObjects = (objs) => {
    const box = new THREE.Box3();
    let init = false;
    for (const o of objs) {
      try {
        if (!init) {
          box.setFromObject(o);
          init = true;
        } else {
          box.expandByObject(o);
        }
      } catch {}
    }
    if (!init) box.makeEmpty();
    return box;
  };

  const buildKeepSetWithAncestors = (objs) => {
    const keep = new Set();
    for (const obj of objs) {
      if (!obj) continue;
      obj.traverse((n) => keep.add(n));
      let p = obj.parent;
      while (p) {
        keep.add(p);
        p = p.parent;
      }
    }
    return keep;
  };

  const isIsolated = () => isolatedActiveRef.current === true;

  const setVisibleDeep = (obj, flag) => {
    if (!obj) return;
    obj.traverse((n) => {
      if ('visible' in n) n.visible = flag;
    });
  };
  const setVisibleDeepSet = (setNodes, flag) => {
    if (!setNodes) return;
    for (const root of setNodes) setVisibleDeep(root, flag);
  };

  const forceVisibleUpAndDown = (node) => {
    if (!node) return;
    let p = node;
    while (p) {
      if ('visible' in p) p.visible = true;
      p = p.parent;
    }
    setVisibleDeep(node, true);
  };
  const forceVisibleSetUpAndDown = (setNodes) => {
    if (!setNodes) return;
    for (const root of setNodes) forceVisibleUpAndDown(root);
  };

  const isolateWithObjects = useCallback(
    (objs, keyForThis = null) => {
      if (!objs?.length) return;

      if (!isIsolated()) bgBackupRef.current = scene.background ?? null;
      scene.background = BLACK.clone();

      if (!isIsolated()) visibilityBackupRef.current.clear();
      scene.traverse((obj) => {
        if (obj.isLight) return;
        if (!isIsolated()) visibilityBackupRef.current.set(obj, obj.visible);
        obj.visible = false;
      });

      const keep = buildKeepSetWithAncestors(objs);
      keep.forEach((node) => {
        if (node && node.visible !== undefined) node.visible = true;
      });

      isolatedActiveRef.current = true;
      isolatedKeepSetRef.current = keep;
      currentIsolationKeyRef.current = keyForThis ?? null;
    },
    [scene]
  );

  const restoreIsolation = useCallback(() => {
    if (!isIsolated()) return;

    scene.background = bgBackupRef.current ?? null;
    bgBackupRef.current = null;

    if (visibilityBackupRef.current.size) {
      visibilityBackupRef.current.forEach((wasVisible, obj) => {
        if (obj && obj.visible !== undefined) obj.visible = wasVisible;
      });
      visibilityBackupRef.current.clear();
    }

    isolatedActiveRef.current = false;
    isolatedKeepSetRef.current = null;
    currentIsolationKeyRef.current = null;
  }, [scene]);

  const focusAndOrbitCamera = useCallback(
    (objs) => {
      if (!objs?.length) return;

      if (!prevCamRef.current) {
        prevCamRef.current = {
          pos: camera.position.clone(),
          rot: new THREE.Euler(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z,
            'YXZ'
          ),
          fov: camera.fov,
        };
      }

      const box = boxFromObjects(objs);
      const center = box.getCenter(new THREE.Vector3());
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);

      const fovTarget = 42;
      const fovRad = THREE.MathUtils.degToRad(fovTarget);
      const padding = 1.18;
      const radius = Math.max(6, (sphere.radius * padding) / Math.sin(fovRad / 2));

      const elevDeg = 40;
      const elevRad = THREE.MathUtils.degToRad(elevDeg);
      const startYaw = camera.rotation.y;
      const startAngle = startYaw;
      const endAngle = startAngle + Math.PI * 2;

      const posFromAngle = (ang) => {
        const rHoriz = radius * Math.cos(elevRad);
        const x = center.x + rHoriz * Math.sin(ang);
        const z = center.z + rHoriz * Math.cos(ang);
        const y = center.y + radius * Math.sin(elevRad);
        return new THREE.Vector3(x, y, z);
      };

      const startPos = posFromAngle(startAngle);

      camera.near = Math.max(0.05, radius / 300);
      camera.far = Math.max(camera.far, radius * 200);
      camera.updateProjectionMatrix();

      if (orbitTweenRef.current) orbitTweenRef.current.kill();
      if (moveTweenRef.current) moveTweenRef.current.kill();
      if (fovTweenRef.current) fovTweenRef.current.kill();

      const flyMs = 700;
      const orbitMs = 2500;

      const now = performance.now();
      focusUntilRef.current = now + flyMs + orbitMs + 160;

      moveTweenRef.current = gsap.to(camera.position, {
        duration: flyMs / 1000,
        x: startPos.x,
        y: startPos.y,
        z: startPos.z,
        ease: 'power3.inOut',
        onUpdate: () => camera.lookAt(center),
        onComplete: () => {
          camera.lookAt(center);
        },
      });

      fovTweenRef.current = gsap.to(camera, {
        duration: flyMs / 1000,
        fov: fovTarget,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
      });

      const angleProxy = { a: startAngle };
      orbitTweenRef.current = gsap.to(angleProxy, {
        duration: orbitMs / 1000,
        a: endAngle,
        ease: 'power0.none',
        delay: flyMs / 1000,
        onUpdate: () => {
          const p = posFromAngle(angleProxy.a);
          camera.position.set(p.x, p.y, p.z);
          camera.lookAt(center);
        },
        onComplete: () => {
          orbitTweenRef.current = null;
          yawTargetRef.current = camera.rotation.y;
          pitchTargetRef.current = camera.rotation.x;
        },
      });
    },
    [camera]
  );

  useFrame((_, delta) => {
    const now = performance.now();
    const locked = now < focusUntilRef.current;

    if (!locked) {
      const yawLeft = keys.current['ArrowLeft'] ? 1 : 0;
      const yawRight = keys.current['ArrowRight'] ? 1 : 0;
      const pitchUp = keys.current['ArrowUp'] ? 1 : 0;
      const pitchDn = keys.current['ArrowDown'] ? 1 : 0;

      if (yawLeft || yawRight || pitchUp || pitchDn) {
        yawTargetRef.current += (yawLeft - yawRight) * ROTATE.yaw * delta;
        pitchTargetRef.current -= (pitchUp - pitchDn) * ROTATE.pitch * delta;
        const HALF = Math.PI / 2;
        pitchTargetRef.current = Math.max(-HALF, Math.min(HALF, pitchTargetRef.current));
      }

      const tRot = dampFactor(SMOOTH.rot, delta);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = lerpAngle(camera.rotation.y, yawTargetRef.current, tRot);
      camera.rotation.x = lerp(camera.rotation.x, pitchTargetRef.current, tRot);
      camera.rotation.z = 0;
    }

    const wish = new THREE.Vector3(0, 0, 0);
    if (keys.current['KeyW']) wish.z -= 1;
    if (keys.current['KeyS']) wish.z += 1;
    if (keys.current['KeyA']) wish.x -= 1;
    if (keys.current['KeyD']) wish.x += 1;

    if (mode === 'drone') {
      if (keys.current['Space']) wish.y += 1;
      if (keys.current['ShiftLeft'] || keys.current['ShiftRight']) wish.y -= 1;
    }

    if (controllerCommand) {
      if (controllerCommand.moveForward) wish.z -= 1;
      if (controllerCommand.moveBackward) wish.z += 1;
      if (controllerCommand.moveLeft) wish.x -= 1;
      if (controllerCommand.moveRight) wish.x += 1;
      if (mode === 'drone') {
        if (controllerCommand.moveUp) wish.y += 1;
        if (controllerCommand.moveDown) wish.y -= 1;
      }
    }

    wish.normalize();
    const maxSpeed = mode === 'drone' ? DRONE.speed : WALK.moveSpeed;

    const yawOnly = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    const worldHoriz = new THREE.Vector3(wish.x, 0, wish.z).applyEuler(yawOnly);
    const desiredVel = new THREE.Vector3(
      worldHoriz.x * maxSpeed,
      mode === 'drone' ? wish.y * maxSpeed : 0,
      worldHoriz.z * maxSpeed
    );

    const tAcc = dampFactor(SMOOTH.accel, delta);
    velRef.current.lerp(desiredVel, tAcc);

    if (now > suppressMoveUntilRef.current && !locked) {
      camera.position.addScaledVector(velRef.current, delta);
    }

    const origin = tmp.current.set(camera.position.x, 1e6, camera.position.z);
    groundRay.current.set(origin, new THREE.Vector3(0, -1, 0));
    let groundY = sceneMinYRef.current ?? 0;
    const grounds = groundMeshesRef.current;
    if (grounds?.length) {
      const hits = groundRay.current.intersectObjects(grounds, true);
      if (hits.length) groundY = hits[0].point.y;
    }
    if (mode !== 'walk') {
      const minY = groundY + WALK.clearance;
      if (camera.position.y < minY) camera.position.y = minY;
    }
  });

  useLayoutEffect(() => {
    if (initialFocusBox && !didFitRef.current) {
      const aspect = size.width / size.height;
      approachCameraToBox({
        camera,
        box: initialFocusBox,
        aspect,
        animateMs: 0,
        immediate: true,
        ensureForward: false,
        onFinish: () => {
          yawTargetRef.current = camera.rotation.y;
          pitchTargetRef.current = camera.rotation.x;
          openingDroneYRef.current = camera.position.y;
          bootDoneRef.current = true;
        },
      });
      didFitRef.current = true;
    }
  }, [initialFocusBox, camera, size]);

  useEffect(() => {
    if (!bootDoneRef.current) return;
    const origin = tmp.current.set(camera.position.x, 1e6, camera.position.z);
    groundRay.current.set(origin, DOWN.current);

    let groundY = sceneMinYRef.current ?? 0;
    const grounds = groundMeshesRef.current;
    if (grounds?.length) {
      const hits = groundRay.current.intersectObjects(grounds, true);
      if (hits.length) groundY = hits[0].point.y;
    }

    if (mode === 'walk') {
      gsap.to(camera.position, {
        y: groundY + WALK.eyeHeight,
        duration: 0.35,
        ease: 'power2.out',
      });
    } else {
      const wantY = openingDroneYRef.current ?? DRONE.defaultY;
      const safeY = Math.max(groundY + WALK.clearance, wantY);
      gsap.to(camera.position, { y: safeY, duration: 0.45, ease: 'power2.out' });
    }
  }, [mode, camera]);

  const applyFloorFilter = useCallback(
    (buildingKey, clickedLabel) => {
      if (!isIsolated() || currentIsolationKeyRef.current !== buildingKey) return;

      if (orbitTweenRef.current) {
        orbitTweenRef.current.kill();
        orbitTweenRef.current = null;
      }
      if (moveTweenRef.current) {
        moveTweenRef.current.kill();
        moveTweenRef.current = null;
      }
      if (fovTweenRef.current) {
        fovTweenRef.current.kill();
        fovTweenRef.current = null;
      }
      focusUntilRef.current = 0;

      let idxRef = null,
        CANON = [],
        FLOORS = [];
      if (buildingKey === 'E1') {
        idxRef = e1IndexRef;
        CANON = E1_CANON;
        FLOORS = E1_FLOOR_ORDER;
      } else if (buildingKey === 'E2') {
        idxRef = e2IndexRef;
        CANON = E2_CANON;
        FLOORS = E2_FLOOR_ORDER;
      } else if (buildingKey === 'Library') {
        idxRef = libIndexRef;
        CANON = LIB_CANON;
        FLOORS = LIB_FLOOR_ORDER;
      } else return;

      const get = (k) => idxRef.current.get(k);
      for (const k of CANON) setVisibleDeepSet(get(k), false);

      if (buildingKey === 'Library') {
        if (clickedLabel === 'Library5') {
          setVisibleDeepSet(get('Library5'), true);
          setVisibleDeepSet(get('Library4'), true);
          setVisibleDeepSet(get('Library3'), true);
          setVisibleDeepSet(get('Library2'), true);
        } else if (clickedLabel === 'Library4') {
          setVisibleDeepSet(get('Library4'), true);
          setVisibleDeepSet(get('Library3'), true);
          setVisibleDeepSet(get('Library2'), true);
        } else if (clickedLabel === 'Library3') {
          setVisibleDeepSet(get('Library3'), true);
          setVisibleDeepSet(get('Library2'), true);
        } else if (clickedLabel === 'Library2') {
          setVisibleDeepSet(get('Library2'), true);
        } else if (clickedLabel === 'AV') {
          setVisibleDeepSet(get('AV'), true);
        }
      } else {
        if (clickedLabel === buildingKey) {
          for (const nm of FLOORS) setVisibleDeepSet(get(nm), true);
        } else if (clickedLabel.endsWith('-G')) {
          setVisibleDeepSet(get(`${buildingKey}-G`), true);
        } else {
          const idx = FLOORS.indexOf(clickedLabel);
          FLOORS.forEach((nm, i) => {
            if (i <= idx) setVisibleDeepSet(get(nm), true);
          });
        }
      }

      let infoKey = clickedLabel;
      if (buildingKey === 'E1' || buildingKey === 'E2') infoKey = buildingKey;
      else if (buildingKey === 'Library') {
        if (!BUILDING_DATA[infoKey]) infoKey = 'Library5';
      }

      const info =
        BUILDING_DATA[infoKey] || {
          type: 'Facility',
          electricity: { value: 0, unit: 'kWh', percent: 0, status: 'N/A' },
          water: { value: 0, unit: 'm³', percent: 0, status: 'N/A' },
        };

      setPopupData?.({
        name: clickedLabel,
        type: buildingKey === 'Library' ? 'Library' : info?.type || 'Academic',
        world: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        electricity: info?.electricity,
        water: info?.water,
      });
    },
    [setPopupData, camera]
  );

  const resolveLabelFromNode = (node) => {
    let p = node;
    while (p) {
      if (p.userData?.e1Tag) return p.userData.e1Tag;
      if (p.userData?.e2Tag) return p.userData.e2Tag;
      if (p.userData?.libraryTag) return p.userData.libraryTag;
      const n = p.userData?.name || p.name || '';
      const c1 = canonE1(n);
      if (c1) return c1;
      const c2 = canonE2(n);
      if (c2) return c2;
      const c3 = canonLib(n);
      if (c3) return c3;
      p = p.parent;
    }
    return null;
  };

  const groundNameRe = /(terrain|ground|gis|base|map|sat|earth)/i;
  const isGroundNode = (node) => {
    let p = node;
    const grounds = groundMeshesRef.current || [];
    while (p) {
      if (grounds.includes(p)) return true;
      const nm = (p.userData?.name || p.name || '').toLowerCase();
      if (groundNameRe.test(nm)) return true;
      p = p.parent;
    }
    return false;
  };

  useEffect(() => {
    const onClick = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const allHits = raycaster.intersectObjects(scene.children, true);
      const intersects = allHits.filter((h) => !isGroundNode(h.object));

      if (isIsolated()) {
        if (!intersects.length) {
          event.preventDefault();
          if (typeof event.stopPropagation === 'function') event.stopPropagation();
          return;
        }

        const key = currentIsolationKeyRef.current;
        if (key === 'E1' || key === 'E2' || key === 'Library') {
          const lab = resolveLabelFromNode(intersects[0].object);
          if (
            !lab ||
            (key === 'Library'
              ? !(lab === 'AV' || /^Library[2345]$/.test(lab))
              : !lab.startsWith(key))
          ) {
            event.preventDefault();
            if (typeof event.stopPropagation === 'function') event.stopPropagation();
            return;
          }
          applyFloorFilter(key, lab);
          return;
        }
        return;
      }
      if (!intersects.length) return;

      const hit = intersects[0];
      const label = resolveLabelFromNode(hit.object);

      if (label && label.startsWith('E1')) {
        const allRoots = [];
        for (const k of E1_CANON) {
          const setNodes = e1IndexRef.current.get(k);
          if (setNodes && setNodes.size) setNodes.forEach((n) => allRoots.push(n));
        }
        isolateWithObjects(allRoots, 'E1');
        for (const k of E1_CANON) {
          const setNodes = e1IndexRef.current.get(k);
          if (setNodes && setNodes.size) setNodes.forEach((n) => (n.visible = true));
        }
        focusAndOrbitCamera(allRoots);

        const b = new THREE.Box3();
        allRoots.forEach((o) => b.expandByObject(o));
        const c = b.getCenter(new THREE.Vector3());
        setPopupData?.({
          name: 'E1 Building',
          type: BUILDING_DATA.E1.type,
          world: { x: c.x, y: c.y, z: c.z },
          electricity: BUILDING_DATA.E1.electricity,
          water: BUILDING_DATA.E1.water,
        });
        return;
      }

      if (label && label.startsWith('E2')) {
        const allRoots = [];
        for (const k of E2_CANON) {
          const setNodes = e2IndexRef.current.get(k);
          if (setNodes && setNodes.size) setNodes.forEach((n) => allRoots.push(n));
        }
        isolateWithObjects(allRoots, 'E2');
        for (const k of E2_CANON) {
          const setNodes = e2IndexRef.current.get(k);
          if (setNodes && setNodes.size) setNodes.forEach((n) => (n.visible = true));
        }
        focusAndOrbitCamera(allRoots);

        const b = new THREE.Box3();
        allRoots.forEach((o) => b.expandByObject(o));
        const c = b.getCenter(new THREE.Vector3());
        setPopupData?.({
          name: 'E2 Building',
          type: BUILDING_DATA.E2.type,
          world: { x: c.x, y: c.y, z: c.z },
          electricity: BUILDING_DATA.E2.electricity,
          water: BUILDING_DATA.E2.water,
        });
        return;
      }

      if (label && (label === 'AV' || /^Library[2345]$/.test(label))) {
        const allRoots = [];
        for (const k of LIB_CANON) {
          const setNodes = libIndexRef.current.get(k);
          if (setNodes && setNodes.size) setNodes.forEach((n) => allRoots.push(n));
        }
        isolateWithObjects(allRoots, 'Library');
        for (const k of LIB_CANON) {
          const setNodes = libIndexRef.current.get(k);
          if (setNodes && setNodes.size) setNodes.forEach((n) => (n.visible = true));
        }
        focusAndOrbitCamera(allRoots);

        const b = new THREE.Box3();
        allRoots.forEach((o) => b.expandByObject(o));
        const c = b.getCenter(new THREE.Vector3());
        const infoKey = BUILDING_DATA[label] ? label : 'Library5';
        const info = BUILDING_DATA[infoKey] || BUILDING_DATA['Library5'];
        setPopupData?.({
          name: 'Library Building',
          type: 'Library',
          world: { x: c.x, y: c.y, z: c.z },
          electricity: info.electricity,
          water: info.water,
        });
        return;
      }

      let clickedObject = hit.object;
      if (!clickedObject.userData.name) return;

      let parentGroup = clickedObject.parent;
      while (parentGroup && !parentGroup.userData.name) parentGroup = parentGroup.parent;
      if (!parentGroup) return;

      const selectionKey = baseKeyFrom(parentGroup.userData.name) || parentGroup.userData.name;

      isolateWithObjects([parentGroup], selectionKey);
      focusAndOrbitCamera([parentGroup]);

      const box = new THREE.Box3().setFromObject(parentGroup);
      const center = box.getCenter(new THREE.Vector3());
      const info =
        BUILDING_DATA[selectionKey] || {
          type: 'Facility',
          electricity: { value: 0, unit: 'kWh', percent: 0, status: 'N/A' },
          water: { value: 0, unit: 'm³', percent: 0, status: 'N/A' },
        };

      setPopupData?.({
        name: parentGroup.userData.name,
        type: info.type,
        world: { x: center.x, y: center.y, z: center.z },
        electricity: info.electricity,
        water: info.water,
      });
    };

    gl.domElement.addEventListener('click', onClick, true);
    return () => gl.domElement.removeEventListener('click', onClick, true);
  }, [
    camera,
    scene,
    gl,
    setPopupData,
    isolateWithObjects,
    focusAndOrbitCamera,
    applyFloorFilter,
  ]);

  useEffect(() => {
    const restoreAllFor = (key) => {
      let idxRef = null,
        order = [];
      if (key === 'E1') {
        idxRef = e1IndexRef;
        order = ['E1', 'E1-4', 'E1-3', 'E1-2', 'E1-1', 'E1-G'];
      } else if (key === 'E2') {
        idxRef = e2IndexRef;
        order = ['E2', 'E2-4', 'E2-3', 'E2-2', 'E2-1', 'E2-G'];
      } else if (key === 'Library') {
        idxRef = libIndexRef;
        order = ['Library5', 'Library4', 'Library3', 'Library2', 'AV'];
      } else return;

      order.forEach((k) => {
        const setNodes = idxRef.current.get(k);
        if (setNodes && setNodes.size) forceVisibleSetUpAndDown(setNodes);
      });

      let info = null;
      if (key === 'Library') info = BUILDING_DATA['Library5'];
      else info = BUILDING_DATA[key];

      setPopupData?.({
        name: `${key} Building`,
        type: key === 'Library' ? 'Library' : info?.type || 'Academic',
        world: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        electricity:
          (info && info.electricity) || { value: 0, unit: 'kWh', percent: 0, status: 'N/A' },
        water: (info && info.water) || { value: 0, unit: 'm³', percent: 0, status: 'N/A' },
      });
    };

    const onReturnE1Origin = () => {
      if (!isIsolated() || currentIsolationKeyRef.current !== 'E1') return;
      restoreAllFor('E1');
    };
    const onReturnE2Origin = () => {
      if (!isIsolated() || currentIsolationKeyRef.current !== 'E2') return;
      restoreAllFor('E2');
    };
    const onReturnLibraryOrigin = () => {
      if (!isIsolated() || currentIsolationKeyRef.current !== 'Library') return;
      restoreAllFor('Library');
    };

    window.addEventListener('mfu:returnE1Origin', onReturnE1Origin);
    window.addEventListener('mfu:returnE2Origin', onReturnE2Origin);
    window.addEventListener('mfu:returnLibraryOrigin', onReturnLibraryOrigin);
    return () => {
      window.removeEventListener('mfu:returnE1Origin', onReturnE1Origin);
      window.removeEventListener('mfu:returnE2Origin', onReturnE2Origin);
      window.removeEventListener('mfu:returnLibraryOrigin', onReturnLibraryOrigin);
    };
  }, [camera, setPopupData]);

  const wasPopupOpenRef = useRef(false);
  useEffect(() => {
    const was = wasPopupOpenRef.current;
    if (was && !popupOpen) {
      restoreIsolation();
      restoreCameraSmooth();
    }
    wasPopupOpenRef.current = popupOpen;
  }, [popupOpen, restoreIsolation]);

  const lastRestoreTick = useRef(restoreCameraTick);
  useEffect(() => {
    if (restoreCameraTick !== lastRestoreTick.current) {
      lastRestoreTick.current = restoreCameraTick;
      restoreIsolation();
      restoreCameraSmooth();
    }
  }, [restoreCameraTick]);

  const restoreCameraSmooth = useCallback(() => {
    const snap = prevCamRef.current;
    if (!snap) return;

    if (orbitTweenRef.current) orbitTweenRef.current.kill();
    if (moveTweenRef.current) moveTweenRef.current.kill();
    if (fovTweenRef.current) fovTweenRef.current.kill();

    const duration = 1.2;
    const ease = 'power3.inOut';
    const now = performance.now();
    focusUntilRef.current = now + duration * 1000 + 80;

    gsap.to(camera.position, { duration, x: snap.pos.x, y: snap.pos.y, z: snap.pos.z, ease });
    gsap.to(camera, {
      duration,
      fov: snap.fov,
      ease,
      onUpdate: () => camera.updateProjectionMatrix(),
      onComplete: () => {
        prevCamRef.current = null;
      },
    });

    gsap.to(yawTargetRef, { duration, current: snap.rot.y, ease });
    gsap.to(pitchTargetRef, {
      duration,
      current: snap.rot.x,
      ease,
      onComplete: () => {
        camera.rotation.order = 'YXZ';
        camera.rotation.y = snap.rot.y;
        camera.rotation.x = snap.rot.x;
        camera.rotation.z = 0;
      },
    });
  }, [camera]);

  const rainFactor = useMemo(
    () => (rainEnabled ? Math.max(0.05, Math.min(1, rainIntensity)) : 0),
    [rainEnabled, rainIntensity]
  );

  const ambRef = useRef();
  const dir1Ref = useRef();
  const dir2Ref = useRef();
  const hemiRef = useRef();
  useEffect(() => {
    const cols = skyColorsByHour(envHour, rainFactor, 0);
    if (hemiRef.current) {
      hemiRef.current.color = cols.top.clone();
      hemiRef.current.groundColor = cols.bottom.clone();
      const night = envHour >= 19 || envHour < 6;
      hemiRef.current.intensity = (night ? 0.45 : 0.85) * (1.0 - 0.25 * rainFactor);
    }
    if (ambRef.current) {
      const night = envHour >= 19 || envHour < 6;
      ambRef.current.intensity = (night ? 0.7 : 1.0) * (1.0 - 0.2 * rainFactor);
    }
    if (dir1Ref.current) {
      dir1Ref.current.intensity = (envHour >= 19 || envHour < 6 ? 0.5 : 1.4) * (1.0 - 0.35 * rainFactor);
      dir1Ref.current.color = cols.sunTint.clone();
    }
    if (dir2Ref.current) {
      dir2Ref.current.intensity = (envHour >= 19 || envHour < 6 ? 0.4 : 1.0) * (1.0 - 0.3 * rainFactor);
      dir2Ref.current.color = cols.haze.clone();
    }
  }, [envHour, rainFactor]);

  const [lightningFlash, setLightningFlash] = useState(0);

  const rainWind = useMemo(() => new THREE.Vector2(2.2, -0.9), []);

  const sampleGroundY = useCallback((x, z) => {
    let groundY = sceneMinYRef.current ?? 0;
    const origin = tmp.current.set(x, 1e6, z);
    groundRay.current.set(origin, DOWN.current);
    const grounds = groundMeshesRef.current;
    if (grounds?.length) {
      const hits = groundRay.current.intersectObjects(grounds, true);
      if (hits.length) groundY = hits[0].point.y;
    }
    return groundY;
  }, []);

  const doWalkNudge = useCallback((dir, meters) => {
    if (mode !== 'walk') return;
    if (!['forward', 'left', 'right'].includes(dir)) return;

    if (nudgeTweenRef.current) nudgeTweenRef.current.kill();

    const yawOnly = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(yawOnly);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(yawOnly);
    const left = right.clone().multiplyScalar(-1);

    let moveVec = new THREE.Vector3();
    if (dir === 'forward') moveVec.copy(forward);
    else if (dir === 'left') moveVec.copy(left);
    else if (dir === 'right') moveVec.copy(right);
    moveVec.multiplyScalar(meters);

    const start = camera.position.clone();
    const targetXZ = start.clone().add(moveVec);

    let targetY = start.y;
    if (walkStickToFloor) {
      const gy = sampleGroundY(targetXZ.x, targetXZ.z);
      targetY = gy + WALK.eyeHeight;
    }

    const duration = SMOOTH.nudgeMs / 1000;
    const now = performance.now();
    suppressMoveUntilRef.current = now + SMOOTH.nudgeMs + 40;

    yawTargetRef.current = camera.rotation.y;
    pitchTargetRef.current = camera.rotation.x;

    nudgeTweenRef.current = gsap.to(camera.position, {
      duration,
      x: targetXZ.x,
      y: targetY,
      z: targetXZ.z,
      ease: 'power2.out',
      onComplete: () => { nudgeTweenRef.current = null; }
    });
  }, [camera, mode, walkStickToFloor, sampleGroundY]);

  const lastNudgeTickRef = useRef(0);
  useEffect(() => {
    if (stepNudgeTick === lastNudgeTickRef.current) return;
    lastNudgeTickRef.current = stepNudgeTick;
    if (!stepNudge || !stepNudge.dir) return;
    doWalkNudge(stepNudge.dir, walkStepMeters);
  }, [stepNudgeTick, stepNudge, walkStepMeters, doWalkNudge]);

  const lastWalkYTickRef = useRef(0);
  useEffect(() => {
    if (walkYTick === lastWalkYTickRef.current) return;
    lastWalkYTickRef.current = walkYTick;
    if (mode !== 'walk') return;
    if (walkStickToFloor) return;
    if (!walkYDir) return;

    if (nudgeTweenRef.current) nudgeTweenRef.current.kill();

    const deltaY = (walkYDir === 'up' ? 1 : -1) * walkVStepMeters;
    const duration = SMOOTH.nudgeMs / 1000;

    const now = performance.now();
    suppressMoveUntilRef.current = now + SMOOTH.nudgeMs + 40;

    nudgeTweenRef.current = gsap.to(camera.position, {
      duration,
      y: camera.position.y + deltaY,
      ease: 'power2.out',
      onComplete: () => { nudgeTweenRef.current = null; }
    });
  }, [walkYTick, walkYDir, walkVStepMeters, walkStickToFloor, mode, camera]);

  return (
    <>
      <SkyDome hour={envHour} rainFactor={rainFactor} lightningFlash={lightningFlash} />
      <RealCloudField hour={envHour} rainFactor={rainFactor} lightningFlash={lightningFlash} />
      <ambientLight ref={ambRef} intensity={1.0} />
      <directionalLight ref={dir1Ref} position={[10, 300, 150]} intensity={1.4} />
      <directionalLight ref={dir2Ref} position={[-120, 240, -180]} intensity={1.0} />
      <hemisphereLight ref={hemiRef} intensity={0.8} />
      <Model
        setOriginalColors={setOriginalColors}
        setInitialFocusBox={setInitialFocusBox}
        setGroundMeshes={(arr) => {
          groundMeshesRef.current = Array.isArray(arr) ? arr : [];
        }}
        setCollidableMeshes={(arr) => {
          collidableMeshesRef.current = Array.isArray(arr) ? arr : [];
        }}
        setE1Index={(idx) => {
          e1IndexRef.current = idx instanceof Map ? idx : new Map();
        }}
        setE2Index={(idx) => {
          e2IndexRef.current = idx instanceof Map ? idx : new Map();
        }}
        setLibIndex={(idx) => {
          libIndexRef.current = idx instanceof Map ? idx : new Map();
        }}
      />
      <RainMode
        enabled={rainEnabled}
        intensity={rainIntensity}
        hour={envHour}
        wind={rainWind}
        colliders={collidableMeshesRef.current}
      />
      <LightningFX
        active={rainEnabled && rainIntensity >= 0.8}
        intensity={rainIntensity}
        onFlash={(f) => setLightningFlash(f)}
      />
    </>
  );
};

export default Map3D;

useGLTF.preload('/assets/final4.30mb.glb');
