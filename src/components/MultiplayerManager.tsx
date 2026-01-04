import React, { useEffect, useRef, useCallback, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useMultiplayerStore, MultiplayerRole } from '@/store/useMultiplayerStore';
import { useGameStore, gameInput } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { physicsEngine } from '@/lib/physicsEngine';
import { toast } from 'sonner';
const ID_PREFIX = 'db-blitz-';
const RECONNECT_TIMEOUT_MS = 30000; // 30 seconds
export function MultiplayerManager() {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const queueWsRef = useRef<WebSocket | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // Timeout refs for opponent disconnection
  const disconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectToastIdRef = useRef<string | number | null>(null);
  // Store Selectors
  const role = useMultiplayerStore(s => s.role);
  const gameCode = useMultiplayerStore(s => s.gameCode);
  const isMultiplayerActive = useMultiplayerStore(s => s.isMultiplayerActive);
  const rematchRequested = useMultiplayerStore(s => s.rematchRequested);
  const opponentRematchRequested = useMultiplayerStore(s => s.opponentRematchRequested);
  const phase = useGameStore(s => s.phase);
  // User Info for Session
  const sessionId = useUserStore(s => s.sessionId);
  const username = useUserStore(s => s.username);
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
        // Send Session ID immediately to identify user and attempt restore
        ws.send(JSON.stringify({
            type: 'JOIN_SESSION',
            sessionId,
            username
        }));
    };
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'MATCH_FOUND') {
                onMatchFound(data.role, data.code);
                toast.success('Match Found! Connected via Relay');
                physicsEngine.setMode(data.role === 'host' ? 'host' : 'client');
                startGame('multiplayer');
            } 
            else if (data.type === 'MATCH_RESTORED') {
                // Handle session restoration
                onMatchFound(data.role, data.code);
                toast.success('Connection Restored!');
                physicsEngine.setMode(data.role === 'host' ? 'host' : 'client');
                // Ensure game is in playing state if not already
                if (useGameStore.getState().gameMode !== 'multiplayer') {
                     startGame('multiplayer');
                }
            }
            else if (data.type === 'OPPONENT_RECONNECTED') {
                // Clear timeout and warning
                if (disconnectTimeoutRef.current) {
                    clearTimeout(disconnectTimeoutRef.current);
                    disconnectTimeoutRef.current = null;
                }
                if (disconnectToastIdRef.current) {
                    toast.dismiss(disconnectToastIdRef.current);
                    disconnectToastIdRef.current = null;
                }
                toast.success('Opponent reconnected!');
            }
            else if (data.type === 'OPPONENT_DISCONNECTED_TEMP') {
                // Start timeout and show warning
                if (disconnectTimeoutRef.current) clearTimeout(disconnectTimeoutRef.current);
                disconnectToastIdRef.current = toast.warning('Opponent disconnected. Waiting for reconnect...', {
                    duration: Infinity,
                });
                disconnectTimeoutRef.current = setTimeout(() => {
                    if (disconnectToastIdRef.current) toast.dismiss(disconnectToastIdRef.current);
                    toast.error('Opponent failed to reconnect. Match ended.');
                    resetMatch();
                    resetMultiplayer();
                }, RECONNECT_TIMEOUT_MS);
            }
            else if (data.type === 'RELAY') {
                const myRole = useMultiplayerStore.getState().role;
                if (myRole) {
                    handleDataRef.current(data.payload, myRole);
                }
            } 
            else if (data.type === 'PEER_DISCONNECTED') {
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
        if (useMultiplayerStore.getState().isMultiplayerActive) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, 3000);
        }
    };
    return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
        if (queueWsRef.current === ws) {
            queueWsRef.current = null;
        }
        // Cleanup timeouts
        if (disconnectTimeoutRef.current) clearTimeout(disconnectTimeoutRef.current);
        if (disconnectToastIdRef.current) toast.dismiss(disconnectToastIdRef.current);
    };
  }, [isMultiplayerActive, onMatchFound, startGame, resetMatch, resetMultiplayer, retryCount, sessionId, username]);
  // --- 2. P2P CONNECTION (Upgrade) ---
  const setupP2PListeners = useCallback((conn: DataConnection, myRole: 'host' | 'client') => {
    conn.on('open', () => {
        setConnectionType('p2p');
        setStatus('connected');
        toast.success('Connection upgraded to P2P!');
    });
    conn.on('data', (data: any) => {
        handleDataRef.current(data, myRole);
    });
    conn.on('close', () => {
      if (queueWsRef.current?.readyState === WebSocket.OPEN) {
          setConnectionType('relay');
          toast.warning('P2P lost. Falling back to Relay.');
      } else {
          setStatus('disconnected');
          if (useGameStore.getState().phase === 'playing') {
            // Don't immediately reset on P2P close if Relay might still be active or reconnecting
            // But if both are gone, then we are in trouble.
            // For now, we rely on the WS close to trigger the full reset.
          }
      }
    });
    conn.on('error', (err) => {
      if (useMultiplayerStore.getState().connectionType === 'relay') {
          // Silent fail
      } else {
          setError(err.message);
      }
    });
  }, [setStatus, setError, setConnectionType]); // Removed resetMatch, resetMultiplayer
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