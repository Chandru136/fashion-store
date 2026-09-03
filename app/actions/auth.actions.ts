"use server";

import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  isLockedOut,
  recordFailedLogin,
  resetFailedLogins,
} from "@/lib/auth";
import { RegisterSchema, LoginSchema, RegisterInput, LoginInput } from "@/lib/validations/auth";
import { cookies } from "next/headers";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — keep in sync with lib/auth.ts SESSION_DURATION_SECONDS

type SessionUser = { id: string; name: string; email: string; role: import("@prisma/client").RoleEnum };
type AuthResult = { success: true; user: SessionUser } | { success: false; error: string };

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const validated = RegisterSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: validated.email.toLowerCase() },
  });

  if (existing) {
    // Same generic message style as login — don't reveal whether this
    // specific email is the one already registered any more than necessary.
    return { success: false, error: "An account with this email address already exists." };
  }

  const passwordHash = await hashPassword(validated.password);

  const newUser = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      phone: validated.phone || null,
      passwordHash,
      authProvider: "LOCAL",
      role: "CUSTOMER",
    },
  });

  const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
  const token = await createSessionToken(sessionUser);

  const cookieStore = await cookies();
  cookieStore.set("aarna_session_user", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });

  return { success: true, user: sessionUser };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const validated = LoginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: validated.email.toLowerCase() },
  });

  // Same generic error whether the email doesn't exist, the password is
  // wrong, or the account is locked/blocked — avoids leaking which case it is.
  const genericError = { success: false as const, error: "Invalid email or password" };

  if (!user || user.status === "BLOCKED") {
    return genericError;
  }

  if (isLockedOut(user.lockedUntil)) {
    return {
      success: false as const,
      error: "Too many failed attempts. Please try again in a few minutes.",
    };
  }

  if (user.authProvider === "GOOGLE" || !user.passwordHash) {
    return {
      success: false as const,
      error: "This account uses Google Sign-In. Please continue with Google below.",
    };
  }

  const isValidPassword = await verifyPassword(validated.password, user.passwordHash);
  if (!isValidPassword) {
    await recordFailedLogin(user.id, user.failedLoginAttempts);
    return genericError;
  }

  // Successful login — clear any prior failed-attempt counter.
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await resetFailedLogins(user.id);
  }

  const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = await createSessionToken(sessionUser);

  const cookieStore = await cookies();
  cookieStore.set("aarna_session_user", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });

  return { success: true, user: sessionUser };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("aarna_session_user");
  return { success: true };
}