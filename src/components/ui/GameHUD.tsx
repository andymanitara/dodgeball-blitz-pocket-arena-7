import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
export function GameHUD() {
  const playerLives = useGameStore(s => s.playerLives);
  const botLives = useGameStore(s => s.botLives);
  const playerScore = useGameStore(s => s.playerScore);
  const botScore = useGameStore(s => s.botScore);
  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Player Stats (Left) */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart 
                key={`p-life-${i}`} 
                className={cn(
                  "w-8 h-8 fill-current transition-colors",
                  i < playerLives ? "text-red-500" : "text-gray-600"
                )} 
              />
            ))}
          </div>
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-sm self-start">
            YOU: {playerScore}
          </div>
        </div>
        {/* Bot Stats (Right) */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart 
                key={`b-life-${i}`} 
                className={cn(
                  "w-8 h-8 fill-current transition-colors",
                  i < botLives ? "text-red-500" : "text-gray-600"
                )} 
              />
            ))}
          </div>
          <div className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm self-end">
            BOT: {botScore}
          </div>
        </div>
      </div>
    </div>
  );
}