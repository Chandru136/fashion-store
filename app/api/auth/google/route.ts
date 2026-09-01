import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google-auth";
import crypto from "crypto";

// Starts the flow: generates a random CSRF-protection "state" value,
// stores it in a short-lived cookie, and redirects the browser to Google's
// consent screen. The callback route checks the state matches before
// trusting anything Google sends back.
export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(24).toString("hex");

  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes — plenty for a login flow, short-lived by design
    path: "/",
  });

  return response;
}
