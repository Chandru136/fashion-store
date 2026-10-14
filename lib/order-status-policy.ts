import type { OrderStatus } from "@prisma/client";

// Approved fulfillment policy. Confirmation and refunds belong to payment processing.
export const cancellableOrderStatuses: readonly OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"];
export const fulfillmentTransitions: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  CONFIRMED: ["PROCESSING"], PROCESSING: ["PACKED"], PACKED: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"], OUT_FOR_DELIVERY: ["DELIVERED"],
};
export function allowedAdminOrderStatuses(status: OrderStatus, paid: boolean): OrderStatus[] {
  return [...(paid ? fulfillmentTransitions[status] || [] : []),
    ...(cancellableOrderStatuses.includes(status) ? ["CANCELLED" as const] : [])];
}
