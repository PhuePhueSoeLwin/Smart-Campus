import React from "react";
import "./Sidebar.css"; // Create a CSS file for styling

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="dashboard">
        <h3>Electricity Usage</h3>
        <p>Details...</p>
      </div>
      <div className="dashboard">
        <h3>Water Consumption</h3>
        <p>Details...</p>
      </div>
      <div className="dashboard">
        <h3>Student Tracking</h3>
        <p>Details...</p>
      </div>
    </div>
  );
};

export default Sidebar;
