import React, { useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { SoftShadows } from '@react-three/drei';
import { Court } from './Court';
import { Entities } from './Entities';
import { physicsEngine } from '@/lib/physicsEngine';
import { useGameStore } from '@/store/useGameStore';
function PhysicsLoop() {
  const phase = useGameStore(s => s.phase);
  useFrame((state, delta) => {
    if (phase === 'playing') {
      // Cap delta to prevent huge jumps if tab is inactive
      const dt = Math.min(delta, 0.1);
      physicsEngine.update(dt);
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
      camera={{ position: [0, 12, 10], fov: 50 }}
      className="w-full h-full bg-slate-900"
    >
      <PhysicsLoop />
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
      </directionalLight>
      {/* World */}
      <group rotation={[0, 0, 0]}>
        <Court />
        <Entities />
      </group>
      <SoftShadows size={10} samples={8} />
    </Canvas>
  );
}