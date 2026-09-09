"use server";

import { paymentActor } from "@/lib/payments/actor";
import { cancelOrder, releaseReservation } from "@/lib/payments/lifecycle.service";
import { OrderStatus } from "@prisma/client";
import { createOrderFromCart } from "@/lib/services/order.service";
import { CreateOrderSchema, CreateOrderInput, UpdateOrderStatusSchema } from "@/lib/validations/order";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sudha_collections_session_user");
  return (await verifySessionToken(sessionCookie?.value))?.id ?? null;
}

export async function createOrderAction(input: CreateOrderInput) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return { success: false, error: "Please log in to place an order." };
    }

    const validated = CreateOrderSchema.parse(input);


    const addressIds = [...new Set([
      validated.shippingAddressId,
      validated.billingAddressId || validated.shippingAddressId,
    ])];
    const savedAddresses = await prisma.address.findMany({
      where: { id: { in: addressIds }, userId },
    });
    const shippingAddress = savedAddresses.find((address) => address.id === validated.shippingAddressId);
    const billingAddress = savedAddresses.find(
      (address) => address.id === (validated.billingAddressId || validated.shippingAddressId),
    );

    if (!shippingAddress || !billingAddress) {
      return { success: false, error: "Please select a valid saved address." };
    }

    const order = await createOrderFromCart({
      userId,
      checkoutKey: validated.checkoutKey,
      shippingName: shippingAddress.name,
      shippingPhone: shippingAddress.phone,
      shippingAddress: [shippingAddress.addressLine1, shippingAddress.addressLine2].filter(Boolean).join(", "),
      shippingCity: shippingAddress.city,
      shippingState: shippingAddress.state,
      shippingPincode: shippingAddress.pincode,
      billingName: billingAddress.name,
      billingPhone: billingAddress.phone,
      billingAddress: [billingAddress.addressLine1, billingAddress.addressLine2].filter(Boolean).join(", "),
      billingCity: billingAddress.city,
      billingState: billingAddress.state,
      billingPincode: billingAddress.pincode,
      paymentMethod: validated.paymentMethod,
      couponCode: validated.couponCode,
    });

    // Keep online checkout mounted until the payment callback completes.
    if (order.paymentMethod !== "ONLINE") {
      revalidatePath("/orders");
      revalidatePath("/cart");
    }
    return { success: true, orderId: order.id, orderNumber: order.orderNumber, paymentMethod: order.paymentMethod };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to process order" };
  }
}

export async function updateOrderStatusAction(orderId: string, status: unknown, trackingNumber?: string) {
  try {
    const actor = await paymentActor(true);
    const validated = UpdateOrderStatusSchema.parse({ orderId, status, trackingNumber });
    if (validated.status === "CANCELLED") {
      await cancelOrder(orderId, actor, "Cancelled by order manager");
      revalidatePath("/admin/payments"); revalidatePath("/orders"); revalidatePath(`/orders/${orderId}`); revalidatePath(`/admin/orders/${orderId}`);
      return { success: true };
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;
      const current = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
      const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
        CONFIRMED: ["PROCESSING"], PROCESSING: ["PACKED"], PACKED: ["SHIPPED"],
        SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"], OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"], DELIVERED: ["RETURNED"],
      };
      if (current.status !== validated.status && !transitions[current.status]?.includes(validated.status)) throw new Error("Invalid order transition. Use payment controls for refunds and cancellations.");
      if (current.paymentMethod === "ONLINE" && current.paymentStatus !== "PAID") throw new Error("Verify captured payment before fulfilment.");
      if (validated.status === "SHIPPED" && !current.inventoryCommittedAt) {
        for (const item of [...current.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
          const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
          if (inventory) await tx.inventory.update({ where: { variantId: item.variantId }, data: { reservedStock: { decrement: Math.min(item.quantity, inventory.reservedStock) } } });
        }
        await tx.order.update({ where: { id: orderId }, data: { inventoryCommittedAt: new Date() } });
      }
      // RETURNED means goods have been received and inspected by the store.
      if (validated.status === "RETURNED") await releaseReservation(tx, orderId);
      const updated = await tx.order.update({ where: { id: orderId }, data: { status: validated.status, ...(validated.trackingNumber ? { trackingNumber: validated.trackingNumber } : {}) } });
      await tx.auditLog.create({ data: { userId: actor.userId, action: "ORDER_STATUS_CHANGED", entity: "Order", entityId: orderId, oldValue: current.status, newValue: validated.status } });
      return updated;
    });

    revalidatePath(`/admin/orders`);
    revalidatePath(`/admin/orders/${validated.orderId}`);
    revalidatePath(`/orders/${validated.orderId}`);
    return { success: true, order: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status" };
  }
}
