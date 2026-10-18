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

`/` birthday · `/thanks/` · `/r/` reactions · `/award/` · `/pooja/` · `/create/` · `/e/` event beacon (POST) ·
`/stats/` (Basic auth, user `admin`, password from `STATS_PASSWORD`) · `/health` · `/static/...`

## Rules carried over from the Django app

- The message lives only in the link's `#fragment`. Since October 2026 (owner's decision) the two short first
  names are **also** in the query (`?f=Nithy&t=Gokul`) so the WhatsApp preview can say "Nithy sent you a Pooja
  gift, Gokul!". The server never stores them: Fastify's request log and the OpenTelemetry span record the path
  only, and pages send `Referrer-Policy: origin`. Keep it that way for any new route. The server keeps anonymous
  event counts only (`wish_events`), same event names as the old `WishEvent` model.
- Phones cache static files for 30 days: when `wish.js`, `create.js` or `wish.css` change, bump the
  `?v=N` in `services/viewer/templates/view.html` and `create.html`.
- `?me=1` once per phone stops that phone being counted (handled in the browser).
- Static file version is currently `?v=20`. `teaser.js` is the 3D gift-opening teaser on the creator page.
- Gifts open in 3D with no camera prompt; "See it in your room" is an invitation shown after the reveal (people fear links that ask for the camera). Never start the camera without a tap.
- Names are optional. "Quick share" (default for Pooja and Love) sends one nameless link to many people; `readWish` must accept empty `to`/`from`, so any new text that uses `W.to` needs a nameless fallback.

## Pooja gift (kind `pj`, added 2026-10-15)

- Data in the fragment: `s` = `ay` (Ayudha) or `sar` (Saraswathi); `w` = work for Ayudha: `car`, `tools`, `it`,
  `factory`, `shop`, `farm`, `student`. Must match `POOJA_MODES`/`WORKS` in `wish.js` and `create.js`.
- Saraswathi is shown through her symbols only (veena, books + laptop, lotus, white swan), never as a figure.
- Text is English + Tamil. Funny Pooja replies (`sundal`, `bikewash`, `laptop`, `pori`, `sweets`) are reactions
  (`rx`) reusing existing emoji faces.
- The creator opens on the Pooja tab until 23 Oct 2026 (`SEASON_KIND` in `create.js`), then Birthday again.

## Commands

- Run locally: `docker compose up --build -d` → http://localhost:4100 (needs `.env`, see `.env.example`)
- Unit tests: `npm test` in `services/viewer`; type check: `npm run typecheck`
- End-to-end: `node scripts/smoke.mjs http://localhost:4100 <stats password>`
- CI/CD: `azure-pipelines/viewer.yml` (Azure DevOps). Push to `main` touching `services/viewer` → tests → image
  `viewer:v<build number>` → `az webapp sitecontainers update` → `scripts/wait-healthy.mjs`. Runs on the self-hosted
  agent in pool `Default` (owner's PC, Docker Desktop must be running) until the hosted-agent grant arrives; then
  run with `selfHosted: false`. Service connection: `sc-dream-dev` (workload identity federation).
