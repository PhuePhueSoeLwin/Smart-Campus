import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

function Model({ setOriginalColors, setBoundingBox }) {
  const { scene } = useGLTF('/assets/testing11.glb', true);

  scene.scale.set(0.1, 0.1, 0.1);
  scene.rotation.y = Math.PI / 2;
  scene.position.set(0, -10, 0);

  const originalColors = useRef(new Map());

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

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(scene);
    setBoundingBox(box);
  }, [setOriginalColors, scene, setBoundingBox]);

  return <primitive object={scene} />;
}

const Map3D = ({ setPopupData, originalColors, resetColors, setResetColors, setOriginalColors }) => {
  const { camera, gl, scene } = useThree();
  const [highlightedGroupState, setHighlightedGroupState] = useState(null);

  // Control Functions for drone-like movement
  const moveForward = () => {
    gsap.to(camera.position, {
      z: camera.position.z - 1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const moveBackward = () => {
    gsap.to(camera.position, {
      z: camera.position.z + 1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const moveLeft = () => {
    gsap.to(camera.position, {
      x: camera.position.x - 1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const moveRight = () => {
    gsap.to(camera.position, {
      x: camera.position.x + 1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const flyUp = () => {
    gsap.to(camera.position, {
      y: camera.position.y + 1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const flyDown = () => {
    gsap.to(camera.position, {
      y: camera.position.y - 1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const rotateLeft = () => {
    gsap.to(camera.rotation, {
      y: camera.rotation.y + 0.1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const rotateRight = () => {
    gsap.to(camera.rotation, {
      y: camera.rotation.y - 0.1,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const zoomIn = () => {
    gsap.to(camera.position, {
      z: camera.position.z - 10,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const zoomOut = () => {
    gsap.to(camera.position, {
      z: camera.position.z + 10,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  useEffect(() => {
    camera.position.set(80, 50, 100);
    camera.rotation.set(-Math.PI / 2, 0, 0);
    camera.fov = 50;
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

      // Hide roofs if Exbation Hall is clicked
      if (parentGroup.userData.name === "Exbation Hall") {
        if (child.name === "ex_roof_1" || child.name === "ex_roof_2") {
          child.visible = false;
        }
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
            gsap.to(child.material.color, {
              r: originalColor.r,
              g: originalColor.g,
              b: originalColor.b,
              duration: 0.5,
              ease: 'power2.out'
            });
          }

          // Restore roofs when resetting
          if (child.name === "ex_roof_1" || child.name === "ex_roof_2") {
            child.visible = true;
          }
        }
      });

      setHighlightedGroupState(null);
      setResetColors(false);
    }
  }, [resetColors, highlightedGroupState, originalColors, setResetColors]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />
      <hemisphereLight skyColor={new THREE.Color(0x87CEEB)} groundColor={new THREE.Color(0xFFFFFF)} intensity={0.5} />

      <Model setOriginalColors={setOriginalColors} setBoundingBox={() => {}} />

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
              color: '#FFF',
            }}
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
              💧 <b>Water Usage:</b> 2345 L  
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;