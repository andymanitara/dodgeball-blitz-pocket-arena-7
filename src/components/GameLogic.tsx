import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { musicSystem } from '@/lib/musicSystem';
export function GameLogic() {
  const phase = useGameStore(s => s.phase);
  const winner = useGameStore(s => s.winner);
  const settings = useGameStore(s => s.settings);
  const recordMatch = useUserStore(s => s.recordMatch);
  // Ref to ensure we only record the match once per completion
  const hasRecordedRef = useRef(false);
  // Match Recording Logic
  useEffect(() => {
    if (phase === 'match_over') {
      if (!hasRecordedRef.current && winner) {
        const result = winner === 'player' ? 'win' : 'loss';
        recordMatch(result);
        hasRecordedRef.current = true;
      }
    } else {
      hasRecordedRef.current = false;
    }
  }, [phase, winner, recordMatch]);
  // Music System Initialization & Control
  useEffect(() => {
    // Function to handle initialization on user interaction
    const handleInteraction = async () => {
      try {
        await musicSystem.init();
        // Once initialized, check settings to start
        if (useGameStore.getState().settings.music) {
          musicSystem.start();
        }
      } catch (e) {
        console.error("Music init error", e);
      }
    };
    // Add listeners for the first interaction to unlock AudioContext
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      musicSystem.stop();
    };
  }, []);
  // React to Settings Change
  useEffect(() => {
    if (settings.music) {
      musicSystem.start();
    } else {
      musicSystem.stop();
    }
  }, [settings.music]);
  return null;
}