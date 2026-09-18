import assert from "node:assert/strict";
import { test } from "node:test";
import type { Coupon, Prisma } from "@prisma/client";
import { CouponSchema, couponLocalDate } from "../lib/validations/coupon";
import { couponState, couponStatusWhere } from "../lib/coupon-admin";
import { validateCoupon } from "../lib/services/coupon.service";
import { saveAdminCoupon, deleteAdminCoupon } from "../lib/services/coupon-admin.service";
import { prisma } from "../lib/db";

const input = { code: " sc-welcome10 ", discountType: "PERCENTAGE", discountValue: "10", minimumOrderAmount: "500", maximumDiscount: "200", usageLimit: "100", perUserLimit: "1", startDate: "2030-01-01T10:00", endDate: "2030-02-01T10:00", status: "ACTIVE" };
test("coupon input normalizes code and translates IST dates without depending on server timezone", () => {
  const coupon = CouponSchema.parse(input);
  assert.equal(coupon.code, "SC-WELCOME10");
  assert.equal(coupon.startDate.toISOString(), "2030-01-01T04:30:00.000Z");
  assert.equal(couponLocalDate(coupon.startDate), input.startDate);
  assert.equal(coupon.discountValue, 10);
});
test("invalid discounts, dates, codes and usage limits are rejected", () => {
  for (const changes of [
    { discountValue: "101" }, { discountValue: "0" }, { discountValue: "Infinity" }, { discountValue: "2.555" },
    { minimumOrderAmount: "-1" }, { maximumDiscount: "0" }, { usageLimit: "0" }, { usageLimit: "2.5" },
    { perUserLimit: "0" }, { usageLimit: "1", perUserLimit: "2" }, { code: "SC BAD" },
    { startDate: "2030-02-30T10:00" }, { endDate: input.startDate }, { endDate: "bad" }, { status: "DELETED" },
  ]) assert.equal(CouponSchema.safeParse({ ...input, ...changes }).success, false, JSON.stringify(changes));
});
test("optional limits remain unlimited and fixed discounts have no percentage cap", () => {
  const coupon = CouponSchema.parse({ ...input, usageLimit: "", maximumDiscount: "", discountType: "FIXED_AMOUNT", discountValue: "500" });
  assert.equal(coupon.usageLimit, null);
  assert.equal(coupon.maximumDiscount, null);
});
const now = new Date("2030-01-15T00:00:00Z");
const coupon: Coupon = { id: "test", code: "SC-WELCOME10", discountType: "PERCENTAGE", discountValue: 10, minimumOrderAmount: 100, maximumDiscount: 200, usageLimit: 100, perUserLimit: 1, usedCount: 5, startDate: new Date("2020-01-01"), endDate: new Date("2099-01-01"), status: "ACTIVE" };
test("effective state distinguishes scheduling, exhaustion and explicit deactivation", () => {
  assert.equal(couponState(coupon, now), "ACTIVE");
  assert.equal(couponState({ ...coupon, startDate: new Date("2031-01-01") }, now), "SCHEDULED");
  assert.equal(couponState({ ...coupon, usedCount: 100 }, now), "EXHAUSTED");
  assert.equal(couponState({ ...coupon, endDate: new Date("2029-01-01") }, now), "EXPIRED");
  assert.equal(couponState({ ...coupon, status: "INACTIVE", usedCount: 100 }, now), "INACTIVE");
  assert.equal(couponState({ ...coupon, usageLimit: null, usedCount: 1000 }, now), "ACTIVE");
  assert.deepEqual(couponStatusWhere("EXHAUSTED", now, prisma.coupon.fields.usageLimit), { status: "ACTIVE", endDate: { gte: now }, usageLimit: { not: null }, usedCount: { gte: prisma.coupon.fields.usageLimit } });
});
function database(record: Coupon, uses = 0) {
  return { coupon: { findUnique: async () => record }, order: { count: async () => uses } } as unknown as Prisma.TransactionClient;
}
test("checkout enforces the new coupon's minimum, percentage cap and per-customer limit", async () => {
  assert.equal((await validateCoupon(coupon.code, 3000, "customer", database(coupon))).discountAmount, 200);
  await assert.rejects(validateCoupon(coupon.code, 50, "customer", database(coupon)), /Minimum order/);
  await assert.rejects(validateCoupon(coupon.code, 1000, "customer", database(coupon, 1)), /maximum allowed/);
});
test("fixed discounts never exceed the subtotal and fractional amounts retain paise", async () => {
  const fixed = { ...coupon, discountType: "FIXED_AMOUNT" as const, discountValue: 500.25 };
  assert.equal((await validateCoupon(fixed.code, 200, undefined, database(fixed))).discountAmount, 200);
  assert.equal((await validateCoupon(fixed.code, 1000, undefined, database(fixed))).discountAmount, 500.25);
});
test("checkout rejects inactive, expired, scheduled and exhausted offers", async () => {
  for (const changes of [{ status: "INACTIVE" }, { endDate: new Date("2000-01-01") }, { startDate: new Date("2098-01-01") }, { usedCount: 100 }]) {
    await assert.rejects(validateCoupon(coupon.code, 1000, "customer", database({ ...coupon, ...changes })));
  }
});
test("admin mutations cannot run without a request session", async () => {
  await assert.rejects(saveAdminCoupon(input));
  await assert.rejects(deleteAdminCoupon("test"));
});
