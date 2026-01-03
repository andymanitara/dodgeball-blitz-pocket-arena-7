import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { Heart, Pause, Wifi, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { audioController } from '@/lib/audioController';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  const connectionType = useMultiplayerStore(s => s.connectionType);
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
    if (prevCountdown.current === 1 && countdown === 0) {
        setShowGo(true);
        audioController.play('throw');
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
                    "w-8 h-8 fill-current drop-shadow-md transition-colors",
                    i < playerLives ? "text-red-500 stroke-red-700" : "text-slate-700 stroke-slate-600"
                  )}
                  strokeWidth={2.5}
                />
              </motion.div>
            ))}
          </div>
          <div className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-xl shadow-[0_4px_0_rgb(30,58,138)] border-2 border-blue-400 max-w-[160px] truncate transform -skew-x-6">
            <span className="drop-shadow-md">{username.toUpperCase()}: {playerScore}</span>
          </div>
        </div>
        {/* Center Area: Pause & Online Status */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 pointer-events-auto flex flex-col items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-lg"
                onClick={togglePause}
            >
                <Pause className="w-6 h-6 fill-current" />
            </Button>
            {/* Online Indicator */}
            {gameMode === 'multiplayer' && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border shadow-lg transition-colors duration-500 cursor-help",
                            connectionType === 'p2p' ? "bg-green-900/60 border-green-500/30" : "bg-yellow-900/60 border-yellow-500/30"
                        )}>
                            {connectionType === 'p2p' ? (
                                <Zap className="w-3 h-3 text-green-400 fill-current" />
                            ) : (
                                <Wifi className="w-3 h-3 text-yellow-400" />
                            )}
                            <span className={cn(
                                "text-[10px] font-bold tracking-widest",
                                connectionType === 'p2p' ? "text-green-400" : "text-yellow-400"
                            )}>
                                {connectionType === 'p2p' ? 'P2P' : 'RELAY'}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-slate-900 border-slate-700 text-white text-xs">
                        <p>{connectionType === 'p2p' ? "Direct connection. Low latency." : "Routed via server. Higher latency possible."}</p>
                    </TooltipContent>
                </Tooltip>
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
                    "w-8 h-8 fill-current drop-shadow-md transition-colors",
                    i < botLives ? "text-red-500 stroke-red-700" : "text-slate-700 stroke-slate-600"
                  )}
                  strokeWidth={2.5}
                />
              </motion.div>
            ))}
          </div>
          <div className="bg-red-600 text-white px-4 py-1.5 rounded-xl font-black text-xl shadow-[0_4px_0_rgb(153,27,27)] border-2 border-red-400 transform -skew-x-6">
            <span className="drop-shadow-md">{gameMode === 'multiplayer' ? 'ENEMY' : 'BOT'}: {botScore}</span>
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
                <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] stroke-black tracking-tighter italic">
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
                <h2 className="text-9xl font-black text-yellow-400 drop-shadow-[0_10px_0_rgba(161,98,7,1)] stroke-black tracking-tighter">
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
                <h2 className="text-9xl font-black text-green-400 drop-shadow-[0_10px_0_rgba(21,128,61,1)] stroke-black tracking-tighter italic">
                    GO!
                </h2>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}