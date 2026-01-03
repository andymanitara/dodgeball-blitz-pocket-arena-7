import React from 'react';
import { Plane, Box } from '@react-three/drei';
import { COURT_WIDTH, COURT_LENGTH } from '@/lib/constants';
export function Court() {
  const woodColor = "#d97706"; // Warm wood
  const lineColor = "#ffffff";
  const wallColor = "#94a3b8"; // Slate walls
  const lineWidth = 0.1;
  const attackLineZ = 3;
  return (
    <group>
      {/* Main Floor - Wood Texture */}
      <Plane
        args={[COURT_WIDTH, COURT_LENGTH]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={woodColor} roughness={0.5} />
      </Plane>
      {/* Court Markings (Tape) */}
      <group position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Center Line */}
        <Plane args={[COURT_WIDTH, lineWidth]} position={[0, 0, 0]}>
            <meshBasicMaterial color={lineColor} />
        </Plane>
        {/* Attack Lines */}
        <Plane args={[COURT_WIDTH, lineWidth]} position={[0, attackLineZ, 0]}>
            <meshBasicMaterial color={lineColor} />
        </Plane>
        <Plane args={[COURT_WIDTH, lineWidth]} position={[0, -attackLineZ, 0]}>
            <meshBasicMaterial color={lineColor} />
        </Plane>
        {/* Perimeter Borders */}
        {/* Top */}
        <Plane args={[COURT_WIDTH, lineWidth]} position={[0, COURT_LENGTH/2 - lineWidth/2, 0]}>
            <meshBasicMaterial color={lineColor} />
        </Plane>
        {/* Bottom */}
        <Plane args={[COURT_WIDTH, lineWidth]} position={[0, -COURT_LENGTH/2 + lineWidth/2, 0]}>
            <meshBasicMaterial color={lineColor} />
        </Plane>
        {/* Left */}
        <Plane args={[lineWidth, COURT_LENGTH]} position={[-COURT_WIDTH/2 + lineWidth/2, 0, 0]}>
            <meshBasicMaterial color={lineColor} />
        </Plane>
        {/* Right */}
        <Plane args={[lineWidth, COURT_LENGTH]} position={[COURT_WIDTH/2 - lineWidth/2, 0, 0]}>
            <meshBasicMaterial color={lineColor} />
        </Plane>
      </group>
      {/* Walls */}
      {/* Left Wall */}
      <Box args={[0.5, 1.5, COURT_LENGTH]} position={[-(COURT_WIDTH/2 + 0.25), 0.75, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={wallColor} />
      </Box>
      {/* Right Wall */}
      <Box args={[0.5, 1.5, COURT_LENGTH]} position={[(COURT_WIDTH/2 + 0.25), 0.75, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={wallColor} />
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