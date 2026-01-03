import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { SoftShadows } from '@react-three/drei';
import { Court } from './Court';
import { Entities } from './Entities';
import { Effects } from './Effects';
import { physicsEngine } from '@/lib/physicsEngine';
import { useGameStore } from '@/store/useGameStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { COURT_WIDTH } from '@/lib/constants';
import * as THREE from 'three';
function PhysicsLoop() {
  const phase = useGameStore(s => s.phase);
  const isPaused = useGameStore(s => s.isPaused);
  const timeScale = useGameStore(s => s.timeScale);
  const role = useMultiplayerStore(s => s.role);
  useFrame((state, delta) => {
    if (phase === 'playing' && !isPaused) {
      // Apply time scaling for slow-motion effects
      const dt = Math.min(delta, 0.1) * timeScale;
      // Only run physics simulation if Single Player or Host
      // Client receives state updates via network
      if (role !== 'client') {
        physicsEngine.update(dt);
      }
    }
  });
  return null;
}
function CameraRig() {
    const { camera, size } = useThree();
    const role = useMultiplayerStore(s => s.role);
    // Host/Single: [0, 14, 10] (Looking at +Z)
    // Client: [0, 14, -10] (Looking at -Z, rotated 180)
    const defaultZ = role === 'client' ? -10 : 10;
    const basePos = useRef(new THREE.Vector3(0, 14, defaultZ));
    const shakeIntensity = useGameStore(s => s.shakeIntensity);
    const decayShake = useGameStore(s => s.decayShake);
    const isPaused = useGameStore(s => s.isPaused);
    // Update base position when role changes
    useEffect(() => {
        basePos.current.set(0, 14, role === 'client' ? -10 : 10);
    }, [role]);
    // Responsive Camera Logic
    useLayoutEffect(() => {
        const aspect = size.width / size.height;
        const targetWidth = COURT_WIDTH + 2; // 10 + 2 units margin
        // Vertical FOV is 45 degrees
        const vFovRad = (45 * Math.PI) / 180;
        // Calculate required distance to see targetWidth
        const requiredDist = targetWidth / (2 * Math.tan(vFovRad / 2) * aspect);
        // Default vector length ~17.2
        const defaultVector = new THREE.Vector3(0, 14, 10);
        const defaultDist = defaultVector.length();
        const finalDist = Math.max(defaultDist, requiredDist);
        // Direction depends on role
        const zDir = role === 'client' ? -1 : 1;
        const direction = new THREE.Vector3(0, 14, 10 * zDir).normalize();
        const newPos = direction.multiplyScalar(finalDist);
        basePos.current.copy(newPos);
        // Immediate update
        camera.position.copy(newPos);
        camera.lookAt(0, 0, 0);
    }, [size.width, size.height, camera, role]);
    useFrame(() => {
        if (isPaused) return;
        if (shakeIntensity > 0) {
            const rx = (Math.random() - 0.5) * shakeIntensity;
            const ry = (Math.random() - 0.5) * shakeIntensity;
            const rz = (Math.random() - 0.5) * shakeIntensity;
            camera.position.set(
                basePos.current.x + rx,
                basePos.current.y + ry,
                basePos.current.z + rz
            );
            decayShake();
        } else {
            // Smooth return to base
            camera.position.lerp(basePos.current, 0.1);
        }
        // Always look at center
        camera.lookAt(0, 0, 0);
    });
    return null;
}
export function Scene() {
  const phase = useGameStore(s => s.phase);
  const role = useMultiplayerStore(s => s.role);
  useEffect(() => {
    if (phase === 'playing' && role !== 'client') {
        physicsEngine.resetPositions();
    }
  }, [phase, role]);
  return (
    <Canvas
      shadows
      camera={{ position: [0, 14, 10], fov: 45 }}
      className="w-full h-full bg-slate-900"
    >
      <PhysicsLoop />
      <CameraRig />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      >
        <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12]} />
      </directionalLight>
      <group rotation={[0, 0, 0]}>
        <Court />
        <Entities />
        <Effects />
      </group>
      <SoftShadows size={15} samples={8} />
    </Canvas>
  );
}