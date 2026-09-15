
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { RoleSelect } from "./RoleSelect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer Details | Sudha Collections" };

const pageSize = 25;
const date = (value: Date) => value.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default async function AdminCustomersPage({ searchParams }: {
  searchParams: Promise<{ q?: string; status?: string; role?: string; page?: string }>;
}) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/login?callbackUrl=/admin/customers");
  const actor = await prisma.user.findUnique({ where: { id: session.id }, select: { role: true, status: true } });
  if (!actor || actor.status !== "ACTIVE" || !hasPermission(actor.role, PERMISSIONS.VIEW_CUSTOMERS)) {
    return <p role="alert" className="rounded-lg border border-stone-200 bg-ivory-50 p-6">You do not have permission to view customer details.</p>;
  }

  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 200);
  const status = ["ACTIVE", "INACTIVE", "BLOCKED"].includes(params.status || "") ? params.status! : "";
  const requestedPage = Number(params.page || 1);
  const role = params.role === "CUSTOMER" || params.role === "ADMIN" ? params.role : "";
  const where: Prisma.UserWhereInput = {
    ...(role === "CUSTOMER" ? { role: "CUSTOMER" as const } : role === "ADMIN" ? { role: { in: ["ADMIN", "SUPER_ADMIN"] as ("ADMIN" | "SUPER_ADMIN")[] } } : {}),
    ...(status ? { status } : {}),
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { addresses: { some: { phone: { contains: query, mode: "insensitive" } } } },
    ] } : {}),
  };
  const total = role ? await prisma.user.count({ where }) : 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isSafeInteger(requestedPage) ? Math.min(pages, Math.max(1, requestedPage)) : 1;
  const customers = role ? await prisma.user.findMany({
    where, skip: (page - 1) * pageSize, take: pageSize,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true, name: true, email: true, phone: true, role: true, status: true, createdAt: true,
      _count: { select: { orders: true } },
      addresses: {
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        select: { id: true, name: true, phone: true, addressLine1: true, addressLine2: true, city: true, state: true, pincode: true, country: true, isDefault: true },
      },
      orders: {
        take: 5, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true, orderNumber: true, total: true, status: true, paymentStatus: true, createdAt: true },
      },
    },
  }) : [];
  const pageUrl = (next: number) => {
    const values = new URLSearchParams({ page: String(next) });
    if (query) values.set("q", query);
    if (status) values.set("status", status);
    if (role) values.set("role", role);
    return `/admin/customers?${values}`;
  };

  return <div className="space-y-6">
    <div className="border-b border-stone-200 pb-4">
      <h1 className="font-serif text-3xl font-bold text-wine-900">Customer Details</h1>
      <p className="mt-1 text-sm text-stone-500">View all Sudha Collections user accounts, saved addresses, and recent orders.</p>
    </div>

    <div className="space-y-4 rounded-xl border border-stone-200 bg-ivory-50 p-6 shadow-sm">
      <form action="/admin/customers" className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label htmlFor="customer-search" className="mb-1 block text-xs font-semibold text-stone-600">Search accounts</label>
          <input id="customer-search" name="q" defaultValue={query} placeholder="Name, email, or phone" maxLength={200}
            className="w-full rounded border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="customer-role" className="mb-1 block text-xs font-semibold text-stone-600">Account role</label>
          <RoleSelect key={role} role={role} />
        </div>
        <div>
          <label htmlFor="customer-status" className="mb-1 block text-xs font-semibold text-stone-600">Account status</label>
          <select id="customer-status" name="status" defaultValue={status} className="rounded border border-stone-300 px-3 py-2 text-sm">
            <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="BLOCKED">Blocked</option>
          </select>
        </div>
        <button type="submit" className="wine-gradient-bg rounded px-4 py-2 text-sm font-semibold text-gold-300">Search</button>
        {(query || status || role) && <Link href="/admin/customers" className="px-2 py-2 text-sm text-wine-900 underline">Clear filters</Link>}
      </form>
      {role && <>
      <p className="text-sm text-stone-500">{total} matching {total === 1 ? "account" : "accounts"}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-600">
            <tr>{["Customer", "Contact", "Status", "Joined", "Orders", "Details"].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {customers.map(customer => <tr key={customer.id} className="align-top hover:bg-ivory-50">
              <td className="p-3 font-semibold text-wine-900">{customer.name || "Name not provided"}<p className="mt-1 text-xs font-normal text-stone-500">{customer.role.replaceAll("_", " ")}</p></td>
              <td className="p-3"><p className="break-all">{customer.email}</p><p className="mt-1 text-stone-500">{customer.phone || customer.addresses[0]?.phone || "Phone not provided"}</p></td>
              <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${customer.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"}`}>{customer.status}</span></td>
              <td className="whitespace-nowrap p-3 text-stone-500">{date(customer.createdAt)}</td>
              <td className="p-3">{customer._count.orders}</td>
              <td className="p-3">
                <details className="min-w-60">
                  <summary className="cursor-pointer font-semibold text-wine-900">View details<span className="sr-only"> for {customer.name}</span></summary>
                  <div className="mt-3 space-y-4 text-xs">
                    <section className="space-y-2">
                      <h2 className="font-bold text-stone-700">Saved addresses</h2>
                      {customer.addresses.length === 0 && <p className="text-stone-500">No saved addresses.</p>}
                      {customer.addresses.map(address => <div key={address.id} className="rounded border border-stone-200 p-3">
                        <p className="font-semibold">{address.name}{address.isDefault ? " (Default)" : ""}</p>
                        <p>{[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode, address.country].filter(Boolean).join(", ")}</p>
                        <p className="mt-1 text-stone-500">{address.phone}</p>
                      </div>)}
                    </section>
                    <section className="space-y-2">
                      <h2 className="font-bold text-stone-700">Recent orders (latest 5)</h2>
                      {customer.orders.length === 0 && <p className="text-stone-500">No orders yet.</p>}
                      {customer.orders.map(order => <div key={order.id} className="rounded border border-stone-200 p-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-wine-900 underline">{order.orderNumber}</Link>
                        <p className="mt-1">{date(order.createdAt)} · {money.format(order.total)}</p>
                        <p>{order.status} · Payment: {order.paymentStatus}</p>
                      </div>)}
                    </section>
                  </div>
                </details>
              </td>
            </tr>)}
            {customers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-stone-500">{query || status || role ? "No accounts match your filters." : "No user accounts have been registered yet."}</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Customer list pagination" className="flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
        <p className="text-stone-500">Page {page} of {pages}</p>
        <div className="flex gap-4">
          {page > 1 && <Link href={pageUrl(page - 1)} className="font-semibold text-wine-900 underline">Previous</Link>}
          {page < pages && <Link href={pageUrl(page + 1)} className="font-semibold text-wine-900 underline">Next</Link>}
        </div>
      </nav>
      </>}
    </div>
  </div>;
}
