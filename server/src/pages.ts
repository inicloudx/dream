import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Kind } from './events.js';

const TEMPLATES = join(import.meta.dirname, '..', 'templates');
const VIEW = readFileSync(join(TEMPLATES, 'view.html'), 'utf8');
const CREATE = readFileSync(join(TEMPLATES, 'create.html'), 'utf8');

export const VIEW_PATHS: Record<Kind, string> = { bday: '/', ty: '/thanks/', rx: '/r/', aw: '/award/' };

// WhatsApp link-preview text per gift kind. The preview never contains names.
const OG: Record<Kind, { title: string; desc: string; image: string; pageTitle: string }> = {
  bday: {
    title: '🎁 A birthday surprise is waiting for you!',
    desc: 'Tap to open your 3D birthday cake 🎂 Light it, blow the candles!',
    image: 'og.png',
    pageTitle: 'A birthday surprise for you 🎁',
  },
  ty: {
    title: '💖 Someone sent you a special thank-you!',
    desc: 'Tap to open your 3D thank-you gift 🎁',
    image: 'og_thanks.png',
    pageTitle: 'A thank-you gift for you 💖',
  },
  rx: {
    title: '💞 You’ve got a special reaction!',
    desc: 'Tap to see it pop up in 3D, right in your room ✨',
    image: 'og_react.png',
    pageTitle: 'A reaction for you 💞',
  },
  aw: {
    title: '🏆 And the award goes to… YOU! 😂',
    desc: 'Your friends have an award for you. Tap to see the trophy 🥁',
    image: 'og_award.png',
    pageTitle: 'An award for you 🏆',
  },
};

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key: string) => escapeHtml(values[key] ?? ''));
}

function context(kind: Kind, base: string, path: string): Record<string, string> {
  const og = OG[kind];
  return {
    kind,
    og_title: og.title,
    og_desc: og.desc,
    page_title: og.pageTitle,
    og_image: `${base}/static/wish/${og.image}`,
    og_url: base + path,
    view_url: base + VIEW_PATHS.bday,
    thanks_url: base + VIEW_PATHS.ty,
    react_url: base + VIEW_PATHS.rx,
    award_url: base + VIEW_PATHS.aw,
  };
}

export const renderView = (kind: Kind, base: string) => fill(VIEW, context(kind, base, VIEW_PATHS[kind]));
export const renderCreate = (base: string) => fill(CREATE, context('bday', base, '/create/'));
