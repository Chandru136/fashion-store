import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { paymentConfig, toPaise, validSignature, razorpayRequest } from "../lib/payments/razorpay";

test("converts currency to integer paise and rejects invalid amounts", () => {
  assert.equal(toPaise(1499.95), 149995);
  for (const amount of [NaN, Infinity, -1, 0, 0.5, 1e12]) assert.throws(() => toPaise(amount));
});
test("validates HMAC and rejects tampered, malformed and missing signatures", () => {
  const body = '{ "event": "payment.captured" }';
  const secret = "test-only-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(validSignature(Buffer.from(body), signature, secret), true);
  assert.equal(validSignature(body + " ", signature, secret), false);
  assert.equal(validSignature(body, signature, "wrong-secret"), false);
  for (const invalid of ["", "a", "z".repeat(64), "a".repeat(66)]) assert.equal(validSignature(body, invalid, secret), false);
});
test("mock mode requires explicit opt-in and is forbidden in production", () => {
  const original = { ...process.env };
  try {
    process.env.PAYMENT_PROVIDER = "MOCK";
    process.env.ALLOW_MOCK_PAYMENTS = "false";
    assert.throws(paymentConfig);
    process.env.ALLOW_MOCK_PAYMENTS = "true";
    process.env = { ...process.env, NODE_ENV: "test" };
    assert.equal(paymentConfig().provider, "MOCK");
    process.env = { ...process.env, NODE_ENV: "production" };
    assert.throws(paymentConfig);
  } finally { process.env = original; }
});
test("gateway uses the fixed Razorpay endpoint and server credentials; HTTP failures reject", async () => {
  const original = { ...process.env }, originalFetch = global.fetch;
  try {
    process.env.PAYMENT_PROVIDER = "RAZORPAY";
    process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
    process.env.RAZORPAY_KEY_SECRET = "fixture-secret";
    global.fetch = async (url, options) => {
      assert.equal(url, "https://api.razorpay.com/v1/orders");
      assert.equal(options?.method, "POST");
      assert.equal(options?.cache, "no-store");
      assert.ok(options?.signal);
      return new Response('{}', { status: 500 });
    };
    await assert.rejects(() => razorpayRequest("orders", { amount: 100, currency: "INR" }), /gateway is unavailable/);
  } finally { global.fetch = originalFetch; process.env = original; }
});
