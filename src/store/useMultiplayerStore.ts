import { create } from 'zustand';
export type MultiplayerRole = 'host' | 'client' | null;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
interface MultiplayerState {
  role: MultiplayerRole;
  status: ConnectionStatus;
  peerId: string | null;
  opponentId: string | null;
  error: string | null;
  isQueuing: boolean;
  queueCount: number;
  setRole: (role: MultiplayerRole) => void;
  setStatus: (status: ConnectionStatus) => void;
  setPeerId: (id: string) => void;
  setOpponentId: (id: string) => void;
  setError: (error: string | null) => void;
  setIsQueuing: (isQueuing: boolean) => void;
  setQueueCount: (count: number) => void;
  reset: () => void;
}
export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  role: null,
  status: 'disconnected',
  peerId: null,
  opponentId: null,
  error: null,
  isQueuing: false,
  queueCount: 0,
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setPeerId: (peerId) => set({ peerId }),
  setOpponentId: (opponentId) => set({ opponentId }),
  setError: (error) => set({ error }),
  setIsQueuing: (isQueuing) => set({ isQueuing }),
  setQueueCount: (queueCount) => set({ queueCount }),
  reset: () => set({
    role: null,
    status: 'disconnected',
    peerId: null,
    opponentId: null,
    error: null,
    isQueuing: false,
    queueCount: 0
  }),
}));