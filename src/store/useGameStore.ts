import { create } from 'zustand';
export type GamePhase = 'menu' | 'playing' | 'round_over' | 'match_over';
export interface GameState {
  phase: GamePhase;
  playerScore: number;
  botScore: number;
  playerLives: number;
  botLives: number;
  winner: 'player' | 'bot' | null;
  // Actions
  setPhase: (phase: GamePhase) => void;
  startGame: () => void;
  resetMatch: () => void;
  decrementPlayerLives: () => void;
  decrementBotLives: () => void;
  winRound: (winner: 'player' | 'bot') => void;
}
// Mutable input state for high-frequency updates without re-renders
export const gameInput = {
  joystick: { x: 0, y: 0 }, // Normalized -1 to 1
  isThrowing: false,
  isDodging: false,
};
// Mutable physics state for the engine to write to and React to read from via refs
// This avoids storing 60fps position data in Zustand
export const physicsState = {
  player: { x: 0, z: 6, rotation: 0, isHit: false },
  bot: { x: 0, z: -6, rotation: 0, isHit: false },
  balls: [] as Array<{ id: number; x: number; y: number; z: number; state: 'idle' | 'held' | 'flying' }>,
  events: [] as Array<{ type: 'hit' | 'catch' | 'throw'; x: number; z: number }>, // For particle effects
};
export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  playerScore: 0,
  botScore: 0,
  playerLives: 3,
  botLives: 3,
  winner: null,
  setPhase: (phase) => set({ phase }),
  startGame: () => set({ 
    phase: 'playing', 
    playerLives: 3, 
    botLives: 3,
    // Keep scores if it's a new round, but for MVP startGame might be full reset
  }),
  resetMatch: () => set({
    phase: 'menu',
    playerScore: 0,
    botScore: 0,
    playerLives: 3,
    botLives: 3,
    winner: null,
  }),
  decrementPlayerLives: () => set((state) => {
    const newLives = Math.max(0, state.playerLives - 1);
    return { playerLives: newLives };
  }),
  decrementBotLives: () => set((state) => {
    const newLives = Math.max(0, state.botLives - 1);
    return { botLives: newLives };
  }),
  winRound: (winner) => set((state) => {
    const newPlayerScore = winner === 'player' ? state.playerScore + 1 : state.playerScore;
    const newBotScore = winner === 'bot' ? state.botScore + 1 : state.botScore;
    // Check match win condition (Best of 3)
    let matchWinner: 'player' | 'bot' | null = null;
    if (newPlayerScore >= 2) matchWinner = 'player';
    if (newBotScore >= 2) matchWinner = 'bot';
    return {
      playerScore: newPlayerScore,
      botScore: newBotScore,
      phase: matchWinner ? 'match_over' : 'round_over',
      winner: matchWinner,
    };
  }),
}));