import type { Request } from 'express';

export const SESSION_COOKIE = 'isng_session';
export const CSRF_COOKIE = 'isng_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export interface AuthContext {
  userId: string;
  sessionId: string;
  email: string;
  roles: string[];
}

export interface RegistrationAuthContext {
  grantId: string;
  registrationId: string;
  scopes: string[];
}

export interface AuthenticatedRequest extends Request {
  correlationId?: string;
  auth?: AuthContext;
  registrationAuth?: RegistrationAuthContext;
}
