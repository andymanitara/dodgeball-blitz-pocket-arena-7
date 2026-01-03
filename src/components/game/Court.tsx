import React from 'react';
import { Plane, Box } from '@react-three/drei';
export function Court() {
  return (
    <group>
      <Plane
        args={[10, 18]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#f0f9ff" />
      </Plane>
      <Plane
        args={[10, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <meshBasicMaterial color="#cbd5e1" />
      </Plane>
      <Box args={[0.5, 1, 18]} position={[-5.25, 0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      <Box args={[0.5, 1, 18]} position={[5.25, 0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      <Box args={[11, 2, 0.5]} position={[0, 1, -9.25]} receiveShadow castShadow>
        <meshStandardMaterial color="#ef4444" />
      </Box>
      <Box args={[11, 2, 0.5]} position={[0, 1, 9.25]} receiveShadow castShadow>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
    </group>
  );
}