// App.js
import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import gsap from 'gsap';
import Map3D from './components/Map3D';
import CCTV from './components/CCTV';
import './App.css';

import LeftDashboard from './components/leftDashboard';
import RightDashboard from './components/rightDashboard';
import Controller from './components/controller';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import GaugeChart from 'react-gauge-chart';
import { Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);
ChartJS.defaults.color = '#fff';
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.15)';
ChartJS.defaults.plugins = ChartJS.defaults.plugins || {};
ChartJS.defaults.plugins.datalabels = { display: false };

/** Popup gauge should be steady: memoize like in LeftDashboard */
const StaticGauge = React.memo(GaugeChart, () => true);

const Modal = ({ open, onClose, children, size = 'md' }) => {
  if (!open) return null;
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box ${size === 'sm' ? 'modal-compact' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>✖</button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const labelFor   = (date) => date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

/* ===== Icons (added moon, rain) ===== */
const Icon = ({ name, size = 14 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'pin': return (<svg {...common}><path d="M16 3l5 5-7 7-4 1 1-4 7-7z"/><path d="M2 22l10-10"/></svg>);
    case 'download': return (<svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>);
    case 'route': return (<svg {...common}><path d="M3 5h5a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2h7"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/></svg>);
    case 'layers': return (<svg {...common}><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg>);
    case 'x': return (<svg {...common}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
    case 'user': return (<svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
    case 'therm': return (<svg {...common}><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z"/></svg>);
    case 'leaf': return (<svg {...common}><path d="M11 3C7 3 3 7 3 11s4 8 8 8 8-4 8-8V5l-4 4"/></svg>);
    case 'wind': return (<svg {...common}><path d="M9 5a3 3 0 1 1 3 3H2"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M4 18h10"/></svg>);
    case 'walk': return (<svg {...common}><circle cx="12" cy="5" r="2"/><path d="M12 7 9.6 11.5 7.5 13M12 7l2.2 4 3 2M8.5 14.5 10 19M14 13l-1 5"/><path d="M5.5 20H9M12.5 20H16"/></svg>);
    case 'drone': return (<svg {...common}><circle cx="12" cy="12" r="2"/><path d="M12 10V6M12 18v-4M10 12H6M18 12h-4"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/></svg>);
    case 'camera': return (<svg {...common}><rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 10l5-3v8l-5-3"/><circle cx="9.5" cy="12" r="2.5"/></svg>);
    case 'undo': return (<svg {...common}><path d="M9 13H5l4-4-4-4"/><path d="M20 20a8 8 0 0 0-8-8H5"/></svg>);
    case 'sun': return (<svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5 19 19M19 5l1.5-1.5M4.5 20.5 6 19"/></svg>);
    case 'moon': return (<svg {...common}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>);
    case 'cloud-rain': return (<svg {...common}><path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4 4 0 0 0 1 9h10z"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/></svg>);
    default: return null;
  }
};

const Navbar = ({ children, isWeatherOpen, toggleWeather }) => {
  const location = useLocation();
  const onCCTV = location.pathname === '/cctv';
  return (
    <nav className="navbar">
      <Link
        to={onCCTV ? '/' : '/cctv'}
        className={`cctv-nav-btn ${onCCTV ? 'active' : ''}`}
        title={onCCTV ? 'Back to Map' : 'CCTV on Campus'}
        aria-label={onCCTV ? 'Back to Map' : 'CCTV on Campus'}
      >
        <span className="cctv-dot" aria-hidden="true" />
        <Icon name="camera" size={16} />
        <span className="cctv-text">{onCCTV ? 'Back to Map' : 'CCTV'}</span>
      </Link>

      <img
        src="/assets/mfu_logo.png"
        alt="MFU Logo"
        className="navbar-logo"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Mode switch + Weather button */}
      <div className="navbar-center-cluster">
        <div className="mode-switch" role="tablist" aria-label="View mode">
          {children}
        </div>

        <button
          className={`weather-btn ${isWeatherOpen ? 'active' : ''}`}
          onClick={toggleWeather}
          title={isWeatherOpen ? 'Hide Weather Controls' : 'Show Weather Controls'}
          aria-pressed={isWeatherOpen}
        >
          <Icon name="sun" size={16} />
          <span>Weather</span>
        </button>
      </div>
    </nav>
  );
};

/* ===== In-Canvas helper ===== */
const CameraSync = ({ onSnapshot, restoreTick, restoreSnapshot, onRestoreStart }) => {
  const { camera } = useThree();
  const lastRestoreTick = useRef(0);

  const takeSnapshot = () => ({
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
    fov: camera.fov,
  });

  useFrame(() => { onSnapshot?.(takeSnapshot()); });

  useEffect(() => {
    if (!restoreSnapshot) return;
    if (restoreTick === lastRestoreTick.current) return;
    lastRestoreTick.current = restoreTick;

    const { position, rotation, fov } = restoreSnapshot;
    const dur = 1.2;
    const ease = 'power3.inOut';

    onRestoreStart?.(dur * 1000);

    camera.rotation.order = 'YXZ';
    camera.rotation.x = rotation.x ?? camera.rotation.x;
    camera.rotation.y = rotation.y ?? camera.rotation.y;
    camera.rotation.z = rotation.z ?? camera.rotation.z;

    gsap.to(camera.position, { x: position.x, y: position.y, z: position.z, duration: dur, ease });
    gsap.to(camera, {
      fov: typeof fov === 'number' ? fov : camera.fov,
      duration: dur, ease,
      onUpdate: () => camera.updateProjectionMatrix(),
    });
  }, [restoreTick, restoreSnapshot, camera, onRestoreStart]);

  return null;
};

/* ===== Helpers for Thailand time & sky ===== */
function getThailandNow() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, year: 'numeric', month: 'short', day: '2-digit', weekday: 'short'
  });
  const parts = fmt.formatToParts(new Date());
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const hour = parseInt(obj.hour, 10);
  const minute = parseInt(obj.minute, 10);
  const second = parseInt(obj.second, 10);
  const dateStr = `${obj.day}/${obj.month}/${obj.year} ${obj.weekday}`;
  return { hour, minute, second, dateStr };
}

function calcSkyByHour(hour) {
  if (hour >= 6 && hour < 9) return 'linear-gradient(180deg, #FFB347, #FFD700)';
  if (hour >= 9 && hour < 17) return '#87CEEB';
  if (hour >= 17 && hour < 19) return 'linear-gradient(180deg, #FF4500, #FF6347)';
  return '#0B1526';
}

/* ===== Weather Controls Panel (time + rain) ===== */
const WeatherControlPanel = ({
  thClock, envMode, setEnvMode, envHour, setEnvHour,
  rainEnabled, setRainEnabled, rainIntensity, setRainIntensity,
  onClose
}) => {
  return (
    <div className="building-popup scientific weather-panel first" role="dialog" aria-label="Weather Controls">
      <div className="popup-header">
        <div className="head-left">
          <div className="eyebrow">SMART CAMPUS · MFU</div>
          <div className="title">Weather Controls</div>
          <div className="subtitle">Thailand time: {thClock.dateStr}</div>
        </div>

        <div className="toolbar">
          <button className="tool-btn danger" title="Close weather panel" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
      </div>

      <div className="wc-sections">
        <div className="wc-card">
          <div className="wc-card-title">Realtime (Thailand)</div>

          <div className="wc-time-row">
            <div className="wc-live-dot" aria-hidden="true" />
            <div className="wc-live-time">
              {String(thClock.hour).padStart(2,'0')}:{String(thClock.minute).padStart(2,'0')}:{String(thClock.second).padStart(2,'0')}
              <span className="wc-live-label"> Asia/Bangkok</span>
            </div>
          </div>

          <div className="wc-mode-toggle">
            <span className={`mode-label ${envMode === 'realtime' ? 'active' : ''}`}>Realtime</span>
            <label className="switch" title="Switch between realtime and manual time">
              <input
                type="checkbox"
                checked={envMode === 'manual'}
                onChange={(e) => setEnvMode(e.target.checked ? 'manual' : 'realtime')}
              />
              <span className="slider" />
            </label>
            <span className={`mode-label ${envMode === 'manual' ? 'active' : ''}`}>Manual</span>
          </div>

          <p className="wc-hint">Use Manual to scrub the sun from day to night.</p>
        </div>

        <div className={`wc-card ${envMode === 'manual' ? '' : 'wc-disabled'}`}>
          <div className="wc-card-title">Manual Time</div>
          <div className="wc-manual-row">
            <Icon name={envHour >= 19 || envHour < 6 ? 'moon' : 'sun'} />
            <input
              className="wc-hour-slider"
              type="range"
              min="0" max="23" step="1"
              value={envHour}
              onChange={(e) => setEnvHour(parseInt(e.target.value, 10))}
              disabled={envMode !== 'manual'}
            />
            <div className="wc-hour-label">{String(envHour).padStart(2,'0')}:00</div>
          </div>
          <div className="wc-hour-markers">
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
        </div>

        <div className={`wc-card ${rainEnabled ? '' : 'wc-muted'}`}>
          <div className="wc-card-title">Rain</div>
          <div className="wc-rain-row">
            <label className="switch" title="Toggle rain">
              <input
                type="checkbox"
                checked={rainEnabled}
                onChange={(e)=>setRainEnabled(e.target.checked)}
              />
              <span className="slider" />
            </label>
            <div className={`wc-rain-badge ${rainEnabled ? 'on' : 'off'}`}>{rainEnabled ? 'On' : 'Off'}</div>
          </div>

          <div className="wc-rain-intensity">
            <label>Intensity</label>
            <input
              type="range" min="0" max="1" step="0.05"
              value={rainIntensity}
              onChange={(e)=>setRainIntensity(parseFloat(e.target.value))}
              disabled={!rainEnabled}
            />
            <div className="wc-rain-value">{Math.round(rainIntensity*100)}%</div>
          </div>

          <p className="wc-hint">Map3D listens to <code>rainEnabled</code> & <code>rainIntensity</code> to emit particles and wet surfaces.</p>
        </div>
      </div>
    </div>
  );
};

const MapApp = () => {
  const [showDashboards, setShowDashboards] = useState(true);

  /* ===== ENV / WEATHER CONTROL STATE ===== */
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [envMode, setEnvMode] = useState('realtime'); // 'realtime' | 'manual'
  const [envHour, setEnvHour] = useState(12);         // 0..23 (manual)
  const [rainEnabled, setRainEnabled] = useState(false);
  const [rainIntensity, setRainIntensity] = useState(0.5);

  const [backgroundColor, setBackgroundColor] = useState('#87CEEB');

  const [thailandTime, setThailandTime] = useState({ date: '', hour: '', minute: '', second: '', period: '' });
  const [popupData, setPopupData] = useState(null);
  const [resetColors, setResetColors] = useState(false);
  const [originalColors, setOriginalColors] = useState(new Map());
  const [controllerCommand, setControllerCommand] = useState(null);
  const [navMode, setNavMode] = useState('drone');
  const [stepNudge, setStepNudge] = useState(null);
  const [stepNudgeTick, setStepNudgeTick] = useState(0);
  const doNudge = (dir) => { setStepNudge({ dir }); setStepNudgeTick((t) => t + 1); };
  useEffect(() => { setControllerCommand(null); }, [navMode]);

  const [pinned, setPinned] = useState(false);
  const setPopupFromMap = useCallback((d) => {
    if (!pinned) setPopupData(d);
    setIsWeatherOpen(false);
  }, [pinned]);

  const [showInstructions, setShowInstructions] = useState(() => {
    const dontShow = localStorage.getItem('dontShowInstructions');
    return dontShow === 'true' ? false : true;
  });
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [hour24, setHour24] = useState(true);

  const [isWeeklyPopupVisible, setIsWeeklyPopupVisible] = useState(false);
  const [isOverallPopupVisible, setIsOverallPopupVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([new Date(), new Date()]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [isVehiclePopupVisible, setIsVehiclePopupVisible] = useState(false);
  const [vehicleType, setVehicleType] = useState('Cars');
  const [schedule, setSchedule] = useState([]);

  const [walkStepMeters, setWalkStepMeters] = useState(6);
  const [walkVStepMeters, setWalkVStepMeters] = useState(2.6);
  const [walkStickToFloor, setWalkStickToFloor] = useState(true);
  const [walkYTick, setWalkYTick] = useState(0);
  const [walkYDir, setWalkYDir] = useState(null);

  const toggleWeather = () => {
    setIsWeatherOpen((s) => {
      const next = !s;
      if (next) { setPopupData(null); setPinned(false); }
      return next;
    });
  };

  /* ===== Thailand clock (for display) ===== */
  const updateThailandTime = () => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      day: '2-digit', month: 'short', year: 'numeric', weekday: 'short',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !hour24
    });
    const now = new Date();
    const parts = fmt.formatToParts(now);
    const get = (t) => parts.find((p)=>p.type===t)?.value;
    const day = get('day'), month = get('month'), year = get('year'), weekday = get('weekday');
    const dateStr = `${day}/${month}/${year} ${weekday}`;
    const hourStr = get('hour') || '00';
    const minStr = get('minute') || '00';
    const secStr = get('second') || '00';
    const period = hour24 ? '' : (get('dayPeriod') || '').toUpperCase();

    setThailandTime({
      date: dateStr,
      hour: hourStr.padStart(2,'0'),
      minute: minStr.padStart(2,'0'),
      second: secStr.padStart(2,'0'),
      period
    });
  };

  /* ===== Compute the hour to drive sky/lighting ===== */
  const [visualHour, setVisualHour] = useState(12);
  useEffect(() => {
    const tick = () => {
      const th = getThailandNow();
      const vh = envMode === 'realtime' ? th.hour : envHour;
      setVisualHour(vh);
      setBackgroundColor(calcSkyByHour(vh));
    };
    tick();
    const bgId = setInterval(tick, 1000);
    const tId = setInterval(updateThailandTime, 1000);
    return () => { clearInterval(bgId); clearInterval(tId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envMode, envHour, hour24]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mfu:env', { detail: { mode: envMode, hour: visualHour } }));
  }, [envMode, visualHour]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mfu:rain', { detail: { enabled: rainEnabled, intensity: rainIntensity } }));
  }, [rainEnabled, rainIntensity]);

  useEffect(() => { if (popupData?.name) setSelectedBuilding(popupData.name); }, [popupData]);

  const openVehiclePopup = (type) => { setVehicleType(type); setIsVehiclePopupVisible(true); };
  const closeVehiclePopup = () => setIsVehiclePopupVisible(false);

  useEffect(() => {
    const times = [
      '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
      '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
      '6:00 PM','7:00 PM','8:00 PM','9:00 PM'
    ];
    setSchedule(times.map(time => ({
      time,
      cars: Math.floor(Math.random()*500),
      motorcycles: Math.floor(Math.random()*1000)
    })));
  }, []);

  const peakTime = schedule.length
    ? schedule.reduce((p, e) =>
        (e[vehicleType.toLowerCase()] > p[vehicleType.toLowerCase()] ? e : p),
      schedule[0])
    : null;

  const [presetRange, setPresetRange] = useState(null);
  const setRangeDays = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setSelectedDateRange([startOfDay(start), endOfDay(end)]);
    setPresetRange(days);
  };

  const totalElectricityUsage = 121008.75;
  const buildDailySeries = (days = 35) => {
    const today = new Date();
    const series = Array.from({ length: days }, (_, idx) => {
      const date = new Date();
      date.setDate(today.getDate() - (days - 1 - idx));
      const base = 16000;
      const variance = (Math.random() * 0.2 - 0.1) * base;
      const value = base + variance;
      return { date: startOfDay(date), label: labelFor(date), value };
    });

    const last7 = series.slice(-7);
    const sumLast7 = last7.reduce((a, p) => a + p.value, 0);
    const factor = totalElectricityUsage / sumLast7;
    for (let i = series.length - 7; i < series.length; i++) {
      series[i] = { ...series[i], value: series[i].value * factor };
    }
    return series;
  };

  const [series] = useState(() => buildDailySeries(35));
  const last7 = series.slice(-7);
  const weeklyLabels = [last7.map((p) => p.label)];
  const weeklyData = [last7.map((p) => p.value)];

  const normalizeRange = (value) => {
    if (Array.isArray(value)) {
      const [s, e] = value;
      if (!s || !e) return null;
      return [startOfDay(s), endOfDay(e)];
    }
    if (value) return [startOfDay(value), endOfDay(value)];
    return null;
  };

  const normalizedRange = normalizeRange(selectedDateRange);
  const filteredPoints = normalizedRange
    ? series.filter((p) => p.date >= normalizedRange[0] && p.date <= normalizedRange[1])
    : series.slice(-7);

  const usageTotal = filteredPoints.reduce((a, p) => a + p.value, 0);
  const usageCount = filteredPoints.length || 1;
  const usageAvg = usageTotal / usageCount;

  const popupElectricityUsageData = {
    labels: filteredPoints.map((p) => p.label),
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: filteredPoints.map((p) => Number(p.value.toFixed(2))),
        backgroundColor: '#4daef4',
        borderColor: '#4daef4',
        borderWidth: 1,
      },
    ],
  };

  const popupElectricityUsageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#fff' } },
      tooltip: { titleColor: '#fff', bodyColor: '#fff' },
      datalabels: { display: false },
    },
    scales: {
      x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
      y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
    },
  };

  const buildings = [
    'Msquare','E1','E2','E3','E4','C1','C2','C3','C4','C5','D1','AD1','AD2',
    'F1','F2','F3','F4','F5','F6','L1','L2','L3','L4','L5','L6','L7',
    'S1','S2','S3','S4','S5','S6','S7','M3'
  ];
  const [waterUsageData, setWaterUsageData] = useState([]);

  const generateWaterUsage = () => {
    if (waterUsageData.length > 0) {
      const updated = waterUsageData.map((d) => {
        let range;
        if (d.usage <= 300) range = { min: 50, max: 300 };
        else if (d.usage <= 600) range = { min: 350, max: 600 };
        else if (d.usage <= 900) range = { min: 650, max: 900 };
        else if (d.usage <= 1200) range = { min: 950, max: 1200 };
        else range = { min: 1250, max: 1450 };
        const newUsage = range.min + Math.random() * (range.max - range.min);
        return { building: d.building, usage: newUsage };
      });
      updated.sort((a, b) => b.usage - a.usage);
      setWaterUsageData(updated);
      return;
    }

    const ranges = [
      { min: 50, max: 300 },
      { min: 350, max: 600 },
      { min: 650, max: 900 },
      { min: 950, max: 1200 },
      { min: 1250, max: 1450 },
    ];

    const usageData = buildings.map((bld, index) => {
      const range = ranges[index % ranges.length];
      const usage = range.min + Math.random() * (range.max - range.min);
      return { building: bld, usage };
    });

    usageData.sort((a, b) => b.usage - a.usage);
    setWaterUsageData(usageData);
  };

  useEffect(() => {
    generateWaterUsage();
    const id = setInterval(() => { if (waterUsageData.length > 0) generateWaterUsage(); }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDashboards = () => setShowDashboards((prev) => !prev);

  useEffect(() => { updateThailandTime(); }, []); // initialize

  const clampPct = (n) => Math.max(0, Math.min(100, n || 0));
  const popupDerived = useMemo(() => {
    if (!popupData) return null;
    const randTrend = () => {
      const n = Math.round((Math.random() * 6 - 3) * 10) / 10;
      return { value: n, dir: n === 0 ? 'eq' : n > 0 ? 'up' : 'down' };
    };
    const elec = popupData.electricity || { value: 0, unit: 'kWh', percent: 0, status: 'N/A' };
    const water = popupData.water || { value: 0, unit: 'm³', percent: 0, status: 'N/A' };

    const THB_PER_KWH = 4.19;
    const THB_PER_M3 = 13.0;
    const GRID_CO2_KG_KWH = 0.45;

    const costTHB = elec.value * THB_PER_KWH;
    const waterTHB = water.value * THB_PER_M3;
    const co2kg = elec.value * GRID_CO2_KG_KWH;

    const baseOcc =
      popupData.type?.toLowerCase().includes('library') ? 220 :
      popupData.type?.toLowerCase().includes('auditor') ? 350 : 120;

    const occupancy = Math.max(0, Math.round(baseOcc * (0.8 + Math.random()*0.4)));
    const temperature = 24 + Math.round(Math.random()*4);
    const co2ppm = 420 + Math.round(Math.random()*200);
    const aqi = 18 + Math.round(Math.random()*12);

    return {
      trendElec: randTrend(),
      trendWater: randTrend(),
      costTHB, waterTHB, co2kg,
      occupancy, temperature, co2ppm, aqi
    };
  }, [popupData]);

  const exportPopup = () => {
    if (!popupData) return;
    const payload = { ...popupData, derived: popupDerived, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${popupData.name.replace(/\s+/g,'_')}_snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCoords = async () => {
    if (!popupData?.world) return;
    const { x, y, z } = popupData.world;
    const text = `X ${x.toFixed(2)}, Y ${y.toFixed(2)}, Z ${z.toFixed(2)}`;
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const openAnalytics = () => {
    if (!popupData) return;
    window.open(`#analytics/${encodeURIComponent(popupData.name)}`, '_blank');
  };

  const latestCamRef = useRef(null);
  const preFocusPoseRef = useRef(null);
  const [restoreTick, setRestoreTick] = useState(0);
  const [restoreSnapshot, setRestoreSnapshot] = useState(null);
  const wasOpenRef = useRef(false);
  const [restoreFreezeMs, setRestoreFreezeMs] = useState(0);

  useEffect(() => {
    const isOpen = !!popupData;
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      preFocusPoseRef.current = latestCamRef.current;
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      if (preFocusPoseRef.current) {
        setRestoreSnapshot(preFocusPoseRef.current);
        setRestoreTick((t) => t + 1);
      }
    }
  }, [popupData]);

  const inE1Step2 = popupData && /^E1/i.test(popupData.name);
  const inE2Step2 = popupData && /^E2/i.test(popupData.name);
  const inLibraryStep2 = popupData && (/^Library/i.test(popupData.name) || /^AV$/i.test(popupData.name));

  return (
    <div className="app-container" style={{ background: backgroundColor }}>
      <Navbar isWeatherOpen={isWeatherOpen} toggleWeather={toggleWeather}>
        <button
          className={`mode-seg ${navMode === 'walk' ? 'active' : ''}`}
          onClick={() => setNavMode('walk')}
          role="tab"
          aria-selected={navMode === 'walk'}
          aria-controls="mode-walk"
        >
          <Icon name="walk" size={14} />
          <span>Walk</span>
        </button>

        <button
          className={`mode-seg ${navMode === 'drone' ? 'active' : ''}`}
          onClick={() => setNavMode('drone')}
          role="tab"
          aria-selected={navMode === 'drone'}
          aria-controls="mode-drone"
        >
          <Icon name="drone" size={14} />
          <span>Drone</span>
        </button>

        <div
          className="mode-thumb"
          style={{ transform: navMode === 'walk' ? 'translateX(0%)' : 'translateX(100%)' }}
          aria-hidden="true"
        />
      </Navbar>

      <div className="thailand-time" role="region" aria-label="Thailand time">
        <div className="date">{thailandTime.date}</div>
        <div className="time-row">
          <div
            className="time"
            onClick={() => setHour24((prev) => !prev)}
            title="Toggle 24h/12h"
            role="button"
            tabIndex={0}
            onKeyDown={(e)=> (e.key==='Enter' || e.key===' ') && setHour24((prev)=>!prev)}
          >
            {thailandTime.hour}:{thailandTime.minute}:{thailandTime.second}
            {thailandTime.period && <span className="period"> {thailandTime.period}</span>}
          </div>

          <button
            className="help-btn"
            title="Show instructions"
            aria-label="Show instructions"
            onClick={() => setShowInstructions(true)}
          >
            ?
          </button>
        </div>
      </div>

      <button className="hide-button" onClick={toggleDashboards}>
        {showDashboards ? 'Hide Dashboards' : 'Show Dashboards'}
      </button>

      <div className="map-container">
        <Suspense fallback={<div>Loading...</div>}>
          <Canvas
            className="map3d-canvas"
            style={{ width: '100vw', height: '100vh' }}
            camera={{ fov: 75, near: 0.1, far: 10000 }}
          >
            <PerformanceMonitor>
              <CameraSync
                onSnapshot={(snap) => { latestCamRef.current = snap; }}
                restoreTick={restoreTick}
                restoreSnapshot={restoreSnapshot}
                onRestoreStart={(ms) => setRestoreFreezeMs(ms)}
              />

              <Map3D
                setPopupData={setPopupFromMap}
                originalColors={originalColors}
                resetColors={resetColors}
                setResetColors={setResetColors}
                setOriginalColors={setOriginalColors}
                controllerCommand={controllerCommand}
                mode={navMode}
                stepNudge={stepNudge}
                stepNudgeTick={stepNudgeTick}
                walkStepMeters={walkStepMeters}
                walkVStepMeters={walkVStepMeters}
                walkStickToFloor={walkStickToFloor}
                walkYTick={walkYTick}
                walkYDir={walkYDir}
                restoreCameraTick={restoreTick}
                popupOpen={!!popupData || isWeatherOpen}

                /* Weather/Env props for Map3D */
                envMode={envMode}
                envHour={visualHour}
                rainEnabled={rainEnabled}
                rainIntensity={rainIntensity}
              />
            </PerformanceMonitor>
          </Canvas>
        </Suspense>

        {navMode === 'walk' && (
          <div className="streetview-ui" aria-hidden="false">
            <button className="sv-arrow up" title="Move forward" onClick={() => doNudge('forward')}>▲</button>
            <div className="sv-left-right">
              <button className="sv-arrow left" title="Step left" onClick={() => doNudge('left')}>◀</button>
              <button className="sv-arrow right" title="Step right" onClick={() => doNudge('right')}>▶</button>
            </div>
          </div>
        )}

        {navMode === 'walk' && (
          <div className="walk-fine-panel">
            <div className="panel-title">Walking Controls</div>
            <div className="row">
              <label className="lbl">Stick to floor</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={walkStickToFloor}
                  onChange={(e) => setWalkStickToFloor(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="row">
              <label className="lbl">Step distance</label>
              <input
                type="range"
                min="1" max="10" step="0.5"
                value={walkStepMeters}
                onChange={(e) => setWalkStepMeters(parseFloat(e.target.value))}
              />
              <div className="val">{walkStepMeters.toFixed(1)} m</div>
            </div>

            <div className="row">
              <label className={`lbl ${walkStickToFloor ? 'muted' : ''}`}>Vertical step</label>
              <input
                type="range"
                min="1.5" max="5" step="0.1"
                value={walkVStepMeters}
                onChange={(e) => setWalkVStepMeters(parseFloat(e.target.value))}
                disabled={walkStickToFloor}
              />
              <div className={`val ${walkStickToFloor ? 'muted' : ''}`}>
                {walkVStepMeters.toFixed(1)} m
              </div>
            </div>

            <div className="elevator">
              <button
                className="elev-btn"
                disabled={walkStickToFloor}
                onClick={() => { setWalkYDir('up'); setWalkYTick(t=>t+1); }}
                title="Step up (walking)"
              >⬆</button>
              <button
                className="elev-btn"
                disabled={walkStickToFloor}
                onClick={() => { setWalkYDir('down'); setWalkYTick(t=>t+1); }}
                title="Step down (walking)"
              >⬇</button>
            </div>
            <div className="hint">{walkStickToFloor ? 'Disable to use elevator' : 'Use elevator to step floors'}</div>
          </div>
        )}
      </div>

      {showDashboards && (
        <>
          <div className="dashboard-wrapper left-dashboard-wrapper show">
            <LeftDashboard
              weeklyData={weeklyData}
              weeklyLabels={weeklyLabels}
              waterUsageData={waterUsageData}
              onOpenWeeklyPopup={() => setIsWeeklyPopupVisible(true)}
              onOpenOverallPopup={() => setIsOverallPopupVisible(true)}
            />
          </div>

          <div className="dashboard-wrapper right-dashboard-wrapper show">
            <RightDashboard onOpenVehiclePopup={openVehiclePopup} />
          </div>
        </>
      )}

      {!showDashboards && navMode === 'drone' && (
        <Controller setControllerCommand={setControllerCommand} />
      )}

      {isWeatherOpen && (
        <WeatherControlPanel
          thClock={getThailandNow()}
          envMode={envMode}
          setEnvMode={setEnvMode}
          envHour={envHour}
          setEnvHour={setEnvHour}
          rainEnabled={rainEnabled}
          setRainEnabled={setRainEnabled}
          rainIntensity={rainIntensity}
          setRainIntensity={setRainIntensity}
          onClose={() => setIsWeatherOpen(false)}
        />
      )}

      {!isWeatherOpen && popupData && popupDerived && (
        <div
          className={`building-popup scientific ${showDashboards ? 'first' : 'second'}`}
          role="dialog"
          aria-label={`${popupData.name} details`}
        >
          <div className="popup-header">
            <div className="head-left">
              <div className="eyebrow">SMART CAMPUS · MFU</div>
              <div className="title">{popupData.name}</div>
              <div className="subtitle">{popupData.type}</div>
            </div>

            <div className="toolbar">
              {inE1Step2 && (
                <button
                  className="tool-btn"
                  title="Return to Origin (E1 + all floors)"
                  onClick={() => window.dispatchEvent(new Event('mfu:returnE1Origin'))}
                >
                  <Icon name="undo" />
                </button>
              )}
              {inE2Step2 && (
                <button
                  className="tool-btn"
                  title="Return to Origin (E2 + all floors)"
                  onClick={() => window.dispatchEvent(new Event('mfu:returnE2Origin'))}
                >
                  <Icon name="undo" />
                </button>
              )}
              {inLibraryStep2 && (
                <button
                  className="tool-btn"
                  title="Return to Origin (Library + all floors)"
                  onClick={() => window.dispatchEvent(new Event('mfu:returnLibraryOrigin'))}
                >
                  <Icon name="undo" />
                </button>
              )}
              <button
                className={`tool-btn ${pinned ? 'active' : ''}`}
                title={pinned ? 'Unpin' : 'Pin'}
                onClick={() => setPinned((p) => !p)}
                aria-pressed={pinned}
              >
                <Icon name="pin" />
              </button>
              <button className="tool-btn" title="Copy coordinates" onClick={copyCoords}>
                <Icon name="layers" />
              </button>
              <button className="tool-btn" title="Export snapshot (JSON)" onClick={exportPopup}>
                <Icon name="download" />
              </button>
              <button className="tool-btn" title="Open analytics" onClick={openAnalytics}>
                <Icon name="route" />
              </button>
              <button
                className="tool-btn danger"
                title="Close"
                aria-label="Close building popup"
                onClick={() => { setPopupData(null); setResetColors(true); setPinned(false); }}
              >
                <Icon name="x" />
              </button>
            </div>
          </div>

          <div className="telemetry-row">
            <div className="chip">
              <Icon name="user" /><span>{popupDerived.occupancy}</span><small>people</small>
            </div>
            <div className="chip">
              <Icon name="therm" /><span>{popupDerived.temperature}°C</span><small>temp</small>
            </div>
            <div className="chip">
              <Icon name="leaf" /><span>{popupDerived.co2ppm}</span><small>CO₂ ppm</small>
            </div>
          </div>

          {popupData.world && (
            <div className="location-compact" onClick={copyCoords} title="Copy world coordinates">
              <span className="loc-label">World</span>
              <span className="coord">X {popupData.world.x.toFixed(2)}</span>
              <span className="coord">Y {popupData.world.y.toFixed(2)}</span>
              <span className="coord">Z {popupData.world.z.toFixed(2)}</span>
            </div>
          )}

          <div className="metrics-grid">
            <div className={`metric-card ${popupData.electricity.status === 'High' ? 'risk' : ''}`}>
              <div className="metric-head">
                <div className="metric-name"><span className="dot" />Electricity</div>
                <span className={`badge ${String(popupData.electricity.status).toLowerCase()}`}>
                  {popupData.electricity.status}
                </span>
              </div>
              <div className="metric-value">
                <span className="num">{popupData.electricity.value}</span>
                <span className="unit">{popupData.electricity.unit}</span>
              </div>
              <div className="meter">
                <div className="bar" style={{ width: `${clampPct(popupData.electricity.percent)}%` }} />
              </div>
              <div className={`trend ${popupDerived.trendElec.dir}`}>
                {popupDerived.trendElec.dir === 'up' ? '▲' : popupDerived.trendElec.dir === 'down' ? '▼' : '■'} {Math.abs(popupDerived.trendElec.value)}%
              </div>
            </div>

            <div className={`metric-card ${popupData.water.status === 'High' ? 'risk' : ''}`}>
              <div className="metric-head">
                <div className="metric-name"><span className="dot alt" />Water</div>
                <span className={`badge ${String(popupData.water.status).toLowerCase()}`}>
                  {popupData.water.status}
                </span>
              </div>
              <div className="metric-value">
                <span className="num">{popupData.water.value}</span>
                <span className="unit">{popupData.water.unit}</span>
              </div>
              <div className="meter alt">
                <div className="bar" style={{ width: `${clampPct(popupData.water.percent)}%` }} />
              </div>
              <div className={`trend ${popupDerived.trendWater.dir}`}>
                {popupDerived.trendWater.dir === 'up' ? '▲' : popupDerived.trendWater.dir === 'down' ? '▼' : '■'} {Math.abs(popupDerived.trendWater.value)}%
              </div>
            </div>
          </div>

          <div className="footer-stats">
            <div className="pill"><span className="k">Cost</span><span className="v">฿{popupDerived.costTHB.toFixed(0)}</span></div>
            <div className="pill"><span className="k">CO₂</span><span className="v">{popupDerived.co2kg.toFixed(0)} kg</span></div>
            <div className="pill"><span className="k">Water ฿</span><span className="v">฿{popupDerived.waterTHB.toFixed(0)}</span></div>
          </div>
        </div>
      )}

      <Modal open={isWeeklyPopupVisible} onClose={() => setIsWeeklyPopupVisible(false)}>
        <div className="modal-header">
          <h3 className="modal-title">Electricity Usage for Selected Dates</h3>
          <div className="chip-group" role="group" aria-label="Range presets">
            <button className={`chip ${presetRange === 7 ? 'active' : ''}`} onClick={() => setRangeDays(7)}>7d</button>
            <button className={`chip ${presetRange === 14 ? 'active' : ''}`} onClick={() => setRangeDays(14)}>14d</button>
            <button className={`chip ${presetRange === 30 ? 'active' : ''}`} onClick={() => setRangeDays(30)}>30d</button>
          </div>
        </div>

        <div className="modal-kpis">
          <div className="kpi"><span className="kpi-label">Total</span><span className="kpi-value">{Math.round(usageTotal).toLocaleString()} kWh</span></div>
          <div className="kpi"><span className="kpi-label">Avg / day</span><span className="kpi-value">{Math.round(usageAvg).toLocaleString()} kWh</span></div>
          <div className="kpi"><span className="kpi-label">Days</span><span className="kpi-value">{usageCount}</span></div>
        </div>

        <div className="modal-content">
          <div className="chart-wrapper">
            <Bar data={popupElectricityUsageData} options={popupElectricityUsageOptions} />
          </div>
          <div className="calendar-wrapper">
            <Calendar selectRange onChange={(v) => setSelectedDateRange(v)} value={selectedDateRange} />
          </div>
        </div>
      </Modal>

      <Modal open={isOverallPopupVisible} onClose={() => setIsOverallPopupVisible(false)}>
        <div className="modal-header">
          <h3 className="modal-title">Water Usage: Overall Campus</h3>
        </div>

        <div className="modal-kpis">
          <div className="kpi"><span className="kpi-label">Total Water Usage (Daily)</span><span className="kpi-value">{(buildings.reduce((acc, b) => acc + (waterUsageData.find((d) => d.building === b)?.usage || 0), 0)).toFixed(2)} liters/day</span></div>
          <div className="kpi"><span className="kpi-label">Total Water Usage (Monthly)</span><span className="kpi-value">{(buildings.reduce((acc, b) => acc + (waterUsageData.find((d) => d.building === b)?.usage || 0), 0) * 30).toFixed(2)} liters/month</span></div>
          <div className="kpi"><span className="kpi-label">Selected Building</span><span className="kpi-value">{selectedBuilding || '—'}</span></div>
        </div>

        <div className="modal-content">
          <div className="card gauge-card">
            <h4 className="card-title">{selectedBuilding ? selectedBuilding : 'Campus Water Usage'}</h4>
            <div className="gauge-holder">
              <StaticGauge
                id="building-speedometer"
                nrOfLevels={5}
                percent={selectedBuilding ? ((waterUsageData.find((d)=>d.building===selectedBuilding)?.usage || 0) / 1500) : 0.5}
                arcWidth={0.3}
                textColor="#ffffff"
                needleColor="#ff9800"
                needleBaseColor="#e01e5a"
                colors={['#5BE12C', '#F5CD19', '#EA4228']}
                cornerRadius={0}
                animate={false}
                hideText={true}
              />
              {selectedBuilding && (<p className="big-stat">{(waterUsageData.find((d)=>d.building===selectedBuilding)?.usage || 0).toFixed(2)} liters/day</p>)}
            </div>
          </div>

          <div className="card control-card">
            <h4 className="card-title">Select a Building</h4>
            <div className="water-dropdown-container">
              <select
                value={selectedBuilding || ''}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="building-dropdown"
              >
                <option value="">Overall Campus</option>
                {buildings.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
            </div>

            {selectedBuilding && (
              <div className="stat-box">
                <div className="stat-label">Current Usage</div>
                <div className="stat-value">{(waterUsageData.find((d)=>d.building===selectedBuilding)?.usage || 0).toFixed(2)} liters/day</div>
              </div>
            )}
            <p className="muted-note">Tip: choosing a building updates the gauge on the left.</p>
          </div>
        </div>
      </Modal>

      {isVehiclePopupVisible && (
        <Modal open={isVehiclePopupVisible} onClose={closeVehiclePopup} size="sm">
          <div className="modal-header">
            <h3 className="modal-title">{vehicleType} Schedule</h3>
            <div className="button-group">
              <button
                className={`vehicle-button ${vehicleType === 'Cars' ? 'active' : ''}`}
                onClick={() => setVehicleType('Cars')}
                title="Show Cars"
              >🚗</button>
              <button
                className={`vehicle-button ${vehicleType === 'Motorcycles' ? 'active' : ''}`}
                onClick={() => setVehicleType('Motorcycles')}
                title="Show Motorcycles"
              >🏍️</button>
            </div>
          </div>

          <p className="modal-note">Here is the schedule for the whole day.</p>

          <div className="schedule-scroll">
            <table className="schedule-table">
              <thead>
                <tr><th>Time</th><th>{vehicleType}</th></tr>
              </thead>
              <tbody>
                {schedule.map((entry) => (
                  <tr key={entry.time}>
                    <td>{entry.time}</td>
                    <td>{entry[vehicleType.toLowerCase()].toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {peakTime && (
            <div className="peak-row">
              <div className="kpi mini">
                <span className="kpi-label">Peak Time</span>
                <span className="kpi-value">{peakTime.time}</span>
              </div>
              <div className="kpi mini">
                <span className="kpi-label">Vehicles</span>
                <span className="kpi-value">{peakTime[vehicleType.toLowerCase()].toLocaleString()}</span>
              </div>
            </div>
          )}
        </Modal>
      )}

      {showInstructions && (
        <div className="instructions-popup">
          <div className="close-button" onClick={() => setShowInstructions(false)}>×</div>
          <h3 className="instruction-title">Map Controls</h3>
          <div className="instruction-list">
            <div className="instruction-item"><div className="key-badge">W</div><div>Move Forward</div></div>
            <div className="instruction-item"><div className="key-badge">S</div><div>Move Backward</div></div>
            <div className="instruction-item"><div className="key-badge">A</div><div>Move Left</div></div>
            <div className="instruction-item"><div className="key-badge">D</div><div>Move Right</div></div>
            <div className="instruction-item"><div className="key-badge">Space</div><div>Move Upward</div></div>
            <div className="instruction-item"><div className="key-badge">Shift</div><div>Move Downward</div></div>
          </div>
          <hr className="divider" />
          <p className="tip-text">💡 The on-screen controller pad (visible when dashboards are hidden) moves faster than keyboard controls.</p>
          <button className="dont-show-btn" onClick={() => {
            localStorage.setItem('dontShowInstructions', 'true');
            setShowInstructions(false);
            setShowConfirmPopup(true);
          }}>Do not show me again</button>
        </div>
      )}

      {showConfirmPopup && (
        <div className="confirm-popup">
          <div className="close-button" onClick={() => setShowConfirmPopup(false)}>×</div>
          <p className="confirm-text">
            💡 This Instructions will be permanently closed after clicking 'Do not show me again' and will appear when you click the MFU Logo or the “?” button on the Navigation Bar.
          </p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapApp />} />
        <Route path="/cctv" element={<CCTV />} />
      </Routes>
    </Router>
  );
};

export default App;