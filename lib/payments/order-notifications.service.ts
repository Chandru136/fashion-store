import { prisma } from "@/lib/db";
import { orderConfirmationHtml, adminNewOrderHtml } from "@/lib/email-templates";

export async function sendPaidOrderNotifications(orderId: string) {
  try {
    const { sendEmail } = await import("@/lib/mailer");
    const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { name: true, email: true } } },
    });

    if (fullOrder?.paymentStatus === "PAID" && fullOrder.status === "CONFIRMED") {
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

  } catch {
    console.error("Paid order notification failed", orderId);
  }
}
