import { cookies } from "next/headers";
import { getSessionUser, verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";

export async function getReviewSession() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  return getSessionUser(session?.id);
}
