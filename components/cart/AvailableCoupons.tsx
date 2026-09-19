"use client";

import { useEffect, useState } from "react";
import { ChevronDown, TicketPercent } from "lucide-react";
import { offerLabel, type StorefrontCoupon } from "@/lib/storefront-coupons";

export function AvailableCoupons({ subtotal, appliedCode, disabled, onApply }: {
  subtotal: number; appliedCode?: string; disabled: boolean; onApply: (code: string) => void;
}) {
  const [offers, setOffers] = useState<StorefrontCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch("/api/coupons", { cache: "no-store" });
        if (!response.ok) throw new Error("Unavailable");
        const data: StorefrontCoupon[] = await response.json();
        if (!cancelled) { setOffers(data); setError(false); }
      } catch { if (!cancelled) { setOffers([]); setError(true); } }
      finally { if (!cancelled) setLoading(false); }
    }
    void refresh();
    const poll = setInterval(refresh, 60000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener("focus", refresh);
    return () => { cancelled = true; clearInterval(poll); clearInterval(clock); window.removeEventListener("focus", refresh); };
  }, []);

  const active = offers.filter(offer => Date.parse(offer.startDate) <= now && Date.parse(offer.endDate) >= now);
  return <details className="group rounded-lg border border-stone-200 bg-white">
    <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-xs font-semibold text-wine-900 [&::-webkit-details-marker]:hidden">
      <TicketPercent aria-hidden="true" className="h-4 w-4 text-gold-600" />
      <span className="flex-1">View available coupons{!loading && !error ? ` (${active.length})` : ""}</span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
    </summary>
    <div className="max-h-80 space-y-3 overflow-y-auto border-t border-stone-100 p-3">
      {loading ? <p role="status" className="text-xs text-stone-500">Loading offers...</p>
        : error ? <p role="status" className="text-xs text-stone-500">Offers are temporarily unavailable. You can still enter a code above.</p>
        : active.length === 0 ? <p className="text-xs text-stone-500">No public coupons available right now.</p>
        : active.map(offer => {
          const remaining = Math.max(0, offer.minimumOrderAmount - subtotal);
          const applied = appliedCode === offer.code;
          return <div key={offer.code} className="rounded-md border border-dashed border-gold-400 bg-ivory-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-sm font-bold text-wine-900">{offerLabel(offer)}</p><p className="mt-1 break-all text-xs font-semibold tracking-wide text-wine-800">{offer.code}</p></div>
              <button type="button" disabled={disabled || remaining > 0 || applied} onClick={() => onApply(offer.code)} aria-label={applied ? `${offer.code} applied` : `Apply ${offer.code}`} className="shrink-0 rounded border gold-border px-3 py-2 text-xs font-bold text-wine-900 hover:bg-ivory-200 disabled:cursor-not-allowed disabled:opacity-50">{applied ? "Applied" : "Apply"}</button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-600">{offer.minimumOrderAmount > 0 ? `Minimum order \u20b9${offer.minimumOrderAmount.toLocaleString("en-IN")}. ` : "No minimum order. "}{offer.maximumDiscount ? `Save up to \u20b9${offer.maximumDiscount.toLocaleString("en-IN")}. ` : ""}Valid until {new Date(offer.endDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })} IST. Usage limits apply.</p>
            {remaining > 0 && <p className="mt-2 text-xs font-medium text-amber-800">Add {"\u20b9"}{remaining.toLocaleString("en-IN", { maximumFractionDigits: 2 })} more to use this coupon.</p>}
          </div>;
        })}
      <p className="text-[11px] text-stone-500">One coupon per order. Eligibility is checked when you apply.</p>
    </div>
  </details>;
}
