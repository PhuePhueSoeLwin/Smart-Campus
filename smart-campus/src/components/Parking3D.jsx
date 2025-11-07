// src/components/Parking3D.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { fetchAllZones, ZONES_C2 } from './parkingApi';
import './Parking3D.css';

const CAR1_OFFSET_FROM_C2 = new THREE.Vector3(6, 0, 9);
const CAR2_OFFSET_FROM_C2 = new THREE.Vector3(12.8, 0, 8.5);
const CAR2_TOUCH_SIDE = 'right';
const CAR_Y_LIFT = 0.3;

const MOTO1_LOCAL_OFFSET  = new THREE.Vector3(7.1, 0, 0.35);
const MOTO_PAIR_GAP_LOCAL = 0.12;
const MOTO_Y_LIFT         = 0.35;

const CHIP_SCALE   = 4.5;
const CHIP_POS_Y   = 1.25;
const CHIP_PADDING = '14px 18px';
const CHIP_NAME_FS = '22px';
const CHIP_ROW_FS  = '18px';
const CHIP_DOT_SZ  = 14;

const SLOT_SPEC = {
  car:  { w: 2.6, d: 5.2, gapX: 0.40, gapZ: 0.60, marginX: 0.8,  marginZ: 0.8 },
  moto: { w: 1.0, d: 2.2, gapX: 0.25, gapZ: 0.30, marginX: 0.6,  marginZ: 0.6 },
};

const ASPHALT = '#1b1c1f';
const GREEN   = '#19c37d';
const RED     = '#ef4444';

const deg2rad = (d) => (d * Math.PI) / 180;
const rotY = (v, deg) => v.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(deg2rad(deg || 0)));

function touchAlongLocalAxis({
  refSizeW, refSizeD, refScale = 1,
  selfSizeW, selfSizeD, selfScale = 1,
  yawDeg = 0,
  axis = 'x',
  side = 'right',
  extraGap = 0
}) {
  if (axis === 'x') {
    const dirLocal = new THREE.Vector3(1, 0, 0).multiplyScalar(side === 'left' ? -1 : 1);
    const mag = (refSizeW*refScale)/2 + (selfSizeW*selfScale)/2 + (extraGap||0);
    return rotY(dirLocal, yawDeg).multiplyScalar(mag);
  } else {
    const dirLocal = new THREE.Vector3(0, 0, 1).multiplyScalar(side === 'back' ? -1 : 1);
    const mag = (refSizeD*refScale)/2 + (selfSizeD*selfScale)/2 + (extraGap||0);
    return rotY(dirLocal, yawDeg).multiplyScalar(mag);
  }
}

function useSlotLineTexture(kind) {
  return React.useMemo(() => {
    const texW = 256, texH = kind === 'car' ? 512 : 384;
    const cnv = document.createElement('canvas');
    cnv.width = texW; cnv.height = texH;
    const ctx = cnv.getContext('2d');
    ctx.clearRect(0,0,texW,texH);

    ctx.strokeStyle = '#f7f7f7';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const pad = 8;
    ctx.strokeRect(pad, pad, texW - pad*2, texH - pad*2);
    ctx.beginPath();
    const y = pad + (kind === 'car' ? 42 : 30);
    ctx.moveTo(pad + 18, y);
    ctx.lineTo(texW - pad - 18, y);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(cnv);
    texture.anisotropy = 8;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, [kind]);
}

function computeGrid(kind, padW, padD, requestedCount) {
  const spec   = SLOT_SPEC[kind];
  const pitchX = spec.w + spec.gapX;
  const pitchZ = spec.d + spec.gapZ;

  const colsCap = Math.max(1, Math.floor((padW - spec.marginX * 2 + spec.gapX) / pitchX));
  const rowsCap = Math.max(1, Math.floor((padD - spec.marginZ * 2 + spec.gapZ) / pitchZ));

  const capacity = colsCap * rowsCap;
  const count = Math.min(requestedCount, capacity);

  const rows = Math.max(1, Math.ceil(count / colsCap));
  const cols = Math.min(colsCap, count);

  const gridW = Math.min(cols, count) * pitchX - spec.gapX;
  const gridD = rows * pitchZ - spec.gapZ;

  const originX = -gridW / 2;
  const originZ = -gridD / 2;

  const slots = [];
  let left = count;
  for (let r = 0; r < rows; r++) {
    const cellsThisRow = Math.min(cols, left);
    for (let c = 0; c < cellsThisRow; c++) {
      slots.push({ x: originX + c * pitchX, z: originZ + r * pitchZ, w: SLOT_SPEC[kind].w, d: SLOT_SPEC[kind].d, r, c });
    }
    left -= cellsThisRow;
  }

  return { slots, cols, rows, gridW, gridD, capacity, pitchX, pitchZ };
}

function Bay({ x, z, w, d, occupied, lineTex, onClick }) {
  const y = 0.035;
  const color = occupied ? RED : GREEN;
  const handle = (e) => { e.stopPropagation(); onClick?.(e); };
  return (
    <group position={[x + w/2, 0, z + d/2]} onClick={handle}>
      <mesh position={[0, y, 0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} opacity={occupied ? 0.85 : 0.55} transparent />
      </mesh>
      <mesh position={[0, y + 0.001, 0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial map={lineTex} transparent />
      </mesh>
    </group>
  );
}

function ZonePad({ zone, layout, worldPos, onZoneClick, sampleGroundY }) {
  const {
    id, w: padW, d: padD, rotDeg, kind, scale = 1, yLift = 0,
    vehiclesPerBay = 2,
    tightFit = false,
    showPad = true,
    gridJustify = 'center',
    rowGap = 0,
    forceExactTwoRows = false,
    firstRowCount = 30,
  } = layout;

  const spec = SLOT_SPEC[kind];
  const lineTex = useSlotLineTexture(kind);
  const info = zone || { zoneId: id, total: 0, occupied: 0, free: 0, status: 'red', stale: true };

  const totalBaysRequested  = Math.max(0, Math.ceil((info.total ?? 0)    / Math.max(1, vehiclesPerBay)));
  const baysOccupied        = Math.max(0, Math.ceil((info.occupied ?? 0) / Math.max(1, vehiclesPerBay)));

  const grid = React.useMemo(
    () => computeGrid(kind, padW, padD, totalBaysRequested),
    [kind, padW, padD, totalBaysRequested]
  );

  const manual = React.useMemo(() => {
    if (!forceExactTwoRows) return null;

    const pitchX = spec.w + spec.gapX;

    const total = totalBaysRequested;
    const first = Math.min(total, firstRowCount);
    const second = Math.max(0, total - first);

    const widthRow = (n) => (n > 0 ? (n * pitchX) - spec.gapX : 0);
    const w1 = widthRow(first);
    const w2 = widthRow(second);
    const maxW = Math.max(w1, w2);

    const rightStartCenter = (maxW / 2) - (spec.w / 2);
    const r1Z = -(rowGap / 2);
    const r2Z = +(rowGap / 2);

    const slots = [];
    for (let i = 0; i < first; i++) {
      slots.push({ x: rightStartCenter - i * pitchX, z: r1Z, w: spec.w, d: spec.d, r: 0, c: i });
    }
    for (let i = 0; i < second; i++) {
      slots.push({ x: rightStartCenter - i * pitchX, z: r2Z, w: spec.w, d: spec.d, r: 1, c: i });
    }

    const visualPadW = maxW;
    const visualPadD = (second > 0 ? (2 * spec.d + spec.gapZ) : spec.d) + rowGap;

    return { slots, gridW: visualPadW, gridD: visualPadD, rows: second > 0 ? 2 : 1 };
  }, [forceExactTwoRows, firstRowCount, rowGap, spec, totalBaysRequested]);

  const renderSlots = manual ? manual.slots : (() => {
    const { slots, rows, cols, pitchX, gridW } = grid;
    const visualPadW = tightFit ? gridW : padW;

    const leftStartX  = (-visualPadW / 2) + SLOT_SPEC[kind].marginX + SLOT_SPEC[kind].w / 2;
    const rightStartX = ( visualPadW / 2) - SLOT_SPEC[kind].marginX - SLOT_SPEC[kind].w / 2 - (cols - 1) * pitchX;

    const row0Z = -((rows === 2 ? rowGap : 0) / 2);
    const row1Z =  +((rows === 2 ? rowGap : 0) / 2);

    return slots.map(s => {
      let x = s.x, z = s.z;
      if (gridJustify === 'split' && rows === 2) {
        if (s.r === 0) x = leftStartX + s.c * pitchX;
        if (s.r === 1) x = rightStartX + s.c * pitchX;
      }
      if (rows === 2) {
        if (s.r === 0) z = row0Z;
        if (s.r === 1) z = row1Z;
      }
      return { ...s, x, z };
    });
  })();

  const occSet = React.useMemo(() => {
    const s = new Set();
    const occ = Math.min(baysOccupied, renderSlots.length);
    for (let i = 0; i < occ; i++) s.add(i);
    return s;
  }, [renderSlots, baysOccupied]);

  const visualPadW = manual ? manual.gridW : (tightFit ? grid.gridW : padW);
  const visualPadD = manual ? manual.gridD : (tightFit ? (grid.gridD + (grid.rows === 2 ? rowGap : 0)) : padD);

  const yBase = (() => {
    const ground = typeof sampleGroundY === 'function'
      ? sampleGroundY(worldPos.x, worldPos.z)
      : worldPos.y;
    return ground + 0.02 + yLift;
  })();

  const chipDistanceFactor = Math.max(2.2, 10 * scale);

  const handleClick = (e) => {
    window.__mfuParkingClick = true;
    e.stopPropagation();
    onZoneClick?.(info.zoneId);
  };

  const chipDot =
    info.status === 'green' ? '#19c37d' :
    info.status === 'orange' ? '#f59e0b' : '#ef4444';

  return (
    <group position={[worldPos.x, yBase, worldPos.z]} rotation={[0, THREE.MathUtils.degToRad(rotDeg), 0]} scale={[scale, scale, scale]}>
      {showPad && (
        <>
          <mesh receiveShadow onClick={handleClick}>
            <boxGeometry args={[visualPadW, 0.04, visualPadD]} />
            <meshStandardMaterial color={ASPHALT} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[visualPadW * 0.96, 0.6]} />
            <meshStandardMaterial color="#2a2b2f" roughness={0.9} />
          </mesh>
        </>
      )}

      {renderSlots.map((s, i) => (
        <Bay
          key={i}
          x={s.x}
          z={s.z}
          w={s.w}
          d={s.d}
          occupied={occSet.has(i)}
          lineTex={lineTex}
          onClick={handleClick}
        />
      ))}

      <Html center position={[0, CHIP_POS_Y, 0]} transform distanceFactor={chipDistanceFactor}>
        <div
          className="parking-chip"
          title={info.timestamp || ''}
          onClick={(e)=>{ e.stopPropagation(); handleClick(e); }}
          style={{ transform: `scale(${CHIP_SCALE})`, transformOrigin: 'center', padding: CHIP_PADDING, borderRadius: 16 }}
        >
          <div className="parking-name" style={{ fontSize: CHIP_NAME_FS, fontWeight: 800, lineHeight: 1.1 }}>
            {info.zoneId ?? id}
          </div>

          <div className="parking-row" style={{ fontSize: CHIP_ROW_FS, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="dot" style={{ background: chipDot, width: CHIP_DOT_SZ, height: CHIP_DOT_SZ, borderRadius: CHIP_DOT_SZ / 2, display: 'inline-block', marginRight: 8 }} />
            <span className="txt">Free</span><strong>{info.free ?? '—'}</strong>
            <span className="sep">•</span>
            <span className="txt">Used</span><strong>{info.occupied ?? '—'}</strong>
            <span className="sep">/</span><strong>{info.total ?? '—'}</strong>
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function Parking3D({ anchor, c2YawDeg = 45, sampleGroundY, onZoneClick }) {
  const [zones, setZones] = useState(() =>
    ZONES_C2.map((id) => ({ zoneId: id, total: 0, occupied: 0, free: 0, status: 'red', stale: true }))
  );
  const abortRef = useRef();

  const refreshOnce = useCallback(async () => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const data = await fetchAllZones(ZONES_C2, { signal: ctl.signal });
      setZones(data);
    } catch (e) {
      if (e?.name !== 'AbortError') console.error('[Parking3D] refresh failed', e);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    refreshOnce();
    const handler = () => refreshOnce();
    window.addEventListener('mfu:refreshParkingZones', handler);
    return () => {
      abortRef.current?.abort();
      window.removeEventListener('mfu:refreshParkingZones', handler);
    };
  }, [refreshOnce]);

  const byId = useMemo(() => new Map(zones.map((z) => [z.zoneId, z])), [zones]);

  const PAD_LAYOUT = useMemo(() => ([
    { id: 'C2-Parking-01', kind: 'moto', w: 28, d: 14, rotDeg: c2YawDeg, scale: 0.16,
      offset: CAR1_OFFSET_FROM_C2, rightNudge: 4.3, forwardNudge: -6.5,
      yLift: CAR_Y_LIFT, vehiclesPerBay: 1, tightFit: true, showPad: false },

    { id: 'C2-Parking-02', kind: 'moto', w: 32, d: 14, rotDeg: 90, scale: 0.16,
      offset: CAR2_OFFSET_FROM_C2, forwardNudge: -7.5, yLift: CAR_Y_LIFT + 0.34,
      vehiclesPerBay: 1, tightFit: true, showPad: false, forceExactTwoRows: true, firstRowCount: 30, rowGap: 6.5 },

    { id: 'C2-Motorcycle-01', kind: 'moto', w: 28, d: 14, rotDeg: c2YawDeg, scale: 0.16,
      fromC2Local: MOTO1_LOCAL_OFFSET, yLift: MOTO_Y_LIFT, vehiclesPerBay: 2, tightFit: true, showPad: false },

    { id: 'C2-Motorcycle-02', kind: 'moto', w: 32, d: 14, rotDeg: c2YawDeg, scale: 0.16,
      sideOf: 'C2-Motorcycle-01', touchAxis: 'z', touch: 'forward',
      extraPairGap: MOTO_PAIR_GAP_LOCAL, yLift: MOTO_Y_LIFT, vehiclesPerBay: 2, tightFit: true, showPad: false },
  ]), [c2YawDeg]);

  const posById = useMemo(() => {
    const c2 = (anchor ?? new THREE.Vector3(165, 0, -95));
    const map = new Map();

    for (const pad of PAD_LAYOUT) {
      let basePos = null;
      if (pad.offset) basePos = c2.clone().add(pad.offset);
      else if (pad.fromC2Local) basePos = c2.clone().add(rotY(pad.fromC2Local, pad.rotDeg));

      if (basePos) {
        if (pad.rightNudge) basePos = basePos.add(rotY(new THREE.Vector3(1, 0, 0), pad.rotDeg).multiplyScalar(pad.rightNudge));
        if (pad.forwardNudge) basePos = basePos.add(rotY(new THREE.Vector3(0, 0, 1), pad.rotDeg).multiplyScalar(pad.forwardNudge));
        map.set(pad.id, basePos);
      }
    }

    for (const pad of PAD_LAYOUT) {
      if (!pad.sideOf) continue;
      const ref = PAD_LAYOUT.find(p => p.id === pad.sideOf);
      const refPos = map.get(ref?.id);
      if (!ref || !refPos) continue;

      const axis = pad.touchAxis || 'x';
      const side = pad.touch || (axis === 'x' ? 'right' : 'forward');

      const vec = touchAlongLocalAxis({
        refSizeW: ref.w, refSizeD: ref.d, refScale: ref.scale,
        selfSizeW: pad.w, selfSizeD: pad.d, selfScale: pad.scale,
        yawDeg: pad.rotDeg, axis, side, extraGap: pad.extraPairGap || 0
      });

      let pos = refPos.clone().add(vec);
      if (pad.forwardNudge) pos = pos.add(rotY(new THREE.Vector3(0, 0, 1), pad.rotDeg).multiplyScalar(pad.forwardNudge));
      if (pad.rightNudge) pos = pos.add(rotY(new THREE.Vector3(1, 0, 0), pad.rotDeg).multiplyScalar(pad.rightNudge));
      map.set(pad.id, pos);
    }

    return map;
  }, [anchor, PAD_LAYOUT]);

  return (
    <group>
      {PAD_LAYOUT.map((layout) => {
        const worldPos = (posById.get(layout.id) ?? (anchor ?? new THREE.Vector3(165,0,-95)));
        const y = typeof sampleGroundY === 'function' ? sampleGroundY(worldPos.x, worldPos.z) : worldPos.y;
        const base = new THREE.Vector3(worldPos.x, y, worldPos.z);
        const zone = byId.get(layout.id) || { zoneId: layout.id, total: 0, occupied: 0, free: 0, status: 'red', stale: true };
        return (
          <ZonePad
            key={layout.id}
            zone={zone}
            layout={layout}
            worldPos={base}
            sampleGroundY={sampleGroundY}
            onZoneClick={onZoneClick}
          />
        );
      })}
    </group>
  );
}
