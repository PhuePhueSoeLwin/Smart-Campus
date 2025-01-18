import React, { useState, Suspense } from 'react';
import Map3D from './components/Map3D';  // Import Map3D component
import './App.css';  // For additional styling
import LeftDashboard from './components/leftDashboard';
import RightDashboard from './components/rightDashboard';

const App = () => {
  // State to control the visibility of the dashboards
  const [showDashboards, setShowDashboards] = useState(true);

  // Function to toggle the visibility of the dashboards
  const toggleDashboards = () => {
    setShowDashboards(!showDashboards);
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <img src="/assets/mfu_logo.png" alt="MFU Logo" className="navbar-logo" />
      </nav>

      {/* Button to hide/show dashboards */}
      <button className="hide-button" onClick={toggleDashboards}>
        {showDashboards ? 'Hide Dashboards' : 'Show Dashboards'}
      </button>

      <div className="content-container">
        {/* Conditionally render the LeftDashboard */}
        {showDashboards && <LeftDashboard />}
        
        {/* 3D Map Canvas */}
        <Suspense fallback={<div>Loading...</div>}>
          <div className="map-container">
            <Map3D />
          </div>
        </Suspense>

        {/* Conditionally render the RightDashboard */}
        {showDashboards && <RightDashboard />}
      </div>
    </div>
  );
};

export default App;
