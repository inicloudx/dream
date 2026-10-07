// Anonymous funnel events. Same names as the Django WishEvent model, so old data imports unchanged.
// No names or messages are ever stored: those live only in the link's #fragment.
export const EVENTS: [string, string][] = [
  ['open', 'Link opened'],
  ['start', 'Tapped open'],
  ['cam_ok', 'Camera allowed'],
  ['cam_denied', 'Camera denied'],
  ['lit', 'Lit the candles'],
  ['song_done', 'Song finished'],
  ['mic_ok', 'Mic allowed'],
  ['mic_denied', 'Mic denied'],
  ['blown', 'Candles blown out'],
  ['gift_open', 'Opened the gift'],
  ['heart_pop', 'Popped a heart'],
  ['room', 'Room view'],
  ['selfie', 'Selfie view'],
  ['photo', 'Took photo'],
  ['photo_share', 'Shared photo'],
  ['video', 'Recorded video'],
  ['video_share', 'Shared video'],
  ['react', 'Sent a quick reaction'],
  ['replay', 'Replay'],
  ['send_back', 'Tapped "send something back"'],
  ['create_open', 'Creator opened'],
  ['link_created', 'Wish link created'],
  ['wa_share', 'Shared to WhatsApp'],
  ['copy', 'Copied link'],
];

export const KINDS = ['bday', 'ty', 'rx', 'aw'] as const;
export type Kind = (typeof KINDS)[number];

const EVENT_NAMES = new Set(EVENTS.map(([name]) => name));
const KIND_NAMES = new Set<string>([...KINDS, '']);
const ID = /^[a-z0-9]{0,12}$/;

export type TrackedEvent = { event: string; kind: string; wid: string; ref: string };

/** Validates a beacon from the browser ({e, k, i, r}); returns null when it should be rejected. */
export function parseEvent(raw: unknown): TrackedEvent | null {
  let data: unknown = raw;
  if (typeof raw === 'string') {
    if (raw.length > 512) return null;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const event = String(d.e ?? '');
  const kind = String(d.k ?? '');
  const wid = String(d.i ?? '').slice(0, 12).toLowerCase();
  const ref = String(d.r ?? '').slice(0, 12).toLowerCase();
  if (!EVENT_NAMES.has(event) || !KIND_NAMES.has(kind) || !ID.test(wid) || !ID.test(ref)) return null;
  return { event, kind, wid, ref };
}
