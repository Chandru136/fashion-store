"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { COUPON_STORAGE_KEY, offerLabel, type StorefrontCoupon } from "@/lib/storefront-coupons";

export function AnnouncementBar({ initialCoupons = [] }: { initialCoupons?: StorefrontCoupon[] }) {
  const [visible, setVisible] = useState(true);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch("/api/coupons", { cache: "no-store" });
        if (!response.ok) throw new Error("Unavailable");
        const offers: StorefrontCoupon[] = await response.json();
        if (!cancelled) setCoupons(offers);
      } catch { if (!cancelled) setCoupons([]); }
    }
    void refresh();
    const poll = setInterval(refresh, 60000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener("focus", refresh);
    return () => { cancelled = true; clearInterval(poll); clearInterval(clock); window.removeEventListener("focus", refresh); };
  }, []);
  const active = coupons.filter(coupon => Date.parse(coupon.startDate) <= now && Date.parse(coupon.endDate) >= now);
  const offer = active[index % (active.length || 1)];
  if (!visible || !offer) return null;
  return <div className="wine-gradient-bg relative border-b gold-border px-4 py-2 text-xs text-ivory-50">
    <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
      <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-400" />
      <div className="text-center"><p className="font-semibold">{offerLabel(offer)} — <Link href={`/cart?coupon=${encodeURIComponent(offer.code)}`} onClick={() => { try { sessionStorage.setItem(COUPON_STORAGE_KEY, offer.code); } catch { /* URL also carries the code. */ } }} className="font-bold text-gold-300 underline">Use {offer.code}</Link></p>
        <p className="mt-1 text-[11px]">{offer.minimumOrderAmount > 0 ? `On orders from ₹${offer.minimumOrderAmount.toLocaleString("en-IN")}. ` : ""}{offer.maximumDiscount ? `Maximum savings ₹${offer.maximumDiscount.toLocaleString("en-IN")}. ` : ""}Valid until {new Date(offer.endDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })} IST. Usage limits apply.</p>
      </div>
      {active.length > 1 && <button aria-label="Show next offer" onClick={() => setIndex(current => (current + 1) % active.length)} className="shrink-0 p-2 underline">Next offer ({index % active.length + 1}/{active.length})</button>}
      <button onClick={() => setVisible(false)} aria-label="Close announcement" className="shrink-0 p-2"><X className="h-4 w-4" /></button>
    </div>
  </div>;
}
