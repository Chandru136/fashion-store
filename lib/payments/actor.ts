import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentOperationError } from "./lifecycle.service";
export async function paymentActor(requireAdmin = false) {
  const session = await verifySessionToken((await cookies()).get("sudha_collections_session_user")?.value);
  if (!session) throw new PaymentOperationError("Please log in to continue.");
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { id: true, role: true, status: true } });
  if (!user || user.status !== "ACTIVE") throw new PaymentOperationError("Your account is not active.");
  const admin = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"].includes(user.role);
  if (requireAdmin && !admin) throw new PaymentOperationError("Not authorized to manage payments.");
  return { userId: user.id, admin };
}
