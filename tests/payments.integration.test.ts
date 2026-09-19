import { cancelOrder, processRefund } from "../lib/payments/lifecycle.service";
import { POST as webhookPOST } from "../app/api/payments/razorpay/webhook/route";
import { processWebhook } from "../lib/payments/maintenance.service";
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test, mock } from "node:test";
import nodemailer from "nodemailer";
import { prisma } from "../lib/db";
import { createOrderFromCart, getUserOrders } from "../lib/services/order.service";
import { applyPayment, preparePayment, reconcilePayment } from "../lib/payments/checkout.service";

test("database payment lifecycle: retries, ownership, tampering, concurrent callbacks and webhook recovery", { skip: process.env.RUN_PAYMENT_DB_TESTS !== "true" }, async () => {
  const marker = `payment-test-${randomUUID()}`;
  const original = { ...process.env }, originalFetch = global.fetch;
  let userId = "", productId = "", categoryId = "";
  let remoteCreates = 0;
  const eventId = `evt_${randomUUID()}`;
  const captured = { id: "pay_fixture123", order_id: "order_fixture123", amount: 165000, currency: "INR", status: "captured", captured: true };
  const emails: string[] = [];
  const transport = mock.method(nodemailer, "createTransport", () => ({ sendMail: async (email: { to: string }) => { emails.push(email.to); } }) as any);
  try {
    process.env.SMTP_USER = "fixture@example.invalid";
    process.env.SMTP_PASSWORD = "fixture";
    process.env.ADMIN_NOTIFICATION_EMAIL = "admin@example.invalid";
    process.env.PAYMENT_PROVIDER = "RAZORPAY";
    process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
    process.env.RAZORPAY_KEY_SECRET = "fixture-secret";
    const user = await prisma.user.create({ data: { name: marker, email: `${marker}@example.invalid` } }); userId = user.id;
    const category = await prisma.category.create({ data: { name: marker, slug: marker } }); categoryId = category.id;
    const product = await prisma.product.create({ data: { name: marker, slug: marker, sku: marker, description: "Temporary payment test", categoryId,
      mrp: 1500, sellingPrice: 1500, variants: { create: { sku: marker, price: 1500, stock: 5, inventory: { create: { availableStock: 5 } } } } }, include: { variants: true } }); productId = product.id;
    const variantId = product.variants[0].id;
    await prisma.cart.create({ data: { userId, items: { create: { variantId, quantity: 1 } } } });
    const params = { userId, checkoutKey: randomUUID(), shippingName: "Test", shippingPhone: "9999999999", shippingAddress: "Test", shippingCity: "Test", shippingState: "Test", shippingPincode: "110001",
      billingName: "Test", billingPhone: "9999999999", billingAddress: "Test", billingCity: "Test", billingState: "Test", billingPincode: "110001", paymentMethod: "ONLINE" as const };
    const [order, retry] = await Promise.all([createOrderFromCart(params), createOrderFromCart(params)]);
    assert.equal(order.id, retry.id);
    assert.equal(order.paymentStatus, "PENDING");
    assert.equal(order.status, "PENDING");
    assert.equal((await getUserOrders(userId)).totalCount, 0);
    assert.equal(emails.length, 0);
    const cartItems = () => prisma.cartItem.findMany({ where: { cart: { userId } } });
    assert.equal((await cartItems())[0].quantity, 1, "pending checkout retains the cart");
    assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock, 4);
    global.fetch = async (url, options) => {
      if (options?.method === "POST") { remoteCreates++; return Response.json({ id: captured.order_id, amount: captured.amount, currency: "INR" }); }
      if (String(url).endsWith('/payments')) return Response.json({ items: [captured] });
      return Response.json(captured);
    };
    await assert.rejects(() => preparePayment(order.id, "another-user"));
    const [first, second] = await Promise.all([preparePayment(order.id, userId), preparePayment(order.id, userId)]);
    assert.deepEqual(first, second);
    assert.equal(remoteCreates, 1);
    await assert.rejects(() => applyPayment({ ...captured, amount: 1 }));
    await assert.rejects(() => applyPayment({ ...captured, currency: "USD" }));
    await assert.rejects(() => applyPayment({ ...captured, order_id: "order_wrong" }));
    assert.equal(await applyPayment({ ...captured, status: "authorized", captured: false }), "PENDING");
    assert.equal(await applyPayment({ ...captured, status: "failed", captured: false }), "PENDING");
    assert.equal((await cartItems())[0].quantity, 1, "unpaid attempts retain the cart");
    assert.equal(emails.length, 0, "unpaid attempts send no confirmation");
    assert.equal(await reconcilePayment(order.id, userId), "PAID");
    assert.equal((await getUserOrders(userId)).totalCount, 1);
    assert.deepEqual(emails, [user.email, "admin@example.invalid"]);
    assert.equal((await cancelOrder(order.id, { userId, admin: false }, "Payment dialog closed", false, true)).status, "CONFIRMED",
      "a concurrent capture must not be cancelled by payment dismissal");
    assert.equal((await cartItems()).length, 0, "captured payment removes purchased items");
    const customerCart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    await prisma.cartItem.create({ data: { cartId: customerCart.id, variantId, quantity: 2 } });
    assert.deepEqual(await Promise.all([applyPayment(captured), applyPayment(captured)]), ["PAID", "PAID"]);
    assert.equal(emails.length, 2, "duplicate callbacks do not resend confirmation");
    assert.equal((await cartItems())[0].quantity, 2, "duplicate callbacks preserve newly added items");
    assert.equal(await applyPayment({ ...captured, status: "failed" }), "PAID");
    const signedBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: captured.id } } } });
    process.env.RAZORPAY_WEBHOOK_SECRET = "test-only-webhook-secret";
    const signature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(signedBody).digest("hex");
    const request = (body = signedBody, sig = signature) => new Request("http://localhost/api/payments/razorpay/webhook", { method: "POST", body, headers: { "x-razorpay-signature": sig, "x-razorpay-event-id": eventId } });
    assert.equal((await webhookPOST(request(signedBody + " "))).status, 401);
    assert.equal((await webhookPOST(request())).status, 200);
    assert.equal((await webhookPOST(request())).status, 200);
    assert.equal(await prisma.paymentWebhook.count({ where: { id: eventId } }), 1);
    await processWebhook(eventId);
    assert.equal((await prisma.paymentWebhook.findUniqueOrThrow({ where: { id: eventId } })).status, "PROCESSED");
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    assert.equal(paid.status, "CONFIRMED");
    assert.equal(paid.payments[0].transactionId, captured.id);
    await assert.rejects(() => cancelOrder(order.id, { userId: "other-user", admin: false }, "Not owner"));
    await Promise.all([cancelOrder(order.id, { userId, admin: false }, "Test cancellation"), cancelOrder(order.id, { userId, admin: false }, "Duplicate cancellation")]);
    assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock, 5);
    assert.equal(await prisma.paymentRefund.count({ where: { paymentId: paid.payments[0].id } }), 1);
    const refund = await prisma.paymentRefund.findUniqueOrThrow({ where: { paymentId: paid.payments[0].id } });
    const refundKeys: string[] = [], refundBodies: string[] = [];
    global.fetch = async (_url, options) => {
      refundKeys.push(new Headers(options?.headers).get("X-Refund-Idempotency") || "");
      refundBodies.push(String(options?.body));
      if (refundKeys.length === 1) throw new Error("Lost gateway response after acceptance");
      return Response.json({ id: "rfnd_fixture123", payment_id: captured.id, amount: captured.amount, status: "processed", currency: "INR" });
    };
    await processRefund(refund.id);
    assert.equal((await prisma.paymentRefund.findUniqueOrThrow({ where: { id: refund.id } })).status, "REQUESTED");
    await processRefund(refund.id);
    assert.equal(refundKeys[0], refundKeys[1]); assert.equal(refundBodies[0], refundBodies[1]);
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, "REFUNDED");
    assert.equal(await applyPayment(captured), "REFUNDED");

    // Expired order releases its reservation. A late capture cannot resurrect it.
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    await prisma.cartItem.updateMany({ where: { cartId: cart.id }, data: { quantity: 1 } });
    const expiredOrder = await createOrderFromCart({ ...params, checkoutKey: randomUUID() });
    await prisma.order.update({ where: { id: expiredOrder.id }, data: { expiresAt: new Date(0) } });
    await prisma.payment.update({ where: { id: expiredOrder.payments[0].id }, data: { gatewayOrderId: "order_expired123" } });
    await assert.rejects(() => preparePayment(expiredOrder.id, userId), /expired/);
    await cancelOrder(expiredOrder.id, { userId, admin: false }, "Expired", true);
    await applyPayment({ ...captured, id: "pay_late123", order_id: "order_expired123" });
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: expiredOrder.id } })).status, "CANCELLED");
    assert.equal(await prisma.paymentRefund.count({ where: { paymentId: expiredOrder.payments[0].id } }), 1);
    assert.equal((await cartItems())[0].quantity, 1, "expired checkout and refunded late payment retain the cart");
    assert.equal(emails.length, 2, "cancelled checkout never sends order confirmation");
    const cancelledCheckout = await createOrderFromCart({ ...params, checkoutKey: randomUUID() });
    await cancelOrder(cancelledCheckout.id, { userId, admin: false }, "Payment cancelled by customer", false, true);
    assert.equal((await getUserOrders(userId)).orders.some(item => item.id === cancelledCheckout.id), false);
    assert.equal((await cartItems())[0].quantity, 1);
    assert.equal(emails.length, 2);

    assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock, 5);
  } finally {
    transport.mock.restore();
    global.fetch = originalFetch; process.env = original;
    await prisma.paymentWebhook.deleteMany({ where: { id: eventId } });
    if (userId) {
      await prisma.auditLog.deleteMany({ where: { userId } });
      await prisma.order.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    if (productId) await prisma.product.delete({ where: { id: productId } });
    if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
    await prisma.$disconnect();
  }
});
