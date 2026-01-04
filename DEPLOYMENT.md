# Deployment Guide
This guide covers how to deploy **Dodgeball Blitz** to Cloudflare Workers and how to enable advanced features like the server-side matchmaking queue.
## 1. Default Deployment (Peer-to-Peer)
By default, the application uses **PeerJS** for multiplayer. This creates a direct connection between players (Host/Client) without requiring a central game server or complex backend infrastructure.
**Advantages:**
- Zero configuration required.
- Works on the free tier of Cloudflare Workers.
- Low latency (direct connection).
**How to Deploy:**
1. Login to Cloudflare:
   ```bash
   bun x wrangler login
   ```
2. Deploy:
   ```bash
   bun run deploy
   ```
---
## 2. Advanced: Enabling Matchmaking Queue (Durable Objects)
If you want to implement a global matchmaking queue (e.g., "Find Match" button instead of sharing codes), you need to enable **Cloudflare Durable Objects**.
**⚠️ Requirements:**
- A Cloudflare account with a **Paid Workers Plan** (Durable Objects are not available on the free tier).
- Modifications to `wrangler.jsonc` and backend code.
### Step 1: Update `wrangler.jsonc`
You must bind a Durable Object namespace to your worker. Add the following to your `wrangler.jsonc` file:
```jsonc
{
  // ... existing config
  "durable_objects": {
    "bindings": [
      {
        "name": "MULTIPLAYER_QUEUE",
        "class_name": "MultiplayerQueueDO"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["MultiplayerQueueDO"]
    }
  ]
}
```
### Step 2: Add the Durable Object Class
Create a file named `worker/MultiplayerQueueDO.ts` with the following content. This version supports **Persistent Connections** and **Relay Mode**, allowing gameplay even if P2P fails.
```typescript
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
                // Ignore
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
      }
    }
  }
}
```
### Step 3: Update `worker/index.ts`
You need to export the Durable Object class so Cloudflare can find it. Update `worker/index.ts`:
```typescript
// Add this export at the top or bottom
export { MultiplayerQueueDO } from './MultiplayerQueueDO';
```
### Step 4: Add Route in `worker/userRoutes.ts`
Map a URL endpoint to your Durable Object.
```typescript
import { Hono } from "hono";
import { Env } from './core-utils';
// Extend the base Env to include the Durable Object binding
interface AppEnv extends Env {
    MULTIPLAYER_QUEUE: DurableObjectNamespace;
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/queue', async (c) => {
        // Cast the environment to AppEnv to access the Durable Object binding
        const env = c.env as unknown as AppEnv;
        const id = env.MULTIPLAYER_QUEUE.idFromName('global-queue');
        const stub = env.MULTIPLAYER_QUEUE.get(id);
        return stub.fetch(c.req.raw);
    });
}
```
### Step 5: Update Frontend
You would then update the frontend to connect to `wss://your-worker.dev/api/queue` instead of showing the Host/Join tabs.
---
## Troubleshooting
**"Class MultiplayerQueueDO not found"**
- Ensure you exported the class in `worker/index.ts`.
- Ensure you ran `bun run deploy` to apply the migrations.
**"Durable Objects are not available"**
- Check your Cloudflare dashboard. You must be on a paid Workers plan (Standard or higher) to use Durable Objects.