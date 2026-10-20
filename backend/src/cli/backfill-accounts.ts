/**
 * Cấp tài khoản thí sinh (chờ kích hoạt) cho hồ sơ đã nộp mà chưa có tài khoản, và gửi email ACCOUNT_READY.
 * Mặc định chỉ liệt kê; thêm --send để thực hiện. Email đi qua hàng đợi notification_intents (worker gửi).
 *   docker exec nextgen-backend-backend-1 node dist/cli/backfill-accounts.js ISNG-2026          # xem trước
 *   docker exec nextgen-backend-backend-1 node dist/cli/backfill-accounts.js ISNG-2026 --send   # cấp + gửi
 * Chạy lại an toàn: hồ sơ đã có tài khoản bị bỏ qua, mỗi thí sinh chỉ có một email (deduplication_key).
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const log = (line: string) => process.stdout.write(`${line}\n`);

async function main() {
  const code = process.argv[2] ?? 'ISNG-2026';
  const send = process.argv.includes('--send');
  const prisma = new PrismaClient();
  try {
    const competition = await prisma.competitions.findUniqueOrThrow({ where: { code } });
    const videoDeadline = competition.video_closes_at ?? competition.registration_closes_at;
    const rows = await prisma.$queryRaw<
      { registration_id: string; candidate_id: string; candidate_code: string | null; full_name: string; email: string; email_normalized: string; has_video: boolean }[]
    >`
      SELECT r.id AS registration_id, c.id AS candidate_id, c.candidate_code, p.full_name, p.email, p.email_normalized,
             EXISTS(SELECT 1 FROM registration_videos v WHERE v.registration_id = r.id) AS has_video
      FROM registrations r
      JOIN candidates c ON c.id = r.candidate_id
      JOIN candidate_profiles p ON p.candidate_id = c.id
      WHERE r.competition_id = ${competition.id}::uuid AND r.state = 'SUBMITTED' AND c.user_id IS NULL
      ORDER BY r.submitted_at`;
    log(`${rows.length} hồ sơ đã nộp chưa có tài khoản (${send ? 'THỰC HIỆN' : 'xem trước, thêm --send để thực hiện'})`);
    const student = await prisma.roles.findUniqueOrThrow({ where: { code: 'STUDENT' } });
    let done = 0;
    for (const r of rows) {
      const label = `${r.candidate_code ?? '(chưa có mã)'} video=${r.has_video ? 'có' : 'chưa'}`;
      if (!send) {
        log(`  - ${label}`);
        continue;
      }
      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.users.findUnique({ where: { email_normalized: r.email_normalized } });
          if (existing) {
            const owner = await tx.candidates.findUnique({ where: { user_id: existing.id } });
            if (owner && owner.id !== r.candidate_id) throw new Error('email đã gắn với thí sinh khác (hồ sơ trùng)');
          }
          const user = existing ?? (await tx.users.create({ data: { email: r.email, email_normalized: r.email_normalized, status: 'PROVISIONED' } }));
          await tx.user_roles.upsert({
            where: { user_id_role_id: { user_id: user.id, role_id: student.id } },
            create: { user_id: user.id, role_id: student.id },
            update: {},
          });
          await tx.candidates.update({ where: { id: r.candidate_id }, data: { user_id: user.id } });
          await tx.notification_intents.create({
            data: {
              template_code: 'ACCOUNT_READY',
              destination_email: r.email,
              payload: {
                fullName: r.full_name,
                candidateCode: r.candidate_code ?? '',
                email: r.email,
                hasVideo: r.has_video,
                videoDeadline: videoDeadline.toISOString(),
              },
              deduplication_key: `account-ready:${r.candidate_id}`,
              user_id: user.id,
              candidate_id: r.candidate_id,
            },
          });
          await tx.audit_events.create({
            data: { action: 'account.provisioned_backfill', target_type: 'candidate', target_id: r.candidate_id, correlation_id: randomUUID(), metadata: { source: 'cli-backfill-accounts' } },
          });
        });
        done++;
        log(`  ✓ ${label}`);
      } catch (e) {
        log(`  ✗ ${label}: ${e instanceof Error ? e.message : e}`);
      }
    }
    if (send) log(`Đã cấp ${done}/${rows.length} tài khoản; email sẽ được worker gửi trong vài giây.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
