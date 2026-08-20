import { z } from "zod";

export const CreateOrderSchema = z.object({
  addressId: z.string().optional(),
  shippingName: z.string().min(2, "Full Name is required"),
  shippingPhone: z.string().min(10, "Phone number is required"),
  shippingAddress: z.string().min(5, "Address is required"),
  shippingCity: z.string().min(2, "City is required"),
  shippingState: z.string().min(2, "State is required"),
  shippingPincode: z.string().min(6, "Pincode is required"),
  paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
  couponCode: z.string().optional(),
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
  trackingNumber: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
