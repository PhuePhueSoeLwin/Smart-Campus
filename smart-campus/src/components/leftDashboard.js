import React from 'react';
import './leftDashboard.css';
import { Pie, Bar } from 'react-chartjs-2';
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
  // Get current day and create labels dynamically
  const today = new Date();
  const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, etc.

  // Generate labels for the last 7 days
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const day = (currentDay - i + 7) % 7; // Wrap around to ensure no negative days
    labels.push(new Date(today.setDate(today.getDate() - 1)).toLocaleDateString('en-US', { weekday: 'short' }));
  }

  // Total electricity usage for the week (121008.75 kWh)
  const totalElectricityUsage = 121008.75;

  // Generate random variations for daily electricity usage
  const dailyUsage = [];
  let totalGenerated = 0;
  for (let i = 0; i < 7; i++) {
    // Random variation between -5% and +5% of the average daily usage
    const avgDailyUsage = totalElectricityUsage / 7;
    const variation = (Math.random() * 0.1 - 0.05) * avgDailyUsage; // Random variation between -5% and +5%
    const dailyValue = avgDailyUsage + variation;
    dailyUsage.push(dailyValue);
    totalGenerated += dailyValue;
  }

  // Adjust the daily values so that their sum is exactly 121008.75 kWh
  const adjustmentFactor = totalElectricityUsage / totalGenerated;
  const adjustedDailyUsage = dailyUsage.map((usage) => usage * adjustmentFactor);

  // Electricity Usage Data for Bar Chart
  const electricityUsageData = {
    labels: labels.reverse(), // Reverse to make sure the current day is the last
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: adjustedDailyUsage.map((usage) => usage.toFixed(2)), // Display data with 2 decimal places
        backgroundColor: '#4daef4', // Blue color (change from orange)
        borderColor: '#4daef4',
        borderWidth: 1,
      },
    ],
  };

  // Water Consumption Data for Pie Chart (Daily percentage for a week)
  const waterConsumptionData = {
    labels: ['Used Water', 'Remaining Capacity'],
    datasets: [
      {
        label: 'Water Consumption',
        data: [65, 35], // Example percentages for the week
        backgroundColor: ['#36A2EB', '#FF6384'], // Smart colors
        hoverBackgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  // Carbon Footprint Data for Pie Chart (Daily breakdown of emissions and offset)
  const carbonFootprintData = {
    labels: ['Emissions (kg)', 'Offset (kg)'],
    datasets: [
      {
        label: 'Carbon Footprint',
        data: [100, 20], // Example data (emissions and offset for the week)
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
                  label: (tooltipItem) => {
                    // Display the value with the unit kWh
                    return `${tooltipItem.raw} kWh`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#eeeeee' },
              },
              y: {
                grid: { color: 'rgba(180, 180, 180, 0.1)' },
                ticks: {
                  color: '#eeeeee',
                  callback: (value) => `${value} kWh`, // Display the unit on the y-axis ticks
                },
              },
            },
          }}
        />
        <button className="calendar-button">Calendar</button>
      </div>

      <h3>Water Consumption</h3>
      <div className="chart-container">
        <Pie data={waterConsumptionData} />
      </div>

      <h3>Carbon Footprint</h3>
      <div className="chart-container">
        <Pie data={carbonFootprintData} />
      </div>
    </div>
  );
};

export default LeftDashboard;