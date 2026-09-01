import React from "react";
import { getUserOrders } from "@/lib/services/order.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ChevronRight, Clock, Truck, CheckCircle } from "lucide-react";
import { verifySessionToken } from "@/lib/auth";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  if (!sessionCookie?.value) redirect("/login?callbackUrl=/orders");

  const user = await verifySessionToken(sessionCookie.value);
  if (!user) redirect("/login?callbackUrl=/orders");

  const userId = user.id;
  const orders = await getUserOrders(userId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-ivory-300 pb-4">
        <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">My Account</span>
        <h1 className="font-serif text-3xl font-bold text-wine-900 mt-1">Order History & Tracking</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border gold-border p-8 space-y-4 max-w-md mx-auto">
          <Package className="w-16 h-16 text-gold-500 mx-auto opacity-40" />
          <h2 className="font-serif text-2xl font-bold text-wine-900">No orders placed yet</h2>
          <p className="text-xs text-stone-500">Your future order history will appear here.</p>
          <Link href="/products" className="inline-block px-8 py-3 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase gold-border shadow">
            Browse Silk Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-6 bg-white rounded-lg border gold-border space-y-4 shadow-sm hover:border-gold-500 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 text-xs">
                <div>
                  <span className="font-bold text-wine-900 text-sm">Order #{order.orderNumber}</span>
                  <span className="text-stone-400 ml-3">{new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider bg-wine-800 text-gold-300">
                    {order.status}
                  </span>
                  <span className="font-bold text-sm text-wine-900">₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-x-auto">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 flex-shrink-0">
                      <img src={item.product.images[0]?.url || "/images/placeholder.jpg"} alt={item.productName} className="w-14 h-16 object-cover rounded bg-stone-100" />
                      <div className="text-xs hidden sm:block">
                        <p className="font-semibold text-wine-900 line-clamp-1 max-w-[180px]">{item.productName}</p>
                        <p className="text-[11px] text-stone-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/orders/${order.id}`}
                  className="px-4 py-2 bg-ivory-100 border border-stone-300 text-wine-900 font-bold text-xs rounded hover:border-gold-500 flex items-center gap-1"
                >
                  View Details <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}