export interface AppConfig {
  env: string;
  port: number;
  databaseUrl: string;
  cookieSecure: boolean;
  sessionTtlHours: number;
  reauthWindowSeconds: number;
  mediaStorageDir: string;
  uploadMaxBytes: number;
  videoMaxDurationSeconds: number;
  photoMaxBytes: number;
  contactEmail: string;
  smtpUrl: string;
  mailFrom: string;
  fixturesEnabled: boolean;
  fixturesToken: string;
  swaggerEnabled: boolean;
  rateLimitGlobalPerMin: number;
  rateLimitAuthPerMin: number;
  timeoutSweepIntervalMs: number;
  scoringPollIntervalMs: number;
  notificationPollIntervalMs: number;
}

const bool = (v: string | undefined, dflt: boolean): boolean =>
  v === undefined || v === '' ? dflt : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());

const num = (v: string | undefined, dflt: number): number => {
  const n = v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : dflt;
};

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 3001),
  databaseUrl: process.env.DATABASE_URL ?? '',
  // Production must never send the session cookie over plaintext.
  cookieSecure: process.env.NODE_ENV === 'production' ? true : bool(process.env.COOKIE_SECURE, false),
  sessionTtlHours: num(process.env.SESSION_TTL_HOURS, 24),
  reauthWindowSeconds: num(process.env.REAUTH_WINDOW_SECONDS, 300),
  mediaStorageDir: process.env.MEDIA_STORAGE_DIR ?? './.data/media',
  uploadMaxBytes: num(process.env.UPLOAD_MAX_BYTES, 500_000_000),
  videoMaxDurationSeconds: num(process.env.VIDEO_MAX_DURATION_SECONDS, 120),
  photoMaxBytes: num(process.env.PHOTO_MAX_BYTES, 10_000_000),
  contactEmail: process.env.CONTACT_EMAIL ?? 'btc@isnextgen.local',
  smtpUrl: process.env.SMTP_URL ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'NextGen Manager <nextgen@vnuis.edu.vn>',
  fixturesEnabled: process.env.NODE_ENV !== 'production' && bool(process.env.FIXTURES_ENABLED, true),
  fixturesToken: process.env.FIXTURES_TOKEN ?? 'dev-fixtures-token',
  swaggerEnabled: bool(process.env.SWAGGER_ENABLED, process.env.NODE_ENV !== 'production'),
  rateLimitGlobalPerMin: num(process.env.RATE_LIMIT_GLOBAL_PER_MIN, 300),
  rateLimitAuthPerMin: num(process.env.RATE_LIMIT_AUTH_PER_MIN, 30),
  timeoutSweepIntervalMs: num(process.env.TIMEOUT_SWEEP_INTERVAL_MS, 10_000),
  scoringPollIntervalMs: num(process.env.SCORING_POLL_INTERVAL_MS, 2_000),
  notificationPollIntervalMs: num(process.env.NOTIFICATION_POLL_INTERVAL_MS, 2_000),
});
