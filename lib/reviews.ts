import { z } from "zod";

export const reviewStatuses = ["PENDING", "APPROVED", "PUBLISHED", "REJECTED"] as const;
export const reviewActions = ["APPROVE", "PUBLISH", "REJECT", "UNPUBLISH"] as const;
export type ReviewAction = typeof reviewActions[number];
export const publicReviewWhere = { status: "PUBLISHED" } as const;

export const SubmitReviewSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  rating: z.number().int().min(1, "Choose a star rating.").max(5),
  title: z.string().trim().max(100, "Keep the title under 100 characters.").default(""),
  comment: z.string().trim().min(10, "Please write at least 10 characters.").max(2000, "Keep your review under 2,000 characters."),
});
export const ModerateReviewSchema = z.object({
  id: z.string().min(1).max(100),
  expectedStatus: z.enum(reviewStatuses),
  action: z.enum(reviewActions),
});

export function nextReviewStatus(status: string, action: ReviewAction) {
  if (action === "APPROVE" && (status === "PENDING" || status === "REJECTED")) return "APPROVED";
  if (action === "PUBLISH" && status === "APPROVED") return "PUBLISHED";
  if (action === "REJECT" && (status === "PENDING" || status === "APPROVED")) return "REJECTED";
  if (action === "UNPUBLISH" && status === "PUBLISHED") return "APPROVED";
  throw new Error("This action is not available for the current review status. Refresh and try again.");
}

export function publicReviewerName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0] || "Customer";
}
