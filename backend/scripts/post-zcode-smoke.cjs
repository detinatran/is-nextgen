// Disposable review stack only. Never prints cookies, passwords, OTP or profiles.
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const fs = require('node:fs');
const url = new URL(process.env.DATABASE_URL);
if (!/^isnextgen_post_zcode_test_[a-z0-9_]+$/.test(url.pathname.slice(1))) {
  throw new Error('Smoke fixture refuses a non-review database');
}
const base = 'http://isng-pz-20261005-final:3001/api/v1';
const checks = [];
function check(name, ok, status) { checks.push({ name, ok, status }); if (!ok) process.exitCode = 1; }
async function ready() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`${base}/health/ready`); if ((await r.json()).status === 'ok') return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Smoke readiness timed out');
}
async function main() {
  await ready();
  if (process.env.SMOKE_PHASE === 'restart') {
    const session = JSON.parse(fs.readFileSync('/tmp/review-cookie.json', 'utf8'));
    const cookie = `${session.cookie}; ${session.csrfCookie}`;
    const assignments = await fetch(`${base}/me/assignments`, { headers: { Cookie: cookie } });
    check('opaque PostgreSQL session survives actual Docker restart', assignments.status === 200, assignments.status);
    const missing = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
    check('production logout missing CSRF denied', missing.status === 403, missing.status);
    const invalid = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: cookie, 'x-csrf-token': 'invalid' } });
    check('production logout invalid CSRF denied', invalid.status === 403, invalid.status);
    const valid = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: cookie, 'x-csrf-token': session.csrf } });
    check('production logout valid CSRF accepted', valid.status === 204, valid.status);
    const revoked = await fetch(`${base}/me/assignments`, { headers: { Cookie: cookie } });
    check('revoked session denied after logout', revoked.status === 401, revoked.status);
    fs.unlinkSync('/tmp/review-cookie.json');
  } else {
    const prisma = new PrismaClient();
    try {
      const role = await prisma.roles.findUniqueOrThrow({ where: { code: 'STUDENT' } });
      const user = await prisma.users.create({ data: { email: 'production-smoke@example.com', email_normalized: 'production-smoke@example.com',
        status: 'ACTIVE', email_verified_at: new Date(), password_hash: await argon2.hash('Smoke4Review!Only') } });
      await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id } });
      await prisma.candidates.create({ data: { user_id: user.id } });
    } finally { await prisma.$disconnect(); }
    const config = await fetch(`${base}/registration-form-config`); const body = await config.json();
    check('withdrawal contact and one-year policy', body.consents.mediaUsage.withdrawalContactEmail === 'nextgen@vnuis.edu.vn' &&
      body.consents.mediaUsage.retention.period === 'P1Y' && body.consents.mediaUsage.defaultSelection === null, config.status);
    const fixtures = await fetch(`${base}/internal/fixtures/provision-user`, { method: 'POST', headers: {
      'Content-Type': 'application/json', 'x-fixtures-token': 'dev-fixtures-token' }, body: JSON.stringify({ email: 'never-created@example.com' }) });
    check('production fixtures denied even when enabled flag is supplied', fixtures.status === 403, fixtures.status);
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'production-smoke@example.com', password: 'Smoke4Review!Only' }) });
    const loginBody = await login.json(); const cookies = login.headers.getSetCookie();
    const raw = cookies.find((c) => c.startsWith('isng_session=')) ?? '';
    check('production session Secure HttpOnly SameSite=Lax', login.status === 200 && /; Secure/i.test(raw) && /; HttpOnly/i.test(raw) && /SameSite=Lax/i.test(raw), login.status);
    fs.writeFileSync('/tmp/review-cookie.json', JSON.stringify({ cookie: raw.split(';')[0],
      csrfCookie: cookies.find((c) => c.startsWith('isng_csrf=')).split(';')[0], csrf: loginBody.csrfToken }), { mode: 0o600 });
  }
  console.log(JSON.stringify({ phase: process.env.SMOKE_PHASE ?? 'initial', checks }));
}
main().catch(() => { console.error('Smoke failed; no sensitive details emitted'); process.exitCode = 1; });
