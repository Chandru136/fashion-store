"use client";
import React, { useEffect, useState } from "react";
import { applyCouponAction } from "@/app/actions/cart.actions";
import { COUPON_STORAGE_KEY } from "@/lib/storefront-coupons";
import { AvailableCoupons } from "./AvailableCoupons";

type AppliedCoupon = { code: string; discountAmount: number; tax: number; grandTotal: number };
export function useCartCoupon(cart: { subtotal: number; tax: number; shipping: number; items: unknown[] }) {
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [quote, setQuote] = useState<{ key: string; coupon: AppliedCoupon } | null>(null);
  const key = JSON.stringify([selected, cart.subtotal, cart.tax, cart.shipping, cart.items]);
  useEffect(() => {
    let code = new URLSearchParams(window.location.search).get("coupon") || "";
    try { code ||= sessionStorage.getItem(COUPON_STORAGE_KEY) || ""; } catch { /* Storage is optional. */ }
    code = code.trim().toUpperCase().slice(0, 40);
    setDraft(code); setSelected(code); setReady(true);
  }, []);
  useEffect(() => {
    if (!selected || !ready || cart.items.length === 0) { setChecking(false); return; }
    let cancelled = false;
    setChecking(true);
    applyCouponAction(selected).then(result => {
      if (cancelled) return;
      if (result.success && result.coupon) {
        setQuote({ key, coupon: result.coupon }); setError("");
        try { sessionStorage.setItem(COUPON_STORAGE_KEY, result.coupon.code); } catch { /* Storage is optional. */ }
      } else {
        setQuote(null); setSelected(""); setError(result.error || "Coupon is no longer available.");
        try { sessionStorage.removeItem(COUPON_STORAGE_KEY); } catch { /* Storage is optional. */ }
      }
    }).catch(() => { if (!cancelled) { setQuote(null); setSelected(""); setError("Unable to verify the coupon. Please apply it again."); } })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [selected, ready, key, tick, cart.items.length]);
  useEffect(() => {
    if (!selected) return;
    const refresh = () => setTick(current => current + 1);
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [selected]);
  return {
    draft, setDraft, error, applied: quote?.key === key && selected ? quote.coupon : null,
    pending: !ready || checking || Boolean(selected && quote?.key !== key),
    apply: () => { setError(""); setQuote(null); setSelected(draft.trim().toUpperCase()); setTick(current => current + 1); },
    applyCode: (code: string) => { setDraft(code); setError(""); setQuote(null); setSelected(code.trim().toUpperCase()); setTick(current => current + 1); },
    remove: () => { setSelected(""); setQuote(null); setDraft(""); setChecking(false); setError(""); try { sessionStorage.removeItem(COUPON_STORAGE_KEY); } catch { /* Storage is optional. */ } },
  };
}
export function CouponControl({ coupon, disabled = false, subtotal }: { coupon: ReturnType<typeof useCartCoupon>; disabled?: boolean; subtotal?: number }) {
  return <section className="space-y-3 rounded-lg border gold-border bg-ivory-50 p-5">
    <h3 className="font-serif text-sm font-bold text-wine-900">Promo coupon</h3>
    <div className="flex gap-2"><input aria-label="Promo coupon code" maxLength={40} disabled={disabled || coupon.pending} value={coupon.draft} onChange={event => coupon.setDraft(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (!coupon.pending && coupon.draft.trim()) coupon.apply(); } }} placeholder="Enter coupon code" className="min-w-0 flex-1 rounded border border-stone-300 px-3 py-2 text-xs uppercase" /><button type="button" disabled={disabled || coupon.pending || !coupon.draft.trim()} onClick={coupon.apply} className="wine-gradient-bg rounded px-4 py-2 text-xs font-bold text-gold-300 disabled:opacity-50">{coupon.pending ? "Checking…" : "Apply"}</button></div>
    {coupon.applied && <p role="status" className="text-xs text-emerald-700">{coupon.applied.code} applied. You save ₹{coupon.applied.discountAmount.toLocaleString("en-IN")}. <button disabled={disabled || coupon.pending} type="button" onClick={coupon.remove} className="underline">Remove</button></p>}
    {coupon.error && <p role="alert" className="text-xs text-red-700">{coupon.error}</p>}
    {subtotal !== undefined && <AvailableCoupons subtotal={subtotal} appliedCode={coupon.applied?.code} disabled={disabled || coupon.pending} onApply={coupon.applyCode} />}
  </section>;
}
