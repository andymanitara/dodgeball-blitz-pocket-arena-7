import { create } from 'zustand';
export type MultiplayerRole = 'host' | 'client' | null;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
interface MultiplayerState {
  role: MultiplayerRole;
  status: ConnectionStatus;
  peerId: string | null;
  opponentId: string | null;
  error: string | null;
  setRole: (role: MultiplayerRole) => void;
  setStatus: (status: ConnectionStatus) => void;
  setPeerId: (id: string) => void;
  setOpponentId: (id: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  role: null,
  status: 'disconnected',
  peerId: null,
  opponentId: null,
  error: null,
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setPeerId: (peerId) => set({ peerId }),
  setOpponentId: (opponentId) => set({ opponentId }),
  setError: (error) => set({ error }),
  reset: () => set({
    role: null,
    status: 'disconnected',
    peerId: null,
    opponentId: null,
    error: null
  }),
}));