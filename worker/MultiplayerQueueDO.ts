import { DurableObject } from "cloudflare:workers";
export interface Env {
  MULTIPLAYER_QUEUE: DurableObjectNamespace;
}
interface Player {
  id: string;
  ws: WebSocket;
  joinedAt: number;
  opponent?: Player;
}
export class MultiplayerQueueDO extends DurableObject {
  private players: Player[] = [];
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
    const playerId = crypto.randomUUID();
    const player: Player = { id: playerId, ws, joinedAt: Date.now() };
    this.players.push(player);
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string);
        // RELAY LOGIC: Forward message to opponent if linked
        if (data.type === 'RELAY' && player.opponent) {
          if (player.opponent.ws.readyState === 1) { // 1 = OPEN
             player.opponent.ws.send(JSON.stringify({ type: 'RELAY', payload: data.payload }));
          }
        }
      } catch (e) {
        // Ignore invalid messages
      }
    });
    ws.addEventListener('close', () => {
      // Remove from queue if they were queuing
      this.players = this.players.filter(p => p.id !== playerId);
      // Notify opponent if matched
      if (player.opponent) {
        if (player.opponent.ws.readyState === 1) {
            try {
                player.opponent.ws.send(JSON.stringify({ type: 'PEER_DISCONNECTED' }));
            } catch (e) {
                // Ignore send errors during disconnect
            }
        }
        // Unlink
        player.opponent.opponent = undefined;
      }
    });
    this.matchmake();
  }
  matchmake() {
    // Simple FIFO matchmaking
    // We only match players who are NOT yet matched (opponent is undefined)
    // The queue (this.players) only holds waiting players.
    // Filter out any stale/closed connections from the queue before matching
    this.players = this.players.filter(p => p.ws.readyState === 1);
    while (this.players.length >= 2) {
      const p1 = this.players.shift()!;
      const p2 = this.players.shift()!;
      // Link players for Relay
      p1.opponent = p2;
      p2.opponent = p1;
      const gameCode = crypto.randomUUID().substring(0, 8).toUpperCase();
      try {
        // Notify players - DO NOT CLOSE SOCKETS
        p1.ws.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'host', code: gameCode }));
        p2.ws.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'client', code: gameCode }));
      } catch (e) {
        console.error("Error sending match data", e);
        // If notification fails, they will likely disconnect/timeout naturally
      }
    }
  }
}