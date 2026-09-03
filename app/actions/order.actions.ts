"use server";

import { createOrderFromCart } from "@/lib/services/order.service";
import { CreateOrderSchema, CreateOrderInput, UpdateOrderStatusSchema } from "@/lib/validations/order";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  return (await verifySessionToken(sessionCookie?.value))?.id ?? null;
}

export async function createOrderAction(input: CreateOrderInput) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return { success: false, error: "Please log in to place an order." };
    }

    const validated = CreateOrderSchema.parse(input);
    if (validated.paymentMethod === "ONLINE") {
      return { success: false, error: "Online payment is not available yet. Please choose Cash on Delivery." };
    }

    const order = await createOrderFromCart({
      userId,
      shippingName: validated.shippingName,
      shippingPhone: validated.shippingPhone,
      shippingAddress: validated.shippingAddress,
      shippingCity: validated.shippingCity,
      shippingState: validated.shippingState,
      shippingPincode: validated.shippingPincode,
      billingName: validated.billingName,
      billingPhone: validated.billingPhone,
      billingAddress: validated.billingAddress,
      billingCity: validated.billingCity,
      billingState: validated.billingState,
      billingPincode: validated.billingPincode,
      paymentMethod: validated.paymentMethod,
      couponCode: validated.couponCode,
    });

    revalidatePath("/orders");
    revalidatePath("/cart");
    return { success: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to process order" };
  }
}

export async function updateOrderStatusAction(orderId: string, status: unknown, trackingNumber?: string) {
  try {
    const cookieStore = await cookies();
    const session = await verifySessionToken(cookieStore.get("aarna_session_user")?.value);
    if (!session || session.role === "CUSTOMER") return { success: false, error: "Not authorized." };
    const validated = UpdateOrderStatusSchema.parse({ orderId, status, trackingNumber });
    const updated = await prisma.order.update({
      where: { id: validated.orderId },
      data: {
        status: validated.status,
        ...(validated.trackingNumber ? { trackingNumber: validated.trackingNumber } : {}),
      },
    });

    revalidatePath(`/admin/orders`);
    revalidatePath(`/admin/orders/${validated.orderId}`);
    revalidatePath(`/orders/${validated.orderId}`);
    return { success: true, order: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status" };
  }
}
