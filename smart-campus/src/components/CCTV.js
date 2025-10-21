// CCTV.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CCTV.css';

/* ===== Icons ===== */
const CameraIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 10l5-3v8l-5-3"/><circle cx="9.5" cy="12" r="2.5"/>
  </svg>
);
const BuildingIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="8" width="7" height="13" rx="1"/>
    <path d="M6.5 7h0M6.5 11h0M6.5 15h0M17.5 11h0M17.5 14h0M17.5 17h0"/>
  </svg>
);

const Play = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>);
const Pause = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>);
const Vol  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 10v4h4l5 4V6l-5 4H5z"/><path d="M16 8a5 5 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="2"/></svg>);
const Mute = () => (<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M5 10v4h4l5 4V6l-5 4H5z"/><path d="M19 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const Full = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm0-4h3V7h2V5H5v5h2zm10 7h-3v2h5v-5h-2v3zm0-12h-5v2h3v3h2V5z"/></svg>);
const FullX= () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10H5V5h5v2H7v3zm7-3V5h5v5h-2V7h-3zm-2 9v2H7v-5h2v3h3zm5-3h2v5h-5v-2h3v-3z"/></svg>);
const Open = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"/><path d="M5 5h6v2H7v10h10v-4h2v6H5z"/></svg>);
const LinkIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5zm6-1h4v2h-4v-2zm5.1-4h3a5 5 0 0 1 0 10h-3v-2h3a3 3 0 0 0 0-6h-3V7z"/></svg>);

/* ===== YouTube helpers (nocookie + hard-suppressed chrome) ===== */
const isYouTube = (url) => /youtu\.?be|youtube\.com/i.test(url || '');
const youtubeIdFromUrl = (url) => {
  if (!url) return null;
  const m1 = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  const m2 = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  const m3 = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  return (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || null;
};
/* CCTV-skin: zero controls, no FS button, no kb, privacy domain */
const ytEmbedSrc = (url, { autoplay = 1, mute = 1, loop = 1 } = {}) => {
  const id = youtubeIdFromUrl(url);
  if (!id) return null;
  const base = `https://www.youtube-nocookie.com/embed/${id}`;
  const params = new URLSearchParams({
    autoplay: String(autoplay),
    mute: String(mute),
    loop: String(loop),
    playlist: id,
    controls: '0',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    fs: '0',
    disablekb: '1',
    playsinline: '1',
    cc_load_policy: '0',
    origin: window.location.origin
  }).toString();
  return `${base}?${params}`;
};

/* ===== Data ===== */
const BUILDINGS = ['E1','E2','E3','E4','C1','C2','C3','C5','AD1','AD2','AS','AV','F1','F2','F3','F4','F5','F6','F7','Campus Area'];
const prettyId = (bCode, n) => `${bCode === 'Campus Area' ? 'CAMP' : bCode}-${String(n).padStart(2,'0')}`;

export default function CCTV(){
  const navigate = useNavigate();

  /* Theme */
  const [theme, setTheme] = useState(() => localStorage.getItem('cctv-theme') || 'dark');
  useEffect(() => { localStorage.setItem('cctv-theme', theme); }, [theme]);

  /* Page */
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  /* Modes (hidden on All Buildings) */
  const [keepEyes, setKeepEyes] = useState(false);

  /* Filters */
  const [buildingQuery, setBuildingQuery] = useState('');
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('All');
  const [status, setStatus] = useState('All');

  /* Player */
  const [selectedCam, setSelectedCam] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const videoRef = useRef(null);
  const stageRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useCrossOrigin, setUseCrossOrigin] = useState(true);

  /* YouTube mute for our skin */
  const [ytMuted, setYtMuted] = useState(false);

  /* OSD Clock */
  const stamp = () => {
    const d = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const pad = (n)=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${tz}`;
  };
  const [clock, setClock] = useState(stamp());
  useEffect(()=>{ const t=setInterval(()=>setClock(stamp()),1000); return ()=>clearInterval(t); },[]);

  /* Catalog (mock) */
  const catalog = useMemo(() => {
    const places = ['Entrance','Lobby','Corridor','Parking','Stairwell','Elevator','Perimeter','Back Gate','Loading Bay','Atrium'];
    const zones  = ['Indoor','Outdoor'];
    const toBitrate = i => `${3200 + (i%7)*450}kbps`;

    const make = (b) => Array.from({length:12}, (_,i)=>({
      id: prettyId(b, i+1),
      name: `${places[i%places.length]}`,
      zone: zones[i%2],
      status: i % 4 === 2 ? 'Offline' : 'Online',
      res: ['1920×1080','2560×1440','3840×2160'][i%3],
      fps: [20,25,30][i%3],
      bitrate: toBitrate(i),
      building: b,
    }));

    const map = {};
    BUILDINGS.forEach(b => map[b]=make(b));

    /* Campus Area overrides (YouTube + naming + zones) */
    const camp = map['Campus Area'];
    camp[0] = { ...camp[0], streamUrl: 'https://youtu.be/J_loYa0UiSU', status: 'Online', name:'Lan Thong Tample', zone:'Outdoor' };
    camp[1] = { ...camp[1], streamUrl: 'https://youtu.be/hlyH0ZocSvo', status: 'Online', name:'Lan Dao', zone:'Outdoor' };
    camp[2] = { ...camp[2], streamUrl: 'https://youtu.be/Kryb_9itDbY',  status: 'Online', name:'Campus Road', zone:'Outdoor' };

    return map;
  }, []);

  /* KPIs */
  const [students] = useState(() => {
    const s = {}; BUILDINGS.forEach(b => s[b]=1500+(Math.abs(b.charCodeAt(0)-67)*137)%1800); return s;
  });

  const buildingCards = useMemo(() => BUILDINGS.map(b => {
    const cams = catalog[b] || [];
    const online = cams.filter(c=>c.status==='Online').length;
    const offline = cams.length - online;
    const onlinePct = cams.length ? Math.round(online/cams.length*100) : 0;
    return { code:b, total:cams.length, online, offline, onlinePct, students: students[b]||0 };
  }), [catalog, students]);

  const totals = useMemo(() => {
    const sum = (fn)=>buildingCards.reduce((a,b)=>a+fn(b),0);
    const cameras = sum(b=>b.total);
    const online  = sum(b=>b.online);
    const offline = sum(b=>b.offline);
    const people  = sum(b=>b.students);
    const uptime  = cameras ? Math.round(online/cameras*100) : 0;
    return { buildings:BUILDINGS.length, cameras, online, offline, students:people, uptime };
  }, [buildingCards]);

  /* Filtering */
  const visibleBuildings = useMemo(() => {
    const q = (buildingQuery||'').trim().toLowerCase();
    if (!q) return buildingCards;
    return buildingCards.filter(b => b.code.toLowerCase().includes(q));
  }, [buildingCards, buildingQuery]);

  const filteredCams = useMemo(() => {
    if (!selectedBuilding) return [];
    const all = catalog[selectedBuilding] || [];
    const q = (query||'').trim().toLowerCase();
    return all.filter(c=>{
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      const matchZ = zone==='All' || c.zone===zone;
      const matchS = status==='All' || c.status===status;
      return matchQ && matchZ && matchS;
    });
  }, [catalog, selectedBuilding, query, zone, status]);

  const perBld = useMemo(()=> selectedBuilding ? buildingCards.find(x=>x.code===selectedBuilding) : null, [buildingCards, selectedBuilding]);

  /* Streams */
  const getStreamUrl = (cam) => {
    if (!cam) return null;
    if (cam.streamUrl) return cam.streamUrl;
    return cam.status==='Online' ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null;
  };

  const openPlayer = (cam) => {
    const streamUrl = getStreamUrl(cam);
    setSelectedCam({ ...cam, streamUrl });
    setUseCrossOrigin(true);
    setYtMuted(false);
    setPlayerOpen(true);
    setIsPlaying(true);
    setMuted(false);
    setDuration(0);
    setCurrent(0);
  };
  const closePlayer = () => {
    setPlayerOpen(false);
    const v = videoRef.current;
    if (v) { try { v.pause(); } catch{} v.removeAttribute('src'); v.load(); }
    setSelectedCam(null);
  };

  /* Player wiring (HTML5 only) */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playerOpen || !selectedCam?.streamUrl || isYouTube(selectedCam.streamUrl)) return;
    v.muted = muted; v.volume = volume;
    const onLoaded = () => setDuration(v.duration||0);
    const onTime   = () => setCurrent(v.currentTime||0);
    const onPlay   = () => setIsPlaying(true);
    const onPause  = () => setIsPlaying(false);

    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.play?.().catch(()=>setIsPlaying(false));
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [playerOpen, selectedCam?.streamUrl, muted, volume]);

  /* Fullscreen */
  useEffect(() => {
    const onFs = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    document.addEventListener('MSFullscreenChange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      document.removeEventListener('MSFullscreenChange', onFs);
    };
  }, []);

  /* Player controls */
  const togglePlay = () => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause(); };
  const setVol = (val) => { const v = videoRef.current; if (v) { v.volume = val; setMuted(val===0); } };
  const toggleMute = () => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } };
  const seekTo = (sec) => { const v = videoRef.current; if (v && Number.isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(v.duration, sec)); };

  const toggleFullscreen = async () => {
    try{
      const stage = stageRef.current;
      const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      if (!inFS) {
        if (stage?.requestFullscreen) await stage.requestFullscreen();
        else if (stage?.webkitRequestFullscreen) stage.webkitRequestFullscreen();
        else if (stage?.msRequestFullscreen) stage.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
    }catch{}
  };

  const handleVideoError = () => {
    const v = videoRef.current;
    if (useCrossOrigin) {
      setUseCrossOrigin(false);
      if (v) {
        const src = selectedCam?.streamUrl || '';
        v.removeAttribute('src'); v.load();
        setTimeout(()=>{ if (v) { v.src = src; v.load(); v.play?.().catch(()=>{}); }},0);
      }
    }
  };

  /* Snapshot (HTML5 only) */
  const snapshot = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    const w = v.videoWidth || 1280, h = v.videoHeight || 720;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    try{
      ctx.drawImage(v, 0, 0, w, h);
      const url = c.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url;
      a.download = `${selectedCam?.id || 'camera'}_${new Date().toISOString().replace(/[:.]/g,'-')}.png`;
      a.click();
    }catch{
      alert('Snapshot blocked by browser. Enable CORS on the video server.');
    }
  };

  const copyUrl = () => { if (selectedCam?.streamUrl) navigator.clipboard?.writeText(selectedCam.streamUrl).catch(()=>{}); };

  return (
    <div className={`cctv-page ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      {/* Topbar */}
      <header className="topbar">
        <button className="btn-back" onClick={() => navigate('/')}>Back</button>

        <div className="brand">
          <img src="/assets/logo.png" alt="MFU" className="logo" />
          <span className="title">CCTV Monitoring</span>
          {selectedBuilding && <span className="badge">{selectedBuilding}</span>}
        </div>

        <div className="top-actions">
          {selectedBuilding && (
            <div className="seg">
              <button className={`seg-btn ${!keepEyes ? 'active' : ''}`} onClick={()=> setKeepEyes(false)} aria-pressed={!keepEyes}>Normal</button>
              <button className={`seg-btn ${keepEyes ? 'active' : ''}`} onClick={()=> setKeepEyes(true)}  aria-pressed={keepEyes}>Keep Eyes</button>
            </div>
          )}

          <span className="switch-label">{theme === 'light' ? 'Light' : 'Dark'}</span>
          <label className="switch">
            <input type="checkbox" checked={theme === 'light'} onChange={(e)=> setTheme(e.target.checked ? 'light':'dark')} />
            <span className="slider round" />
          </label>
        </div>
      </header>

      {/* KPIs */}
      <section className="kpis">
        <div className="kpi"><div className="kpi-l">Buildings</div><div className="kpi-v">{totals.buildings}</div></div>
        <div className="kpi"><div className="kpi-l">Cameras</div><div className="kpi-v">{totals.cameras}</div></div>
        <div className="kpi ok"><div className="kpi-l">Online</div><div className="kpi-v">{totals.online}</div></div>
        <div className="kpi off"><div className="kpi-l">Offline</div><div className="kpi-v">{totals.offline}</div></div>
        <div className="kpi people"><div className="kpi-l">Students</div><div className="kpi-v">{totals.students.toLocaleString()}</div></div>
        <div className="kpi uptime"><div className="kpi-l">Active Cameras</div><div className="kpi-v">{totals.uptime}%</div></div>
      </section>

      {/* Filters */}
      {selectedBuilding ? (
        <section className="filters">
          <div className="search">
            <input
              type="text"
              placeholder={`Search cameras in ${selectedBuilding}…`}
              value={query}
              onChange={(e)=> setQuery(e.target.value)}
            />
          </div>
          <div className="filter-right">
            <select value={zone} onChange={(e)=> setZone(e.target.value)}>
              <option>All</option><option>Indoor</option><option>Outdoor</option>
            </select>
            <select value={status} onChange={(e)=> setStatus(e.target.value)}>
              <option>All</option><option>Online</option><option>Offline</option>
            </select>
            <button className="btn-ghost" onClick={()=>{ setSelectedBuilding(null); setQuery(''); setZone('All'); setStatus('All'); setBuildingQuery(''); }}>
              ← All Buildings
            </button>
          </div>
        </section>
      ):(
        <section className="filters">
          <div className="search">
            <input
              type="text"
              placeholder="Search building… (e.g., E2, F4, Campus)"
              value={buildingQuery}
              onChange={(e)=> setBuildingQuery(e.target.value)}
            />
          </div>
          <div className="filter-right" />
        </section>
      )}

      {/* Content */}
      {!selectedBuilding ? (
        <section className="bld-grid">
          {visibleBuildings.map(b=>(
            <button key={b.code} className="bld-card" onClick={()=> setSelectedBuilding(b.code)} title={`Open ${b.code}`}>
              <div className="bld-h">
                <span className="bld-ico"><BuildingIcon/></span>
                <span className="bld-code">{b.code}</span>
              </div>
              <div className="bld-row">
                <span className="tag">👥 {b.students.toLocaleString()} students</span>
                <span className="tag ok">{b.online} online</span>
                <span className="tag off">{b.offline} offline</span>
                <span className="tag">{b.total} cameras</span>
              </div>
              <div className="bld-bar"><div className="bld-bar-fill" style={{width:`${b.onlinePct}%`}}/></div>
              <div className="bld-bar-meta">{b.onlinePct}% online</div>
            </button>
          ))}
          {visibleBuildings.length===0 && <div className="empty">No buildings match “{buildingQuery}”.</div>}
        </section>
      ):(
        <>
          {perBld && (
            <div className="bld-summary">
              <span className="tag">👥 {perBld.students.toLocaleString()} students</span>
              <span className="tag ok">{perBld.online} online</span>
              <span className="tag off">{perBld.offline} offline</span>
              <span className="tag">{perBld.total} cameras</span>
            </div>
          )}

          <section className={`cam-grid ${keepEyes ? 'eyes-on' : ''}`}>
            {filteredCams.map(cam=>{
              const live = cam.status==='Online';
              const streamUrl = getStreamUrl(cam);
              const isYT = isYouTube(streamUrl);

              if (!keepEyes) {
                /* NORMAL MODE — tidy info (no moving preview) */
                return (
                  <article key={cam.id} className={`cam ${live ? 'ok':'off'}`} onClick={()=> openPlayer(cam)} title={`${cam.name} • ${cam.id}`}>
                    <div className="tile tile-normal" tabIndex={0}>
                      <div className="tile-head">
                        <span className={`pill ${live?'pill-live':'pill-off'}`}><CameraIcon/> {live?'Live':'Offline'}</span>
                      </div>
                      <div className="osd-clock">{clock}</div>
                      <div className="name-box">
                        <div className="cam-name">{cam.name}</div>
                        <div className="cam-sub">#{cam.id} • {cam.zone}</div>
                      </div>
                      <div className="spec-ribbon">
                        <span className={`tag-rec ${live?'on':'off'}`}>{live?'REC':'NO SIG'}</span>
                        <span className="spec"> {cam.res} </span>
                        <span className="spec"> @ {cam.fps}fps </span>
                        <span className="spec"> • {cam.bitrate}</span>
                      </div>
                    </div>
                  </article>
                );
              }

              /* KEEP EYES MODE — live preview with CCTV skin even for YouTube */
              return (
                <article key={cam.id} className={`cam ${live ? 'ok':'off'}`} onClick={()=> openPlayer(cam)} title={`${cam.name} • ${cam.id}`}>
                  <div className="tile tile-eyes" tabIndex={0}>
                    <div className="tile-eyes-media yt-skin">
                      {live && streamUrl ? (
                        isYT ? (
                          <iframe
                            className="eyes-yt"
                            src={ytEmbedSrc(streamUrl, { autoplay: 1, mute: 1, loop: 1 })}
                            title={`${cam.name} (YouTube)`}
                            allow="autoplay; picture-in-picture; clipboard-write; encrypted-media"
                            frameBorder="0"
                            allowFullScreen={false}
                          />
                        ) : (
                          <video className="eyes-video" src={streamUrl} autoPlay loop muted playsInline />
                        )
                      ) : (
                        <div className="no-signal"><span>NO SIGNAL</span></div>
                      )}
                      <div className={`pill-lite ${live ? 'on':'off'}`}>{live?'Live':'Offline'}</div>
                    </div>

                    <div className="tile-eyes-footer">
                      <div className="mini-left">
                        <span className="mini-id">#{cam.id}</span>
                        <span className="mini-dot">•</span>
                        <span className="mini-zone">{cam.name} • {cam.zone}</span>
                      </div>
                      <div className={`mini-status ${live ? 'ok':'off'}`}>{cam.status}</div>
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredCams.length===0 && <div className="empty">No cameras match your filters.</div>}
          </section>
        </>
      )}

      {/* PLAYER */}
      {playerOpen && selectedCam && (
        <div className="player" role="dialog" aria-modal="true">
          <div className="backdrop" onClick={closePlayer}/>
          <div className="sheet">
            <div className="sheet-head">
              <div className="ph-left">
                <CameraIcon/><div className="ph-title">
                  <div className="n">{selectedCam.name} — {selectedCam.building}</div>
                  <div className="s">
                    <span className="t">#{selectedCam.id}</span><span className="dot">•</span>
                    <span className={`t ${selectedCam.status==='Online'?'ok':'off'}`}>{selectedCam.status}</span><span className="dot">•</span>
                    <span className="t">{selectedCam.res} @ {selectedCam.fps}fps</span>
                  </div>
                </div>
              </div>
              <button className="btn-x" onClick={closePlayer}>×</button>
            </div>

            <div className={`stage ${selectedCam.status!=='Online'?'offline':''}`} ref={stageRef}>
              {selectedCam.status==='Online' && selectedCam.streamUrl ? (
                isYouTube(selectedCam.streamUrl) ? (
                  <>
                    {/* CCTV-skinned YouTube: privacy domain, no UI, our OSD + controls */}
                    <div className="media-yt yt-skin">
                      <iframe
                        key={`yt-${ytMuted?'m':'u'}`}
                        className="media"
                        src={ytEmbedSrc(selectedCam.streamUrl, { autoplay: 1, mute: ytMuted ? 1 : 0, loop: 1 })}
                        title={`${selectedCam.name} (YouTube)`}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                        frameBorder="0"
                        allowFullScreen={false}
                      />
                    </div>
                    <div className="osd-top">
                      <span className="rec blink">LIVE</span>
                      <span className="ch">{selectedCam.id}</span>
                      <span className="meta">{selectedCam.res} @ {selectedCam.fps}fps • {selectedCam.bitrate || '—'}</span>
                    </div>
                    <div className="osd-bottom">
                      <span className="loc">{selectedCam.name}</span>
                      <span className="clock">{clock}</span>
                    </div>

                    <div className="controls yt">
                      <div className="row">
                        <button className="ic" onClick={()=> setYtMuted(m => !m)} title={ytMuted?'Unmute':'Mute'}>
                          {ytMuted ? <Mute/> : <Vol/>}
                        </button>
                        <button className="ic" onClick={toggleFullscreen} title={isFullscreen?'Exit Fullscreen':'Fullscreen'}>
                          {isFullscreen ? <FullX/> : <Full/>}
                        </button>
                        <button className="ic" onClick={()=> window.open(selectedCam.streamUrl, '_blank')} title="Open source"><Open/></button>
                        <button className="ic" onClick={copyUrl} title="Copy stream URL"><LinkIcon/></button>
                        <span className="flex"/>
                      </div>
                    </div>
                  </>
                ):(
                  <>
                    <video
                      ref={videoRef}
                      className="media"
                      src={selectedCam.streamUrl}
                      autoPlay
                      playsInline
                      muted={muted}
                      controls={false}
                      preload="auto"
                      {...(useCrossOrigin ? { crossOrigin:'anonymous' } : {})}
                      onError={handleVideoError}
                    />
                    <div className="osd-top">
                      <span className="rec blink">REC</span>
                      <span className="ch">{selectedCam.id}</span>
                      <span className="meta">{selectedCam.res} @ {selectedCam.fps}fps • {selectedCam.bitrate || '—'}</span>
                    </div>
                    <div className="osd-bottom">
                      <span className="loc">{selectedCam.name}</span>
                      <span className="clock">{clock}</span>
                    </div>

                    <div className="controls">
                      <div className="row">
                        <button className="ic" onClick={togglePlay} title={isPlaying?'Pause':'Play'}>{isPlaying?<Pause/>:<Play/>}</button>
                        <button className="ic" onClick={toggleMute} title={muted?'Unmute':'Mute'}>{muted?<Mute/>:<Vol/>}</button>
                        <input className="vol" type="range" min="0" max="1" step="0.01" value={muted?0:volume} onChange={(e)=>{ const v=parseFloat(e.target.value); setVolume(v); setVol(v); }}/>
                        <span className="time">{(() => {
                          const s = (t)=>!Number.isFinite(t)?'00:00':`${String(Math.floor((t/60)%60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
                          return `${s(current)} / ${s(duration)}`;
                        })()}</span>
                        <span className="flex"/>
                        <button className="ic" onClick={snapshot} title="Snapshot">📸</button>
                        <button className="ic" onClick={copyUrl} title="Copy stream URL"><LinkIcon/></button>
                        <button className="ic" onClick={toggleFullscreen} title={isFullscreen?'Exit Fullscreen':'Fullscreen'}>{isFullscreen?<FullX/>:<Full/>}</button>
                      </div>
                      <input
                        className="seek"
                        type="range"
                        min={0}
                        max={duration || 0}
                        step="0.1"
                        value={current}
                        onChange={(e)=> seekTo(parseFloat(e.target.value))}
                        aria-label="Seek"
                      />
                    </div>
                  </>
                )
              ) : (
                <div className="offline">
                  <div className="badge-off">No Signal</div>
                  <p>This camera is currently unavailable.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
