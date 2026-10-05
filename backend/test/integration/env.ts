// Test environment — must be set before any app code loads.
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] =
  process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:5432/isnextgen?schema=public';
process.env['WORKERS_DISABLED'] = '1';
process.env['MEDIA_STORAGE_DIR'] = './.data/test-media';
process.env['FIXTURES_ENABLED'] = 'true';
process.env['FIXTURES_TOKEN'] = 'test-fixtures-token';
process.env['SWAGGER_ENABLED'] = 'false';
process.env['COOKIE_SECURE'] = 'false';

export {};
