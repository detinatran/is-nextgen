/**
 * Generates the OpenAPI artifact (openapi.json) from the actual NestJS DTOs.
 * Validates §34: one generated contract, never a second hand-maintained one.
 * Usage: npm run openapi
 */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';

async function main(): Promise<void> {
  process.env['NODE_ENV'] = 'development';
  process.env['WORKERS_DISABLED'] = '1';
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  app.setGlobalPrefix('api/v1');
  const config = new DocumentBuilder()
    .setTitle('IS-NextGen Backend API')
    .setDescription('Candidate flow FR-13..FR-22 (NestJS + Prisma + PostgreSQL)')
    .setVersion('1.0')
    .addSecurity('cookie', { type: 'apiKey', in: 'cookie', name: 'isng_session' })
    .addApiKey({ type: 'apiKey', name: 'x-registration-token', in: 'header' }, 'registrationToken')
    .addApiKey({ type: 'apiKey', name: 'x-fixtures-token', in: 'header' }, 'fixturesToken')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const out = join(process.cwd(), 'openapi.json');
  writeFileSync(out, JSON.stringify(document, null, 2), 'utf8');
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`openapi.json written to ${out}`);
}

void main();
