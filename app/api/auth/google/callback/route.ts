
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_COOKIES_TO_CLEAR } from "@/lib/session-config";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchGoogleUserInfo } from "@/lib/google-auth";
import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";


export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const loginErrorUrl = (message: string) =>
    new URL(`/login?error=${encodeURIComponent(message)}`, request.url);

  if (errorParam) {
    // User denied consent, or Google returned an error.
    return NextResponse.redirect(loginErrorUrl("Google sign-in was cancelled."));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(loginErrorUrl("Google sign-in failed. Please try again."));
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const googleUser = await fetchGoogleUserInfo(tokens.access_token);

    if (!googleUser.email_verified) {
      return NextResponse.redirect(
        loginErrorUrl("Your Google email isn't verified. Please verify it with Google first.")
      );
    }

    const normalizedEmail = googleUser.email.toLowerCase();

    // Look up by googleId first (returning Google user), then by email
    // (existing password account signing in with Google for the first time —
    // link the accounts rather than creating a duplicate).
    let user = await prisma.user.findUnique({ where: { googleId: googleUser.sub } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (user) {
        // Existing LOCAL account with this email — link the Google id to it
        // rather than creating a second account with the same email.
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.sub },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name: googleUser.name,
            email: normalizedEmail,
            googleId: googleUser.sub,
            authProvider: "GOOGLE",
            passwordHash: null,
            role: "CUSTOMER",
          },
        });
      }
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(loginErrorUrl("This account has been suspended."));
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = await createSessionToken(sessionUser);

    const response = NextResponse.redirect(new URL("/profile", request.url));

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    // Clean up the one-time CSRF state cookie now that it's served its purpose.
    for (const name of SESSION_COOKIES_TO_CLEAR) {
      if (name !== SESSION_COOKIE_NAME) response.cookies.delete(name);
    }

    return response;
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(loginErrorUrl("Something went wrong signing in with Google."));
  }
}
