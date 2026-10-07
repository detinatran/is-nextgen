import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware to protect admin routes
// Checks for admin session cookie (set by real backend after login)
// In production: verify JWT/session with backend, check role=ADMIN, MFA status

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page without auth
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Protect all /admin/* routes
  if (pathname.startsWith("/admin")) {
    // Check for admin session cookie (HttpOnly, set by NestJS backend after successful login + MFA)
    const adminSession = request.cookies.get("admin-session");

    if (!adminSession) {
      // No session -> redirect to login with return URL
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: In production, verify session with backend:
    // - Decode JWT / verify session ID
    // - Check role === "ADMIN"
    // - Check MFA verified
    // - Check session not expired
    // - If invalid -> clear cookie and redirect to login
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};