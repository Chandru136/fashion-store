import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AdminOrderStatusUpdaterClient } from "./AdminOrderStatusUpdaterClient";
import { MapPin } from "lucide-react";
import { PrintOrderButton } from "./PrintOrderButton";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const order = await prisma.order.findUnique({
    where: { id: p.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">Order Management Ledger</span>
          <h1 className="font-serif text-3xl font-bold text-wine-900 mt-0.5">Order #{order.orderNumber}</h1>
          <p className="text-xs text-stone-500 mt-1">Placed on {new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>

        <PrintOrderButton />
      </div>

      {/* Admin Status Updater Widget */}
      <AdminOrderStatusUpdaterClient orderId={order.id} currentStatus={order.status} currentTracking={order.trackingNumber || ""} />

      {/* Order Summary & Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="md:col-span-2 p-6 bg-white rounded-xl border border-stone-200 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-wine-900 text-sm border-b border-stone-100 pb-2">Line Items ({order.items.length})</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                <img src={item.product.images[0]?.url || "/images/placeholder.jpg"} alt={item.productName} className="w-14 h-16 object-cover rounded bg-stone-100 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-wine-900 text-sm line-clamp-1">{item.productName}</p>
                  <p className="text-stone-500">SKU: {item.sku} • Quantity: {item.quantity}</p>
                  <p className="font-bold text-wine-800 mt-0.5">₹{item.totalPrice.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Payment summary */}
        <div className="p-6 bg-ivory-50 rounded-xl border gold-border space-y-4 shadow-sm">
          <div>
            <h4 className="font-serif font-bold text-wine-900 text-xs uppercase tracking-wider mb-2">Customer Account</h4>
            <p className="font-bold text-stone-900">{order.user.name}</p>
            <p className="text-stone-600 mt-1">{order.user.email}</p>
            {order.user.phone && <p className="text-stone-600 mt-1">Account phone: {order.user.phone}</p>}
          </div>

          <div>
            <h4 className="font-serif font-bold text-wine-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gold-600" /> Shipping Destination
            </h4>
            <p className="font-bold text-stone-900 capitalize">{order.shippingName}</p>
            <p className="text-stone-600 mt-1 capitalize">{order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
            <p className="text-stone-600 font-semibold mt-1">Phone: {order.shippingPhone}</p>
          </div>

          <div className="pt-3 border-t border-ivory-300">
            <h4 className="font-serif font-bold text-wine-900 text-xs uppercase tracking-wider mb-2">Billing Address</h4>
            <p className="font-bold text-stone-900 capitalize">{order.billingName || order.shippingName}</p>
            <p className="text-stone-600 mt-1 capitalize">{order.billingAddress || order.shippingAddress}, {order.billingCity || order.shippingCity}, {order.billingState || order.shippingState} - {order.billingPincode || order.shippingPincode}</p>
            <p className="text-stone-600 font-semibold mt-1">Phone: {order.billingPhone || order.shippingPhone}</p>
          </div>

          <div className="pt-3 border-t border-ivory-300 space-y-1 text-stone-700">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-700 font-semibold"><span>Discount</span><span>-₹{order.discount.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between"><span>GST Tax</span><span>₹{order.tax.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between font-bold text-sm text-wine-900 pt-2 border-t border-ivory-300"><span>Grand Total</span><span>₹{order.total.toLocaleString("en-IN")}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
