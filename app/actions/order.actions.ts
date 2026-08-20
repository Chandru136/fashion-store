"use server";

import { createOrderFromCart } from "@/lib/services/order.service";
import { CreateOrderSchema, CreateOrderInput } from "@/lib/validations/order";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  if (!sessionCookie?.value) return null;
  try {
    const userObj = JSON.parse(sessionCookie.value);
    return userObj.id;
  } catch (e) {
    return null;
  }
}

export async function createOrderAction(input: CreateOrderInput) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return { success: false, error: "Please log in to place an order." };
    }

    const validated = CreateOrderSchema.parse(input);

    const order = await createOrderFromCart({
      userId,
      shippingName: validated.shippingName,
      shippingPhone: validated.shippingPhone,
      shippingAddress: validated.shippingAddress,
      shippingCity: validated.shippingCity,
      shippingState: validated.shippingState,
      shippingPincode: validated.shippingPincode,
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

export async function updateOrderStatusAction(orderId: string, status: any, trackingNumber?: string) {
  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(trackingNumber ? { trackingNumber } : {}),
      },
    });

    revalidatePath(`/admin/orders`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}`);
    return { success: true, order: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status" };
  }
}
