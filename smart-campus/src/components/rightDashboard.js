import React, { useEffect, useState } from 'react';
import './rightDashboard.css'; // Custom CSS for styling
import { FaCaretDown } from 'react-icons/fa'; // Import down arrow icon


const RightDashboard = () => {
 // State for real-time IEQ data
 const [ieqData, setIeQData] = useState({
   co2: 400,
   pollutants: 15,
   temperature: 22,
   humidity: 45,
   windSpeed: 10,
   comfort: ' Good',
 });


 // State for student data
 const [studentCounts, setStudentCounts] = useState({});
 const [totalStudents, setTotalStudents] = useState(0);
 const [selectedBuilding, setSelectedBuilding] = useState('');
 const [dropdownVisible, setDropdownVisible] = useState(false); // State for controlling dropdown visibility


 // State for vehicle data
 const [vehicles, setVehicles] = useState({
   cars: 1000,
   motorcycles: 6000,
 });
// State for popup box
const [popupVisible, setPopupVisible] = useState(false);
const [vehicleType, setVehicleType] = useState('Cars'); // Default is Cars
const [schedule, setSchedule] = useState([]);
 // List of campus buildings
 const buildings = [
   'Msquare', 'E1', 'E2', 'E3', 'E4', 'C1', 'C2', 'C3', 'C4', 'C5',
   'D1', 'AD1', 'AD2', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'L1', 'L2',
   'L3', 'L4', 'L5', 'L6', 'L7', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'M3',
 ];


 // Simulate real-time IEQ updates
 useEffect(() => {
   const ieqInterval = setInterval(() => {
     setIeQData((prevData) => ({
       ...prevData,
       co2: Math.floor(Math.random() * (600 - 300 + 1)) + 300,
       pollutants: Math.floor(Math.random() * (30 - 5 + 1)) + 5,
       temperature: Math.floor(Math.random() * (25 - 18 + 1)) + 18,
       humidity: Math.floor(Math.random() * (60 - 30 + 1)) + 30,
       windSpeed: Math.floor(Math.random() * (20 - 5 + 1)) + 5,
       comfort: Math.random() > 0.7 ? ' Poor' : ' Good',
     }));
   }, 1000);


   return () => clearInterval(ieqInterval);
 }, []);


 // Simulate real-time student data updates
 useEffect(() => {
   const interval = setInterval(() => {
     const newStudentCounts = {};
     buildings.forEach((building) => {
       newStudentCounts[building] = Math.floor(Math.random() * (300 - 100 + 1)) + 100;
     });
     setStudentCounts(newStudentCounts);
     const total = Object.values(newStudentCounts).reduce((acc, count) => acc + count, 0);
     setTotalStudents(total);
   }, 1000);


   return () => clearInterval(interval);
 }, []);
 useEffect(() => {
  const generateSchedule = () => {
    const times = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
      '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
    ];
    return times.map((time) => ({
      time,
      cars: Math.floor(Math.random() * 500),
      motorcycles: Math.floor(Math.random() * 1000),
    }));
  };

  setSchedule(generateSchedule());
}, []);

 // Simulate real-time vehicle data updates
 useEffect(() => {
  const vehicleInterval = setInterval(() => {
    setVehicles((prevVehicles) => ({
      cars: prevVehicles.cars + Math.floor(Math.random() * 5) - 2,
      motorcycles: prevVehicles.motorcycles + Math.floor(Math.random() * 10) - 5,
    }));
  }, 1000);

  return () => clearInterval(vehicleInterval);
}, []);

const openPopup = (type) => {
  setVehicleType(type);
  setPopupVisible(true);
};

const closePopup = () => {
  setPopupVisible(false);
};

const getPeakTime = (type) => {
  if (!schedule.length) return null;
  return schedule.reduce((peak, entry) => {
    return entry[type.toLowerCase()] > peak[type.toLowerCase()]
      ? entry
      : peak;
  });
};

const peakTime = getPeakTime(vehicleType);

 const handleBuildingChange = (event) => {
  const building = event.target.value;
  setSelectedBuilding(building);
};

 const selectedBuildingStudentCount = selectedBuilding ? studentCounts[selectedBuilding] : 0;
 return (
   <div className="right-dashboard">
     <h3>Campus Environmental Quality (IEQ)</h3>
     <div className="ieq-monitoring">
       <div className="data">
         <div className="metric">
           <div className="indicator-container">
             <div className={`indicator ${ieqData.co2 > 500 ? 'high' : 'normal'}`}></div>
           </div>
           <p><strong>CO2 Levels:</strong> {ieqData.co2} ppm</p>
         </div>
         <div className="metric">
           <div className="indicator-container">
             <div className={`indicator ${ieqData.pollutants > 25 ? 'high' : 'normal'}`}></div>
           </div>
           <p><strong>Pollutants:</strong> {ieqData.pollutants} μg/m³</p>
         </div>
         <div className="metric">
           <div className="indicator-container">
             <div className={`indicator ${ieqData.temperature > 24 ? 'high' : 'normal'}`}></div>
           </div>
           <p><strong>Temperature:</strong> {ieqData.temperature} °C</p>
         </div>
         <div className="metric">
           <div className="indicator-container">
             <div className={`indicator ${ieqData.humidity < 30 ? 'low' : 'normal'}`}></div>
           </div>
           <p><strong>Humidity:</strong> {ieqData.humidity} %</p>
         </div>
         <div className="metric">
           <div className="indicator-container">
             <div className={`indicator ${ieqData.windSpeed > 15 ? 'high' : 'normal'}`}></div>
           </div>
           <p><strong>Wind Speed:</strong> {ieqData.windSpeed} km/h</p>
         </div>
       </div>
       <div className="comfort">
         <p>
           <strong>Comfort Level:</strong>
           <span className={ieqData.comfort === ' Good' ? 'comfort-good' : 'comfort-poor'}>
             {ieqData.comfort}
           </span>
         </p>
       </div>
     </div>


     <h3>Students On Campus</h3>
      

      <div className="student-count">
      <div className="dropdown-container">
        <select
          value={selectedBuilding}
          onChange={handleBuildingChange}
          className="building-dropdown"
        >
          <option value="">Select a Building</option>
          {buildings.map((building) => (
            <option key={building} value={building}>
              {building}
            </option>
          ))}
        </select>
      </div>
        <div className="circle-progress-container">
          <svg className="circular-chart" viewBox="0 0 36 36">
            {/* Background Circle */}
            <circle className="circle-bg" cx="18" cy="18" r="16"></circle>

            {/* Progress Circle */}
            <circle
              className="circle-progress"
              cx="18"
              cy="18"
              r="16"
              strokeDasharray={`${(selectedBuilding ? selectedBuildingStudentCount : totalStudents) / 10000 * 100} ${100 - (selectedBuilding ? selectedBuildingStudentCount : totalStudents) / 10000 * 100}`}
            ></circle>
          </svg>
          <div className="circle-text">
            <p className="total-amount">{selectedBuilding ? selectedBuildingStudentCount : totalStudents}</p>
            <p className="building-label">{selectedBuilding || 'Overall Campus'}</p>
          </div>
        </div>
      </div>

      <h3>Vehicles On Campus</h3>
      <div className="vehicle-count-container">
        <div className="vehicle-card car" onClick={() => openPopup('Cars')}>
          <div className="vehicle-icon">🚗</div>
          <div className="vehicle-info">
            <p className="vehicle-type">Cars</p>
            <p className="vehicle-number">{vehicles.cars}</p>
          </div>
        </div>

        <div className="vehicle-card motorcycle" onClick={() => openPopup('Motorcycles')}>
          <div className="vehicle-icon">🏍️</div>
          <div className="vehicle-info">
            <p className="vehicle-type">Motorcycles</p>
            <p className="vehicle-number">{vehicles.motorcycles}</p>
          </div>
        </div>
      </div>

      {popupVisible && (
        <div className="right-popup-overlay" onClick={closePopup}>
          <div className="right-popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closePopup}>
              &times;
            </button>
            <h3>{vehicleType} Schedule</h3>
            <div className="button-group">
              <button
                className={`vehicle-button ${vehicleType === 'Cars' ? 'active' : ''}`}
                onClick={() => setVehicleType('Cars')}
              >
                🚗
              </button>
              <button
                className={`vehicle-button ${vehicleType === 'Motorcycles' ? 'active' : ''}`}
                onClick={() => setVehicleType('Motorcycles')}
              >
                🏍️
              </button>
            </div>
            <p>Here is the schedule for the whole day.</p>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>{vehicleType}</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((entry) => (
                  <tr key={entry.time}>
                    <td>{entry.time}</td>
                    <td>{entry[vehicleType.toLowerCase()]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {peakTime && (
              <div className="peak-time">
                <p>
                  <strong>Peak Time:</strong> {peakTime.time}
                </p>
                <p>
                  <strong>Vehicles:</strong> {peakTime[vehicleType.toLowerCase()]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RightDashboard;