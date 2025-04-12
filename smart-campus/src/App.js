import React, { useState, useEffect, Suspense } from 'react';
import Map3D from './components/Map3D'; // Import Map3D component
import './App.css'; // Import styles
import LeftDashboard from './components/leftDashboard';
import RightDashboard from './components/rightDashboard';
import Controller from './components/controller'; // Import the controller component

const App = () => {
  const [showDashboards, setShowDashboards] = useState(true); // Initially show dashboards
  const [backgroundColor, setBackgroundColor] = useState('#87CEEB'); // Default sky blue
  const [thailandTime, setThailandTime] = useState({
    date: '',
    day: '',
    time: '',
  });

  // Toggle the dashboards and controller visibility
  const toggleDashboards = () => {
    setShowDashboards((prev) => !prev); // Toggle the dashboards state
  };

  // Function to calculate the background color based on time
  const calculateSkyColor = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) {
      // Sunrise
      return 'linear-gradient(180deg, #FFB347, #FFD700)';
    } else if (hour >= 9 && hour < 17) {
      // Daytime
      return '#87CEEB';
    } else if (hour >= 17 && hour < 19) {
      // Sunset
      return 'linear-gradient(180deg, #FF4500, #FF6347)';
    } else {
      // Night
      return '#2C3E50';
    }
  };

  // Function to update the current date and time in Thailand
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

  // Update the background color and time when the component mounts or the time changes
  useEffect(() => {
    const updateBackground = () => {
      setBackgroundColor(calculateSkyColor());
    };

    updateBackground();
    updateThailandTime();
    const backgroundInterval = setInterval(updateBackground, 60000); // Update background every minute
    const timeInterval = setInterval(updateThailandTime, 1000); // Update time every second
    return () => {
      clearInterval(backgroundInterval);
      clearInterval(timeInterval); // Cleanup intervals on unmount
    };
  }, []);

  const handleLiveButtonClick = () => {
    window.open('https://youtu.be/DFnemdpr_aw?si=rKIZzgN3T9MFIRuA', '_blank');
  };

  return (
    <div className="app-container" style={{ background: backgroundColor }}>
      {/* Navigation Bar */}
      <nav className="navbar">
        {/* Live Button */}
        <div className="live-button" onClick={handleLiveButtonClick}>
          <img src="/assets/live.png" alt="Live Stream" />
          <div className="live-label">LIVE</div>
        </div>

        {/* MFU Logo */}
        <img src="/assets/mfu_logo.png" alt="MFU Logo" className="navbar-logo" />

        {/* Thailand Time */}
        <div className="thailand-time">
          <div className="date">{thailandTime.date}</div>
          <div className="day">{thailandTime.day}</div>
          <div className="time">{thailandTime.time}</div>
        </div>
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
      </div>

      {/* Conditionally render the Left and Right Dashboards */}
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

      {/* Conditionally render the Controller */}
      {!showDashboards && <Controller />} {/* Show controller only when dashboards are hidden */}
    </div>
  );
};

export default App;
