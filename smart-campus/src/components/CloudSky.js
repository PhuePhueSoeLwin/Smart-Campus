// components/CloudSky.js
import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/* ---------------------------------------
   Utils
--------------------------------------- */
function lerpColor(a, b, t) {
  return a.clone().lerp(b, THREE.MathUtils.clamp(t, 0, 1));
}
function desaturate(color, amount = 0.5) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.s *= Math.max(0, 1 - amount);
  const out = new THREE.Color();
  out.setHSL(hsl.h, hsl.s, hsl.l);
  return out;
}
function darken(color, amt = 0.2) {
  const c = color.clone();
  c.multiplyScalar(1 - amt);
  return c;
}

/* ---------------------------------------
   Sky colors by hour (dawn/day/dusk/night)
   Now rain-aware & lightning-aware
--------------------------------------- */
export function skyColorsByHour(hour, rainFactor = 0, lightningFlash = 0) {
  let base;
  if (hour >= 6 && hour < 9) {
    base = {
      top: new THREE.Color("#7ec8ff"),
      bottom: new THREE.Color("#bfe5ff"),
      haze: new THREE.Color("#ffffff"),
      sunTint: new THREE.Color("#ffd18a"),
    };
  } else if (hour >= 9 && hour < 16) {
    base = {
      top: new THREE.Color("#5eb2f7"),
      bottom: new THREE.Color("#9fd4ff"),
      haze: new THREE.Color("#ffffff"),
      sunTint: new THREE.Color("#fff1c4"),
    };
  } else if (hour >= 16 && hour < 19) {
    base = {
      top: new THREE.Color("#3c9de6"),
      bottom: new THREE.Color("#ffc18a"),
      haze: new THREE.Color("#ffe3c2"),
      sunTint: new THREE.Color("#ffb26b"),
    };
  } else {
    base = {
      top: new THREE.Color("#0b1a2f"),
      bottom: new THREE.Color("#132a4d"),
      haze: new THREE.Color("#0b1a2f"),
      sunTint: new THREE.Color("#334b73"),
    };
  }

  // Make sky more grey/flat when raining
  if (rainFactor > 0) {
    const grey = new THREE.Color("#6f7a87"); // bluish grey
    const chill = THREE.MathUtils.clamp(rainFactor, 0, 1);
    const desatAmt = THREE.MathUtils.lerp(0.15, 0.55, chill);
    const darkAmt = THREE.MathUtils.lerp(0.08, 0.36, chill);

    base.top = desaturate(lerpColor(base.top, grey, 0.35 * chill), desatAmt);
    base.bottom = desaturate(lerpColor(base.bottom, grey, 0.45 * chill), desatAmt);
    base.haze = desaturate(lerpColor(base.haze, new THREE.Color("#a8b3c1"), 0.55 * chill), desatAmt);
    base.sunTint = desaturate(lerpColor(base.sunTint, grey, 0.7 * chill), desatAmt * 0.6);

    base.top = darken(base.top, darkAmt);
    base.bottom = darken(base.bottom, darkAmt);
    base.haze = darken(base.haze, darkAmt * 0.5);
  }

  // Lightning flash pushes sky toward bright cool white momentarily
  if (lightningFlash > 0) {
    const flashCol = new THREE.Color("#eaf2ff");
    const f = THREE.MathUtils.clamp(lightningFlash, 0, 1);
    base.top = lerpColor(base.top, flashCol, f * 0.8);
    base.bottom = lerpColor(base.bottom, flashCol, f * 0.8);
    base.haze = lerpColor(base.haze, flashCol, f * 0.9);
  }

  return base;
}

/* ---------------------------------------
   Cloud palette (derives tints from sky)
   Rain + lightning aware
--------------------------------------- */
function cloudTintsByHour(hour, rainFactor = 0, lightningFlash = 0) {
  const sky = skyColorsByHour(hour, rainFactor, 0);
  const isNight = hour >= 19 || hour < 6;
  const isGolden = hour >= 6 && hour < 9;
  const isAfternoon = hour >= 9 && hour < 16;

  let base, mid, top;

  if (isNight) {
    base = desaturate(lerpColor(sky.bottom, sky.haze, 0.35), 0.35).multiplyScalar(1.06);
    mid = desaturate(lerpColor(sky.bottom, sky.top, 0.25), 0.45).multiplyScalar(1.02);
    top = desaturate(lerpColor(sky.top, sky.haze, 0.15), 0.55).multiplyScalar(1.0);
  } else if (isGolden) {
    const warm = sky.sunTint.clone();
    base = lerpColor(new THREE.Color("#ffffff"), warm, 0.35);
    mid = lerpColor(new THREE.Color("#f7fbff"), warm, 0.25);
    top = lerpColor(new THREE.Color("#f5f9ff"), sky.bottom, 0.2);
  } else if (isAfternoon) {
    base = lerpColor(new THREE.Color("#ffffff"), sky.sunTint, 0.18);
    mid = lerpColor(new THREE.Color("#f7fbff"), sky.bottom, 0.12);
    top = lerpColor(new THREE.Color("#f5f9ff"), sky.top, 0.08);
  } else {
    const warm = sky.sunTint.clone();
    base = lerpColor(new THREE.Color("#ffffff"), warm, 0.28);
    mid = lerpColor(new THREE.Color("#f7fbff"), sky.bottom, 0.22);
    top = lerpColor(new THREE.Color("#f5f9ff"), sky.top, 0.18);
  }

  // Rain greys & darkens clouds a touch
  if (rainFactor > 0) {
    const grey = new THREE.Color("#8893a3");
    const chill = THREE.MathUtils.clamp(rainFactor, 0, 1);
    const desatAmt = THREE.MathUtils.lerp(0.2, 0.5, chill);
    const darkAmt = THREE.MathUtils.lerp(0.05, 0.22, chill);

    base = darken(desaturate(lerpColor(base, grey, 0.35 * chill), desatAmt), darkAmt);
    mid  = darken(desaturate(lerpColor(mid,  grey, 0.30 * chill), desatAmt), darkAmt);
    top  = darken(desaturate(lerpColor(top,  grey, 0.25 * chill), desatAmt), darkAmt);
  }

  // Lightning brighten
  if (lightningFlash > 0) {
    const flashCol = new THREE.Color("#eaf2ff");
    const f = THREE.MathUtils.clamp(lightningFlash, 0, 1);
    base = lerpColor(base, flashCol, f * 0.7);
    mid  = lerpColor(mid,  flashCol, f * 0.7);
    top  = lerpColor(top,  flashCol, f * 0.6);
  }

  // Fog ranges (kept constant; Map3D clears scene fog each frame anyway)
  const fogNear = 700;
  const fogFar = 5000;
  return { base, mid, top, fogNear, fogFar };
}

/* ---------------------------------------
   Skydome gradient (shader-based)
   Accepts rainFactor + lightningFlash
--------------------------------------- */
export function SkyDome({ hour = 12, rainFactor = 0, lightningFlash = 0 }) {
  const uniforms = useMemo(() => {
    const c = skyColorsByHour(hour, rainFactor, lightningFlash);
    return {
      topColor: { value: c.top.clone() },
      bottomColor: { value: c.bottom.clone() },
      hazeColor: { value: c.haze.clone() },
      offset: { value: 33.0 },
      exponent: { value: 0.8 },
      hazeStrength: { value: 0.5 + 0.35 * rainFactor }, // stronger low haze when raining
    };
  }, []); // uniforms object created once

  useEffect(() => {
    const c = skyColorsByHour(hour, rainFactor, lightningFlash);
    uniforms.topColor.value.copy(c.top);
    uniforms.bottomColor.value.copy(c.bottom);
    uniforms.hazeColor.value.copy(c.haze);
    uniforms.hazeStrength.value = 0.5 + 0.35 * rainFactor;
  }, [hour, rainFactor, lightningFlash, uniforms]);

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
   Uses DoubleSide to avoid the center seam; tint/density are rain-aware.
========================================================================== */

function makeCloudMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
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

    // Freeze the billboard axes ONCE
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

  useEffect(() => {
    uniforms.uTint.value.copy(tint);
  }, [tint, uniforms]);

  useEffect(() => {
    uniforms.uDensity.value = density;
  }, [density, uniforms]);

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/** The full sky: many groups with varied sizes & altitudes (FROZEN)
 *  Now includes a rainFactor (0..1) to grey/flatten cloud tints + slight density boost,
 *  and lightningFlash (0..1) to temporarily brighten.
 */
export function RealCloudField({
  hour = 12,
  spread = 2200,

  // Slightly reduced group counts for performance while keeping layered sky
  lowGroups = 10,
  midGroups = 7,
  highGroups = 5,

  lowAlt = 520,
  midAlt = 620,
  highAlt = 720,

  // Reduced radius ranges to shrink per-group footprint
  lowRadius = [160, 320],
  midRadius = [210, 400],
  highRadius = [250, 480],

  // Reduced puff ranges to cut instance buffers
  lowPuffs = [60, 100],
  midPuffs = [85, 135],
  highPuffs = [100, 150],

  // Lower boost to avoid exponential scaling under rain
  cloudBoost = 0.9,
  rainFactor = 0,       // 0..1
  lightningFlash = 0,   // 0..1
}) {
  const tints = useMemo(
    () => cloudTintsByHour(hour, rainFactor, lightningFlash),
    [hour, rainFactor, lightningFlash]
  );

  const groups = useMemo(() => {
    const scaled = (v) =>
      Math.max(1, Math.round(v * cloudBoost * (1.0 + 0.25 * rainFactor)));
    const flashWhite = new THREE.Color("#f2f7ff");

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

        // Slightly denser + lower clouds when raining
        const density =
          THREE.MathUtils.lerp(0.85, 1.25, rng(i * 11.1)) * (1.0 + 0.3 * rainFactor);
        const thickness = THREE.MathUtils.lerp(65, 115, rng(i * 13.7));
        const anisotropy = THREE.MathUtils.lerp(1.1, 1.7, rng(i * 15.5));

        // Lightning brightening on tint (subtle)
        const lightningTint = tint.clone().lerp(flashWhite, lightningFlash * 0.6);

        arr.push({
          center: [cx, 0, cz],
          radius,
          puffCount,
          altitude: alt + THREE.MathUtils.lerp(-28, 28, rng(i * 17.2)) - 40 * rainFactor,
          thickness,
          anisotropy,
          density,
          tint: lightningTint,
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
    spread, tints.base, tints.mid, tints.top, cloudBoost, hour, rainFactor, lightningFlash,
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
   Accepts rainFactor + lightningFlash and forwards to both Sky and Clouds
--------------------------------------- */
export default function CloudSky({
  hour = 12,
  cloudBoost = 1.15,
  rainFactor = 0,
  lightningFlash = 0,
  ...props
}) {
  return (
    <>
      <SkyDome hour={hour} rainFactor={rainFactor} lightningFlash={lightningFlash} />
      <RealCloudField
        hour={hour}
        cloudBoost={cloudBoost}
        rainFactor={rainFactor}
        lightningFlash={lightningFlash}
        {...props}
      />
    </>
  );
}
