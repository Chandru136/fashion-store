import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { IndianRupee, ShoppingBag, Users, Package, AlertTriangle, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";

export default async function AdminDashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalRevenueResult,
    todayRevenueResult,
    totalOrders,
    pendingOrders,
    totalCustomers,
    totalProducts,
    lowStockCount,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: todayStart },
      },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.inventory.count({ where: { availableStock: { lte: 5 } } }),
    prisma.order.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.total || 0;
  const todayRevenue = todayRevenueResult._sum.total || 0;

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Today's Sales", value: `₹${todayRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingBag, color: "text-wine-900 bg-ivory-50 border-gold-300" },
    { label: "Pending Orders", value: pendingOrders.toLocaleString(), icon: AlertTriangle, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "Active Customers", value: totalCustomers.toLocaleString(), icon: Users, color: "text-purple-700 bg-purple-50 border-purple-200" },
    { label: "Active Products", value: totalProducts.toLocaleString(), icon: Package, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    { label: "Low Stock Items", value: lowStockCount.toLocaleString(), icon: AlertTriangle, color: "text-red-700 bg-red-50 border-red-200" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-wine-900">Executive Analytics Overview</h1>
        <p className="text-xs text-stone-500 mt-1">Real-time performance metrics aggregated from PostgreSQL server layer.</p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`p-5 rounded-xl border ${item.color} shadow-sm space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">{item.label}</span>
                <Icon className="w-5 h-5 opacity-70" />
              </div>
              <p className="font-serif text-2xl font-bold text-wine-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Ledger Table */}
      <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="font-serif font-bold text-wine-900 text-lg">Recent Customer Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-wine-800 hover:underline flex items-center gap-1">
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="p-3 font-bold text-wine-900">{ord.orderNumber}</td>
                  <td className="p-3">
                    <p className="font-semibold text-stone-800">{ord.user.name}</p>
                    <p className="text-[10px] text-stone-400">{ord.user.email}</p>
                  </td>
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
                      className="px-3 py-1 bg-stone-100 border border-stone-300 text-stone-800 font-bold rounded text-[11px] hover:border-gold-500"
                    >
                      Manage
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
