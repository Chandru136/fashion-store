import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import { hasPermission, type PermissionType } from "@/lib/permissions";

export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Please log in to continue." : "You are not authorized to perform this operation.");
  }
}

/** Uses the signed identity only; authorization always uses the current database role. */
export async function requireAdminPermission(permission: PermissionType | readonly PermissionType[]) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (!session || typeof session.id !== "string" || !session.id) throw new AuthorizationError(401);
  const user = await prisma.user.findUnique({
    where: { id: session.id }, select: { id: true, role: true, status: true },
  });
  const permissions = typeof permission === "string" ? [permission] : permission;
  if (!user || user.status !== "ACTIVE" || !permissions.some(p => hasPermission(user.role, p))) {
    throw new AuthorizationError(403);
  }
  return user;
}
