import React, { useRef, useEffect, useState } from 'react';
import { gameInput } from '@/store/useGameStore';
import { cn } from '@/lib/utils';
export function TouchControls() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  // Joystick Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    setActive(true);
    // Use targetTouches to only track fingers specifically on the joystick element
    // This prevents interference from other fingers (like holding the throw button)
    if (e.targetTouches.length > 0) {
        updateJoystick(e.targetTouches[0]);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (active && e.targetTouches.length > 0) {
        updateJoystick(e.targetTouches[0]);
    }
  };
  const handleTouchEnd = () => {
    setActive(false);
    setJoystickPos({ x: 0, y: 0 });
    gameInput.joystick = { x: 0, y: 0 };
  };
  const updateJoystick = (touch: React.Touch) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDist = rect.width / 2;
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    setJoystickPos({ x: dx, y: dy });
    // Normalize for game input (-1 to 1)
    gameInput.joystick = {
      x: dx / maxDist,
      y: dy / maxDist
    };
  };
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-8 px-4 select-none">
      <div className="flex justify-between items-end w-full max-w-md mx-auto">
        {/* Joystick Area */}
        <div
          ref={joystickRef}
          className="w-32 h-32 bg-white/10 rounded-full border-2 border-white/20 backdrop-blur-sm relative pointer-events-auto touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div
            className="w-12 h-12 bg-blue-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform duration-75"
            style={{
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`
            }}
          />
        </div>
        {/* Action Buttons */}
        <div className="flex gap-4 pointer-events-auto">
          <button
            className="w-20 h-20 rounded-full bg-yellow-500 border-4 border-yellow-600 shadow-lg active:scale-95 active:bg-yellow-600 flex items-center justify-center font-bold text-white text-sm touch-none"
            onTouchStart={(e) => { e.stopPropagation(); gameInput.isDodging = true; }}
          >
            DODGE
          </button>
          <button
            className="w-24 h-24 rounded-full bg-red-500 border-4 border-red-600 shadow-lg active:scale-95 active:bg-red-600 flex items-center justify-center font-bold text-white text-lg touch-none"
            onTouchStart={(e) => { e.stopPropagation(); gameInput.isThrowing = true; }}
          >
            THROW
          </button>
        </div>
      </div>
    </div>
  );
}