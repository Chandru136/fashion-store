import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export class PaymentConfigurationError extends Error {
  constructor(detail: string) {
    super(process.env.NODE_ENV === "production"
      ? "Online payments are not configured. Please contact the store."
      : `${detail} Edit .env (not .env.example), then restart the server. Run npm run payment:check to verify.`);
    this.name = "PaymentConfigurationError";
  }
}

export function paymentConfig() {
  const provider = process.env.PAYMENT_PROVIDER || "RAZORPAY";
  if (provider === "MOCK") {
    if (process.env.NODE_ENV === "production" || process.env.ALLOW_MOCK_PAYMENTS !== "true") throw new Error("Mock payments are disabled.");
    return { provider, keyId: "mock", keySecret: "" };
  }
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (provider !== "RAZORPAY") throw new PaymentConfigurationError("Set PAYMENT_PROVIDER to RAZORPAY.");
  if (!keyId || !keySecret) throw new PaymentConfigurationError("Razorpay requires both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from your Dashboard.");
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)) throw new PaymentConfigurationError("RAZORPAY_KEY_ID is invalid. Use the actual generated test or live key ID.");
  if (keyId.startsWith("rzp_live_") && process.env.NODE_ENV === "production") {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET || (process.env.PAYMENT_CRON_SECRET || "").length < 32 || !process.env.NEXTAUTH_URL?.startsWith("https://")) {
      throw new PaymentConfigurationError("Live payments require HTTPS NEXTAUTH_URL, RAZORPAY_WEBHOOK_SECRET, and a 32-character PAYMENT_CRON_SECRET.");
    }
  }
  return { provider, keyId, keySecret };
}

export function toPaise(amount: number) {
  const paise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(paise) || paise < 100 || paise > 2147483647) throw new Error("Invalid payment amount.");
  return paise;
}

export function validSignature(body: string | Buffer, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export const gatewayPaymentSchema = z.object({
  id: z.string().regex(/^pay_[A-Za-z0-9]+$/), order_id: z.string(),
  amount: z.number().int().positive(), currency: z.string(),
  status: z.string(), amount_refunded: z.number().int().nonnegative().optional(), captured: z.boolean().optional(),
});
export type GatewayPayment = z.infer<typeof gatewayPaymentSchema>;

export async function razorpayRequest(path: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const config = paymentConfig();
  if (config.provider !== "RAZORPAY") throw new Error("Razorpay is not enabled.");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!response.ok) {
    console.error("Razorpay request failed", { status: response.status, path });
    throw new Error("Payment gateway is unavailable. Retry from your order details.");
  }
  return response.json();
}

export async function fetchPayment(id: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid payment ID.");
  return gatewayPaymentSchema.parse(await razorpayRequest(`payments/${id}`));
}
