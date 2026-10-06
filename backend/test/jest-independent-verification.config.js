module.exports = {
  ...require('./jest-integration.config'),
  testMatch: ['<rootDir>/test/independent-verification/**/*.spec.ts'],
};
