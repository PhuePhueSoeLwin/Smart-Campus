import React, { useState, Suspense } from 'react';
import Map3D from './components/Map3D'; // Import Map3D component
import './App.css'; // For additional styling
import LeftDashboard from './components/leftDashboard';
import RightDashboard from './components/rightDashboard';

const App = () => {
  const [showDashboards, setShowDashboards] = useState(true);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);

  const toggleDashboards = () => {
    setShowDashboards(!showDashboards);
  };

  const handleCalendarClick = () => {
    setShowCalendarPopup(true);
  };

  const closeCalendarPopup = () => {
    setShowCalendarPopup(false);
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <img src="/assets/mfu_logo.png" alt="MFU Logo" className="navbar-logo" />
      </nav>

      {/* Toggle Button */}
      <button className="hide-button" onClick={toggleDashboards}>
        {showDashboards ? 'Hide Dashboards' : 'Show Dashboards'}
      </button>

      {/* Fullscreen Map */}
      <div className="map-container">
        <Suspense fallback={<div>Loading...</div>}>
          <Map3D />
        </Suspense>

        {/* Calendar Popup over 3D Map */}
        {showCalendarPopup && (
          <div className="popup-overlay" onClick={closeCalendarPopup}>
            <div className="popup-box" onClick={(e) => e.stopPropagation()}>
              <h3>Calendar</h3>
              <p>This is the calendar popup content over the 3D map.</p>
              <button onClick={closeCalendarPopup}>Close</button>
            </div>
          </div>
        )}
      </div>

      {/* Left Dashboard Overlay */}
      <div
        className={`dashboard-wrapper left-dashboard-wrapper ${
          showDashboards ? 'show' : 'hide'
        }`}
      >
        <LeftDashboard onCalendarClick={handleCalendarClick} />
      </div>

      {/* Right Dashboard Overlay */}
      <div
        className={`dashboard-wrapper right-dashboard-wrapper ${
          showDashboards ? 'show' : 'hide'
        }`}
      >
        <RightDashboard />
      </div>
    </div>
  );
};

export default App;
