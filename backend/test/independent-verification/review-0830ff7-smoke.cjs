const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
if (new URL(process.env.DATABASE_URL).pathname !== '/isnextgen_post_zcode_test_v2_smoke_20261006') throw new Error('Unexpected isolated smoke DB');
const base = 'http://isng-v2-20261006-prod:3001/api/v1';
const checks = [];
function check(name, ok, status) { checks.push({ name, ok, status }); if (!ok) process.exitCode = 1; }
async function ready() {
  for (let i = 0; i < 150; i++) {
    try { const r = await fetch(`${base}/health/ready`); if ((await r.json()).status === 'ok') return; } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Production readiness timeout');
}
function extract(r, body) {
  const list = r.headers.getSetCookie();
  return { cookie: (list.find((s) => s.startsWith('isng_session=')) || '').split(';')[0],
    csrfCookie: (list.find((s) => s.startsWith('isng_csrf=')) || '').split(';')[0], csrf: body.csrfToken };
}
function headers(s) { return { Cookie: `${s.cookie}; ${s.csrfCookie}` }; }
async function post(path, body, extra = {}) {
  return fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });
}
async function main() {
  await ready();
  if (process.env.SMOKE_PHASE === 'restart') {
    const saved = JSON.parse(fs.readFileSync('/tmp/v2-smoke-session.json', 'utf8'));
    let r = await fetch(`${base}/me/assignments`, { headers: headers(saved.student) }); check('Student PG session survives Docker restart', r.status === 200, r.status);
    r = await fetch(`${base}/admin/session`, { headers: headers(saved.admin) }); const b = await r.json();
    check('verified Admin MFA session survives Docker restart', r.status === 200 && b.admin === true && Boolean(b.mfaVerifiedAt), r.status);
    r = await fetch(`${base}/admin/session`, { headers: { Cookie: saved.legacy } }); check('legacy no-MFA Admin denied after restart', r.status === 403, r.status);
    for (const [kind, s] of Object.entries({ student: saved.student, admin: saved.admin })) {
      r = await post('/auth/logout', {}, headers(s)); check(`${kind} logout missing CSRF denied`, r.status === 403, r.status);
      r = await post('/auth/logout', {}, { ...headers(s), 'x-csrf-token': 'invalid' }); check(`${kind} logout invalid CSRF denied`, r.status === 403, r.status);
      r = await post('/auth/logout', {}, { ...headers(s), 'x-csrf-token': s.csrf }); check(`${kind} valid logout`, r.status === 204, r.status);
      r = await fetch(base + (kind === 'admin' ? '/admin/session' : '/me/assignments'), { headers: headers(s) });
      check(`${kind} revoked session denied`, r.status === 401, r.status);
    }
    fs.unlinkSync('/tmp/v2-smoke-session.json');
  } else {
    const p = new PrismaClient(); let adminId;
    try {
      for (const kind of ['STUDENT', 'ADMIN']) {
        const email = `${kind.toLowerCase()}-v2-smoke@example.com`; const role = await p.roles.findUniqueOrThrow({ where: { code: kind } });
        const u = await p.users.create({ data: { email, email_normalized: email, status: 'ACTIVE', email_verified_at: new Date(),
          mfa_enabled: kind === 'ADMIN', password_hash: await argon2.hash('V2Smoke!Password42') } });
        await p.user_roles.create({ data: { user_id: u.id, role_id: role.id } });
        if (kind === 'STUDENT') await p.candidates.create({ data: { user_id: u.id } }); else adminId = u.id;
      }
      await p.auth_sessions.create({ data: { user_id: adminId, token_hash: createHash('sha256').update('v2-synthetic-legacy').digest('hex'), expires_at: new Date(Date.now() + 3600000) } });
      let r = await fetch(`${base}/registration-form-config`); const c = await r.json();
      check('exact withdrawal email, P1Y official end, no preselection', c.consents.mediaUsage.withdrawalContactEmail === 'nextgen@vnuis.edu.vn' &&
        c.consents.mediaUsage.retention.period === 'P1Y' && c.consents.mediaUsage.retention.anchor === 'OFFICIAL_COMPETITION_END' && c.consents.mediaUsage.defaultSelection === null, r.status);
      r = await post('/internal/fixtures/provision-user', { email: 'denied-v2@example.com' }, { 'x-fixtures-token': 'dev-fixtures-token' });
      check('production fixtures forcibly disabled', r.status === 403, r.status);
      r = await post('/auth/login', { identifier: 'student-v2-smoke@example.com', password: 'V2Smoke!Password42' }); const sb = await r.json(); const student = extract(r, sb);
      const raw = r.headers.getSetCookie().find((s) => s.startsWith('isng_session=')) || '';
      check('Student cookie Secure HttpOnly SameSite=Lax', r.status === 200 && /; Secure/i.test(raw) && /; HttpOnly/i.test(raw) && /SameSite=Lax/i.test(raw), r.status);
      r = await post('/auth/login', { identifier: 'admin-v2-smoke@example.com', password: 'V2Smoke!Password42' }); const ab = await r.json();
      check('Admin password produces MFA_REQUIRED and no session cookie', r.status === 200 && ab.status === 'MFA_REQUIRED' && Boolean(ab.challengeId) && r.headers.getSetCookie().length === 0, r.status);
      check('Admin password created no additional session', await p.auth_sessions.count({ where: { user_id: adminId } }) === 1);
      r = await fetch(`${base}/admin/session`); check('pre-MFA Admin probe denied', r.status === 401, r.status);
      const legacy = 'isng_session=v2-synthetic-legacy'; r = await fetch(`${base}/admin/session`, { headers: { Cookie: legacy } });
      check('legacy no-MFA Admin session denied', r.status === 403, r.status);
      const intent = await p.notification_intents.findUniqueOrThrow({ where: { deduplication_key: `challenge:${ab.challengeId}` } });
      const code = intent.payload.code;
      r = await post(`/auth/admin/mfa-challenges/${ab.challengeId}/verification`, { code }); const mb = await r.json(); const admin = extract(r, mb);
      check('exact MFA proof creates full session', r.status === 200 && Boolean(admin.cookie), r.status);
      const row = await p.auth_sessions.findUniqueOrThrow({ where: { token_hash: createHash('sha256').update(admin.cookie.split('=')[1]).digest('hex') } });
      check('MFA proof committed in PostgreSQL session', Boolean(row.mfa_verified_at));
      r = await post(`/auth/admin/mfa-challenges/${ab.challengeId}/verification`, { code }); check('MFA replay denied', r.status === 401, r.status);
      fs.writeFileSync('/tmp/v2-smoke-session.json', JSON.stringify({ student, admin, legacy }), { mode: 0o600 });
    } finally { await p.$disconnect(); }
  }
  console.log(JSON.stringify({ phase: process.env.SMOKE_PHASE || 'initial', checks }));
}
main().catch(() => { console.error('Independent v2 smoke failed; sensitive details suppressed'); process.exitCode = 1; });
