import React, { useState, Suspense } from 'react';
import Map3D from './components/Map3D'; // Import Map3D component
import './App.css'; // For additional styling
import LeftDashboard from './components/leftDashboard';
import RightDashboard from './components/rightDashboard';

const App = () => {
  const [showDashboards, setShowDashboards] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for burger menu

  const toggleDashboards = () => {
    setShowDashboards(!showDashboards);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <img src="/assets/mfu_logo.png" alt="MFU Logo" className="navbar-logo" />
        <div className={`burger-menu ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
      </nav>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="dropdown-menu">
          <ul>
            <li><a href="#dashboard1">Dashboard 1</a></li>
            <li><a href="#dashboard2">Dashboard 2</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      )}

      {/* Toggle Button */}
      <button className="hide-button" onClick={toggleDashboards}>
        {showDashboards ? 'Hide Dashboards' : 'Show Dashboards'}
      </button>

      {/* Fullscreen Map */}
      <div className="map-container">
        <Suspense fallback={<div>Loading...</div>}>
          <Map3D />
        </Suspense>
      </div>

      {/* Left Dashboard Overlay */}
      <div
        className={`dashboard-wrapper left-dashboard-wrapper ${
          showDashboards ? 'show' : 'hide'
        }`}
      >
        <LeftDashboard />
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
