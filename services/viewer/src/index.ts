import fastifyStatic from '@fastify/static';
import { trace } from '@opentelemetry/api';
import Fastify, { type FastifyRequest } from 'fastify';
import { createHash, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { config } from './config.js';
import { migrate, pool } from './db.js';
import { KINDS, parseEvent } from './events.js';
import { cleanName, renderCreate, renderView, VIEW_PATHS } from './pages.js';
import { renderStats } from './stats.js';

// trustProxy: Azure terminates HTTPS in front of the container and forwards the original scheme and host.
// Gift links may carry short first names in the query (?f=&t=) for the WhatsApp preview.
// They must not end up in logs or monitoring, so only the path is ever recorded.
const pathOnly = (url: string) => url.split('?')[0];

const app = Fastify({
  logger: {
    serializers: {
      req: (req) => ({ method: req.method, url: pathOnly(req.url), remoteAddress: req.ip }),
    },
  },
  trustProxy: true,
  routerOptions: { ignoreTrailingSlash: true },
  bodyLimit: 4096,
});

// Name each request by its route ("GET /thanks/") so Application Insights groups them usefully.
// Also overwrite the request address on the trace without its query, so names never reach Application Insights.
app.addHook('onRequest', async (req) => {
  const span = trace.getActiveSpan();
  if (!span) return;
  const path = pathOnly(req.url);
  span.setAttribute('url.full', `${req.protocol}://${req.host}${path}`);
  span.setAttribute('http.url', `${req.protocol}://${req.host}${path}`);
  span.setAttribute('http.target', path);
  span.setAttribute('url.query', '');
  const route = req.routeOptions.url;
  if (!route) return;
  span.updateName(`${req.method} ${route}`);
  span.setAttribute('http.route', route);
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
  app.get<{ Querystring: { f?: string; t?: string } }>(VIEW_PATHS[kind], (req, reply) => {
    const names = { from: cleanName(req.query.f), to: cleanName(req.query.t) };
    return reply
      .header('Cache-Control', 'no-cache')
      // Keep the names out of other sites' logs too when someone follows a link from this page.
      .header('Referrer-Policy', 'origin')
      .type('text/html; charset=utf-8')
      .send(renderView(kind, baseUrl(req), names));
  });
}
app.get('/create/', (req, reply) =>
  reply.header('Cache-Control', 'no-cache').type('text/html; charset=utf-8').send(renderCreate(baseUrl(req))),
);

app.get('/health', async () => {
  await pool.query('SELECT 1');
  return { ok: true, version: process.env.APP_VERSION ?? 'dev' };
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
