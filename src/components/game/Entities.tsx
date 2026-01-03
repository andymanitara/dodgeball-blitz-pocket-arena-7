import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail, Box } from '@react-three/drei';
import { physicsState, useGameStore } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import * as THREE from 'three';
export const Hair = ({ style }: { style: number }) => {
    const color = useMemo(() => {
        const colors = ['#000000', '#3f2a14', '#5e3a18', '#8b4513', '#d2691e'];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);
    switch (style) {
        case 0: // Spiky / Mohawk-ish
            return (
                <group position={[0, 0.2, 0]}>
                    <Box args={[0.1, 0.15, 0.3]} position={[0, 0, 0]}>
                        <meshStandardMaterial color={color} />
                    </Box>
                    <Box args={[0.1, 0.12, 0.25]} position={[0, 0.05, 0]} rotation={[0.2, 0, 0]}>
                        <meshStandardMaterial color={color} />
                    </Box>
                </group>
            );
        case 1: // Afro / Puffs
            return (
                <group position={[0, 0.15, 0]}>
                    <Sphere args={[0.22, 16, 16]} position={[0, 0, 0]}>
                        <meshStandardMaterial color={color} />
                    </Sphere>
                    <Sphere args={[0.15, 16, 16]} position={[-0.15, -0.05, 0]}>
                        <meshStandardMaterial color={color} />
                    </Sphere>
                    <Sphere args={[0.15, 16, 16]} position={[0.15, -0.05, 0]}>
                        <meshStandardMaterial color={color} />
                    </Sphere>
                </group>
            );
        case 2: // Messy Top / Bun
            return (
                <group position={[0, 0.18, 0]}>
                    <Box args={[0.38, 0.1, 0.38]} position={[0, -0.05, 0]}>
                        <meshStandardMaterial color={color} />
                    </Box>
                    <Sphere args={[0.15, 16, 16]} position={[0, 0.05, -0.05]}>
                        <meshStandardMaterial color={color} />
                    </Sphere>
                </group>
            );
        default:
            return null;
    }
};
export const CharacterModel = ({ 
    color, 
    type, 
    hairStyle,
    entity: propEntity 
}: { 
    color: string, 
    type: 'player' | 'bot', 
    hairStyle?: number,
    entity?: any 
}) => {
  const group = useRef<THREE.Group>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLegGroup = useRef<THREE.Group>(null);
  const rightLegGroup = useRef<THREE.Group>(null);
  // Animation State
  const prevHoldingBallId = useRef<number | null>(null);
  const throwTimer = useRef(0);
  // Randomize hair style on mount if not provided
  const randomHair = useMemo(() => Math.floor(Math.random() * 3), []);
  const finalHairStyle = hairStyle !== undefined ? hairStyle : randomHair;
  // Define colors
  const skinColor = '#ffdbac';
  const shortsColor = type === 'player' ? '#f8fafc' : '#1e293b'; // White for player, Dark for bot
  const headbandColor = '#ffffff';
  // Create materials
  const materials = useMemo(() => ({
    jersey: new THREE.MeshStandardMaterial({ color }),
    skin: new THREE.MeshStandardMaterial({ color: skinColor }),
    shorts: new THREE.MeshStandardMaterial({ color: shortsColor }),
    headband: new THREE.MeshStandardMaterial({ color: headbandColor }),
    shoes: new THREE.MeshStandardMaterial({ color: '#000000' })
  }), [color, shortsColor]);
  // Cleanup materials
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);
  // State for velocity calculation and animation
  const prevPos = useRef(new THREE.Vector3(0, 0, 0));
  const walkTime = useRef(0);
  // Get paused state to prevent animation updates when paused
  const isPaused = useGameStore(s => s.isPaused);
  useFrame((state, delta) => {
    if (!group.current || !bodyGroup.current) return;
    // If propEntity is provided (preview mode), ignore pause state
    // Otherwise, respect game pause
    if (!propEntity && isPaused) return;
    // Read directly from mutable state to ensure we always have the latest reference
    // Prioritize propEntity if available (for preview), otherwise use global state
    const entity = propEntity || (type === 'player' ? physicsState.player : physicsState.bot);
    // 1. Position Sync with Interpolation
    const targetPos = new THREE.Vector3(entity.x, 0, entity.z);
    // Snap if distance is too large (teleport/respawn), otherwise lerp
    // This smoothing factor (0.25) ensures the character remains responsive while smoothing out the discrete network updates.
    if (group.current.position.distanceTo(targetPos) > 5) {
        group.current.position.copy(targetPos);
    } else {
        group.current.position.lerp(targetPos, 0.25);
    }
    // 2. Velocity Calculation (Local)
    // We use the target position for velocity calculation to keep animations responsive to the actual physics state
    const safeDelta = Math.max(delta, 0.001);
    const velocity = targetPos.clone().sub(prevPos.current).divideScalar(safeDelta);
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    prevPos.current.copy(targetPos);
    // 3. Rotation & Banking
    // Player faces -Z (back), Bot faces +Z (front)
    const baseRotation = type === 'player' ? Math.PI : 0;
    const tilt = -velocity.x * 0.05; // Bank into turns
    group.current.rotation.y = baseRotation;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, tilt, 0.1);
    // 4. Animation Logic
    const isHolding = entity.holdingBallId !== null;
    // Detect throw trigger (transition from holding to not holding)
    if (prevHoldingBallId.current !== null && entity.holdingBallId === null) {
        throwTimer.current = 0.3; // 300ms throw animation
    }
    prevHoldingBallId.current = entity.holdingBallId;
    if (throwTimer.current > 0) {
        throwTimer.current -= delta;
    }
    // --- LEG ANIMATION (Decoupled from Arms) ---
    if (speed > 0.5) {
        // Walk Cycle
        walkTime.current += delta * speed * 3;
        const legAngle = Math.sin(walkTime.current) * 0.8;
        if(leftLegGroup.current) leftLegGroup.current.rotation.x = legAngle;
        if(rightLegGroup.current) rightLegGroup.current.rotation.x = -legAngle;
    } else {
        // Idle Legs
        const damp = 10 * delta;
        if(leftLegGroup.current) leftLegGroup.current.rotation.x = THREE.MathUtils.lerp(leftLegGroup.current.rotation.x, 0, damp);
        if(rightLegGroup.current) rightLegGroup.current.rotation.x = THREE.MathUtils.lerp(rightLegGroup.current.rotation.x, 0, damp);
    }
    // --- ARM ANIMATION (Priority: Throw > Hold > Walk > Idle) ---
    const damp = 10 * delta;
    if (throwTimer.current > 0) {
        // Throw pose: Arms forward and down
        if(leftArm.current) leftArm.current.rotation.x = -Math.PI / 2 + 0.5;
        if(rightArm.current) rightArm.current.rotation.x = -Math.PI / 2 + 0.5;
    } else if (isHolding) {
        // Hold pose: Arms up and in
        if(leftArm.current) {
            leftArm.current.rotation.x = -Math.PI / 3;
            leftArm.current.rotation.z = -0.5;
        }
        if(rightArm.current) {
            rightArm.current.rotation.x = -Math.PI / 3;
            rightArm.current.rotation.z = 0.5;
        }
    } else if (speed > 0.5) {
        // Walk Swing (Opposite to legs)
        const armAngle = Math.cos(walkTime.current) * 0.6;
        if(leftArm.current) {
            leftArm.current.rotation.x = -armAngle;
            leftArm.current.rotation.z = 0;
        }
        if(rightArm.current) {
            rightArm.current.rotation.x = armAngle;
            rightArm.current.rotation.z = 0;
        }
    } else {
        // Idle Arms
        if(leftArm.current) {
            leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, damp);
            leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, 0, damp);
        }
        if(rightArm.current) {
            rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, damp);
            rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, 0, damp);
        }
    }
    // 5. Stumble / Hit Reaction
    const isHit = entity.isHit;
    const targetRotX = isHit ? -Math.PI / 2 : 0;
    const targetPosY = isHit ? 0.2 : 0.75; // Drop to floor
    bodyGroup.current.rotation.x = THREE.MathUtils.lerp(bodyGroup.current.rotation.x, targetRotX, 0.1);
    bodyGroup.current.position.y = THREE.MathUtils.lerp(bodyGroup.current.position.y, targetPosY, 0.1);
    // Comedic Spin on Hit
    if (isHit) {
        bodyGroup.current.rotation.y += delta * 15; // Spin fast!
    } else {
        bodyGroup.current.rotation.y = 0; // Reset
    }
    // 6. Hit Flash Effect
    if (entity.isHit) {
        const flash = Math.sin(state.clock.elapsedTime * 20) > 0 ? 1 : 0;
        // Flash all materials
        Object.values(materials).forEach(mat => {
            mat.emissive.setScalar(flash);
            if (flash > 0.5) {
                mat.color.setHex(0xffffff);
            }
        });
    } else {
        materials.jersey.emissive.setScalar(0);
        materials.jersey.color.set(color);
        materials.skin.emissive.setScalar(0);
        materials.skin.color.set(skinColor);
        materials.shorts.emissive.setScalar(0);
        materials.shorts.color.set(shortsColor);
        materials.headband.emissive.setScalar(0);
        materials.headband.color.set(headbandColor);
        materials.shoes.emissive.setScalar(0);
        materials.shoes.color.set('#000000');
    }
  });
  return (
    <group ref={group}>
        <group ref={bodyGroup}>
            {/* Torso (Jersey) */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow material={materials.jersey}>
                <boxGeometry args={[0.5, 0.6, 0.3]} />
            </mesh>
            {/* Head Group */}
            <group position={[0, 1.2, 0]}>
                {/* Head (Skin) */}
                <mesh castShadow receiveShadow material={materials.skin}>
                    <boxGeometry args={[0.35, 0.35, 0.35]} />
                </mesh>
                {/* Hair */}
                <Hair style={finalHairStyle} />
                {/* Headband */}
                <mesh position={[0, 0.1, 0]} castShadow material={materials.headband}>
                     <boxGeometry args={[0.36, 0.08, 0.36]} />
                </mesh>
                {/* Face Details */}
                {type === 'player' ? (
                    // Player Face (Back of head relative to camera, but player faces -Z)
                    <mesh position={[0, 0, 0.18]}>
                        <boxGeometry args={[0.25, 0.08, 0.05]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
                    </mesh>
                ) : (
                    // Bot Face (Front of head relative to camera)
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
            </group>
            {/* Arms */}
            <group position={[-0.32, 0.95, 0]}>
                <mesh ref={leftArm} position={[0, -0.25, 0]} castShadow material={materials.skin}>
                    <boxGeometry args={[0.15, 0.5, 0.15]} />
                    {/* Hand */}
                    <mesh position={[0, -0.3, 0]} material={materials.skin}>
                        <boxGeometry args={[0.18, 0.18, 0.18]} />
                    </mesh>
                </mesh>
            </group>
            <group position={[0.32, 0.95, 0]}>
                <mesh ref={rightArm} position={[0, -0.25, 0]} castShadow material={materials.skin}>
                    <boxGeometry args={[0.15, 0.5, 0.15]} />
                    {/* Hand */}
                    <mesh position={[0, -0.3, 0]} material={materials.skin}>
                        <boxGeometry args={[0.18, 0.18, 0.18]} />
                    </mesh>
                </mesh>
            </group>
            {/* Legs */}
            <group position={[-0.15, 0.45, 0]} ref={leftLegGroup}>
                <group position={[0, -0.35, 0]}>
                    {/* Thigh (Shorts) */}
                    <mesh position={[0, 0.15, 0]} castShadow material={materials.shorts}>
                        <boxGeometry args={[0.2, 0.4, 0.2]} />
                    </mesh>
                    {/* Calf (Skin) */}
                    <mesh position={[0, -0.2, 0]} castShadow material={materials.skin}>
                        <boxGeometry args={[0.15, 0.3, 0.15]} />
                    </mesh>
                    {/* Shoe */}
                    <mesh position={[0, -0.38, 0.05]} castShadow material={materials.shoes}>
                        <boxGeometry args={[0.16, 0.1, 0.25]} />
                    </mesh>
                </group>
            </group>
            <group position={[0.15, 0.45, 0]} ref={rightLegGroup}>
                <group position={[0, -0.35, 0]}>
                    {/* Thigh (Shorts) */}
                    <mesh position={[0, 0.15, 0]} castShadow material={materials.shorts}>
                        <boxGeometry args={[0.2, 0.4, 0.2]} />
                    </mesh>
                    {/* Calf (Skin) */}
                    <mesh position={[0, -0.2, 0]} castShadow material={materials.skin}>
                        <boxGeometry args={[0.15, 0.3, 0.15]} />
                    </mesh>
                    {/* Shoe */}
                    <mesh position={[0, -0.38, 0.05]} castShadow material={materials.shoes}>
                        <boxGeometry args={[0.16, 0.1, 0.25]} />
                    </mesh>
                </group>
            </group>
        </group>
    </group>
  );
};
const Ball = ({ id }: { id: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visualState, setVisualState] = useState({ owner: null as any, isLethal: false });
  const isPaused = useGameStore(s => s.isPaused);
  useFrame(() => {
    if (isPaused) return;
    const ballData = physicsState.balls.find(b => b.id === id);
    if (ballData && meshRef.current) {
      meshRef.current.position.set(ballData.x, ballData.y, ballData.z);
      if (ballData.state === 'flying') {
        meshRef.current.rotation.x += 0.2;
        meshRef.current.rotation.z += 0.2;
      }
      if (ballData.owner !== visualState.owner || ballData.isLethal !== visualState.isLethal) {
        setVisualState({ owner: ballData.owner, isLethal: ballData.isLethal });
      }
    }
  });
  const trailColor = visualState.owner === 'player' ? '#3b82f6' : (visualState.owner === 'bot' ? '#ef4444' : '#eab308');
  const showTrail = visualState.isLethal;
  return (
    <group>
       <Trail
         width={showTrail ? 0.4 : 0}
         length={4}
         color={trailColor}
         attenuation={(t) => t * t}
       >
         <Sphere ref={meshRef} args={[0.3, 32, 32]} castShadow>
           <meshPhysicalMaterial
             color="#dc2626"
             roughness={0.7}
             metalness={0.1}
             clearcoat={0.1}
             clearcoatRoughness={0.5}
           />
         </Sphere>
       </Trail>
    </group>
  );
};
export function Entities() {
  const playerHair = useUserStore(s => s.hairStyle);
  return (
    <group>
      <CharacterModel
        color="#3b82f6"
        type="player"
        hairStyle={playerHair}
      />
      <CharacterModel
        color="#ef4444"
        type="bot"
      />
      {physicsState.balls.map((ball) => (
        <Ball key={ball.id} id={ball.id} />
      ))}
    </group>
  );
}