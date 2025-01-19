import React from 'react';
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
  // Electricity Usage Data for Bar Chart
  const electricityUsageData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: [250, 300, 280, 350, 400, 420, 450],
        backgroundColor: '#FF9800', // Smart orange
        borderColor: '#FF9800',
        borderWidth: 1,
      },
    ],
  };

  // Water Consumption Data for RPM-style Doughnut Chart
  const waterConsumptionData = {
    labels: ['Used Water', 'Remaining Capacity'],
    datasets: [
      {
        label: 'Water Consumption',
        data: [60, 40],
        backgroundColor: ['#36A2EB', '#e0e0e0'], // Used water in blue, remaining in gray
        borderWidth: 0,
      },
    ],
  };

  // Carbon Footprint Data for RPM-style Doughnut Chart
  const carbonFootprintData = {
    labels: ['Emissions (kg)', 'Offset (kg)'],
    datasets: [
      {
        label: 'Carbon Footprint',
        data: [120, 30],
        backgroundColor: ['#FF6347', '#4CAF50'], // Emissions in red, offset in green
        borderWidth: 0,
      },
    ],
  };

  // Options for RPM-style Doughnut Chart
  const rpmOptions = {
    rotation: -90, // Start angle (top center)
    circumference: 180, // Only show half-circle
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
        <Doughnut data={waterConsumptionData} options={rpmOptions} />
      </div>

      <h3>Carbon Footprint</h3>
      <div className="chart-container rpm-style">
        <Doughnut data={carbonFootprintData} options={rpmOptions} />
      </div>
    </div>
  );
};

export default LeftDashboard;
