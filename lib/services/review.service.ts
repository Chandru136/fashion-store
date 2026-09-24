import type { PrismaClient } from "@prisma/client";
import type { UserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { ModerateReviewSchema, nextReviewStatus, SubmitReviewSchema } from "@/lib/reviews";

export class ReviewError extends Error {}

export function requireReviewManager(actor: UserSession | null) {
  if (!actor || !hasPermission(actor.role, PERMISSIONS.MANAGE_REVIEWS)) {
    throw new ReviewError("You do not have permission to manage reviews.");
  }
  return actor;
}

// Actors must come from a freshly checked server session, never from form data.
export async function submitProductReview(input: unknown, actor: UserSession | null, db: PrismaClient = prisma) {
  if (!actor || actor.role !== "CUSTOMER") throw new ReviewError("Please sign in with an active customer account to write a review.");
  const data = SubmitReviewSchema.parse(input);
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'review:' + actor.id + ':' + data.productId}))`;
    const product = await tx.product.findFirst({ where: { id: data.productId, status: "ACTIVE" }, select: { id: true, slug: true } });
    if (!product) throw new ReviewError("This product is no longer available for reviews.");
    if (await tx.review.findFirst({ where: { productId: product.id, userId: actor.id }, select: { id: true } })) {
      throw new ReviewError("You have already submitted a review for this product.");
    }
    const review = await tx.review.create({ data: { ...data, title: data.title || null, userId: actor.id, status: "PENDING" }, select: { id: true } });
    return review;
  });
}

export async function moderateProductReview(input: unknown, actor: UserSession | null, db: PrismaClient = prisma) {
  const manager = requireReviewManager(actor);
  const data = ModerateReviewSchema.parse(input);
  return db.$transaction(async tx => {
    const review = await tx.review.findUnique({ where: { id: data.id }, include: { product: { select: { slug: true } } } });
    if (!review) throw new ReviewError("Review not found.");
    if (review.status !== data.expectedStatus) throw new ReviewError("This review was updated by someone else. Refresh and try again.");
    let status: string;
    try { status = nextReviewStatus(review.status, data.action); }
    catch { throw new ReviewError("This action is not available for the current review status."); }
    const updated = await tx.review.updateMany({ where: { id: review.id, status: data.expectedStatus }, data: { status } });
    if (updated.count !== 1) throw new ReviewError("This review was updated by someone else. Refresh and try again.");
    await tx.auditLog.create({ data: { userId: manager.id, action: `REVIEW_${data.action}`, entity: "Review", entityId: review.id, oldValue: review.status, newValue: status } });
    return { slug: review.product.slug };
  });
}
