import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CCTV.css';

/* ===== Icons ===== */
const CameraIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="13" height="10" rx="2"/>
    <path d="M16 10l5-3v8l-5-3"/>
    <circle cx="9.5" cy="12" r="2.5"/>
  </svg>
);
const BuildingIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="8" width="7" height="13" rx="1"/>
    <path d="M6.5 7h0M6.5 11h0M6.5 15h0M17.5 11h0M17.5 14h0M17.5 17h0"/>
  </svg>
);
const PeopleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

/* Player icons */
const PlayIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>);
const PauseIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>);
const VolumeIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M5 10v4h4l5 4V6l-5 4H5z"/><path d="M16 8a5 5 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="2"/></svg>);
const MuteIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24"><path fill="currentColor" d="M5 10v4h4l5 4V6l-5 4H5z"/><path d="M19 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const FullIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm0-4h3V7h2V5H5v5h2zm10 7h-3v2h5v-5h-2v3zm0-12h-5v2h3v3h2V5z"/></svg>);
const FullExitIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10H5V5h5v2H7v3zm7-3V5h5v5h-2V7h-3zm-2 9v2H7v-5h2v3h3zm5-3h2v5h-5v-2h3v-3z"/></svg>);
const PipIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" opacity=".7"/><rect x="12" y="10" width="7" height="5" rx="1.2" fill="#fff"/></svg>);
const GearIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13a7.95 7.95 0 0 0 .06-1 7.95 7.95 0 0 0-.06-1l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a8.12 8.12 0 0 0-1.73-1l-.38-2.65a.5.5 0 0 0-.5-.42h-4a.5.5 0 0 0-.5.42L9.05 4a8.12 8.12 0 0 0-1.73 1l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L4.56 11a7.95 7.95 0 0 0 0 2L2.35 14.7a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .6.22l2.49 1a8.12 8.12 0 0 0 1.73 1l.38 2.65a.5.5 0 0 0 .5.42h4a.5.5 0 0 0 .5-.42l.38-2.65a8.12 8.12 0 0 0 1.73-1l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64L19.4 13zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"/></svg>);

/* ===== Data ===== */
const BUILDINGS = ['E1','E2','E3','E4','C1','C2','C3','C5','AD1','AD2','AS','AV','F1','F2','F3','F4','F5','F6','F7'];

const CCTV = () => {
  const navigate = useNavigate();

  /* Theme (Dark/Light) */
  const [theme, setTheme] = useState(() => localStorage.getItem('cctv-theme') || 'dark');
  useEffect(() => localStorage.setItem('cctv-theme', theme), [theme]);

  /* Keep Eyes mode (grid video previews) */
  const [keepEyes, setKeepEyes] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingQuery, setBuildingQuery] = useState('');
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('All');
  const [status, setStatus] = useState('All');

  // Player overlay
  const [selectedCam, setSelectedCam] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const snapshotCanvasRef = useRef(null);

  // Player UI
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
  const [useCrossOrigin, setUseCrossOrigin] = useState(true);

  const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
  const fmt = (t) => {
    if (!isFinite(t)) return '0:00';
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    const m = Math.floor((t / 60) % 60).toString();
    const h = Math.floor(t / 3600);
    return h ? `${h}:${m.padStart(2,'0')}:${s}` : `${m}:${s}`;
  };

  /* Mock catalog */
  const catalog = useMemo(() => {
    const rand = (a) => a[Math.floor(Math.random() * a.length)];
    const places = ['Entrance','Lobby','Corridor','Parking','Stairwell','Elevator','Perimeter','Backyard','Gate','Loading'];
    const zones  = ['Indoor','Outdoor'];
    const makeCams = (b) => {
      const n = 12;
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
        for (const b of BUILDINGS) next[b] = Math.max(0, Math.round(prev[b] * (0.97 + Math.random() * 0.06)));
        return next;
      });
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const buildingCards = useMemo(() => {
    return BUILDINGS.map(b => {
      const cams = catalog[b] || [];
      const online = cams.filter(c => c.status === 'Online').length;
      const offline = cams.length - online;
      const onlinePct = cams.length ? Math.round((online / cams.length) * 100) : 0;
      return { code: b, total: cams.length, online, offline, onlinePct, students: students[b] || 0 };
    });
  }, [catalog, students]);

  const totals = useMemo(() => {
    const cameras = buildingCards.reduce((a, b) => a + b.total, 0);
    const online  = buildingCards.reduce((a, b) => a + b.online, 0);
    const offline = buildingCards.reduce((a, b) => a + b.offline, 0);
    const people  = buildingCards.reduce((a, b) => a + b.students, 0);
    const uptime  = cameras ? Math.round((online / cameras) * 100) : 0;
    return { buildings: BUILDINGS.length, cameras, online, offline, students: people, uptime };
  }, [buildingCards]);

  const visibleBuildings = useMemo(() => {
    const q = (buildingQuery || '').trim().toLowerCase();
    if (!q) return buildingCards;
    return buildingCards.filter(b => b.code.toLowerCase().includes(q));
  }, [buildingCards, buildingQuery]);

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

  const perBld = useMemo(() => {
    if (!selectedBuilding) return null;
    return buildingCards.find(x => x.code === selectedBuilding) || null;
  }, [buildingCards, selectedBuilding]);

  const getStreamUrl = (cam) =>
    cam?.status === 'Online'
      ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      : null;

  const openPlayer = (cam) => {
    const streamUrl = getStreamUrl(cam);
    setSelectedCam({ ...cam, building: selectedBuilding, streamUrl });
    setUseCrossOrigin(true);
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
    if (v) { try { v.pause(); } catch {} v.removeAttribute('src'); v.load(); }
    setSelectedCam(null);
  };

  /* Player wiring */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playerOpen || !selectedCam?.streamUrl) return;

    v.muted = muted; v.volume = volume; v.loop = isLoop; v.playbackRate = speed;

    const onLoaded = () => setDuration(v.duration || 0);
    const onTime   = () => {
      setCurrent(v.currentTime || 0);
      try {
        const buf = v.buffered; let end = 0;
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
    v.play?.().catch(()=> setIsPlaying(false));

    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('progress', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('volumechange', onVol);
      v.removeEventListener('ratechange', onRate);
    };
  }, [playerOpen, selectedCam?.streamUrl, muted, volume, isLoop, speed, useCrossOrigin]);

  /* Fullscreen listeners (incl. iOS video fullscreen) */
  useEffect(() => {
    const onFs = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      const v = videoRef.current;
      const iosVideoFS = v && (v.webkitDisplayingFullscreen === true);
      setIsFullscreen(!!(fsEl || iosVideoFS));
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    document.addEventListener('MSFullscreenChange', onFs);

    const v = videoRef.current;
    const onIOSBegin = () => setIsFullscreen(true);
    const onIOSEnd = () => setIsFullscreen(false);
    if (v) {
      v.addEventListener('webkitbeginfullscreen', onIOSBegin);
      v.addEventListener('webkitendfullscreen', onIOSEnd);
    }
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      document.removeEventListener('MSFullscreenChange', onFs);
      if (v) {
        v.removeEventListener('webkitbeginfullscreen', onIOSBegin);
        v.removeEventListener('webkitendfullscreen', onIOSEnd);
      }
    };
  }, []);

  /* Keyboard */
  useEffect(() => {
    if (!playerOpen) return;
    const onKey = (e) => {
      const v = videoRef.current; if (!v) return;
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

  /* Controls */
  const togglePlay = () => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause(); };
  const setVol = (val) => { const v = videoRef.current; if (v) { v.volume = val; v.muted = val === 0; } };
  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted; };
  const seekTo = (sec) => { const v = videoRef.current; if (v && isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(v.duration, sec)); };
  const changeSpeed = (val) => { const v = videoRef.current; if (v) v.playbackRate = val; };
  const toggleLoop = () => { const v = videoRef.current; if (v) { v.loop = !v.loop; setIsLoop(v.loop); } };

  const toggleFullscreen = async () => {
    try {
      const stage = stageRef.current;
      const v = videoRef.current;
      const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      if (!inFS) {
        if (stage?.requestFullscreen) await stage.requestFullscreen();
        else if (stage?.webkitRequestFullscreen) stage.webkitRequestFullscreen();
        else if (stage?.msRequestFullscreen) stage.msRequestFullscreen();
        else if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        else if (v?.webkitExitFullscreen) v.webkitExitFullscreen();
      }
    } catch {}
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
    const ctx = c.getContext('2d');
    try {
      ctx.drawImage(v, 0, 0, w, h);
      const url = c.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url;
      a.download = `${selectedCam?.id || 'camera'}_${new Date().toISOString().replace(/[:.]/g,'-')}.png`;
      a.click();
    } catch {
      alert('Snapshot blocked by browser. Enable CORS on the video server and keep crossOrigin="anonymous".');
    }
  };

  const copyUrl = () => { if (selectedCam?.streamUrl) navigator.clipboard?.writeText(selectedCam.streamUrl).catch(()=>{}); };

  const handleVideoError = () => {
    const v = videoRef.current;
    if (useCrossOrigin) {
      setUseCrossOrigin(false);
      if (v) {
        const src = selectedCam?.streamUrl || '';
        v.removeAttribute('src'); v.load();
        setTimeout(() => { if (v) { v.src = src; v.load(); v.play?.().catch(()=>{}); } }, 0);
      }
    }
  };

  return (
    <div className={`cctv-page ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      {/* Top bar */}
      <header className="cctv-topbar">
        <button className="cctv-back-btn" onClick={() => navigate('/')}>Back</button>

        <div className="cctv-title">
          <img src="/assets/logo.png" alt="MFU Logo" className="cctv-logo" />
          <span>CCTV on Campus</span>
          {selectedBuilding && <span className="bld-badge">{selectedBuilding}</span>}
        </div>

        {/* Theme switch (right side) */}
        <div className="topbar-right">
          <span className="switch-text">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
          <label className="switch theme-toggle">
            <input
              type="checkbox"
              checked={theme === 'light'}
              onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
              aria-label="Toggle dark / light mode"
            />
            <span className="slider round"></span>
          </label>
        </div>
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
              onClick={() => { setSelectedBuilding(null); setQuery(''); setZone('All'); setStatus('All'); setBuildingQuery(''); }}
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
              <div className="bld-stats-left">
                <div className="pill people big"><PeopleIcon /> {perBld.students.toLocaleString()} students</div>
                <div className="pill ok big">{perBld.online} online</div>
                <div className="pill off big">{perBld.offline} offline</div>
                <div className="pill neutral big">{perBld.total} cameras</div>
              </div>

              {/* Keep Eyes switch on the right side */}
              <div className="bld-stats-right">
                <span className="switch-text">{keepEyes ? 'Keep Eyes' : 'Normal'}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={keepEyes}
                    onChange={(e) => setKeepEyes(e.target.checked)}
                    aria-label="Toggle Keep Eyes grid previews"
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          )}

          {/* Camera tiles */}
          <section className={`cctv-grid ${keepEyes ? 'eyes-on' : ''}`}>
            {filteredCams.map((cam) => {
              const safeName = (cam?.name && cam.name.trim()) ? cam.name : `${selectedBuilding} #${cam?.id}`;
              const live = cam.status === 'Online';
              const streamUrl = live ? getStreamUrl(cam) : null;

              if (!keepEyes) {
                /* NORMAL MODE CARD */
                return (
                  <article
                    className={`cam-card ${live ? 'ok' : 'off'}`}
                    key={cam.id}
                    onClick={() => openPlayer(cam)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && openPlayer(cam)}
                  >
                    <div className="thumb">
                      <div className="stream-placeholder">
                        <div className="scanline" />
                        <div className={`overlay ${live ? 'live' : 'offline'}`}>
                          <CameraIcon size={18} />
                          <span>{live ? 'Live' : 'Offline'}</span>
                        </div>
                        <div className="thumb-title" title={`${safeName} • #${cam.id}`}>
                          <span className="thumb-name">{safeName}</span>
                          <span className="thumb-id">#{cam.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="cf-left">
                        <div className="cf-name" title={safeName}>{safeName}</div>
                        <div className="cf-sub" title={`#${cam.id} • ${cam.zone}`}>
                          <span className="cf-id">#{cam.id}</span>
                          <span className="cf-sep">•</span>
                          <span className="cf-zone">{cam.zone}</span>
                        </div>
                      </div>
                      <div className={`cf-status ${live ? 'ok' : 'off'}`}>{cam.status}</div>
                    </div>
                  </article>
                );
              }

              /* KEEP EYES MODE CARD */
              return (
                <article
                  key={cam.id}
                  className={`cam-card keep-eyes ${live ? 'ok' : 'off'}`}
                  onClick={() => openPlayer(cam)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && openPlayer(cam)}
                  title={safeName}
                >
                  <div className="eyes-thumb" data-status={live ? 'live' : 'offline'}>
                    {live && streamUrl ? (
                      <>
                        <video
                          className="eyes-video"
                          src={streamUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                        <div className="eyes-badge live">LIVE</div>
                        {/* CCTV corner markers + glare */}
                        <span className="cctv-corner tl" />
                        <span className="cctv-corner tr" />
                        <span className="cctv-corner bl" />
                        <span className="cctv-corner br" />
                        <span className="cctv-glare" />
                      </>
                    ) : (
                      <div className="no-signal">
                        <div className="no-signal-wrap">
                          <div className="no-signal-bars" />
                          <div className="no-signal-text">NO SIGNAL</div>
                        </div>
                        <span className="cctv-corner tl" />
                        <span className="cctv-corner tr" />
                        <span className="cctv-corner bl" />
                        <span className="cctv-corner br" />
                        <span className="cctv-glare" />
                      </div>
                    )}
                  </div>

                  {/* Name OUTSIDE the video container */}
                  <div className="eyes-name" title={`${safeName} • #${cam.id}`}>{safeName}</div>

                  <div className="eyes-footer">
                    <div className="eyes-meta" title={`${safeName} • ${cam.zone}`}>
                      <span className="eyes-id">#{cam.id}</span>
                      <span className="cf-sep">•</span>
                      <span className="eyes-zone">{cam.zone}</span>
                    </div>
                    <div className={`cf-status ${live ? 'ok' : 'off'}`}>{cam.status}</div>
                  </div>
                </article>
              );
            })}
            {filteredCams.length === 0 && <div className="empty"><p>No cameras match your filters.</p></div>}
          </section>
        </>
      )}

      {/* === PLAYER OVERLAY === */}
      {playerOpen && selectedCam && (
        <div className="player-overlay" role="dialog" aria-modal="true">
          <div className="player-sheet">
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
              <button className="player-close" onClick={closePlayer} aria-label="Close">×</button>
            </div>

            <div className={`player-stage ${selectedCam.status !== 'Online' ? 'offline' : ''}`} ref={stageRef}>
              {selectedCam.status === 'Online' && selectedCam.streamUrl ? (
                <>
                  <video
                    key={`video-${useCrossOrigin ? 'cors' : 'nocors'}`}
                    ref={videoRef}
                    className="player-video"
                    src={selectedCam.streamUrl}
                    controls={false}
                    autoPlay
                    playsInline
                    muted
                    preload="auto"
                    {...(useCrossOrigin ? { crossOrigin: 'anonymous' } : {})}
                    onError={handleVideoError}
                  />

                  <div className="yt-controls">
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

                    <div className="yt-row">
                      <div className="yt-left">
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

                        {pipSupported && (
                          <button className="icon-btn" onClick={togglePiP} title="Picture-in-Picture (i)" aria-label="Picture in Picture">
                            <PipIcon />
                          </button>
                        )}
                        <button className="icon-btn" onClick={snapshot} title="Snapshot" aria-label="Snapshot">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="4" fill="#fff"/>
                          </svg>
                        </button>
                        {selectedCam.streamUrl && (
                          <button className="icon-btn" onClick={copyUrl} title="Copy stream URL" aria-label="Copy URL">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
                            </svg>
                          </button>
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

          <canvas ref={snapshotCanvasRef} style={{ display:'none' }} />
          <div className="player-backdrop" onClick={closePlayer} />
        </div>
      )}
    </div>
  );
};

export default CCTV;
