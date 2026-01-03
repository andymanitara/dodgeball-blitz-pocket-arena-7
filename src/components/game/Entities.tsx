import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Capsule, Box } from '@react-three/drei';
import { physicsState } from '@/store/useGameStore';
import * as THREE from 'three';
export function Entities() {
  const playerRef = useRef<THREE.Group>(null);
  const botRef = useRef<THREE.Group>(null);
  const playerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const botMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ballRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Sync Player
    if (playerRef.current) {
      playerRef.current.position.set(physicsState.player.x, 0, physicsState.player.z);
      // Stumble Animation (Rotate back if hit)
      // Player faces -Z (forward in game view). "Back" is +Z.
      // Rotation +X tilts top towards +Z.
      const targetRotX = physicsState.player.isHit ? Math.PI / 4 : 0;
      playerRef.current.rotation.x = THREE.MathUtils.lerp(playerRef.current.rotation.x, targetRotX, 0.1);
      // Hit Flash
      if (playerMatRef.current) {
        if (physicsState.player.isHit) {
            const flash = Math.sin(time * 20) > 0 ? 1 : 0;
            playerMatRef.current.emissive.setScalar(flash);
            playerMatRef.current.color.setHex(0xffffff);
        } else {
            playerMatRef.current.emissive.setScalar(0);
            playerMatRef.current.color.setHex(0x3b82f6); // Blue
        }
      }
    }
    // Sync Bot
    if (botRef.current) {
      botRef.current.position.set(physicsState.bot.x, 0, physicsState.bot.z);
      // Stumble Animation (Rotate back if hit)
      // Bot faces +Z. "Back" is -Z.
      // Rotation -X tilts top towards -Z.
      const targetRotX = physicsState.bot.isHit ? -Math.PI / 4 : 0;
      botRef.current.rotation.x = THREE.MathUtils.lerp(botRef.current.rotation.x, targetRotX, 0.1);
      // Hit Flash
      if (botMatRef.current) {
        if (physicsState.bot.isHit) {
            const flash = Math.sin(time * 20) > 0 ? 1 : 0;
            botMatRef.current.emissive.setScalar(flash);
            botMatRef.current.color.setHex(0xffffff);
        } else {
            botMatRef.current.emissive.setScalar(0);
            botMatRef.current.color.setHex(0xef4444); // Red
        }
      }
    }
    // Sync Balls
    physicsState.balls.forEach(ballData => {
      const mesh = ballRefs.current.get(ballData.id);
      if (mesh) {
        mesh.position.set(ballData.x, ballData.y, ballData.z);
        // Rotate based on velocity
        if (ballData.state === 'flying') {
            mesh.rotation.x += 0.2;
            mesh.rotation.z += 0.2;
        }
      }
    });
  });
  return (
    <group>
      {/* Player */}
      <group ref={playerRef}>
        <Capsule args={[0.4, 1, 4, 8]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial ref={playerMatRef} color="#3b82f6" />
        </Capsule>
        {/* Eyes/Visor for direction */}
        <Box args={[0.3, 0.1, 0.1]} position={[0, 1.2, -0.35]}>
            <meshStandardMaterial color="white" />
        </Box>
      </group>
      {/* Bot */}
      <group ref={botRef}>
        <Capsule args={[0.4, 1, 4, 8]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial ref={botMatRef} color="#ef4444" />
        </Capsule>
        {/* Eyes/Visor for direction */}
        <Box args={[0.3, 0.1, 0.1]} position={[0, 1.2, 0.35]}>
            <meshStandardMaterial color="black" />
        </Box>
      </group>
      {/* Balls */}
      {physicsState.balls.map((ball) => (
        <Sphere
          key={ball.id}
          ref={(el) => {
            if (el) ballRefs.current.set(ball.id, el);
            else ballRefs.current.delete(ball.id);
          }}
          args={[0.3, 16, 16]}
          castShadow
        >
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </Sphere>
      ))}
    </group>
  );
}