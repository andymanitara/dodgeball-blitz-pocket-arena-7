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
      // Unlink opponent if they were matched
      if (player.opponent) {
        player.opponent.opponent = undefined;
      }
    });
    this.matchmake();
  }
  matchmake() {
    // Simple FIFO matchmaking
    // We only match players who are NOT yet matched (opponent is undefined)
    // But since we remove them from this.players once matched? 
    // Actually, let's keep it simple: this.players is the QUEUE.
    // Once matched, we remove them from the queue array but keep the objects alive via closures.
    while (this.players.length >= 2) {
      const p1 = this.players.shift()!;
      const p2 = this.players.shift()!;
      // Check if sockets are still open
      if (p1.ws.readyState !== 1) {
        // p1 disconnected, drop
        continue;
      }
      if (p2.ws.readyState !== 1) {
        this.players.unshift(p1); // Put p1 back
        continue;
      }
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
      }
    }
  }
}