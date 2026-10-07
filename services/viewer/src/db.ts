import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Idempotent: runs on every start. legacy_id keeps imported Django rows from being imported twice.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS wish_events (
  id         bigserial PRIMARY KEY,
  event      varchar(24) NOT NULL,
  kind       varchar(8)  NOT NULL DEFAULT '',
  wid        varchar(12) NOT NULL DEFAULT '',
  ref        varchar(12) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  legacy_id  integer UNIQUE
);
CREATE INDEX IF NOT EXISTS wish_events_created_idx ON wish_events (created_at);
CREATE INDEX IF NOT EXISTS wish_events_event_idx   ON wish_events (event);
CREATE INDEX IF NOT EXISTS wish_events_wid_idx     ON wish_events (wid);
CREATE INDEX IF NOT EXISTS wish_events_ref_idx     ON wish_events (ref);
`;

export async function migrate(): Promise<void> {
  // The database may still be starting when the server boots.
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query(SCHEMA);
      return;
    } catch (err) {
      if (attempt >= 10) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
