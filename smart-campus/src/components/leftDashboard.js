import React, { useState } from "react";
import "./leftDashboard.css";
import { Pie, Bar } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([new Date(), new Date()]);

  const totalElectricityUsage = 121008.75;

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

  const carbonFootprintData = {
    labels: ["Emissions (kg)", "Offset (kg)"],
    datasets: [
      {
        label: "Carbon Footprint",
        data: [100, 20],
        backgroundColor: ["#FF9800", "#4CAF50"],
        hoverBackgroundColor: ["#FF9800", "#4CAF50"],
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
        <button className="calendar-button" onClick={() => setIsPopupVisible(true)}>
          Weekly Usage
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
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsPopupVisible(false)}>
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
    </div>
  );
};

export default LeftDashboard;
