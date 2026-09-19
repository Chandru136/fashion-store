"use client";

import type * as Actions from "@/app/actions/payment.actions";

async function request<T>(body: object): Promise<T> {
  const response = await fetch("/api/payments/checkout", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Sudha-Checkout": "1" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error("Payment confirmation is unavailable. Check your order status before retrying payment.");
  return response.json();
}

export const preparePaymentAction = (orderId: string) =>
  request<Awaited<ReturnType<typeof Actions.preparePaymentAction>>>({ operation: "prepare", orderId });
export const cancelCheckoutAction = (orderId: string) =>
  request<Awaited<ReturnType<typeof Actions.cancelCheckoutAction>>>({ operation: "cancel", orderId });
export const paymentStatusAction = (orderId: string) =>
  request<Awaited<ReturnType<typeof Actions.paymentStatusAction>>>({ operation: "status", orderId });
export const verifyPaymentAction = (data: Parameters<typeof Actions.verifyPaymentAction>[0]) =>
  request<Awaited<ReturnType<typeof Actions.verifyPaymentAction>>>({ operation: "verify", ...data });
export const simulatePaymentAction = (orderId: string, outcome: "success" | "failure") =>
  request<Awaited<ReturnType<typeof Actions.simulatePaymentAction>>>({ operation: "simulate", orderId, outcome });
