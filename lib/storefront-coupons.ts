export type StorefrontCoupon = {
  code: string; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; discountValue: number;
  minimumOrderAmount: number; maximumDiscount: number | null; startDate: string; endDate: string;
};
export const COUPON_STORAGE_KEY = "sudha_collections_coupon";
export function offerLabel(coupon: StorefrontCoupon) {
  return coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue.toLocaleString("en-IN")} OFF`;
}
