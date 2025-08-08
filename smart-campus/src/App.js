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
  const [thailandTime, setThailandTime] = useState({ date: '', day: '', time: '' });

  const [popupData, setPopupData] = useState(null);
  const [resetColors, setResetColors] = useState(false);
  const [originalColors, setOriginalColors] = useState(new Map());
  const [controllerCommand, setControllerCommand] = useState(null);

  // Show instructions popup automatically unless user opted out
  const [showInstructions, setShowInstructions] = useState(() => {
    const dontShow = localStorage.getItem('dontShowInstructions');
    return dontShow === 'true' ? false : true;
  });

  // New state for confirmation popup after "Do not show me again"
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

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

  const updateThailandTime = () => {
    const options = {
      timeZone: 'Asia/Bangkok',
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const date = new Date();
    const parts = formatter.formatToParts(date);

    const day = parts.find((part) => part.type === 'weekday')?.value;
    const dayNum = parts.find((part) => part.type === 'day')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const year = parts.find((part) => part.type === 'year')?.value;
    const hour = parts.find((part) => part.type === 'hour')?.value;
    const minute = parts.find((part) => part.type === 'minute')?.value;
    const second = parts.find((part) => part.type === 'second')?.value;
    const period = parts.find((part) => part.type === 'dayPeriod')?.value;

    const time = `${hour}:${minute}:${second} ${period}`;

    setThailandTime({
      date: `${dayNum} ${month} ${year}`,
      day,
      time,
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
  }, []);

  const handleLiveButtonClick = () => {
    window.open('https://youtu.be/DFnemdpr_aw?si=rKIZzgN3T9MFIRuA', '_blank');
  };

  // Handler for "Do not show me again" button in instructions popup
  const handleDontShowAgain = () => {
    localStorage.setItem('dontShowInstructions', 'true');
    setShowInstructions(false);
    setShowConfirmPopup(true);
  };

  // Clicking MFU logo always opens instructions popup
  const openInstructions = () => {
    setShowInstructions(true);
  };

  return (
    <div className="app-container" style={{ background: backgroundColor }}>
      {/* Navbar */}
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
          <div className="day">{thailandTime.day}</div>
          <div className="time">{thailandTime.time}</div>
        </div>
      </nav>

      {/* Hide / Show Dashboards Button */}
      <button className="hide-button" onClick={toggleDashboards}>
        {showDashboards ? 'Hide Dashboards' : 'Show Dashboards'}
      </button>

      {/* Map Section */}
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

      {/* Dashboards */}
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

      {/* Controller */}
      {!showDashboards && (
        <Controller setControllerCommand={setControllerCommand} />
      )}

      {/* Popup Box for building info */}
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

      {/* Instructions Popup */}
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

      {/* Confirmation popup after clicking 'Do not show me again' */}
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
