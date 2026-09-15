"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelOrderAction, refundOrderAction, reconcileOrderAction, runMaintenanceAction, retryWebhookAction } from "@/app/actions/payment-management.actions";
type Result = { success: boolean; message?: string; error?: string };
export function PaymentManagementControls({ orderId, canCancel = false, canRefund = false, admin = false, webhookId }: { orderId?: string; canCancel?: boolean; canRefund?: boolean; admin?: boolean; webhookId?: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const router = useRouter();
  async function run(action: () => Promise<Result>, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(true); setMessage("");
    try { const result = await action(); setMessage(result.message || result.error || "Done"); router.refresh(); }
    catch { setMessage("Unable to complete this operation. Refresh and check the order status."); }
    finally { setBusy(false); }
  }
  const style = "rounded border border-stone-300 bg-ivory-50 px-3 py-2 text-sm disabled:opacity-50";
  return <div className="space-y-2 print:hidden">
    <div className="flex flex-wrap gap-2">
      {canCancel && orderId && <button className={style} disabled={busy} onClick={() => run(() => cancelOrderAction(orderId), "Cancel this order? Its stock will be released and any captured online payment queued for refund.")}>Cancel order</button>}
      {canRefund && admin && orderId && <button className={style} disabled={busy} onClick={() => run(() => refundOrderAction(orderId, "Full refund approved by order manager"), "Request the remaining full refund for this cancelled or returned order?")}>Request full refund</button>}
      {admin && orderId && <button className={style} disabled={busy} onClick={() => run(() => reconcileOrderAction(orderId))}>Reconcile payment</button>}
      {admin && !orderId && !webhookId && <button className={style} disabled={busy} onClick={() => run(runMaintenanceAction)}>Run recovery batch</button>}
      {admin && webhookId && <button className={style} disabled={busy} onClick={() => run(() => retryWebhookAction(webhookId))}>Retry event</button>}
    </div>
    {(busy || message) && <p role="status" className="text-sm text-stone-700">{busy ? "Processing..." : message}</p>}
  </div>;
}
