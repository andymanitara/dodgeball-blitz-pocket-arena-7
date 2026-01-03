import { Hono } from "hono";
import { Env } from './core-utils';
import { DurableObjectNamespace } from '@cloudflare/workers-types';
// Extend the base Env to include the Durable Object binding
// This resolves TS errors without modifying the protected core-utils.ts
interface EnvWithQueue extends Env {
    MULTIPLAYER_QUEUE: DurableObjectNamespace;
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'this works' }}));
    // Get queue count
    app.get('/api/queue/count', async (c) => {
        const env = c.env as unknown as EnvWithQueue;
        const id = env.MULTIPLAYER_QUEUE.idFromName('default-queue');
        const stub = env.MULTIPLAYER_QUEUE.get(id);
        return stub.fetch(c.req.raw);
    });
    // Join queue
    app.post('/api/queue/join', async (c) => {
        try {
            const env = c.env as unknown as EnvWithQueue;
            const id = env.MULTIPLAYER_QUEUE.idFromName('default-queue');
            const stub = env.MULTIPLAYER_QUEUE.get(id);
            return await stub.fetch(c.req.raw);
        } catch (e) {
            console.error('Queue join error:', e);
            return c.json({ success: false, error: 'Failed to join queue' }, 500);
        }
    });
    // Leave queue
    app.post('/api/queue/leave', async (c) => {
        try {
            const env = c.env as unknown as EnvWithQueue;
            const id = env.MULTIPLAYER_QUEUE.idFromName('default-queue');
            const stub = env.MULTIPLAYER_QUEUE.get(id);
            return await stub.fetch(c.req.raw);
        } catch (e) {
            return c.json({ success: false }, 500);
        }
    });
}