// src/components/parkingApi.js
// Unifies MFU Smart Parking realtime APIs into a stable shape for the UI.
//
// Per-zone realtime (with ?zone=...):
//   https://agent.wf.mfu.ac.th/webhook/778a4a4b-9b3d-4739-8773-15fc1d426d10
//
// Array-all-zones (your sample payload):
//   SAME endpoint without ?zone=
//
// Optional summary:
//   https://agent.wf.mfu.ac.th/webhook/01b1d376-c185-4e5a-9db3-a5617c4c7fc3
//
// You can override endpoints with env vars:
//   REACT_APP_PARKING_REALTIME_PER_ZONE
//   REACT_APP_PARKING_REALTIME_SUM

const API_PER_ZONE =
  process.env.REACT_APP_PARKING_REALTIME_PER_ZONE ||
  'https://agent.wf.mfu.ac.th/webhook/778a4a4b-9b3d-4739-8773-15fc1d426d10';

const API_SUMMARY =
  process.env.REACT_APP_PARKING_REALTIME_SUM ||
  'https://agent.wf.mfu.ac.th/webhook/01b1d376-c185-4e5a-9db3-a5617c4c7fc3';

// Zones we render at C2
export const ZONES_C2 = [
  'C2-Parking-01',
  'C2-Parking-02',
  'C2-Motorcycle-01',
  'C2-Motorcycle-02',
];

// Basic status colors from free/total ratio
export function statusFromRatio(free, all) {
  const p = all > 0 ? free / all : 0;
  if (p >= 0.5) return 'green';
  if (p >= 0.2) return 'orange';
  return 'red';
}

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// Normalize compact object (per-zone) → common shape.
function normalizeCompact(zoneId, raw) {
  const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw;

  const all  = num(data?.all) || num(data?.total) || num(data?.count) || 0;
  const used = num(data?.use) || num(data?.occupied) || (all - num(data?.free)) || 0;
  const free = num(data?.free) || num(data?.available) || Math.max(0, all - used);
  const updatedAt = data?.updatedAt || data?.timestamp || new Date().toISOString();

  // Unknown car/moto split here
  const carOcc  = num(data?.['car-occ']);
  const carFree = num(data?.['car-free']);
  const motoOcc = num(data?.['motercycle-occ']);
  const motoFree= num(data?.['motocycle-free']);
  const snap    = data?.snap_link || data?.snapshot || '';

  return {
    zoneId,
    total: all,
    occupied: used,
    free,
    status: statusFromRatio(free, all),
    timestamp: updatedAt,
    car: { occ: carOcc || 0, free: carFree || 0 },
    motorcycle: { occ: motoOcc || 0, free: motoFree || 0 },
    snapLink: snap,
    _raw: raw
  };
}

// Normalize "array-all-zones" record → common shape.
function normalizeArrayRecord(rec) {
  const zoneId = rec?.zone || rec?.id || '';
  const all    = num(rec?.total);
  const used   = num(rec?.occupied);
  const free   = num(rec?.free);
  const ts     = rec?.timestamp || new Date().toISOString();

  const carOcc  = num(rec?.['car-occ']);
  const carFree = num(rec?.['car-free']);
  const motoOcc = num(rec?.['motercycle-occ']);
  const motoFree= num(rec?.['motocycle-free']);
  const snap    = rec?.snap_link || '';

  return {
    zoneId,
    total: all,
    occupied: used,
    free,
    status: statusFromRatio(free, all),
    timestamp: ts,
    car: { occ: carOcc || 0, free: carFree || 0 },
    motorcycle: { occ: motoOcc || 0, free: motoFree || 0 },
    snapLink: snap,
    _raw: rec
  };
}

/** Fetch compact per-zone (with ?zone=) */
export async function fetchZoneRealtime(zoneId, { signal } = {}) {
  const url = `${API_PER_ZONE}?zone=${encodeURIComponent(zoneId)}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Zone ${zoneId} ${res.status}`);
  const json = await res.json();
  return normalizeCompact(zoneId, json);
}

/** Fetch all zones (array) and map to normalized objects */
export async function fetchAllZonesFlat({ signal } = {}) {
  const res = await fetch(API_PER_ZONE, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`All zones ${res.status}`);
  const arr = await res.json();
  if (!Array.isArray(arr)) throw new Error('All zones payload not array');
  return arr.map(normalizeArrayRecord);
}

/** Best-effort "rich" fetch for a zone:
 *  1) Try array-all-zones and pick the zone.
 *  2) Fallback to compact per-zone.
 */
export async function fetchZoneInfoRich(zoneId, { signal } = {}) {
  try {
    const all = await fetchAllZonesFlat({ signal });
    const rec = all.find((z) => z.zoneId === zoneId);
    if (rec) return rec;
  } catch (_) {}
  // fallback
  return fetchZoneRealtime(zoneId, { signal });
}

/** For the small pads ticker */
export async function fetchAllZones(zoneIds = ZONES_C2, { signal } = {}) {
  const rich = await fetchAllZonesFlat({ signal }).catch(() => null);
  if (Array.isArray(rich)) {
    // Return only requested zones in the same order
    return zoneIds.map((id) => rich.find((r) => r.zoneId === id) || ({
      zoneId: id, total: 0, occupied: 0, free: 0, status: 'red', timestamp: new Date().toISOString()
    }));
  }
  // fallback: hit per-zone
  const arr = await Promise.all(zoneIds.map(async (z) => {
    try { return await fetchZoneRealtime(z, { signal }); }
    catch (e) {
      return { zoneId: z, total: 0, occupied: 0, free: 0, status: 'red', timestamp: new Date().toISOString(), error: e.message };
    }
  }));
  return arr;
}

export async function fetchSummary({ signal } = {}) {
  const res = await fetch(API_SUMMARY, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Summary ${res.status}`);
  return res.json();
}
