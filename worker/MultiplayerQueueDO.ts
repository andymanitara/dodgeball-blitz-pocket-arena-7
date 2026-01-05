import { DurableObject } from "cloudflare:workers";
export interface Env {
  MULTIPLAYER_QUEUE: DurableObjectNamespace;
}
interface Player {
  sessionId: string;
  username: string;
  ws: WebSocket;
  joinedAt: number;
  opponent?: Player;
  role?: 'host' | 'client';
  matchCode?: string;
  isDisconnected?: boolean;
}
export class MultiplayerQueueDO extends DurableObject {
  // Map sessionId -> Player for O(1) lookup and reconnection
  private sessions: Map<string, Player> = new Map();
  // Queue only holds players waiting for a match
  private queue: Player[] = [];
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    this.ctx.acceptWebSocket(server);
    this.handleConnection(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  handleConnection(ws: WebSocket) {
    let currentSessionId: string | null = null;
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === 'JOIN_SESSION') {
            const { sessionId, username, isReconnecting } = data;
            if (sessionId && username) {
                currentSessionId = sessionId;
                this.handleSessionJoin(ws, sessionId, username, !!isReconnecting);
            }
        }
        else if (data.type === 'RELAY') {
            if (currentSessionId) {
                const player = this.sessions.get(currentSessionId);
                if (player && player.opponent && !player.opponent.isDisconnected && player.opponent.ws.readyState === 1) {
                    player.opponent.ws.send(JSON.stringify({ type: 'RELAY', payload: data.payload }));
                }
            }
        }
        else if (data.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch (e) {
        // Ignore invalid messages
      }
    });
    ws.addEventListener('close', () => {
        if (currentSessionId) {
            // CRITICAL FIX: Pass the specific WebSocket instance to handleDisconnect
            // This allows us to ignore close events from stale sockets if the player has already reconnected
            this.handleDisconnect(currentSessionId, ws);
        }
    });
  }
  handleSessionJoin(ws: WebSocket, sessionId: string, username: string, isReconnecting: boolean) {
    const existingPlayer = this.sessions.get(sessionId);
    if (existingPlayer) {
        // --- RECONNECT EXISTING SESSION ---
        existingPlayer.ws = ws;
        existingPlayer.isDisconnected = false;
        existingPlayer.username = username;
        // If fresh start (!isReconnecting) and in a match, terminate the old match
        if (!isReconnecting && existingPlayer.opponent) {
            const opponent = existingPlayer.opponent;
            // Notify opponent
            if (opponent.ws.readyState === 1) {
                try {
                    opponent.ws.send(JSON.stringify({ type: 'OPPONENT_LEFT' }));
                } catch (e) { /* Ignore */ }
            }
            // Unlink opponent and re-queue if active
            opponent.opponent = undefined;
            opponent.matchCode = undefined;
            opponent.role = undefined;
            if (opponent.ws.readyState === 1) {
                if (!this.queue.some(p => p.sessionId === opponent.sessionId)) {
                    this.queue.push(opponent);
                }
                this.matchmake();
            }
            // Unlink self
            existingPlayer.opponent = undefined;
            existingPlayer.matchCode = undefined;
            existingPlayer.role = undefined;
        }
        // Ensure the opponent is still linked to us. If not, the match is stale.
        if (existingPlayer.opponent && existingPlayer.opponent.opponent !== existingPlayer) {
            existingPlayer.opponent = undefined;
            existingPlayer.matchCode = undefined;
            existingPlayer.role = undefined;
        }
        // If they are still in a match, restore it
        if (existingPlayer.opponent) {
            // Ensure they are not in the queue
            const queueIndex = this.queue.findIndex(p => p.sessionId === sessionId);
            if (queueIndex !== -1) {
                this.queue.splice(queueIndex, 1);
            }
            // Notify Self: Restore Match
            try {
                ws.send(JSON.stringify({
                    type: 'MATCH_RESTORED',
                    role: existingPlayer.role,
                    code: existingPlayer.matchCode
                }));
            } catch (e) {
                console.warn('Failed to send MATCH_RESTORED', e);
            }
            // Notify Opponent: Reconnected
            if (existingPlayer.opponent.ws.readyState === 1) {
                try {
                    existingPlayer.opponent.ws.send(JSON.stringify({ type: 'OPPONENT_RECONNECTED' }));
                } catch (e) {
                    console.warn('Failed to send OPPONENT_RECONNECTED', e);
                }
            }
        } else {
            // If not in match, ensure they are in the queue
            const isInQueue = this.queue.some(p => p.sessionId === sessionId);
            if (!isInQueue) {
                 this.queue.push(existingPlayer);
            }
            this.matchmake();
        }
    } else {
        // --- NEW SESSION ---
        const newPlayer: Player = {
            sessionId,
            username,
            ws,
            joinedAt: Date.now()
        };
        this.sessions.set(sessionId, newPlayer);
        this.queue.push(newPlayer);
        this.matchmake();
    }
  }
  handleDisconnect(sessionId: string, ws: WebSocket) {
    const player = this.sessions.get(sessionId);
    if (!player) return;
    // CRITICAL FIX: Race Condition Guard
    // If the player's current socket is NOT the one that just closed,
    // it means they have already reconnected. Ignore this close event.
    if (player.ws !== ws) {
        return;
    }
    player.isDisconnected = true;
    // If in queue, remove immediately
    const queueIndex = this.queue.findIndex(p => p.sessionId === sessionId);
    if (queueIndex !== -1) {
        this.queue.splice(queueIndex, 1);
        this.sessions.delete(sessionId);
        return;
    }
    // If in match, notify opponent but DO NOT UNLINK yet (allow reconnect)
    if (player.opponent) {
        const opponent = player.opponent;
        if (opponent.ws.readyState === 1) {
            try {
                opponent.ws.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED_TEMP' }));
            } catch (e) {
                console.warn('Failed to send OPPONENT_DISCONNECTED_TEMP', e);
            }
        }
        // We keep the session alive for potential reconnection
    } else {
        // Zombie state (not in queue, not in match)
        this.sessions.delete(sessionId);
    }
  }
  matchmake() {
    // 1. Clean up dead players from queue
    // Only remove if explicitly disconnected or socket is closed/closing
    this.queue = this.queue.filter(p => {
        if (p.isDisconnected) return false;
        if (p.ws.readyState === 3 || p.ws.readyState === 2) return false;
        if (p.opponent) return false; // Should not be in queue if matched
        return true;
    });
    // 2. Find pairs of OPEN connections
    // We iterate manually to skip CONNECTING sockets without removing them
    // Find first ready player
    const p1Index = this.queue.findIndex(p => p.ws.readyState === 1);
    // If we have at least one ready player, try to find a second one
    if (p1Index !== -1) {
        // Find second ready player (must be after p1)
        const p2Index = this.queue.findIndex((p, idx) => idx > p1Index && p.ws.readyState === 1);
        if (p2Index !== -1) {
            const p1 = this.queue[p1Index];
            const p2 = this.queue[p2Index];
            // Remove from queue (higher index first to preserve lower index)
            this.queue.splice(p2Index, 1);
            this.queue.splice(p1Index, 1);
            // Link players
            p1.opponent = p2;
            p2.opponent = p1;
            p1.role = 'host';
            p2.role = 'client';
            const gameCode = crypto.randomUUID().substring(0, 8).toUpperCase();
            p1.matchCode = gameCode;
            p2.matchCode = gameCode;
            try {
                p1.ws.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'host', code: gameCode }));
                p2.ws.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'client', code: gameCode }));
            } catch (e) {
                console.warn('Failed to send MATCH_FOUND', e);
            }
            // Recursively try to match more players
            this.matchmake();
        }
    }
  }
}