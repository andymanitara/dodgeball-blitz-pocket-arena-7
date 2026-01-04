import React, { useEffect, useRef, useCallback, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useMultiplayerStore, MultiplayerRole } from '@/store/useMultiplayerStore';
import { useGameStore, gameInput } from '@/store/useGameStore';
import { physicsEngine } from '@/lib/physicsEngine';
import { toast } from 'sonner';
const ID_PREFIX = 'db-blitz-';
export function MultiplayerManager() {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const queueWsRef = useRef<WebSocket | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // Store Selectors
  const role = useMultiplayerStore(s => s.role);
  const gameCode = useMultiplayerStore(s => s.gameCode);
  const isMultiplayerActive = useMultiplayerStore(s => s.isMultiplayerActive);
  const rematchRequested = useMultiplayerStore(s => s.rematchRequested);
  const opponentRematchRequested = useMultiplayerStore(s => s.opponentRematchRequested);
  const phase = useGameStore(s => s.phase);
  // Actions
  const setPeerId = useMultiplayerStore(s => s.setPeerId);
  const setStatus = useMultiplayerStore(s => s.setStatus);
  const setError = useMultiplayerStore(s => s.setError);
  const setOpponentId = useMultiplayerStore(s => s.setOpponentId);
  const resetMultiplayer = useMultiplayerStore(s => s.reset);
  const setOpponentRematchRequested = useMultiplayerStore(s => s.setOpponentRematchRequested);
  const setRematchRequested = useMultiplayerStore(s => s.setRematchRequested);
  const onMatchFound = useMultiplayerStore(s => s.onMatchFound);
  const setConnectionType = useMultiplayerStore(s => s.setConnectionType);
  const startGame = useGameStore(s => s.startGame);
  const resetMatch = useGameStore(s => s.resetMatch);
  // --- DATA HANDLING (Stable Ref Pattern) ---
  // We wrap the logic in useCallback, but we store it in a ref to avoid
  // triggering effect re-runs when dependencies change.
  const handleData = useCallback((data: any, myRole: MultiplayerRole) => {
    if (myRole === 'host') {
      if (data.type === 'input') {
        physicsEngine.setRemoteInput(data.payload);
      }
      else if (data.type === 'rematch_request') {
          setOpponentRematchRequested(true);
          toast.info('Opponent wants a rematch!');
      }
    } else {
      if (data.type === 'state') physicsEngine.injectState(data.payload);
      else if (data.type === 'start') startGame('multiplayer');
      else if (data.type === 'restart') {
          startGame('multiplayer');
          setRematchRequested(false);
          setOpponentRematchRequested(false);
          toast.success('Rematch started!');
      }
      else if (data.type === 'rematch_request') {
          setOpponentRematchRequested(true);
          toast.info('Opponent wants a rematch!');
      }
    }
  }, [startGame, setOpponentRematchRequested, setRematchRequested]);
  const handleDataRef = useRef(handleData);
  // Update ref whenever handleData changes
  useEffect(() => {
    handleDataRef.current = handleData;
  }, [handleData]);
  // --- SENDING LOGIC (Dual Transport / Dual-Cast) ---
  const sendData = useCallback((data: any) => {
    // 1. Attempt P2P Transmission (Best Effort)
    if (connRef.current?.open) {
      try {
        connRef.current.send(data);
      } catch (e) {
        // Silent fail for P2P send errors
      }
    }
    // 2. Relay Transmission Logic (Always Send / Dual-Cast)
    // CRITICAL FIX: We now send EVERYTHING via Relay as well to guarantee delivery across different networks.
    // This fixes the issue where P2P fails silently or is blocked by NAT/Firewalls.
    // The receiving side handles deduplication via ID checks (for events) or idempotent updates (for state/input).
    if (queueWsRef.current?.readyState === WebSocket.OPEN) {
      queueWsRef.current.send(JSON.stringify({ type: 'RELAY', payload: data }));
    }
  }, []);
  // --- 1. PERSISTENT WEBSOCKET (Queue + Relay) ---
  useEffect(() => {
    if (!isMultiplayerActive) {
        if (queueWsRef.current) {
            queueWsRef.current.close();
            queueWsRef.current = null;
        }
        return;
    }
    // Prevent duplicate connection attempts
    if (queueWsRef.current && (queueWsRef.current.readyState === WebSocket.OPEN || queueWsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/queue`;
    const ws = new WebSocket(wsUrl);
    queueWsRef.current = ws;
    ws.onopen = () => {
        // Connection established
    };
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'MATCH_FOUND') {
                onMatchFound(data.role, data.code);
                toast.success('Match Found! Connected via Relay');
                // Start Game Immediately via Relay
                physicsEngine.setMode(data.role === 'host' ? 'host' : 'client');
                startGame('multiplayer');
            } else if (data.type === 'RELAY') {
                // Handle Relay Data using REF to avoid dependency cycle
                const myRole = useMultiplayerStore.getState().role;
                if (myRole) {
                    handleDataRef.current(data.payload, myRole);
                }
            } else if (data.type === 'PEER_DISCONNECTED') {
                toast.error('Opponent disconnected from server');
                resetMatch();
                resetMultiplayer();
            }
        } catch (e) {
            console.error('WS Message Error', e);
        }
    };
    ws.onclose = () => {
        // Automatic Reconnection Logic
        // Only attempt reconnect if multiplayer is still active (user didn't quit)
        if (useMultiplayerStore.getState().isMultiplayerActive) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, 3000);
        }
    };
    return () => {
        // Only close if we are actually unmounting or disabling multiplayer
        // If we are just re-running due to retryCount, the socket is likely already closed/closing
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
        if (queueWsRef.current === ws) {
            queueWsRef.current = null;
        }
    };
    // CRITICAL: Removed handleData from dependencies to prevent reconnection loops
  }, [isMultiplayerActive, onMatchFound, startGame, resetMatch, resetMultiplayer, retryCount]);
  // --- 2. P2P CONNECTION (Upgrade) ---
  const setupP2PListeners = useCallback((conn: DataConnection, myRole: 'host' | 'client') => {
    conn.on('open', () => {
        setConnectionType('p2p');
        setStatus('connected');
        toast.success('Connection upgraded to P2P!');
    });
    conn.on('data', (data: any) => {
        // Use REF here as well
        handleDataRef.current(data, myRole);
    });
    conn.on('close', () => {
      // Fallback to Relay if possible
      if (queueWsRef.current?.readyState === WebSocket.OPEN) {
          setConnectionType('relay');
          toast.warning('P2P lost. Falling back to Relay.');
      } else {
          setStatus('disconnected');
          if (useGameStore.getState().phase === 'playing') {
            resetMatch();
            toast.error('Opponent disconnected');
          }
          resetMultiplayer();
      }
    });
    conn.on('error', (err) => {
      if (useMultiplayerStore.getState().connectionType === 'relay') {
          // Silent fail or warning
      } else {
          setError(err.message);
      }
    });
  }, [setStatus, setError, resetMatch, resetMultiplayer, setConnectionType]);
  // Initialize PeerJS when Match is Found
  useEffect(() => {
    if (!role || !gameCode) {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        return;
    }
    if (peerRef.current) peerRef.current.destroy();
    const isHost = role === 'host';
    const myId = isHost ? `${ID_PREFIX}${gameCode}` : undefined;
    const peer = new Peer(myId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });
    peerRef.current = peer;
    peer.on('open', (id) => {
        setPeerId(id);
        if (!isHost) {
            // Client connects to Host
            const hostId = `${ID_PREFIX}${gameCode}`;
            const conn = peer.connect(hostId);
            connRef.current = conn;
            setupP2PListeners(conn, 'client');
        }
    });
    peer.on('connection', (conn) => {
        if (isHost) {
            connRef.current = conn;
            setOpponentId(conn.peer);
            setupP2PListeners(conn, 'host');
        } else {
            conn.close();
        }
    });
    peer.on('error', (err) => {
        if (useMultiplayerStore.getState().connectionType === 'relay') {
             toast.warning('P2P Failed. Playing via Relay.');
        } else {
             setError(err.message);
        }
    });
    return () => {
        peer.destroy();
        peerRef.current = null;
    };
  }, [role, gameCode, setPeerId, setError, setupP2PListeners, setOpponentId]);
  // --- SYNC LOOPS (Using sendData) ---
  useEffect(() => {
    if (role !== 'host') return;
    const interval = setInterval(() => {
        sendData({ type: 'state', payload: physicsEngine.getSnapshot() });
    }, 50);
    return () => clearInterval(interval);
  }, [role, phase, sendData]);
  useEffect(() => {
    if (role !== 'client') return;
    const interval = setInterval(() => {
        // Deep copy input to ensure clean serialization and avoid reference issues
        const payload = {
            joystick: { x: gameInput.joystick.x, y: gameInput.joystick.y },
            isThrowing: gameInput.isThrowing,
            isDodging: gameInput.isDodging
        };
        sendData({
          type: 'input',
          payload
        });
    }, 33);
    return () => clearInterval(interval);
  }, [role, phase, sendData]);
  // Rematch Logic
  useEffect(() => {
    if (rematchRequested) {
      sendData({ type: 'rematch_request' });
    }
  }, [rematchRequested, sendData]);
  // Host Rematch Start
  useEffect(() => {
    if (role === 'host' && rematchRequested && opponentRematchRequested) {
        startGame('multiplayer');
        physicsEngine.setMode('host');
        sendData({ type: 'restart' });
        setRematchRequested(false);
        setOpponentRematchRequested(false);
        toast.success('Rematch started!');
    }
  }, [role, rematchRequested, opponentRematchRequested, startGame, setRematchRequested, setOpponentRematchRequested, sendData]);
  return null;
}