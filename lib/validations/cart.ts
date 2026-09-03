import { z } from "zod";

export const AddToCartSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(99, "Quantity cannot exceed 99").default(1),
});

export const UpdateCartItemSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.number().int().min(0, "Quantity must be 0 or more").max(99, "Quantity cannot exceed 99"),
});

export const ApplyCouponSchema = z.object({
  couponCode: z.string().min(1, "Coupon code is required"),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;
