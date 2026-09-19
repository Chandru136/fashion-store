import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { paymentConfig, razorpayRequest } from "./razorpay";

export class PaymentOperationError extends Error {}
export const cancellableStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"];

// Call with the order advisory lock held. A marker and all stock/coupon writes commit together.
export async function releaseReservation(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.inventoryReleasedAt) return;
  for (const item of [...order.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (inventory) {
      await tx.inventory.update({ where: { variantId: item.variantId }, data: {
        availableStock: { increment: item.quantity },
        ...(!order.inventoryCommittedAt ? { reservedStock: { decrement: Math.min(inventory.reservedStock, item.quantity) } } : {}),
      } });
    }
    await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
  }
  if (order.couponCode) await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  await tx.order.update({ where: { id: orderId }, data: { inventoryReleasedAt: new Date() } });
}

export async function queueRefund(tx: Prisma.TransactionClient, paymentId: string, reason: string) {
  const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (!payment.transactionId || !payment.amountPaise || payment.status !== "PAID") return;
  if (payment.refundedPaise >= payment.amountPaise) return;
  await tx.paymentRefund.upsert({ where: { paymentId }, update: {}, create: {
    paymentId, amountPaise: payment.amountPaise - payment.refundedPaise, reason,
  } });
}

export async function cancelOrder(orderId: string, actor: { userId: string; admin: boolean }, reason: string, onlyExpired = false, onlyUnpaid = false) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order || (!actor.admin && order.userId !== actor.userId)) throw new PaymentOperationError("Order not found.");
    if (onlyUnpaid && (order.status !== "PENDING" || order.paymentStatus === "PAID")) return order;
    if (order.status === "CANCELLED" || order.status === "REFUNDED") return order;
    if (onlyExpired && (order.status !== "PENDING" || !order.expiresAt || order.expiresAt > new Date() || order.paymentStatus === "PAID")) return order;
    if (!cancellableStatuses.includes(order.status)) throw new PaymentOperationError("This order has shipped. Contact the store to arrange a return.");
    await releaseReservation(tx, order.id);
    const updated = await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason.slice(0, 200) } });
    for (const payment of order.payments) if (["RAZORPAY", "MOCK"].includes(payment.provider)) await queueRefund(tx, payment.id, "Order cancellation");
    await tx.auditLog.create({ data: { userId: actor.userId || null, action: "ORDER_CANCELLED", entity: "Order", entityId: order.id, newValue: JSON.stringify({ reason, refundQueued: order.paymentStatus === "PAID" }) } });
    return updated;
  });
}

export async function requestOrderRefund(orderId: string, actorId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true } });
    if (!["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status)) throw new PaymentOperationError("Cancel the order, or record its return, before requesting a refund.");
    const payment = order.payments.find((p) => ["RAZORPAY", "MOCK"].includes(p.provider));
    if (!payment || !["PAID", "REFUNDED"].includes(payment.status)) throw new PaymentOperationError("There is no captured online payment to refund.");
    await queueRefund(tx, payment.id, reason);
    await tx.auditLog.create({ data: { userId: actorId, action: "REFUND_REQUESTED", entity: "Payment", entityId: payment.id } });
  });
}

export const refundSchema = z.object({ id: z.string(), payment_id: z.string(), amount: z.number().int().positive(), status: z.enum(["pending", "processed", "failed"]), currency: z.string().optional() });
export type GatewayRefund = z.infer<typeof refundSchema>;

export async function applyRefund(refund: GatewayRefund) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.paymentRefund.findUnique({ where: { gatewayRefundId: refund.id }, include: { payment: true } });
    if (!record) return; // Dashboard refunds are reconciled via the payment's aggregate amount_refunded.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${record.payment.orderId}))`;
    if (record.payment.transactionId !== refund.payment_id || record.amountPaise !== refund.amount || (refund.currency && refund.currency !== record.payment.currency)) throw new Error("Refund identity mismatch");
    if (record.status === "PROCESSED") return;
    const status = refund.status === "processed" ? "PROCESSED" : refund.status === "failed" ? "FAILED" : "SUBMITTED";
    await tx.paymentRefund.update({ where: { id: record.id }, data: { status, lastError: status === "FAILED" ? "Gateway refund failed; review in Razorpay Dashboard." : null, nextAttemptAt: new Date(Date.now() + 300000) } });
    if (status === "PROCESSED") {
      await tx.payment.update({ where: { id: record.paymentId }, data: { status: "REFUNDED", refundedPaise: record.payment.amountPaise! } });
      await tx.order.update({ where: { id: record.payment.orderId }, data: { paymentStatus: "REFUNDED", status: "REFUNDED" } });
    }
  });
}

// Durable outbox: the body and key never change on retries, including after a timeout.
export async function processRefund(refundId: string) {
  const record = await prisma.paymentRefund.findUniqueOrThrow({ where: { id: refundId }, include: { payment: true } });
  if (["PROCESSED", "FAILED"].includes(record.status)) return;
  try {
    let refund: GatewayRefund;
    if (record.payment.provider === "MOCK") {
      if (paymentConfig().provider !== "MOCK") throw new Error("Mock refunds are disabled");
      refund = { id: `rfnd_mock${record.id}`, payment_id: record.payment.transactionId!, amount: record.amountPaise, status: "processed" };
    } else if (record.gatewayRefundId) {
      refund = refundSchema.parse(await razorpayRequest(`refunds/${record.gatewayRefundId}`));
    } else {
      refund = refundSchema.parse(await razorpayRequest(`payments/${record.payment.transactionId}/refund`, {
        amount: record.amountPaise, speed: "normal", receipt: record.id,
      }, { "X-Refund-Idempotency": record.idempotencyKey }));
    }
    if (refund.payment_id !== record.payment.transactionId || refund.amount !== record.amountPaise) throw new Error("Refund response mismatch");
    await prisma.paymentRefund.update({ where: { id: record.id }, data: { gatewayRefundId: refund.id, attempts: { increment: 1 } } });
    await applyRefund(refund);
  } catch {
    await prisma.paymentRefund.update({ where: { id: record.id }, data: { attempts: { increment: 1 }, lastError: "Refund request could not be confirmed. Safe retry scheduled with the original key.", nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(record.attempts, 7))) } });
  }
}
