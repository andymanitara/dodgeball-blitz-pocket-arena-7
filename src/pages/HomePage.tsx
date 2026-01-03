import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { Scene } from '@/components/game/Scene';
import { TouchControls } from '@/components/ui/TouchControls';
import { GameHUD } from '@/components/ui/GameHUD';
import { HowToPlayModal } from '@/components/ui/HowToPlayModal';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { ProfileCreation } from '@/components/ui/ProfileCreation';
import { MultiplayerMenu } from '@/components/ui/MultiplayerMenu';
import { MultiplayerManager } from '@/components/MultiplayerManager';
import { GameLogic } from '@/components/GameLogic';
import { Button } from '@/components/ui/button';
import { Trophy, Skull, Play, RotateCcw, HelpCircle, Settings, Pause, LogOut, User, Medal, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { physicsEngine } from '@/lib/physicsEngine';
export function HomePage() {
  const phase = useGameStore(s => s.phase);
  const isPaused = useGameStore(s => s.isPaused);
  const startGame = useGameStore(s => s.startGame);
  const startNextRound = useGameStore(s => s.startNextRound);
  const resetMatch = useGameStore(s => s.resetMatch);
  const togglePause = useGameStore(s => s.togglePause);
  const winner = useGameStore(s => s.winner);
  const playerScore = useGameStore(s => s.playerScore);
  const botScore = useGameStore(s => s.botScore);
  const isAuthenticated = useUserStore(s => s.isAuthenticated);
  const username = useUserStore(s => s.username);
  const stats = useUserStore(s => s.stats);
  const logout = useUserStore(s => s.logout);
  const [activeModal, setActiveModal] = useState<'none' | 'howto' | 'settings' | 'multiplayer'>('none');
  const handleSinglePlayer = () => {
    physicsEngine.setMode('single');
    startGame('single');
  };
  // If not authenticated, show Profile Creation only
  if (!isAuthenticated) {
    return <ProfileCreation />;
  }
  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-900 overflow-hidden touch-none select-none">
      {/* Logic Controllers */}
      <GameLogic />
      <MultiplayerManager />
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>
      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* In-Game UI */}
        <GameHUD />
        {phase === 'playing' && !isPaused && <TouchControls />}
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
                className="mb-6"
              >
                  <h1 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl italic">
                    DODGEBALL<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">BLITZ</span>
                  </h1>
                  <p className="text-slate-300 text-xl font-medium">Pocket Arena</p>
              </motion.div>
              {/* User Profile & Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8 flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2 bg-white/10 px-6 py-2 rounded-full border border-white/10">
                    <User className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-bold text-lg">{username}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-1 text-green-400">
                        <Trophy className="w-4 h-4" />
                        <span>Wins: {stats.wins}</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-500 rounded-full" />
                    <div className="flex items-center gap-1 text-red-400">
                        <Skull className="w-4 h-4" />
                        <span>Losses: {stats.losses}</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-500 rounded-full" />
                    <div className="flex items-center gap-1 text-slate-400">
                        <Medal className="w-4 h-4" />
                        <span>Total: {stats.matches}</span>
                    </div>
                </div>
              </motion.div>
              <div className="flex flex-col gap-4 w-full max-w-xs mb-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        size="lg"
                        className="w-full text-2xl px-8 py-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(37,99,235,0.5)] border-4 border-white/20"
                        onClick={handleSinglePlayer}
                    >
                        <Play className="mr-2 w-8 h-8 fill-current" /> SOLO PLAY
                    </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        size="lg"
                        className="w-full text-xl px-8 py-8 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600"
                        onClick={() => setActiveModal('multiplayer')}
                    >
                        <Globe className="mr-2 w-6 h-6" /> PLAY ONLINE
                    </Button>
                </motion.div>
              </div>
              <div className="flex gap-4">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 hover:bg-slate-700"
                        onClick={() => setActiveModal('howto')}
                    >
                        <HelpCircle className="w-8 h-8 text-slate-300" />
                    </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 hover:bg-slate-700"
                        onClick={() => setActiveModal('settings')}
                    >
                        <Settings className="w-8 h-8 text-slate-300" />
                    </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-14 h-14 rounded-full bg-red-900/50 border-2 border-red-800 hover:bg-red-900"
                        onClick={logout}
                        title="Logout"
                    >
                        <LogOut className="w-6 h-6 text-red-300" />
                    </Button>
                </motion.div>
              </div>
              <div className="mt-8 text-slate-400 text-sm max-w-xs">
                <p>Drag left to move • Tap buttons to throw & dodge</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pause Menu Overlay */}
        <AnimatePresence>
            {phase === 'playing' && isPaused && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center pointer-events-auto z-50"
                >
                    <div className="bg-slate-900/90 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4">
                        <h2 className="text-4xl font-black text-white mb-8 tracking-widest">PAUSED</h2>
                        <div className="space-y-4">
                            <Button
                                onClick={togglePause}
                                className="w-full text-xl py-6 bg-blue-600 hover:bg-blue-500 rounded-xl"
                            >
                                <Play className="mr-2 w-5 h-5 fill-current" /> RESUME
                            </Button>
                            <Button
                                onClick={() => setActiveModal('settings')}
                                variant="secondary"
                                className="w-full text-xl py-6 bg-slate-800 hover:bg-slate-700 rounded-xl"
                            >
                                <Settings className="mr-2 w-5 h-5" /> SETTINGS
                            </Button>
                            <Button
                                onClick={resetMatch}
                                variant="destructive"
                                className="w-full text-xl py-6 bg-red-600 hover:bg-red-500 rounded-xl"
                            >
                                <LogOut className="mr-2 w-5 h-5" /> QUIT TO MENU
                            </Button>
                        </div>
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
        {/* Modals */}
        <AnimatePresence>
            {activeModal === 'howto' && <HowToPlayModal onClose={() => setActiveModal('none')} />}
            {activeModal === 'settings' && <SettingsModal onClose={() => setActiveModal('none')} />}
            {activeModal === 'multiplayer' && <MultiplayerMenu onClose={() => setActiveModal('none')} />}
        </AnimatePresence>
      </div>
    </div>
  );
}