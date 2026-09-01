import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionTokenEdge } from "@/lib/session-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("aarna_session_user")?.value;
  const session = await verifySessionTokenEdge(token);

  // Admin route protection — role comes from the *verified* JWT payload,
  // not just "cookie exists", so a tampered/forged cookie is rejected here.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || session.role === "CUSTOMER") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Account route protection
  if (
    (pathname.startsWith("/profile") || pathname.startsWith("/orders") || pathname.startsWith("/addresses")) &&
    !session
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/orders/:path*", "/addresses/:path*"],
};