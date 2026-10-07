/** Contract tests: HTTP boundary snapshots for the future Next.js frontend. */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/test/contract/**/*.spec.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  testTimeout: 60_000,
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  setupFiles: ['<rootDir>/test/integration/env.ts'],
};
