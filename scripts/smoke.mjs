// End-to-end check of a running wish server.
// Usage: node scripts/smoke.mjs [baseUrl] [statsPassword]
// Records a handful of test events, so run it against a development database.
import assert from 'node:assert/strict';

const BASE = process.argv[2] ?? 'http://localhost:4100';
const STATS_PASSWORD = process.argv[3];
const step = (text) => console.log(`ok  ${text}`);

const health = await (await fetch(`${BASE}/health`)).json();
assert.equal(health.ok, true);
assert.equal(typeof health.version, 'string');
step('health');

const pages = {
  '/': 'A birthday surprise is waiting',
  '/thanks/': 'special thank-you',
  '/r/': 'special reaction',
  '/award/': 'the award goes to',
};
for (const [path, title] of Object.entries(pages)) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  assert.equal(res.status, 200, path);
  assert.ok(html.includes(title), `${path} has its WhatsApp preview title`);
  assert.ok(/property="og:image" content="https?:\/\/[^"]+\/static\/wish\/og[a-z_]*\.png"/.test(html), `${path} og:image is absolute`);
  assert.ok(html.includes('data-evt="/e/"'), `${path} posts events to /e/`);
  assert.ok(!html.includes('{{') && !html.includes('{%'), `${path} has no unfilled template tags`);
}
assert.equal((await fetch(`${BASE}/thanks`)).status, 200);
step('four gift pages render with the right WhatsApp previews (with and without trailing slash)');

const create = await (await fetch(`${BASE}/create/`)).text();
assert.ok(/data-thanks="https?:\/\/[^"]+\/thanks\/"/.test(create));
assert.ok(create.includes('/static/wish/create.js'));
step('creator page renders with absolute links for each gift type');

for (const file of ['wish.js', 'create.js', 'wish.css', 'og.png', 'og_thanks.png', 'og_react.png', 'og_award.png']) {
  const res = await fetch(`${BASE}/static/wish/${file}`);
  assert.equal(res.status, 200, file);
  assert.match(res.headers.get('cache-control') ?? '', /max-age=2592000/, `${file} cached 30 days`);
}
assert.equal((await fetch(`${BASE}/favicon.ico`)).status, 200);
const wishJs = await (await fetch(`${BASE}/static/wish/wish.js`)).text();
assert.ok(wishJs.includes('wish.inixr.com/create/') && !wishJs.includes('inixr.com/wish'));
step('static files served with 30-day caching; shared links point to wish.inixr.com');

const beacon = (body, type = 'text/plain;charset=UTF-8') =>
  fetch(`${BASE}/e/`, { method: 'POST', headers: { 'Content-Type': type }, body });
assert.equal((await beacon('{"e":"open","k":"ty","i":"smoke1","r":""}')).status, 204);
assert.equal((await beacon('{"e":"start","k":"ty","i":"smoke1","r":""}', 'application/json')).status, 204);
assert.equal((await beacon('{"e":"link_created","k":"","i":"smoke2","r":"smoke1"}')).status, 204);
assert.equal((await beacon('{"e":"nope","k":""}')).status, 400);
assert.equal((await beacon('garbage')).status, 400);
step('events accepted as text and JSON; bad events rejected');

const stats = await fetch(`${BASE}/stats/`);
if (STATS_PASSWORD) {
  assert.equal(stats.status, 401);
  assert.match(stats.headers.get('www-authenticate') ?? '', /Basic/);
  const wrong = await fetch(`${BASE}/stats/`, { headers: { Authorization: `Basic ${btoa('admin:wrong')}` } });
  assert.equal(wrong.status, 401);
  const auth = { headers: { Authorization: `Basic ${btoa(`admin:${STATS_PASSWORD}`)}` } };
  for (const q of ['', '?p=today', '?p=30d', '?p=all', '?since=2026-09-26']) {
    const res = await fetch(`${BASE}/stats/${q}`, auth);
    assert.equal(res.status, 200, q);
  }
  const page = await (await fetch(`${BASE}/stats/?p=today`, auth)).text();
  assert.ok(/<b>\d+<\/b>gifts opened/.test(page) && /<b>[\d.]+%<\/b>reply rate/.test(page));
  step('stats page needs the password and renders every period');
} else {
  assert.equal(stats.status, 404);
  step('stats page is switched off without a password');
}

console.log('\nAll checks passed.');
