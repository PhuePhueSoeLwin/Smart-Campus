// src/App.js
import React, { Suspense } from 'react';
import Map3D from './components/Map3D';  // Import Map3D component

const App = () => {
  return (
    <div style={{ height: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Smart Campus 3D Map</h1>

      {/* 3D Map Canvas */}
      <Suspense fallback={<div>Loading...</div>}>
        <Map3D />
      </Suspense>
    </div>
  );
};

export default App;
