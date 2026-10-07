import { config } from './config.js';
import { pool } from './db.js';
import { EVENTS, KINDS } from './events.js';
import { escapeHtml } from './pages.js';
import { addDays, fmt, resolvePeriod } from './period.js';

const PERIODS: [string, string][] = [
  ['today', 'Today'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['all', 'All time'],
];

export async function renderStats(query: { p?: string; since?: string }): Promise<string> {
  const tz = config.timezone;
  const localDay = `(created_at AT TIME ZONE $1)::date`;
  const today: string = (await pool.query(`SELECT to_char((now() AT TIME ZONE $1)::date, 'YYYY-MM-DD') AS d`, [tz]))
    .rows[0].d;
  const { period, since } = resolvePeriod(today, query.p, query.since);
  const inPeriod = `($2::date IS NULL OR ${localDay} >= $2::date)`;

  const counts = await pool.query<{ event: string; kind: string; n: number }>(
    `SELECT event, COALESCE(NULLIF(kind, ''), 'bday') AS kind, count(*)::int AS n
     FROM wish_events WHERE ${inPeriod} GROUP BY 1, 2`,
    [tz, since],
  );
  const byEvent = new Map<string, Record<string, number>>();
  for (const r of counts.rows) byEvent.set(r.event, { ...byEvent.get(r.event), [r.kind]: r.n });

  // Opened in the period; replies are counted from all time, as on the old page.
  const opened = new Set(
    (
      await pool.query<{ wid: string }>(
        `SELECT DISTINCT wid FROM wish_events WHERE event = 'start' AND wid <> '' AND ${inPeriod}`,
        [tz, since],
      )
    ).rows.map((r) => r.wid),
  );
  const replied = new Set(
    (await pool.query<{ ref: string }>(`SELECT DISTINCT ref FROM wish_events WHERE event = 'link_created' AND ref <> ''`))
      .rows.map((r) => r.ref),
  );
  const sentBack = [...opened].filter((w) => replied.has(w)).length;
  const replyRate = opened.size ? Math.round((sentBack / opened.size) * 1000) / 10 : 0;
  const created = byEvent.get('link_created')
    ? Object.values(byEvent.get('link_created')!).reduce((a, b) => a + b, 0)
    : 0;

  let first = since;
  if (!first) {
    const r = await pool.query<{ d: string | null }>(
      `SELECT to_char(min(${localDay}), 'YYYY-MM-DD') AS d FROM wish_events`,
      [tz],
    );
    first = r.rows[0].d ?? today;
  }
  if (first < addDays(today, -59)) first = addDays(today, -59);

  const perDay = await pool.query<{
    d: string;
    opened: number;
    created: number;
    replies: number;
    shared: number;
    media: number;
  }>(
    `SELECT to_char(${localDay}, 'YYYY-MM-DD') AS d,
            count(*) FILTER (WHERE event = 'start')::int AS opened,
            count(*) FILTER (WHERE event = 'link_created')::int AS created,
            count(*) FILTER (WHERE event = 'link_created' AND ref <> '')::int AS replies,
            count(*) FILTER (WHERE event IN ('wa_share', 'copy'))::int AS shared,
            count(*) FILTER (WHERE event IN ('photo_share', 'video_share'))::int AS media
     FROM wish_events WHERE ${localDay} >= $2::date GROUP BY 1`,
    [tz, first],
  );
  const dayMap = new Map(perDay.rows.map((r) => [r.d, r]));
  const days = [];
  for (let d = today; d >= first; d = addDays(d, -1)) {
    days.push(dayMap.get(d) ?? { d, opened: 0, created: 0, replies: 0, shared: 0, media: 0 });
  }
  const peak = Math.max(1, ...days.map((x) => Math.max(x.opened, x.created)));
  const pct = (n: number) => Math.round((n / peak) * 100);

  const periodLinks = PERIODS.map(
    ([key, label]) => `<a href="?p=${key}" class="${period === key ? 'on' : ''}">${label}</a>`,
  ).join('\n      ');
  const dayRows = days
    .map(
      (x) => `<tr class="${!x.opened && !x.created ? 'zero' : ''}">
        <td>${fmt(x.d, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
        <td class="n">${x.opened}</td><td class="n">${x.created}</td><td class="n">${x.replies}</td>
        <td class="n">${x.shared}</td><td class="n">${x.media}</td>
        <td class="chart"><div class="bar o" style="width:${pct(x.opened)}%"></div><div class="bar c" style="width:${pct(x.created)}%"></div></td>
      </tr>`,
    )
    .join('\n      ');
  const stepRows = EVENTS.map(
    ([key, label]) =>
      `<tr><td>${escapeHtml(label)}</td>${KINDS.map((k) => `<td class="n">${byEvent.get(key)?.[k] ?? 0}</td>`).join('')}</tr>`,
  ).join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Wish stats</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 620px; margin: 24px auto; padding: 0 16px; color: #222; }
    h2 { font-size: 1.1rem; margin: 28px 0 8px; }
    .periods { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 8px 0 4px; }
    .periods a { padding: 6px 12px; border-radius: 999px; background: #f1ecf6; color: #4a2a6a; text-decoration: none; font-size: 0.9rem; }
    .periods a.on { background: #6a1b9a; color: #fff; }
    .periods form { display: flex; gap: 4px; align-items: center; font-size: 0.9rem; }
    .periods input { font: inherit; padding: 4px; }
    .kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0 8px; }
    .kpi div { background: #f5f0fa; border-radius: 12px; padding: 10px; font-size: 0.85rem; }
    .kpi b { display: block; font-size: 1.6rem; }
    @media (max-width: 480px) { .kpi { grid-template-columns: repeat(2, 1fr); } }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 7px 5px; border-bottom: 1px solid #eee; }
    td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
    .bar { height: 8px; border-radius: 4px; background: #e0d4ee; min-width: 2px; }
    .bar.o { background: #ab47bc; }
    .bar.c { background: #ffb300; margin-top: 3px; }
    td.chart { width: 34%; }
    tr.zero td { color: #bbb; }
    small, .note { color: #777; }
    .legend span { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin: 0 4px 0 10px; }
  </style>
</head>
<body>
  <h1>🎁 AR wish stats</h1>

  <div class="periods">
      ${periodLinks}
    <form method="get">
      <label>since <input type="date" name="since" value="${period === 'since' && since ? since : ''}"></label>
      <button>Go</button>
    </form>
  </div>
  <p class="note">${since ? `Showing activity since ${fmt(since, { day: 'numeric', month: 'short', year: 'numeric' })}.` : 'Showing all activity.'}
    Your own phone isn’t counted after you open <code>wish.inixr.com/?me=1</code> once.</p>

  <div class="kpi">
    <div><b>${opened.size}</b>gifts opened</div>
    <div><b>${created}</b>new links made</div>
    <div><b>${sentBack}</b>got a reply back</div>
    <div><b>${replyRate}%</b>reply rate</div>
  </div>

  <h2>📅 Day by day</h2>
  <p class="legend"><small><span style="background:#ab47bc"></span>opened <span style="background:#ffb300"></span>new links made</small></p>
  <table>
    <thead><tr><th>Day</th><th class="n">Opened</th><th class="n">Made</th><th class="n">Replies</th><th class="n">Shared</th><th class="n">Photo/video shared</th><th></th></tr></thead>
    <tbody>
      ${dayRows}
    </tbody>
  </table>

  <h2>🔍 Each step, by gift type</h2>
  <table>
    <thead><tr><th>Step</th><th class="n">🎂</th><th class="n">💖</th><th class="n">💞</th><th class="n">🏆</th></tr></thead>
    <tbody>
      ${stepRows}
    </tbody>
  </table>
  <p><small>🎂 Birthday · 💖 Thank you · 💞 Reaction · 🏆 Award. “Creator opened” is counted under the tab the page starts on.
    Anonymous counts only — no names or messages are stored. Target reply rate: above 15–20%.</small></p>
</body>
</html>`;
}
