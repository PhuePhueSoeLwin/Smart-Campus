import React, { useState } from 'react';
import './controller.css'; // Assuming you have a CSS file for styling

const Controller = () => {
  const [showBlackScreen, setShowBlackScreen] = useState(true); // Controller is visible by default

  // Handler for controller input
  const handleControllerInput = (direction) => {
    console.log(direction);
  };

  return (
    <div className={`black-screen ${showBlackScreen ? 'show' : 'hide'}`}>
      <div className="controller">
        <button className="arrow-button up" onClick={() => handleControllerInput({ moveForward: true })}>
          ▲
        </button>
        <div className="middle-row">
          <button className="arrow-button left" onClick={() => handleControllerInput({ moveLeft: true })}>
            ◀
          </button>
          <button className="arrow-button right" onClick={() => handleControllerInput({ moveRight: true })}>
            ▶
          </button>
        </div>
        <button className="arrow-button down" onClick={() => handleControllerInput({ moveBackward: true })}>
          ▼
        </button>
      </div>
    </div>
  );
};

export default Controller;
