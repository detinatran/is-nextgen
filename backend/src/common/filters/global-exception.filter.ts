import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException } from '../errors/app-error';
import { ErrorCodes, type ErrorCode } from '../errors/error-codes';

interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    correlationId: string;
    details: Record<string, unknown>;
  };
}

/**
 * Renders every failure in the single standard envelope:
 * { "error": { code, message, correlationId, details } }
 * Stack traces stay server-side; API responses never expose them.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const response = ctx.getResponse<Response>();
    const correlationId = request.correlationId ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = ErrorCodes.INTERNAL;
    let message = 'Internal server error';
    let details: Record<string, unknown> = {};

    if (exception instanceof AppException) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
      details = exception.details ?? {};
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (status === HttpStatus.BAD_REQUEST && typeof payload === 'object' && payload !== null && 'message' in payload) {
        code = ErrorCodes.VALIDATION_FAILED;
        message = 'Request validation failed';
        details = { issues: (payload as { message: unknown }).message };
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        code = ErrorCodes.RATE_LIMITED;
        message = 'Too many requests';
      } else if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
        code = request.originalUrl?.includes('/uploads')
          ? ErrorCodes.VIDEO_TOO_LARGE
          : ErrorCodes.VALIDATION_FAILED;
        message = 'Request payload too large';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = ErrorCodes.NOT_FOUND;
        message = 'Route not found';
      } else {
        message = exception.message;
      }
    } else {
      // Query/validation errors may contain credentials or PII in their message.
      this.logger.error(
        `unhandled_error path=${request.originalUrl ?? request.url} correlationId=${correlationId}`,
      );
    }

    if (status >= 500) {
      this.logger.error(`api_error code=${code} status=${status} path=${request.originalUrl ?? request.url} correlationId=${correlationId}`);
    }

    const body: ErrorBody = { error: { code, message, correlationId, details } };
    response.status(status).json(body);
  }
}
