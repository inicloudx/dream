function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  // Stats page login (user "admin"). When unset the stats page is switched off.
  statsPassword: process.env.STATS_PASSWORD || null,
  // Day boundaries on the stats page follow Indian time, as on the old Django site.
  timezone: process.env.STATS_TIMEZONE ?? 'Asia/Kolkata',
};
