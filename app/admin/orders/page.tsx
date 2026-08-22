import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ShoppingBag, Search, Filter, Eye } from "lucide-react";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const statusFilter = sp.status;
  const searchQuery = sp.q || "";

  const whereClause: any = {};
  if (statusFilter) whereClause.status = statusFilter;
  if (searchQuery) {
    whereClause.OR = [
      { orderNumber: { contains: searchQuery, mode: "insensitive" } },
      { shippingName: { contains: searchQuery, mode: "insensitive" } },
      { shippingPhone: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-bold text-wine-900">Orders & Fulfillment Control</h1>
        <p className="text-xs text-stone-500 mt-1">Manage order statuses (PENDING {"->"} CONFIRMED {"->"} PROCESSING {"->"} PACKED {"->"} SHIPPED {"->"} DELIVERED), print invoices, and update tracking numbers.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
          <Link
            key={st}
            href={st === "ALL" ? "/admin/orders" : `/admin/orders?status=${st}`}
            className={`px-3 py-1.5 rounded-full border transition-all ${
              (st === "ALL" && !statusFilter) || statusFilter === st
                ? "wine-gradient-bg text-gold-300 gold-border shadow-sm font-bold"
                : "bg-white border-stone-300 text-stone-700 hover:border-gold-500"
            }`}
          >
            {st}
          </Link>
        ))}
      </div>

      {/* Orders Table */}
      <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <form className="relative flex-1 max-w-md">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by Order #, Customer Name, or Phone..."
              className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-xs focus:outline-none focus:border-gold-500"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </form>
          <span className="text-xs font-semibold text-stone-600">Matching Orders: {orders.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Total Payable</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="p-3 font-bold text-wine-900">{ord.orderNumber}</td>
                  <td className="p-3">
                    <p className="font-semibold text-stone-800">{ord.shippingName}</p>
                    <p className="text-[10px] text-stone-500">{ord.shippingPhone}</p>
                  </td>
                  <td className="p-3 text-stone-500">{new Date(ord.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-wine-800 text-gold-300">
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ord.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {ord.paymentStatus} ({ord.paymentMethod})
                    </span>
                  </td>
                  <td className="p-3 font-bold text-wine-900">₹{ord.total.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="px-3 py-1 wine-gradient-bg text-gold-300 font-bold text-[11px] rounded gold-border shadow-sm hover:brightness-110"
                    >
                      Manage Order
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
