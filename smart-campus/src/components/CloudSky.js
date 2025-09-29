// src/components/CloudSky.js
import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";

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
   Helpers to derive cloud tints from sky
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

/**
 * cloudTintsByHour:
 * - Day: mix white with sunTint and bottom to get warm tops/cool bottoms.
 * - Dawn/Dusk: stronger warm mix.
 * - Night: blend towards bottom/haze and desaturate for soft grey-blue.
 */
function cloudTintsByHour(hour) {
  const sky = skyColorsByHour(hour);
  const isNight = hour >= 19 || hour < 6;
  const isGolden = hour >= 6 && hour < 9;
  const isAfternoon = hour >= 9 && hour < 16;
  const isDusk = hour >= 16 && hour < 19;

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
   Internal instanced layer (organic puffs with slow drift + morph)
   ======================================================================== */
function Layer({
  hour,
  puffCount,
  altitude,
  spread,
  sizeRange,
  wind,
  evolveSpeed,
  density,
  tint,
  seedJitter = 0,
}) {
  const { camera, scene } = useThree();

  // Keep scene fog consistent with sky and hour, avoids "refreshFogUniforms" errors
  useEffect(() => {
    const sky = skyColorsByHour(hour);
    // Slightly brighten fog color toward haze for realistic depth
    const fogCol = lerpColor(sky.bottom, sky.haze, 0.15);
    scene.fog = new THREE.Fog(fogCol, 650, 4900);
  }, [scene, hour]);

  const offsets = useMemo(() => {
    const arr = new Float32Array(puffCount * 3);
    for (let i = 0; i < puffCount; i++) {
      arr[i * 3 + 0] = (Math.random() * 2 - 1) * spread;
      arr[i * 3 + 1] = altitude + (Math.random() * 2 - 1) * 38; // tighter vertical band
      arr[i * 3 + 2] = (Math.random() * 2 - 1) * spread;
    }
    return arr;
  }, [puffCount, spread, altitude]);

  const scales = useMemo(() => {
    const [a, b] = sizeRange;
    const arr = new Float32Array(puffCount);
    for (let i = 0; i < puffCount; i++) {
      const t = Math.random();
      arr[i] = THREE.MathUtils.lerp(a, b, Math.pow(t, 0.5)); // bias to larger for thickness
    }
    return arr;
  }, [puffCount, sizeRange]);

  const seeds = useMemo(() => {
    const arr = new Float32Array(puffCount * 2);
    for (let i = 0; i < puffCount; i++) {
      arr[i * 2 + 0] = Math.random() * 1000.0 + seedJitter;
      arr[i * 2 + 1] = Math.random() * 1000.0 + seedJitter * 2.123;
    }
    return arr;
  }, [puffCount, seedJitter]);

  const geom = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    const quad = new THREE.PlaneGeometry(1, 1);
    g.index = quad.index;
    g.attributes.position = quad.attributes.position;
    g.attributes.uv = quad.attributes.uv;
    g.setAttribute("instanceOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    g.setAttribute("instanceScale", new THREE.InstancedBufferAttribute(scales, 1));
    g.setAttribute("instanceSeed", new THREE.InstancedBufferAttribute(seeds, 2));
    g.instanceCount = puffCount;
    return g;
  }, [offsets, scales, seeds, puffCount]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTint: { value: tint.clone() },
      uDensity: { value: density },
      uWind: { value: new THREE.Vector2(wind[0], wind[1]) },
      uSpread: { value: spread },
      uCamRight: { value: new THREE.Vector3(1, 0, 0) },
      uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    }),
    [tint, density, wind, spread]
  );

  useEffect(() => {
    uniforms.uTint.value.copy(tint);
  }, [tint, uniforms]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
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

          uniform vec3 uCamRight;
          uniform vec3 uCamUp;
          uniform float uSpread;
          uniform vec2 uWind;
          uniform float uTime;

          varying vec2 vUv;
          varying vec2 vSeed;

          void main() {
            vUv = uv;
            vSeed = instanceSeed;

            vec3 drift = vec3(uWind.x, 0.0, uWind.y) * uTime;
            vec3 center = instanceOffset + drift;

            // seamless wrap
            if (center.x >  uSpread) center.x -= 2.0 * uSpread;
            if (center.x < -uSpread) center.x += 2.0 * uSpread;
            if (center.z >  uSpread) center.z -= 2.0 * uSpread;
            if (center.z < -uSpread) center.z += 2.0 * uSpread;

            // true billboard toward camera
            vec3 worldPos = center
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
          uniform float uTime;

          // fbm noise for organic shape + subtle evolution
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
            float feather = smoothstep(1.0, 0.10, r); // reduce paper-like edges

            // extremely slow evolution + slight lateral slide
            float t = uTime * 0.025;
            vec2 p = cuv * 1.55 + vSeed + vec2(t, -t*0.83);
            float n = fbm(p);

            // thick, fluffy alpha
            float alpha = clamp((n * 1.22 - 0.31), 0.0, 1.0);
            alpha *= feather;
            alpha = pow(alpha, 1.28) * uDensity;

            if (alpha < 0.016) discard;

            gl_FragColor = vec4(uTint, alpha);
            #include <fog_fragment>
          }`,
      }),
    [uniforms]
  );

  useFrame((_, dt) => {
    // crawl-speed morph (frame-rate independent but very slow)
    uniforms.uTime.value += evolveSpeed * (dt > 0 ? Math.min(dt, 0.033) * 60.0 : 1.0);
    // billboard orientation
    const m = camera.matrixWorld.elements;
    uniforms.uCamRight.value.set(m[0], m[1], m[2]).normalize();
    uniforms.uCamUp.value.set(m[4], m[5], m[6]).normalize();
  });

  return (
    <mesh geometry={geom} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/* ---------------------------------------
   Public: RealCloudField
   - Cloud colors/tints come from sky palette
   - Lower altitude, more clouds (three layers)
   - Very slow drift & morphing
--------------------------------------- */
export function RealCloudField({
  hour = 12,

  // Lower base deck
  altitude = 520,           // ↓ low ceiling
  spread = 2500,

  // Population (tweak down if GPU is weak)
  baseCount = 520,
  midCount  = 360,
  topCount  = 220,

  // Size ranges for variety and thickness
  baseSize = [240, 560],
  midSize  = [170, 360],
  topSize  = [120, 260],

  // Very slow drift (world units / second)
  baseWind = [0.025, -0.018],
  midWind  = [0.028, -0.020],
  topWind  = [0.030, -0.022],

  // Very slow evolution
  baseEvolve = 0.005,
  midEvolve  = 0.0055,
  topEvolve  = 0.006,

  // Densities (alpha multipliers)
  baseDensity = 1.18,
  midDensity  = 0.92,
  topDensity  = 0.62,
}) {
  const tints = useMemo(() => cloudTintsByHour(hour), [hour]);

  return (
    <>
      {/* Thick base deck (warmest, heaviest) */}
      <Layer
        hour={hour}
        puffCount={baseCount}
        altitude={altitude}
        spread={spread}
        sizeRange={baseSize}
        wind={baseWind}
        evolveSpeed={baseEvolve}
        density={baseDensity}
        tint={tints.base}
        seedJitter={111.0}
      />

      {/* Middle layer for depth */}
      <Layer
        hour={hour}
        puffCount={midCount}
        altitude={altitude + 52}
        spread={spread * 1.02}
        sizeRange={midSize}
        wind={midWind}
        evolveSpeed={midEvolve}
        density={midDensity}
        tint={tints.mid}
        seedJitter={555.0}
      />

      {/* Light top veil (cooler) */}
      <Layer
        hour={hour}
        puffCount={topCount}
        altitude={altitude + 112}
        spread={spread * 1.05}
        sizeRange={topSize}
        wind={topWind}
        evolveSpeed={topEvolve}
        density={topDensity}
        tint={tints.top}
        seedJitter={999.0}
      />
    </>
  );
}
