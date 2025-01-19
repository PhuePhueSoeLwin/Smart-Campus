import React, { useState } from 'react';
import './leftDashboard.css';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const LeftDashboard = () => {
  const [view, setView] = useState('overall'); // State to track the selected view

  // Data for Overall Campus
  const overallElectricityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: [2500, 3000, 2800, 3500, 4000, 4200, 4500],
        backgroundColor: '#FF9800',
        borderColor: '#FF9800',
        borderWidth: 1,
      },
    ],
  };

  const overallWaterData = {
    labels: ['Used Water', 'Remaining Capacity'],
    datasets: [
      {
        label: 'Water Consumption',
        data: [6000, 4000],
        backgroundColor: ['#36A2EB', '#e0e0e0'],
        borderWidth: 0,
      },
    ],
  };

  const overallCarbonData = {
    labels: ['Emissions (kg)', 'Offset (kg)'],
    datasets: [
      {
        label: 'Carbon Footprint',
        data: [12000, 3000],
        backgroundColor: ['#FF6347', '#4CAF50'],
        borderWidth: 0,
      },
    ],
  };

  // Data for Specific Building
  const buildingElectricityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: [250, 300, 280, 350, 400, 420, 450],
        backgroundColor: '#FF9800',
        borderColor: '#FF9800',
        borderWidth: 1,
      },
    ],
  };

  const buildingWaterData = {
    labels: ['Used Water', 'Remaining Capacity'],
    datasets: [
      {
        label: 'Water Consumption',
        data: [600, 400],
        backgroundColor: ['#36A2EB', '#e0e0e0'],
        borderWidth: 0,
      },
    ],
  };

  const buildingCarbonData = {
    labels: ['Emissions (kg)', 'Offset (kg)'],
    datasets: [
      {
        label: 'Carbon Footprint',
        data: [1200, 300],
        backgroundColor: ['#FF6347', '#4CAF50'],
        borderWidth: 0,
      },
    ],
  };

  // Determine which data to display based on the selected view
  const electricityData = view === 'overall' ? overallElectricityData : buildingElectricityData;
  const waterData = view === 'overall' ? overallWaterData : buildingWaterData;
  const carbonData = view === 'overall' ? overallCarbonData : buildingCarbonData;

  const rpmOptions = {
    rotation: -90,
    circumference: 180,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#eeeeee',
        },
      },
    },
  };

  return (
    <div className="left-dashboard">
      <div className="button-group">
        <button
          className={`toggle-button ${view === 'overall' ? 'active' : ''}`}
          onClick={() => setView('overall')}
        >
          Overall
        </button>
        <button
          className={`toggle-button ${view === 'building' ? 'active' : ''}`}
          onClick={() => setView('building')}
        >
          Specific Building
        </button>
      </div>

      <h3>Electricity Usage</h3>
      <div className="chart-container">
        <Bar
          data={electricityData}
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
                ticks: { color: '#eeeeee' },
              },
              y: {
                grid: { color: 'rgba(180, 180, 180, 0.1)' },
                ticks: { color: '#eeeeee' },
              },
            },
          }}
        />
      </div>

      <h3>Water Consumption</h3>
      <div className="chart-container rpm-style">
        <Doughnut data={waterData} options={rpmOptions} />
      </div>

      <h3>Carbon Footprint</h3>
      <div className="chart-container rpm-style">
        <Doughnut data={carbonData} options={rpmOptions} />
      </div>
    </div>
  );
};

export default LeftDashboard;
