import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import Map3D from './components/Map3D'; // import Map3D
import './App.css';
import LeftDashboard from './components/leftDashboard';
import RightDashboard from './components/rightDashboard';
import Controller from './components/controller';

const App = () => {
  const [showDashboards, setShowDashboards] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#87CEEB');
  const [thailandTime, setThailandTime] = useState({
    date: '',
    day: '',
    time: '',
  });

  const [popupData, setPopupData] = useState(null);
  const [resetColors, setResetColors] = useState(false);
  const [originalColors, setOriginalColors] = useState(new Map());
  const [controllerCommand, setControllerCommand] = useState(null);

  // Show instructions popup automatically unless user opted out
  const [showInstructions, setShowInstructions] = useState(() => {
    const dontShow = localStorage.getItem('dontShowInstructions');
    return dontShow === 'true' ? false : true;
  });

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
          style={{ cursor: 'pointer' }}
          onClick={openInstructions} // Show instructions popup on logo click
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
        <div
          style={{
            position: 'absolute',
            top: popupData.y + 10,
            left: popupData.x + 10,
            background: 'rgba(44, 44, 44, 0.5)',
            padding: '15px',
            borderRadius: '10px',
            color: 'white',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            width: '220px',
            transition: 'opacity 0.3s ease-in-out',
            opacity: 1,
            zIndex: 1500,
          }}
        >
          <div
            onClick={() => {
              setPopupData(null);
              setResetColors(true);
            }}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#FFF',
              userSelect: 'none',
            }}
          >
            ❌
          </div>

          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: '0', fontSize: '16px', color: '#1E90FF' }}>
              {popupData.name}
            </h3>
            <hr style={{ border: '0.5px solid rgba(255,255,255,0.3)' }} />
            <p style={{ fontSize: '12px', marginBottom: '5px' }}>
              📍 <b>Location:</b> {popupData.name}
            </p>
            <p style={{ fontSize: '12px', marginBottom: '5px' }}>
              ⚡ <b>Electricity Usage:</b> 1234 kWh
            </p>
            <p style={{ fontSize: '12px', marginBottom: '5px' }}>
              💧 <b>Water Usage:</b> 2345 L
            </p>
          </div>
        </div>
      )}

      {/* Instructions Popup */}
      {showInstructions && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            color: '#fff',
            width: '360px',
            padding: '30px 35px',
            zIndex: 2000,
            animation: 'fadeScaleIn 0.3s ease forwards',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          }}
        >
          <style>{`
            @keyframes fadeScaleIn {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            .close-button {
              position: absolute;
              top: 15px;
              right: 15px;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.2);
              color: #fff;
              font-weight: bold;
              font-size: 20px;
              line-height: 28px;
              text-align: center;
              cursor: pointer;
              transition: background 0.3s ease;
              user-select: none;
            }
            .close-button:hover {
              background: rgba(255, 255, 255, 0.4);
            }
            .instruction-title {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 22px;
              color: #3399FF;
              text-align: center;
            }
            .instruction-list {
              display: flex;
              flex-direction: column;
              gap: 16px;
              margin-bottom: 24px;
            }
            .instruction-item {
              display: flex;
              align-items: center;
              gap: 18px;
              font-size: 17px;
              font-weight: 500;
            }
            .key-badge {
              display: inline-flex;
              justify-content: center;
              align-items: center;
              min-width: 40px;
              height: 40px;
              padding: 0 12px;
              border-radius: 12px;
              background: rgba(51, 153, 255, 0.9);
              font-weight: 700;
              font-size: 18px;
              color: white;
              user-select: none;
              box-shadow: 0 4px 10px rgba(51, 153, 255, 0.6);
              text-transform: uppercase;
              white-space: nowrap;
            }
            .tip-text {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
              text-align: center;
              line-height: 1.5;
              user-select: none;
              margin-bottom: 16px;
            }
            .divider {
              border: none;
              border-top: 1px solid rgba(255,255,255,0.25);
              margin-bottom: 20px;
            }
            .dont-show-btn {
              display: block;
              margin: 0 auto;
              padding: 10px 18px;
              background: rgba(255, 255, 255, 0.2);
              color: white;
              font-weight: 600;
              font-size: 14px;
              border-radius: 12px;
              cursor: pointer;
              user-select: none;
              transition: background 0.3s ease;
              width: fit-content;
              text-align: center;
            }
            .dont-show-btn:hover {
              background: rgba(255, 255, 255, 0.4);
            }
          `}</style>

          <div
            className="close-button"
            onClick={() => setShowInstructions(false)}
            aria-label="Close instructions"
            role="button"
            tabIndex={0}
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
    </div>
  );
};

export default App;
