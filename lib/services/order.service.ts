import { prisma } from "@/lib/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { validateCoupon } from "@/lib/services/coupon.service";
import { randomUUID } from "crypto";
import { paymentConfig, toPaise } from "@/lib/payments/razorpay";

export interface CreateOrderParams {
  userId: string;
  checkoutKey: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  billingName: string;
  billingPhone: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  paymentMethod: "ONLINE";
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
    billingName,
    billingPhone,
    billingAddress,
    billingCity,
    billingState,
    billingPincode,
    paymentMethod,
    couponCode,
  } = params;

  if (paymentMethod !== "ONLINE") throw new Error("Only online payment is supported.");
  const provider = paymentConfig().provider;
  return prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
  const existing = await tx.order.findUnique({ where: { checkoutKey: params.checkoutKey }, include: { items: true, payments: true } });
  if (existing) {
    if (existing.userId !== userId) throw new Error("Invalid checkout request.");
    return existing;
  }
  // 1. Fetch user's cart
  const cart = await tx.cart.findUnique({
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

  for (const item of [...cart.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
    const variant = item.variant;
    const availableStock = variant.inventory?.availableStock ?? variant.stock;

    if (availableStock < item.quantity) {
      throw new Error(`Insufficient stock for ${variant.product.name} (${variant.color || ""} ${variant.size || ""}). Only ${availableStock} left.`);
    }

    if (variant.product.status !== "ACTIVE") throw new Error(`${variant.product.name} is no longer available.`);
    const unitPrice = variant.salePrice ?? variant.price;
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
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'coupon:' + couponCode.toUpperCase()}))`;
    const validatedCoupon = await validateCoupon(couponCode, subtotal, userId, tx);
    discount = Math.min(subtotal, validatedCoupon.discountAmount);
  }

  // 4. Tax & Shipping computation
  const undiscountedTax = cart.items.reduce((sum, item) => {
    const price = item.variant.salePrice ?? item.variant.price;
    return sum + price * item.quantity * (item.variant.product.tax / 100);
  }, 0);
  const tax = Math.round(undiscountedTax * (subtotal > 0 ? (subtotal - discount) / subtotal : 0));
  const shipping = subtotal > 2000 ? 0 : 150; // Free shipping above ₹2000
  const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

  const orderNumber = `SC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

  // 5. Database Transaction for Order Creation & Stock Reservation

    // Decrease stock for each variant & update inventory
    for (const item of cart.items) {
      const variantId = item.variantId;
      const qty = item.quantity;

      const currentInventory = await tx.inventory.findUnique({ where: { variantId } });
      if (currentInventory) {
        const inventoryUpdate = await tx.inventory.updateMany({
          where: { variantId, availableStock: { gte: qty } },
          data: {
            availableStock: { decrement: qty },
            reservedStock: { increment: qty },
          },
        });
        if (inventoryUpdate.count !== 1) throw new Error("An item just went out of stock. Please review your bag.");
      }

      const variantUpdate = await tx.productVariant.updateMany({
        where: { id: variantId, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      });
      if (variantUpdate.count !== 1) throw new Error("An item just went out of stock. Please review your bag.");
    }

    // Create Order Record
    const order = await tx.order.create({
      data: {
        orderNumber,
        checkoutKey: params.checkoutKey,
        userId,
        status: OrderStatus.PENDING,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod,
        couponCode: couponCode?.toUpperCase() || null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        billingName,
        billingPhone,
        billingAddress,
        billingCity,
        billingState,
        billingPincode,
        items: {
          create: orderItemData,
        },
        payments: {
          create: [
            {
              provider,
              amountPaise: toPaise(total),
              transactionId: null,
              amount: total,
              status: PaymentStatus.PENDING,
              paidAt: null,
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
  }, { timeout: 15000 });
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
