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
    // We don't create the player object immediately.
    // We wait for the 'JOIN_SESSION' message to identify the user.
    let currentSessionId: string | null = null;
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === 'JOIN_SESSION') {
            const { sessionId, username } = data;
            if (sessionId && username) {
                currentSessionId = sessionId;
                this.handleSessionJoin(ws, sessionId, username);
            }
        }
        else if (data.type === 'RELAY') {
            // Relay logic: Forward to opponent if matched
            if (currentSessionId) {
                const player = this.sessions.get(currentSessionId);
                if (player && player.opponent && !player.opponent.isDisconnected && player.opponent.ws.readyState === 1) {
                    player.opponent.ws.send(JSON.stringify({ type: 'RELAY', payload: data.payload }));
                }
            }
        }
      } catch (e) {
        // Ignore invalid messages
      }
    });
    ws.addEventListener('close', () => {
        if (currentSessionId) {
            this.handleDisconnect(currentSessionId);
        }
    });
  }
  handleSessionJoin(ws: WebSocket, sessionId: string, username: string) {
    const existingPlayer = this.sessions.get(sessionId);
    if (existingPlayer) {
        // --- RECONNECT EXISTING SESSION ---
        existingPlayer.ws = ws;
        existingPlayer.isDisconnected = false;
        existingPlayer.username = username; // Update username
        // If they were in a match, restore it
        if (existingPlayer.opponent) {
            // Notify Self: Restore Match
            try {
                ws.send(JSON.stringify({
                    type: 'MATCH_RESTORED',
                    role: existingPlayer.role,
                    code: existingPlayer.matchCode
                }));
            } catch (e) {}
            // Notify Opponent: Reconnected
            if (existingPlayer.opponent.ws.readyState === 1) {
                try {
                    existingPlayer.opponent.ws.send(JSON.stringify({ type: 'OPPONENT_RECONNECTED' }));
                } catch (e) {}
            }
        } else {
            // If they were in queue (or idle), ensure they are in the queue
            // Check if they are already in the queue array
            const isInQueue = this.queue.some(p => p.sessionId === sessionId);
            if (!isInQueue) {
                 this.queue.push(existingPlayer);
                 this.matchmake();
            }
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
  handleDisconnect(sessionId: string) {
    const player = this.sessions.get(sessionId);
    if (!player) return;
    player.isDisconnected = true;
    // If in queue, remove immediately (no point keeping a disconnected player in queue)
    const queueIndex = this.queue.findIndex(p => p.sessionId === sessionId);
    if (queueIndex !== -1) {
        this.queue.splice(queueIndex, 1);
        this.sessions.delete(sessionId);
        return;
    }
    // If in match, notify opponent of temporary disconnect
    if (player.opponent) {
        if (player.opponent.ws.readyState === 1) {
            try {
                player.opponent.ws.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED_TEMP' }));
            } catch (e) {}
        }
        // Note: We do NOT delete the session here. We keep it to allow reconnection.
        // A separate cleanup process (alarm) would be ideal to remove stale sessions after X minutes,
        // but for this MVP, we rely on the opponent eventually disconnecting or the worker restarting.
    } else {
        // If not in queue and not in match (zombie state), clean up
        this.sessions.delete(sessionId);
    }
  }
  matchmake() {
    // Filter out disconnected players from queue
    this.queue = this.queue.filter(p => !p.isDisconnected && p.ws.readyState === 1);
    while (this.queue.length >= 2) {
      const p1 = this.queue.shift()!;
      const p2 = this.queue.shift()!;
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
        // If send fails, we might lose a match, but the queue filter above helps prevent this
      }
    }
  }
}