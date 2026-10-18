import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanName, ogTitle, renderView } from './pages.js';

test('names are trimmed, shortened and stripped of markup and control characters', () => {
  assert.equal(cleanName('  Nithy  '), 'Nithy');
  assert.equal(cleanName('Gokul<script>'), 'Gokul script');
  assert.equal(cleanName('a\u0000b\nc'), 'a b c');
  assert.equal(cleanName('x'.repeat(40)).length, 24);
  assert.equal(cleanName(undefined), '');
  assert.equal(cleanName(['array']), '');
  assert.equal(cleanName('நித்யா'), 'நித்யா');
});

test('preview title is personal only when both names are present', () => {
  assert.equal(ogTitle('pj', { from: 'Nithy', to: 'Gokul' }), '🪔 Nithy sent you a Pooja gift, Gokul!');
  assert.equal(ogTitle('aw', { from: 'Nithy', to: 'Gokul' }), '🏆 Nithy gives a special award to Gokul! 😂');
  assert.equal(ogTitle('pj', { from: 'Nithy', to: '' }), '🪔 A special Pooja surprise is waiting for you ✨');
});

test('rendered page escapes names and keeps them out of the canonical address', () => {
  const html = renderView('pj', 'https://dream.example', { from: 'A"B', to: 'Gokul' });
  assert.ok(html.includes('content="🪔 A&quot;B sent you a Pooja gift, Gokul!"'));
  assert.ok(html.includes('property="og:url" content="https://dream.example/pooja/"'));
});
