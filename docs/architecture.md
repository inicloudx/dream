# Architecture

Working name **dream** (final brand not chosen). An AR + social platform: template-based AR gifts,
cards and invitations, shared on WhatsApp, with friends, a feed, chats and groups.

## Principle: separate services, one home

The Azure resource group is the home. Each feature is its own **service** — its own container, its own
database, deployed and upgraded on its own. Services never read another service's database; they ask
through its API or react to its events. If one service is down, the others keep working.

```
        Unity app (full AR)          Web viewer (three.js, no install)
                 \                         /
                  \                       /
                   ──── API gateway ──────            (one public address)
          ┌───────┬────────┬───────┬─────────┬────────┬───────┬───────┬───────┬──────────────┐
       Accounts Templates Cards Connections Feed   Chats  Circles Media Notifications  Viewer
          │        │        │        │        │       │       │      │        │            │
         db       db       db       db       db      db      db   Blob      (queue)      db
                                  ↕ events on a message bus (e.g. "gift.opened") ↕
```

## Services

| Service | Owns | Example |
|---|---|---|
| **Viewer** (exists) | The web gift pages, creator, anonymous stats | Opening a WhatsApp link shows the gift in the room |
| **Templates** | Catalogue of templates as data: glTF models, music, layout, text slots, effects. Stored in Blob Storage, served via CDN | A new "Pongal" template appears without any code or app update |
| **Accounts** | Registration and login: Google/Microsoft sign-in fills the email automatically; mobile number later | Priya taps "Sign in with Google" |
| **Cards** | Cards made from templates, share links, scheduled unlock (e.g. midnight), reactions on cards | A Diwali card that opens at 12 |
| **Connections** | Friends (mutual accept) first; follow (one-way, for creators/brands) later | Karthik and Priya become friends |
| **Feed** | Feed built from gifts both sides agreed to share; "send this to someone / save template / buy" actions | Seeing a friend's birthday surprise and sending the same template |
| **Chats** | One-to-one and group messages, AR reactions | Amma replies with a 3D hug |
| **Circles** | Groups and their members (name not final: Circles / Kootam / Squads) | The wedding guest list |
| **Media** | Photos, videos, reaction recordings | Amma's reaction video |
| **Notifications** | Phone alerts | "Karthik sent you a gift 🎁" |

## Rules that hold across services

- **Templates are data, never code.** The Unity app and the web viewer read the same template format.
- **Private by default.** A gift between A and B goes on the feed only when **both** agree, at the audience
  they choose: only us / friends / everyone.
- **No children's faces on the public feed.** Posts showing a child can be shared with friends only.
  Everything public is screened (Azure AI Content Safety) first.
- **Names can be hidden** when a gift goes public.
- **Reaction recording** happens only after the receiver taps "Allow" each time, previews the clip, and
  chooses to send it.
- **Portable core.** Containers + PostgreSQL run anywhere; Azure-only services sit at the edges so the
  platform can move to cheaper hosting later.

## Data

One PostgreSQL server, **one database per service** (`viewer`, `accounts`, `cards`, …). Each service keeps
its own data while paying for a single server. Media and template files live in Blob Storage.

## Build order

Each service must work before the next starts.

1. **Viewer** — current gifts on Azure at `<name>.inixr.com`; stats history imported; old links redirected.
2. **Templates** — existing gifts become templates; Ayudha/Saraswathi Pooja (20 Oct 2026), Diwali (8 Nov 2026).
3. **Accounts** — Google sign-in.
4. **Cards** — saved cards, midnight gifts, reactions on cards.
5. **Connections + Feed**
6. **Chats + Circles**
7. **Media + Notifications**
8. **Unity app** (Android first), alongside the services above as they become ready.

## Azure (rebuilt from scratch, 2026-10-07)

| Resource | Name | Role in the home |
|---|---|---|
| Resource group | `rg-dream-dev-cin` (Central India) | The home |
| Policy | Allowed locations = Central India, **subscription scope** | House rules, inherited by every resource group |
| Log Analytics workspace | `log-dream-dev-cin` | The diary every record is written to |
| Application Insights | `appi-dream-dev-cin` | The CCTV watching the services, writing into that diary |
| Container Registry | `crdreamdev` (Basic, admin user **off**) | Storeroom for service images; apps pull with their own identity |
| Next | PostgreSQL server, Key Vault, App Service + managed identity, custom domain | |
