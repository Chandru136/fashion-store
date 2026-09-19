import { prisma } from "@/lib/db";
import { couponStatusWhere } from "@/lib/coupon-admin";
import type { StorefrontCoupon } from "@/lib/storefront-coupons";

export async function getStorefrontCoupons(): Promise<StorefrontCoupon[]> {
  const coupons = await prisma.coupon.findMany({
    where: couponStatusWhere("ACTIVE", new Date(), prisma.coupon.fields.usageLimit),
    select: { code: true, discountType: true, discountValue: true, minimumOrderAmount: true, maximumDiscount: true, startDate: true, endDate: true },
    orderBy: [{ endDate: "asc" }, { code: "asc" }],
  });
  return coupons.map(coupon => ({ ...coupon, startDate: coupon.startDate.toISOString(), endDate: coupon.endDate.toISOString() }));
}
