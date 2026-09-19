"use server";
import { paymentActor } from "@/lib/payments/actor";

import { cancelOrder, PaymentOperationError } from "@/lib/payments/lifecycle.service";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { applyPayment, preparePayment, reconcilePayment } from "@/lib/payments/checkout.service";
import { fetchPayment, paymentConfig, PaymentConfigurationError, validSignature } from "@/lib/payments/razorpay";

async function userId() {
  return (await paymentActor()).userId;
}
// The client navigates/refreshes after verification. Revalidating here can
// rerender checkout with its now-empty cart before the callback completes.
function errorResult(error: unknown) {
  if (error instanceof PaymentConfigurationError || error instanceof PaymentOperationError) return { success: false as const, error: error.message };
  console.error("Payment operation failed", error instanceof Error ? error.name : "Unknown error");
  return { success: false as const, error: "Unable to complete payment verification. Check your order status before retrying. If debited, do not place a new order." };
}
export async function preparePaymentAction(orderId: string) {
  try {
    z.string().cuid().parse(orderId);
    return { success: true as const, checkout: await preparePayment(orderId, await userId()) };
  } catch (error) { return errorResult(error); }
}
const verificationSchema = z.object({
  orderId: z.string().cuid(), razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});
export async function verifyPaymentAction(input: z.infer<typeof verificationSchema>) {
  try {
    const owner = await userId();
    const data = verificationSchema.parse(input);
    const record = await prisma.payment.findFirst({ where: { orderId: data.orderId, provider: "RAZORPAY", order: { userId: owner } } });
    const config = paymentConfig();
    if (config.provider !== "RAZORPAY" || !record?.gatewayOrderId || record.gatewayOrderId !== data.razorpay_order_id ||
      !validSignature(`${record.gatewayOrderId}|${data.razorpay_payment_id}`, data.razorpay_signature, config.keySecret)) throw new Error("Invalid payment signature.");
    const payment = await fetchPayment(data.razorpay_payment_id);
    if (payment.order_id !== record.gatewayOrderId) throw new Error("Order mismatch.");
    const status = await applyPayment(payment);
    return { success: true as const, status };
  } catch (error) { return errorResult(error); }
}
export async function paymentStatusAction(orderId: string) {
  try {
    z.string().cuid().parse(orderId);
    const status = await reconcilePayment(orderId, await userId());
    return { success: true as const, status };
  } catch (error) { return errorResult(error); }
}
export async function cancelCheckoutAction(orderId: string) {
  try {
    z.string().cuid().parse(orderId);
    const owner = await userId();
    await reconcilePayment(orderId, owner);
    const order = await cancelOrder(orderId, { userId: owner, admin: false }, "Payment cancelled by customer", false, true);
    return { success: true as const, status: order.paymentStatus };
  } catch (error) { return errorResult(error); }
}
export async function simulatePaymentAction(orderId: string, outcome: "success" | "failure") {
  try {
    if (paymentConfig().provider !== "MOCK") throw new Error("Mock payments disabled.");
    z.enum(["success", "failure"]).parse(outcome);
    const checkout = await preparePayment(z.string().cuid().parse(orderId), await userId());
    if (checkout.paid) return { success: true as const, status: "PAID" };
    const status = outcome === "success" ? await applyPayment({ id: `pay_mock${orderId}`, order_id: checkout.gatewayOrderId,
      amount: checkout.amount, currency: checkout.currency, status: "captured", captured: true }, "MOCK") : "PENDING";
    return { success: true as const, status };
  } catch (error) { return errorResult(error); }
}
