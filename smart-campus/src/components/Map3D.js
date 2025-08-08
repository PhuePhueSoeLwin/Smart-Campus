import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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

const Map3D = ({
  setPopupData,
  originalColors,
  resetColors,
  setResetColors,
  setOriginalColors,
  controllerCommand,
  setControllerCommand
}) => {
  const { camera, gl, scene } = useThree();
  const [highlightedGroupState, setHighlightedGroupState] = useState(null);
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});

  // Slightly increase scene exposure for brightness
  useEffect(() => {
    gl.toneMappingExposure = 1.25; // default is 1
  }, [gl]);

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

      const yaw = movementX * 0.002;
      const pitch = movementY * 0.002;

      camera.rotation.order = 'YXZ';
      camera.rotation.y -= yaw;
      camera.rotation.x -= pitch;
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

  // Keyboard controls
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

  // Movement
  useFrame((_, delta) => {
    direction.current.set(0, 0, 0);

    if (keys.current['KeyW']) direction.current.z -= 1;
    if (keys.current['KeyS']) direction.current.z += 1;
    if (keys.current['KeyA']) direction.current.x -= 1;
    if (keys.current['KeyD']) direction.current.x += 1;
    if (keys.current['Space']) direction.current.y += 1;
    if (keys.current['ShiftLeft']) direction.current.y -= 1;

    if (controllerCommand) {
      if (controllerCommand.moveForward) direction.current.z -= 1;
      if (controllerCommand.moveBackward) direction.current.z += 1;
      if (controllerCommand.moveLeft) direction.current.x -= 1;
      if (controllerCommand.moveRight) direction.current.x += 1;
    }

    direction.current.normalize();

    const normalSpeed = 10;
    const fastSpeed = 30;
    const moveSpeed = controllerCommand ? fastSpeed : normalSpeed;

    const yawOnly = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    const horizontalDir = new THREE.Vector3(direction.current.x, 0, direction.current.z).applyEuler(yawOnly);
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
          r: 0,
          g: 0.28,
          b: 0.67,
          duration: 0.5,
          ease: 'power2.out',
        });
      }

      if (parentGroup.userData.name === 'Exabation Hall') {
        if (child.name === 'ex_roof_1' || child.name === 'ex_roof_2') {
          child.visible = false;
        }
      }

      const hideBuildings = (buildings) => {
        buildings.forEach((buildingName) => {
          const building = scene.getObjectByName(buildingName);
          if (building) building.visible = false;
        });
      };

      if (parentGroup.userData.name === 'Library5') hideBuildings(['AV']);
      if (parentGroup.userData.name === 'Library4') hideBuildings(['AV', 'Library5']);
      if (parentGroup.userData.name === 'Library3') hideBuildings(['AV', 'Library5', 'Library4']);
      if (parentGroup.userData.name === 'Library2') hideBuildings(['AV', 'Library5', 'Library4', 'Library3']);
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
              ease: 'power2.out',
            });
          }
          if (child.name === 'ex_roof_1' || child.name === 'ex_roof_2') {
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

      if (highlightedGroupState.userData.name === 'Library2') restoreBuildings(['AV', 'Library5', 'Library4', 'Library3']);
      else if (highlightedGroupState.userData.name === 'Library3') restoreBuildings(['AV', 'Library5', 'Library4']);
      else if (highlightedGroupState.userData.name === 'Library4') restoreBuildings(['AV', 'Library5']);
      else if (highlightedGroupState.userData.name === 'Library5') restoreBuildings(['AV']);

      setHighlightedGroupState(null);
      setResetColors(false);
    }
  }, [resetColors, highlightedGroupState, originalColors, setResetColors, scene]);

  return (
    <>
      {/* Brighter lighting setup */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} />
      <directionalLight position={[-10, 20, -10]} intensity={1.5} />
      <hemisphereLight
        skyColor={new THREE.Color(0x87CEEB)}
        groundColor={new THREE.Color(0xffffff)}
        intensity={0.8}
      />
      <Model setOriginalColors={setOriginalColors} setBoundingBox={() => {}} />
    </>
  );
};

export default Map3D;
