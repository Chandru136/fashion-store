import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export async function canManageCollections() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  return !!session && hasPermission(session.role, PERMISSIONS.MANAGE_COLLECTIONS);
}
