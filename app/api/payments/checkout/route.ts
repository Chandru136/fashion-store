import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cancelCheckoutAction, paymentStatusAction, preparePaymentAction, simulatePaymentAction, verifyPaymentAction } from "@/app/actions/payment.actions";

const requestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("cancel"), orderId: z.string().cuid() }),
  z.object({ operation: z.literal("prepare"), orderId: z.string().cuid() }),
  z.object({ operation: z.literal("status"), orderId: z.string().cuid() }),
  z.object({ operation: z.literal("simulate"), orderId: z.string().cuid(), outcome: z.enum(["success", "failure"]) }),
  z.object({ operation: z.literal("verify"), orderId: z.string().cuid(),
    razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() }),
]);

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-sudha-checkout") !== "1") {
    return NextResponse.json({ success: false, error: "Invalid payment request." }, { status: 403 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payment details." }, { status: 400 });
  const data = parsed.data;
  // Reuse all existing session, ownership, signature and amount checks.
  const result = data.operation === "prepare" ? await preparePaymentAction(data.orderId)
    : data.operation === "cancel" ? await cancelCheckoutAction(data.orderId)
    : data.operation === "status" ? await paymentStatusAction(data.orderId)
    : data.operation === "simulate" ? await simulatePaymentAction(data.orderId, data.outcome)
    : await verifyPaymentAction(data);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
