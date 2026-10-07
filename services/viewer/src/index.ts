import fastifyStatic from '@fastify/static';
import { trace } from '@opentelemetry/api';
import Fastify, { type FastifyRequest } from 'fastify';
import { createHash, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { config } from './config.js';
import { migrate, pool } from './db.js';
import { KINDS, parseEvent } from './events.js';
import { renderCreate, renderView, VIEW_PATHS } from './pages.js';
import { renderStats } from './stats.js';

// trustProxy: Azure terminates HTTPS in front of the container and forwards the original scheme and host.
const app = Fastify({ logger: true, trustProxy: true, routerOptions: { ignoreTrailingSlash: true }, bodyLimit: 4096 });

// Name each request by its route ("GET /thanks/") so Application Insights groups them usefully.
app.addHook('onRequest', async (req) => {
  const route = req.routeOptions.url;
  if (!route) return;
  const span = trace.getActiveSpan();
  span?.updateName(`${req.method} ${route}`);
  span?.setAttribute('http.route', route);
});

// Phones keep static files for 30 days; pages bump ?v=N in their links when a file changes.
await app.register(fastifyStatic, {
  root: join(import.meta.dirname, '..', 'public'),
  prefix: '/static/',
  maxAge: '30d',
});
app.get('/favicon.ico', (_req, reply) => reply.sendFile('favicon.ico'));

const baseUrl = (req: FastifyRequest) => `${req.protocol}://${req.host}`;

for (const kind of KINDS) {
  app.get(VIEW_PATHS[kind], (req, reply) =>
    reply.header('Cache-Control', 'no-cache').type('text/html; charset=utf-8').send(renderView(kind, baseUrl(req))),
  );
}
app.get('/create/', (req, reply) =>
  reply.header('Cache-Control', 'no-cache').type('text/html; charset=utf-8').send(renderCreate(baseUrl(req))),
);

app.get('/health', async () => {
  await pool.query('SELECT 1');
  return { ok: true };
});

// Beacons arrive as text/plain (sendBeacon / fetch with a string body) or JSON.
app.post('/e/', async (req, reply) => {
  const event = parseEvent(req.body);
  if (!event) return reply.code(400).send();
  await pool.query('INSERT INTO wish_events (event, kind, wid, ref) VALUES ($1, $2, $3, $4)', [
    event.event,
    event.kind,
    event.wid,
    event.ref,
  ]);
  return reply.code(204).send();
});

const sha256 = (value: string) => createHash('sha256').update(value).digest();
function statsAllowed(req: FastifyRequest): boolean {
  const header = req.headers.authorization ?? '';
  if (!config.statsPassword || !header.startsWith('Basic ')) return false;
  const [user, ...rest] = Buffer.from(header.slice(6), 'base64').toString('utf8').split(':');
  return user === 'admin' && timingSafeEqual(sha256(rest.join(':')), sha256(config.statsPassword));
}

app.get<{ Querystring: { p?: string; since?: string } }>('/stats/', async (req, reply) => {
  if (!config.statsPassword) return reply.code(404).send();
  if (!statsAllowed(req)) {
    return reply.code(401).header('WWW-Authenticate', 'Basic realm="wish stats", charset="UTF-8"').send();
  }
  return reply
    .header('Cache-Control', 'no-store')
    .type('text/html; charset=utf-8')
    .send(await renderStats(req.query));
});

await migrate();
await app.listen({ port: config.port, host: '0.0.0.0' });
