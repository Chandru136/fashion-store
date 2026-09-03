import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionTokenEdge } from "@/lib/session-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("aarna_session_user")?.value;
  const session = await verifySessionTokenEdge(token);

  // TEMPORARY DEBUG LOGGING — remove once the admin login loop is fixed.
  if (pathname.startsWith("/admin")) {
    console.log("=== MIDDLEWARE DEBUG ===");
    console.log("pathname:", pathname);
    console.log("token present:", !!token);
    console.log("token (first 30 chars):", token?.slice(0, 30));
    console.log("session:", session);
    console.log("AUTH_SECRET set:", !!process.env.AUTH_SECRET);
    console.log("AUTH_SECRET length:", process.env.AUTH_SECRET?.length);
    console.log("========================");
  }

  // Admin route protection — role comes from the *verified* JWT payload,
  // not just "cookie exists", so a tampered/forged cookie is rejected here.
  // Uses the single /login page — no separate admin login portal.
  if (pathname.startsWith("/admin")) {
    if (!session || session.role === "CUSTOMER") {
      const loginUrl = new URL("/login", request.url);
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