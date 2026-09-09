import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { prisma } from "../lib/db";
import { createOrderFromCart } from "../lib/services/order.service";
import { applyPayment, preparePayment } from "../lib/payments/checkout.service";
import { runPaymentMaintenance, processWebhook } from "../lib/payments/maintenance.service";
import { GET as health } from "../app/api/payments/health/route";
import { POST as maintenance } from "../app/api/payments/maintenance/route";

test("isolated worker: expires stock/coupons once, refunds late payments, enforces lease and monitors failed webhooks", { skip: !process.env.PAYMENT_ISOLATED_TEST_SCHEMA?.startsWith("payment_test_") }, async () => {
  const original = { ...process.env }, originalFetch = global.fetch;
  try {
    process.env.PAYMENT_PROVIDER = "MOCK"; process.env.ALLOW_MOCK_PAYMENTS = "true";
    process.env.PAYMENT_CRON_SECRET = "test-maintenance-secret-32-characters-long";
    assert.equal((await maintenance(new Request("http://localhost/api/payments/maintenance", { method: "POST" }))).status, 401);
    assert.equal((await health(new Request("http://localhost/api/payments/health"))).status, 401);
    const marker = randomUUID();
    const user = await prisma.user.create({ data: { name: "Worker fixture", email: `${marker}@example.invalid` } });
    const category = await prisma.category.create({ data: { name: marker, slug: marker } });
    const product = await prisma.product.create({ data: { name: marker, slug: marker, sku: marker, description: "test", categoryId: category.id, mrp: 500, sellingPrice: 500,
      variants: { create: { sku: marker, price: 500, stock: 3, inventory: { create: { availableStock: 3 } } } } }, include: { variants: true } });
    const variantId = product.variants[0].id;
    const code = marker.toUpperCase();
    await prisma.coupon.create({ data: { code, discountType: "FIXED_AMOUNT", discountValue: 50, usageLimit: 1, endDate: new Date(Date.now() + 3600000) } });
    const cart = await prisma.cart.create({ data: { userId: user.id, items: { create: { variantId, quantity: 1 } } } });
    const params = { userId: user.id, checkoutKey: randomUUID(), shippingName: "Test", shippingPhone: "9999999999", shippingAddress: "Test", shippingCity: "Test", shippingState: "Test", shippingPincode: "110001",
      billingName: "Test", billingPhone: "9999999999", billingAddress: "Test", billingCity: "Test", billingState: "Test", billingPincode: "110001", paymentMethod: "ONLINE" as const, couponCode: code };
    const order = await createOrderFromCart(params);
    const checkout = await preparePayment(order.id, user.id);
    assert.equal(checkout.paid, false);
    if (checkout.paid) throw new Error("Unexpected paid order");
    await prisma.order.update({ where: { id: order.id }, data: { expiresAt: new Date(0) } });
    await runPaymentMaintenance(); await runPaymentMaintenance();
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "CANCELLED");
    assert.equal((await prisma.inventory.findUniqueOrThrow({ where: { variantId } })).availableStock, 3);
    assert.equal((await prisma.inventory.findUniqueOrThrow({ where: { variantId } })).reservedStock, 0);
    assert.equal((await prisma.coupon.findUniqueOrThrow({ where: { code } })).usedCount, 0);
    await applyPayment({ id: `pay_mock${order.id}`, order_id: checkout.gatewayOrderId, amount: checkout.amount, currency: checkout.currency, status: "captured", captured: true }, "MOCK");
    await runPaymentMaintenance();
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, "REFUNDED");
    // Coupon can be used again, proving per-user and global reservations were released.
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity: 1 } });
    await createOrderFromCart({ ...params, checkoutKey: randomUUID() });
    await prisma.paymentMaintenance.update({ where: { id: "payments" }, data: { lockedUntil: new Date(Date.now() + 60000) } });
    assert.deepEqual(await runPaymentMaintenance(), { skipped: true });
    await prisma.paymentMaintenance.update({ where: { id: "payments" }, data: { lockedUntil: new Date(0) } });
    process.env.PAYMENT_PROVIDER = "RAZORPAY"; process.env.RAZORPAY_KEY_ID = "rzp_test_fixture"; process.env.RAZORPAY_KEY_SECRET = "fixture-secret";
    const event = await prisma.paymentWebhook.create({ data: { id: `event_${marker}`, event: "payment.captured", paymentId: "pay_unavailable123", attempts: 9 } });
    global.fetch = async () => new Response('{}', { status: 503 });
    await processWebhook(event.id);
    const failed = await prisma.paymentWebhook.findUniqueOrThrow({ where: { id: event.id } });
    assert.equal(failed.status, "FAILED"); assert.equal(failed.attempts, 10); assert.ok(failed.lastError);
    assert.equal((await health(new Request("http://localhost/api/payments/health", { headers: { Authorization: `Bearer ${process.env.PAYMENT_CRON_SECRET}` } }))).status, 503);
  } finally { process.env = original; global.fetch = originalFetch; await prisma.$disconnect(); }
});
