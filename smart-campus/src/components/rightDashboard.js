import React, { useEffect, useState } from 'react';
import './rightDashboard.css';

const RightDashboard = () => {
  // IEQ
  const [ieqData, setIeQData] = useState({
    co2: 400, pollutants: 15, temperature: 22, humidity: 45, windSpeed: 10, comfort: ' Good',
  });

  // Students
  const [studentCounts, setStudentCounts] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState('');

  // Vehicles
  const [vehicles, setVehicles] = useState({ cars: 1000, motorcycles: 6000 });
  const [popupVisible, setPopupVisible] = useState(false);
  const [vehicleType, setVehicleType] = useState('Cars');
  const [schedule, setSchedule] = useState([]);

  const buildings = [
    'Msquare','E1','E2','E3','E4','C1','C2','C3','C4','C5','D1','AD1','AD2','F1','F2','F3','F4','F5','F6',
    'L1','L2','L3','L4','L5','L6','L7','S1','S2','S3','S4','S5','S6','S7','M3',
  ];

  // Simulated updates
  useEffect(() => {
    const t = setInterval(() => {
      setIeQData(d => ({
        ...d,
        co2: Math.floor(Math.random()*301)+300,
        pollutants: Math.floor(Math.random()*26)+5,
        temperature: Math.floor(Math.random()*8)+18,
        humidity: Math.floor(Math.random()*31)+30,
        windSpeed: Math.floor(Math.random()*16)+5,
        comfort: Math.random() > 0.7 ? ' Poor' : ' Good',
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const next = {};
      buildings.forEach(b => { next[b] = Math.floor(Math.random()*201)+100; });
      setStudentCounts(next);
      setTotalStudents(Object.values(next).reduce((a,n)=>a+n,0));
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const times = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'];
    setSchedule(times.map(time=>({ time, cars: Math.floor(Math.random()*500), motorcycles: Math.floor(Math.random()*1000) })));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setVehicles(v => ({
        cars: v.cars + Math.floor(Math.random()*5) - 2,
        motorcycles: v.motorcycles + Math.floor(Math.random()*10) - 5,
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // === Capacity from latest stats
  const capacity = 15979;

  const selectedBuildingStudentCount = selectedBuilding ? (studentCounts[selectedBuilding] || 0) : 0;
  const currentCount = selectedBuilding ? selectedBuildingStudentCount : totalStudents;
  const percent = Math.max(0, Math.min(100, (currentCount / capacity) * 100));

  const countsArr = Object.values(studentCounts);
  const campusMin = countsArr.length ? Math.min(...countsArr) : 0;
  const campusMax = countsArr.length ? Math.max(...countsArr) : 0;

  const openPopup = (type) => { setVehicleType(type); setPopupVisible(true); };
  const closePopup = () => setPopupVisible(false);
  const peakTime = schedule.length
    ? schedule.reduce((p,e)=> (e[vehicleType.toLowerCase()] > p[vehicleType.toLowerCase()] ? e : p))
    : null;

  // Gauge color level for ring
  const level = percent < 60 ? 'ok' : percent < 85 ? 'warn' : 'crit';

  return (
    <div className="right-dashboard">
      <h3>Campus Environmental Quality (IEQ)</h3>
      <div className="ieq-monitoring">
        <div className="data">
          <div className="metric"><div className="indicator normal"></div><p><strong>CO2 Levels:</strong> {ieqData.co2} ppm</p></div>
          <div className="metric"><div className="indicator normal"></div><p><strong>Pollutants:</strong> {ieqData.pollutants} μg/m³</p></div>
          <div className="metric"><div className="indicator normal"></div><p><strong>Temperature:</strong> {ieqData.temperature} °C</p></div>
          <div className="metric"><div className="indicator normal"></div><p><strong>Humidity:</strong> {ieqData.humidity} %</p></div>
          <div className="metric"><div className="indicator normal"></div><p><strong>Wind Speed:</strong> {ieqData.windSpeed} km/h</p></div>
        </div>
        <div className="comfort">
          <p><strong>Comfort Level:</strong> <span className={ieqData.comfort === ' Good' ? 'comfort-good' : 'comfort-poor'}>{ieqData.comfort}</span></p>
          <a href="https://service-library.mfu.ac.th/pm/" target="_blank" rel="noopener noreferrer" className="check-more-button">Check More</a>
        </div>
      </div>

      <h3>Students On Campus</h3>
      <div className="student-count">
        <div className="student-header">
          <div className="kpi-chip">Capacity: {capacity.toLocaleString()}</div>
          <div className="dropdown-container">
            <select value={selectedBuilding} onChange={(e)=>setSelectedBuilding(e.target.value)} className="building-dropdown">
              <option value="">Overall Campus</option>
              {Object.keys(studentCounts).length
                ? Object.keys(studentCounts).map(b => <option key={b} value={b}>{b}</option>)
                : buildings.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Scientific gauge ring */}
        <div className="circle-progress-container">
          <svg
            className={`gauge gauge--${level}`}
            viewBox="0 0 120 120"
            role="img"
            aria-label={`Student load ${Math.round(percent)} percent of capacity`}
          >
            <defs>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* track */}
            <circle className="gauge-track" cx="60" cy="60" r="52" />

            {/* minor ticks (every 2%) */}
            <circle className="gauge-ticks-minor" cx="60" cy="60" r="52" pathLength="100" />

            {/* major ticks (every 10%) */}
            <circle className="gauge-ticks-major" cx="60" cy="60" r="52" pathLength="100" />

            {/* progress arc */}
            <circle
              className="gauge-progress"
              cx="60" cy="60" r="52"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.max(0, 100 - percent)}
              aria-hidden="true"
              filter="url(#softGlow)"
            />

            {/* moving head dot */}
            <g className="gauge-head" style={{ transform: `rotate(${(percent / 100) * 360}deg)` }} aria-hidden="true">
              <circle cx="60" cy="8" r="3" className="gauge-head-dot" />
            </g>
          </svg>

          <div className="circle-text">
            <p className="total-amount">{currentCount.toLocaleString()}</p>
            <p className="building-label">{selectedBuilding || 'Overall Campus'}</p>
            <p className="percent-label">{Math.round(percent)}% of capacity</p>
          </div>
        </div>

        <div className="scale-legend">
          <span className="legend-item"><i className="dot dot-green"></i>Low</span>
          <span className="legend-item"><i className="dot dot-yellow"></i>Medium</span>
          <span className="legend-item"><i className="dot dot-red"></i>High</span>
        </div>

        <div className="student-stats">
          <div className="stat"><span className="stat-label">Selected</span><span className="stat-value">{selectedBuilding ? selectedBuildingStudentCount.toLocaleString() : '—'}</span></div>
          <div className="stat"><span className="stat-label">Campus Total</span><span className="stat-value">{totalStudents.toLocaleString()}</span></div>
          <div className="stat"><span className="stat-label">Min / Max</span><span className="stat-value">{countsArr.length ? `${campusMin.toLocaleString()} / ${campusMax.toLocaleString()}` : '—'}</span></div>
        </div>
      </div>

      <h3>Vehicles On Campus</h3>
      <div className="vehicle-count-container">
        <div className="vehicle-card car" onClick={() => openPopup('Cars')}>
          <div className="vehicle-icon">🚗</div>
          <div className="vehicle-info"><p className="vehicle-type">Cars</p><p className="vehicle-number">{vehicles.cars.toLocaleString()}</p></div>
        </div>
        <div className="vehicle-card motorcycle" onClick={() => openPopup('Motorcycles')}>
          <div className="vehicle-icon">🏍️</div>
          <div className="vehicle-info"><p className="vehicle-type">Motorcycles</p><p className="vehicle-number">{vehicles.motorcycles.toLocaleString()}</p></div>
        </div>
      </div>

      {popupVisible && (
        <div className="right-popup-overlay" onClick={closePopup}>
          <div className="right-popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closePopup}>&times;</button>
            <h3>{vehicleType} Schedule</h3>
            <div className="button-group">
              <button className={`vehicle-button ${vehicleType === 'Cars' ? 'active' : ''}`} onClick={() => setVehicleType('Cars')}>🚗</button>
              <button className={`vehicle-button ${vehicleType === 'Motorcycles' ? 'active' : ''}`} onClick={() => setVehicleType('Motorcycles')}>🏍️</button>
            </div>
            <p>Here is the schedule for the whole day.</p>
            <table className="schedule-table">
              <thead><tr><th>Time</th><th>{vehicleType}</th></tr></thead>
              <tbody>
                {schedule.map((entry) => (
                  <tr key={entry.time}><td>{entry.time}</td><td>{entry[vehicleType.toLowerCase()].toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
            {peakTime && (
              <div className="peak-time">
                <p><strong>Peak Time:</strong> {peakTime.time}</p>
                <p><strong>Vehicles:</strong> {peakTime[vehicleType.toLowerCase()].toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RightDashboard;
