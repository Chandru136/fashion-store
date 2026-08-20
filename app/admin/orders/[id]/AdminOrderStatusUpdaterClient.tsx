"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/app/actions/order.actions";
import { CheckCircle2, Truck, RefreshCw } from "lucide-react";

export function AdminOrderStatusUpdaterClient({
  orderId,
  currentStatus,
  currentTracking,
}: {
  orderId: string;
  currentStatus: string;
  currentTracking: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState(currentTracking);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const res = await updateOrderStatusAction(orderId, status, trackingNumber);
    setIsUpdating(false);

    if (res.success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2000);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-6 bg-white rounded-xl border gold-border shadow-sm space-y-4 text-xs">
      <h3 className="font-serif font-bold text-wine-900 text-sm flex items-center gap-1.5">
        <Truck className="w-4 h-4 text-gold-600" /> Update Order Fulfillment & Tracking
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-bold text-stone-700 block mb-1">Order Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded font-semibold text-wine-900 focus:outline-none focus:border-gold-500"
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1">Courier AWB / Tracking #</label>
          <input
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
            disabled={isUpdating}
            className="w-full py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-wider rounded gold-border shadow hover:brightness-110"
          >
            {isUpdating ? "Saving..." : successMsg ? "✓ Updated!" : "Update Status"}
          </button>
        </div>
      </div>
    </form>
  );
}
