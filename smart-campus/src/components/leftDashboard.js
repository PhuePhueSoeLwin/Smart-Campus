import React from 'react';
import './leftDashboard.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LeftDashboard = () => {
  const waterConsumptionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Water Consumption (Liters)',
        data: [1200, 1500, 1300, 1600, 1700, 1900, 2000],
        borderColor: '#4CAF50', // Smart green color
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        pointBackgroundColor: '#4CAF50',
        pointBorderColor: '#fff',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const electricityUsageData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: [250, 300, 280, 350, 400, 420, 450],
        borderColor: '#FF9800', // Smart orange color
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        pointBackgroundColor: '#FF9800',
        pointBorderColor: '#fff',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="left-dashboard">
      <h3>Water Consumption</h3>
      <div className="chart-container">
        <Line
          data={waterConsumptionData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: '#121212',
                titleColor: '#ffffff',
                bodyColor: '#b0b0b0',
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#555' },
              },
              y: {
                grid: { color: 'rgba(180, 180, 180, 0.1)' },
                ticks: { color: '#555' },
              },
            },
          }}
        />
      </div>

      <h3>Electricity Usage</h3>
      <div className="chart-container">
        <Line
          data={electricityUsageData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: '#121212',
                titleColor: '#ffffff',
                bodyColor: '#b0b0b0',
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#555' },
              },
              y: {
                grid: { color: 'rgba(180, 180, 180, 0.1)' },
                ticks: { color: '#555' },
              },
            },
          }}
        />
      </div>

      <h3>Students on Campus</h3>
      <p className="students-count">
        <strong>Connected via Wi-Fi:</strong> <span className="highlight">1,500</span>
      </p>
    </div>
  );
};

export default LeftDashboard;
