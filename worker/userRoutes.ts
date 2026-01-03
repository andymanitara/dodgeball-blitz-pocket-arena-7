import { Hono } from "hono";
import { Env } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/test', (c) => c.json({ success: true, data: { status: 'active' }}));
    app.get('/api/queue', async (c) => {
        const id = c.env.MULTIPLAYER_QUEUE.idFromName('global-queue');
        const stub = c.env.MULTIPLAYER_QUEUE.get(id);
        return stub.fetch(c.req.raw);
    });
}