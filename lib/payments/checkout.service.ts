import { queueRefund, releaseReservation, PaymentOperationError } from "./lifecycle.service";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { fetchPayment, gatewayPaymentSchema, GatewayPayment, paymentConfig, razorpayRequest } from "./razorpay";

export async function preparePayment(orderId: string, userId: string) {
  const config = paymentConfig();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
    const order = await tx.order.findFirst({ where: { id: orderId, userId }, include: { payments: true } });
    if (!order || order.paymentMethod !== "ONLINE") throw new Error("Online order not found.");
    if (order.paymentStatus === "PAID") return { paid: true as const, orderId };
    if (order.expiresAt && order.expiresAt <= new Date()) throw new PaymentOperationError("This checkout has expired. Please place a new order.");
    if (order.status !== "PENDING") throw new Error("This order cannot accept payments.");
    const payment = order.payments[0];
    if (!payment || payment.provider !== config.provider || !payment.amountPaise) throw new Error("Payment configuration changed. Contact the store.");
    let gatewayOrderId = payment.gatewayOrderId;
    if (!gatewayOrderId) {
      if (config.provider === "MOCK") gatewayOrderId = `mock_${payment.id}`;
      else {
        const gateway = z.object({ id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount: z.number(), currency: z.string() }).parse(
          await razorpayRequest("orders", { amount: payment.amountPaise, currency: payment.currency, receipt: order.orderNumber, notes: { local_order_id: order.id } }),
        );
        if (gateway.amount !== payment.amountPaise || gateway.currency !== payment.currency) throw new Error("Gateway order amount mismatch.");
        gatewayOrderId = gateway.id;
      }
      await tx.payment.update({ where: { id: payment.id }, data: { gatewayOrderId } });
    }
    return { paid: false as const, orderId, gatewayOrderId, keyId: config.keyId, amount: payment.amountPaise, currency: payment.currency,
      mock: config.provider === "MOCK", name: order.shippingName, contact: order.shippingPhone };
  }, { timeout: 25000 });
}

// One atomic, monotonic transition shared by callbacks, reconciliation and webhooks.
export async function applyPayment(payment: GatewayPayment, provider = "RAZORPAY") {
  return prisma.$transaction(async (tx) => {
    const record = await tx.payment.findUnique({ where: { gatewayOrderId: payment.order_id } });
    if (!record || record.provider !== provider) throw new Error("Payment order is not registered.");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${record.orderId}))`;
    const current = await tx.payment.findUniqueOrThrow({ where: { id: record.id }, include: { order: true } });
    if (current.amountPaise !== payment.amount || current.currency !== payment.currency) throw new Error("Payment amount or currency mismatch.");
    if (current.transactionId && current.transactionId !== payment.id) throw new Error("Payment identity mismatch.");
    if ((payment.amount_refunded || 0) > 0) {
      const refunded = Math.max(current.refundedPaise, payment.amount_refunded!);
      if (refunded > payment.amount) throw new Error("Refund amount mismatch");
      const full = refunded === payment.amount;
      await tx.payment.update({ where: { id: current.id }, data: { refundedPaise: refunded, ...(full ? { status: "REFUNDED", transactionId: payment.id } : {}) } });
      if (full) {
        // Dashboard refunds block fulfilment too. Restock only unshipped orders.
        if (["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "CANCELLED"].includes(current.order.status)) await releaseReservation(tx, current.orderId);
        await tx.order.update({ where: { id: current.orderId }, data: { paymentStatus: "REFUNDED", status: "REFUNDED" } });
        await tx.paymentRefund.updateMany({ where: { paymentId: current.id }, data: { status: "PROCESSED", lastError: null } });
        return "REFUNDED";
      }
    }
    if (current.status === "PAID" || current.status === "REFUNDED") return current.order.paymentStatus;
    if (payment.status !== "captured" || payment.captured === false) return current.order.paymentStatus;
    const expired = current.order.status === "PENDING" && current.order.expiresAt && current.order.expiresAt <= new Date();
    if (expired) {
      await releaseReservation(tx, current.orderId);
      await tx.order.update({ where: { id: current.orderId }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Payment arrived after checkout expiry" } });
    }
    const cancelled = current.order.status === "CANCELLED" || expired;
    if (current.order.status !== "PENDING" && !cancelled) throw new Error("Captured payment requires manual order reconciliation.");
    await tx.payment.update({ where: { id: current.id }, data: { status: "PAID", transactionId: payment.id, paidAt: new Date() } });
    await tx.order.update({ where: { id: current.orderId }, data: { paymentStatus: "PAID", status: cancelled ? "CANCELLED" : "CONFIRMED" } });
    if (cancelled) await queueRefund(tx, current.id, "Payment captured after cancellation or expiry");
    return "PAID";
  });
}

export async function reconcilePayment(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { payments: true } });
  if (!order) throw new Error("Order not found.");
  const payment = order.payments[0];
  if (!payment?.gatewayOrderId || payment.provider !== "RAZORPAY") return order.paymentStatus;
  if (payment.transactionId) return applyPayment(await fetchPayment(payment.transactionId));
  const response = z.object({ items: z.array(gatewayPaymentSchema) }).parse(await razorpayRequest(`orders/${payment.gatewayOrderId}/payments`));
  const captured = response.items.find((item) => ["captured", "refunded"].includes(item.status));
  return captured ? applyPayment(await fetchPayment(captured.id)) : order.paymentStatus;
}
