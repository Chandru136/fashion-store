import React from "react";
import { getOrCreateCart } from "@/lib/services/cart.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CheckoutFormClient } from "./CheckoutFormClient";
import { verifySessionToken } from "@/lib/auth";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;
  const user = await verifySessionToken(token);

  if (!user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const cartData = await getOrCreateCart(user.id);

  if (!cartData || cartData.items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-ivory-300 pb-4 text-center max-w-xl mx-auto">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase">Express Checkout</span>
        <h1 className="font-serif text-3xl font-bold text-wine-900 mt-1">Shipping & Payment</h1>
      </div>

      <CheckoutFormClient cart={cartData} user={user} />
    </div>
  );
}
