import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<AppConfig>);

  app.use(cookieParser());
  app.use((req: Request & { correlationId?: string }, res: Response, next: NextFunction) => {
    const incoming = req.header('x-correlation-id');
    const correlationId = incoming && /^[0-9a-fA-F-]{36}$/.test(incoming) ? incoming : randomUUID();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  });
  // Frontend tĩnh chạy ở origin khác (vd. localhost:3002, nextgen.vnuis.edu.vn): chỉ mở CORS cho các origin khai báo
  const corsOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      allowedHeaders: ['Content-Type', 'x-registration-token', 'Idempotency-Key', 'x-correlation-id'],
      exposedHeaders: ['x-correlation-id'],
    });
  }
  // Sau reverse proxy (nginx cùng máy): lấy IP thật của thí sinh cho rate limit và log
  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', process.env.TRUST_PROXY);
  }
  app.setGlobalPrefix('api/v1');
  app.disable('x-powered-by');
  app.enableShutdownHooks();

  if (config.get('swaggerEnabled', true)) {
    const config = new DocumentBuilder()
      .setTitle('IS-NextGen Backend API')
      .setDescription('Candidate flow FR-13..FR-22 (NestJS + Prisma + PostgreSQL)')
      .setVersion('1.0')
      .addSecurity('cookie', { type: 'apiKey', in: 'cookie', name: 'isng_session' })
      .addApiKey({ type: 'apiKey', name: 'x-registration-token', in: 'header' }, 'registrationToken')
      .addApiKey({ type: 'apiKey', name: 'x-fixtures-token', in: 'header' }, 'fixturesToken')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get('port', 3001);
  await app.listen(port);
  logger.log(`listening on port ${port} env=${config.get('env', 'development')}`);
}

void bootstrap();
