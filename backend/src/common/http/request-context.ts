import type { Request } from 'express';

// Trang quản trị chạy cùng tên miền với trang thí sinh: đặt tên cookie riêng (SESSION_COOKIE_NAME/CSRF_COOKIE_NAME)
// để đăng nhập vai thí sinh không đè phiên quản trị và ngược lại.
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'isng_session';
export const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || 'isng_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export interface AuthContext {
  userId: string;
  sessionId: string;
  email: string;
  roles: string[];
  /** F05: MFA proof timestamp of THIS session; null = not MFA-verified. */
  mfaVerifiedAt: Date | null;
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
