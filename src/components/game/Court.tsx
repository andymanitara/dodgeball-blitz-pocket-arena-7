import React from 'react';
import { Plane, Box } from '@react-three/drei';
import { COURT_WIDTH, COURT_LENGTH } from '@/lib/constants';
export function Court() {
  return (
    <group>
      <Plane
        args={[COURT_WIDTH, COURT_LENGTH]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#f0f9ff" />
      </Plane>
      <Plane
        args={[COURT_WIDTH, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <meshBasicMaterial color="#cbd5e1" />
      </Plane>
      {/* Left Wall */}
      <Box args={[0.5, 1, COURT_LENGTH]} position={[-(COURT_WIDTH/2 + 0.25), 0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      {/* Right Wall */}
      <Box args={[0.5, 1, COURT_LENGTH]} position={[(COURT_WIDTH/2 + 0.25), 0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      {/* Top Wall (Bot Side) */}
      <Box args={[COURT_WIDTH + 1, 2, 0.5]} position={[0, 1, -(COURT_LENGTH/2 + 0.25)]} receiveShadow castShadow>
        <meshStandardMaterial color="#ef4444" />
      </Box>
      {/* Bottom Wall (Player Side) */}
      <Box args={[COURT_WIDTH + 1, 2, 0.5]} position={[0, 1, (COURT_LENGTH/2 + 0.25)]} receiveShadow castShadow>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
    </group>
  );
}