import React from 'react';
import './leftDashboard.css'; // You can create a custom CSS file for styling

const LeftDashboard = () => {
  return (
    <div className="left-dashboard">
      <h3>Water Consumption</h3>
      <p>Details on current water usage will go here.</p>
      
      <h3>Electricity Usage</h3>
      <p>Details on current electricity usage will go here.</p>
      
      <h3>Students on Campus</h3>
      <p>Number of students connected via Wi-Fi: 1500</p>
    </div>
  );
};

export default LeftDashboard;
