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
  app.setGlobalPrefix('api/v1');
  app.disable('x-powered-by');
  app.enableShutdownHooks();

  if (config.get('swaggerEnabled', true)) {
    const config = new DocumentBuilder()
      .setTitle('IS-NextGen Backend API')
      .setDescription('Candidate flow FR-13..FR-22 (NestJS + Prisma + PostgreSQL)')
      .setVersion('1.0')
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
