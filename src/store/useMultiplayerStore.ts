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
  targetCode: string | null;
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
  hostGame: () => void;
  joinGame: (code: string) => void;
  reset: () => void;
}
export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  role: null,
  status: 'disconnected',
  peerId: null,
  opponentId: null,
  error: null,
  gameCode: null,
  targetCode: null,
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
  hostGame: () => {
    // Generate 6-char alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    set({
        role: 'host',
        gameCode: code,
        status: 'disconnected', // Will become 'connecting' when Peer initializes
        error: null
    });
  },
  joinGame: (code) => {
    set({
        role: 'client',
        targetCode: code,
        status: 'connecting',
        error: null
    });
  },
  reset: () => set({
    role: null,
    status: 'disconnected',
    peerId: null,
    opponentId: null,
    error: null,
    gameCode: null,
    targetCode: null,
    rematchRequested: false,
    opponentRematchRequested: false
  }),
}));