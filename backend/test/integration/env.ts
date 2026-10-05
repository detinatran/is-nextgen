// Test environment — must be set before any app code loads.
process.env['NODE_ENV'] = 'test';
// DATABASE_URL is explicit and checked by global-setup/resetDatabase.
process.env['WORKERS_DISABLED'] = '1';
process.env['MEDIA_STORAGE_DIR'] = './.data/test-media';
process.env['FIXTURES_ENABLED'] = 'true';
process.env['FIXTURES_TOKEN'] = 'test-fixtures-token';
process.env['SWAGGER_ENABLED'] = 'false';
process.env['COOKIE_SECURE'] = 'false';

export {};
