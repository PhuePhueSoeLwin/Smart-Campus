// components/RainMode.js
import React, { useMemo, useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * RainMode
 * - Default export only (no named exports)
 * - Props:
 *    enabled   : boolean
 *    intensity : 0..1
 *    hour      : 0..23
 *    wind      : THREE.Vector2 (x,z slant)
 *    colliders : THREE.Object3D[] (meshes to raycast for splashes)
 */

function RainLayer({ enabled=false, intensity=0.6, hour=12, wind=new THREE.Vector2(2.0,-1.0) }) {
  const { camera } = useThree();

  const DPR = typeof window !== 'undefined'
    ? Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    : 1;

  const AREA_RADIUS = 520;
  const INNER_RADIUS = 18;
  const AREA_HEIGHT = 560;
  const BASE_SPEED = 92;

  const STREAK_COUNT = useMemo(() => {
    // Reduced bounds to cut memory while keeping visual rain density
    const min = 1200, max = 6000;
    const t = Math.pow(THREE.MathUtils.clamp(intensity,0,1), 0.9);
    const target = Math.floor(THREE.MathUtils.lerp(min, max, t) / DPR);
    return Math.max(min, target);
  }, [intensity, DPR]);

  const { uniforms, mesh } = useMemo(() => {
    const unit = new THREE.PlaneGeometry(1, 1).toNonIndexed();
    const g = new THREE.InstancedBufferGeometry();
    g.index = null;
    g.attributes.position = unit.attributes.position;
    g.attributes.uv = unit.attributes.uv;

    const offsetXZ = new Float32Array(STREAK_COUNT * 2);
    const yPhase   = new Float32Array(STREAK_COUNT);
    const speedRnd = new Float32Array(STREAK_COUNT);
    const lenRnd   = new Float32Array(STREAK_COUNT);
    const widRnd   = new Float32Array(STREAK_COUNT);
    const seedA    = new Float32Array(STREAK_COUNT);
    const seedB    = new Float32Array(STREAK_COUNT);

    const rng = (i) => {
      const s = Math.sin(i * 12.9898) * 43758.5453;
      return s - Math.floor(s);
    };

    for (let i=0;i<STREAK_COUNT;i++){
      const a = rng(i * 3.1) * Math.PI * 2.0;
      const rin = INNER_RADIUS / AREA_RADIUS;
      const r01 = Math.sqrt(rng(i * 5.7));
      const r = THREE.MathUtils.lerp(rin, 1.0, r01);
      offsetXZ[i*2+0] = Math.cos(a) * r;
      offsetXZ[i*2+1] = Math.sin(a) * r;

      yPhase[i]   = rng(i * 7.3);
      speedRnd[i] = rng(i * 9.9);
      lenRnd[i]   = rng(i * 11.1);
      widRnd[i]   = rng(i * 13.7);
      seedA[i]    = rng(i * 15.5);
      seedB[i]    = rng(i * 17.2);
    }

    g.setAttribute('iOffsetXZ', new THREE.InstancedBufferAttribute(offsetXZ, 2));
    g.setAttribute('iYPhase',   new THREE.InstancedBufferAttribute(yPhase,   1));
    g.setAttribute('iSpeedRnd', new THREE.InstancedBufferAttribute(speedRnd, 1));
    g.setAttribute('iLenRnd',   new THREE.InstancedBufferAttribute(lenRnd,   1));
    g.setAttribute('iWidRnd',   new THREE.InstancedBufferAttribute(widRnd,   1));
    g.setAttribute('iSeedA',    new THREE.InstancedBufferAttribute(seedA,    1));
    g.setAttribute('iSeedB',    new THREE.InstancedBufferAttribute(seedB,    1));
    g.instanceCount = STREAK_COUNT;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0,0,0), 8000);

    const u = {
      uTime:        { value: 0 },
      uOrigin:      { value: new THREE.Vector3() },
      uRadius:      { value: AREA_RADIUS },
      uInnerRadius: { value: INNER_RADIUS },
      uHeight:      { value: AREA_HEIGHT },
      uBaseSpeed:   { value: BASE_SPEED },
      uWind:        { value: wind.clone() },
      uIntensity:   { value: THREE.MathUtils.clamp(intensity, 0, 1) },
      uDPR:         { value: DPR },
      uAlphaBoost:  { value: 1.0 },
    };

    const vert = /* glsl */`
      attribute vec2  iOffsetXZ;
      attribute float iYPhase;
      attribute float iSpeedRnd;
      attribute float iLenRnd;
      attribute float iWidRnd;
      attribute float iSeedA;
      attribute float iSeedB;

      uniform float uTime;
      uniform vec3  uOrigin;
      uniform float uRadius;
      uniform float uHeight;
      uniform float uBaseSpeed;
      uniform vec2  uWind;
      uniform float uIntensity;

      varying float vAlpha;
      varying float vCore;

      vec3 downDir(vec2 w) {
        vec3 d = normalize(vec3(w.x, -9.8, w.y));
        return (d.y > 0.0) ? -d : d;
      }

      void main() {
        vec3 dir = downDir(uWind);
        vec3 side = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
        if (length(side) < 0.01) side = normalize(cross(dir, vec3(1.0, 0.0, 0.0)));

        vec2 disk = iOffsetXZ * uRadius;
        float bandCenter = uOrigin.y + uHeight * 0.35;
        float baseY = bandCenter + (iSeedB - 0.5) * uHeight;
        vec3 basePos = vec3(uOrigin.x + disk.x, baseY, uOrigin.z + disk.y);

        float speed = uBaseSpeed * mix(0.78, 1.25, iSpeedRnd) * (0.55 + uIntensity * 1.05);
        float L = mix(11.0, 28.0, iLenRnd) * (0.66 + uIntensity * 0.9);
        float W = mix(0.6, 1.3, iWidRnd)  * (0.6  + uIntensity * 0.8);

        float prog = mod(uTime * speed + iYPhase * uHeight, uHeight);
        float along = prog - (uHeight * 0.5);

        vec2 q = position.xy;
        vec3 world = basePos
                   + dir  * (q.y * L + along)
                   + side * (q.x * W);

        vCore  = 1.0 - smoothstep(0.0, 0.8, abs(q.x));
        vAlpha = mix(0.6, 1.0, iSeedA) * (0.5 + uIntensity * 0.65);

        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }
    `;

    const frag = /* glsl */`
      precision mediump float;
      varying float vAlpha;
      varying float vCore;
      uniform float uAlphaBoost;

      void main() {
        float alpha = vAlpha * 0.85 * uAlphaBoost;
        if (alpha < 0.03) discard;
        vec3 col = mix(vec3(0.72,0.79,0.88), vec3(0.86,0.91,0.96), vCore);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
    mat.uniforms = u;

    const mesh = new THREE.Mesh(g, mat);
    mesh.frustumCulled = false;
    return { uniforms: u, mesh };
  }, [STREAK_COUNT, AREA_RADIUS, AREA_HEIGHT, INNER_RADIUS, DPR, intensity, wind]);

  useFrame((_, dt) => {
    if (!enabled) return;
    uniforms.uTime.value += dt;
    uniforms.uOrigin.value.copy(camera.position);

    const stormBoost = hour >= 14 && hour <= 19 ? 1.12 : 1.0;
    uniforms.uWind.value.set(wind.x * stormBoost, wind.y * stormBoost);

    uniforms.uAlphaBoost.value = THREE.MathUtils.lerp(
      uniforms.uAlphaBoost.value,
      enabled ? 1.0 : 0.0,
      0.2
    );
  });

  if (!enabled) return null;
  return <primitive object={mesh} />;
}

function RainSplashes({ enabled=false, intensity=0.6, hour=12, wind=new THREE.Vector2(2.0,-1.0), colliders=[] }) {
  const { camera } = useThree();
  const meshRef = useRef(null);
  const rayRef = useRef(new THREE.Raycaster());
  const tmpV = useRef(new THREE.Vector3());
  const tmpQ = useRef(new THREE.Quaternion());
  const tmpM = useRef(new THREE.Matrix4());

  const MAX_SPLASHES = 600;
  const SPAWN_PER_FRAME_BASE = 10;
  const AREA_RADIUS = 140;

  const agesRef = useRef(new Float32Array(MAX_SPLASHES));
  const lifeRef = useRef(new Float32Array(MAX_SPLASHES));
  const activeRef = useRef(new Uint8Array(MAX_SPLASHES));
  const posRef = useRef(Array.from({ length: MAX_SPLASHES }, () => new THREE.Vector3()));
  const nrmRef = useRef(Array.from({ length: MAX_SPLASHES }, () => new THREE.Vector3(0, 1, 0)));
  const scaleRef = useRef(new Float32Array(MAX_SPLASHES));
  const cursorRef = useRef(0);

  const geom = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`
      attribute float aAge;
      varying float vAlpha;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        float t = clamp(aAge, 0.0, 1.0);
        float s = mix(0.35, 1.6, smoothstep(0.0, 1.0, t));
        vec3 p = position * s;
        vAlpha = (1.0 - smoothstep(0.65, 1.0, t)) * 0.6;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      precision mediump float;
      varying float vAlpha;
      varying vec2 vUv;
      void main() {
        vec2 d = vUv - 0.5;
        float r = length(d) * 2.0;
        float ring = smoothstep(0.15, 0.0, r) * (1.0 - smoothstep(0.7, 1.0, r));
        float a = vAlpha * ring;
        if (a < 0.02) discard;
        gl_FragColor = vec4(0.85, 0.9, 1.0, a);
      }
    `,
  }), []);
  const aAgeAttr = useMemo(
    () => new THREE.InstancedBufferAttribute(new Float32Array(MAX_SPLASHES), 1),
    []
  );

  useEffect(() => {
    if (!meshRef.current) return;
    const g = meshRef.current.geometry;
    g.setAttribute('aAge', aAgeAttr);
    meshRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    g.attributes.aAge.needsUpdate = true;

    rayRef.current.near = 0.01;
    rayRef.current.far  = 5000;
    rayRef.current.params.Mesh = { threshold: 0.001 };
  }, [aAgeAttr]);

  const getRainDir = () => {
    const d = new THREE.Vector3(wind.x, -9.8, wind.y).normalize();
    if (d.y > 0) d.multiplyScalar(-1);
    return d;
  };

  const spawnSplash = (pt, normal) => {
    const i = cursorRef.current;
    cursorRef.current = (i + 1) % MAX_SPLASHES;

    activeRef.current[i] = 1;
    agesRef.current[i] = 0;
    lifeRef.current[i] = THREE.MathUtils.randFloat(0.6, 1.2);
    posRef.current[i].copy(pt);
    nrmRef.current[i].copy(normal).normalize();
    scaleRef.current[i] = THREE.MathUtils.randFloat(0.6, 1.1);
  };

  useFrame((_, dt) => {
    if (!enabled || !meshRef.current) return;

    const inst = meshRef.current;

    for (let i = 0; i < MAX_SPLASHES; i++) {
      if (!activeRef.current[i]) continue;
      agesRef.current[i] += dt;
      const t = agesRef.current[i] / lifeRef.current[i];
      aAgeAttr.setX(i, t);

      if (t >= 1.0) {
        activeRef.current[i] = 0;
        aAgeAttr.setX(i, 0);
        continue;
      }

      const q = tmpQ.current.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrmRef.current[i]);
      const m = tmpM.current.compose(
        posRef.current[i],
        q,
        new THREE.Vector3(scaleRef.current[i], scaleRef.current[i], scaleRef.current[i])
      );
      inst.setMatrixAt(i, m);
    }

    aAgeAttr.needsUpdate = true;
    inst.instanceMatrix.needsUpdate = true;
    mat.uniforms.uTime.value += dt;

    if (!colliders.length) return;

    const dir = getRainDir();
    const stormBoost = hour >= 14 && hour <= 19 ? 1.12 : 1.0;
    const spawns = Math.floor(SPAWN_PER_FRAME_BASE * (0.6 + intensity * 1.6) * stormBoost);

    for (let s = 0; s < spawns; s++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * AREA_RADIUS;
      const x = camera.position.x + Math.cos(a) * r;
      const z = camera.position.z + Math.sin(a) * r;
      const y = camera.position.y + 200;
      const origin = tmpV.current.set(x, y, z);

      rayRef.current.set(origin, dir);
      const hits = rayRef.current.intersectObjects(colliders, true);
      if (hits && hits.length) {
        const h = hits[0];
        const n = h.face
          ? h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize()
          : new THREE.Vector3(0, 1, 0);
        const pt = h.point.clone().add(n.clone().multiplyScalar(0.02));
        spawnSplash(pt, n);
      }
    }
  });

  if (!enabled) return null;
  return <instancedMesh ref={meshRef} args={[geom, mat, MAX_SPLASHES]} />;
}

/* ===========================================================
   Composer: put both passes together
=========================================================== */
export default function RainMode({ enabled=false, intensity=0.6, hour=12, wind=new THREE.Vector2(2.0,-1.0), colliders=[] }) {
  if (!enabled) return null;
  return (
    <>
      <RainLayer enabled={enabled} intensity={intensity} hour={hour} wind={wind} />
      <RainSplashes enabled={enabled} intensity={intensity} hour={hour} wind={wind} colliders={colliders} />
    </>
  );
}
