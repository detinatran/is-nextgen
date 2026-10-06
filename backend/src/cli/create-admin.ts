/**
 * Tạo (hoặc cấp lại mật khẩu cho) tài khoản quản trị Ban Tổ chức.
 * Chạy trong container backend trên server:
 *   docker exec -it -e ADMIN_PASSWORD='...' nextgen-backend-backend-1 node dist/cli/create-admin.js btc@vnuis.edu.vn
 * Đăng nhập admin luôn cần thêm mã OTP gửi về email này (cần SMTP).
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

async function main() {
  const email = (process.argv[2] ?? '').trim();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: create-admin <email> (ADMIN_PASSWORD env)');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must have at least 12 characters');

  const prisma = new PrismaClient();
  try {
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    const normalized = email.toLowerCase();
    await prisma.$transaction(async (tx) => {
      const role = await tx.roles.findUniqueOrThrow({ where: { code: 'ADMIN' } });
      const existing = await tx.users.findFirst({ where: { email_normalized: normalized } });
      const user = existing
        ? await tx.users.update({
            where: { id: existing.id },
            data: { password_hash: hash, status: 'ACTIVE', mfa_enabled: true, email_verified_at: existing.email_verified_at ?? new Date() },
          })
        : await tx.users.create({
            data: { email, email_normalized: normalized, password_hash: hash, status: 'ACTIVE', mfa_enabled: true, email_verified_at: new Date() },
          });
      await tx.user_roles.upsert({
        where: { user_id_role_id: { user_id: user.id, role_id: role.id } },
        create: { user_id: user.id, role_id: role.id },
        update: {},
      });
      await tx.audit_events.create({
        data: {
          actor_user_id: null,
          action: existing ? 'admin.password_reset_cli' : 'admin.created_cli',
          target_type: 'user',
          target_id: user.id,
          correlation_id: user.id,
          metadata: { email: normalized },
        },
      });
    });
    process.stdout.write(`Admin ready: ${normalized}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
