import React, { useState } from 'react';
import './controller.css';

const Controller = ({ setControllerCommand }) => {
  const [activeDirection, setActiveDirection] = useState(null);

  const handlePress = (direction) => {
    setActiveDirection(direction);
    setControllerCommand(direction);
  };

  const handleRelease = () => {
    setActiveDirection(null);
    setControllerCommand(null);
  };

  return (
    <div className="black-screen show">
      <div className="controller">
        <button
          className="arrow-button up"
          onMouseDown={() => handlePress({ moveForward: true })}
          onMouseUp={handleRelease}
          onTouchStart={() => handlePress({ moveForward: true })}
          onTouchEnd={handleRelease}
        >
          ▲
        </button>
        <div className="middle-row">
          <button
            className="arrow-button left"
            onMouseDown={() => handlePress({ moveLeft: true })}
            onMouseUp={handleRelease}
            onTouchStart={() => handlePress({ moveLeft: true })}
            onTouchEnd={handleRelease}
          >
            ◀
          </button>
          <button
            className="arrow-button right"
            onMouseDown={() => handlePress({ moveRight: true })}
            onMouseUp={handleRelease}
            onTouchStart={() => handlePress({ moveRight: true })}
            onTouchEnd={handleRelease}
          >
            ▶
          </button>
        </div>
        <button
          className="arrow-button down"
          onMouseDown={() => handlePress({ moveBackward: true })}
          onMouseUp={handleRelease}
          onTouchStart={() => handlePress({ moveBackward: true })}
          onTouchEnd={handleRelease}
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default Controller;
