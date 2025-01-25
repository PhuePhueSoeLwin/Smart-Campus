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
       <div className="vehicle-card car">
         <div className="vehicle-icon">🚗</div>
         <div className="vehicle-info">
           <p className="vehicle-type">Cars</p>
           <p className="vehicle-number">{vehicles.cars}</p>
         </div>
         <div className="vehicle-progress">
           <div
             className="progress-bar"
             style={{ width: `${Math.min((vehicles.cars / (vehicles.cars + vehicles.motorcycles)) * 100, 100)}%` }}
           ></div>
         </div>
       </div>


       <div className="vehicle-card motorcycle">
         <div className="vehicle-icon">🏍️</div>
         <div className="vehicle-info">
           <p className="vehicle-type">Motorcycles</p>
           <p className="vehicle-number">{vehicles.motorcycles}</p>
         </div>
         <div className="vehicle-progress">
           <div
             className="progress-bar"
             style={{ width: `${Math.min((vehicles.motorcycles / (vehicles.cars + vehicles.motorcycles)) * 100, 100)}%` }}
           ></div>
         </div>
       </div>
     </div>
   </div>
 );
};


export default RightDashboard;


