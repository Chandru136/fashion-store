import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/app/actions/auth.actions";
import { LoginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("x-sudha-login") !== "1") {
    return NextResponse.json({ success: false, error: "Invalid sign-in request." }, { status: 403 });
  }

  const input = await request.json().catch(() => null);
  const validated = LoginSchema.safeParse(input);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: "Enter a valid email address and password." }, { status: 400 });
  }

  try {
    const result = await loginUser(validated.data);
    return NextResponse.json(result, {
      status: result.success ? 200 : 401,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Sign-in is temporarily unavailable. Please try again." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
