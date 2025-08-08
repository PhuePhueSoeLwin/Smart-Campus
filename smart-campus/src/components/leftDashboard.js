import React, { useState, useEffect } from "react";
import "./leftDashboard.css";
import { Bar } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import GaugeChart from "react-gauge-chart"; // Importing gauge chart
import { Line } from "react-chartjs-2";


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
  ArcElement
} from "chart.js";

<<<<<<< HEAD
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






=======
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
>>>>>>> c4fdc97ff0cea686f270164c25d8631149f03048

const LeftDashboard = () => {
  const [isWeeklyPopupVisible, setIsWeeklyPopupVisible] = useState(false);
  const [isOverallPopupVisible, setIsOverallPopupVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([new Date(), new Date()]);
  const [waterUsageData, setWaterUsageData] = useState([]);
  const totalElectricityUsage = 121008.75;
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Buildings and water usage data
  const buildings = [
    "Msquare", "E1", "E2", "E3", "E4", "C1", "C2", "C3", "C4", "C5", "D1", "AD1", "AD2",
    "F1", "F2", "F3", "F4", "F5", "F6", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "M3"
  ];


// Generate mock data for the last 7 days
const generateWeeklyData = (weeks = 1) => {
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

      // Create a label for each day, ensuring today is always the last day
      const date = new Date();
      date.setDate(today.getDate() - (6 - i)); // Start from 6 and go backward to 0
      labels.push(date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }));
    }
    // Adjust to match total electricity usage
    const adjustmentFactor = totalElectricityUsage / totalGenerated;
    weeklyData.push(weekData.map((usage) => usage * adjustmentFactor));
    weeklyLabels.push(labels.reverse());
  }

  return { weeklyData: weeklyData.reverse(), weeklyLabels: weeklyLabels.reverse() };
};

// Ensure the weeklyData and weeklyLabels are generated correctly
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
  const reversedLabels = weeklyLabels[0].reverse();
  const reversedData = weeklyData[0].reverse();
  const mainElectricityUsageData = {
    labels: reversedLabels, // Reverse labels to show today as the rightmost
    datasets: [
      {
        label: "Electricity Usage (kWh)",
        data: reversedData.map((usage) => usage.toFixed(2)), // Reverse data accordingly
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
  // Generate Water Consumption Data for All Buildings
  const generateWaterUsage = () => {
    // Check if we already have water usage data
    if (waterUsageData.length > 0) {
      // If we have existing data, just update the pointer positions
      // by keeping the same buildings but recalculating their usage within the same ranges
      const updatedData = waterUsageData.map(data => {
        // Determine which range this building was in
        let range;
        if (data.usage <= 300) range = { min: 50, max: 300 };
        else if (data.usage <= 600) range = { min: 350, max: 600 };
        else if (data.usage <= 900) range = { min: 650, max: 900 };
        else if (data.usage <= 1200) range = { min: 950, max: 1200 };
        else range = { min: 1250, max: 1450 };
        
        // Generate a new usage value within the same range
        const newUsage = range.min + Math.random() * (range.max - range.min);
        
        return {
          building: data.building,
          usage: newUsage
        };
      });
      
      // Sort the buildings by highest water usage
      updatedData.sort((a, b) => b.usage - a.usage);
      
      // Update state with the new data
      setWaterUsageData(updatedData);
      return;
    }
    
    // If no existing data (first load), create initial data
    const ranges = [
      { min: 50, max: 300 },    // Very low
      { min: 350, max: 600 },   // Low
      { min: 650, max: 900 },   // Medium
      { min: 950, max: 1200 },  // High
      { min: 1250, max: 1450 }  // Very high
    ];
   
<<<<<<< HEAD
    // Assign ranges to buildings in a deterministic way (no random shuffling)
    // This ensures buildings always get the same range category
    const usageData = buildings.map((building, index) => {
      // Use modulo to cycle through the ranges if there are more buildings than ranges
      const rangeIndex = index % ranges.length;
      const range = ranges[rangeIndex];
     
=======
    // Shuffle the ranges to randomize which buildings get which ranges
    const shuffledRanges = [...ranges].sort(() => Math.random() - 0.5);
    const usageData = buildings.map((building, index) => {
      // Use modulo to cycle through the ranges if there are more buildings than ranges
      const rangeIndex = index % shuffledRanges.length;
      const range = shuffledRanges[rangeIndex];
>>>>>>> c4fdc97ff0cea686f270164c25d8631149f03048
      // Generate a random value within the selected range
      const usage = range.min + Math.random() * (range.max - range.min);
     
      return {
        building,
        usage
      };
    });
<<<<<<< HEAD

    // Sort the buildings by highest water usage
    usageData.sort((a, b) => b.usage - a.usage);

    // Set water usage data (top 3 will be shown initially)
    setWaterUsageData(usageData);
  };


  // Function to update just the pointer positions without shuffling buildings
  const updateWaterUsagePointers = () => {
    if (waterUsageData.length > 0) {
      generateWaterUsage(); // This will now update pointers without shuffling buildings
    }
  };

=======
    // Sort the buildings by highest water usage
    usageData.sort((a, b) => b.usage - a.usage);
    // Set water usage data (top 3 will be shown initially)
    setWaterUsageData(usageData);
  };
>>>>>>> c4fdc97ff0cea686f270164c25d8631149f03048
  useEffect(() => {
    // Generate initial water usage data when component mounts
    generateWaterUsage();
    
    // Set up an interval to update pointer positions every 5 seconds
    // This simulates real-time data changes without shuffling buildings
    const intervalId = setInterval(() => {
      updateWaterUsagePointers();
    }, 5000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []); // Ensures it runs once per page load/refresh
<<<<<<< HEAD








=======
useEffect(() => {
  // Always generate new water usage data when component mounts
  generateWaterUsage();
}, []); // Ensures it runs once per page load/refresh
>>>>>>> c4fdc97ff0cea686f270164c25d8631149f03048
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
<div className="water-consumption-speedometers">
  <button className="overallcampus-button" onClick={() => setIsOverallPopupVisible(true)}>
    Overall Campus
  </button>
  {waterUsageData
  .slice(0, 3) // Take only the top 3 buildings
  .map((data, index) => (
    <div key={index} className="speedometer-container">
      <h4>{data.building}</h4>
      <GaugeChart
        id={`gauge-chart-${index}`}
        nrOfLevels={5}
        percent={data.usage / 1500} // Use the random usage data to position the needle
        arcWidth={0.3}
        textColor="#eeeeee"
        needleColor="#ff9800"
        needleBaseColor="#e01e5a"
        colors={['#5BE12C', '#F5CD19', '#EA4228']}
        cornerRadius={0}
        animate={false} // Ensure animation is disabled to prevent winking
        animDelay={0}
        animateDuration={0}
        hideText={true}
        formatTextValue={() => ''}
      />
      <p>{data.usage.toFixed(2)} liters/day</p>
    </div>
  ))}
</div>
<<<<<<< HEAD




<h3>Carbon Footprint</h3>
<div className="chart-container" style={{ backgroundColor: "transparent", padding: "10px" }}>
  <Line
    data={{
      labels: ["524", "1047", "1570", "2093", "2616", "3139", "3662", "4185", "4708", "5231"],
      datasets: [
        {
          
          data: [90, 95, 100, 110, 160, 140, 120, 130, 110, 105],
          borderColor: "rgba(255, 0, 0, 0.9)",
          backgroundColor: "rgba(255, 0, 0, 0.3)",
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          
          data: [50, 55, 60, 65, 80, 70, 68, 72, 60, 58],
          borderColor: "rgba(0, 123, 255, 0.9)",
          backgroundColor: "rgba(0, 123, 255, 0.3)",
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          
          data: [30, 35, 40, 42, 50, 48, 45, 47, 44, 42],
          borderColor: "rgba(0, 200, 83, 0.9)",
          backgroundColor: "rgba(0, 200, 83, 0.3)",
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
        legend: {
          labels: {
            color: "#fff",
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#222",
          titleColor: "#fff",
          bodyColor: "#fff",
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(200,200,200,0.15)",
          },
          ticks: {
            color: "#fff",
            font: { size: 12 },
          },
        },
        y: {
          grid: {
            color: "rgba(200,200,200,0.15)",
          },
          ticks: {
            color: "#fff",
            font: { size: 12 },
          },
        },
      },
    }}
  />
</div>








=======
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
>>>>>>> c4fdc97ff0cea686f270164c25d8631149f03048
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
        <div className="water-popup-overlay" onClick={() => setIsOverallPopupVisible(false)}>
          <div className="water-popup-box" onClick={(e) => e.stopPropagation()}>
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
            {/* New container with speedometer and dropdown */}
            <div className="custom-container-wrapper">
  <div className="custom-container">
    <h4 style={{ color: "#ffffff", textAlign: "center", margin: "10px 0" }}>
      {selectedBuilding ? `${selectedBuilding}` : "Campus Water Usage"}
    </h4>
    <GaugeChart
      id="building-speedometer"
      nrOfLevels={5}
      percent={
        selectedBuilding
          ? waterUsageData.find((data) => data.building === selectedBuilding)?.usage / 1500
          : 0.5 // Default to middle position when no building is selected
      }
      arcWidth={0.3}
      textColor="#ffffff"
      needleColor="#ff9800"
      needleBaseColor="#e01e5a"
      colors={['#5BE12C', '#F5CD19', '#EA4228']}
      cornerRadius={0}
      animate={false} // Disable animation to prevent winking
      animDelay={0}
      animateDuration={0}
      hideText={true}
    />
    {selectedBuilding && (
      <p style={{ color: "#ffffff", textAlign: "center", marginTop: "10px" }}>
        {" "}
        {waterUsageData.find((data) => data.building === selectedBuilding)?.usage.toFixed(2)} liters/day
      </p>
    )}
  </div>
  <div className="water-dropdown-container">
    <select
      value={selectedBuilding || ""}
      onChange={(e) => setSelectedBuilding(e.target.value)}
      className="building-dropdown"
    >
      <option value="">Select Building</option>
      {buildings.map((building) => (
        <option key={building} value={building}>{building}</option>
      ))}
    </select>
  </div>
</div>
            </div>
          </div>
       
      )}
    </div>
  );
};
export default LeftDashboard;