import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

function Model({ setOriginalColors, setBoundingBox }) {
  const { scene } = useGLTF('/assets/testing8.glb', true); // Load GLB with Draco compression

  scene.scale.set(0.1, 0.1, 0.1); // Adjust scale
  scene.rotation.y = Math.PI / 2; // Rotate the scene 90 degrees horizontally
  
  // Move the object a little down on the Y-axis
  scene.position.set(0, -10, 0); // Adjust this value as needed

  const originalColors = useRef(new Map()); // Store original colors

  // Store original colors
  scene.traverse((child) => {
    if (child.isMesh) {
      if (!originalColors.current.has(child)) {
        originalColors.current.set(child, child.material.color.clone()); // Store original color
      }
      child.material = child.material.clone(); // Clone material to prevent overriding
      child.userData.name = child.name; // Store object name for clicks
    }
  });

  useEffect(() => {
    setOriginalColors(originalColors.current);

    // Calculate bounding box size
    const box = new THREE.Box3().setFromObject(scene);
    setBoundingBox(box);
  }, [setOriginalColors, scene, setBoundingBox]);

  return <primitive object={scene} />;
}

const Map3D = ({ setPopupData, originalColors, resetColors, setResetColors, setOriginalColors }) => {
  const { camera, gl, scene } = useThree();
  const [highlightedGroupState, setHighlightedGroupState] = useState(null);

  useEffect(() => {
    // Adjust camera position to move it further right
    camera.position.set(80, 50, 100); // Move the camera 40 units to the right on the x-axis
    camera.rotation.set(-Math.PI / 2, 0, 0); // Make the camera look straight down
    camera.fov = 50; // Adjust field of view for zoomed-out effect
    camera.updateProjectionMatrix();
  }, [camera]);

  const handleBuildingSelection = (clickedObject, parentGroup) => {
    setHighlightedGroupState(parentGroup);

    parentGroup.traverse((child) => {
      if (child.isMesh) {
        if (!originalColors.has(child)) {
          originalColors.set(child, child.material.color.clone()); // Store original color
        }

        // Animate color change to Science Blue (#0047AB)
        gsap.to(child.material.color, {
          r: 0, g: 0.28, b: 0.67, // Science Blue (RGB: 0, 71, 171)
          duration: 0.5,
          ease: 'power2.out'
        });
      }
    });
  };

  useEffect(() => {
    const handleClick = (event) => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (clickedObject.userData.name) {
          let parentGroup = clickedObject.parent;
          while (parentGroup && !parentGroup.userData.name) {
            parentGroup = parentGroup.parent;
          }

          if (parentGroup) {
            setPopupData({
              name: parentGroup.userData.name,
              x: event.clientX,
              y: event.clientY,
            });

            handleBuildingSelection(clickedObject, parentGroup);
          }
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, scene, gl, setPopupData]);

  useEffect(() => {
    if (resetColors && highlightedGroupState) {
      highlightedGroupState.traverse((child) => {
        if (child.isMesh) {
          const originalColor = originalColors.get(child);
          if (originalColor) {
            // Animate back to original color
            gsap.to(child.material.color, {
              r: originalColor.r,
              g: originalColor.g,
              b: originalColor.b,
              duration: 0.5,
              ease: 'power2.out'
            });
          }
        }
      });

      setHighlightedGroupState(null);
      setResetColors(false);
    }
  }, [resetColors, highlightedGroupState, originalColors, setResetColors]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />  {/* Increased Ambient Light */}
      <directionalLight position={[10, 20, 10]} intensity={1.5} />  {/* Bright Directional Light (Sunlight) */}
      <hemisphereLight skyColor={new THREE.Color(0x87CEEB)} groundColor={new THREE.Color(0xFFFFFF)} intensity={0.5} />  {/* Bright Sky Light */}

      {/* 3D Model */}
      <Model setOriginalColors={setOriginalColors} setBoundingBox={() => {}} />

      {/* Orbit Controls */}
      <OrbitControls enableZoom zoomSpeed={0.5} maxPolarAngle={Math.PI / 3} minPolarAngle={Math.PI / 6} enablePan />
    </>
  );
};

const App = () => {
  const [popupData, setPopupData] = useState(null);
  const [resetColors, setResetColors] = useState(false);
  const [originalColors, setOriginalColors] = useState(new Map());

  useEffect(() => {
    console.log('Popup Data:', popupData);
  }, [popupData]);

  return (
    <>
      <Canvas style={{ width: '100vw', height: '100vh' }}>
        {/* Performance Monitor inside Canvas */}
        <PerformanceMonitor>
          <Map3D
            setPopupData={setPopupData}
            originalColors={originalColors}
            resetColors={resetColors}
            setResetColors={setResetColors}
            setOriginalColors={setOriginalColors}
          />
        </PerformanceMonitor>
      </Canvas>

      {/* Popup Box */}
      {popupData && (
        <div
          style={{
            position: 'absolute',
            top: popupData.y + 10,
            left: popupData.x + 10,
            background: 'rgba(44, 44, 44, 0.5)',
            padding: '15px',
            borderRadius: '10px',
            color: 'white',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            width: '220px',
            transition: 'opacity 0.3s ease-in-out',
            opacity: 1,
          }}
        >
          {/* Close (❌) Button */}
          <div
            onClick={() => {
              setPopupData(null);
              setResetColors(true);
            }}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#FFF', // White default
              transition: 'color 0.3s',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#FF3333')} // Red on hover
            onMouseLeave={(e) => (e.target.style.color = '#FFF')}
            onMouseDown={(e) => (e.target.style.color = '#CC0000')} // Darker red on click
          >
            ❌
          </div>

          {/* Building Information */}
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: '0', fontSize: '16px', color: '#1E90FF' }}>
              {popupData.name}
            </h3>
            <hr style={{ border: '0.5px solid rgba(255,255,255,0.3)' }} />
            <p style={{ fontSize: '12px', marginBottom: '5px' }}>
              📍 <b>Location:</b> {popupData.name}  
            </p>
            <p style={{ fontSize: '12px', marginBottom: '5px' }}>
              ⚡ <b>Electricity Usage:</b> 1234 kWh  
            </p>
            <p style={{ fontSize: '12px', marginBottom: '5px' }}>
              💧 <b>Water Consumption:</b> 4567 L  
            </p>
            <p style={{ fontSize: '12px' }}>
              🧑‍🎓 <b>Students Present:</b> 789  
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
