/** Required before migrations or destructive resets; never fall back to the app DB. */
export function assertDisposableTestDatabase(): string {
  if (process.env['ISNEXTGEN_DISPOSABLE_TEST'] !== '1') {
    throw new Error('Explicit disposable-test marker is required');
  }
  const url = new URL(process.env['DATABASE_URL'] ?? '');
  const name = url.pathname.slice(1);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !/^isnextgen_(post_zcode_test|integration_test|schema_test)_[a-z0-9_]+$/.test(name)) {
    throw new Error('Refusing migrations/reset on a non-disposable database');
  }
  return name;
}
