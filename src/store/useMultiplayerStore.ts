import { create } from 'zustand';
export type MultiplayerRole = 'host' | 'client' | null;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
interface MultiplayerState {
  role: MultiplayerRole;
  status: ConnectionStatus;
  peerId: string | null;
  opponentId: string | null;
  error: string | null;
  gameCode: string | null;
  isQueuing: boolean;
  rematchRequested: boolean;
  opponentRematchRequested: boolean;
  setRole: (role: MultiplayerRole) => void;
  setStatus: (status: ConnectionStatus) => void;
  setPeerId: (id: string) => void;
  setOpponentId: (id: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setRematchRequested: (requested: boolean) => void;
  setOpponentRematchRequested: (requested: boolean) => void;
  joinQueue: () => void;
  leaveQueue: () => void;
  setGameCode: (code: string) => void;
  reset: () => void;
}
export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  role: null,
  status: 'disconnected',
  peerId: null,
  opponentId: null,
  error: null,
  gameCode: null,
  isQueuing: false,
  rematchRequested: false,
  opponentRematchRequested: false,
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setPeerId: (peerId) => set({ peerId }),
  setOpponentId: (opponentId) => set({ opponentId }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setRematchRequested: (rematchRequested) => set({ rematchRequested }),
  setOpponentRematchRequested: (opponentRematchRequested) => set({ opponentRematchRequested }),
  joinQueue: () => set({ isQueuing: true, error: null, status: 'connecting' }),
  leaveQueue: () => set({ isQueuing: false, status: 'disconnected' }),
  setGameCode: (gameCode) => set({ gameCode }),
  reset: () => set({
    role: null,
    status: 'disconnected',
    peerId: null,
    opponentId: null,
    error: null,
    gameCode: null,
    isQueuing: false,
    rematchRequested: false,
    opponentRematchRequested: false
  }),
}));