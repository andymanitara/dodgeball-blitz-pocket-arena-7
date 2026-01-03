import { Hono } from "hono";
import { Env } from './core-utils';
interface QueueEntry {
    peerId: string;
    timestamp: number;
}
// In-memory queue (ephemeral, per-isolate)
// Note: In a production multi-region environment, this should be replaced with Durable Objects or KV.
// For this MVP, a global variable works for single-instance deployments.
let waitingQueue: QueueEntry[] = [];
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'this works' }}));
    // Get queue count
    app.get('/api/queue/count', (c) => {
        // Cleanup stale entries first (older than 30s)
        const now = Date.now();
        waitingQueue = waitingQueue.filter(e => now - e.timestamp < 30000);
        return c.json({ success: true, count: waitingQueue.length });
    });
    // Join queue
    app.post('/api/queue/join', async (c) => {
        try {
            const { peerId } = await c.req.json<{ peerId: string }>();
            const now = Date.now();
            // Cleanup stale entries
            waitingQueue = waitingQueue.filter(e => now - e.timestamp < 30000);
            // Check if I am already in queue
            const existingIndex = waitingQueue.findIndex(e => e.peerId === peerId);
            if (existingIndex !== -1) {
                // I am already waiting. Just update my timestamp.
                waitingQueue[existingIndex].timestamp = now;
                return c.json({ success: true, match: false });
            }
            // I am not in queue. Look for opponent.
            // Filter out self just in case
            const opponents = waitingQueue.filter(e => e.peerId !== peerId);
            if (opponents.length > 0) {
                // Match found! Take the longest waiting player (first one)
                const opponent = opponents[0];
                // Remove opponent from queue (they are now matched with me)
                waitingQueue = waitingQueue.filter(e => e.peerId !== opponent.peerId);
                return c.json({
                    success: true,
                    match: true,
                    opponentId: opponent.peerId
                });
            }
            // No match, add to queue
            waitingQueue.push({ peerId, timestamp: now });
            return c.json({
                success: true,
                match: false
            });
        } catch (e) {
            console.error('Queue join error:', e);
            return c.json({ success: false, error: 'Failed to join queue' }, 500);
        }
    });
    // Leave queue
    app.post('/api/queue/leave', async (c) => {
        try {
            const { peerId } = await c.req.json<{ peerId: string }>();
            waitingQueue = waitingQueue.filter(e => e.peerId !== peerId);
            return c.json({ success: true });
        } catch (e) {
            return c.json({ success: false }, 500);
        }
    });
}