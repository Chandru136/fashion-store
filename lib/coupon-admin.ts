import type { Coupon, Prisma } from "@prisma/client";

export const couponStates = ["ACTIVE", "SCHEDULED", "EXPIRED", "INACTIVE", "EXHAUSTED"] as const;
export function couponState(coupon: Pick<Coupon, "status" | "startDate" | "endDate" | "usageLimit" | "usedCount">, now = new Date()) {
  if (coupon.status === "INACTIVE") return "INACTIVE";
  if (coupon.status === "EXPIRED" || coupon.endDate < now) return "EXPIRED";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "EXHAUSTED";
  if (coupon.startDate > now) return "SCHEDULED";
  return "ACTIVE";
}
export const couponMoney = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
export const couponDate = (date: Date) => date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export function couponStatusWhere(state: string, now: Date, usageField: Prisma.IntFieldRefInput<"Coupon">): Prisma.CouponWhereInput {
  const available: Prisma.CouponWhereInput = { OR: [{ usageLimit: null }, { usedCount: { lt: usageField } }] };
  switch (state) {
    case "INACTIVE": return { status: "INACTIVE" };
    case "EXPIRED": return { status: { not: "INACTIVE" }, OR: [{ status: "EXPIRED" }, { endDate: { lt: now } }] };
    case "EXHAUSTED": return { status: "ACTIVE", endDate: { gte: now }, usageLimit: { not: null }, usedCount: { gte: usageField } };
    case "SCHEDULED": return { status: "ACTIVE", endDate: { gte: now }, startDate: { gt: now }, AND: [available] };
    case "ACTIVE": return { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now }, AND: [available] };
    default: return {};
  }
}
