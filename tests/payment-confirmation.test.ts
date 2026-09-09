import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmCheckoutPayment } from "../lib/payments/confirmation.client";

const wait = async () => {};
test("verified capture proceeds directly to success", async () => {
  assert.equal(await confirmCheckoutPayment(async () => ({ success: true, status: "PAID" }),
    async () => { throw new Error("should not poll"); }, wait), true);
});
test("lost verification and status responses recover without another payment", async () => {
  let checks = 0;
  const paid = await confirmCheckoutPayment(async () => { throw new Error("connection lost"); }, async () => {
    checks++;
    if (checks === 1) throw new Error("temporary outage");
    return { success: true, status: checks === 2 ? "PENDING" : "PAID" };
  }, wait);
  assert.equal(paid, true);
  assert.equal(checks, 3);
});
test("server verification error still checks the authenticated order status", async () => {
  assert.equal(await confirmCheckoutPayment(async () => ({ success: false, error: "verification failed" }),
    async () => ({ success: true, status: "PAID" }), wait), true);
});
test("pending or unavailable confirmation never reports success and stops polling", async () => {
  let checks = 0;
  assert.equal(await confirmCheckoutPayment(async () => ({ success: true, status: "PENDING" }),
    async () => { checks++; return { success: false }; }, wait), false);
  assert.equal(checks, 10);
});
test("refunded payment never opens thank-you confirmation", async () => {
  assert.equal(await confirmCheckoutPayment(async () => ({ success: true, status: "PENDING" }),
    async () => ({ success: true, status: "REFUNDED" }), wait), false);
});
