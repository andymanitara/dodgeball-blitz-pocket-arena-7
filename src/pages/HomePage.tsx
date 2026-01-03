import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Scene } from '@/components/game/Scene';
import { TouchControls } from '@/components/ui/TouchControls';
import { GameHUD } from '@/components/ui/GameHUD';
import { Button } from '@/components/ui/button';
import { Trophy, Skull, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function HomePage() {
  const phase = useGameStore(s => s.phase);
  const startGame = useGameStore(s => s.startGame);
  const startNextRound = useGameStore(s => s.startNextRound);
  const resetMatch = useGameStore(s => s.resetMatch);
  const winner = useGameStore(s => s.winner);
  const playerScore = useGameStore(s => s.playerScore);
  const botScore = useGameStore(s => s.botScore);
  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden touch-none select-none">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>
      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* In-Game UI */}
        <GameHUD />
        {phase === 'playing' && <TouchControls />}
        {/* Main Menu Overlay */}
        <AnimatePresence>
          {phase === 'menu' && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto p-6 text-center"
            >
              <motion.div 
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="mb-12"
              >
                  <h1 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl italic">
                    DODGEBALL<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">BLITZ</span>
                  </h1>
                  <p className="text-slate-300 text-xl font-medium">Pocket Arena</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                  <Button
                    size="lg"
                    className="text-2xl px-12 py-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(37,99,235,0.5)] border-4 border-white/20"
                    onClick={startGame}
                  >
                    <Play className="mr-2 w-8 h-8 fill-current" /> PLAY NOW
                  </Button>
              </motion.div>
              <div className="mt-8 text-slate-400 text-sm max-w-xs">
                <p>Drag left to move • Tap buttons to throw & dodge</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Round/Match Over Overlay */}
        <AnimatePresence>
          {(phase === 'round_over' || phase === 'match_over') && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto p-6"
            >
              {phase === 'match_over' ? (
                <div className="text-center">
                  {winner === 'player' ? (
                    <motion.div 
                        animate={{ rotate: [0, -10, 10, 0] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6 drop-shadow-glow" />
                    </motion.div>
                  ) : (
                    <Skull className="w-32 h-32 text-red-500 mx-auto mb-6" />
                  )}
                  <h2 className="text-6xl font-black text-white mb-2 italic">
                    {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
                  </h2>
                  <div className="text-4xl font-bold text-slate-300 mb-12 bg-white/10 px-8 py-4 rounded-2xl">
                    <span className="text-blue-400">{playerScore}</span> - <span className="text-red-400">{botScore}</span>
                  </div>
                  <Button onClick={resetMatch} size="lg" className="bg-white text-black hover:bg-slate-200 text-xl px-8 py-6 rounded-xl">
                    <RotateCcw className="mr-2" /> Main Menu
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-5xl font-bold text-white mb-4">ROUND OVER</h2>
                  <p className="text-xl text-slate-300 mb-8">
                    {playerScore > botScore ? "You're leading!" : "Bot is leading!"}
                  </p>
                  <Button onClick={startNextRound} size="lg" className="bg-blue-600 hover:bg-blue-700 text-xl px-10 py-6 rounded-full shadow-lg shadow-blue-900/50">
                    Next Round
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}