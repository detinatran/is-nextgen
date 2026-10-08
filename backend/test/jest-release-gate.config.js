module.exports = {
  ...require('./jest-integration.config'),
  testMatch: ['<rootDir>/test/release-gate/**/*.spec.ts'],
};
