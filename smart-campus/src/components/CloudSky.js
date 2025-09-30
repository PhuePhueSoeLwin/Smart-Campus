// src/components/CloudSky.js
import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/* ---------------------------------------
   Sky colors by hour (dawn/day/dusk/night)
--------------------------------------- */
export function skyColorsByHour(hour) {
  if (hour >= 6 && hour < 9) {
    return {
      top: new THREE.Color("#7ec8ff"),
      bottom: new THREE.Color("#bfe5ff"),
      haze: new THREE.Color("#ffffff"),
      sunTint: new THREE.Color("#ffd18a"),
    };
  }
  if (hour >= 9 && hour < 16) {
    return {
      top: new THREE.Color("#5eb2f7"),
      bottom: new THREE.Color("#9fd4ff"),
      haze: new THREE.Color("#ffffff"),
      sunTint: new THREE.Color("#fff1c4"),
    };
  }
  if (hour >= 16 && hour < 19) {
    return {
      top: new THREE.Color("#3c9de6"),
      bottom: new THREE.Color("#ffc18a"),
      haze: new THREE.Color("#ffe3c2"),
      sunTint: new THREE.Color("#ffb26b"),
    };
  }
  return {
    top: new THREE.Color("#0b1a2f"),
    bottom: new THREE.Color("#132a4d"),
    haze: new THREE.Color("#0b1a2f"),
    sunTint: new THREE.Color("#334b73"),
  };
}

/* ---------------------------------------
   Helpers
--------------------------------------- */
function lerpColor(a, b, t) {
  return a.clone().lerp(b, THREE.MathUtils.clamp(t, 0, 1));
}
function desaturate(color, amount = 0.5) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.s *= 1 - amount;
  const out = new THREE.Color();
  out.setHSL(hsl.h, hsl.s, hsl.l);
  return out;
}

/* ---------------------------------------
   Cloud palette (derives tints from sky)
--------------------------------------- */
function cloudTintsByHour(hour) {
  const sky = skyColorsByHour(hour);
  const isNight = hour >= 19 || hour < 6;
  const isGolden = hour >= 6 && hour < 9;
  const isAfternoon = hour >= 9 && hour < 16;

  if (isNight) {
    const base = desaturate(lerpColor(sky.bottom, sky.haze, 0.35), 0.35).multiplyScalar(1.06);
    const mid = desaturate(lerpColor(sky.bottom, sky.top, 0.25), 0.45).multiplyScalar(1.02);
    const top = desaturate(lerpColor(sky.top, sky.haze, 0.15), 0.55).multiplyScalar(1.0);
    return { base, mid, top, fogNear: 650, fogFar: 4700 };
  }
  if (isGolden) {
    const warm = sky.sunTint.clone();
    const base = lerpColor(new THREE.Color("#ffffff"), warm, 0.35);
    const mid = lerpColor(new THREE.Color("#f7fbff"), warm, 0.25);
    const top = lerpColor(new THREE.Color("#f5f9ff"), sky.bottom, 0.2);
    return { base, mid, top, fogNear: 700, fogFar: 4800 };
  }
  if (isAfternoon) {
    const base = lerpColor(new THREE.Color("#ffffff"), sky.sunTint, 0.18);
    const mid = lerpColor(new THREE.Color("#f7fbff"), sky.bottom, 0.12);
    const top = lerpColor(new THREE.Color("#f5f9ff"), sky.top, 0.08);
    return { base, mid, top, fogNear: 750, fogFar: 5000 };
  }
  // Dusk
  const warm = sky.sunTint.clone();
  const base = lerpColor(new THREE.Color("#ffffff"), warm, 0.28);
  const mid = lerpColor(new THREE.Color("#f7fbff"), sky.bottom, 0.22);
  const top = lerpColor(new THREE.Color("#f5f9ff"), sky.top, 0.18);
  return { base, mid, top, fogNear: 700, fogFar: 4800 };
}

/* ---------------------------------------
   Skydome gradient (shader-based)
--------------------------------------- */
export function SkyDome({ hour = 12 }) {
  const uniforms = useMemo(() => {
    const c = skyColorsByHour(hour);
    return {
      topColor: { value: c.top.clone() },
      bottomColor: { value: c.bottom.clone() },
      hazeColor: { value: c.haze.clone() },
      offset: { value: 33.0 },
      exponent: { value: 0.8 },
      hazeStrength: { value: 0.45 },
    };
  }, []);

  useEffect(() => {
    const c = skyColorsByHour(hour);
    uniforms.topColor.value.copy(c.top);
    uniforms.bottomColor.value.copy(c.bottom);
    uniforms.hazeColor.value.copy(c.haze);
  }, [hour, uniforms]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms,
        vertexShader: /* glsl */ `
          varying vec3 vWorldPosition;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPosition = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform vec3 hazeColor;
          uniform float offset;
          uniform float exponent;
          uniform float hazeStrength;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
            float t = pow(max(h, 0.0), exponent);
            vec3 grad = mix(bottomColor, topColor, t);
            float horizon = clamp(1.0 - h, 0.0, 1.0);
            grad = mix(grad, hazeColor, horizon * hazeStrength);
            gl_FragColor = vec4(grad, 1.0);
          }`,
      }),
    [uniforms]
  );

  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[5000, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/* =========================================================================
   Clustered cloud groups (cumulus-style) — FROZEN (no drift, no morph)
   Keeps your original sprite look, but no per-frame billboarding.
   Uses DoubleSide to avoid the center seam.
========================================================================== */

function makeCloudMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,       // important: no seam when viewing from behind
    transparent: true,
    depthWrite: false,
    depthTest: true,
    fog: true,
    uniforms,
    blending: THREE.NormalBlending,
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      attribute vec3 instanceOffset;
      attribute float instanceScale;
      attribute vec2 instanceSeed;
      uniform vec3 uCamRight;   // FROZEN axes (captured once)
      uniform vec3 uCamUp;
      varying vec2 vUv;
      varying vec2 vSeed;
      void main() {
        vUv = uv;
        vSeed = instanceSeed;
        vec3 worldPos = instanceOffset
          + uCamRight * (position.x * instanceScale)
          + uCamUp    * (position.y * instanceScale);
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      precision highp float;
      varying vec2 vUv;
      varying vec2 vSeed;
      uniform vec3  uTint;
      uniform float uDensity;

      // ORIGINAL static fbm (no time)
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0,0.0));
        float c = hash(i + vec2(0.0,1.0));
        float d = hash(i + vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        mat2 m = mat2(1.6,-1.2, 1.2,1.6);
        for (int i=0;i<6;i++){
          v += a * noise(p);
          p = m * p + 0.028;
          a *= 0.55;
        }
        return v;
      }

      void main() {
        vec2 cuv = vUv * 2.0 - 1.0;
        float r = length(cuv);
        float edge = smoothstep(1.0, 0.12, r);

        vec2 p = cuv * 1.55 + vSeed;
        float n = fbm(p);

        float alpha = clamp((n * 1.20 - 0.30), 0.0, 1.0);
        alpha *= edge;
        alpha = pow(alpha, 1.25) * uDensity;

        if (alpha < 0.016) discard;
        gl_FragColor = vec4(uTint, alpha);
        #include <fog_fragment>
      }`,
  });
}

function CloudGroup({
  center,
  radius = 240,
  puffCount = 140,
  altitude = 520,
  thickness = 90,
  anisotropy = 1.45,
  density = 1.0,
  tint = new THREE.Color("#ffffff"),
  seed = 1.0,
}) {
  const { camera } = useThree();

  const { geometry, uniforms } = useMemo(() => {
    const offsets = new Float32Array(puffCount * 3);
    const scales  = new Float32Array(puffCount);
    const seeds   = new Float32Array(puffCount * 2);

    const rand = (s) => {
      const r = (Math.sin(s * 123.45 + 76.54) * 43758.5453) % 1;
      return r < 0 ? r + 1 : r;
    };

    for (let i = 0; i < puffCount; i++) {
      const a = rand(seed + i * 2.1);
      const b = rand(seed + i * 3.7);
      const c = rand(seed + i * 5.9);

      const theta = a * Math.PI * 2.0;
      const phi   = Math.acos(2.0 * b - 1.0);
      const u     = Math.pow(c, 0.55);
      const rr    = u * radius;

      const x = Math.sin(phi) * Math.cos(theta) * rr * anisotropy;
      const z = Math.sin(phi) * Math.sin(theta) * rr;
      const y = (Math.cos(phi) * rr * 0.25) + (rand(seed + i * 6.3) * 2 - 1) * (thickness * 0.5);

      offsets[i * 3 + 0] = center[0] + x;
      offsets[i * 3 + 1] = altitude + y;
      offsets[i * 3 + 2] = center[2] + z;

      const edge = Math.min(1.0, rr / (radius + 1e-5));
      const size = THREE.MathUtils.lerp(260, 520, Math.pow(1.0 - edge, 0.65));
      scales[i] = size * THREE.MathUtils.lerp(0.75, 1.12, rand(seed + i * 4.9));

      seeds[i * 2 + 0] = rand(seed + i * 7.3) * 1000.0 + seed * 11.0;
      seeds[i * 2 + 1] = rand(seed + i * 9.1) * 1000.0 + seed * 23.0;
    }

    const quad = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = quad.index;
    g.attributes.position = quad.attributes.position;
    g.attributes.uv = quad.attributes.uv;
    g.setAttribute("instanceOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    g.setAttribute("instanceScale",  new THREE.InstancedBufferAttribute(scales, 1));
    g.setAttribute("instanceSeed",   new THREE.InstancedBufferAttribute(seeds, 2));
    g.instanceCount = puffCount;

    // Freeze the billboard axes ONCE (no per-frame updates)
    const m = camera.matrixWorld.elements;
    const right = new THREE.Vector3(m[0], m[1], m[2]).normalize();
    const up    = new THREE.Vector3(m[4], m[5], m[6]).normalize();

    const uniforms = {
      uTint:     { value: tint.clone() },
      uDensity:  { value: density },
      uCamRight: { value: right },
      uCamUp:    { value: up },
    };

    return { geometry: g, uniforms };
  }, [center, radius, puffCount, altitude, thickness, anisotropy, density, tint, seed, camera]);

  const material = useMemo(() => makeCloudMaterial(uniforms), [uniforms]);

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/** The full sky: many groups with varied sizes & altitudes (FROZEN) */
export function RealCloudField({
  hour = 12,
  spread = 2400,

  lowGroups = 14,
  midGroups = 10,
  highGroups = 7,

  lowAlt = 520,
  midAlt = 620,
  highAlt = 720,

  lowRadius = [170, 360],
  midRadius = [230, 440],
  highRadius = [270, 540],

  lowPuffs = [80, 140],
  midPuffs = [110, 180],
  highPuffs = [130, 210],

  cloudBoost = 1.15,
}) {
  const { scene } = useThree();
  const tints = useMemo(() => cloudTintsByHour(hour), [hour]);

  useEffect(() => {
    const sky = skyColorsByHour(hour);
    const fogCol = lerpColor(sky.bottom, sky.haze, 0.15);
    scene.fog = new THREE.Fog(fogCol, 650, 4900);
  }, [scene, hour]);

  const groups = useMemo(() => {
    const scaled = (v) => Math.max(1, Math.round(v * cloudBoost));
    const makeDeck = (count, alt, radRange, puffRange, tint, seedOffset) => {
      const arr = [];
      const deckCount = scaled(count);

      // deterministic RNG so positions don't shuffle between reloads
      const rng = (i) => {
        const s = Math.sin((i + seedOffset) * 12.9898) * 43758.5453;
        return s - Math.floor(s);
      };

      for (let i = 0; i < deckCount; i++) {
        const cx = (rng(i * 3.1) * 2 - 1) * spread;
        const cz = (rng(i * 5.7) * 2 - 1) * spread;

        const radius = THREE.MathUtils.lerp(radRange[0], radRange[1], rng(i * 7.3));
        const puffsBase = THREE.MathUtils.lerp(puffRange[0], puffRange[1], rng(i * 9.9));
        const puffCount = scaled(puffsBase);

        const density = THREE.MathUtils.lerp(0.85, 1.25, rng(i * 11.1));
        const thickness = THREE.MathUtils.lerp(65, 115, rng(i * 13.7));
        const anisotropy = THREE.MathUtils.lerp(1.1, 1.7, rng(i * 15.5));

        arr.push({
          center: [cx, 0, cz],
          radius,
          puffCount,
          altitude: alt + THREE.MathUtils.lerp(-28, 28, rng(i * 17.2)),
          thickness,
          anisotropy,
          density,
          tint,
          seed: 1000 + seedOffset + i * 17.123,
        });
      }
      return arr;
    };

    return [
      ...makeDeck(lowGroups,  lowAlt,  lowRadius,  lowPuffs,  tints.base, 11),
      ...makeDeck(midGroups,  midAlt,  midRadius,  midPuffs,  tints.mid,  77),
      ...makeDeck(highGroups, highAlt, highRadius, highPuffs, tints.top, 133),
    ];
  }, [
    lowGroups, midGroups, highGroups,
    lowAlt, midAlt, highAlt,
    lowRadius, midRadius, highRadius,
    lowPuffs, midPuffs, highPuffs,
    spread, tints.base, tints.mid, tints.top, cloudBoost, hour,
  ]);

  return (
    <>
      {groups.map((g, idx) => (
        <CloudGroup key={idx} {...g} />
      ))}
    </>
  );
}

/* ---------------------------------------
   Default export: convenient wrapper
--------------------------------------- */
export default function CloudSky({ hour = 12, cloudBoost = 1.15, ...props }) {
  return (
    <>
      <SkyDome hour={hour} />
      <RealCloudField hour={hour} cloudBoost={cloudBoost} {...props} />
    </>
  );
}
