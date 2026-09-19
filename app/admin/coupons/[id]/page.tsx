import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCouponAdmin } from "@/lib/services/coupon-admin.service";
import { couponDate, couponMoney, couponState } from "@/lib/coupon-admin";
import { value, type ListPageProps } from "@/lib/listing";
import { DeleteCouponButton } from "../DeleteCouponButton";

export const metadata = { title: "Coupon Details | Sudha Collections" };
export default async function CouponPage({ params, searchParams }: ListPageProps & { params: Promise<{ id: string }> }) {
  if (!await requireCouponAdmin().catch(() => null)) return <p role="alert">You do not have permission to manage coupons.</p>;
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();
  const orderCount = await prisma.order.count({ where: { couponCode: coupon.code } });
  const query = await searchParams;
  const details = [
    ["Status", couponState(coupon)], ["Discount", coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% off` : `${couponMoney(coupon.discountValue)} off`],
    ["Minimum order subtotal", couponMoney(coupon.minimumOrderAmount)], ["Maximum discount", coupon.maximumDiscount ? couponMoney(coupon.maximumDiscount) : "No cap"],
    ["Total redemption limit", coupon.usageLimit ?? "Unlimited"], ["Uses per customer", coupon.perUserLimit || "Unlimited"],
    ["Current uses / reservations", coupon.usedCount], ["Orders with this code (all statuses)", orderCount],
    ["Starts (IST)", couponDate(coupon.startDate)], ["Ends (IST)", couponDate(coupon.endDate)],
  ];
  return <div className="max-w-5xl space-y-6"><Link href="/admin/coupons" className="text-sm text-wine-800 underline">Back to coupons</Link>
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-serif text-3xl font-bold text-wine-900">{coupon.code}</h1><Link href={`/admin/coupons/${id}/edit`} className="wine-gradient-bg rounded-lg px-5 py-3 text-sm font-bold text-gold-300">Edit coupon</Link></div>
    {value(query, "saved") === "1" && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Coupon saved successfully.</p>}
    <dl className="grid gap-6 rounded-xl border border-stone-200 bg-ivory-50 p-6 sm:grid-cols-2">{details.map(([label, content]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</dt><dd className="mt-2 text-sm font-semibold text-wine-900">{content}</dd></div>)}</dl>
    <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600"><h2 className="mb-2 font-semibold text-wine-900">How customers use this offer</h2><p>Enter <strong className="font-mono">{coupon.code}</strong> at checkout. The offer applies to merchandise across the store, subject to its minimum subtotal, schedule and usage limits. Only one coupon can be used per order.</p><p className="mt-2">Existing orders keep their original discount when you edit this coupon. Usage includes reserved checkouts and is restored when a checkout releases its reservation.</p></div>
    <DeleteCouponButton id={id} code={coupon.code} hasHistory={coupon.usedCount > 0 || orderCount > 0} />
  </div>;
}
