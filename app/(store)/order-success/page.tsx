import React from "react";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, ShieldCheck } from "lucide-react";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string; orderNumber?: string }> }) {
  const sp = await searchParams;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase">Order Confirmed</span>
        <h1 className="font-serif text-3xl font-bold text-wine-900">Thank You For Your Patronage!</h1>
        <p className="text-xs text-stone-600">Your order has been recorded in our loom dispatch ledger.</p>
      </div>

      <div className="p-5 bg-white rounded-lg border gold-border space-y-2 shadow-sm text-xs">
        <p className="font-bold text-wine-900 text-sm">Order Reference: {sp.orderNumber || "ARN-10001"}</p>
        <p className="text-stone-500">We have sent an order confirmation email and SMS updates to your registered phone number.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        {sp.orderId && (
          <Link
            href={`/orders/${sp.orderId}`}
            className="w-full sm:w-auto px-6 py-3 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider gold-border shadow"
          >
            Track Order Details
          </Link>
        )}
        <Link
          href="/products"
          className="w-full sm:w-auto px-6 py-3 bg-white border border-stone-300 text-wine-900 font-bold text-xs rounded uppercase tracking-wider hover:border-gold-500"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
