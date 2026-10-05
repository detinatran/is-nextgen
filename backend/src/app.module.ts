import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ValidationPipe } from '@nestjs/common';
import configuration, { type AppConfig } from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { CommonModule } from './common/common.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IdentityAccessModule } from './identity-access/identity-access.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ExamOperationsModule } from './exam-operations/exam-operations.module';
import { AttemptsModule } from './attempts/attempts.module';
import { ScoringModule } from './scoring/scoring.module';
import { FixturesModule } from './fixtures/fixtures.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => ({
        throttlers: [
          { name: 'default', ttl: 60_000, limit: config.getOrThrow('rateLimitGlobalPerMin') },
        ],
      }),
    }),
    PrismaModule,
    CommonModule,
    HealthModule,
    NotificationsModule,
    IdentityAccessModule,
    RegistrationsModule,
    ExamOperationsModule,
    AttemptsModule,
    ScoringModule,
    FixturesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
