import React, { useState, useEffect } from "react";
import "./leftDashboard.css";
import { Bar } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import GaugeChart from "react-gauge-chart"; // Importing gauge chart

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const LeftDashboard = () => {
  const [isWeeklyPopupVisible, setIsWeeklyPopupVisible] = useState(false);
  const [isOverallPopupVisible, setIsOverallPopupVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([new Date(), new Date()]);
  const [waterUsageData, setWaterUsageData] = useState([]);
  const totalElectricityUsage = 121008.75;

  // Buildings and water usage data
  const buildings = [
    "Msquare", "E1", "E2", "E3", "E4", "C1", "C2", "C3", "C4", "C5", "D1", "AD1", "AD2",
    "F1", "F2", "F3", "F4", "F5", "F6", "L1", "L2", "L3", "L4", "L5", "L6", "L7"
  ];

  // Generate mock data for multiple weeks
  const generateWeeklyData = (weeks = 4) => {
    const weeklyData = [];
    const weeklyLabels = [];
    const today = new Date();

    for (let week = 0; week < weeks; week++) {
      const weekData = [];
      const labels = [];
      let totalGenerated = 0;

      for (let i = 0; i < 7; i++) {
        const avgDailyUsage = totalElectricityUsage / 7;
        const variation = (Math.random() * 0.1 - 0.05) * avgDailyUsage;
        const dailyValue = avgDailyUsage + variation;
        weekData.push(dailyValue);
        totalGenerated += dailyValue;

        // Create a label for each day
        const date = new Date();
        date.setDate(today.getDate() - i - week * 7);
        labels.push(date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }));
      }

      // Adjust to match total electricity usage
      const adjustmentFactor = totalElectricityUsage / totalGenerated;
      weeklyData.push(weekData.map((usage) => usage * adjustmentFactor));
      weeklyLabels.push(labels.reverse());
    }

    return { weeklyData: weeklyData.reverse(), weeklyLabels: weeklyLabels.reverse() };
  };

  const { weeklyData, weeklyLabels } = generateWeeklyData();

  // Flatten weekly data and labels into one array for filtering
  const allLabels = weeklyLabels.flat();
  const allData = weeklyData.flat();

  // Filter data based on selected date range for the popup
  const filterDataByDateRange = () => {
    if (!selectedDateRange || selectedDateRange.length !== 2) return { labels: allLabels, data: allData };

    const [startDate, endDate] = selectedDateRange;
    const filteredLabels = [];
    const filteredData = [];

    for (let i = 0; i < allLabels.length; i++) {
      const labelDate = new Date();
      labelDate.setDate(labelDate.getDate() - (allLabels.length - 1 - i));
      if (labelDate >= startDate && labelDate <= endDate) {
        filteredLabels.push(allLabels[i]);
        filteredData.push(allData[i]);
      }
    }

    return { labels: filteredLabels, data: filteredData };
  };

  const popupFilteredData = filterDataByDateRange();

  const mainElectricityUsageData = {
    labels: weeklyLabels[0], // Current week's labels
    datasets: [
      {
        label: "Electricity Usage (kWh)",
        data: weeklyData[0].map((usage) => usage.toFixed(2)), // Current week's data
        backgroundColor: "#4daef4",
        borderColor: "#4daef4",
        borderWidth: 1,
      },
    ],
  };

  const popupElectricityUsageData = {
    labels: popupFilteredData.labels,
    datasets: [
      {
        label: "Electricity Usage (kWh)",
        data: popupFilteredData.data.map((usage) => usage.toFixed(2)),
        backgroundColor: "#4daef4",
        borderColor: "#4daef4",
        borderWidth: 1,
      },
    ],
  };

  // Generate Water Consumption Data for Top 3 Buildings
  const generateWaterUsage = () => {
    const usageData = buildings.map((building) => ({
      building,
      usage: Math.random() * 1500, // Random water usage between 0 and 1500 liters
    }));

    // Sort the buildings by highest water usage
    usageData.sort((a, b) => b.usage - a.usage);

    // Take top 3 buildings with the highest water usage
    setWaterUsageData(usageData.slice(0, 3));
  };

  useEffect(() => {
    generateWaterUsage();
  }, []); // Generate water usage when the component mounts (representing today's data)

  const waterConsumptionData = {
    labels: ["Used Water", "Remaining Capacity"],
    datasets: [
      {
        label: "Water Consumption",
        data: [65, 35],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  // Carbon Footprint for the overall campus (aggregated data)
  const carbonFootprintData = {
    labels: [""], // Label for the overall campus
    datasets: [
      {
        label: "CO2 Emissions (kg)",
        data: [buildings.reduce((sum) => sum + Math.random() * 500, 0)], // Sum of CO2 emissions across buildings
        backgroundColor: "#FF9800",
      },
      {
        label: "Food Waste (kg)",
        data: [buildings.reduce((sum) => sum + Math.random() * 200, 0)], // Sum of food waste across buildings
        backgroundColor: "#FF6384",
      },
      {
        label: "Recycled Waste (kg)",
        data: [buildings.reduce((sum) => sum + Math.random() * 300, 0)], // Sum of recycled waste across buildings
        backgroundColor: "#36A2EB",
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
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: "#121212",
                titleColor: "#ffffff",
                bodyColor: "#b0b0b0",
                callbacks: {
                  label: (tooltipItem) => `${tooltipItem.raw} kWh`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#eeeeee" } },
              y: {
                grid: { color: "rgba(180, 180, 180, 0.1)" },
                ticks: {
                  color: "#eeeeee",
                  callback: (value) => `${value} kWh`,
                },
              },
            },
          }}
        />
        <button className="calendar-button" onClick={() => setIsWeeklyPopupVisible(true)}>
          Weekly Usage
        </button>
        
      </div>

      <h3>Water Consumption</h3>
      <button className="overallcampus-button" onClick={() => setIsOverallPopupVisible(true)}>
          Overall Campus
        </button>
      <div className="water-consumption-speedometers">
        {waterUsageData.map((data, index) => (
          <div key={index} className="speedometer-container">
            <h4>{data.building}</h4>
            <GaugeChart
              id={`gauge-chart-${index}`}
              nrOfLevels={30}
              percent={data.usage / 1500} // Water usage percentage between 0 and 1500 liters
              arcWidth={0.3}
              textColor="#eeeeee"
              needleColor="#f42321"
              colors={['#3655f4', '#732cc5', '#e701bd']} // Red, Yellow, Green
            />
            <p>{data.usage.toFixed(2)} liters/day</p>
          </div>
        ))}
      </div>

      <h3>Carbon Footprint</h3>
      <div className="chart-container">
        <Bar
          data={carbonFootprintData}
          options={{
            responsive: true,
            indexAxis: "y", // Horizontal bar chart
            plugins: {
              tooltip: {
                callbacks: {
                  label: (tooltipItem) => {
                    const dataset = tooltipItem.dataset;
                    const total = dataset.data.reduce((sum, value) => sum + value, 0);
                    const percentage = ((dataset.data[tooltipItem.dataIndex] / total) * 100).toFixed(2);
                    return `${dataset.label}: ${dataset.data[tooltipItem.dataIndex]} kg (${percentage}%)`;
                  },
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#eeeeee" } },
              y: { ticks: { color: "#eeeeee" } },
            },
          }}
        />
      </div>

      {isWeeklyPopupVisible && (
        <div className="popup-overlay" onClick={() => setIsWeeklyPopupVisible(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsWeeklyPopupVisible(false)}>
              ✖
            </button>
            <h3>Electricity Usage for Selected Dates</h3>

            <div className="popup-content">
              <div className="chart-wrapper">
                <Bar
                  data={popupElectricityUsageData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: "#121212",
                        titleColor: "#ffffff",
                        bodyColor: "#b0b0b0",
                        callbacks: {
                          label: (tooltipItem) => `${tooltipItem.raw} kWh`,
                        },
                      },
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: "#eeeeee" } },
                      y: {
                        grid: { color: "rgba(180, 180, 180, 0.1)" },
                        ticks: {
                          color: "#eeeeee",
                          callback: (value) => `${value} kWh`,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="calendar-wrapper">
                <Calendar
                  selectRange
                  onChange={(range) => setSelectedDateRange(range)}
                  value={selectedDateRange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isOverallPopupVisible && (
        <div className="popup-overlay" onClick={() => setIsOverallPopupVisible(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsOverallPopupVisible(false)}>
              ✖
            </button>
            <h3>Water Usage: Overall Campus</h3>
            <div className="total-water-usage-container">
              <div className="total-water-usage">
                <h4>Total Water Usage (Daily):</h4>
                <p>
                  {
                    buildings.reduce((acc, building) => {
                      const buildingData = waterUsageData.find((data) => data.building === building);
                      const usage = buildingData ? buildingData.usage : Math.random() * 1500;
                      return acc + usage;
                    }, 0).toFixed(2)
                  } liters/day
                </p>
              </div>
              <div className="total-water-usage-month">
                <h4>Total Water Usage (Monthly):</h4>
                <p>
                  {
                    (buildings.reduce((acc, building) => {
                      const buildingData = waterUsageData.find((data) => data.building === building);
                      const usage = buildingData ? buildingData.usage : Math.random() * 1500;
                      return acc + usage;
                    }, 0) * 30).toFixed(2)
                  } liters/month
                </p>
              </div>
            </div>

            <div className="overall-campus-speedometers">
              {buildings.map((building, index) => {
                const buildingData = waterUsageData.find((data) => data.building === building);
                const usage = buildingData ? buildingData.usage : Math.random() * 1500;
                
                return (
                  <div key={index} className="overall-speedometer-container">
                    <h4>{building}</h4>
                    <GaugeChart
                      id={`overall-gauge-chart-${index}`}
                      nrOfLevels={30}
                      percent={usage / 1500}
                      arcWidth={0.3}
                      textColor="#2c2c2c"
                      needleColor="#f42321"
                      colors={["#3655f4", "#732cc5", "#e701bd"]}
                    />
                    <p>{usage.toFixed(2)} liters/day</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftDashboard;
