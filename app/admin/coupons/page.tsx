import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCouponAdmin } from "@/lib/services/coupon-admin.service";
import { couponDate, couponMoney, couponState, couponStates, couponStatusWhere } from "@/lib/coupon-admin";
import { choice, options, pagination, value, type ListPageProps } from "@/lib/listing";
import { ListControls, Pagination } from "@/components/common/ListControls";

export const metadata = { title: "Promo Coupons | Sudha Collections" };
export default async function CouponsPage({ searchParams }: ListPageProps) {
  if (!await requireCouponAdmin().catch(() => null)) return <p role="alert">You do not have permission to manage coupons.</p>;
  const params = await searchParams;
  const now = new Date();
  const q = value(params, "q");
  const status = choice(params, "status", couponStates);
  const type = choice(params, "type", ["PERCENTAGE", "FIXED_AMOUNT"]) as "PERCENTAGE" | "FIXED_AMOUNT" | "";
  const sort = choice(params, "sort", ["code", "ending", "usage"], "code");
  const where: Prisma.CouponWhereInput = {
    ...couponStatusWhere(status, now, prisma.coupon.fields.usageLimit),
    ...(q ? { code: { contains: q, mode: "insensitive" } } : {}), ...(type ? { discountType: type } : {}),
  };
  const [count, total, active, scheduled, expired] = await Promise.all([
    prisma.coupon.count({ where }), prisma.coupon.count(),
    ...["ACTIVE", "SCHEDULED", "EXPIRED"].map(state => prisma.coupon.count({ where: couponStatusWhere(state, now, prisma.coupon.fields.usageLimit) })),
  ]);
  const paging = pagination(count, value(params, "page"));
  const coupons = await prisma.coupon.findMany({ where, skip: paging.skip, take: paging.take,
    orderBy: [sort === "ending" ? { endDate: "asc" } : sort === "usage" ? { usedCount: "desc" } : { code: "asc" }, { id: "asc" }],
  });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4"><div><h1 className="font-serif text-3xl font-bold text-wine-900">Promo Coupons</h1><p className="mt-1 text-sm text-stone-500">Create and manage offers for Sudha Collections customers.</p></div><Link href="/admin/coupons/new" className="wine-gradient-bg rounded-lg px-5 py-3 text-sm font-bold text-gold-300">+ Create coupon</Link></div>
    {value(params, "deleted") === "1" && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Coupon deleted.</p>}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[["Total coupons", total], ["Active now", active], ["Scheduled", scheduled], ["Expired", expired]].map(([label, number]) => <div key={label} className="rounded-xl border border-stone-200 bg-ivory-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-2 font-serif text-3xl font-bold text-wine-900">{number}</p></div>)}</div>
    <ListControls path="/admin/coupons" params={params} search="Search coupon code" sorts={[{ value: "code", label: "Code: A–Z" }, { value: "ending", label: "Ending soonest" }, { value: "usage", label: "Most used" }]} filters={[{ key: "status", label: "Status", options: options(couponStates) }, { key: "type", label: "Discount type", options: [{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED_AMOUNT", label: "Fixed amount" }] }]} />
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-ivory-50"><table className="w-full text-left text-sm"><thead className="border-b bg-stone-50 text-xs uppercase text-stone-600"><tr>{["Coupon", "Discount", "Minimum spend", "Usage", "Validity (IST)", "Status", "Actions"].map(label => <th scope="col" key={label} className="p-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-stone-100">
      {coupons.map(coupon => <tr key={coupon.id} className="align-top"><td className="p-4 font-mono font-bold text-wine-900"><Link href={`/admin/coupons/${coupon.id}`} className="underline">{coupon.code}</Link></td><td className="p-4">{coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : couponMoney(coupon.discountValue)}<p className="mt-1 text-xs text-stone-500">{coupon.maximumDiscount ? `Up to ${couponMoney(coupon.maximumDiscount)}` : ""}</p></td><td className="p-4">{couponMoney(coupon.minimumOrderAmount)}</td><td className="p-4">{coupon.usedCount} / {coupon.usageLimit ?? "Unlimited"}<p className="mt-1 text-xs text-stone-500">{coupon.perUserLimit || "Unlimited"} per customer</p></td><td className="whitespace-nowrap p-4 text-xs text-stone-600">{couponDate(coupon.startDate)}<br />to {couponDate(coupon.endDate)}</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${couponState(coupon, now) === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>{couponState(coupon, now)}</span></td><td className="p-4"><div className="flex gap-3 text-wine-800 underline"><Link href={`/admin/coupons/${coupon.id}`}>View</Link><Link href={`/admin/coupons/${coupon.id}/edit`}>Edit</Link></div></td></tr>)}
      {!coupons.length && <tr><td colSpan={7} className="p-10 text-center text-stone-500">{total ? "No coupons match your filters." : "No promo coupons yet. Create your first offer."}</td></tr>}
    </tbody></table></div>
    <Pagination path="/admin/coupons" params={params} {...paging} label="Coupons" />
    <p className="text-xs text-stone-500">Summary counts cover all coupons. Open a coupon to view its rules or delete an unused code.</p>
  </div>;
}
