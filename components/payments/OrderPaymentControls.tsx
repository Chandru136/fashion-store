"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { openOrderPayment } from "@/lib/payments/checkout.client";
import { paymentStatusAction } from "@/lib/payments/checkout-api.client";

export function OrderPaymentControls({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Payment is pending. If you were debited, check payment status before retrying.");
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    async function recover() {
      try {
        const result = await paymentStatusAction(orderId);
        if (stopped) return;
        if (result.success && result.status === "PAID") {
          router.replace(`/order-success?orderId=${orderId}`);
          return;
        }
        if (result.success && result.status === "REFUNDED") {
          router.refresh();
          return;
        }
      } catch { /* Manual status checking remains available. */ }
      if (!stopped && ++attempts < 10) timer = setTimeout(recover, 3000);
    }
    if (!busy) void recover();
    return () => { stopped = true; clearTimeout(timer); };
  }, [orderId, router, busy]);
  async function run(pay: boolean) {
    setBusy(true);
    try {
      let paid = false;
      if (pay) paid = await openOrderPayment(orderId);
      else {
        const result = await paymentStatusAction(orderId);
        if (!result.success) throw new Error(result.error);
        paid = result.status === "PAID";
      }
      if (paid) router.push(`/order-success?orderId=${orderId}`);
      else if (pay) router.push("/cart");
      else {
        setMessage("Payment is still pending. If you were debited, check payment status before retrying.");
        router.refresh();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to process payment."); }
    finally { setBusy(false); }
  }
  return <div className="rounded-lg border border-gold-400 bg-ivory-50 p-5 space-y-3">
    <p role="status" className="text-sm">{message}</p>
    <div className="flex gap-3">
      <button disabled={busy} onClick={() => run(true)} className="rounded bg-wine-900 px-4 py-2 text-white disabled:opacity-50">{busy ? "Please wait..." : "Complete payment"}</button>
      <button disabled={busy} onClick={() => run(false)} className="rounded border border-stone-300 px-4 py-2 disabled:opacity-50">Check payment status</button>
    </div>
  </div>;
}
