import React from 'react';
import './leftDashboard.css';
import { Bar, Line } from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const LeftDashboard = ({
  weeklyData,
  weeklyLabels,
  waterUsageData,
  onOpenWeeklyPopup,
  onOpenOverallPopup,
}) => {
  const mainElectricityUsageData = {
    labels: weeklyLabels[0].slice().reverse(),
    datasets: [
      {
        label: 'Electricity Usage (kWh)',
        data: weeklyData[0].slice().reverse().map((usage) => usage.toFixed(2)),
        backgroundColor: '#4daef4',
        borderColor: '#4daef4',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="left-dashboard">
      <h3>Electricity Usage</h3>
      <div className="chart-container">
        <Bar
          data={mainElectricityUsageData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
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
              y: {
                grid: { color: 'rgba(180, 180, 180, 0.1)' },
                ticks: {
                  color: '#eeeeee',
                  callback: (value) => `${value} kWh`,
                },
              },
            },
          }}
        />

        {/* Weekly Usage button (triggers App.js popup) */}
        <button className="calendar-button" onClick={onOpenWeeklyPopup}>
          Weekly Usage
        </button>
      </div>

      <h3>Water Consumption</h3>
      <div className="water-consumption-speedometers">
        {/* Overall Campus button (triggers App.js popup) */}
        <button className="overallcampus-button" onClick={onOpenOverallPopup}>
          Overall Campus
        </button>

        {waterUsageData.slice(0, 3).map((data, index) => (
          <div key={index} className="speedometer-container">
            <h4>{data.building}</h4>
            <GaugeChart
              id={`gauge-chart-${index}`}
              nrOfLevels={5}
              percent={data.usage / 1500}
              arcWidth={0.3}
              textColor="#eeeeee"
              needleColor="#ff9800"
              needleBaseColor="#e01e5a"
              colors={['#5BE12C', '#F5CD19', '#EA4228']}
              cornerRadius={0}
              animate={false}
              hideText={true}
              formatTextValue={() => ''}
            />
            <p>{data.usage.toFixed(2)} liters/day</p>
          </div>
        ))}
      </div>

      <h3>Carbon Footprint</h3>
      <div
        className="carbon-container"
        style={{ backgroundColor: 'transparent', padding: '10px', height: '250px' }}
      >
        <Line
          data={{
            labels: ['524', '1047', '1570', '2093', '2616', '3139', '3662', '4185', '4708', '5231'],
            datasets: [
              {
                data: [90, 95, 100, 110, 160, 140, 120, 130, 110, 105],
                borderColor: 'rgba(255, 0, 0, 0.9)',
                backgroundColor: 'rgba(255, 0, 0, 0.3)',
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2,
              },
              {
                data: [50, 55, 60, 65, 80, 70, 68, 72, 60, 58],
                borderColor: 'rgba(0, 123, 255, 0.9)',
                backgroundColor: 'rgba(0, 123, 255, 0.3)',
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2,
              },
              {
                data: [30, 35, 40, 42, 50, 48, 45, 47, 44, 42],
                borderColor: 'rgba(0, 200, 83, 0.9)',
                backgroundColor: 'rgba(0, 200, 83, 0.3)',
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#fff' } },
              tooltip: {
                enabled: true,
                backgroundColor: '#222',
                titleColor: '#fff',
                bodyColor: '#fff',
              },
            },
            scales: {
              x: {
                grid: { color: 'rgba(200,200,200,0.15)' },
                ticks: { color: '#fff', font: { size: 12 } },
              },
              y: {
                grid: { color: 'rgba(200,200,200,0.15)' },
                ticks: { color: '#fff', font: { size: 12 } },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default LeftDashboard;
