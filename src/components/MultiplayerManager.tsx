import React, { useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { useGameStore, gameInput } from '@/store/useGameStore';
import { physicsEngine } from '@/lib/physicsEngine';
import { toast } from 'sonner';
export function MultiplayerManager() {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  // Store Selectors
  const role = useMultiplayerStore(s => s.role);
  const peerId = useMultiplayerStore(s => s.peerId);
  const status = useMultiplayerStore(s => s.status);
  const isQueuing = useMultiplayerStore(s => s.isQueuing);
  // Store Actions
  const setPeerId = useMultiplayerStore(s => s.setPeerId);
  const setStatus = useMultiplayerStore(s => s.setStatus);
  const setError = useMultiplayerStore(s => s.setError);
  const setOpponentId = useMultiplayerStore(s => s.setOpponentId);
  const setRole = useMultiplayerStore(s => s.setRole);
  const setIsQueuing = useMultiplayerStore(s => s.setIsQueuing);
  const setQueueCount = useMultiplayerStore(s => s.setQueueCount);
  const startGame = useGameStore(s => s.startGame);
  const phase = useGameStore(s => s.phase);
  // Handle Connection Logic
  const handleConnection = useCallback((conn: DataConnection, myRole: 'host' | 'client') => {
    connRef.current = conn;
    setRole(myRole);
    setStatus('connecting');
    setIsQueuing(false); // Stop queuing if connected
    conn.on('open', () => {
      console.log('Connected to:', conn.peer);
      setStatus('connected');
      setOpponentId(conn.peer);
      // If Host, start the game immediately
      if (myRole === 'host') {
        startGame('multiplayer');
        physicsEngine.setMode('host');
        // Send start signal
        conn.send({ type: 'start' });
      } else {
        physicsEngine.setMode('client');
      }
    });
    conn.on('data', (data: any) => {
      if (myRole === 'host') {
        // Host receives Inputs from Client
        if (data.type === 'input') {
          physicsEngine.setRemoteInput(data.payload);
        }
      } else {
        // Client receives State from Host
        if (data.type === 'state') {
          physicsEngine.injectState(data.payload);
        } else if (data.type === 'start') {
          startGame('multiplayer');
        }
      }
    });
    conn.on('close', () => {
      console.log('Connection closed');
      setStatus('disconnected');
      setRole(null);
      // Reset game if active
      if (useGameStore.getState().phase === 'playing') {
        useGameStore.getState().resetMatch();
        toast.error('Opponent disconnected. Match ended.');
      } else {
        toast.info('Opponent disconnected.');
      }
    });
  }, [setRole, setStatus, setOpponentId, startGame, setIsQueuing]);
  // Initialize Peer
  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;
    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      setPeerId(id);
      setStatus('disconnected');
    });
    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      handleConnection(conn, 'host');
    });
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setError(err.message);
      setStatus('error');
      setIsQueuing(false);
    });
    return () => {
      peer.destroy();
    };
  }, [setPeerId, setStatus, setError, handleConnection, setIsQueuing]);
  // Queue Logic
  useEffect(() => {
    let pollInterval: any = null;
    let timeoutTimer: any = null;
    const joinQueue = async () => {
      if (!peerId) return;
      try {
        const res = await fetch('/api/queue/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ peerId })
        });
        const data = await res.json();
        if (data.success) {
          if (data.match && data.opponentId) {
            // Match found! Connect as client
            console.log('Match found! Connecting to:', data.opponentId);
            if (peerRef.current) {
              const conn = peerRef.current.connect(data.opponentId);
              handleConnection(conn, 'client');
            }
          } else {
            // Waiting... poll count
            pollQueueCount();
            pollInterval = setInterval(pollQueueCount, 3000);
            // Auto-timeout after 30s
            timeoutTimer = setTimeout(() => {
              if (isQueuing) {
                setIsQueuing(false);
                toast.info('No match found. Please try again.');
              }
            }, 30000);
          }
        }
      } catch (e) {
        console.error('Queue join failed', e);
        setIsQueuing(false);
        toast.error('Failed to join matchmaking queue');
      }
    };
    const pollQueueCount = async () => {
      try {
        const res = await fetch('/api/queue/count');
        const data = await res.json();
        if (data.success) {
          setQueueCount(data.count);
        }
      } catch (e) {
        console.error('Poll failed', e);
      }
    };
    const leaveQueue = async () => {
      if (!peerId) return;
      try {
        await fetch('/api/queue/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ peerId })
        });
      } catch (e) {
        console.error('Leave queue failed', e);
      }
    };
    if (isQueuing && status === 'disconnected') {
      joinQueue();
    } else {
      // Cleanup if we stop queuing or get connected
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      // Only leave queue if we are NOT connected (if connected, we matched, so don't leave)
      // Actually, if we matched via API, we are removed by server.
      // If we matched via incoming connection, we should ensure we are removed.
      if (!isQueuing && peerId) {
        leaveQueue();
      }
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [isQueuing, peerId, status, handleConnection, setIsQueuing, setQueueCount]);
  // Host Broadcast Loop
  useEffect(() => {
    if (role !== 'host') return;
    const interval = setInterval(() => {
      if (connRef.current?.open) {
        const snapshot = physicsEngine.getSnapshot();
        connRef.current.send({ type: 'state', payload: snapshot });
      }
    }, 50); // 20Hz update rate
    return () => clearInterval(interval);
  }, [role, phase]);
  // Client Input Loop
  useEffect(() => {
    if (role !== 'client') return;
    const interval = setInterval(() => {
      if (connRef.current?.open) {
        // Send local inputs
        connRef.current.send({
          type: 'input',
          payload: {
            joystick: gameInput.joystick,
            isThrowing: gameInput.isThrowing,
            isDodging: gameInput.isDodging
          }
        });
      }
    }, 33); // 30Hz input rate
    return () => clearInterval(interval);
  }, [role, phase]);
  return null;
}