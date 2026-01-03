import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { SoftShadows } from '@react-three/drei';
import { Court } from './Court';
import { Entities } from './Entities';
import { Effects } from './Effects';
import { physicsEngine } from '@/lib/physicsEngine';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';
function PhysicsLoop() {
  const phase = useGameStore(s => s.phase);
  const timeScale = useGameStore(s => s.timeScale);
  useFrame((state, delta) => {
    if (phase === 'playing') {
      // Apply time scaling for slow-motion effects
      const dt = Math.min(delta, 0.1) * timeScale;
      physicsEngine.update(dt);
    }
  });
  return null;
}
function CameraRig() {
    const { camera } = useThree();
    const basePos = useRef(new THREE.Vector3(0, 14, 10)); // Higher angle
    const shakeIntensity = useGameStore(s => s.shakeIntensity);
    const decayShake = useGameStore(s => s.decayShake);
    useEffect(() => {
        camera.position.copy(basePos.current);
        camera.lookAt(0, 0, 0);
    }, [camera]);
    useFrame(() => {
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
            // Return to base smoothly
            camera.position.lerp(basePos.current, 0.1);
        }
    });
    return null;
}
export function Scene() {
  const phase = useGameStore(s => s.phase);
  useEffect(() => {
    if (phase === 'playing') {
        physicsEngine.resetPositions();
    }
  }, [phase]);
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