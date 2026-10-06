// Imports the old site's stats history into the new database.
//
// 1. On the Oracle server, export the old events:
//      docker compose exec -T web python manage.py dumpdata wish.wishevent > wish_events.json
// 2. Copy wish_events.json to this PC.
// 3. Run, with DATABASE_URL pointing at the target database:
//      node scripts/import-events.mjs wish_events.json
//
// Safe to run more than once: rows already imported (same old id) are skipped.
import { readFileSync } from 'node:fs';
import pg from 'pg';

const file = process.argv[2];
if (!file || !process.env.DATABASE_URL) {
  console.error('Usage: DATABASE_URL=... node scripts/import-events.mjs <dumpdata.json>');
  process.exit(1);
}

const rows = JSON.parse(readFileSync(file, 'utf8')).filter((r) => r.model === 'wish.wishevent');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let added = 0;
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500);
  const values = [];
  const params = [];
  batch.forEach((r, j) => {
    const f = r.fields;
    params.push(r.pk, f.event, f.kind ?? '', f.wid ?? '', f.ref ?? '', f.created_at);
    const o = j * 6;
    values.push(`($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6})`);
  });
  const res = await pool.query(
    `INSERT INTO wish_events (legacy_id, event, kind, wid, ref, created_at) VALUES ${values.join(', ')}
     ON CONFLICT (legacy_id) DO NOTHING`,
    params,
  );
  added += res.rowCount;
}
console.log(`Read ${rows.length} old events, added ${added} (the rest were already imported).`);
await pool.end();
