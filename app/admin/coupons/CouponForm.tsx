"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveCouponAction } from "@/app/actions/coupon.actions";

export type CouponFormValues = {
  id?: string; code: string; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; discountValue: number;
  minimumOrderAmount: number; maximumDiscount: number | null; usageLimit: number | null; perUserLimit: number;
  startDate: string; endDate: string; status: string;
};
const inputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none";
export function CouponForm({ initial }: { initial: CouponFormValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [code, setCode] = useState(initial.code);
  const [type, setType] = useState(initial.discountType);
  return <form className="max-w-4xl space-y-6" onSubmit={event => {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    startTransition(async () => {
      try {
        const result = await saveCouponAction(input, initial.id);
        if (!result.success) { setError(result.error); return; }
        router.push(`/admin/coupons/${result.id}?saved=1`);
        router.refresh();
      } catch { setError("Unable to connect. Please try again."); }
    });
  }}>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
      <section className="space-y-4 rounded-xl border border-stone-200 bg-ivory-50 p-6">
        <h2 className="font-serif text-xl font-bold text-wine-900">Coupon details</h2>
        <label className="block space-y-1 text-sm font-semibold">Coupon code
          <input name="code" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_-]+" value={code} readOnly={Boolean(initial.id)} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="SC-WELCOME10" className={`${inputClass} font-mono uppercase`} />
        </label>
        {initial.id ? <p className="text-xs text-stone-500">The code stays fixed so existing orders keep their coupon history.</p> : <button type="button" onClick={() => setCode(`SC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`)} className="text-sm font-semibold text-wine-800 underline">Generate a code</button>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold">Discount type<select name="discountType" value={type} onChange={event => setType(event.target.value as CouponFormValues["discountType"])} className={inputClass}><option value="PERCENTAGE">Percentage off</option><option value="FIXED_AMOUNT">Fixed amount off (INR)</option></select></label>
          <label className="space-y-1 text-sm font-semibold">{type === "PERCENTAGE" ? "Discount (%)" : "Discount (INR)"}<input name="discountValue" type="number" required min="0.01" max={type === "PERCENTAGE" ? 100 : 10000000} step="0.01" defaultValue={initial.discountValue || ""} className={inputClass} /></label>
          <label className="space-y-1 text-sm font-semibold">Minimum order subtotal (INR)<input name="minimumOrderAmount" type="number" min="0" max="10000000" required step="0.01" defaultValue={initial.minimumOrderAmount} className={inputClass} /></label>
          {type === "PERCENTAGE" && <label className="space-y-1 text-sm font-semibold">Maximum discount (INR, optional)<input name="maximumDiscount" type="number" min="0.01" max="10000000" step="0.01" defaultValue={initial.maximumDiscount ?? ""} placeholder="No cap" className={inputClass} /></label>}
        </div>
        <p className="text-xs text-stone-500">Applies to the merchandise subtotal across the store. Shipping is excluded. Customers enter one coupon code at checkout.</p>
      </section>
      <section className="space-y-4 rounded-xl border border-stone-200 bg-ivory-50 p-6">
        <h2 className="font-serif text-xl font-bold text-wine-900">Usage limits</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold">Total redemption limit (optional)<input name="usageLimit" type="number" min="1" max="2147483647" step="1" defaultValue={initial.usageLimit ?? ""} placeholder="Unlimited" className={inputClass} /></label>
          <label className="space-y-1 text-sm font-semibold">Uses per customer<input name="perUserLimit" type="number" required min="1" max="2147483647" step="1" defaultValue={initial.perUserLimit || 1} className={inputClass} /></label>
        </div>
        <p className="text-xs text-stone-500">Usage is tracked automatically, including reserved checkouts. Releasing a cancelled checkout restores its coupon use. Editing a coupon does not reset usage.</p>
      </section>
      <section className="space-y-4 rounded-xl border border-stone-200 bg-ivory-50 p-6">
        <h2 className="font-serif text-xl font-bold text-wine-900">Schedule & availability</h2>
        <p className="text-xs text-stone-500">All dates and times are Indian Standard Time (IST, UTC+05:30).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold">Starts at<input name="startDate" type="datetime-local" required defaultValue={initial.startDate} className={inputClass} /></label>
          <label className="space-y-1 text-sm font-semibold">Ends at<input name="endDate" type="datetime-local" required defaultValue={initial.endDate} className={inputClass} /></label>
          <label className="space-y-1 text-sm font-semibold">Availability<select name="status" defaultValue={initial.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"} className={inputClass}><option value="ACTIVE">Enabled (follows schedule and limits)</option><option value="INACTIVE">Inactive</option></select></label>
        </div>
      </section>
      <div className="flex items-center gap-4"><button type="submit" className="wine-gradient-bg rounded-lg px-6 py-3 text-sm font-bold text-gold-300">{pending ? "Saving…" : initial.id ? "Save changes" : "Create coupon"}</button><Link href={initial.id ? `/admin/coupons/${initial.id}` : "/admin/coupons"} className="text-sm text-stone-600 underline">Cancel</Link></div>
    </fieldset>
  </form>;
}
