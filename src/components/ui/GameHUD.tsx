import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
export function GameHUD() {
  const playerLives = useGameStore(s => s.playerLives);
  const botLives = useGameStore(s => s.botLives);
  const playerScore = useGameStore(s => s.playerScore);
  const botScore = useGameStore(s => s.botScore);
  const currentRound = useGameStore(s => s.currentRound);
  const phase = useGameStore(s => s.phase);
  const [showRoundStart, setShowRoundStart] = useState(false);
  useEffect(() => {
    if (phase === 'playing') {
        setShowRoundStart(true);
        const timer = setTimeout(() => setShowRoundStart(false), 2000);
        return () => clearTimeout(timer);
    }
  }, [phase, currentRound]);
  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-start pt-2 px-2">
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
          <div className="bg-blue-600/90 backdrop-blur text-white px-4 py-1 rounded-full font-black text-lg shadow-lg self-start border-2 border-blue-400">
            YOU: {playerScore}
          </div>
        </div>
        {/* Bot Stats (Right) */}
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
            BOT: {botScore}
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
                className="absolute inset-0 flex items-center justify-center z-50"
            >
                <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] stroke-black tracking-tighter italic">
                    ROUND {currentRound}
                </h2>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}