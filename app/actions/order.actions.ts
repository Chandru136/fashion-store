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
