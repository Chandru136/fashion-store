import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validSignature } from "@/lib/payments/razorpay";

export const runtime = "nodejs";
const eventSchema = z.object({ event: z.string(), payload: z.object({
  payment: z.object({ entity: z.object({ id: z.string().regex(/^pay_[A-Za-z0-9]+$/) }) }).optional(),
  refund: z.object({ entity: z.object({ id: z.string().regex(/^rfnd_[A-Za-z0-9]+$/) }) }).optional(),
}) });
export async function POST(request: Request) {
  const secrets = [process.env.RAZORPAY_WEBHOOK_SECRET, process.env.RAZORPAY_WEBHOOK_SECRET_PREVIOUS].filter((s): s is string => !!s);
  if (!secrets.length || process.env.PAYMENT_PROVIDER !== "RAZORPAY") return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 256 * 1024) { await reader.cancel(); return new Response(null, { status: 413 }); }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks);
  if (!secrets.some((secret) => validSignature(raw, request.headers.get("x-razorpay-signature") || "", secret))) return new Response(null, { status: 401 });
  const parsed = eventSchema.safeParse((() => { try { return JSON.parse(raw.toString("utf8")); } catch { return null; } })());
  if (!parsed.success) return new Response(null, { status: 400 });
  const event = parsed.data;
  if (!["payment.captured", "order.paid", "payment.authorized", "payment.failed", "payment.refunded", "refund.created", "refund.processed", "refund.failed"].includes(event.event)) return NextResponse.json({ received: true });
  if (!event.payload.payment && !event.payload.refund) return new Response(null, { status: 400 });
  const eventId = request.headers.get("x-razorpay-event-id");
  const id = eventId && /^[A-Za-z0-9_-]{1,100}$/.test(eventId) ? eventId : createHash("sha256").update(raw).digest("hex");
  try {
    // Acknowledge only after durable storage. No customer/card payload is stored.
    await prisma.paymentWebhook.upsert({ where: { id }, update: {}, create: { id, event: event.event, paymentId: event.payload.payment?.entity.id, refundId: event.payload.refund?.entity.id } });
    return NextResponse.json({ received: true });
  } catch {
    console.error("Razorpay webhook persistence failed", { eventId: id });
    return NextResponse.json({ error: "Retry delivery" }, { status: 503 });
  }
}
