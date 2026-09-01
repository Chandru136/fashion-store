import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { RoleEnum } from "@prisma/client";

// ---- Password hashing ----

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12); // bumped cost factor from 10 -> 12
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ---- Signed session (JWT) ----
// Replaces the old plain-JSON cookie. The cookie now holds a token that is
// cryptographically signed with AUTH_SECRET — the server can detect if the
// value was edited in DevTools, whereas raw JSON could be silently tampered
// with (e.g. flipping role: "CUSTOMER" -> "ADMIN").

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error(
    "Missing AUTH_SECRET env var. Generate one with: openssl rand -base64 32"
  );
}
const secretKey = new TextEncoder().encode(AUTH_SECRET);

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
}

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches old cookie maxAge

export async function createSessionToken(user: UserSession): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifies the signature AND expiry of a session token.
 * Returns null if the token is missing, tampered with, or expired —
 * callers must treat null as "not logged in", never fall back to trusting
 * unverified data.
 */
export async function verifySessionToken(token: string | undefined): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as RoleEnum,
    };
  } catch {
    // Invalid signature, malformed token, or expired — reject silently.
    return null;
  }
}

/**
 * Re-fetches the user from the DB by id (from a verified token) to confirm
 * they still exist and aren't blocked. Use this for actions where
 * up-to-date status matters (e.g. before a checkout or admin action) rather
 * than trusting the token's snapshot indefinitely.
 */
export async function getSessionUser(userId?: string): Promise<UserSession | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user || user.status === "BLOCKED") return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// ---- Login lockout ----

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export function isLockedOut(lockedUntil: Date | null): boolean {
  return !!lockedUntil && lockedUntil.getTime() > Date.now();
}

export async function recordFailedLogin(userId: string, currentAttempts: number) {
  const attempts = currentAttempts + 1;
  const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: shouldLock ? 0 : attempts, // reset counter once locked
      lockedUntil: shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : undefined,
    },
  });
}

export async function resetFailedLogins(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}