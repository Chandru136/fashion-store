"use server";

import { addItemToCart, updateCartItemQty, removeCartItem, getOrCreateCart } from "@/lib/services/cart.service";
import { validateCoupon } from "@/lib/services/coupon.service";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";
import { randomUUID } from "crypto";
import { AddToCartSchema, UpdateCartItemSchema } from "@/lib/validations/cart";

async function getSessionIdentifiers() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  const session = await verifySessionToken(sessionCookie?.value);
  const userId = session?.id;

  let sessionId = cookieStore.get("sudha_collections_cart_session")?.value;
  if (!sessionId) {
    sessionId = `sess_${randomUUID()}`;
    cookieStore.set("sudha_collections_cart_session", sessionId, { maxAge: 60 * 60 * 24 * 30, path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }

  return { userId, sessionId };
}

export async function addToCartAction(variantId: string, quantity: number = 1) {
  try {
    const validated = AddToCartSchema.parse({ variantId, quantity });
    const { userId, sessionId } = await getSessionIdentifiers();
    const cart = await addItemToCart(userId, sessionId, validated.variantId, validated.quantity);
    revalidatePath("/cart");
    revalidatePath("/products/[slug]", "page");
    return { success: true, cart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add product to bag" };
  }
}

export async function updateCartQtyAction(cartItemId: string, quantity: number) {
  try {
    const { userId, sessionId } = await getSessionIdentifiers();
    const validated = UpdateCartItemSchema.parse({ cartItemId, quantity });
    await updateCartItemQty(userId, sessionId, validated.cartItemId, validated.quantity);
    const cart = await getOrCreateCart(userId, sessionId);
    revalidatePath("/cart");
    return { success: true, cart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update quantity" };
  }
}

export async function removeCartItemAction(cartItemId: string) {
  try {
    const { userId, sessionId } = await getSessionIdentifiers();
    if (!cartItemId || typeof cartItemId !== "string") throw new Error("Cart item ID is required");
    await removeCartItem(userId, sessionId, cartItemId);
    const cart = await getOrCreateCart(userId, sessionId);
    revalidatePath("/cart");
    return { success: true, cart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove item" };
  }
}

export async function applyCouponAction(code: string, subtotal: number) {
  try {
    const { userId } = await getSessionIdentifiers();
    const validated = await validateCoupon(code, subtotal, userId);
    return { success: true, coupon: validated };
  } catch (error: any) {
    return { success: false, error: error.message || "Invalid coupon code" };
  }
}

export async function getCartAction() {
  const { userId, sessionId } = await getSessionIdentifiers();
  return getOrCreateCart(userId, sessionId);
}
