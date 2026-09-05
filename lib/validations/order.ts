import { z } from "zod";

export const CreateOrderSchema = z.object({
  shippingAddressId: z.string().min(1, "Select a shipping address"),
  billingAddressId: z.string().min(1, "Select a billing address").optional(),
  paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
  couponCode: z.string().trim().max(40).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
    "REFUNDED",
  ]),
  trackingNumber: z.string().trim().max(100, "Tracking number is too long").optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
