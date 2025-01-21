import React, { useState, useEffect } from 'react';
import './rightDashboard.css'; // Custom CSS for styling
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaCaretDown } from 'react-icons/fa'; // Import down arrow icon

// Register necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RightDashboard = () => {
  // State for real-time IEQ data
  const [ieqData, setIeQData] = useState({
    co2: 400, // CO2 levels in ppm
    pollutants: 15, // Pollutants in μg/m³
    temperature: 22, // Temperature in °C
    humidity: 45, // Humidity in percentage
    windSpeed: 10, // Wind speed in km/h
    comfort: 'Good', // Comfort level (Good, Moderate, Poor)
  });

  // State for the number of students on campus
  const [studentCount, setStudentCount] = useState(12000); // Initial student count

  // State for selected building
  const [selectedBuilding, setSelectedBuilding] = useState("");

  // Buildings list
  const buildings = [
    "Msquare", "E1", "E2", "E3", "E4", "C1", "C2", "C3", "C4", "C5", "D1", "AD1", "AD2",
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "M3"
  ];

  // Simulate periodic data updates (e.g., via API)
  useEffect(() => {
    // Interval for updating IEQ data
    const interval = setInterval(() => {
      setIeQData({
        co2: Math.floor(Math.random() * (600 - 300 + 1)) + 300,
        pollutants: Math.floor(Math.random() * (30 - 5 + 1)) + 5,
        temperature: Math.floor(Math.random() * (25 - 18 + 1)) + 18,
        humidity: Math.floor(Math.random() * (60 - 30 + 1)) + 30,
        windSpeed: Math.floor(Math.random() * (20 - 5 + 1)) + 5, // Random wind speed between 5 and 20 km/h
        comfort: Math.random() > 0.7 ? 'Poor' : 'Good',
      });
    }, 5000);

    // Interval for updating student count based on Wi-Fi usage
    const studentInterval = setInterval(() => {
      const change = Math.floor(Math.random() * 20) - 10; // Random change between -10 and 10 students
      setStudentCount(prevCount => prevCount + change);
    }, 1000);

    return () => {
      clearInterval(interval); // Cleanup IEQ data interval
      clearInterval(studentInterval); // Cleanup student count interval
    };
  }, []);

  // Helper to calculate percentage
  const getStudentPercentage = () => {
    const maxStudents = 20000; // Max student capacity for campus
    return (studentCount / maxStudents) * 100;
  };

  return (
    <div className="right-dashboard">
      
      <h3>Campus Environmental Quality (IEQ)</h3>
      {/* IEQ Monitoring Section */}
      <div className="ieq-monitoring">
        <div className="data">
          <div className="metric">
            <div className="indicator-container">
              <div className={`indicator ${ieqData.co2 > 500 ? 'high' : 'normal'}`}></div>
            </div>
            <p><strong>CO2 Levels:</strong> {ieqData.co2} ppm</p>
          </div>
          <div className="metric">
            <div className="indicator-container">
              <div className={`indicator ${ieqData.pollutants > 25 ? 'high' : 'normal'}`}></div>
            </div>
            <p><strong>Pollutants:</strong> {ieqData.pollutants} μg/m³</p>
          </div>
          <div className="metric">
            <div className="indicator-container">
              <div className={`indicator ${ieqData.temperature > 24 ? 'high' : 'normal'}`}></div>
            </div>
            <p><strong>Temperature:</strong> {ieqData.temperature} °C</p>
          </div>
          <div className="metric">
            <div className="indicator-container">
              <div className={`indicator ${ieqData.humidity < 30 ? 'low' : 'normal'}`}></div>
            </div>
            <p><strong>Humidity:</strong> {ieqData.humidity} %</p>
          </div>
          {/* Wind Speed Metric */}
          <div className="metric">
            <div className="indicator-container">
              <div className={`indicator ${ieqData.windSpeed > 15 ? 'high' : 'normal'}`}></div>
            </div>
            <p><strong>Wind Speed:</strong> {ieqData.windSpeed} km/h</p>
          </div>
        </div>
        <div className="comfort">
          <p><strong>Comfort Level:</strong> <span>{ieqData.comfort}</span></p>
        </div>
      </div>
      <h3>Students On Campus</h3>
      <button className="dropdown-btn">
          {selectedBuilding || "Select Building"} <FaCaretDown />
        </button>
        {/* Dropdown Menu */}
        <div className="dropdown-content">
          {buildings.map(building => (
            <button key={building} onClick={() => setSelectedBuilding(building)}>{building}</button>
          ))}
        </div>

      {/* Student Count Circular Progress Indicator */}
      <div className="student-count">
        <div className="circle-progress-container">
          <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
            <circle cx="75" cy="75" r="70" stroke="#ddd" strokeWidth="10" fill="none" />
            <circle
              cx="75"
              cy="75"
              r="70"
              stroke="#4CAF50"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${getStudentPercentage()} ${100 - getStudentPercentage()}`}
              strokeDashoffset="25"
              strokeLinecap="round"
              className="rotate-progress"
            />
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="18" fill="#fff">
              {studentCount}
            </text>
          </svg>
        </div>
      </div>

      {/* Alerts Section */}
      <h3>Alerts</h3>
      <p>Recent system or campus alerts will go here.</p>

      {/* Upcoming Events */}
      <h3>Upcoming Events</h3>
      <p>Details on upcoming campus events or activities.</p>
    </div>
  );
};

export default RightDashboard;
