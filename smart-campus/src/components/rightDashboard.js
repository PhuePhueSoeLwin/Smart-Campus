import React from 'react';
import './rightDashboard.css'; // Create a custom CSS file for styling

const RightDashboard = () => {
  return (
    <div className="right-dashboard">
      <h3>Real-time Data</h3>
      <p>Here you can display data such as energy consumption, traffic, etc.</p>

      <h3>Alerts</h3>
      <p>Recent system or campus alerts will go here.</p>

      <h3>Upcoming Events</h3>
      <p>Details on upcoming campus events or activities.</p>
    </div>
  );
};

export default RightDashboard;
