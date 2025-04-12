import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

function Model({ setOriginalColors, setBoundingBox }) {
  const { scene } = useGLTF('/assets/testing20.glb', true);
  const originalColors = useRef(new Map());

  scene.scale.set(0.1, 0.1, 0.1);
  scene.rotation.y = Math.PI / 2;
  scene.position.set(0, -10, 0);

  scene.traverse((child) => {
    if (child.isMesh) {
      if (!originalColors.current.has(child)) {
        originalColors.current.set(child, child.material.color.clone());
      }
      child.material = child.material.clone();
      child.userData.name = child.name;
    }
  });

  useEffect(() => {
    setOriginalColors(originalColors.current);
    const box = new THREE.Box3().setFromObject(scene);
    setBoundingBox(box);
  }, [setOriginalColors, scene, setBoundingBox]);

  return <primitive object={scene} />;
}

const Map3D = ({ setPopupData, originalColors, resetColors, setResetColors, setOriginalColors }) => {
  const { camera, gl, scene } = useThree();
  const [highlightedGroupState, setHighlightedGroupState] = useState(null);
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});
  
  // Mouse drag for camera rotation
  useEffect(() => {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const movementX = e.clientX - previousMousePosition.x;
      const movementY = e.clientY - previousMousePosition.y;

      previousMousePosition = { x: e.clientX, y: e.clientY };

      const yaw = movementX * 0.002; // Horizontal sensitivity
      const pitch = movementY * 0.002; // Vertical sensitivity

      camera.rotation.order = 'YXZ'; // Ensures yaw (y) then pitch (x)

      camera.rotation.y -= yaw;
      camera.rotation.x -= pitch;

      // Clamp pitch between -90 and +90 degrees
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    gl.domElement.addEventListener('mousedown', onMouseDown);
    gl.domElement.addEventListener('mousemove', onMouseMove);
    gl.domElement.addEventListener('mouseup', onMouseUp);

    return () => {
      gl.domElement.removeEventListener('mousedown', onMouseDown);
      gl.domElement.removeEventListener('mousemove', onMouseMove);
      gl.domElement.removeEventListener('mouseup', onMouseUp);
    };
  }, [camera, gl]);

  // Movement logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update camera movement
useFrame((_, delta) => {
  direction.current.set(0, 0, 0);

  if (keys.current['KeyW']) direction.current.z -= 1;
  if (keys.current['KeyS']) direction.current.z += 1;
  if (keys.current['KeyA']) direction.current.x -= 1;
  if (keys.current['KeyD']) direction.current.x += 1;
  if (keys.current['Space']) direction.current.y += 1;
  if (keys.current['ShiftLeft']) direction.current.y -= 1;

  direction.current.normalize();

  const moveSpeed = 10; // Reduce movement speed (adjust this value to your preference)

  // Create a flat rotation (ignoring pitch)
  const yawOnly = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');

  // Only apply yaw (horizontal rotation) to horizontal movement
  const horizontalDir = new THREE.Vector3(direction.current.x, 0, direction.current.z).applyEuler(yawOnly);

  // Add vertical movement (space / shift)
  horizontalDir.y = direction.current.y;

  camera.position.addScaledVector(horizontalDir, moveSpeed * delta);
});


  useEffect(() => {
    camera.position.set(80, 20, 100);
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }, [camera]);

  const handleBuildingSelection = (clickedObject, parentGroup) => {
    setHighlightedGroupState(parentGroup);

    parentGroup.traverse((child) => {
      if (child.isMesh) {
        if (!originalColors.has(child)) {
          originalColors.set(child, child.material.color.clone());
        }

        gsap.to(child.material.color, {
          r: 0, g: 0.28, b: 0.67,
          duration: 0.5,
          ease: 'power2.out'
        });
      }

      if (parentGroup.userData.name === "Exabation Hall") {
        if (child.name === "ex_roof_1" || child.name === "ex_roof_2") {
          child.visible = false;
        }
      }

      const hideBuildings = (buildings) => {
        buildings.forEach((buildingName) => {
          const building = scene.getObjectByName(buildingName);
          if (building) building.visible = false;
        });
      };

      if (parentGroup.userData.name === "Library5") hideBuildings(["AV"]);
      if (parentGroup.userData.name === "Library4") hideBuildings(["AV", "Library5"]);
      if (parentGroup.userData.name === "Library3") hideBuildings(["AV", "Library5", "Library4"]);
      if (parentGroup.userData.name === "Library2") hideBuildings(["AV", "Library5", "Library4", "Library3"]);
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
            gsap.to(child.material.color, {
              r: originalColor.r,
              g: originalColor.g,
              b: originalColor.b,
              duration: 0.5,
              ease: 'power2.out'
            });
          }

          if (child.name === "ex_roof_1" || child.name === "ex_roof_2") {
            child.visible = true;
          }
        }
      });

      const restoreBuildings = (buildings) => {
        buildings.forEach((buildingName) => {
          const building = scene.getObjectByName(buildingName);
          if (building) building.visible = true;
        });
      };

      if (highlightedGroupState.userData.name === "Library2") restoreBuildings(["AV", "Library5", "Library4", "Library3"]);
      else if (highlightedGroupState.userData.name === "Library3") restoreBuildings(["AV", "Library5", "Library4"]);
      else if (highlightedGroupState.userData.name === "Library4") restoreBuildings(["AV", "Library5"]);
      else if (highlightedGroupState.userData.name === "Library5") restoreBuildings(["AV"]);

      setHighlightedGroupState(null);
      setResetColors(false);
    }
  }, [resetColors, highlightedGroupState, originalColors, setResetColors, scene]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />
      <hemisphereLight skyColor={new THREE.Color(0x87CEEB)} groundColor={new THREE.Color(0xFFFFFF)} intensity={0.5} />

      <Model setOriginalColors={setOriginalColors} setBoundingBox={() => {}} />
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
              color: '#FFF',
            }}
          >
            ❌
          </div>

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
              💧 <b>Water Usage:</b> 2345 L  
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;