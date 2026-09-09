import { prisma } from "@/lib/db";
import { applyPayment, reconcilePayment } from "./checkout.service";
import { applyRefund, cancelOrder, processRefund, refundSchema } from "./lifecycle.service";
import { fetchPayment, razorpayRequest } from "./razorpay";

export async function processWebhook(id: string) {
  const event = await prisma.paymentWebhook.findUniqueOrThrow({ where: { id } });
  if (event.status === "PROCESSED") return;
  try {
    if (event.refundId) {
      const refund = refundSchema.parse(await razorpayRequest(`refunds/${event.refundId}`));
      await applyRefund(refund);
      const payment = await fetchPayment(refund.payment_id);
      const known = await prisma.payment.findUnique({ where: { gatewayOrderId: payment.order_id } });
      if (known) await applyPayment(payment);
    } else if (event.paymentId) {
      const payment = await fetchPayment(event.paymentId);
      const known = await prisma.payment.findUnique({ where: { gatewayOrderId: payment.order_id } });
      // A shared Razorpay account can send events for other applications.
      if (known) await applyPayment(payment);
    }
    await prisma.paymentWebhook.update({ where: { id }, data: { status: "PROCESSED", attempts: { increment: 1 }, lastError: null } });
  } catch {
    await prisma.paymentWebhook.updateMany({ where: { id, status: { not: "PROCESSED" } }, data: {
      status: event.attempts >= 9 ? "FAILED" : "PENDING", attempts: { increment: 1 },
      lastError: "Gateway synchronization failed. Retry or inspect payment credentials and gateway availability.",
      nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(event.attempts, 7))),
    } });
  }
}

export async function runPaymentMaintenance() {
  const id = "payments";
  await prisma.paymentMaintenance.upsert({ where: { id }, create: { id, lockedUntil: new Date(0) }, update: {} });
  const started = new Date();
  const claimed = await prisma.paymentMaintenance.updateMany({ where: { id, lockedUntil: { lte: started } }, data: { lockedUntil: new Date(Date.now() + 180000), lastStartedAt: started } });
  if (!claimed.count) return { skipped: true };
  const deadline = Date.now() + 45000;
  const counts = { expired: 0, webhooks: 0, reconciled: 0, refunds: 0 };
  try {
    const expired = await prisma.order.findMany({ where: { status: "PENDING", paymentMethod: "ONLINE", expiresAt: { lte: started } }, take: 20, orderBy: { expiresAt: "asc" } });
    for (const order of expired) {
      if (Date.now() > deadline) break;
      await cancelOrder(order.id, { userId: "", admin: true }, "Checkout expired after 30 minutes", true); counts.expired++;
    }
    const refunds = await prisma.paymentRefund.findMany({ where: { status: { in: ["REQUESTED", "SUBMITTED"] }, nextAttemptAt: { lte: started } }, take: 10, orderBy: { nextAttemptAt: "asc" } });
    for (const refund of refunds) {
      if (Date.now() > deadline) break;
      await processRefund(refund.id); counts.refunds++;
    }
    const events = await prisma.paymentWebhook.findMany({ where: { status: "PENDING", nextAttemptAt: { lte: started } }, take: 10, orderBy: { nextAttemptAt: "asc" } });
    for (const event of events) {
      if (Date.now() > deadline) break;
      await processWebhook(event.id); counts.webhooks++;
    }
    const payments = await prisma.payment.findMany({ where: { provider: "RAZORPAY", gatewayOrderId: { not: null }, status: { not: "REFUNDED" }, nextReconcileAt: { lte: started } }, include: { order: true }, take: 10, orderBy: { nextReconcileAt: "asc" } });
    for (const payment of payments) {
      if (Date.now() > deadline) break;
      try {
        await reconcilePayment(payment.orderId, payment.order.userId);
        await prisma.payment.update({ where: { id: payment.id }, data: { lastError: null, reconcileAttempts: 0, nextReconcileAt: new Date(Date.now() + (payment.status === "PAID" || payment.order.status === "CANCELLED" ? 86400000 : 300000)) } });
      } catch {
        await prisma.payment.update({ where: { id: payment.id }, data: { lastError: "Reconciliation failed. Check gateway credentials and availability.", reconcileAttempts: { increment: 1 }, nextReconcileAt: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(payment.reconcileAttempts, 6))) } });
      }
      counts.reconciled++;
    }
    await prisma.paymentMaintenance.update({ where: { id }, data: { lastSucceededAt: new Date(), lastError: null } });
    return counts;
  } catch (error) {
    await prisma.paymentMaintenance.update({ where: { id }, data: { lastError: "Maintenance failed. Inspect server logs and database connectivity." } });
    throw error;
  } finally {
    await prisma.paymentMaintenance.updateMany({ where: { id, lastStartedAt: started }, data: { lockedUntil: new Date(0) } });
  }
}
