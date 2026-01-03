import { Hono } from "hono";
import { Env } from './core-utils';
// Extend the base Env to include the Durable Object binding
interface AppEnv extends Env {
    MULTIPLAYER_QUEUE: DurableObjectNamespace;
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/test', (c) => c.json({ success: true, data: { status: 'active' }}));
    app.get('/api/queue', async (c) => {
        // Cast the environment to AppEnv to access the Durable Object binding
        // This avoids changing the function signature which would break index.ts
        const env = c.env as unknown as AppEnv;
        const id = env.MULTIPLAYER_QUEUE.idFromName('global-queue');
        const stub = env.MULTIPLAYER_QUEUE.get(id);
        return stub.fetch(c.req.raw);
    });
}