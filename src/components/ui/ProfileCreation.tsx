import React, { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Play, Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/store/useUserStore';
import { CharacterModel } from '@/components/game/Entities';
import * as THREE from 'three';
// Dummy entity for preview
const dummyEntity = {
  x: 0,
  z: 0,
  vx: 0,
  vz: 0,
  holdingBallId: null,
  isHit: false
};
function CharacterPreview({ hairStyle }: { hairStyle: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });
  return (
    // Manual offset to lower the character so the head is visible and centered
    // CharacterModel forces Y=0 internally, so we move the wrapper group down
    <group ref={groupRef} position={[0, -0.9, 0]}>
      <CharacterModel
        entity={dummyEntity}
        color="#3b82f6"
        type="player"
        hairStyle={hairStyle}
      />
    </group>
  );
}
export function ProfileCreation() {
  const [name, setName] = useState('');
  const [hairStyle, setHairStyle] = useState(0);
  const setProfile = useUserStore(s => s.setProfile);
  const [error, setError] = useState('');
  const handleStart = () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (name.length > 12) {
      setError('Name too long (max 12 chars)');
      return;
    }
    setProfile(name.trim(), hairStyle);
  };
  const cycleHair = (direction: number) => {
    setHairStyle(prev => {
      const next = prev + direction;
      if (next < 0) return 2;
      if (next > 2) return 0;
      return next;
    });
  };
  const generateRandomName = () => {
    const prefixes = ["Speedy", "Dodger", "Ace", "Shadow", "Blaze", "Rocket", "Ninja", "Viper", "Ghost", "Flash"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(Math.random() * 99) + 1;
    setName(`${randomPrefix}${randomNum}`);
    setError('');
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
      >
        {/* Left: 3D Preview */}
        <div className="h-[400px] md:h-[500px] bg-gradient-to-b from-blue-900/20 to-slate-900 rounded-3xl border border-blue-500/30 relative overflow-hidden shadow-2xl">
          <div className="absolute top-4 left-0 right-0 text-center z-10">
            <span className="bg-blue-600/80 text-white px-4 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
              PREVIEW
            </span>
          </div>
          <Canvas shadows camera={{ position: [0, 0.5, 4], fov: 40 }}>
            <Suspense fallback={null}>
              {/* Manual Lighting Setup */}
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
              {/* Character */}
              <CharacterPreview hairStyle={hairStyle} />
              {/* Floor Shadow */}
              <ContactShadows position={[0, -0.9, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
              {/* Controls */}
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                minPolarAngle={Math.PI / 3} 
                maxPolarAngle={Math.PI / 2} 
                target={[0, 0, 0]}
              />
            </Suspense>
          </Canvas>
        </div>
        {/* Right: Form */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-white text-center italic tracking-wider">
              NEW CHALLENGER
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-slate-400 text-sm font-bold uppercase tracking-wider ml-1">
                Codename
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <Input
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                    }}
                    placeholder="Enter your name..."
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white h-12 text-lg focus:ring-blue-500 focus:border-blue-500"
                    maxLength={12}
                    />
                </div>
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 bg-slate-800 border border-slate-600 hover:bg-slate-700"
                    onClick={generateRandomName}
                    title="Random Name"
                >
                    <Dices className="w-6 h-6 text-blue-400" />
                </Button>
              </div>
              {error && <p className="text-red-400 text-sm ml-1 animate-pulse">{error}</p>}
            </div>
            {/* Hair Selector */}
            <div className="space-y-2">
              <label className="text-slate-400 text-sm font-bold uppercase tracking-wider ml-1">
                Style
              </label>
              <div className="flex items-center justify-between bg-slate-900/50 rounded-xl p-2 border border-slate-600">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cycleHair(-1)}
                  className="hover:bg-slate-800 text-slate-300"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <span className="text-white font-bold text-lg">
                  Style {hairStyle + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cycleHair(1)}
                  className="hover:bg-slate-800 text-slate-300"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
            {/* Submit Button */}
            <Button
              onClick={handleStart}
              className="w-full h-14 text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="mr-2 w-6 h-6 fill-current" /> ENTER ARENA
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}