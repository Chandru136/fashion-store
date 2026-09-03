import { prisma } from "@/lib/db";

export async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (!userId && !sessionId) return null;

  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: "asc" } },
                },
              },
              inventory: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { sortOrder: "asc" } },
                  },
                },
                inventory: true,
              },
            },
          },
        },
      },
    });
  }

  // Calculate cart totals
  let subtotal = 0;
  let totalDiscount = 0;

  const items = cart.items.map((item) => {
    const unitPrice = item.variant.salePrice ?? item.variant.price;
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    const mrp = item.variant.product.mrp;
    if (mrp > unitPrice) {
      totalDiscount += (mrp - unitPrice) * item.quantity;
    }

    return {
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      productId: item.variant.product.id,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      image: item.variant.product.images[0]?.url || "/images/placeholder.jpg",
      color: item.variant.color,
      size: item.variant.size,
      fabric: item.variant.fabric || item.variant.product.fabric,
      price: unitPrice,
      mrp: item.variant.product.mrp,
      itemTotal,
      availableStock: item.variant.inventory?.availableStock ?? item.variant.stock,
    };
  });

  const tax = Math.round(cart.items.reduce((sum, item) => {
    const unitPrice = item.variant.salePrice ?? item.variant.price;
    return sum + unitPrice * item.quantity * (item.variant.product.tax / 100);
  }, 0));
  const shipping = subtotal > 2000 || items.length === 0 ? 0 : 150; // Free shipping over ₹2000
  const grandTotal = subtotal + tax + shipping;

  return {
    cartId: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    totalDiscount,
    tax,
    shipping,
    grandTotal,
  };
}

export async function addItemToCart(userId: string | undefined, sessionId: string | undefined, variantId: string, quantity: number = 1) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true, product: { select: { status: true } } },
  });

  if (!variant || variant.product.status !== "ACTIVE") throw new Error("This product is not available");

  const stock = variant.inventory?.availableStock ?? variant.stock;
  if (stock < quantity) throw new Error("Requested quantity exceeds available stock");

  const cart = await getOrCreateCart(userId, sessionId);
  if (!cart) throw new Error("Unable to create cart");

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.cartId, variantId },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > 99) throw new Error("Quantity cannot exceed 99");
    if (stock < newQty) throw new Error("Requested quantity exceeds available stock");

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: { increment: quantity } },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.cartId,
        variantId,
        quantity,
      },
    });
  }

  return getOrCreateCart(userId, sessionId);
}

export async function updateCartItemQty(userId: string | undefined, sessionId: string | undefined, cartItemId: string, quantity: number) {
  const owner = userId ? { userId } : { sessionId };
  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: owner },
    include: { variant: { include: { inventory: true } } },
  });
  if (!item) throw new Error("Cart item not found");

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  } else {
    const stock = item.variant.inventory?.availableStock ?? item.variant.stock;
    if (stock < quantity) throw new Error("Requested quantity exceeds available stock");

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }
}

export async function removeCartItem(userId: string | undefined, sessionId: string | undefined, cartItemId: string) {
  const result = await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cart: userId ? { userId } : { sessionId } },
  });
  if (result.count === 0) throw new Error("Cart item not found");
}
