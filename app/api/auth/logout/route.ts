
import { SESSION_COOKIES_TO_CLEAR, SESSION_COOKIE_OPTIONS } from "@/lib/session-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Require a same-origin browser request before changing the session.
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("x-sudha-logout") !== "1") {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store");
  for (const name of SESSION_COOKIES_TO_CLEAR) {
    response.cookies.set(name, "", {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });
  }
  return response;
}
