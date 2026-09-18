import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import { verifySessionToken } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { CouponSchema } from "@/lib/validations/coupon";

export class CouponAdminError extends Error {}
export async function requireCouponAdmin() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (!session) throw new CouponAdminError("Please sign in as an administrator.");
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { id: true, role: true, status: true } });
  if (!user || user.status !== "ACTIVE" || !hasPermission(user.role, PERMISSIONS.MANAGE_COUPONS)) throw new CouponAdminError("You do not have permission to manage coupons.");
  return user;
}

// Match checkout's coupon lock so edits/deletes cannot race a redemption.
async function lockedCoupon(tx: Prisma.TransactionClient, id: string) {
  const initial = await tx.coupon.findUnique({ where: { id } });
  if (!initial) throw new CouponAdminError("Coupon no longer exists.");
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'coupon:' + initial.code.toUpperCase()}))`;
  const coupon = await tx.coupon.findUnique({ where: { id } });
  if (!coupon) throw new CouponAdminError("Coupon no longer exists.");
  return coupon;
}

export async function saveAdminCoupon(input: unknown, id?: string) {
  const actor = await requireCouponAdmin();
  const data = CouponSchema.parse(input);
  if (!id && data.endDate <= new Date()) throw new CouponAdminError("A new coupon must end in the future.");
  return prisma.$transaction(async tx => {
    const existing = id ? await lockedCoupon(tx, id) : null;
    if (existing && data.code !== existing.code) throw new CouponAdminError("Coupon codes cannot be renamed. Create a new coupon instead.");
    if (existing && data.usageLimit !== null && data.usageLimit < existing.usedCount) throw new CouponAdminError("Total limit cannot be lower than the current usage count.");
    if (!id && await tx.order.count({ where: { couponCode: data.code } })) throw new CouponAdminError("This code belongs to previous orders. Use a new code.");
    const coupon = id ? await tx.coupon.update({ where: { id }, data }) : await tx.coupon.create({ data });
    await tx.auditLog.create({ data: { userId: actor.id, action: id ? "UPDATE_COUPON" : "CREATE_COUPON", entity: "Coupon", entityId: coupon.id, oldValue: existing ? JSON.stringify(existing) : null, newValue: JSON.stringify(coupon) } });
    return coupon.id;
  });
}

export async function deleteAdminCoupon(id: string) {
  const actor = await requireCouponAdmin();
  await prisma.$transaction(async tx => {
    const coupon = await lockedCoupon(tx, id);
    if (coupon.usedCount > 0 || await tx.order.count({ where: { couponCode: coupon.code } })) throw new CouponAdminError("This coupon has order history and cannot be deleted. Set it to inactive instead.");
    await tx.coupon.delete({ where: { id } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "DELETE_COUPON", entity: "Coupon", entityId: id, oldValue: JSON.stringify(coupon) } });
  });
}
