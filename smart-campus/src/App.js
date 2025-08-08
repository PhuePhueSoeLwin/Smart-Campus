import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import Map3D from './components/Map3D';
import './App.css';
import LeftDashboard from './components/leftDashboard';
import RightDashboard from './components/rightDashboard';
import Controller from './components/controller';

const App = () => {
  const [showDashboards, setShowDashboards] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#87CEEB');
  const [thailandTime, setThailandTime] = useState({ date: '', hour: '', minute: '', second: '', period: '' });

  const [popupData, setPopupData] = useState(null);
  const [resetColors, setResetColors] = useState(false);
  const [originalColors, setOriginalColors] = useState(new Map());
  const [controllerCommand, setControllerCommand] = useState(null);

  const [showInstructions, setShowInstructions] = useState(() => {
    const dontShow = localStorage.getItem('dontShowInstructions');
    return dontShow === 'true' ? false : true;
  });

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // Toggle: true = 24h, false = 12h
  const [hour24, setHour24] = useState(true);

  const toggleDashboards = () => {
    setShowDashboards((prev) => !prev);
  };

  const calculateSkyColor = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) {
      return 'linear-gradient(180deg, #FFB347, #FFD700)';
    } else if (hour >= 9 && hour < 17) {
      return '#87CEEB';
    } else if (hour >= 17 && hour < 19) {
      return 'linear-gradient(180deg, #FF4500, #FF6347)';
    } else {
      return '#2C3E50';
    }
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

    const formattedDateParts = formatterDate.formatToParts(now);
    const day = formattedDateParts.find((p) => p.type === 'day')?.value;
    const month = formattedDateParts.find((p) => p.type === 'month')?.value;
    const year = formattedDateParts.find((p) => p.type === 'year')?.value;
    const weekday = formattedDateParts.find((p) => p.type === 'weekday')?.value;

    const dateStr = `${day}/${month}/${year} ${weekday}`;

    let h = now.getHours();
    let m = now.getMinutes();
    let s = now.getSeconds();

    const period = h >= 12 ? 'PM' : 'AM';

    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;

    const displayHour = hour24 ? padZero(h) : hour12.toString();
    const displayMinute = padZero(m);
    const displaySecond = padZero(s);

    setThailandTime({
      date: dateStr,
      hour: displayHour,
      minute: displayMinute,
      second: displaySecond,
      period: hour24 ? '' : period,
    });
  };

  useEffect(() => {
    const updateBackground = () => {
      setBackgroundColor(calculateSkyColor());
    };

    updateBackground();
    updateThailandTime();
    const backgroundInterval = setInterval(updateBackground, 60000);
    const timeInterval = setInterval(updateThailandTime, 1000);

    return () => {
      clearInterval(backgroundInterval);
      clearInterval(timeInterval);
    };
  }, [hour24]);

  const handleLiveButtonClick = () => {
    window.open('https://youtu.be/DFnemdpr_aw?si=rKIZzgN3T9MFIRuA', '_blank');
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('dontShowInstructions', 'true');
    setShowInstructions(false);
    setShowConfirmPopup(true);
  };

  const openInstructions = () => {
    setShowInstructions(true);
  };

  // This toggles the entire time format between 24h and 12h
  const toggleTimeFormat = () => {
    setHour24((prev) => !prev);
  };

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

        <div className="thailand-time">
          <div className="date">{thailandTime.date}</div>
          <div className="time" onClick={toggleTimeFormat} title="Click to toggle 24h / 12h format" style={{ cursor: 'pointer' }}>
            {thailandTime.hour}:{thailandTime.minute}:{thailandTime.second}
            {thailandTime.period && <span className="period"> {thailandTime.period}</span>}
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
            <LeftDashboard />
          </div>

          <div className="dashboard-wrapper right-dashboard-wrapper show">
            <RightDashboard thailandTime={thailandTime} />
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
            <p>
              📍 <b>Location:</b> {popupData.name}
            </p>
            <p>
              ⚡ <b>Electricity Usage:</b> 1234 kWh
            </p>
            <p>
              💧 <b>Water Usage:</b> 2345 L
            </p>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="instructions-popup">
          <div
            className="close-button"
            onClick={() => setShowInstructions(false)}
            tabIndex={0}
            role="button"
            aria-label="Close instructions"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setShowInstructions(false);
            }}
          >
            ×
          </div>

          <h3 className="instruction-title">Map Controls</h3>

          <div className="instruction-list">
            <div className="instruction-item">
              <div className="key-badge">W</div>
              <div>Move Forward</div>
            </div>
            <div className="instruction-item">
              <div className="key-badge">S</div>
              <div>Move Backward</div>
            </div>
            <div className="instruction-item">
              <div className="key-badge">A</div>
              <div>Move Left</div>
            </div>
            <div className="instruction-item">
              <div className="key-badge">D</div>
              <div>Move Right</div>
            </div>
            <div className="instruction-item">
              <div className="key-badge">Space</div>
              <div>Move Upward</div>
            </div>
            <div className="instruction-item">
              <div className="key-badge">Shift</div>
              <div>Move Downward</div>
            </div>
          </div>

          <hr className="divider" />

          <p className="tip-text">
            💡 The on-screen controller pad (visible when dashboards are hidden) moves faster than keyboard controls.
          </p>

          <button
            className="dont-show-btn"
            onClick={handleDontShowAgain}
            aria-label="Do not show instructions again"
          >
            Do not show me again
          </button>
        </div>
      )}

      {showConfirmPopup && (
        <div className="confirm-popup">
          <div
            className="close-button"
            onClick={() => setShowConfirmPopup(false)}
            tabIndex={0}
            role="button"
            aria-label="Close confirmation"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setShowConfirmPopup(false);
            }}
          >
            ×
          </div>
          <p className="confirm-text">
            💡 This Instructions will be permanently closed after clicking 'Do not show me again' and will appear when you click the MFU Logo from the Navigation Bar.
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
