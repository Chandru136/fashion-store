import { jwtVerify } from "jose";
import type { RoleEnum } from "@prisma/client";

// Edge-runtime-safe session verification.
// IMPORTANT: this file must NOT import prisma or anything Node-only —
// middleware.ts runs on the Edge runtime, which can't load the Prisma client.
// lib/auth.ts (the Node version with prisma) is for use in server actions /
// route handlers only.

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error(
    "Missing AUTH_SECRET env var. Generate one with: openssl rand -base64 32"
  );
}
const secretKey = new TextEncoder().encode(AUTH_SECRET);

export interface EdgeSessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
}

export async function verifySessionTokenEdge(
  token: string | undefined
): Promise<EdgeSessionUser | null> {
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
    return null;
  }
}