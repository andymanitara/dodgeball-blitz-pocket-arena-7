import { DurableObject } from "cloudflare:workers";
export interface Env {
  MULTIPLAYER_QUEUE: DurableObjectNamespace;
}
interface Player {
  id: string;
  ws: WebSocket;
  joinedAt: number;
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
    ws.addEventListener('close', () => {
      this.players = this.players.filter(p => p.id !== playerId);
    });
    this.matchmake();
  }
  matchmake() {
    // Simple FIFO matchmaking
    while (this.players.length >= 2) {
      const p1 = this.players.shift()!;
      const p2 = this.players.shift()!;
      // Check if sockets are still open
      if (p1.ws.readyState !== WebSocket.READY_STATE_OPEN) {
        this.players.unshift(p2); // Put p2 back
        continue;
      }
      if (p2.ws.readyState !== WebSocket.READY_STATE_OPEN) {
        this.players.unshift(p1); // Put p1 back
        continue;
      }
      // Generate a game code for them to use via PeerJS
      const gameCode = crypto.randomUUID().substring(0, 8).toUpperCase();
      try {
        // Notify Player 1 (Host)
        p1.ws.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'host', code: gameCode }));
        // Notify Player 2 (Client)
        p2.ws.send(JSON.stringify({ type: 'MATCH_FOUND', role: 'client', code: gameCode }));
        // Close queue connections as they will now switch to PeerJS
        p1.ws.close();
        p2.ws.close();
      } catch (e) {
        console.error("Error sending match data", e);
      }
    }
  }
}