import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box } from '@react-three/drei';
import { physicsState, useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';
const Explosion = ({ x, z, color }: { x: number, z: number, color: string }) => {
  const isPaused = useGameStore(s => s.isPaused);
  // Generate random particle config once
  const particles = useMemo(() => {
    return new Array(12).fill(0).map(() => ({
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * 10 + 5,
      vz: (Math.random() - 0.5) * 12,
      color: color,
      scale: Math.random() * 0.2 + 0.1,
      rotationSpeed: {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10
      }
    }));
  }, [color]);
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (isPaused || !group.current) return;
    group.current.children.forEach((mesh, i) => {
        const p = particles[i];
        // Update position
        mesh.position.x += p.vx * delta;
        mesh.position.y += p.vy * delta;
        mesh.position.z += p.vz * delta;
        // Gravity
        p.vy -= 25 * delta; 
        // Rotation
        mesh.rotation.x += p.rotationSpeed.x * delta;
        mesh.rotation.y += p.rotationSpeed.y * delta;
        mesh.rotation.z += p.rotationSpeed.z * delta;
        // Scale down over time (fade out effect)
        if (mesh.scale.x > 0) {
            const shrink = delta * 0.5;
            mesh.scale.x = Math.max(0, mesh.scale.x - shrink);
            mesh.scale.y = Math.max(0, mesh.scale.y - shrink);
            mesh.scale.z = Math.max(0, mesh.scale.z - shrink);
        }
    });
  });
  return (
    <group ref={group} position={[x, 1, z]}>
        {particles.map((p, i) => (
            <Box key={i} args={[p.scale, p.scale, p.scale]} position={[0,0,0]}>
                <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} />
            </Box>
        ))}
    </group>
  );
}
function Particles({ events }: { events: any[] }) {
  // Only show hits from last 500ms
  const recentHits = events.filter(e => e.type === 'hit' && Date.now() - e.time < 500);
  return (
    <group>
      {recentHits.map(hit => {
        // Determine color based on who was hit (inferred from position or text)
        // Player is at Z > 0, Bot is at Z < 0
        const isPlayerHit = hit.z > 0;
        const color = isPlayerHit ? "#3b82f6" : "#ef4444"; // Blue confetti for player hit, Red for bot hit
        return <Explosion key={hit.id} x={hit.x} z={hit.z} color={color} />;
      })}
    </group>
  );
}
function FloatingText({ x, z, text, time }: { x: number, z: number, text: string, time: number }) {
    const isPaused = useGameStore(s => s.isPaused);
    if (!text) return null;
    // We need to track elapsed time manually if we want to pause animations correctly,
    // but for simple floating text, using Date.now() is acceptable as long as we accept it might jump if paused.
    // However, to prevent it from disappearing while paused, we should ideally use a game time.
    // For MVP, we'll stick to Date.now() but extend the lifetime slightly.
    const age = Date.now() - time;
    if (age > 1000) return null;
    const progress = age / 1000;
    const isKO = text === "K.O.!";
    const yOffset = progress * (isKO ? 3 : 2); // Float higher if KO
    const scaleBase = isKO ? 2 : 1;
    const scale = scaleBase + Math.sin(progress * Math.PI) * 0.5; // Pop effect
    const opacity = 1 - progress;
    const color = isKO ? "#ef4444" : "white";
    return (
        <Text
            position={[x, 1.5 + yOffset, z]}
            fontSize={isKO ? 1.5 : 0.8}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="black"
            scale={[scale, scale, scale]}
            fillOpacity={opacity}
            outlineOpacity={opacity}
        >
            {text}
        </Text>
    );
}
export function Effects() {
  const [events, setEvents] = React.useState<any[]>([]);
  const isPaused = useGameStore(s => s.isPaused);
  useFrame(() => {
    if (isPaused) return;
    const now = Date.now();
    const activeEvents = physicsState.events.filter(e => now - e.time < 1000);
    // Only update if count changes or last event ID changes to avoid excessive re-renders
    if (activeEvents.length !== events.length || (activeEvents.length > 0 && activeEvents[activeEvents.length-1].id !== events[events.length-1]?.id)) {
        setEvents([...activeEvents]);
    }
  });
  return (
    <group>
      <Particles events={events} />
      {events.map(e => (
        e.text ? <FloatingText key={e.id} x={e.x} z={e.z} text={e.text} time={e.time} /> : null
      ))}
    </group>
  );
}