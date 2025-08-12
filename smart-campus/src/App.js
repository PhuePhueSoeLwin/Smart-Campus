// App.js
import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import Map3D from './components/Map3D';
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

// Register Chart.js + datalabels
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

// Defaults
ChartJS.defaults.color = '#fff';
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.15)';
ChartJS.defaults.plugins = ChartJS.defaults.plugins || {};
ChartJS.defaults.plugins.datalabels = { display: false };

/** Centered modal */
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
const labelFor = (date) => date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

const App = () => {
  const [showDashboards, setShowDashboards] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#87CEEB');
  const [thailandTime, setThailandTime] = useState({ date: '', hour: '', minute: '', second: '', period: '' });

  const [popupData, setPopupData] = useState(null);
  const [resetColors, setResetColors] = useState(false);
  const [originalColors, setOriginalColors] = useState(new Map());
  const [controllerCommand, setControllerCommand] = useState(null);

  // Instructions popup
  const [showInstructions, setShowInstructions] = useState(() => {
    const dontShow = localStorage.getItem('dontShowInstructions');
    return dontShow === 'true' ? false : true;
  });
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [hour24, setHour24] = useState(true);

  // App-level popups
  const [isWeeklyPopupVisible, setIsWeeklyPopupVisible] = useState(false);
  const [isOverallPopupVisible, setIsOverallPopupVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([new Date(), new Date()]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Vehicle schedule popup
  const [isVehiclePopupVisible, setIsVehiclePopupVisible] = useState(false);
  const [vehicleType, setVehicleType] = useState('Cars');
  const [schedule, setSchedule] = useState([]);

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

  // Weekly usage preset
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

  // Water mock data
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

    const usageData = buildings.map((building, index) => {
      const range = ranges[index % ranges.length];
      const usage = range.min + Math.random() * (range.max - range.min);
      return { building, usage };
    });

    usageData.sort((a, b) => b.usage - a.usage);
    setWaterUsageData(usageData);
  };

  useEffect(() => {
    generateWaterUsage();
    const id = setInterval(() => {
      if (waterUsageData.length > 0) generateWaterUsage();
    }, 5000);
  return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDashboards = () => setShowDashboards((prev) => !prev);

  const calculateSkyColor = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return 'linear-gradient(180deg, #FFB347, #FFD700)';
    else if (hour >= 9 && hour < 17) return '#87CEEB';
    else if (hour >= 17 && hour < 19) return 'linear-gradient(180deg, #FF4500, #FF6347)';
    else return '#2C3E50';
  };

  const padZero = (num) => (num < 10 ? '0' + num : num);

  const updateThailandTime = () => {
    const optionsDate = {
      timeZone: 'Asia/Bangkok',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      weekday: 'short',
    };
    const formatterDate = new Intl.DateTimeFormat('en-GB', optionsDate);
    const now = new Date();
    const parts = formatterDate.formatToParts(now);
    const day = parts.find((p) => p.type === 'day')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const year = parts.find((p) => p.type === 'year')?.value;
    const weekday = parts.find((p) => p.type === 'weekday')?.value;
    const dateStr = `${day}/${month}/${year} ${weekday}`;

    let h = now.getHours();
    let m = now.getMinutes();
    let s = now.getSeconds();
    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    const displayHour = hour24 ? padZero(h) : hour12.toString();

    setThailandTime({
      date: dateStr,
      hour: displayHour,
      minute: padZero(m),
      second: padZero(s),
      period: hour24 ? '' : period,
    });
  };

  useEffect(() => {
    setBackgroundColor(calculateSkyColor());
    updateThailandTime();
    const bgId = setInterval(() => setBackgroundColor(calculateSkyColor()), 60000);
    const tId = setInterval(updateThailandTime, 1000);
    return () => { clearInterval(bgId); clearInterval(tId); };
  }, [hour24]);

  const handleLiveButtonClick = () => window.open('https://youtu.be/DFnemdpr_aw?si=rKIZzgN3T9MFIRuA', '_blank');

  const handleDontShowAgain = () => {
    localStorage.setItem('dontShowInstructions', 'true');
    setShowInstructions(false);
    setShowConfirmPopup(true);
  };

  const openInstructions = () => setShowInstructions(true);
  const toggleTimeFormat = () => setHour24((prev) => !prev);

  // Water totals for modal
  const dailyWaterTotal = buildings.reduce(
    (acc, b) => acc + (waterUsageData.find((d) => d.building === b)?.usage || 0),
    0
  );
  const monthlyWaterTotal = dailyWaterTotal * 30;
  const selectedBuildingUsage =
    (selectedBuilding
      ? (waterUsageData.find((d) => d.building === selectedBuilding)?.usage || 0)
      : 0);

  return (
    <div className="app-container" style={{ background: backgroundColor }}>
      <nav className="navbar">
        <div className="live-button" onClick={handleLiveButtonClick}>
          <img src="/assets/live.png" alt="Live Stream" />
          <div className="live-label">LIVE</div>
        </div>

        <img
          src="/assets/mfu_logo.png"
          alt="MFU Logo"
          className="navbar-logo"
          onClick={openInstructions}
        />

        {/* Right side clock + help */}
        <div className="thailand-time">
          <div className="date">{thailandTime.date}</div>
          <div className="time-row">
            <div
              className="time"
              onClick={toggleTimeFormat}
              title="Toggle 24h/12h"
              role="button"
              tabIndex={0}
              onKeyDown={(e)=> (e.key==='Enter' || e.key===' ') && toggleTimeFormat()}
            >
              {thailandTime.hour}:{thailandTime.minute}:{thailandTime.second}
              {thailandTime.period && <span className="period"> {thailandTime.period}</span>}
            </div>

            {/* NEW: Help button */}
            <button
              className="help-btn"
              title="Show instructions"
              aria-label="Show instructions"
              onClick={openInstructions}
            >
              ?
            </button>
          </div>
        </div>
      </nav>

      <button className="hide-button" onClick={toggleDashboards}>
        {showDashboards ? 'Hide Dashboards' : 'Show Dashboards'}
      </button>

      <div className="map-container">
        <Suspense fallback={<div>Loading...</div>}>
          <Canvas style={{ width: '100vw', height: '100vh' }}>
            <PerformanceMonitor>
              <Map3D
                setPopupData={setPopupData}
                originalColors={originalColors}
                resetColors={resetColors}
                setResetColors={setResetColors}
                setOriginalColors={setOriginalColors}
                controllerCommand={controllerCommand}
                setControllerCommand={setControllerCommand}
              />
            </PerformanceMonitor>
          </Canvas>
        </Suspense>
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

      {!showDashboards && <Controller setControllerCommand={setControllerCommand} />}

      {popupData && (
        <div className="building-popup" style={{ top: popupData.y + 10, left: popupData.x + 10 }}>
          <div
            className="close-popup"
            onClick={() => {
              setPopupData(null);
              setResetColors(true);
            }}
          >
            ❌
          </div>

          <div className="popup-content">
            <h3>{popupData.name}</h3>
            <hr />
            <p>📍 <b>Location:</b> {popupData.name}</p>
            <p>⚡ <b>Electricity Usage:</b> 1234 kWh</p>
            <p>💧 <b>Water Usage:</b> 2345 L</p>
          </div>
        </div>
      )}

      {/* WEEKLY USAGE MODAL */}
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
          <div className="kpi">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{Math.round(usageTotal).toLocaleString()} kWh</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Avg / day</span>
            <span className="kpi-value">{Math.round(usageAvg).toLocaleString()} kWh</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Days</span>
            <span className="kpi-value">{usageCount}</span>
          </div>
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

      {/* OVERALL CAMPUS (water) */}
      <Modal open={isOverallPopupVisible} onClose={() => setIsOverallPopupVisible(false)}>
        <div className="modal-header">
          <h3 className="modal-title">Water Usage: Overall Campus</h3>
        </div>

        <div className="modal-kpis">
          <div className="kpi"><span className="kpi-label">Total Water Usage (Daily)</span><span className="kpi-value">{dailyWaterTotal.toFixed(2)} liters/day</span></div>
          <div className="kpi"><span className="kpi-label">Total Water Usage (Monthly)</span><span className="kpi-value">{monthlyWaterTotal.toFixed(2)} liters/month</span></div>
          <div className="kpi"><span className="kpi-label">Selected Building</span><span className="kpi-value">{selectedBuilding || '—'}</span></div>
        </div>

        <div className="modal-content">
          <div className="card gauge-card">
            <h4 className="card-title">{selectedBuilding ? selectedBuilding : 'Campus Water Usage'}</h4>
            <div className="gauge-holder">
              <GaugeChart
                id="building-speedometer"
                nrOfLevels={5}
                percent={selectedBuilding ? (selectedBuildingUsage / 1500) : 0.5}
                arcWidth={0.3}
                textColor="#ffffff"
                needleColor="#ff9800"
                needleBaseColor="#e01e5a"
                colors={['#5BE12C', '#F5CD19', '#EA4228']}
                cornerRadius={0}
                animate={false}
                hideText={true}
              />
              {selectedBuilding && (<p className="big-stat">{selectedBuildingUsage.toFixed(2)} liters/day</p>)}
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
                <div className="stat-value">{selectedBuildingUsage.toFixed(2)} liters/day</div>
              </div>
            )}
            <p className="muted-note">Tip: choosing a building updates the gauge on the left.</p>
          </div>
        </div>
      </Modal>

      {/* VEHICLE SCHEDULE — compact */}
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
          <button className="dont-show-btn" onClick={handleDontShowAgain}>Do not show me again</button>
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

export default App;
