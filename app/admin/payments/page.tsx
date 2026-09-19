import { Pagination } from "@/components/common/ListControls";
import { pagination, value, type ListPageProps } from "@/lib/listing";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { paymentActor } from "@/lib/payments/actor";
import { PaymentManagementControls } from "@/components/payments/PaymentManagementControls";
export const dynamic = "force-dynamic";
export default async function PaymentOperationsPage({ searchParams }: ListPageProps) {
  await paymentActor(true);
  const sp = await searchParams;
  const [refundCount, eventCount, errorCount] = await Promise.all([
    prisma.paymentRefund.count(),
    prisma.paymentWebhook.count({ where: { status: { not: "PROCESSED" } } }),
    prisma.payment.count({ where: { lastError: { not: null } } }),
  ]);
  const refundsPage = pagination(refundCount, value(sp, "refundPage"));
  const eventsPage = pagination(eventCount, value(sp, "eventPage"));
  const errorsPage = pagination(errorCount, value(sp, "errorPage"));
  const [worker, refunds, events, errors, pending, lastWebhook] = await Promise.all([
    prisma.paymentMaintenance.findUnique({ where: { id: "payments" } }),
    prisma.paymentRefund.findMany({ include: { payment: { include: { order: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], skip: refundsPage.skip, take: refundsPage.take }),
    prisma.paymentWebhook.findMany({ where: { status: { not: "PROCESSED" } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: eventsPage.skip, take: eventsPage.take }),
    prisma.payment.findMany({ where: { lastError: { not: null } }, include: { order: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: errorsPage.skip, take: errorsPage.take }),
    prisma.order.count({ where: { paymentMethod: "ONLINE", status: "PENDING" } }),
    prisma.paymentWebhook.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);
  const stale = !worker?.lastSucceededAt || Date.now() - worker.lastSucceededAt.getTime() > 600000;
  return <div className="space-y-6">
    <h1 className="text-2xl font-bold">Payment operations</h1>
    <p className={stale ? "text-red-700" : "text-green-700"}>Recovery worker: {stale ? "Needs attention — no successful run in the last 10 minutes" : "Healthy"}. Last success: {worker?.lastSucceededAt?.toISOString() || "Never"}</p>
    <p>{pending} pending orders. Last signed webhook: {lastWebhook?.createdAt.toISOString() || "None received"}.</p>
    {worker?.lastError && <p role="alert">{worker.lastError}</p>}
    <PaymentManagementControls admin />
    <h2 className="text-xl font-semibold">Refunds</h2>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Order</th><th>Amount</th><th>Status</th><th>Attempts / issue</th></tr></thead><tbody>{refunds.map((r) => <tr key={r.id} className="border-b"><td className="py-3"><Link href={`/admin/orders/${r.payment.orderId}`} className="underline">{r.payment.order.orderNumber}</Link></td><td>INR {(r.amountPaise / 100).toFixed(2)}</td><td>{r.status}</td><td>{r.attempts} {r.lastError}</td></tr>)}</tbody></table></div>
    <Pagination path="/admin/payments" params={sp} {...refundsPage} pageKey="refundPage" label="Refunds" />
    <h2 className="text-xl font-semibold">Webhook backlog</h2>
    {events.map((e) => <div key={e.id} className="border rounded p-3"><p>{e.event}: {e.status}, attempts {e.attempts}</p><p>{e.lastError}</p>{e.status === "FAILED" && <PaymentManagementControls admin webhookId={e.id} />}</div>)}
    <Pagination path="/admin/payments" params={sp} {...eventsPage} pageKey="eventPage" label="Webhooks" />
    <h2 className="text-xl font-semibold">Reconciliation issues</h2>
    {errors.map((p) => <div key={p.id} className="border rounded p-3"><Link href={`/admin/orders/${p.orderId}`} className="underline">{p.order.orderNumber}</Link><p>{p.lastError}</p><PaymentManagementControls admin orderId={p.orderId} /></div>)}
    <Pagination path="/admin/payments" params={sp} {...errorsPage} pageKey="errorPage" label="Reconciliation issues" />
  </div>;
}
