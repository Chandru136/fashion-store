"use client";

import { paymentStatusAction, preparePaymentAction, simulatePaymentAction, verifyPaymentAction } from "@/app/actions/payment.actions";
import { confirmCheckoutPayment } from "./confirmation.client";

type CheckoutResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type Options = {
  key: string; order_id: string; amount: number; currency: string; name: string;
  prefill: { name: string; contact: string };
  handler: (response: CheckoutResponse) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};
declare global { interface Window { Razorpay?: new (options: Options) => { open: () => void }; } }
let loading: Promise<void> | undefined;
async function loadCheckout() {
  if (window.Razorpay) return;
  if (!loading) loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => { script.remove(); loading = undefined; reject(new Error("Payment window took too long to load. Please retry.")); }, 15000);
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { window.clearTimeout(timeout); if (window.Razorpay) resolve(); else { loading = undefined; reject(new Error("Payment window unavailable.")); } };
    script.onerror = () => { window.clearTimeout(timeout); script.remove(); loading = undefined; reject(new Error("Unable to load payment window. Check your connection and retry.")); };
    document.head.appendChild(script);
  });
  return loading;
}

export async function openOrderPayment(orderId: string): Promise<boolean> {
  const prepared = await preparePaymentAction(orderId);
  if (!prepared.success) throw new Error(prepared.error);
  const checkout = prepared.checkout;
  if (checkout.paid) return true;
  if (checkout.mock) {
    const success = window.confirm(`DEVELOPMENT TEST PAYMENT\nAmount: ${checkout.currency} ${(checkout.amount / 100).toFixed(2)}\nOK: simulate success. Cancel: simulate failure. No money is charged.`);
    const result = await simulatePaymentAction(orderId, success ? "success" : "failure");
    if (!result.success) throw new Error(result.error);
    return result.status === "PAID";
  }
  // Recover a previous capture before opening another payment attempt.
  const previous = await paymentStatusAction(orderId);
  if (!previous.success) throw new Error(previous.error);
  if (previous.status === "PAID") return true;
  await loadCheckout();
  return new Promise<boolean>((resolve, reject) => {
    let verifying = false;
    const widget = new window.Razorpay!({
      key: checkout.keyId, order_id: checkout.gatewayOrderId, amount: checkout.amount,
      currency: checkout.currency, name: "Sudha Collections",
      prefill: { name: checkout.name, contact: checkout.contact }, theme: { color: "#641c34" },
      modal: { ondismiss: () => { if (!verifying) resolve(false); } },
      handler: async (response) => {
        verifying = true;
        try {
          resolve(await confirmCheckoutPayment(
            () => verifyPaymentAction({ orderId, ...response }),
            () => paymentStatusAction(orderId),
          ));
        } catch (error) { reject(error); }
      },
    });
    widget.open();
  });
}
