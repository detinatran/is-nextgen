// Synthetic disposable production smoke; output contains statuses and booleans only.
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const fs = require('node:fs');
const url = new URL(process.env.DATABASE_URL);
if (url.pathname !== '/isnextgen_post_zcode_test_pm_smoke_20261005') throw new Error('Unexpected smoke DB');
const base = 'http://isng-pm-20261005-prod:3001/api/v1';
const results = [];
const observations = [];
function check(name, ok, status) { results.push({ name, ok, status }); if (!ok) process.exitCode = 1; }
async function ready() {
  for (let i = 0; i < 150; i++) {
    try { const r = await fetch(`${base}/health/ready`); if ((await r.json()).status === 'ok') return; } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Readiness timeout');
}
async function main() {
  await ready();
  if (process.env.SMOKE_PHASE === 'restart') {
    const session = JSON.parse(fs.readFileSync('/tmp/pm-smoke-session.json', 'utf8'));
    const headers = { Cookie: `${session.cookie}; ${session.csrfCookie}` };
    check('Student durable session survives actual Docker restart', (await fetch(`${base}/me/assignments`, { headers })).status === 200);
    const p = new PrismaClient();
    try { const rows = await p.auth_sessions.findMany({ where: { user_id: session.adminId, revoked_at: null }, select: { mfa_verified_at: true } });
      observations.push({ name: 'Admin password-only session persists with no MFA evidence after restart', reproduced: rows.length > 0 && rows.every((r) => r.mfa_verified_at === null) });
    } finally { await p.$disconnect(); }
    let r = await fetch(`${base}/auth/logout`, { method: 'POST', headers }); check('missing CSRF denied', r.status === 403, r.status);
    r = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { ...headers, 'x-csrf-token': 'invalid' } }); check('invalid CSRF denied', r.status === 403, r.status);
    r = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { ...headers, 'x-csrf-token': session.csrf } }); check('valid CSRF logout', r.status === 204, r.status);
    r = await fetch(`${base}/me/assignments`, { headers }); check('revoked session denied', r.status === 401, r.status);
    fs.unlinkSync('/tmp/pm-smoke-session.json');
  } else {
    const p = new PrismaClient(); let adminId;
    try {
      for (const roleCode of ['STUDENT', 'ADMIN']) {
        const role = await p.roles.findUniqueOrThrow({ where: { code: roleCode } });
        const email = `${roleCode.toLowerCase()}-independent-smoke@example.com`;
        const u = await p.users.create({ data: { email, email_normalized: email, status: 'ACTIVE', email_verified_at: new Date(),
          mfa_enabled: roleCode === 'ADMIN', password_hash: await argon2.hash('Independent!Smoke42') } });
        await p.user_roles.create({ data: { user_id: u.id, role_id: role.id } });
        if (roleCode === 'STUDENT') await p.candidates.create({ data: { user_id: u.id } }); else adminId = u.id;
      }
    } finally { await p.$disconnect(); }
    let r = await fetch(`${base}/registration-form-config`); const config = await r.json();
    check('communication consent exact email / P1Y / no preselection', config.consents.mediaUsage.withdrawalContactEmail === 'nextgen@vnuis.edu.vn' &&
      config.consents.mediaUsage.retention.period === 'P1Y' && config.consents.mediaUsage.retention.anchor === 'OFFICIAL_COMPETITION_END' &&
      config.consents.mediaUsage.defaultSelection === null, r.status);
    r = await fetch(`${base}/internal/fixtures/provision-user`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-fixtures-token': 'dev-fixtures-token' }, body: JSON.stringify({ email: 'fixture-denied@example.com' }) });
    check('production fixtures forced off', r.status === 403, r.status);
    r = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'student-independent-smoke@example.com', password: 'Independent!Smoke42' }) });
    const body = await r.json(); const cookies = r.headers.getSetCookie(); const raw = cookies.find((c) => c.startsWith('isng_session=')) || '';
    check('Student login with Secure HttpOnly SameSite=Lax session', r.status === 200 && /; Secure/i.test(raw) && /; HttpOnly/i.test(raw) && /SameSite=Lax/i.test(raw), r.status);
    const ar = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'admin-independent-smoke@example.com', password: 'Independent!Smoke42' }) });
    const ab = await ar.json(); observations.push({ name: 'Admin password bypasses MFA_REQUIRED', reproduced: ar.status === 200 && ab.user?.roles?.includes('ADMIN') && !ab.challengeId && ar.headers.getSetCookie().some((c) => c.startsWith('isng_session=')) });
    fs.writeFileSync('/tmp/pm-smoke-session.json', JSON.stringify({ cookie: raw.split(';')[0], csrfCookie: cookies.find((c) => c.startsWith('isng_csrf=')).split(';')[0], csrf: body.csrfToken, adminId }), { mode: 0o600 });
  }
  console.log(JSON.stringify({ phase: process.env.SMOKE_PHASE || 'initial', checks: results, observations }));
}
main().catch(() => { console.error('Independent smoke failed; sensitive details suppressed'); process.exitCode = 1; });
