import configuration from '../../src/config/configuration';
import { assertDisposableTestDatabase } from '../integration/assert-disposable-database';

describe('review safety regression', () => {
  const initial = { ...process.env };
  afterEach(() => { process.env = { ...initial }; });
  it('production fixtures remain disabled even with a mistaken enabled flag', () => {
    process.env['NODE_ENV'] = 'production'; process.env['FIXTURES_ENABLED'] = 'true';
    process.env['COOKIE_SECURE'] = 'false';
    expect(configuration().fixturesEnabled).toBe(false);
    expect(configuration().cookieSecure).toBe(true);
  });
  it('refuses shared application database even with an explicit test marker', () => {
    process.env['ISNEXTGEN_DISPOSABLE_TEST'] = '1';
    process.env['DATABASE_URL'] = 'postgresql://postgres:synthetic@localhost/isnextgen';
    expect(assertDisposableTestDatabase).toThrow('non-disposable');
  });
  it('refuses a test-looking database without an explicit marker', () => {
    delete process.env['ISNEXTGEN_DISPOSABLE_TEST'];
    process.env['DATABASE_URL'] = 'postgresql://postgres:synthetic@localhost/isnextgen_integration_test_unit';
    expect(assertDisposableTestDatabase).toThrow('marker');
  });
  it('accepts an explicitly marked disposable database', () => {
    process.env['ISNEXTGEN_DISPOSABLE_TEST'] = '1';
    process.env['DATABASE_URL'] = 'postgresql://postgres:synthetic@localhost/isnextgen_integration_test_unit';
    expect(assertDisposableTestDatabase()).toBe('isnextgen_integration_test_unit');
  });
});
