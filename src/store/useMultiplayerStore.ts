import { create } from 'zustand';
export type MultiplayerRole = 'host' | 'client' | null;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionType = 'p2p' | 'relay' | 'none';
interface MultiplayerState {
  role: MultiplayerRole;
  status: ConnectionStatus;
  connectionType: ConnectionType;
  peerId: string | null;
  opponentId: string | null;
  error: string | null;
  gameCode: string | null;
  isQueuing: boolean;
  isMultiplayerActive: boolean; // Controls WebSocket persistence
  rematchRequested: boolean;
  opponentRematchRequested: boolean;
  setRole: (role: MultiplayerRole) => void;
  setStatus: (status: ConnectionStatus) => void;
  setConnectionType: (type: ConnectionType) => void;
  setPeerId: (id: string) => void;
  setOpponentId: (id: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setRematchRequested: (requested: boolean) => void;
  setOpponentRematchRequested: (requested: boolean) => void;
  joinQueue: () => void;
  leaveQueue: () => void;
  onMatchFound: (role: MultiplayerRole, code: string) => void;
  setGameCode: (code: string) => void;
  reset: () => void;
}
export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  role: null,
  status: 'disconnected',
  connectionType: 'none',
  peerId: null,
  opponentId: null,
  error: null,
  gameCode: null,
  isQueuing: false,
  isMultiplayerActive: false,
  rematchRequested: false,
  opponentRematchRequested: false,
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setConnectionType: (connectionType) => set({ connectionType }),
  setPeerId: (peerId) => set({ peerId }),
  setOpponentId: (opponentId) => set({ opponentId }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setRematchRequested: (rematchRequested) => set({ rematchRequested }),
  setOpponentRematchRequested: (opponentRematchRequested) => set({ opponentRematchRequested }),
  joinQueue: () => set({ 
    isQueuing: true, 
    isMultiplayerActive: true, // Keep socket open
    error: null, 
    status: 'connecting',
    connectionType: 'none'
  }),
  leaveQueue: () => set({ 
    isQueuing: false, 
    isMultiplayerActive: false, // Close socket
    status: 'disconnected' 
  }),
  onMatchFound: (role, code) => set({
    isQueuing: false,
    // isMultiplayerActive stays true to keep Relay socket open
    role,
    gameCode: code,
    status: 'connected',
    connectionType: 'relay' // Start with Relay
  }),
  setGameCode: (gameCode) => set({ gameCode }),
  reset: () => set({
    role: null,
    status: 'disconnected',
    connectionType: 'none',
    peerId: null,
    opponentId: null,
    error: null,
    gameCode: null,
    isQueuing: false,
    isMultiplayerActive: false,
    rematchRequested: false,
    opponentRematchRequested: false
  }),
}));