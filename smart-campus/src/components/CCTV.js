import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CCTV.css';

const CameraIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="13" height="10" rx="2"/>
    <path d="M16 10l5-3v8l-5-3"/>
    <circle cx="9.5" cy="12" r="2.5"/>
  </svg>
);

const BuildingIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="8" width="7" height="13" rx="1"/>
    <path d="M6.5 7h0M6.5 11h0M6.5 15h0M17.5 11h0M17.5 14h0M17.5 17h0"/>
  </svg>
);

const PeopleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

/* Small control icons */
const PlayIcon = ({ size=16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>);
const PauseIcon = ({ size=16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>);
const VolumeIcon = ({ size=16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M5 10v4h4l5 4V6l-5 4H5z"/></svg>);
const MuteIcon = ({ size=16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12a4.5 4.5 0 0 0-3-4.243V6l-5 4H5v4h3.5l5 4v-1.757A4.5 4.5 0 0 0 16.5 12zM19 9l-2 2-2-2-1 1 2 2-2 2 1 1 2-2 2 2 1-1-2-2 2-2-1-1z"/></svg>);
const FullIcon = ({ size=16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm0-4h3V7h2V5H5v5h2zm10 7h-3v2h5v-5h-2v3zm0-12h-5v2h3v3h2V5z"/></svg>);
const FullExitIcon = ({ size=16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10H5V5h5v2H7v3zm7-3V5h5v5h-2V7h-3zm-2 9v2H7v-5h2v3h3zm5-3h2v5h-5v-2h3v-3z"/></svg>);
const PipIcon = ({ size=16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v14H3V5zm10 6h6v5h-6v-5z"/></svg>);
const GearIcon = ({ size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.4 13a7.95 7.95 0 0 0 .06-1 7.95 7.95 0 0 0-.06-1l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a8.12 8.12 0 0 0-1.73-1l-.38-2.65a.5.5 0 0 0-.5-.42h-4a.5.5 0 0 0-.5.42L9.05 4a8.12 8.12 0 0 0-1.73 1l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L4.56 11a7.95 7.95 0 0 0 0 2L2.35 14.7a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .6.22l2.49-1a8.12 8.12 0 0 0 1.73 1l.38 2.65a.5.5 0 0 0 .5.42h4a.5.5 0 0 0 .5-.42l.38-2.65a8.12 8.12 0 0 0 1.73-1l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64L19.4 13zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"/>
  </svg>
);

const BUILDINGS = ['E1','E2','E3','E4','C1','C2','C3','C5','AD1','AD2','AS','AV','F1','F2','F3','F4','F5','F6','F7'];

const CCTV = () => {
  const navigate = useNavigate();

  // Step: null = buildings, else cameras for building
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Building search (first page)
  const [buildingQuery, setBuildingQuery] = useState('');

  // Camera filters (second page)
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('All');        // Indoor / Outdoor
  const [status, setStatus] = useState('All');    // Online / Offline

  // Player overlay
  const [selectedCam, setSelectedCam] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const videoRef = useRef(null);
  const playerSheetRef = useRef(null);
  const snapshotCanvasRef = useRef(null);

  // Player UI state
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [bufferedPct, setBufferedPct] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isLoop, setIsLoop] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Helpers
  const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
  const fmt = (t) => {
    if (!isFinite(t)) return '0:00';
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    const m = Math.floor((t / 60) % 60).toString();
    const h = Math.floor(t / 3600);
    return h ? `${h}:${m.padStart(2,'0')}:${s}` : `${m}:${s}`;
  };

  // Catalog (mock) — swap with real API later
  const catalog = useMemo(() => {
    const rand = (a) => a[Math.floor(Math.random() * a.length)];
    const places = ['Entrance','Lobby','Corridor','Parking','Stairwell','Elevator','Perimeter','Backyard','Gate','Loading'];
    const zones  = ['Indoor','Outdoor'];
    const makeCams = (b) => {
      const n = 10 + Math.floor(Math.random() * 10);
      return Array.from({ length: n }, (_, i) => {
        const z = rand(zones);
        const id = `${b}-${String(i + 1).padStart(2,'0')}`;
        return { id, name: `${b} ${rand(places)}`, zone: z, status: Math.random() < 0.88 ? 'Online' : 'Offline' };
      });
    };
    const map = {};
    BUILDINGS.forEach(b => { map[b] = makeCams(b); });
    return map;
  }, []);

  // Students (mock live)
  const [students, setStudents] = useState(() => {
    const init = {};
    BUILDINGS.forEach(b => {
      let min = 220, max = 900;
      if (/^(E|F|AD)/.test(b)) { min = 600; max = 2000; }
      if (/^(C|AS|AV)/.test(b)) { min = 350; max = 1300; }
      init[b] = randInt(min, max);
    });
    return init;
  });
  useEffect(() => {
    const t = setInterval(() => {
      setStudents(prev => {
        const next = { ...prev };
        for (const b of BUILDINGS) {
          const mult = 0.97 + Math.random() * 0.06;
          next[b] = Math.max(0, Math.round(prev[b] * mult));
        }
        return next;
      });
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // Building cards
  const buildingCards = useMemo(() => {
    return BUILDINGS.map(b => {
      const cams = catalog[b] || [];
      const online = cams.filter(c => c.status === 'Online').length;
      const offline = cams.length - online;
      const onlinePct = cams.length ? Math.round((online / cams.length) * 100) : 0;
      return { code: b, total: cams.length, online, offline, onlinePct, students: students[b] || 0 };
    });
  }, [catalog, students]);

  // Totals KPI
  const totals = useMemo(() => {
    const cameras = buildingCards.reduce((a, b) => a + b.total, 0);
    const online  = buildingCards.reduce((a, b) => a + b.online, 0);
    const offline = buildingCards.reduce((a, b) => a + b.offline, 0);
    const people  = buildingCards.reduce((a, b) => a + b.students, 0);
    const uptime  = cameras ? Math.round((online / cameras) * 100) : 0;
    return { buildings: BUILDINGS.length, cameras, online, offline, students: people, uptime };
  }, [buildingCards]);

  // Visible buildings (first page search)
  const visibleBuildings = useMemo(() => {
    const q = (buildingQuery || '').trim().toLowerCase();
    if (!q) return buildingCards;
    return buildingCards.filter(b => b.code.toLowerCase().includes(q));
  }, [buildingCards, buildingQuery]);

  // Camera filters for selected building
  const filteredCams = useMemo(() => {
    if (!selectedBuilding) return [];
    const all = catalog[selectedBuilding] || [];
    const q = query.trim().toLowerCase();
    return all.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      const matchZone = zone === 'All' || c.zone === zone;
      const matchStatus = status === 'All' || c.status === status;
      return matchQ && matchZone && matchStatus;
    });
  }, [catalog, selectedBuilding, query, zone, status]);

  // Per-building KPI
  const perBld = useMemo(() => {
    if (!selectedBuilding) return null;
    return buildingCards.find(x => x.code === selectedBuilding) || null;
  }, [buildingCards, selectedBuilding]);

  // Stream URL mapping (demo)
  const getStreamUrl = (cam) =>
    cam?.status === 'Online'
      ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      : null;

  // Open/close player
  const openPlayer = (cam) => {
    const streamUrl = getStreamUrl(cam);
    setSelectedCam({ ...cam, building: selectedBuilding, streamUrl });
    setPlayerOpen(true);
    setIsPlaying(true);
    setMuted(true);
    setSpeed(1);
    setIsLoop(false);
    setCurrent(0);
    setDuration(0);
    setBufferedPct(0);
    setShowSettings(false);
  };
  const closePlayer = () => {
    setPlayerOpen(false);
    const v = videoRef.current;
    if (v) {
      try { v.pause(); } catch {}
      v.removeAttribute('src');
      v.load();
    }
    setSelectedCam(null);
  };

  // Player wiring
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playerOpen || !selectedCam?.streamUrl) return;

    v.muted = muted;
    v.volume = volume;
    v.loop = isLoop;
    v.playbackRate = speed;

    const onLoaded = () => { setDuration(v.duration || 0); };
    const onTime = () => {
      setCurrent(v.currentTime || 0);
      try {
        const buf = v.buffered;
        let end = 0;
        for (let i = 0; i < buf.length; i++) end = Math.max(end, buf.end(i));
        const pct = v.duration ? Math.min(100, (end / v.duration) * 100) : 0;
        setBufferedPct(pct || 0);
      } catch {}
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVol  = () => { setMuted(v.muted); setVolume(v.volume); };
    const onRate = () => setSpeed(v.playbackRate);

    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('progress', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('volumechange', onVol);
    v.addEventListener('ratechange', onRate);

    setPipSupported(!!document.pictureInPictureEnabled && typeof v.requestPictureInPicture === 'function');

    const playAttempt = v.play?.();
    if (playAttempt?.catch) playAttempt.catch(()=> setIsPlaying(false));

    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('progress', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('volumechange', onVol);
      v.removeEventListener('ratechange', onRate);
    };
  }, [playerOpen, selectedCam?.streamUrl, muted, volume, isLoop, speed]);

  // Fullscreen listener
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!playerOpen) return;
    const onKey = (e) => {
      const v = videoRef.current;
      if (!v) return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k': e.preventDefault(); v.paused ? v.play() : v.pause(); break;
        case 'm': v.muted = !v.muted; break;
        case 'arrowright': v.currentTime = Math.min(v.duration, v.currentTime + 5); break;
        case 'arrowleft': v.currentTime = Math.max(0, v.currentTime - 5); break;
        case 'arrowup': v.volume = Math.min(1, v.volume + 0.05); v.muted = false; break;
        case 'arrowdown': v.volume = Math.max(0, v.volume - 0.05); v.muted = v.volume === 0; break;
        case 'f': toggleFullscreen(); break;
        case 'i': togglePiP(); break;
        case '.': v.playbackRate = Math.min(2, (v.playbackRate || 1) + 0.25); break;
        case ',': v.playbackRate = Math.max(0.25, (v.playbackRate || 1) - 0.25); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playerOpen]);

  // Control handlers
  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    v.paused ? v.play() : v.pause();
  };
  const setVol = (val) => {
    const v = videoRef.current; if (!v) return;
    v.volume = val; v.muted = val === 0;
  };
  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted; };
  const seekTo = (sec) => {
    const v = videoRef.current; if (!v || !isFinite(v.duration)) return;
    v.currentTime = Math.max(0, Math.min(v.duration, sec));
  };
  const changeSpeed = (val) => { const v = videoRef.current; if (v) v.playbackRate = val; };
  const toggleLoop = () => {
    const v = videoRef.current; if (!v) return;
    v.loop = !v.loop; setIsLoop(v.loop);
  };
  const toggleFullscreen = () => {
    const el = playerSheetRef.current; if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.();
  };
  const togglePiP = async () => {
    try {
      const v = videoRef.current; if (!v) return;
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled) await v.requestPictureInPicture();
    } catch {}
  };
  const snapshot = () => {
    const v = videoRef.current, c = snapshotCanvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 1280, h = v.videoHeight || 720;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0, w, h);
    const url = c.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url;
    a.download = `${selectedCam?.id || 'camera'}_${new Date().toISOString().replace(/[:.]/g,'-')}.png`;
    a.click();
  };
  const copyUrl = () => { if (selectedCam?.streamUrl) navigator.clipboard?.writeText(selectedCam.streamUrl).catch(()=>{}); };

  return (
    <div className="cctv-page">
      {/* Top bar */}
      <header className="cctv-topbar">
        <button className="cctv-back-btn" onClick={() => navigate('/')}>Back</button>
        <div className="cctv-title">
          <CameraIcon size={18} />
          <span>CCTV on Campus</span>
          {selectedBuilding && <span className="bld-badge">{selectedBuilding}</span>}
        </div>
        <img src="/assets/mfu_logo.png" alt="MFU Logo" className="cctv-logo" />
      </header>

      {/* KPIs */}
      <section className="cctv-kpis">
        <div className="kpi-card"><div className="kpi-label">Buildings</div><div className="kpi-value">{totals.buildings}</div></div>
        <div className="kpi-card"><div className="kpi-label">Cameras</div><div className="kpi-value">{totals.cameras}</div></div>
        <div className="kpi-card ok"><div className="kpi-label">Online</div><div className="kpi-value">{totals.online}</div></div>
        <div className="kpi-card off"><div className="kpi-label">Offline</div><div className="kpi-value">{totals.offline}</div></div>
        <div className="kpi-card people"><div className="kpi-label">Students</div><div className="kpi-value">{totals.students.toLocaleString()}</div></div>
        <div className="kpi-card uptime"><div className="kpi-label">Active Cameras</div><div className="kpi-value">{totals.uptime}%</div></div>
      </section>

      {/* Filters */}
      {selectedBuilding ? (
        <section className="cctv-filters">
          <div className="cctv-search">
            <input
              type="text"
              placeholder={`Search cameras in ${selectedBuilding}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="cctv-selects">
            <select value={zone} onChange={(e) => setZone(e.target.value)}>
              <option>All</option><option>Indoor</option><option>Outdoor</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option><option>Online</option><option>Offline</option>
            </select>
            <button
              className="ghost-btn"
              onClick={() => {
                setSelectedBuilding(null);
                setQuery(''); setZone('All'); setStatus('All'); setBuildingQuery('');
              }}
            >
              ← All Buildings
            </button>
          </div>
        </section>
      ) : (
        <section className="cctv-filters">
          <div className="cctv-search">
            <input
              type="text"
              placeholder="Search building… (e.g., E1, F4)"
              value={buildingQuery}
              onChange={(e) => setBuildingQuery(e.target.value)}
            />
          </div>
          <div className="cctv-selects" />
        </section>
      )}

      {/* Content */}
      {!selectedBuilding ? (
        <section className="bld-grid">
          {visibleBuildings.map(b => (
            <button key={b.code} className="bld-card" onClick={() => setSelectedBuilding(b.code)} title={`Open ${b.code}`}>
              <div className="bld-head">
                <span className="bld-icon"><BuildingIcon size={16}/></span>
                <span className="bld-code">{b.code}</span>
              </div>
              <div className="bld-students">
                <div className="students-row">
                  <span className="students-label"><PeopleIcon /> Students</span>
                  <span className="students-value">{b.students.toLocaleString()}</span>
                </div>
                <div className="students-spark"><div className="spark-fill" style={{ width: `${40 + (b.students % 60)}%` }} /></div>
              </div>
              <div className="bld-counts">
                <span className="pill ok">{b.online} Online</span>
                <span className="pill off">{b.offline} Offline</span>
                <span className="pill neutral">{b.total} cams</span>
              </div>
              <div className="bld-progress">
                <div className="bar" style={{ width: `${b.onlinePct}%` }} />
                <div className="pct">{b.onlinePct}% online</div>
              </div>
            </button>
          ))}
          {visibleBuildings.length === 0 && <div className="empty"><p>No buildings match “{buildingQuery}”.</p></div>}
        </section>
      ) : (
        <>
          {perBld && (
            <div className="bld-stats-row">
              <div className="pill people big"><PeopleIcon /> {perBld.students.toLocaleString()} students</div>
              <div className="pill ok big">{perBld.online} online</div>
              <div className="pill off big">{perBld.offline} offline</div>
              <div className="pill neutral big">{perBld.total} cameras</div>
            </div>
          )}
          <section className="cctv-grid">
            {filteredCams.map((cam) => (
              <article
                className={`cam-card ${cam.status === 'Online' ? 'ok' : 'off'}`}
                key={cam.id}
                onClick={() => openPlayer(cam)}
                role="button"
                tabIndex={0}
                onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && openPlayer(cam)}
              >
                <div className="thumb">
                  <div className="stream-placeholder">
                    <div className="scanline" />
                    <div className="overlay"><CameraIcon size={18} /><span>{cam.status === 'Online' ? 'Live' : 'Offline'}</span></div>
                  </div>
                </div>
                <div className="meta">
                  <div className="left">
                    <h4 className="name">{cam.name}</h4>
                    <div className="sub"><span className="id">#{cam.id}</span><span className="sep">•</span><span className="zone">{cam.zone}</span></div>
                  </div>
                  <div className={`status ${cam.status === 'Online' ? 'ok' : 'off'}`}><span className="dot" />{cam.status}</div>
                </div>
                <div className="actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn" onClick={() => openPlayer(cam)}>View</button>
                  <button className="btn alt">Snapshot</button>
                </div>
              </article>
            ))}
            {filteredCams.length === 0 && <div className="empty"><p>No cameras match your filters.</p></div>}
          </section>
        </>
      )}

      {/* === PLAYER OVERLAY === */}
      {playerOpen && selectedCam && (
        <div className="player-overlay" role="dialog" aria-modal="true">
          <div className="player-sheet" ref={playerSheetRef}>
            {/* Head */}
            <div className="player-head">
              <div className="ph-left">
                <CameraIcon size={16} />
                <div className="ph-title">
                  <div className="ph-name">{selectedCam.name}</div>
                  <div className="ph-sub">
                    <span className="tag">{selectedCam.building}</span>
                    <span className="dot">•</span>
                    <span className="tag">#{selectedCam.id}</span>
                    <span className="dot">•</span>
                    <span className={`tag ${selectedCam.status === 'Online' ? 'ok' : 'off'}`}>{selectedCam.status}</span>
                    <span className="dot">•</span>
                    <span className="tag">{selectedCam.zone}</span>
                  </div>
                </div>
              </div>
              <div className="ph-right">
                <button className="player-close" onClick={closePlayer} aria-label="Close">×</button>
              </div>
            </div>

            {/* Stage + controls (YouTube-like) */}
            <div className={`player-stage ${selectedCam.status !== 'Online' ? 'offline' : ''}`}>
              {selectedCam.status === 'Online' && selectedCam.streamUrl ? (
                <>
                  <video
                    ref={videoRef}
                    className="player-video"
                    src={selectedCam.streamUrl}
                    controls={false}
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* Controls pinned at bottom */}
                  <div className="yt-controls">
                    {/* Scrubber */}
                    <div className="yt-progress">
                      <div className="track">
                        <div className="track-buffer" style={{ width: `${bufferedPct}%` }} />
                        <div className="track-played" style={{ width: `${duration ? (current / duration) * 100 : 0}%` }} />
                        <input
                          type="range"
                          min={0}
                          max={duration || 0}
                          step="0.1"
                          value={current}
                          onChange={(e)=> seekTo(parseFloat(e.target.value))}
                          aria-label="Seek"
                        />
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="yt-row">
                      <div className="yt-left">
                        {/* Single Play/Pause button (toggles icon) */}
                        <button className="icon-btn" onClick={togglePlay} title={isPlaying ? 'Pause (k)' : 'Play (k)'} aria-label="Play/Pause">
                          {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>

                        <button className="icon-btn" onClick={toggleMute} title={muted ? 'Unmute (m)' : 'Mute (m)'} aria-label="Mute">
                          {muted || volume === 0 ? <MuteIcon/> : <VolumeIcon/>}
                        </button>
                        <input
                          className="yt-volume"
                          type="range"
                          min="0" max="1" step="0.01"
                          value={muted ? 0 : volume}
                          onChange={(e)=> setVol(parseFloat(e.target.value))}
                          aria-label="Volume"
                        />

                        <span className="yt-time">{fmt(current)} <span className="sep">/</span> {fmt(duration)}</span>
                      </div>

                      <div className="yt-right">
                        {/* Settings */}
                        <div className="yt-settings-wrap">
                          <button className="icon-btn" onClick={()=> setShowSettings(v => !v)} title="Settings"><GearIcon/></button>
                          {showSettings && (
                            <div className="yt-settings" onMouseLeave={()=> setShowSettings(false)}>
                              <div className="yt-section-title">Playback</div>
                              <div className="yt-menu">
                                <div className="yt-item">
                                  <span>Speed</span>
                                  <select className="yt-dd" value={speed} onChange={(e)=> changeSpeed(parseFloat(e.target.value))}>
                                    <option value={0.25}>0.25×</option>
                                    <option value={0.5}>0.5×</option>
                                    <option value={0.75}>0.75×</option>
                                    <option value={1}>Normal</option>
                                    <option value={1.25}>1.25×</option>
                                    <option value={1.5}>1.5×</option>
                                    <option value={2}>2×</option>
                                  </select>
                                </div>
                                <div className="yt-item">
                                  <span>Loop</span>
                                  <label className="right"><input type="checkbox" checked={isLoop} onChange={toggleLoop}/> On</label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Extras */}
                        {pipSupported && (
                          <button className="icon-btn" onClick={togglePiP} title="Picture-in-Picture (i)" aria-label="Picture in Picture">
                            <PipIcon />
                          </button>
                        )}
                        <button className="icon-btn" onClick={snapshot} title="Snapshot" aria-label="Snapshot">
                          {/* reuse camera icon as filled */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="4"/></svg>
                        </button>
                        {selectedCam.streamUrl && (
                          <>
                            <button className="icon-btn" onClick={copyUrl} title="Copy stream URL" aria-label="Copy URL">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>
                            </button>
                            <a className="ghost-btn small" href={selectedCam.streamUrl} target="_blank" rel="noreferrer">Open</a>
                          </>
                        )}
                        <button className="icon-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen (f)' : 'Fullscreen (f)'} aria-label="Fullscreen">
                          {isFullscreen ? <FullExitIcon/> : <FullIcon/>}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="offline-wrap">
                  <div className="offline-badge">Offline</div>
                  <p>This camera is currently unavailable.</p>
                </div>
              )}
            </div>
          </div>

          {/* hidden canvas for snapshot */}
          <canvas ref={snapshotCanvasRef} style={{ display:'none' }} />
          <div className="player-backdrop" onClick={closePlayer} />
        </div>
      )}
    </div>
  );
};

export default CCTV;
