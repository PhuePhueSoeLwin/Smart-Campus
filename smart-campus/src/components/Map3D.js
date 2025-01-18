// src/components/Map3D.js
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/assets/uni map.gltf');  // Path to the GLTF file in the public folder
  return <primitive object={scene} />;
}

const Map3D = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Model />
      <OrbitControls />
    </Canvas>
  );
};

export default Map3D;
