import React, { useState } from 'react';
import './leftDashboard.css';
import { Pie, Bar } from 'react-chartjs-2';
import Calendar from 'react-calendar';  // Import the calendar
import 'react-calendar/dist/Calendar.css';  // Import the calendar's styles

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
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  // Get current day and create labels dynamically
  const today = new Date();
  const currentDay = today.getDay();

  // Generate labels for the last 7 days
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const day = (currentDay - i + 7) % 7;
    labels.push(new Date(today.setDate(today.getDate() - 1)).toLocaleDateString('en-US', { weekday: 'short' }));
  }

  const totalElectricityUsage = 121008.75;

  const dailyUsage = [];
  let totalGenerated = 0;
  for (let i = 0; i < 7; i++) {
    const avgDailyUsage = totalElectricityUsage / 7;
    const variation = (Math.random() * 0.1 - 0.05) * avgDailyUsage;
    const dailyValue = avgDailyUsage + variation;
    dailyUsage.push(dailyValue);
    totalGenerated += dailyValue;
  }

  const adjustmentFactor = totalElectricityUsage / totalGenerated;
  const adjustedDailyUsage = dailyUsage.map((usage) => usage * adjustmentFactor);

  const electricityUsageData = {
    labels: labels.reverse(),
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: adjustedDailyUsage.map((usage) => usage.toFixed(2)),
        backgroundColor: '#4daef4',
        borderColor: '#4daef4',
        borderWidth: 1,
      },
    ],
  };

  const waterConsumptionData = {
    labels: ['Used Water', 'Remaining Capacity'],
    datasets: [
      {
        label: 'Water Consumption',
        data: [65, 35],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  const carbonFootprintData = {
    labels: ['Emissions (kg)', 'Offset (kg)'],
    datasets: [
      {
        label: 'Carbon Footprint',
        data: [100, 20],
        backgroundColor: ['#FF9800', '#4CAF50'],
        hoverBackgroundColor: ['#FF9800', '#4CAF50'],
      },
    ],
  };

  return (
    <div className="left-dashboard">
      <h3>Electricity Usage</h3>
      <div className="chart-container">
        <Bar
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
                callbacks: {
                  label: (tooltipItem) => `${tooltipItem.raw} kWh`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#eeeeee' } },
              y: { grid: { color: 'rgba(180, 180, 180, 0.1)' }, ticks: { color: '#eeeeee', callback: (value) => `${value} kWh` } },
            },
          }}
        />
        <button
          className="calendar-button"
          onClick={() => setIsPopupVisible(true)}
        >
          Calendar
        </button>
      </div>

      <h3>Water Consumption</h3>
      <div className="chart-container">
        <Pie data={waterConsumptionData} />
      </div>

      <h3>Carbon Footprint</h3>
      <div className="chart-container">
        <Pie data={carbonFootprintData} />
      </div>

      {isPopupVisible && (
        <div className="popup-overlay" onClick={() => setIsPopupVisible(false)}>
          <div
            className="popup-box"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
          >
            <button
              className="close-button"
              onClick={() => setIsPopupVisible(false)}
            >
              ✖
            </button>
            <h3>Electricity Usage (Inside Popup)</h3>
            {/* Display the same bar chart inside the popup */}
            <div>
            <div className="popup-chart-container">
              <Bar
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
                      callbacks: {
                        label: (tooltipItem) => `${tooltipItem.raw} kWh`,
                      },
                    },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#eeeeee' } },
                    y: { grid: { color: 'rgba(180, 180, 180, 0.1)' }, ticks: { color: '#eeeeee', callback: (value) => `${value} kWh` } },
                  },
                }}
              />
            </div>
            <h3>Calendar</h3>
            {/* Add the calendar component inside the popup */}
            <div className="calendar-container">
              <Calendar />
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftDashboard;
