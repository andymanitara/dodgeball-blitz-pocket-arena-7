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
  rematchRequested: boolean;
  opponentRematchRequested: boolean;
  setRole: (role: MultiplayerRole) => void;
  setStatus: (status: ConnectionStatus) => void;
  setPeerId: (id: string) => void;
  setOpponentId: (id: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setIsQueuing: (isQueuing: boolean) => void;
  setQueueCount: (count: number) => void;
  setRematchRequested: (requested: boolean) => void;
  setOpponentRematchRequested: (requested: boolean) => void;
  joinQueue: (peerId: string) => Promise<boolean>;
  leaveQueue: (peerId: string) => Promise<void>;
  fetchQueueCount: () => Promise<void>;
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
  rematchRequested: false,
  opponentRematchRequested: false,
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setPeerId: (peerId) => set({ peerId }),
  setOpponentId: (opponentId) => set({ opponentId }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setIsQueuing: (isQueuing) => set({ isQueuing }),
  setQueueCount: (queueCount) => set({ queueCount }),
  setRematchRequested: (rematchRequested) => set({ rematchRequested }),
  setOpponentRematchRequested: (opponentRematchRequested) => set({ opponentRematchRequested }),
  joinQueue: async (peerId) => {
    set({ isQueuing: true, error: null });
    try {
      const res = await fetch('/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId }),
      });
      if (!res.ok) throw new Error('Failed to join queue');
      const data = await res.json();
      if (data.match) {
        set({ opponentId: data.opponentId, isQueuing: false, status: 'connecting' });
        return true;
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message, isQueuing: false });
      return false;
    }
  },
  leaveQueue: async (peerId) => {
    try {
      const res = await fetch('/api/queue/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId }),
      });
      if (!res.ok) throw new Error('Failed to leave queue');
      set({ isQueuing: false });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
  fetchQueueCount: async () => {
    try {
      const res = await fetch('/api/queue/count');
      if (!res.ok) throw new Error('Failed to fetch queue count');
      const data = await res.json();
      set({ queueCount: data.count });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
  reset: () => set({
    role: null,
    status: 'disconnected',
    peerId: null,
    opponentId: null,
    error: null,
    isQueuing: false,
    queueCount: 0,
    rematchRequested: false,
    opponentRematchRequested: false
  }),
}));