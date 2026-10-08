import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare module 'http' {
  interface IncomingMessage {
    correlationId?: string;
  }
}

/**
 * Every request carries a correlationId used in logs, the error envelope
 * and audit_events.correlation_id.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request & { correlationId?: string }, res: Response, next: NextFunction): void {
    const incoming = req.header('x-correlation-id');
    const correlationId =
      incoming && /^[0-9a-fA-F-]{36}$/.test(incoming) ? incoming : randomUUID();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  }
}
