import { ListControls, Pagination } from "@/components/common/ListControls";
import { pagination, value, choice, priceSorts, options, type ListPageProps } from "@/lib/listing";
import { OrderStatus, type Prisma } from "@prisma/client";
import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { placedOrderWhere } from "@/lib/services/order.service";

export default async function AdminOrdersPage({ searchParams }: ListPageProps) {
  const sp = await searchParams;
  const statusFilter = choice(sp, "status", Object.values(OrderStatus)) as OrderStatus | "";
  const searchQuery = value(sp, "q");
  const sort = choice(sp, "sort", priceSorts.map(o => o.value), "newest");

  const whereClause: Prisma.OrderWhereInput = { AND: [placedOrderWhere] };
  if (statusFilter) whereClause.status = statusFilter;
  if (searchQuery) {
    whereClause.OR = [
      { orderNumber: { contains: searchQuery, mode: "insensitive" } },
      { shippingName: { contains: searchQuery, mode: "insensitive" } },
      { shippingPhone: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const paging = pagination(await prisma.order.count({ where: whereClause }), value(sp, "page"));
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { quantity: true } },
    },
    orderBy: [sort === "price_asc" || sort === "price_desc" ? { total: sort === "price_asc" ? "asc" : "desc" } : { createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }],
    skip: paging.skip, take: paging.take,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-bold text-wine-900">Orders &amp; Fulfillment Control</h1>
        <p className="text-xs text-stone-500 mt-1">Manage order statuses (PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → DELIVERED), print invoices, and update tracking numbers.</p>
      </div>

      {/* Orders Table */}
      <div className="p-6 bg-ivory-50 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col items-stretch gap-4">
          <ListControls path="/admin/orders" params={sp} search="Order number, name or phone" sorts={priceSorts} filters={[{ key: "status", label: "Status", options: options(Object.values(OrderStatus)) }]} />
          <span className="text-xs font-semibold text-stone-600">Matching Orders: {paging.totalCount}</span>
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
          <Pagination path="/admin/orders" params={sp} {...paging} />
        </div>
      </div>
    </div>
  );
}
