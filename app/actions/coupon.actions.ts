"use server";

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { CouponAdminError, saveAdminCoupon, deleteAdminCoupon } from "@/lib/services/coupon-admin.service";

function failure(error: unknown) {
  if (error instanceof ZodError) return { success: false as const, error: error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(" ") };
  if (error instanceof CouponAdminError) return { success: false as const, error: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false as const, error: "That coupon code already exists. Choose a different code." };
  return { success: false as const, error: "Unable to save coupon changes. Please try again." };
}
export async function saveCouponAction(input: unknown, id?: string) {
  try {
    const couponId = await saveAdminCoupon(input, id);
    revalidatePath("/admin/coupons");
    revalidatePath(`/admin/coupons/${couponId}`);
    revalidatePath(`/admin/coupons/${couponId}/edit`);
    return { success: true as const, id: couponId };
  } catch (error) { return failure(error); }
}
export async function deleteCouponAction(id: string) {
  try {
    await deleteAdminCoupon(id);
    revalidatePath("/admin/coupons");
    revalidatePath(`/admin/coupons/${id}`);
    return { success: true as const };
  } catch (error) { return failure(error); }
}
