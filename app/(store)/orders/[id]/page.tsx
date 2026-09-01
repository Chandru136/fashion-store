import React from "react";
import { getOrderById } from "@/lib/services/order.service";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Check, Clock, Truck, PackageCheck, MapPin, Printer } from "lucide-react";
import { verifySessionToken } from "@/lib/auth";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sudha_collections_session_user");
  if (!sessionCookie?.value) redirect("/login");

  const user = await verifySessionToken(sessionCookie.value);
  if (!user) redirect("/login");

  const userId = user.id;
  const order = await getOrderById(p.id, userId);

  if (!order) notFound();

  const steps = [
    { label: "Order Placed", key: "PENDING" },
    { label: "Confirmed", key: "CONFIRMED" },
    { label: "Processing", key: "PROCESSING" },
    { label: "Shipped", key: "SHIPPED" },
    { label: "Delivered", key: "DELIVERED" },
  ];

  const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
  const currentStepIdx = statusOrder.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">Order Details</span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine-900 mt-0.5">Order #{order.orderNumber}</h1>
          <p className="text-xs text-stone-500 mt-1">Placed on {new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>

        {order.trackingNumber && (
          <div className="p-3 bg-ivory-50 rounded border gold-border text-xs text-wine-900 font-semibold">
            Tracking Number: <strong className="text-wine-800">{order.trackingNumber}</strong>
          </div>
        )}
      </div>

      {/* Visual Status Progress Tracker (Prompt #21 requirement) */}
      <div className="p-6 bg-white rounded-xl border gold-border shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-wine-900 text-sm">Fulfillment Progress Tracker</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {steps.map((step, idx) => {
            const stepIdx = statusOrder.indexOf(step.key);
            const isDone = currentStepIdx >= stepIdx;

            return (
              <div key={step.key} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                  isDone ? "wine-gradient-bg text-gold-300 shadow" : "bg-stone-100 text-stone-400"
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] ${isDone ? "font-bold text-wine-900" : "text-stone-400"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items & Shipping Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="md:col-span-2 p-6 bg-white rounded-xl border gold-border space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-wine-900 text-sm border-b border-stone-100 pb-2">Ordered Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                <img src={item.product.images[0]?.url || "/images/placeholder.jpg"} alt={item.productName} className="w-16 h-20 object-cover rounded bg-stone-100 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-wine-900 text-sm line-clamp-1">{item.productName}</p>
                  <p className="text-stone-500 mt-0.5">SKU: {item.sku} • Qty: {item.quantity}</p>
                  <p className="font-bold text-wine-800 mt-1">₹{item.totalPrice.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Price Breakdown */}
        <div className="p-6 bg-ivory-50 rounded-xl border gold-border space-y-4 shadow-sm">
          <div>
            <h4 className="font-serif font-bold text-wine-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gold-600" /> Delivery Address
            </h4>
            <p className="font-bold text-stone-900">{order.shippingName}</p>
            <p className="text-stone-600 font-light mt-1">{order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
            <p className="text-stone-600 mt-1">Phone: {order.shippingPhone}</p>
          </div>

          <div className="pt-3 border-t border-ivory-300 space-y-1.5 text-stone-700">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-₹{order.discount.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between"><span>GST Tax</span><span>₹{order.tax.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span></div>
            <div className="flex justify-between pt-2 border-t border-ivory-300 font-bold text-sm text-wine-900"><span>Total Paid</span><span>₹{order.total.toLocaleString("en-IN")}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}