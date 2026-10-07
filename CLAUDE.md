# dream (working name) — AR + social platform

AR gifts and cards shared on WhatsApp. The link opens in the phone browser, the gift appears in the
room through the camera, and the receiver can react or send something back. This repository replaces
the `wish` app inside the iNiXR website (`C:\ini_website\ini-website-main\wish`, Django on Oracle),
and is the owner's Azure learning project (goal: Azure Architect / Senior DevOps roles).

## How we work

- Claude writes code, Dockerfiles and (later) Bicep. The owner does every Azure step, Portal first,
  with a full field-by-field list for each form and a plain-language "why".
- Azure steps are recorded in `docs/azure-journal.md` as they happen.
- Discuss major product or design decisions before coding.

## Product direction (agreed 2026-10-06)

- **Stage 1 — web at wish.inixr.com:** current gifts (birthday, thanks, reactions, awards) moved as they
  are, then Ayudha/Saraswathi Pooja (20 Oct 2026) and Diwali (8 Nov 2026).
- **Then:** everything becomes **template-based** — a template is data (glTF models + a description
  file) stored in Blob Storage, never hard-coded, so new templates ship without an app update and can
  be sold later. Cards stored on the server, comments on cards/invitations, wedding invitations.
- **Stage 2 — Android app in Unity** for the full, realistic AR (floor anchoring, lighting, recording,
  gifts that unlock at midnight, reaction videos only with the receiver's explicit permission each time).
  The web viewer (three.js) stays as the no-install preview. Both read the same template format.
- **Later:** template store, 3D gift catalogue, holograms (parked).
- Main inixr.com website, Seyalini and Earnly stay on the Oracle server. Do not touch Earnly.

## Architecture

**Separate services, not one integrated app** — read `docs/architecture.md` before adding anything.
Each service has its own container and its own database; services talk through APIs and events only.
Planned services: Viewer (exists), Templates, Accounts, Cards, Connections, Feed, Chats, Circles, Media,
Notifications. Feed/privacy rules (both sides agree before a gift is shared; no children on the public
feed) are in that document.

## Layout

| Path | What it is |
|---|---|
| `services/viewer/src` | Viewer service, Node.js + TypeScript (Fastify): gift pages, event beacons, stats |
| `services/viewer/templates` | `view.html` (all gift types) and `create.html`, with `{{placeholders}}` |
| `services/viewer/public/wish` | The 3D experience: `wish.js` (three.js), `create.js`, `wish.css`, WhatsApp preview images |
| `services/viewer/scripts/import-events.mjs` | Imports the old Django stats history (`dumpdata` JSON) |
| `scripts/smoke.mjs` | End-to-end check of a running viewer |
| `docs/architecture.md` | Services, rules, build order, Azure resource map |

New services go in `services/<name>/`, each with its own `package.json` and `Dockerfile`.

## Viewer routes

`/` birthday · `/thanks/` · `/r/` reactions · `/award/` · `/create/` · `/e/` event beacon (POST) ·
`/stats/` (Basic auth, user `admin`, password from `STATS_PASSWORD`) · `/health` · `/static/...`

## Rules carried over from the Django app

- Names and messages live only in the link's `#fragment` and are never stored. The server keeps
  anonymous event counts only (`wish_events`), same event names as the old `WishEvent` model.
- Phones cache static files for 30 days: when `wish.js`, `create.js` or `wish.css` change, bump the
  `?v=N` in `services/viewer/templates/view.html` and `create.html`.
- `?me=1` once per phone stops that phone being counted (handled in the browser).

## Commands

- Run locally: `docker compose up --build -d` → http://localhost:4100 (needs `.env`, see `.env.example`)
- Unit tests: `npm test` in `services/viewer`; type check: `npm run typecheck`
- End-to-end: `node scripts/smoke.mjs http://localhost:4100 <stats password>`
