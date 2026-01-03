import { create } from 'zustand';
export type GamePhase = 'menu' | 'playing' | 'round_over' | 'match_over';
export type GameMode = 'single' | 'multiplayer';
export interface GameState {
  phase: GamePhase;
  gameMode: GameMode;
  isPaused: boolean;
  playerScore: number;
  botScore: number;
  playerLives: number;
  botLives: number;
  winner: 'player' | 'bot' | null;
  shakeIntensity: number;
  currentRound: number;
  timeScale: number;
  countdown: number;
  settings: {
    sound: boolean;
    music: boolean;
    vibration: boolean;
  };
  // Actions
  setPhase: (phase: GamePhase) => void;
  startGame: (mode?: GameMode) => void;
  startNextRound: () => void;
  resetMatch: () => void;
  decrementPlayerLives: () => void;
  decrementBotLives: () => void;
  winRound: (winner: 'player' | 'bot') => void;
  addShake: (amount: number) => void;
  decayShake: () => void;
  toggleSetting: (setting: keyof GameState['settings']) => void;
  setTimeScale: (scale: number) => void;
  setCountdown: (val: number) => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
}
// Mutable input state for high-frequency updates without re-renders
export const gameInput = {
  joystick: { x: 0, y: 0 }, // Normalized -1 to 1
  isThrowing: false,
  isDodging: false,
};
export interface GameEvent {
  id: number;
  type: 'hit' | 'catch' | 'throw' | 'pickup';
  x: number;
  z: number;
  text?: string;
  time: number;
}
// Mutable physics state for the engine to write to and React to read from via refs
export const physicsState = {
  player: { x: 0, z: 6, rotation: 0, isHit: false, cooldown: 0, holdingBallId: null as number | null },
  bot: { x: 0, z: -6, rotation: 0, isHit: false, cooldown: 0, holdingBallId: null as number | null },
  balls: [] as Array<{
    id: number;
    x: number;
    y: number;
    z: number;
    state: 'idle' | 'held' | 'flying';
    owner: 'player' | 'bot' | null;
    isLethal: boolean;
  }>,
  events: [] as GameEvent[],
};
export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  gameMode: 'single',
  isPaused: false,
  playerScore: 0,
  botScore: 0,
  playerLives: 3,
  botLives: 3,
  winner: null,
  shakeIntensity: 0,
  currentRound: 1,
  timeScale: 1.0,
  countdown: 0,
  settings: {
    sound: true,
    music: true,
    vibration: true,
  },
  setPhase: (phase) => set({ phase }),
  startGame: (mode = 'single') => set({
    phase: 'playing',
    gameMode: mode,
    isPaused: false,
    playerLives: 3,
    botLives: 3,
    playerScore: 0,
    botScore: 0,
    currentRound: 1,
    winner: null,
    shakeIntensity: 0,
    timeScale: 1.0,
    countdown: 3,
  }),
  startNextRound: () => set((state) => ({
    phase: 'playing',
    isPaused: false,
    playerLives: 3,
    botLives: 3,
    currentRound: state.currentRound + 1,
    shakeIntensity: 0,
    timeScale: 1.0,
    countdown: 3,
  })),
  resetMatch: () => set({
    phase: 'menu',
    gameMode: 'single', // Reset to single player
    isPaused: false,
    playerScore: 0,
    botScore: 0,
    playerLives: 3,
    botLives: 3,
    winner: null,
    currentRound: 1,
    shakeIntensity: 0,
    timeScale: 1.0,
    countdown: 0,
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
      timeScale: 1.0,
    };
  }),
  addShake: (amount) => set((state) => ({
    shakeIntensity: Math.min(state.shakeIntensity + amount, 2.0)
  })),
  decayShake: () => set((state) => {
    const newIntensity = state.shakeIntensity * 0.9;
    return { shakeIntensity: newIntensity < 0.01 ? 0 : newIntensity };
  }),
  toggleSetting: (setting) => set((state) => ({
    settings: {
      ...state.settings,
      [setting]: !state.settings[setting]
    }
  })),
  setTimeScale: (scale) => set({ timeScale: scale }),
  setCountdown: (val) => set({ countdown: val }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setPaused: (paused) => set({ isPaused: paused }),
}));