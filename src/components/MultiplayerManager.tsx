import React, { useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { useGameStore, gameInput } from '@/store/useGameStore';
import { physicsEngine } from '@/lib/physicsEngine';
export function MultiplayerManager() {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const role = useMultiplayerStore(s => s.role);
  const setPeerId = useMultiplayerStore(s => s.setPeerId);
  const setStatus = useMultiplayerStore(s => s.setStatus);
  const setError = useMultiplayerStore(s => s.setError);
  const setOpponentId = useMultiplayerStore(s => s.setOpponentId);
  const setRole = useMultiplayerStore(s => s.setRole);
  const startGame = useGameStore(s => s.startGame);
  const phase = useGameStore(s => s.phase);
  // Handle Connection Logic - Wrapped in useCallback to be a stable dependency
  const handleConnection = useCallback((conn: DataConnection, myRole: 'host' | 'client') => {
    connRef.current = conn;
    setRole(myRole);
    setStatus('connecting');
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
      // Handle disconnect (maybe pause game or show error)
    });
  }, [setRole, setStatus, setOpponentId, startGame]);
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
    });
    return () => {
      peer.destroy();
    };
  }, [setPeerId, setStatus, setError, handleConnection]);
  // Expose connect function via window event
  useEffect(() => {
    const connectHandler = (e: CustomEvent<string>) => {
      if (!peerRef.current) return;
      const targetId = e.detail;
      console.log('Connecting to:', targetId);
      const conn = peerRef.current.connect(targetId);
      handleConnection(conn, 'client');
    };
    window.addEventListener('connect-peer', connectHandler as EventListener);
    return () => window.removeEventListener('connect-peer', connectHandler as EventListener);
  }, [handleConnection]);
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
  return null; // Logic only
}