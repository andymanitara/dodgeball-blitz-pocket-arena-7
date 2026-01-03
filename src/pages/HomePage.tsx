import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Scene } from '@/components/game/Scene';
import { TouchControls } from '@/components/ui/TouchControls';
import { GameHUD } from '@/components/ui/GameHUD';
import { Button } from '@/components/ui/button';
import { Trophy, Skull } from 'lucide-react';
export function HomePage() {
  const phase = useGameStore(s => s.phase);
  const startGame = useGameStore(s => s.startGame);
  const resetMatch = useGameStore(s => s.resetMatch);
  const winner = useGameStore(s => s.winner);
  const playerScore = useGameStore(s => s.playerScore);
  const botScore = useGameStore(s => s.botScore);
  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden touch-none">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>
      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Main Menu Overlay */}
        {phase === 'menu' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto p-6 text-center">
            <h1 className="text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
              DODGEBALL<br/><span className="text-blue-500">BLITZ</span>
            </h1>
            <p className="text-slate-300 mb-8 text-lg max-w-xs">
              Swipe to move. Tap to throw. Be the last one standing!
            </p>
            <Button 
              size="lg" 
              className="text-2xl px-12 py-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 hover:scale-105 transition-transform shadow-xl border-4 border-white/20"
              onClick={startGame}
            >
              PLAY NOW
            </Button>
          </div>
        )}
        {/* In-Game UI */}
        {phase === 'playing' && (
          <>
            <GameHUD />
            <TouchControls />
          </>
        )}
        {/* Round/Match Over Overlay */}
        {(phase === 'round_over' || phase === 'match_over') && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto animate-in fade-in zoom-in duration-300">
            {phase === 'match_over' ? (
              <div className="text-center">
                {winner === 'player' ? (
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
                ) : (
                  <Skull className="w-24 h-24 text-red-500 mx-auto mb-4" />
                )}
                <h2 className="text-5xl font-black text-white mb-2">
                  {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
                </h2>
                <p className="text-2xl text-slate-300 mb-8">
                  {playerScore} - {botScore}
                </p>
                <Button onClick={resetMatch} size="lg" className="bg-white text-black hover:bg-slate-200">
                  Main Menu
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">ROUND OVER</h2>
                <p className="text-xl text-slate-300 mb-8">
                  Next round starting...
                </p>
                <Button onClick={startGame} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Next Round
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}