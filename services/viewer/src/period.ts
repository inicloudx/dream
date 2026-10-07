// Dates travel as 'YYYY-MM-DD' strings; arithmetic happens in UTC so no local clock can shift them.
export const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const fmt = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

/** Picks the period from ?p= / ?since=, falling back to the last 7 days, like the Django page. */
export function resolvePeriod(today: string, p?: string, sinceParam?: string): { period: string; since: string | null } {
  if (sinceParam && /^\d{4}-\d{2}-\d{2}$/.test(sinceParam) && !Number.isNaN(Date.parse(sinceParam))) {
    return { period: 'since', since: sinceParam };
  }
  switch (p ?? '7d') {
    case 'today':
      return { period: 'today', since: today };
    case '30d':
      return { period: '30d', since: addDays(today, -29) };
    case 'all':
      return { period: 'all', since: null };
    default:
      return { period: '7d', since: addDays(today, -6) };
  }
}
