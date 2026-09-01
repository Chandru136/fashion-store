"use server";

import { addItemToCart, updateCartItemQty, removeCartItem, getOrCreateCart } from "@/lib/services/cart.service";
import { validateCoupon } from "@/lib/services/coupon.service";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";

async function getSessionIdentifiers() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  let userId: string | undefined;

  if (sessionCookie?.value) {
    try {
      const userObj = JSON.parse(sessionCookie.value);
      userId = userObj.id;
    } catch (e) {}
  }

  let sessionId = cookieStore.get("sudha_collections_cart_session")?.value;
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    cookieStore.set("sudha_collections_cart_session", sessionId, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }

  return { userId, sessionId };
}

export async function addToCartAction(variantId: string, quantity: number = 1) {
  try {
    const { userId, sessionId } = await getSessionIdentifiers();
    const cart = await addItemToCart(userId, sessionId, variantId, quantity);
    revalidatePath("/cart");
    revalidatePath("/products/[slug]", "page");
    return { success: true, cart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add product to bag" };
  }
}

export async function updateCartQtyAction(cartItemId: string, quantity: number) {
  try {
    await updateCartItemQty(cartItemId, quantity);
    const { userId, sessionId } = await getSessionIdentifiers();
    const cart = await getOrCreateCart(userId, sessionId);
    revalidatePath("/cart");
    return { success: true, cart };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update quantity" };
  }
}

export async function removeCartItemAction(cartItemId: string) {
  try {
    await removeCartItem(cartItemId);
    const { userId, sessionId } = await getSessionIdentifiers();
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
