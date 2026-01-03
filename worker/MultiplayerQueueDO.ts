import { DurableObject } from "cloudflare:workers";
interface QueueEntry {
  peerId: string;
  timestamp: number;
}
/**
 * Durable Object to manage the multiplayer matchmaking queue.
 * Ensures a single source of truth for the waiting list across all worker instances.
 */
export class MultiplayerQueueDO extends DurableObject {
  /**
   * Handle HTTP requests sent to this Durable Object.
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (request.method === "POST" && path === "/join") {
        return await this.handleJoin(request);
      }
      if (request.method === "POST" && path === "/leave") {
        return await this.handleLeave(request);
      }
      if (request.method === "GET" && path === "/count") {
        return await this.handleCount();
      }
      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("DO Error:", error);
      return new Response((error as Error).message, { status: 500 });
    }
  }
  /**
   * Handle a player joining the queue.
   * Checks for matches and returns opponent ID if found.
   */
  private async handleJoin(request: Request): Promise<Response> {
    const { peerId } = await request.json() as { peerId: string };
    if (!peerId) {
      return Response.json({ success: false, error: "Missing peerId" }, { status: 400 });
    }
    const now = Date.now();
    // Retrieve current queue from storage
    let queue = (await this.ctx.storage.get<QueueEntry[]>("queue")) || [];
    // 1. Cleanup stale entries (older than 30s)
    // This ensures we don't match with players who disconnected or timed out
    queue = queue.filter(e => now - e.timestamp < 30000);
    // 2. Check if user is already in queue
    const existingIndex = queue.findIndex(e => e.peerId === peerId);
    if (existingIndex !== -1) {
      // Update timestamp to keep heartbeat alive
      queue[existingIndex].timestamp = now;
      await this.ctx.storage.put("queue", queue);
      return Response.json({ success: true, match: false });
    }
    // 3. Matchmaking: Find an opponent
    // Simple FIFO: Pick the first person who isn't me
    const opponent = queue.find(e => e.peerId !== peerId);
    if (opponent) {
      // Match found!
      // Remove opponent from queue (I was never added, so just remove them)
      queue = queue.filter(e => e.peerId !== opponent.peerId);
      await this.ctx.storage.put("queue", queue);
      return Response.json({
        success: true,
        match: true,
        opponentId: opponent.peerId
      });
    }
    // 4. No match found, add self to queue
    queue.push({ peerId, timestamp: now });
    await this.ctx.storage.put("queue", queue);
    return Response.json({ success: true, match: false });
  }
  /**
   * Handle a player explicitly leaving the queue.
   */
  private async handleLeave(request: Request): Promise<Response> {
    const { peerId } = await request.json() as { peerId: string };
    if (!peerId) {
      return Response.json({ success: false, error: "Missing peerId" }, { status: 400 });
    }
    let queue = (await this.ctx.storage.get<QueueEntry[]>("queue")) || [];
    const initialLength = queue.length;
    // Remove the player
    queue = queue.filter(e => e.peerId !== peerId);
    // Only write if changed
    if (queue.length !== initialLength) {
      await this.ctx.storage.put("queue", queue);
    }
    return Response.json({ success: true });
  }
  /**
   * Get the current number of active players in the queue.
   */
  private async handleCount(): Promise<Response> {
    let queue = (await this.ctx.storage.get<QueueEntry[]>("queue")) || [];
    const now = Date.now();
    // Filter stale entries for accurate count
    const activeQueue = queue.filter(e => now - e.timestamp < 30000);
    // Lazy cleanup: if we found stale entries, update storage to keep it clean
    if (activeQueue.length !== queue.length) {
      await this.ctx.storage.put("queue", activeQueue);
    }
    return Response.json({ success: true, count: activeQueue.length });
  }
}