import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { Heart, Pause, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { audioController } from '@/lib/audioController';
import { Button } from '@/components/ui/button';
export function GameHUD() {
  const playerLives = useGameStore(s => s.playerLives);
  const botLives = useGameStore(s => s.botLives);
  const playerScore = useGameStore(s => s.playerScore);
  const botScore = useGameStore(s => s.botScore);
  const currentRound = useGameStore(s => s.currentRound);
  const phase = useGameStore(s => s.phase);
  const countdown = useGameStore(s => s.countdown);
  const setCountdown = useGameStore(s => s.setCountdown);
  const togglePause = useGameStore(s => s.togglePause);
  const isPaused = useGameStore(s => s.isPaused);
  const gameMode = useGameStore(s => s.gameMode);
  const username = useUserStore(s => s.username);
  const status = useMultiplayerStore(s => s.status);
  const [showRoundStart, setShowRoundStart] = useState(false);
  const [showGo, setShowGo] = useState(false);
  const prevCountdown = useRef(countdown);
  useEffect(() => {
    if (phase === 'playing') {
        setShowRoundStart(true);
        const timer = setTimeout(() => setShowRoundStart(false), 2000);
        return () => clearTimeout(timer);
    }
  }, [phase, currentRound]);
  // Countdown Logic
  useEffect(() => {
    if (isPaused) return;
    if (countdown > 0) {
        audioController.play('beep');
        const timer = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }
    // Detect transition from 1 to 0 to show "GO!"
    if (prevCountdown.current === 1 && countdown === 0) {
        setShowGo(true);
        audioController.play('throw'); // Whistle sound
        const timer = setTimeout(() => setShowGo(false), 1000);
        return () => clearTimeout(timer);
    }
    prevCountdown.current = countdown;
  }, [countdown, setCountdown, isPaused]);
  return (
    <div className="absolute inset-0 pointer-events-none px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] flex flex-col justify-between overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-start pt-2 px-2 relative">
        {/* Player Stats (Left) */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`p-life-${i}`}
                initial={false}
                animate={{ scale: i < playerLives ? 1 : 0.8, opacity: i < playerLives ? 1 : 0.3 }}
              >
                <Heart
                  className={cn(
                    "w-8 h-8 fill-current transition-colors",
                    i < playerLives ? "text-red-500" : "text-gray-600"
                  )}
                />
              </motion.div>
            ))}
          </div>
          <div className="bg-blue-600/90 backdrop-blur text-white px-4 py-1 rounded-full font-black text-lg shadow-lg self-start border-2 border-blue-400 max-w-[150px] truncate">
            {username.toUpperCase()}: {playerScore}
          </div>
        </div>
        {/* Center Area: Pause & Online Status */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 pointer-events-auto flex flex-col items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm border border-white/10"
                onClick={togglePause}
            >
                <Pause className="w-6 h-6 fill-current" />
            </Button>
            {/* Online Indicator */}
            {gameMode === 'multiplayer' && (
                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", status === 'connected' ? "bg-green-500" : "bg-yellow-500")} />
                    <span className="text-[10px] font-bold text-white tracking-wider">ONLINE</span>
                </div>
            )}
        </div>
        {/* Bot/Opponent Stats (Right) */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`b-life-${i}`}
                initial={false}
                animate={{ scale: i < botLives ? 1 : 0.8, opacity: i < botLives ? 1 : 0.3 }}
              >
                <Heart
                  className={cn(
                    "w-8 h-8 fill-current transition-colors",
                    i < botLives ? "text-red-500" : "text-gray-600"
                  )}
                />
              </motion.div>
            ))}
          </div>
          <div className="bg-red-600/90 backdrop-blur text-white px-4 py-1 rounded-full font-black text-lg shadow-lg self-end border-2 border-red-400">
            {gameMode === 'multiplayer' ? 'OPPONENT' : 'BOT'}: {botScore}
          </div>
        </div>
      </div>
      {/* Round Start Overlay */}
      <AnimatePresence>
        {showRoundStart && (
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-40"
            >
                <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] stroke-black tracking-tighter italic">
                    ROUND {currentRound}
                </h2>
            </motion.div>
        )}
      </AnimatePresence>
      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown > 0 && (
            <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-50"
            >
                <h2 className="text-9xl font-black text-yellow-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] stroke-black tracking-tighter">
                    {countdown}
                </h2>
            </motion.div>
        )}
        {showGo && (
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-50"
            >
                <h2 className="text-9xl font-black text-green-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] stroke-black tracking-tighter">
                    GO!
                </h2>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}