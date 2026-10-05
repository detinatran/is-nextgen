import { ErrorCodes, type ErrorCode } from './error-codes';

/**
 * Domain-level failure carrying a stable machine code and HTTP status.
 * Controllers/services raise these; the global filter renders the envelope.
 */
export class AppException extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppException';
  }

  static notFound(message = 'Resource not found', details?: Record<string, unknown>): AppException {
    return new AppException(404, ErrorCodes.NOT_FOUND, message, details);
  }

  static authRequired(message = 'Authentication required', details?: Record<string, unknown>): AppException {
    return new AppException(401, ErrorCodes.AUTH_REQUIRED, message, details);
  }

  static forbidden(message = 'Forbidden', details?: Record<string, unknown>): AppException {
    return new AppException(403, ErrorCodes.FORBIDDEN, message, details);
  }

  static validation(message: string, details?: Record<string, unknown>): AppException {
    return new AppException(400, ErrorCodes.VALIDATION_FAILED, message, details);
  }

  static conflict(code: ErrorCode, message: string, details?: Record<string, unknown>): AppException {
    return new AppException(409, code, message, details);
  }

  static dependencyUnavailable(message = 'A required dependency is unavailable'): AppException {
    return new AppException(503, ErrorCodes.DEPENDENCY_UNAVAILABLE, message);
  }
}
