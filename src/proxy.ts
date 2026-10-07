import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/admin/login/"
  )
    return NextResponse.next();
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("redirect", request.nextUrl.pathname);
  if (!request.cookies.get("isng_session")) return NextResponse.redirect(login);
  try {
    const api = (process.env.BACKEND_URL || "http://127.0.0.1:3001").replace(
      /\/$/,
      "",
    );
    const response = await fetch(`${api}/api/v1/admin/session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return NextResponse.redirect(login);
  } catch {
    return new NextResponse(
      "Không thể kết nối dịch vụ quản trị. Vui lòng thử lại.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/admin/:path*"] };
