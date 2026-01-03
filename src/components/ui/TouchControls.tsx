import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gameInput, physicsState } from '@/store/useGameStore';
import { cn } from '@/lib/utils';
import { DODGE_COOLDOWN } from '@/lib/constants';
export function TouchControls() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [cooldownPct, setCooldownPct] = useState(0);
  // Refs for tracking input state without re-renders
  const joystickTouchId = useRef<number | null>(null);
  const isMouseDragging = useRef(false);
  // Cooldown Polling Loop
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      // Read directly from mutable physics state
      const currentCooldown = physicsState.player?.cooldown || 0;
      const pct = Math.max(0, Math.min(1, currentCooldown / DODGE_COOLDOWN));
      // Only update state if changed significantly to avoid excessive re-renders
      setCooldownPct(prev => {
        if (Math.abs(prev - pct) > 0.01) return pct;
        if (prev > 0 && pct === 0) return 0; // Ensure we hit exactly 0
        return prev;
      });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);
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
    if (e.cancelable) e.preventDefault();
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    if (touch) {
      joystickTouchId.current = touch.identifier;
      setIsActive(true);
      updateJoystick(touch.clientX, touch.clientY);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (joystickTouchId.current === null) return;
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
  // --- Button Handlers ---
  const setDodge = (active: boolean) => {
    if (cooldownPct <= 0) {
        gameInput.isDodging = active;
    }
  };
  const setThrow = (active: boolean) => { gameInput.isThrowing = active; };
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-[calc(2rem+env(safe-area-inset-bottom))] px-6 select-none z-50">
      <div className="flex justify-between items-end w-full max-w-lg mx-auto">
        {/* Joystick Area */}
        <div
          ref={joystickRef}
          className={cn(
            "w-36 h-36 rounded-full border-4 backdrop-blur-md relative pointer-events-auto touch-none transition-all duration-200 shadow-xl",
            isActive ? "bg-white/20 border-blue-400/60 shadow-[0_0_20px_rgba(96,165,250,0.4)]" : "bg-white/10 border-white/20"
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
                "w-16 h-16 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform duration-75 border-4 border-white/30",
                isActive ? "bg-blue-500 scale-110" : "bg-blue-600"
            )}
            style={{
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`
            }}
          >
            {/* Inner detail */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-6 pointer-events-auto pb-2 items-end">
          {/* Dodge Button */}
          <div className="relative group">
            <button
                disabled={cooldownPct > 0}
                className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center font-black text-white text-lg touch-none transition-all select-none overflow-hidden relative border-4 border-yellow-400",
                    cooldownPct > 0
                        ? "bg-yellow-700 border-yellow-900 opacity-80 cursor-not-allowed translate-y-2 shadow-none"
                        : "bg-yellow-500 shadow-[0_8px_0_rgb(161,98,7),0_15px_20px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[8px]"
                )}
                onTouchStart={(e) => { if(e.cancelable) e.preventDefault(); setDodge(true); }}
                onTouchEnd={(e) => { if(e.cancelable) e.preventDefault(); setDodge(false); }}
                onMouseDown={() => setDodge(true)}
                onMouseUp={() => setDodge(false)}
                onMouseLeave={() => setDodge(false)}
            >
                <span className="z-10 relative drop-shadow-md italic tracking-wider">DODGE</span>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                {/* Cooldown Overlay */}
                {cooldownPct > 0 && (
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-black/60 z-20 transition-all duration-75 ease-linear"
                        style={{ height: `${cooldownPct * 100}%` }}
                    />
                )}
            </button>
          </div>
          {/* Throw Button */}
          <div className="relative group">
            <button
                className="w-28 h-28 rounded-full flex items-center justify-center font-black text-white text-2xl touch-none transition-all select-none border-4 border-red-400 bg-red-600 shadow-[0_8px_0_rgb(153,27,27),0_15px_20px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[8px]"
                onTouchStart={(e) => { if(e.cancelable) e.preventDefault(); setThrow(true); }}
                onTouchEnd={(e) => { if(e.cancelable) e.preventDefault(); setThrow(false); }}
                onMouseDown={() => setThrow(true)}
                onMouseUp={() => setThrow(false)}
                onMouseLeave={() => setThrow(false)}
            >
                <span className="z-10 relative drop-shadow-md italic tracking-wider">THROW</span>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}