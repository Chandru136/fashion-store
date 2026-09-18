import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCouponAdmin } from "@/lib/services/coupon-admin.service";
import { couponLocalDate } from "@/lib/validations/coupon";
import { CouponForm } from "../../CouponForm";

export const metadata = { title: "Edit Coupon | Sudha Collections" };
export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await requireCouponAdmin().catch(() => null)) return <p role="alert">You do not have permission to manage coupons.</p>;
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();
  return <div className="space-y-6"><Link href={`/admin/coupons/${id}`} className="text-sm text-wine-800 underline">Back to coupon</Link><h1 className="font-serif text-3xl font-bold text-wine-900">Edit {coupon.code}</h1><CouponForm initial={{ ...coupon, startDate: couponLocalDate(coupon.startDate), endDate: couponLocalDate(coupon.endDate) }} /></div>;
}
