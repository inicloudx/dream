import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseEvent } from './events.js';
import { resolvePeriod } from './period.js';

test('valid beacon string is accepted and normalised', () => {
  assert.deepEqual(parseEvent('{"e":"start","k":"ty","i":"AB12cd","r":""}'), {
    event: 'start',
    kind: 'ty',
    wid: 'ab12cd',
    ref: '',
  });
});

test('JSON object body is accepted too', () => {
  assert.deepEqual(parseEvent({ e: 'link_created', k: '', i: 'x1', r: 'y2' }), {
    event: 'link_created',
    kind: '',
    wid: 'x1',
    ref: 'y2',
  });
});

test('unknown events, kinds and odd ids are rejected', () => {
  assert.equal(parseEvent('{"e":"hack","k":""}'), null);
  assert.equal(parseEvent('{"e":"open","k":"zz"}'), null);
  assert.equal(parseEvent('{"e":"open","k":"","i":"bad id!"}'), null);
  assert.equal(parseEvent('not json'), null);
  assert.equal(parseEvent('x'.repeat(600)), null);
  assert.equal(parseEvent(null), null);
});

test('periods match the old stats page', () => {
  assert.deepEqual(resolvePeriod('2026-10-06', undefined, undefined), { period: '7d', since: '2026-09-30' });
  assert.deepEqual(resolvePeriod('2026-10-06', 'today'), { period: 'today', since: '2026-10-06' });
  assert.deepEqual(resolvePeriod('2026-10-06', '30d'), { period: '30d', since: '2026-09-07' });
  assert.deepEqual(resolvePeriod('2026-10-06', 'all'), { period: 'all', since: null });
  assert.deepEqual(resolvePeriod('2026-10-06', 'all', '2026-09-26'), { period: 'since', since: '2026-09-26' });
  assert.deepEqual(resolvePeriod('2026-10-06', 'bogus'), { period: '7d', since: '2026-09-30' });
});
