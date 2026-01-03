import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Capsule } from '@react-three/drei';
import { physicsState } from '@/store/useGameStore';
import * as THREE from 'three';
export function Entities() {
  const playerRef = useRef<THREE.Group>(null);
  const botRef = useRef<THREE.Group>(null);
  // We'll use a map for balls to update them efficiently
  const ballRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  useFrame(() => {
    // Sync Player
    if (playerRef.current) {
      playerRef.current.position.set(physicsState.player.x, 0, physicsState.player.z);
      // Simple tilt based on movement could go here
      if (physicsState.player.isHit) {
        playerRef.current.visible = Math.random() > 0.5; // Flicker effect
      } else {
        playerRef.current.visible = true;
      }
    }
    // Sync Bot
    if (botRef.current) {
      botRef.current.position.set(physicsState.bot.x, 0, physicsState.bot.z);
      if (physicsState.bot.isHit) {
        botRef.current.visible = Math.random() > 0.5;
      } else {
        botRef.current.visible = true;
      }
    }
    // Sync Balls
    physicsState.balls.forEach(ballData => {
      const mesh = ballRefs.current.get(ballData.id);
      if (mesh) {
        mesh.position.set(ballData.x, ballData.y, ballData.z);
        // Rotate ball based on velocity for visual flair
        mesh.rotation.x += 0.1;
      }
    });
  });
  return (
    <group>
      {/* Player */}
      <group ref={playerRef}>
        <Capsule args={[0.4, 1, 4, 8]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial color="#3b82f6" />
        </Capsule>
        {/* Eyes/Face indicator */}
        <Box args={[0.3, 0.1, 0.1]} position={[0, 1.2, -0.35]}>
            <meshStandardMaterial color="white" />
        </Box>
      </group>
      {/* Bot */}
      <group ref={botRef}>
        <Capsule args={[0.4, 1, 4, 8]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial color="#ef4444" />
        </Capsule>
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
// Helper for Box since it's not exported by drei directly sometimes or just to be safe
function Box(props: any) {
    return (
        <mesh {...props}>
            <boxGeometry args={props.args} />
            {props.children}
        </mesh>
    )
}