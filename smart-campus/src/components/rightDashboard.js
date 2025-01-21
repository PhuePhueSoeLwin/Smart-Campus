import React, { useState, useEffect } from 'react';
import './rightDashboard.css'; // Custom CSS for styling
import { Line } from 'react-chartjs-2'; // To display graph
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

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
    comfort: 'Good', // Comfort level (Good, Moderate, Poor)
  });

  // Simulate periodic data updates (e.g., via API)
  useEffect(() => {
    const interval = setInterval(() => {
      setIeQData({
        co2: Math.floor(Math.random() * (600 - 300 + 1)) + 300,
        pollutants: Math.floor(Math.random() * (30 - 5 + 1)) + 5,
        temperature: Math.floor(Math.random() * (25 - 18 + 1)) + 18,
        humidity: Math.floor(Math.random() * (60 - 30 + 1)) + 30,
        comfort: Math.random() > 0.7 ? 'Poor' : 'Good',
      });
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Helper to determine comfort color
  const getComfortColor = (comfort) => {
    if (comfort === 'Good') return '#4CAF50'; // Green
    if (comfort === 'Moderate') return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Line chart data for temperature and humidity over time
  const chartData = {
    labels: Array.from({ length: 10 }, (_, i) => `Time ${i + 1}`),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: new Array(10).fill().map(() => Math.floor(Math.random() * (25 - 18 + 1)) + 18),
        fill: false,
        borderColor: '#FF9800',
        tension: 0.1,
      },
      {
        label: 'Humidity (%)',
        data: new Array(10).fill().map(() => Math.floor(Math.random() * (60 - 30 + 1)) + 30),
        fill: false,
        borderColor: '#4CAF50',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="right-dashboard">
      <h3>Real-time Data</h3>

      {/* IEQ Monitoring Section */}
      <div className="ieq-monitoring">
        <h4>Campus Environmental Quality (IEQ)</h4>
        <div className="data">
          <div className="metric">
            <p><strong>CO2 Levels:</strong> {ieqData.co2} ppm</p>
            <div className={`indicator ${ieqData.co2 > 500 ? 'high' : 'normal'}`}></div>
          </div>
          <div className="metric">
            <p><strong>Pollutants:</strong> {ieqData.pollutants} μg/m³</p>
            <div className={`indicator ${ieqData.pollutants > 25 ? 'high' : 'normal'}`}></div>
          </div>
          <div className="metric">
            <p><strong>Temperature:</strong> {ieqData.temperature} °C</p>
            <div className={`indicator ${ieqData.temperature > 24 ? 'high' : 'normal'}`}></div>
          </div>
          <div className="metric">
            <p><strong>Humidity:</strong> {ieqData.humidity} %</p>
            <div className={`indicator ${ieqData.humidity < 30 ? 'low' : 'normal'}`}></div>
          </div>
        </div>
        <div className="comfort">
          <p><strong>Comfort Level:</strong> <span style={{ color: getComfortColor(ieqData.comfort) }}>{ieqData.comfort}</span></p>
        </div>
      </div>

      {/* Line Graphs for Historical Data */}
      <div className="charts">
        <h4>Real-time Temperature and Humidity Graph</h4>
        <Line data={chartData} />
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
