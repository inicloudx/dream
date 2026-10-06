# iNiXR Wish

AR gifts shared on WhatsApp. No app install: the link opens in the phone browser, the gift appears in
the room through the camera, and the receiver can react or send something back.

Moving from `inixr.com/wish` (Django on the Oracle server) to its own home at **wish.inixr.com** on Azure.

## Pages

| Address | What it is |
|---|---|
| `/create/` | Creator: 🎂 Birthday · 💖 Thanks · 💞 Love · 🏆 Awards |
| `/#d=…` | 🎂 Birthday cake |
| `/thanks/#d=…` | 💖 Thank-you gift box |
| `/r/#d=…` | 💞 Reaction |
| `/award/#d=…` | 🏆 Fun award |
| `/stats/` | Stats (login: `admin` + the stats password) |

Names and messages live only inside the link (after `#`) and are never stored. The server keeps
anonymous counts only.

## Run it on your PC

Copy `.env.example` to `.env`, fill in the values, start Docker Desktop, then:

```bash
docker compose up --build -d
```

Open http://localhost:4100/create/

Check everything works:

```bash
node scripts/smoke.mjs http://localhost:4100 YOUR_STATS_PASSWORD
```

## Bring over the old stats

On the Oracle server, export the old events:

```bash
docker compose exec -T web python manage.py dumpdata wish.wishevent > wish_events.json
```

Copy `wish_events.json` to this PC, then from the `server` folder (with `DATABASE_URL` set to the
target database):

```bash
node scripts/import-events.mjs wish_events.json
```

It is safe to run twice; rows already imported are skipped.
