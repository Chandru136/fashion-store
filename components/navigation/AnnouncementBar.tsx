"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { COUPON_STORAGE_KEY, offerLabel, type StorefrontCoupon } from "@/lib/storefront-coupons";
import styles from "./AnnouncementBar.module.css";

export function AnnouncementBar({ initialCoupons = [] }: { initialCoupons?: StorefrontCoupon[] }) {
  const [visible, setVisible] = useState(true);
  const [coupons, setCoupons] = useState(initialCoupons);
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
  if (!visible || active.length === 0) return null;
  return <section aria-label="Sudha Collections coupon offers" className={`${styles.bar} wine-gradient-bg border-b gold-border text-xs text-ivory-50`}>
    <div className={styles.viewport}>
      <div className={styles.track} style={{ animationDuration: `${Math.max(28, active.length * 24)}s` }}>
        {[false, true].map(duplicate => <div key={String(duplicate)} className={styles.group} aria-hidden={duplicate || undefined}>
          {active.map(offer => <Link key={offer.code} tabIndex={duplicate ? -1 : undefined} href={`/cart?coupon=${encodeURIComponent(offer.code)}`} onClick={() => { try { sessionStorage.setItem(COUPON_STORAGE_KEY, offer.code); } catch { /* URL also carries the code. */ } }} className={styles.offer}>
            <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-400" />
            <span className="font-semibold">{offerLabel(offer)}</span>
            <span className="font-bold text-gold-300 underline underline-offset-4">Use {offer.code}</span>
            <span className="text-[11px]">{offer.minimumOrderAmount > 0 ? `Orders from \u20b9${offer.minimumOrderAmount.toLocaleString("en-IN")}. ` : ""}{offer.maximumDiscount ? `Save up to \u20b9${offer.maximumDiscount.toLocaleString("en-IN")}. ` : ""}Ends {new Date(offer.endDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })} IST. Usage limits apply.</span>
          </Link>)}
        </div>)}
      </div>
    </div>
    <button type="button" onClick={() => setVisible(false)} aria-label="Close announcement" className="shrink-0 p-2"><X className="h-4 w-4" /></button>
  </section>;
}
