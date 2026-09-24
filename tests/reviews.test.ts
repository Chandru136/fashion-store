import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "@prisma/client";
import type { UserSession } from "../lib/auth";
import { ModerateReviewSchema, nextReviewStatus, publicReviewWhere, SubmitReviewSchema } from "../lib/reviews";
import { moderateProductReview, submitProductReview } from "../lib/services/review.service";

const customer: UserSession = { id: "SC-customer", name: "Customer", email: "customer@example.test", role: "CUSTOMER" };
const admin: UserSession = { ...customer, id: "SC-admin", role: "ADMIN" };
const input = { productId: "SC-product", rating: 4, title: " Lovely fabric ", comment: "Beautiful fabric and a comfortable fit." };

function database({ existing = false, active = true, status = "PENDING", changed = false } = {}) {
  const writes: Record<string, unknown>[] = [];
  const tx = {
    $executeRaw: async () => 1,
    product: { findFirst: async () => active ? { id: input.productId, slug: "sc-saree" } : null },
    review: {
      findFirst: async () => existing ? { id: "SC-review" } : null,
      findUnique: async () => ({ id: "SC-review", status, product: { slug: "sc-saree" } }),
      create: async ({ data }: { data: Record<string, unknown> }) => { writes.push(data); return { id: "SC-review" }; },
      updateMany: async ({ data }: { data: Record<string, unknown> }) => { if (!changed) writes.push(data); return { count: changed ? 0 : 1 }; },
    },
    auditLog: { create: async ({ data }: { data: Record<string, unknown> }) => { writes.push(data); } },
  };
  const db = { $transaction: async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as PrismaClient;
  return { db, writes };
}

test("ratings and feedback are validated, and clients cannot set status or identity", async () => {
  for (const rating of [0, 6, 2.5, "5", null]) assert.equal(SubmitReviewSchema.safeParse({ ...input, rating }).success, false);
  for (const comment of [" ", "short", "x".repeat(2001)]) assert.equal(SubmitReviewSchema.safeParse({ ...input, comment }).success, false);
  const { db, writes } = database();
  await submitProductReview({ ...input, status: "PUBLISHED", userId: "SC-forged" }, customer, db);
  assert.equal(writes[0].status, "PENDING");
  assert.equal(writes[0].userId, customer.id);
  assert.equal(writes[0].title, "Lovely fabric");
});

test("anonymous and staff submissions are rejected before touching the database", async () => {
  const { db, writes } = database();
  for (const actor of [null, admin]) await assert.rejects(submitProductReview(input, actor, db), /customer account/);
  assert.equal(writes.length, 0);
});

test("duplicate submissions and unavailable products cannot create reviews", async () => {
  for (const settings of [{ existing: true }, { active: false }]) {
    const { db, writes } = database(settings);
    await assert.rejects(submitProductReview(input, customer, db));
    assert.equal(writes.length, 0);
  }
});

test("publishing requires approval and unpublishing removes public visibility", () => {
  assert.throws(() => nextReviewStatus("PENDING", "PUBLISH"));
  assert.throws(() => nextReviewStatus("REJECTED", "PUBLISH"));
  assert.equal(nextReviewStatus("PENDING", "APPROVE"), "APPROVED");
  assert.equal(nextReviewStatus("APPROVED", "PUBLISH"), "PUBLISHED");
  assert.equal(nextReviewStatus("PUBLISHED", "UNPUBLISH"), "APPROVED");
  assert.deepEqual(publicReviewWhere, { status: "PUBLISHED" });
  assert.equal(ModerateReviewSchema.safeParse({ id: "SC-review", expectedStatus: "PENDING", action: "DELETE" }).success, false);
});

test("customers and unrelated staff cannot moderate", async () => {
  const { db, writes } = database();
  for (const actor of [null, customer, { ...admin, role: "ORDER_MANAGER" as const }]) {
    await assert.rejects(moderateProductReview({ id: "SC-review", expectedStatus: "PENDING", action: "APPROVE" }, actor, db), /permission/);
  }
  assert.equal(writes.length, 0);
});

test("admin approval is audited but not published", async () => {
  const { db, writes } = database();
  await moderateProductReview({ id: "SC-review", expectedStatus: "PENDING", action: "APPROVE" }, admin, db);
  assert.equal(writes[0].status, "APPROVED");
  assert.equal(writes[1].userId, admin.id);
  assert.equal(writes[1].action, "REVIEW_APPROVE");
});

test("stale moderation and racing updates are rejected", async () => {
  for (const settings of [{ status: "REJECTED" }, { changed: true }]) {
    const { db, writes } = database(settings);
    await assert.rejects(moderateProductReview({ id: "SC-review", expectedStatus: "PENDING", action: "APPROVE" }, admin, db), /updated by someone else/);
    assert.equal(writes.length, 0);
  }
});
