import { cookies } from "next/headers";
import { verifySessionToken, getSessionUser } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";

export async function requireMessagingAdmin() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  const actor = await getSessionUser(session?.id);
  if (!actor || !["ADMIN", "SUPER_ADMIN"].includes(actor.role)) throw new Error("Only active administrators can manage customer messages.");
  return actor;
}
