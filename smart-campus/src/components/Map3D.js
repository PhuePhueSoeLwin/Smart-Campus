// components/Map3D.js
import React, { useState, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

/** Load the GLB and report the bounding box for E1+E2 (fallback: whole scene) */
function Model({ setOriginalColors, setBoundingBox }) {
  const { scene } = useGLTF('/assets/testing20.glb', true);
  const originalColors = useRef(new Map());

  // Base transforms — adjust as your model requires
  scene.scale.set(0.1, 0.1, 0.1);
  scene.rotation.y = Math.PI / 2;
  scene.position.set(0, -10, 0);

  // Capture original colors and tag names
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

    // Try to find E1 + E2 in the scene by name
    const e1 = scene.getObjectByName('E1');
    const e2 = scene.getObjectByName('E2');

    let targetBox = new THREE.Box3();
    let foundAny = false;

    if (e1) { targetBox.expandByObject(e1); foundAny = true; }
    if (e2) { targetBox.expandByObject(e2); foundAny = true; }

    // Fallback to entire scene if named nodes aren't found
    if (!foundAny) {
      targetBox = new THREE.Box3().setFromObject(scene);
    }

    setBoundingBox && setBoundingBox(targetBox);
  }, [scene, setOriginalColors, setBoundingBox]);

  return <primitive object={scene} />;
}

/**
 * Approach the camera toward a Box3 and stop NEAR it.
 * - azimuthDeg controls horizontal yaw (0/90/180/270). Using 0°.
 * - proximity (<1) makes it closer than a perfect fit. Smaller = closer.
 * - eyeAboveBaseFrac sets eye height above the box base as a fraction of box height.
 * - floorFrac ensures we don't go below the base.
 */
function approachCameraToBox({
  camera,
  box,
  aspect,
  azimuthDeg = 0,
  offset = 1.25,
  proximity = 0,      // closer view
  eyeAboveBaseFrac = 0.04,// ~4% of height above base -> low eye level
  floorFrac = 0.01,       // never go below base + 1% height
  animateMs = 1200,
  ensureForward = true,
}) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Distances needed to fit height and width
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const fitHeightDistance = (size.y / 2) / Math.tan(vFOV / 2);
  const fitWidthDistance = (size.x / 2) / Math.tan(Math.atan(Math.tan(vFOV / 2) * aspect));
  const fitDistance = offset * Math.max(fitHeightDistance, fitWidthDistance, size.z);

  // Go closer than a perfect fit
  const minDistance = Math.max(size.length() * 0.12, 3); // avoid entering geometry
  const targetDistance = Math.max(minDistance, fitDistance * proximity);

  // Direction from azimuth (yaw) only, locked to XZ plane
  // azimuthDeg: 0 => +Z, 90 => +X, 180 => -Z, 270 => -X
  const az = THREE.MathUtils.degToRad(azimuthDeg);
  const dir = new THREE.Vector3(Math.sin(az), 0, Math.cos(az)).normalize();

  // Low eye height: slightly above the base of E1+E2
  const baseY = box.min.y + size.y * floorFrac;
  const eyeY  = Math.max(baseY, box.min.y + size.y * eyeAboveBaseFrac);

  // Target position at requested yaw + low height
  const targetPos = new THREE.Vector3()
    .copy(center)
    .add(dir.clone().multiplyScalar(targetDistance));
  targetPos.y = eyeY;

  // If already too close, jump farther first so tween comes IN
  if (ensureForward) {
    const currentDist = camera.position.clone().sub(center).length();
    if (currentDist <= targetDistance) {
      const farPos = new THREE.Vector3()
        .copy(center)
        .add(dir.clone().multiplyScalar(targetDistance * 2.2));
      farPos.y = eyeY;
      camera.position.copy(farPos);
    }
  }

  // Frustum tuning
  camera.near = Math.max(0.05, targetDistance / 300);
  camera.far  = Math.max(camera.far, targetDistance * 200);
  camera.updateProjectionMatrix();

  // Animate and look at center of the buildings cluster
  gsap.to(camera.position, {
    duration: animateMs / 1000,
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    ease: 'power2.out',
    onUpdate: () => camera.lookAt(center),
    onComplete: () => camera.lookAt(center),
  });
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
  const { camera, gl, scene, size } = useThree();
  const [highlightedGroupState, setHighlightedGroupState] = useState(null);
  const [targetBox, setTargetBox] = useState(null);
  const didFitRef = useRef(false);
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

    const onMouseDown = (e) => { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; };
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
    const onMouseUp = () => { isDragging = false; };

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
    const handleKeyDown = (e) => { keys.current[e.code] = true; };
    const handleKeyUp = (e) => { keys.current[e.code] = false; };
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

  // Initial camera seed (anywhere reasonable; the approach will take over)
useEffect(() => {
  camera.position.set(90, 0, 90); // Set camera position
  camera.rotation.x =  0; // Set vertical angle to 45 degrees
  camera.fov = 75;
  camera.updateProjectionMatrix();
}, [camera]);

  // When the model reports the target box (E1+E2), go NEAR + yaw=0° + LOW height
  useEffect(() => {
    if (targetBox && !didFitRef.current) {
      const aspect = size.width / size.height;
      approachCameraToBox({
        camera,
        box: targetBox,
        aspect,
        azimuthDeg: -4.3,     // keep 0° horizontal
        offset: 1,
        proximity: 0.5,   // closer
        eyeAboveBaseFrac: 0.5, // low eye level (like your 2nd screenshot)
        floorFrac: -5,
        animateMs: 1500,
        ensureForward: true,
      });
      didFitRef.current = true;
    }
  }, [targetBox, camera, size]);

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
        if (child.name === 'ex_roof_1' || child.name === 'ex_roof_2') child.visible = false;
      }
      const hideBuildings = (buildings) => {
        buildings.forEach((name) => {
          const b = scene.getObjectByName(name);
          if (b) b.visible = false;
        });
      };
      if (parentGroup.userData.name === 'Library5') hideBuildings(['AV']);
      if (parentGroup.userData.name === 'Library4') hideBuildings(['AV', 'Library5']);
      if (parentGroup.userData.name === 'Library3') hideBuildings(['AV', 'Library5', 'Library4']);
      if (parentGroup.userData.name === 'Library2') hideBuildings(['AV', 'Library5', 'Library4', 'Library3']);
    });
  };

  // Picking
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
          while (parentGroup && !parentGroup.userData.name) parentGroup = parentGroup.parent;
          if (parentGroup) {
            setPopupData({ name: parentGroup.userData.name, x: event.clientX, y: event.clientY });
            handleBuildingSelection(clickedObject, parentGroup);
          }
        }
      }
    };
    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [camera, scene, gl, setPopupData]);

  // Restore colors/visibility after closing popup
  useEffect(() => {
    if (resetColors && highlightedGroupState) {
      highlightedGroupState.traverse((child) => {
        if (child.isMesh) {
          const originalColor = originalColors.get(child);
          if (originalColor) {
            gsap.to(child.material.color, {
              r: originalColor.r, g: originalColor.g, b: originalColor.b,
              duration: 0.5, ease: 'power2.out',
            });
          }
          if (child.name === 'ex_roof_1' || child.name === 'ex_roof_2') child.visible = true;
        }
      });
      const restore = (list) => list.forEach((n) => { const b = scene.getObjectByName(n); if (b) b.visible = true; });
      if (highlightedGroupState.userData.name === 'Library2') restore(['AV', 'Library5', 'Library4', 'Library3']);
      else if (highlightedGroupState.userData.name === 'Library3') restore(['AV', 'Library5', 'Library4']);
      else if (highlightedGroupState.userData.name === 'Library4') restore(['AV', 'Library5']);
      else if (highlightedGroupState.userData.name === 'Library5') restore(['AV']);
      setHighlightedGroupState(null);
      setResetColors(false);
    }
  }, [resetColors, highlightedGroupState, originalColors, setResetColors, scene]);

  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} />
      <directionalLight position={[-10, 20, -10]} intensity={1.5} />
      <hemisphereLight
        skyColor={new THREE.Color(0x87CEEB)}
        groundColor={new THREE.Color(0xffffff)}
        intensity={0.8}
      />
      <Model setOriginalColors={setOriginalColors} setBoundingBox={setTargetBox} />
    </>
  );
};

export default Map3D;


