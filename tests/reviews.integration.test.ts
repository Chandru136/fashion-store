import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/db";
import { publicReviewWhere } from "../lib/reviews";
import { moderateProductReview, submitProductReview } from "../lib/services/review.service";

test("stored reviews stay private until published and disappear on unpublish", { skip: process.env.RUN_REVIEW_DB_TESTS !== "true" }, async () => {
  const rollback = new Error("SC-review-test-rollback");
  try {
    await assert.rejects(prisma.$transaction(async tx => {
      const suffix = randomUUID();
      const customer = await tx.user.create({ data: { name: "SC Review Test Customer", email: `sc-review-${suffix}@example.test`, role: "CUSTOMER" } });
      const admin = await tx.user.create({ data: { name: "SC Review Test Admin", email: `sc-admin-${suffix}@example.test`, role: "ADMIN" } });
      const category = await tx.category.create({ data: { name: "SC Review Test", slug: `sc-review-${suffix}` } });
      const product = await tx.product.create({ data: { name: "SC Review Test Product", slug: `sc-review-${suffix}`, sku: `SC-${suffix}`, description: "Temporary product for transactional review verification.", categoryId: category.id, mrp: 100, sellingPrice: 100 } });
      // All service operations share this outer transaction, which always rolls back.
      const db = { $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as PrismaClient;
      const review = await submitProductReview({ productId: product.id, rating: 4, title: "Good fabric", comment: "The fabric is comfortable and the finish is lovely." }, customer, db);
      const visible = () => tx.review.count({ where: { productId: product.id, ...publicReviewWhere } });
      assert.equal(await visible(), 0);
      await assert.rejects(submitProductReview({ productId: product.id, rating: 5, comment: "A second review should never be created." }, customer, db), /already submitted/);
      await assert.rejects(moderateProductReview({ id: review.id, expectedStatus: "PENDING", action: "PUBLISH" }, admin, db));
      await moderateProductReview({ id: review.id, expectedStatus: "PENDING", action: "APPROVE" }, admin, db);
      assert.equal(await visible(), 0);
      await moderateProductReview({ id: review.id, expectedStatus: "APPROVED", action: "PUBLISH" }, admin, db);
      assert.equal(await visible(), 1);
      assert.equal((await tx.review.aggregate({ where: { productId: product.id, ...publicReviewWhere }, _avg: { rating: true } }))._avg.rating, 4);
      await moderateProductReview({ id: review.id, expectedStatus: "PUBLISHED", action: "UNPUBLISH" }, admin, db);
      assert.equal(await visible(), 0);
      await moderateProductReview({ id: review.id, expectedStatus: "APPROVED", action: "REJECT" }, admin, db);
      assert.equal(await visible(), 0);
      assert.equal(await tx.auditLog.count({ where: { entityId: review.id, entity: "Review" } }), 4);
      throw rollback;
    }, { timeout: 30000 }), error => error === rollback);
  } finally { await prisma.$disconnect(); }
});
