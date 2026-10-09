import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/admin/login/"
  )
    return NextResponse.next();
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("redirect", request.nextUrl.pathname);
  // Admin dùng cookie riêng (isng_admin_session); bản chạy thử local cũ vẫn dùng isng_session
  if (!request.cookies.get("isng_admin_session") && !request.cookies.get("isng_session")) return NextResponse.redirect(login);
  try {
    const api = (process.env.BACKEND_URL || "http://127.0.0.1:3001").replace(
      /\/$/,
      "",
    );
    const check = () =>
      fetch(`${api}/api/v1/admin/session`, {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
    // Kết nối giữ sống tới backend thỉnh thoảng bị đóng giữa chừng: thử lại một lần trước khi báo lỗi
    const response = await check().catch(check);
    if (!response.ok) return NextResponse.redirect(login);
  } catch {
    return new NextResponse(
      // Middleware chưa biết ngôn ngữ người dùng chọn (lưu ở trình duyệt) nên báo cả hai thứ tiếng
      "Không thể kết nối dịch vụ quản trị. Vui lòng thử lại.\nCannot reach the admin service. Please try again.",
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
