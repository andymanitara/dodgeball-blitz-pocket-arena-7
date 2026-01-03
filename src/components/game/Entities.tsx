import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { physicsState } from '@/store/useGameStore';
import * as THREE from 'three';
const CharacterModel = ({ entity, color, type }: { entity: any, color: string, type: 'player' | 'bot' }) => {
  const group = useRef<THREE.Group>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  // Create a single material instance for the entire character
  // This ensures all body parts flash together when 'emissive' is updated
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({ color });
  }, [color]);
  // Cleanup material on unmount
  useEffect(() => {
    return () => material.dispose();
  }, [material]);
  // State for velocity calculation and animation
  const prevPos = useRef(new THREE.Vector3(entity.x, 0, entity.z));
  const walkTime = useRef(0);
  useFrame((state, delta) => {
    if (!group.current || !bodyGroup.current) return;
    // 1. Position Sync
    const currentPos = new THREE.Vector3(entity.x, 0, entity.z);
    group.current.position.copy(currentPos);
    // 2. Velocity Calculation (Local)
    const safeDelta = Math.max(delta, 0.001);
    const velocity = currentPos.clone().sub(prevPos.current).divideScalar(safeDelta);
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    prevPos.current.copy(currentPos);
    // 3. Rotation & Banking
    // Player faces -Z (back), Bot faces +Z (front)
    const baseRotation = type === 'player' ? Math.PI : 0;
    const tilt = -velocity.x * 0.05; // Bank into turns
    group.current.rotation.y = baseRotation;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, tilt, 0.1);
    // 4. Procedural Walk Cycle
    if (speed > 0.5) {
        walkTime.current += delta * speed * 3; // Animation speed based on movement speed
        const armAngle = Math.cos(walkTime.current) * 0.6;
        const legAngle = Math.sin(walkTime.current) * 0.8;
        if(leftArm.current) leftArm.current.rotation.x = -armAngle;
        if(rightArm.current) rightArm.current.rotation.x = armAngle;
        if(leftLeg.current) leftLeg.current.rotation.x = legAngle;
        if(rightLeg.current) rightLeg.current.rotation.x = -legAngle;
    } else {
        // Return to idle pose
        const damp = 10 * delta;
        if(leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, damp);
        if(rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, damp);
        if(leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, damp);
        if(rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, damp);
    }
    // 5. Stumble / Hit Reaction
    // Tilt body backward when hit
    const targetRotX = entity.isHit ? (type === 'player' ? Math.PI/4 : -Math.PI/4) : 0;
    bodyGroup.current.rotation.x = THREE.MathUtils.lerp(bodyGroup.current.rotation.x, targetRotX, 0.1);
    // 6. Hit Flash Effect
    if (entity.isHit) {
        const flash = Math.sin(state.clock.elapsedTime * 20) > 0 ? 1 : 0;
        material.emissive.setScalar(flash);
        material.color.setHex(0xffffff);
    } else {
        material.emissive.setScalar(0);
        material.color.set(color);
    }
  });
  return (
    <group ref={group}>
        <group ref={bodyGroup}>
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[0.5, 0.6, 0.3]} />
            </mesh>
            <mesh ref={head} position={[0, 1.2, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[0.35, 0.35, 0.35]} />
                {type === 'player' ? (
                    <mesh position={[0, 0, 0.18]}>
                        <boxGeometry args={[0.25, 0.08, 0.05]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
                    </mesh>
                ) : (
                    <group position={[0, 0, 0.18]}>
                        <mesh position={[-0.08, 0.02, 0]} rotation={[0, 0, -0.2]}>
                            <boxGeometry args={[0.1, 0.04, 0.02]} />
                            <meshStandardMaterial color="#000" />
                        </mesh>
                        <mesh position={[0.08, 0.02, 0]} rotation={[0, 0, 0.2]}>
                            <boxGeometry args={[0.1, 0.04, 0.02]} />
                            <meshStandardMaterial color="#000" />
                        </mesh>
                    </group>
                )}
            </mesh>
            <group position={[-0.32, 0.95, 0]}>
                <mesh ref={leftArm} position={[0, -0.25, 0]} castShadow material={material}>
                    <boxGeometry args={[0.15, 0.5, 0.15]} />
                    <mesh position={[0, -0.3, 0]} material={material}>
                        <boxGeometry args={[0.18, 0.18, 0.18]} />
                    </mesh>
                </mesh>
            </group>
            <group position={[0.32, 0.95, 0]}>
                <mesh ref={rightArm} position={[0, -0.25, 0]} castShadow material={material}>
                    <boxGeometry args={[0.15, 0.5, 0.15]} />
                    <mesh position={[0, -0.3, 0]} material={material}>
                        <boxGeometry args={[0.18, 0.18, 0.18]} />
                    </mesh>
                </mesh>
            </group>
            <group position={[-0.15, 0.45, 0]}>
                <mesh ref={leftLeg} position={[0, -0.35, 0]} castShadow>
                    <boxGeometry args={[0.18, 0.7, 0.18]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            </group>
            <group position={[0.15, 0.45, 0]}>
                <mesh ref={rightLeg} position={[0, -0.35, 0]} castShadow>
                    <boxGeometry args={[0.18, 0.7, 0.18]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            </group>
        </group>
    </group>
  );
};
export function Entities() {
  const ballRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  useFrame(() => {
    physicsState.balls.forEach(ballData => {
      const mesh = ballRefs.current.get(ballData.id);
      if (mesh) {
        mesh.position.set(ballData.x, ballData.y, ballData.z);
        if (ballData.state === 'flying') {
            mesh.rotation.x += 0.2;
            mesh.rotation.z += 0.2;
        }
      }
    });
  });
  return (
    <group>
      <CharacterModel
        entity={physicsState.player}
        color="#3b82f6"
        type="player"
      />
      <CharacterModel
        entity={physicsState.bot}
        color="#ef4444"
        type="bot"
      />
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