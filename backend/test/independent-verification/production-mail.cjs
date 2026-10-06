const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/app.module');
const { PrismaService } = require('../../dist/database/prisma.service');
const { NotificationsService } = require('../../dist/notifications/notifications.service');
const { MAILER } = require('../../dist/notifications/mailer/mailer.tokens');
(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    await app.init(); const db = app.get(PrismaService); const adapter = app.get(MAILER);
    const pendingBefore = await db.notification_intents.count({ where: { template_code: 'REGISTRATION_CONFIRMED', status: 'PENDING' } });
    const handled = await app.get(NotificationsService).dispatchPending();
    const sentAfter = await db.notification_intents.count({ where: { template_code: 'REGISTRATION_CONFIRMED', status: 'SENT' } });
    console.log(JSON.stringify({ environment: process.env.NODE_ENV, smtpConfigured: !!process.env.SMTP_URL, adapter: adapter.constructor.name, pendingBefore, handled, sentAfter, actualExternalDelivery: false, conclusion:'production without SMTP can mark captured messages SENT; actual deployed SMTP configuration was not inspected' }));
  } finally { await app.close(); }
})().catch(e=>{ console.error(e.message);process.exitCode=1; });
