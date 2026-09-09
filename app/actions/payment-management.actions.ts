"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { paymentActor } from "@/lib/payments/actor";
import { cancelOrder, PaymentOperationError, processRefund, requestOrderRefund } from "@/lib/payments/lifecycle.service";
import { runPaymentMaintenance } from "@/lib/payments/maintenance.service";
import { reconcilePayment } from "@/lib/payments/checkout.service";

function refresh(orderId?: string) {
  revalidatePath("/admin/payments"); revalidatePath("/admin/orders"); revalidatePath("/orders");
  if (orderId) { revalidatePath(`/orders/${orderId}`); revalidatePath(`/admin/orders/${orderId}`); }
}
function failure(error: unknown) {
  return { success: false as const, error: error instanceof PaymentOperationError ? error.message : "Payment operation could not be completed. Inspect the payment operations page and retry." };
}
export async function cancelOrderAction(orderId: string) {
  try {
    const actor = await paymentActor();
    await cancelOrder(z.string().cuid().parse(orderId), actor, "Cancelled by customer or order manager");
    // Persisted cancellation/refund survives a connection failure here.
    refresh(orderId);
    return { success: true as const, message: "Order cancelled. Any captured online payment is queued for refund." };
  } catch (error) { return failure(error); }
}
export async function refundOrderAction(orderId: string, reason: string) {
  try {
    const actor = await paymentActor(true);
    await requestOrderRefund(z.string().cuid().parse(orderId), actor.userId, z.string().trim().min(3).max(200).parse(reason));
    refresh(orderId);
    return { success: true as const, message: "Refund queued. Its status will update after gateway processing." };
  } catch (error) { return failure(error); }
}
export async function runMaintenanceAction() {
  try {
    await paymentActor(true); await runPaymentMaintenance(); refresh();
    return { success: true as const, message: "Recovery batch completed. Review remaining items below." };
  } catch (error) { return failure(error); }
}
export async function retryWebhookAction(id: string) {
  try {
    await paymentActor(true);
    await prisma.paymentWebhook.updateMany({ where: { id: z.string().min(1).max(100).parse(id), status: "FAILED" }, data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastError: null } });
    refresh(); return { success: true as const, message: "Webhook queued for retry." };
  } catch (error) { return failure(error); }
}
export async function reconcileOrderAction(orderId: string) {
  try {
    await paymentActor(true);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: z.string().cuid().parse(orderId) } });
    await reconcilePayment(order.id, order.userId);
    const refund = await prisma.paymentRefund.findFirst({ where: { payment: { orderId: order.id }, status: { in: ["REQUESTED", "SUBMITTED"] } } });
    if (refund) await processRefund(refund.id);
    refresh(order.id); return { success: true as const, message: "Payment status checked." };
  } catch (error) { return failure(error); }
}
