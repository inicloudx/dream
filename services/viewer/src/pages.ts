import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Kind } from './events.js';

const TEMPLATES = join(import.meta.dirname, '..', 'templates');
const VIEW = readFileSync(join(TEMPLATES, 'view.html'), 'utf8');
const CREATE = readFileSync(join(TEMPLATES, 'create.html'), 'utf8');

export const VIEW_PATHS: Record<Kind, string> = { bday: '/', ty: '/thanks/', rx: '/r/', aw: '/award/', pj: '/pooja/' };

// Short first names from the link's query (?f=Nithy&t=Gokul), used only to personalise the WhatsApp preview.
// They are never stored, and the server strips the query from its logs and monitoring.
export type Names = { from: string; to: string };

/** Keeps a short, printable name: no control characters, at most 24 characters. */
export function cleanName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 24);
}

type Og = {
  title: string;
  desc: string;
  image: string;
  pageTitle: string;
  /** Preview title when the link carries names. */
  named: (n: Names) => string;
};

// WhatsApp link-preview text per gift kind.
const OG: Record<Kind, Og> = {
  bday: {
    title: '🎁 A birthday surprise is waiting for you!',
    desc: 'Tap to open your 3D birthday cake 🎂 Light it, blow the candles!',
    image: 'og.png',
    pageTitle: 'A birthday surprise for you 🎁',
    named: ({ from, to }) => `🎁 ${from} sent you a birthday surprise, ${to}!`,
  },
  ty: {
    title: '💖 Someone sent you a special thank-you!',
    desc: 'Tap to open your 3D thank-you gift 🎁',
    image: 'og_thanks.png',
    pageTitle: 'A thank-you gift for you 💖',
    named: ({ from, to }) => `💖 ${from} sent you a special thank-you, ${to}!`,
  },
  rx: {
    title: '💞 You’ve got a special reaction!',
    desc: 'Tap to see it pop up in 3D, right in your room ✨',
    image: 'og_react.png',
    pageTitle: 'A reaction for you 💞',
    named: ({ from, to }) => `💞 ${from} sent you a special reaction, ${to}!`,
  },
  aw: {
    title: '🏆 And the award goes to… YOU! 😂',
    desc: 'Your friends have an award for you. Tap to see the trophy 🥁',
    image: 'og_award.png',
    pageTitle: 'An award for you 🏆',
    named: ({ from, to }) => `🏆 ${from} gives a special award to ${to}! 😂`,
  },
  pj: {
    title: '🪔 A special Pooja surprise is waiting for you ✨',
    desc: 'Ayudha & Saraswathi Pooja wishes 🙏 Tap to light the lamp · ஆயுத பூஜை & சரஸ்வதி பூஜை வாழ்த்துக்கள்',
    image: 'og_pooja.jpg',
    pageTitle: 'A Pooja gift for you 🪔',
    named: ({ from, to }) => `🪔 ${from} sent you a Pooja gift, ${to}!`,
  },
};

/** The WhatsApp preview title: personal when both names are present, generic otherwise. */
export function ogTitle(kind: Kind, names: Names): string {
  return names.from && names.to ? OG[kind].named(names) : OG[kind].title;
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key: string) => escapeHtml(values[key] ?? ''));
}

function context(kind: Kind, base: string, path: string, names: Names): Record<string, string> {
  const og = OG[kind];
  return {
    kind,
    og_title: ogTitle(kind, names),
    og_desc: og.desc,
    page_title: og.pageTitle,
    og_image: `${base}/static/wish/${og.image}`,
    // The canonical address leaves the names out.
    og_url: base + path,
    view_url: base + VIEW_PATHS.bday,
    thanks_url: base + VIEW_PATHS.ty,
    react_url: base + VIEW_PATHS.rx,
    award_url: base + VIEW_PATHS.aw,
    pooja_url: base + VIEW_PATHS.pj,
  };
}

const NO_NAMES: Names = { from: '', to: '' };

export const renderView = (kind: Kind, base: string, names: Names = NO_NAMES) =>
  fill(VIEW, context(kind, base, VIEW_PATHS[kind], names));
export const renderCreate = (base: string) => fill(CREATE, context('pj', base, '/create/', NO_NAMES));
