import { Hono } from "hono";
import { Env } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'this works' }}));
    // Get queue count
    app.get('/api/queue/count', async (c) => {
        const id = c.env.MULTIPLAYER_QUEUE.idFromName('default-queue');
        const stub = c.env.MULTIPLAYER_QUEUE.get(id);
        return stub.fetch(c.req.raw);
    });
    // Join queue
    app.post('/api/queue/join', async (c) => {
        try {
            const id = c.env.MULTIPLAYER_QUEUE.idFromName('default-queue');
            const stub = c.env.MULTIPLAYER_QUEUE.get(id);
            return await stub.fetch(c.req.raw);
        } catch (e) {
            console.error('Queue join error:', e);
            return c.json({ success: false, error: 'Failed to join queue' }, 500);
        }
    });
    // Leave queue
    app.post('/api/queue/leave', async (c) => {
        try {
            const id = c.env.MULTIPLAYER_QUEUE.idFromName('default-queue');
            const stub = c.env.MULTIPLAYER_QUEUE.get(id);
            return await stub.fetch(c.req.raw);
        } catch (e) {
            return c.json({ success: false }, 500);
        }
    });
}