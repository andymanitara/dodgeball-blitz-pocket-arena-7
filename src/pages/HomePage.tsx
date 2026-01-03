import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
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
import { Trophy, Skull, Play, RotateCcw, HelpCircle, Settings, Pause, LogOut, User, Medal, Globe, RefreshCw, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { physicsEngine } from '@/lib/physicsEngine';
import { Card } from '@/components/ui/card';
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
  const gameMode = useGameStore(s => s.gameMode);
  const isAuthenticated = useUserStore(s => s.isAuthenticated);
  const username = useUserStore(s => s.username);
  const stats = useUserStore(s => s.stats);
  const logout = useUserStore(s => s.logout);
  const rematchRequested = useMultiplayerStore(s => s.rematchRequested);
  const opponentRematchRequested = useMultiplayerStore(s => s.opponentRematchRequested);
  const setRematchRequested = useMultiplayerStore(s => s.setRematchRequested);
  const [activeModal, setActiveModal] = useState<'none' | 'howto' | 'settings' | 'multiplayer'>('none');
  const handleSinglePlayer = () => {
    physicsEngine.setMode('single');
    startGame('single');
  };
  const handleRematch = () => {
    setRematchRequested(true);
  };
  // If not authenticated, show Profile Creation only
  if (!isAuthenticated) {
    return <ProfileCreation />;
  }
  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-900 overflow-hidden touch-none select-none font-sans">
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
                className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto p-4"
            >
              <Card className="bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] p-8 w-full max-w-md flex flex-col items-center relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8 text-center relative z-10"
                >
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 tracking-tighter drop-shadow-2xl italic leading-tight">
                      DODGEBALL<br/>
                      <span className="text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">BLITZ</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="h-[2px] w-8 bg-blue-500/50 rounded-full" />
                        <p className="text-blue-200/80 text-lg font-bold tracking-widest uppercase">Pocket Arena</p>
                        <div className="h-[2px] w-8 bg-blue-500/50 rounded-full" />
                    </div>
                </motion.div>
                {/* User Profile & Stats */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8 w-full"
                >
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl tracking-wide">{username}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-2">
                            <Trophy className="w-4 h-4 text-yellow-400 mb-1" />
                            <span className="text-xs text-slate-400 font-bold uppercase">Wins</span>
                            <span className="text-white font-bold">{stats.wins}</span>
                        </div>
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-2">
                            <Skull className="w-4 h-4 text-red-400 mb-1" />
                            <span className="text-xs text-slate-400 font-bold uppercase">Losses</span>
                            <span className="text-white font-bold">{stats.losses}</span>
                        </div>
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-2">
                            <Medal className="w-4 h-4 text-blue-400 mb-1" />
                            <span className="text-xs text-slate-400 font-bold uppercase">Matches</span>
                            <span className="text-white font-bold">{stats.matches}</span>
                        </div>
                    </div>
                  </div>
                </motion.div>
                {/* Main Actions */}
                <div className="flex flex-col gap-4 w-full mb-8 relative z-10">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                          size="lg"
                          className="w-full h-20 text-2xl font-black italic rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_8px_0_rgb(30,58,138),0_15px_20px_rgba(0,0,0,0.4)] border-t border-white/20 active:shadow-none active:translate-y-[8px] transition-all"
                          onClick={handleSinglePlayer}
                      >
                          <div className="flex items-center gap-3">
                              <Play className="w-8 h-8 fill-current" />
                              <span>SOLO PLAY</span>
                          </div>
                      </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                          size="lg"
                          className="w-full h-16 text-xl font-bold rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 shadow-[0_4px_0_rgb(15,23,42),0_10px_15px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[4px] transition-all relative overflow-hidden group"
                          onClick={() => setActiveModal('multiplayer')}
                      >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
                          <div className="flex items-center gap-3 relative z-10">
                              <Globe className="w-6 h-6 text-green-400" />
                              <span>PLAY ONLINE</span>
                              <div className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 animate-pulse">
                                LIVE
                              </div>
                          </div>
                      </Button>
                  </motion.div>
                </div>
                {/* Secondary Actions */}
                <div className="flex gap-4 relative z-10">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                          variant="secondary"
                          size="icon"
                          className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 shadow-lg"
                          onClick={() => setActiveModal('howto')}
                          title="How to Play"
                      >
                          <HelpCircle className="w-6 h-6 text-slate-300" />
                      </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                          variant="secondary"
                          size="icon"
                          className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 shadow-lg"
                          onClick={() => setActiveModal('settings')}
                          title="Settings"
                      >
                          <Settings className="w-6 h-6 text-slate-300" />
                      </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                          variant="secondary"
                          size="icon"
                          className="w-12 h-12 rounded-full bg-red-950/50 border border-red-900 hover:bg-red-900 shadow-lg"
                          onClick={logout}
                          title="Logout"
                      >
                          <LogOut className="w-5 h-5 text-red-400" />
                      </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pause Menu Overlay */}
        <AnimatePresence>
            {phase === 'playing' && isPaused && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center pointer-events-auto z-50 p-4"
                >
                    <Card className="bg-slate-900/90 border border-slate-700 p-8 rounded-[2rem] shadow-2xl text-center max-w-sm w-full">
                        <h2 className="text-4xl font-black text-white mb-8 tracking-widest italic drop-shadow-lg">PAUSED</h2>
                        <div className="space-y-4">
                            <Button
                                onClick={togglePause}
                                className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-[4px] transition-all"
                            >
                                <Play className="mr-2 w-6 h-6 fill-current" /> RESUME
                            </Button>
                            <Button
                                onClick={() => setActiveModal('settings')}
                                variant="secondary"
                                className="w-full h-14 text-lg font-bold bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600"
                            >
                                <Settings className="mr-2 w-5 h-5" /> SETTINGS
                            </Button>
                            <Button
                                onClick={resetMatch}
                                variant="destructive"
                                className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-500 rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[4px] transition-all"
                            >
                                <LogOut className="mr-2 w-5 h-5" /> QUIT TO MENU
                            </Button>
                        </div>
                    </Card>
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
                <div className="text-center w-full max-w-md">
                  {winner === 'player' ? (
                    <motion.div
                        animate={{
                            rotate: [0, -10, 10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-yellow-500/30 blur-[50px] rounded-full" />
                        <Trophy className="w-40 h-40 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] relative z-10" />
                    </motion.div>
                  ) : (
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                    >
                        <Skull className="w-32 h-32 text-red-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                    </motion.div>
                  )}
                  <h2 className="text-6xl md:text-7xl font-black text-white mb-2 italic tracking-tighter drop-shadow-xl">
                    {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
                  </h2>
                  <div className="text-5xl font-black text-white mb-10 bg-white/5 border border-white/10 px-10 py-6 rounded-3xl backdrop-blur-sm inline-flex items-center gap-4 shadow-2xl">
                    <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]">{playerScore}</span>
                    <span className="text-slate-500 text-3xl">-</span>
                    <span className="text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]">{botScore}</span>
                  </div>
                  {/* Multiplayer Rematch UI */}
                  {gameMode === 'multiplayer' ? (
                    <div className="space-y-4 w-full">
                        {opponentRematchRequested && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-blue-500/20 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-xl animate-pulse mb-4 font-bold flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4 fill-current" /> Opponent wants a rematch!
                            </motion.div>
                        )}
                        {rematchRequested ? (
                             <Button disabled size="lg" className="w-full h-16 bg-slate-700 text-slate-300 text-xl font-bold rounded-xl border border-slate-600">
                                <Loader2 className="mr-2 animate-spin" /> Waiting for opponent...
                             </Button>
                        ) : (
                            <Button
                                onClick={handleRematch}
                                size="lg"
                                className="w-full h-16 bg-green-600 hover:bg-green-500 text-white text-xl font-black italic rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[4px] transition-all"
                            >
                                <RefreshCw className="mr-2 w-6 h-6" /> REMATCH
                            </Button>
                        )}
                        <Button
                            onClick={resetMatch}
                            variant="secondary"
                            size="lg"
                            className="w-full h-14 bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold rounded-xl border border-slate-600"
                        >
                            <LogOut className="mr-2 w-5 h-5" /> Main Menu
                        </Button>
                    </div>
                  ) : (
                    // Single Player UI
                    <Button
                        onClick={resetMatch}
                        size="lg"
                        className="w-full h-16 bg-white text-black hover:bg-slate-200 text-xl font-black italic rounded-xl shadow-[0_4px_0_rgb(148,163,184)] active:shadow-none active:translate-y-[4px] transition-all"
                    >
                        <RotateCcw className="mr-2 w-6 h-6" /> RETURN TO MENU
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-6xl font-black text-white mb-4 italic tracking-tighter drop-shadow-lg">ROUND OVER</h2>
                  <p className="text-2xl text-blue-200 font-bold mb-10">
                    {playerScore > botScore ? "You're leading!" : (playerScore < botScore ? "Opponent is leading!" : "It's a tie!")}
                  </p>
                  <Button
                    onClick={startNextRound}
                    size="lg"
                    className="h-20 px-12 text-2xl font-black italic bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)] border-4 border-white/20 hover:scale-105 transition-transform"
                  >
                    NEXT ROUND <Play className="ml-2 w-6 h-6 fill-current" />
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