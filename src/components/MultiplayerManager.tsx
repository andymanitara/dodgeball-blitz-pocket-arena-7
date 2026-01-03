import React, { useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { useGameStore, gameInput } from '@/store/useGameStore';
import { physicsEngine } from '@/lib/physicsEngine';
import { toast } from 'sonner';
const ID_PREFIX = 'db-blitz-';
export function MultiplayerManager() {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const queueWsRef = useRef<WebSocket | null>(null);
  // Store Selectors
  const role = useMultiplayerStore(s => s.role);
  const gameCode = useMultiplayerStore(s => s.gameCode);
  const isQueuing = useMultiplayerStore(s => s.isQueuing);
  const rematchRequested = useMultiplayerStore(s => s.rematchRequested);
  const opponentRematchRequested = useMultiplayerStore(s => s.opponentRematchRequested);
  const phase = useGameStore(s => s.phase);
  // Actions
  const setRole = useMultiplayerStore(s => s.setRole);
  const setGameCode = useMultiplayerStore(s => s.setGameCode);
  const setPeerId = useMultiplayerStore(s => s.setPeerId);
  const setStatus = useMultiplayerStore(s => s.setStatus);
  const setError = useMultiplayerStore(s => s.setError);
  const setOpponentId = useMultiplayerStore(s => s.setOpponentId);
  const resetMultiplayer = useMultiplayerStore(s => s.reset);
  const leaveQueue = useMultiplayerStore(s => s.leaveQueue);
  const setOpponentRematchRequested = useMultiplayerStore(s => s.setOpponentRematchRequested);
  const setRematchRequested = useMultiplayerStore(s => s.setRematchRequested);
  const startGame = useGameStore(s => s.startGame);
  const resetMatch = useGameStore(s => s.resetMatch);
  // 1. Queue Connection Logic
  useEffect(() => {
    if (isQueuing) {
      // Connect to Queue WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/queue`;
      console.log('Connecting to queue:', wsUrl);
      const ws = new WebSocket(wsUrl);
      queueWsRef.current = ws;
      ws.onopen = () => {
        console.log('Connected to matchmaking queue');
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MATCH_FOUND') {
            console.log('Match found!', data);
            leaveQueue(); // Stop queuing UI
            setGameCode(data.code);
            setRole(data.role);
            toast.success('Match Found! Connecting...');
          }
        } catch (e) {
          console.error('Failed to parse queue message', e);
        }
      };
      ws.onclose = () => {
        console.log('Disconnected from queue');
        if (useMultiplayerStore.getState().isQueuing) {
            // If still supposed to be queuing but disconnected, show error
            // Unless we left intentionally
        }
      };
      ws.onerror = (err) => {
        console.error('Queue WebSocket error', err);
        toast.error('Matchmaking service unavailable');
        leaveQueue();
      };
      return () => {
        ws.close();
        queueWsRef.current = null;
      };
    }
  }, [isQueuing, leaveQueue, setGameCode, setRole]);
  // 2. Peer Connection Setup
  const setupConnectionListeners = useCallback((conn: DataConnection, myRole: 'host' | 'client') => {
    conn.on('data', (data: any) => {
      if (myRole === 'host') {
        if (data.type === 'input') physicsEngine.setRemoteInput(data.payload);
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
    });
    conn.on('close', () => {
      console.log('Connection closed');
      setStatus('disconnected');
      if (useGameStore.getState().phase === 'playing') {
        resetMatch();
        toast.error('Opponent disconnected');
      }
      resetMultiplayer();
    });
    conn.on('error', (err) => {
      console.error('Connection error:', err);
      setError(err.message);
      toast.error('Connection lost');
    });
  }, [setStatus, setError, resetMatch, resetMultiplayer, setOpponentRematchRequested, setRematchRequested, startGame]);
  // 3. Handle Incoming Connection (Host Side)
  const handleIncomingConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    setStatus('connecting');
    conn.on('open', () => {
      console.log('Connected to client:', conn.peer);
      setStatus('connected');
      setOpponentId(conn.peer);
      // Host starts game immediately upon connection
      startGame('multiplayer');
      physicsEngine.setMode('host');
      conn.send({ type: 'start' });
      toast.success('Client connected! Starting game...');
    });
    setupConnectionListeners(conn, 'host');
  }, [setStatus, setOpponentId, startGame, setupConnectionListeners]);
  // 4. Handle Outgoing Connection (Client Side)
  const connectToHost = useCallback((hostCode: string) => {
    if (!peerRef.current) return;
    const hostId = `${ID_PREFIX}${hostCode}`;
    console.log('Connecting to host:', hostId);
    setStatus('connecting');
    const conn = peerRef.current.connect(hostId);
    connRef.current = conn;
    conn.on('open', () => {
      console.log('Connected to host:', conn.peer);
      setStatus('connected');
      setOpponentId(conn.peer);
      physicsEngine.setMode('client');
      toast.success('Connected to Host!');
    });
    setupConnectionListeners(conn, 'client');
  }, [setStatus, setOpponentId, setupConnectionListeners]);
  // Initialize Peer when Role & GameCode are set (after Queue match)
  useEffect(() => {
    // Need both role and gameCode to start PeerJS
    if (!role || !gameCode) {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        return;
    }
    // If peer already exists, destroy it to ensure clean state
    if (peerRef.current) {
        peerRef.current.destroy();
    }
    const isHost = role === 'host';
    // Host uses specific ID based on gameCode, Client uses random ID
    const myId = isHost ? `${ID_PREFIX}${gameCode}` : undefined;
    const peer = new Peer(myId);
    peerRef.current = peer;
    peer.on('open', (id) => {
        console.log('Peer initialized:', id);
        setPeerId(id);
        if (!isHost) {
            // Client connects to Host
            connectToHost(gameCode);
        }
    });
    peer.on('connection', (conn) => {
        // Only host accepts connections
        if (isHost) {
            handleIncomingConnection(conn);
        } else {
            conn.close();
        }
    });
    peer.on('error', (err) => {
        console.error('Peer error:', err);
        setError(err.message);
        setStatus('error');
        toast.error(`Network Error: ${err.message}`);
    });
    return () => {
        peer.destroy();
        peerRef.current = null;
    };
  }, [role, gameCode, connectToHost, handleIncomingConnection, setPeerId, setError, setStatus]);
  // Rematch Request Sender
  useEffect(() => {
    if (rematchRequested && connRef.current?.open) {
      connRef.current.send({ type: 'rematch_request' });
    }
  }, [rematchRequested]);
  // Host Rematch Logic
  useEffect(() => {
    if (role === 'host' && rematchRequested && opponentRematchRequested) {
        startGame('multiplayer');
        physicsEngine.setMode('host');
        connRef.current?.send({ type: 'restart' });
        setRematchRequested(false);
        setOpponentRematchRequested(false);
        toast.success('Rematch started!');
    }
  }, [role, rematchRequested, opponentRematchRequested, startGame, setRematchRequested, setOpponentRematchRequested]);
  // Sync Loops
  useEffect(() => {
    if (role !== 'host') return;
    const interval = setInterval(() => {
      if (connRef.current?.open) {
        connRef.current.send({ type: 'state', payload: physicsEngine.getSnapshot() });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [role, phase]);
  useEffect(() => {
    if (role !== 'client') return;
    const interval = setInterval(() => {
      if (connRef.current?.open) {
        connRef.current.send({
          type: 'input',
          payload: {
            joystick: gameInput.joystick,
            isThrowing: gameInput.isThrowing,
            isDodging: gameInput.isDodging
          }
        });
      }
    }, 33);
    return () => clearInterval(interval);
  }, [role, phase]);
  return null;
}