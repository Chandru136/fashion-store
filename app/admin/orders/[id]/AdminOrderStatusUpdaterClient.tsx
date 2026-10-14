"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/app/actions/order.actions";
import { Truck } from "lucide-react";

import type { OrderStatus } from "@prisma/client";
import { allowedAdminOrderStatuses } from "@/lib/order-status-policy";

export function AdminOrderStatusUpdaterClient({
  orderId,
  currentStatus,
  currentTracking,
  paymentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: string;
  currentTracking: string;
}) {
  const [status, setStatus] = useState<string>(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState(currentTracking);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setStatus(currentStatus); setTrackingNumber(currentTracking); }, [currentStatus, currentTracking]);
  const terminal = ["CANCELLED", "REFUNDED", "RETURNED"].includes(currentStatus);
  const choices = [currentStatus, ...allowedAdminOrderStatuses(currentStatus, paymentStatus === "PAID")];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null); setSuccessMsg(false);
    try {
      const res = await updateOrderStatusAction(orderId, status, trackingNumber);
      if (res.success) { setSuccessMsg(true); router.refresh(); }
      else setError(res.error || "Unable to update this order.");
    } catch { setError("Unable to update this order. Refresh and try again."); }
    finally { setIsUpdating(false); }

  };

  return (
    <form onSubmit={handleUpdate} className="p-6 bg-ivory-50 rounded-xl border gold-border shadow-sm space-y-4 text-xs">
      <h3 className="font-serif font-bold text-wine-900 text-sm flex items-center gap-1.5">
        <Truck className="w-4 h-4 text-gold-600" /> Update Order Fulfillment & Tracking
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-bold text-stone-700 block mb-1">Order Status</label>
          <select
            disabled={terminal}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded font-semibold text-wine-900 focus:outline-none focus:border-gold-500"
          >
            {choices.map(choice => <option key={choice} value={choice}>{choice.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1">Courier AWB / Tracking #</label>
          <input
            disabled={terminal}
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. AWB98765432"
            className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isUpdating || terminal}
            className="w-full py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-wider rounded gold-border shadow hover:brightness-110"
          >
            {isUpdating ? "Saving..." : successMsg ? "✓ Updated!" : "Update Status"}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
      {terminal && <p className="mt-3 text-stone-600">This order is closed for fulfillment updates.</p>}
    </form>
  );
}
