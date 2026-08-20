import { prisma } from "@/lib/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { validateCoupon } from "@/lib/services/coupon.service";

export interface CreateOrderParams {
  userId: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  paymentMethod: "COD" | "ONLINE";
  couponCode?: string;
}

export async function createOrderFromCart(params: CreateOrderParams) {
  const {
    userId,
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingPincode,
    paymentMethod,
    couponCode,
  } = params;

  // 1. Fetch user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              inventory: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Your shopping bag is empty");
  }

  // 2. Validate stock and calculate actual server-side prices
  let subtotal = 0;
  const orderItemData: Array<{
    productId: string;
    variantId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  for (const item of cart.items) {
    const variant = item.variant;
    const availableStock = variant.inventory?.availableStock ?? variant.stock;

    if (availableStock < item.quantity) {
      throw new Error(`Insufficient stock for ${variant.product.name} (${variant.color || ""} ${variant.size || ""}). Only ${availableStock} left.`);
    }

    const unitPrice = variant.price;
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    orderItemData.push({
      productId: variant.product.id,
      variantId: variant.id,
      productName: variant.product.name,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    });
  }

  // 3. Coupon validation
  let discount = 0;
  if (couponCode) {
    const validatedCoupon = await validateCoupon(couponCode, subtotal, userId);
    discount = validatedCoupon.discountAmount;
  }

  // 4. Tax & Shipping computation
  const tax = Math.round((subtotal - discount) * 0.05); // 5% GST
  const shipping = subtotal > 2000 ? 0 : 150; // Free shipping above ₹2000
  const total = subtotal - discount + tax + shipping;

  const orderNumber = `ARN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 5. Database Transaction for Order Creation & Stock Reservation
  const newOrder = await prisma.$transaction(async (tx) => {
    // Decrease stock for each variant & update inventory
    for (const item of cart.items) {
      const variantId = item.variantId;
      const qty = item.quantity;

      const currentInventory = await tx.inventory.findUnique({ where: { variantId } });
      if (currentInventory) {
        await tx.inventory.update({
          where: { variantId },
          data: {
            availableStock: { decrement: qty },
            reservedStock: { increment: qty },
          },
        });
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: qty } },
      });
    }

    // Create Order Record
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.CONFIRMED,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        paymentStatus: paymentMethod === "COD" ? PaymentStatus.PENDING : PaymentStatus.PAID,
        paymentMethod,
        couponCode: couponCode || null,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        items: {
          create: orderItemData,
        },
        payments: {
          create: [
            {
              provider: paymentMethod === "COD" ? "COD" : "MOCK_ONLINE",
              transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              amount: total,
              status: paymentMethod === "COD" ? PaymentStatus.PENDING : PaymentStatus.PAID,
              paidAt: paymentMethod === "ONLINE" ? new Date() : null,
            },
          ],
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // Increment coupon usage count if applied
    if (couponCode) {
      await tx.coupon.update({
        where: { code: couponCode.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Clear user cart items
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  });

  return newOrder;
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(orderId: string, userId?: string) {
  const whereClause: any = { id: orderId };
  if (userId) whereClause.userId = userId;

  return prisma.order.findUnique({
    where: whereClause,
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
      payments: true,
    },
  });
}
