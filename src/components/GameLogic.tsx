import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
export function GameLogic() {
  const phase = useGameStore(s => s.phase);
  const winner = useGameStore(s => s.winner);
  const recordMatch = useUserStore(s => s.recordMatch);
  // Ref to ensure we only record the match once per completion
  const hasRecordedRef = useRef(false);
  useEffect(() => {
    // When match is over, record the result
    if (phase === 'match_over') {
      if (!hasRecordedRef.current && winner) {
        const result = winner === 'player' ? 'win' : 'loss';
        recordMatch(result);
        hasRecordedRef.current = true;
      }
    } else {
      // Reset the flag when we leave the match_over state (e.g. restart or menu)
      hasRecordedRef.current = false;
    }
  }, [phase, winner, recordMatch]);
  // This component renders nothing, it's just a logic controller
  return null;
}