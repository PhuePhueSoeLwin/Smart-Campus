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

  return (
    <div className="app-container" style={{ background: backgroundColor }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="live-button" onClick={handleLiveButtonClick}>
          <img src="/assets/live.png" alt="Live Stream" />
          <div className="live-label">LIVE</div>
        </div>

        <img src="/assets/mfu_logo.png" alt="MFU Logo" className="navbar-logo" />

        <div className="thailand-time">
          <div className="date">{thailandTime.date}</div>
          <div className="day">{thailandTime.day}</div>
          <div className="time">{thailandTime.time}</div>
        </div>
      </nav>

      {/* Hide / Show Button */}
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

      {/* Popup Box */}
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
    </div>
  );
};

export default App;
