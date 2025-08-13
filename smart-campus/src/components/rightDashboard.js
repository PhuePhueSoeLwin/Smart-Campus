import React, { useEffect, useState } from 'react';
import './rightDashboard.css';

const RightDashboard = ({ onOpenVehiclePopup }) => {
  // IEQ
  const [ieqData, setIeQData] = useState({
    co2: 400, pollutants: 15, temperature: 22, humidity: 45, windSpeed: 10, comfort: ' Good',
  });

  // Students
  const [studentCounts, setStudentCounts] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState('');

  // Vehicles (counts only here)
  const [vehicles, setVehicles] = useState({ cars: 1000, motorcycles: 6000 });

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
    const t = setInterval(() => {
      setVehicles(v => ({
        cars: Math.max(0, v.cars + Math.floor(Math.random()*5) - 2),
        motorcycles: Math.max(0, v.motorcycles + Math.floor(Math.random()*10) - 5),
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Capacity
  const capacity = 15979;

  const selectedBuildingStudentCount = selectedBuilding ? (studentCounts[selectedBuilding] || 0) : 0;
  const currentCount = selectedBuilding ? selectedBuildingStudentCount : totalStudents;
  const percent = Math.max(0, Math.min(100, (currentCount / capacity) * 100));

  const countsArr = Object.values(studentCounts);
  const campusMin = countsArr.length ? Math.min(...countsArr) : 0;
  const campusMax = countsArr.length ? Math.max(...countsArr) : 0;

  // Gauge level
  const level = percent < 60 ? 'ok' : percent < 85 ? 'warn' : 'crit';

  return (
    <div className="right-dashboard">
      <h3>Campus Environmental Quality</h3>
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
          <a
            href="https://service-library.mfu.ac.th/pm/"
            target="_blank"
            rel="noopener noreferrer"
            className="primary-action-button"
          >
            Check More
          </a>
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

        {/* Your original scientific ring */}
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

            <circle className="gauge-track" cx="60" cy="60" r="52" />
            <circle className="gauge-ticks-minor" cx="60" cy="60" r="52" pathLength="100" />
            <circle className="gauge-ticks-major" cx="60" cy="60" r="52" pathLength="100" />
            <circle
              className="gauge-progress"
              cx="60" cy="60" r="52"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.max(0, 100 - percent)}
              aria-hidden="true"
              filter="url(#softGlow)"
            />
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
        <div className="vehicle-card car" onClick={() => onOpenVehiclePopup && onOpenVehiclePopup('Cars')}>
          <div className="vehicle-icon">🚗</div>
          <div className="vehicle-info"><p className="vehicle-type">Cars</p><p className="vehicle-number">{vehicles.cars.toLocaleString()}</p></div>
        </div>
        <div className="vehicle-card motorcycle" onClick={() => onOpenVehiclePopup && onOpenVehiclePopup('Motorcycles')}>
          <div className="vehicle-icon">🏍️</div>
          <div className="vehicle-info"><p className="vehicle-type">Motorcycles</p><p className="vehicle-number">{vehicles.motorcycles.toLocaleString()}</p></div>
        </div>
      </div>
    </div>
  );
};

export default RightDashboard;
