import Link from "next/link";
import { requireCouponAdmin } from "@/lib/services/coupon-admin.service";
import { couponLocalDate } from "@/lib/validations/coupon";
import { CouponForm } from "../CouponForm";

export const metadata = { title: "Create Coupon | Sudha Collections" };
export default async function NewCouponPage() {
  if (!await requireCouponAdmin().catch(() => null)) return <p role="alert">You do not have permission to manage coupons.</p>;
  const now = new Date();
  return <div className="space-y-6"><Link href="/admin/coupons" className="text-sm text-wine-800 underline">Back to coupons</Link><h1 className="font-serif text-3xl font-bold text-wine-900">Create promo coupon</h1>
    <CouponForm initial={{ code: "", discountType: "PERCENTAGE", discountValue: 10, minimumOrderAmount: 0, maximumDiscount: null, usageLimit: null, perUserLimit: 1, startDate: couponLocalDate(now), endDate: couponLocalDate(new Date(now.getTime() + 30 * 86400000)), status: "ACTIVE" }} />
  </div>;
}
