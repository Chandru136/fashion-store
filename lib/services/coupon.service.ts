import { prisma } from "@/lib/db";

export async function validateCoupon(code: string, subtotal: number, userId?: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || coupon.status !== "ACTIVE") {
    throw new Error("Invalid or expired coupon code");
  }

  const now = new Date();
  if (coupon.startDate > now || coupon.endDate < now) {
    throw new Error("Coupon is not active at this time");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit exceeded");
  }

  if (subtotal < coupon.minimumOrderAmount) {
    throw new Error(`Minimum order amount of ₹${coupon.minimumOrderAmount} required for this coupon`);
  }

  // Check per-user limit
  if (userId && coupon.perUserLimit) {
    const userUsageCount = await prisma.order.count({
      where: {
        userId,
        couponCode: coupon.code,
      },
    });

    if (userUsageCount >= coupon.perUserLimit) {
      throw new Error(`You have already used coupon ${coupon.code} maximum allowed times`);
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
      discountAmount = coupon.maximumDiscount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  return {
    code: coupon.code,
    discountAmount: Math.round(discountAmount),
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
}
