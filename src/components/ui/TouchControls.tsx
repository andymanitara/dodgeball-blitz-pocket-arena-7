import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gameInput } from '@/store/useGameStore';
import { cn } from '@/lib/utils';
export function TouchControls() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  // Refs for tracking input state without re-renders
  const joystickTouchId = useRef<number | null>(null);
  const isMouseDragging = useRef(false);
  // Helper to calculate and update joystick position
  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDist = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Clamp to radius
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    // Update UI state
    setJoystickPos({ x: dx, y: dy });
    // Update Game Input (Normalized -1 to 1)
    gameInput.joystick = {
      x: dx / maxDist,
      y: dy / maxDist
    };
  }, []);
  const resetJoystick = useCallback(() => {
    setJoystickPos({ x: 0, y: 0 });
    gameInput.joystick = { x: 0, y: 0 };
    setIsActive(false);
    joystickTouchId.current = null;
    isMouseDragging.current = false;
  }, []);
  // --- Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to stop browser gestures (scrolling/zooming)
    if (e.cancelable) e.preventDefault();
    // If already controlled, ignore new touches on this element
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0]; // Take the first changed touch
    if (touch) {
      joystickTouchId.current = touch.identifier;
      setIsActive(true);
      updateJoystick(touch.clientX, touch.clientY);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (joystickTouchId.current === null) return;
    // Find our touch
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (joystickTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        resetJoystick();
        break;
      }
    }
  };
  // --- Mouse Handlers (Desktop Debugging) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isMouseDragging.current = true;
    setIsActive(true);
    updateJoystick(e.clientX, e.clientY);
  };
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isMouseDragging.current) {
        e.preventDefault();
        updateJoystick(e.clientX, e.clientY);
      }
    };
    const handleWindowMouseUp = (e: MouseEvent) => {
      if (isMouseDragging.current) {
        e.preventDefault();
        resetJoystick();
      }
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [updateJoystick, resetJoystick]);
  // --- Button Handlers (Mouse + Touch) ---
  const setDodge = (active: boolean) => { gameInput.isDodging = active; };
  const setThrow = (active: boolean) => { gameInput.isThrowing = active; };
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-8 px-4 select-none z-50">
      <div className="flex justify-between items-end w-full max-w-md mx-auto">
        {/* Joystick Area */}
        <div
          ref={joystickRef}
          className={cn(
            "w-32 h-32 rounded-full border-2 backdrop-blur-sm relative pointer-events-auto touch-none transition-colors duration-200",
            isActive ? "bg-white/20 border-white/40" : "bg-white/10 border-white/20"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Stick */}
          <div
            className={cn(
                "w-12 h-12 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform duration-75",
                isActive ? "bg-blue-400 scale-110" : "bg-blue-500"
            )}
            style={{
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`
            }}
          />
        </div>
        {/* Action Buttons */}
        <div className="flex gap-4 pointer-events-auto pb-2">
          {/* Dodge Button */}
          <button
            className="w-20 h-20 rounded-full bg-yellow-500 border-b-4 border-yellow-700 shadow-lg active:scale-95 active:border-b-0 active:translate-y-1 flex items-center justify-center font-bold text-white text-sm touch-none transition-all select-none"
            onTouchStart={(e) => { if(e.cancelable) e.preventDefault(); setDodge(true); }}
            onTouchEnd={(e) => { if(e.cancelable) e.preventDefault(); setDodge(false); }}
            onMouseDown={() => setDodge(true)}
            onMouseUp={() => setDodge(false)}
            onMouseLeave={() => setDodge(false)}
          >
            DODGE
          </button>
          {/* Throw Button */}
          <button
            className="w-24 h-24 rounded-full bg-red-500 border-b-4 border-red-700 shadow-lg active:scale-95 active:border-b-0 active:translate-y-1 flex items-center justify-center font-bold text-white text-lg touch-none transition-all select-none"
            onTouchStart={(e) => { if(e.cancelable) e.preventDefault(); setThrow(true); }}
            onTouchEnd={(e) => { if(e.cancelable) e.preventDefault(); setThrow(false); }}
            onMouseDown={() => setThrow(true)}
            onMouseUp={() => setThrow(false)}
            onMouseLeave={() => setThrow(false)}
          >
            THROW
          </button>
        </div>
      </div>
    </div>
  );
}