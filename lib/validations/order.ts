import { z } from "zod";

export const CreateOrderSchema = z.object({
  addressId: z.string().optional(),
  shippingName: z.string().trim().min(2, "Shipping name is required").max(100),
  shippingPhone: z.string().trim().regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid Indian phone number"),
  shippingAddress: z.string().trim().min(5, "Shipping address is required").max(300),
  shippingCity: z.string().trim().min(2, "Shipping city is required").max(80),
  shippingState: z.string().trim().min(2, "Shipping state is required").max(80),
  shippingPincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  billingName: z.string().trim().min(2, "Billing name is required").max(100),
  billingPhone: z.string().trim().regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid billing phone number"),
  billingAddress: z.string().trim().min(5, "Billing address is required").max(300),
  billingCity: z.string().trim().min(2, "Billing city is required").max(80),
  billingState: z.string().trim().min(2, "Billing state is required").max(80),
  billingPincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit billing pincode"),
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
