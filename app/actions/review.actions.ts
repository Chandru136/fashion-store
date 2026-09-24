"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getReviewSession } from "@/lib/review-session";
import { moderateProductReview, ReviewError, submitProductReview } from "@/lib/services/review.service";

function failure(error: unknown) {
  return { success: false as const, error: error instanceof ReviewError ? error.message : error instanceof ZodError ? error.issues[0].message : "Unable to save the review. Please try again." };
}

export async function submitReviewAction(input: unknown) {
  try {
    const review = await submitProductReview(input, await getReviewSession());
    revalidatePath("/admin/reviews");
    return { success: true as const, id: review.id };
  } catch (error) { return failure(error); }
}

export async function moderateReviewAction(input: unknown) {
  try {
    const { slug } = await moderateProductReview(input, await getReviewSession());
    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${slug}`);
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (error) { return failure(error); }
}
