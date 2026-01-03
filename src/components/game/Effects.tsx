import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { physicsState } from '@/store/useGameStore';
import * as THREE from 'three';
function Particles({ events }: { events: any[] }) {
  const recentHits = events.filter(e => e.type === 'hit' && Date.now() - e.time < 500);
  return (
    <group>
      {recentHits.map(hit => (
        <group key={hit.id} position={[hit.x, 1, hit.z]}>
            <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[0.5, 0.8, 16]} />
                <meshBasicMaterial color="white" transparent opacity={0.8} />
            </mesh>
        </group>
      ))}
    </group>
  );
}
function FloatingText({ x, z, text, time }: { x: number, z: number, text: string, time: number }) {
    if (!text) return null;
    const age = Date.now() - time;
    if (age > 1000) return null;
    const progress = age / 1000;
    const yOffset = progress * 2; // Float up
    const scale = 1 + Math.sin(progress * Math.PI) * 0.5; // Pop effect
    const opacity = 1 - progress;
    return (
        <Text
            position={[x, 1.5 + yOffset, z]}
            fontSize={0.8}
            color="white"
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
  useFrame(() => {
    const now = Date.now();
    const activeEvents = physicsState.events.filter(e => now - e.time < 1000);
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