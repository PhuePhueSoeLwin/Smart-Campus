// src/App.js
import React from 'react';
import Map3D from './components/Map3D';  // Adjust the import path if needed

const App = () => {
  return (
    <div style={{ height: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Smart Campus 3D Map</h1>
      <Map3D />
    </div>
  );
};

export default App;
