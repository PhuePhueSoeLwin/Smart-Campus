// src/components/Map3D.js
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';  // Import useGLTF from @react-three/drei

function Model() {
  const { scene } = useGLTF('/assets/uni map.gltf');  // Use useGLTF to load the GLTF file
  console.log(scene); // Check if the model is being loaded
  scene.scale.set(0.1, 0.1, 0.1);
  return <primitive object={scene} />;
}

const Map3D = () => {
  return (
    <Canvas style={{ width: '100%', height: '100%' }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* 3D Model */}
      <Model />


      <OrbitControls />
    </Canvas>
  );
};

export default Map3D;
