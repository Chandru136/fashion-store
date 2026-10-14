import type { Prisma, OrderStatus, Payment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { paymentConfig, razorpayRequest } from "./razorpay";

import { cancellableOrderStatuses, fulfillmentTransitions } from "@/lib/order-status-policy";

export class PaymentOperationError extends Error {}
export const cancellableStatuses = cancellableOrderStatuses;

// Call with the order advisory lock held. A marker and all stock/coupon writes commit together.
export async function releaseReservation(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.inventoryReleasedAt) return;
  for (const item of [...order.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (inventory) {
      const restored = await tx.inventory.updateMany({ where: { variantId: item.variantId, ...(!order.inventoryCommittedAt ? { reservedStock: { gte: item.quantity } } : {}) }, data: {
        availableStock: { increment: item.quantity },
        ...(!order.inventoryCommittedAt ? { reservedStock: { decrement: item.quantity } } : {}),
      } });
      if (restored.count !== 1) throw new PaymentOperationError("Inventory reservation is inconsistent. Reconcile stock before cancellation.");
    }
    await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
  }
  if (order.couponCode) await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  await tx.order.update({ where: { id: orderId }, data: { inventoryReleasedAt: new Date() } });
}

type FinancialOrder = { paymentStatus: string; paymentMethod: string; total: number; payments: Payment[] };
const reconciliationMessage = "Payment records are inconsistent. Reconcile the payment before changing this order.";
function assertCapturedPayment(payment: Payment) {
  if (!["RAZORPAY", "MOCK"].includes(payment.provider) || !payment.transactionId ||
      !Number.isSafeInteger(payment.amountPaise) || !payment.amountPaise || payment.amountPaise <= 0 ||
      payment.currency !== "INR" || !Number.isSafeInteger(payment.refundedPaise) ||
      payment.refundedPaise < 0 || payment.refundedPaise > payment.amountPaise) throw new PaymentOperationError(reconciliationMessage);
}
function assertOrderPayment(order: FinancialOrder) {
  const captured = order.payments.filter(p => ["PAID", "REFUNDED"].includes(p.status));
  if (["PAID", "REFUNDED"].includes(order.paymentStatus)) {
    if (order.paymentMethod !== "ONLINE" || captured.length !== 1) throw new PaymentOperationError(reconciliationMessage);
    const payment = captured[0];
    assertCapturedPayment(payment);
    if (payment.amountPaise !== Math.round(order.total * 100) || payment.status !== order.paymentStatus ||
        (payment.status === "PAID" && payment.refundedPaise >= payment.amountPaise!) ||
        (payment.status === "REFUNDED" && payment.refundedPaise !== payment.amountPaise)) throw new PaymentOperationError(reconciliationMessage);
  } else if (captured.length || order.payments.some(p => p.refundedPaise > 0)) throw new PaymentOperationError(reconciliationMessage);
}

// Call with the order lock held. The unique paymentId preserves the original refund key/body.
export async function queueRefund(tx: Prisma.TransactionClient, paymentId: string, reason: string) {
  const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.status !== "PAID") return false;
  assertCapturedPayment(payment);
  const amountPaise = payment.amountPaise! - payment.refundedPaise;
  if (amountPaise <= 0) throw new PaymentOperationError(reconciliationMessage);
  const existing = await tx.paymentRefund.findUnique({ where: { paymentId } });
  if (existing) {
    if (!["REQUESTED", "SUBMITTED"].includes(existing.status) || existing.amountPaise !== amountPaise) {
      throw new PaymentOperationError("The existing refund needs reconciliation. A new refund was not created.");
    }
    return false;
  }
  await tx.paymentRefund.upsert({ where: { paymentId }, update: {}, create: { paymentId, amountPaise, reason } });
  return true;
}

const orderDetails = { payments: true, items: true, user: { select: { name: true, email: true } } } as const;
export async function cancelOrder(orderId: string, actor: { userId: string; admin: boolean }, reason: string, onlyExpired = false, onlyUnpaid = false) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
    const order = await tx.order.findUnique({ where: { id: orderId }, include: orderDetails });
    if (!order || (!actor.admin && order.userId !== actor.userId)) throw new PaymentOperationError("Order not found.");
    assertOrderPayment(order);
    if (onlyUnpaid && (order.status !== "PENDING" || order.paymentStatus === "PAID")) return { ...order, cancellationChanged: false };
    if (order.status === "REFUNDED") {
      if (order.paymentStatus !== "REFUNDED") throw new PaymentOperationError(reconciliationMessage);
      return { ...order, cancellationChanged: false };
    }
    if (order.status === "CANCELLED") {
      if (!order.inventoryReleasedAt) throw new PaymentOperationError("This cancellation has incomplete inventory processing. Manual reconciliation is required.");
      for (const payment of order.payments.filter(p => p.status === "PAID")) {
        const refund = await tx.paymentRefund.findUnique({ where: { paymentId: payment.id } });
        if (!refund || !["REQUESTED", "SUBMITTED"].includes(refund.status) || refund.amountPaise !== payment.amountPaise! - payment.refundedPaise) throw new PaymentOperationError("This cancellation has an unresolved refund. Reconcile it before retrying.");
      }
      return { ...order, cancellationChanged: false };
    }
    if (onlyExpired && (order.status !== "PENDING" || !order.expiresAt || order.expiresAt > new Date() || order.paymentStatus === "PAID")) return { ...order, cancellationChanged: false };
    if (!cancellableStatuses.includes(order.status) || order.inventoryCommittedAt || order.paymentStatus === "REFUNDED") throw new PaymentOperationError("This order cannot be cancelled. Contact the store to arrange a return or reconciliation.");
    let refundQueued = false;
    for (const payment of order.payments) if (payment.status === "PAID") {
      await queueRefund(tx, payment.id, "Order cancellation"); refundQueued = true;
    }
    await releaseReservation(tx, order.id);
    const updated = await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason.slice(0, 200) }, include: orderDetails });
    await tx.auditLog.create({ data: { userId: actor.userId || null, action: "ORDER_CANCELLED", entity: "Order", entityId: order.id, newValue: JSON.stringify({ reason, refundQueued }) } });
    return { ...updated, cancellationChanged: true };
  });
}

export async function updateOrderFulfillment(orderId: string, status: OrderStatus, actorId: string, trackingNumber?: string) {
  if (status === "REFUNDED" || status === "RETURNED") throw new PaymentOperationError("This status cannot be assigned administratively.");
  if (status === "CANCELLED") {
    const { cancellationChanged, ...order } = await cancelOrder(orderId, { userId: actorId, admin: true }, "Cancelled by order manager");
    return { order, changed: cancellationChanged };
  }
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
    const order = await tx.order.findUnique({ where: { id: orderId }, include: orderDetails });
    if (!order) throw new PaymentOperationError("Order not found.");
    const changed = order.status !== status;
    if (changed && !(fulfillmentTransitions[order.status] || []).includes(status)) throw new PaymentOperationError("Invalid order-status transition. Refresh the order and follow the next fulfillment stage.");
    if (["CANCELLED", "REFUNDED", "RETURNED"].includes(order.status)) return { order, changed: false };
    assertOrderPayment(order);
    if (order.status !== "PENDING" && (order.paymentStatus !== "PAID" || order.payments.some(p => p.refundedPaise > 0) || order.inventoryReleasedAt)) throw new PaymentOperationError("Fulfillment requires a fully paid order with unreleased inventory and no refund.");
    if (await tx.paymentRefund.findFirst({ where: { payment: { orderId } } })) throw new PaymentOperationError("An order with a refund record cannot advance fulfillment.");
    if (changed && status === "SHIPPED" && !order.inventoryCommittedAt) {
      for (const item of [...order.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
        const inventory = await tx.inventory.updateMany({ where: { variantId: item.variantId, reservedStock: { gte: item.quantity } }, data: { reservedStock: { decrement: item.quantity } } });
        if (inventory.count !== 1) throw new PaymentOperationError("Inventory reservation is inconsistent. Reconcile stock before shipping.");
      }
    }
    if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(order.status) && !order.inventoryCommittedAt) throw new PaymentOperationError("This shipment has no inventory commitment. Reconcile it before updating.");
    const trackingChanged = !!trackingNumber && trackingNumber !== order.trackingNumber;
    if (!changed && !trackingChanged) return { order, changed: false };
    const updated = await tx.order.update({ where: { id: orderId }, data: {
      ...(changed ? { status } : {}), ...(trackingChanged ? { trackingNumber } : {}),
      ...(changed && status === "SHIPPED" && !order.inventoryCommittedAt ? { inventoryCommittedAt: new Date() } : {}),
    }, include: orderDetails });
    await tx.auditLog.create({ data: { userId: actorId, action: "ORDER_STATUS_UPDATED", entity: "Order", entityId: orderId, oldValue: JSON.stringify({ status: order.status, trackingNumber: order.trackingNumber }), newValue: JSON.stringify({ status, trackingNumber: updated.trackingNumber }) } });
    return { order: updated, changed };
  });
}

export async function requestOrderRefund(orderId: string, actorId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true } });
    if (!["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status)) throw new PaymentOperationError("Cancel the order, or record its return, before requesting a refund.");
    assertOrderPayment(order);
    if (order.status === "CANCELLED" && !order.inventoryReleasedAt) throw new PaymentOperationError("Reconcile cancelled inventory before requesting a refund.");
    if (order.paymentStatus === "REFUNDED") return;
    const payment = order.payments.find(p => p.status === "PAID");
    if (!payment) throw new PaymentOperationError("There is no captured online payment to refund.");
    if (await queueRefund(tx, payment.id, reason)) await tx.auditLog.create({ data: { userId: actorId, action: "REFUND_REQUESTED", entity: "Payment", entityId: payment.id } });
  });
}

export const refundSchema = z.object({ id: z.string(), payment_id: z.string(), amount: z.number().int().positive(), status: z.enum(["pending", "processed", "failed"]), currency: z.string().optional() });
export type GatewayRefund = z.infer<typeof refundSchema>;

export async function applyRefund(refund: GatewayRefund) {
  return prisma.$transaction(async (tx) => {
    const identity = await tx.paymentRefund.findUnique({ where: { gatewayRefundId: refund.id }, include: { payment: true } });
    if (!identity) return; // Dashboard refunds are reconciled via the payment's aggregate amount_refunded.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${identity.payment.orderId}))`;
    const record = await tx.paymentRefund.findUniqueOrThrow({ where: { id: identity.id }, include: { payment: true } });
    if (record.payment.transactionId !== refund.payment_id || record.amountPaise !== refund.amount || (refund.currency && refund.currency !== record.payment.currency)) throw new Error("Refund identity mismatch");
    if (record.status === "PROCESSED") return;
    assertCapturedPayment(record.payment);
    if (record.payment.status !== "PAID") throw new PaymentOperationError(reconciliationMessage);
    if (refund.status === "processed" && record.payment.refundedPaise + record.amountPaise !== record.payment.amountPaise) throw new PaymentOperationError(reconciliationMessage);
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
    assertCapturedPayment(record.payment);
    if (record.payment.status !== "PAID" || record.amountPaise !== record.payment.amountPaise! - record.payment.refundedPaise) throw new PaymentOperationError(reconciliationMessage);
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
  } catch (error) {
    await prisma.paymentRefund.updateMany({ where: { id: record.id, status: { in: ["REQUESTED", "SUBMITTED"] } }, data: { attempts: { increment: 1 }, lastError: error instanceof PaymentOperationError ? error.message : "Refund request could not be confirmed. Safe retry scheduled with the original key.", nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(record.attempts, 7))) } });
  }
}
