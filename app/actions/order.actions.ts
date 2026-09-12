"use server";

import { createOrderFromCart } from "@/lib/services/order.service";
import { CreateOrderSchema, CreateOrderInput } from "@/lib/validations/order";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";
import { orderConfirmationHtml, orderStatusUpdateHtml, adminNewOrderHtml } from "@/lib/email-templates";

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;
  const session = await verifySessionToken(token);
  return session?.id ?? null;
}

function formatAddressLine(addr: { addressLine1: string; addressLine2: string | null }): string {
  return addr.addressLine2 ? `${addr.addressLine1}, ${addr.addressLine2}` : addr.addressLine1;
}

export async function createOrderAction(input: CreateOrderInput) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return { success: false, error: "Please log in to place an order." };
    }

    const validated = CreateOrderSchema.parse(input);

    // Resolve shippingAddressId -> the actual Address row, scoped to this
    // user so one customer can never use another's saved address.
    const shippingAddr = await prisma.address.findFirst({
      where: { id: validated.shippingAddressId, userId },
    });
    if (!shippingAddr) {
      return { success: false, error: "Selected shipping address was not found." };
    }

    // Billing address is optional — falls back to the shipping address
    // when the customer didn't pick a separate billing address.
    let billingAddr = shippingAddr;
    if (validated.billingAddressId) {
      const foundBilling = await prisma.address.findFirst({
        where: { id: validated.billingAddressId, userId },
      });
      if (!foundBilling) {
        return { success: false, error: "Selected billing address was not found." };
      }
      billingAddr = foundBilling;
    }

    const order = await createOrderFromCart({
      userId,
      checkoutKey: validated.checkoutKey,
      shippingName: shippingAddr.name,
      shippingPhone: shippingAddr.phone,
      shippingAddress: formatAddressLine(shippingAddr),
      shippingCity: shippingAddr.city,
      shippingState: shippingAddr.state,
      shippingPincode: shippingAddr.pincode,
      billingName: billingAddr.name,
      billingPhone: billingAddr.phone,
      billingAddress: formatAddressLine(billingAddr),
      billingCity: billingAddr.city,
      billingState: billingAddr.state,
      billingPincode: billingAddr.pincode,
      paymentMethod: validated.paymentMethod,
      couponCode: validated.couponCode,
    });

    revalidatePath("/orders");
    revalidatePath("/cart");

    // Fetch full order details (items + customer email) for the emails —
    // createOrderFromCart's return value may not include the user relation.
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, user: { select: { name: true, email: true } } },
    });

    if (fullOrder) {
      const emailData = {
        orderNumber: fullOrder.orderNumber,
        customerName: fullOrder.user.name,
        status: fullOrder.status,
        total: fullOrder.total,
        trackingNumber: fullOrder.trackingNumber,
        shippingAddress: fullOrder.shippingAddress,
        shippingCity: fullOrder.shippingCity,
        shippingState: fullOrder.shippingState,
        shippingPincode: fullOrder.shippingPincode,
        items: fullOrder.items.map((i) => ({
          productName: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          totalPrice: i.totalPrice,
        })),
      };

      // Customer confirmation
      await sendEmail({
        to: fullOrder.user.email,
        subject: `Order Confirmed — #${fullOrder.orderNumber}`,
        html: orderConfirmationHtml(emailData),
      });

      // Admin notification — only if an admin notification address is configured
      if (ADMIN_NOTIFICATION_EMAIL) {
        await sendEmail({
          to: ADMIN_NOTIFICATION_EMAIL,
          subject: `New Order — #${fullOrder.orderNumber}`,
          html: adminNewOrderHtml(emailData),
        });
      }
    }

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
      include: { items: true, user: { select: { name: true, email: true } } },
    });

    revalidatePath(`/admin/orders`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}`);

    // Notify the customer on meaningful status changes. Skipping PENDING/
    // CONFIRMED/PROCESSING to avoid over-emailing for routine internal steps —
    // customers mainly care about shipped/out-for-delivery/delivered/cancelled.
    const notifyStatuses = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];
    if (notifyStatuses.includes(updated.status)) {
      await sendEmail({
        to: updated.user.email,
        subject: `Order Update — #${updated.orderNumber} is now ${updated.status.replace(/_/g, " ")}`,
        html: orderStatusUpdateHtml({
          orderNumber: updated.orderNumber,
          customerName: updated.user.name,
          status: updated.status,
          total: updated.total,
          trackingNumber: updated.trackingNumber,
          shippingAddress: updated.shippingAddress,
          shippingCity: updated.shippingCity,
          shippingState: updated.shippingState,
          shippingPincode: updated.shippingPincode,
          items: updated.items.map((i) => ({
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            totalPrice: i.totalPrice,
          })),
        }),
      });
    }

    return { success: true, order: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status" };
  }
}