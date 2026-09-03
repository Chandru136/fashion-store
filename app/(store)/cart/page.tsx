import React from "react";
import { getOrCreateCart } from "@/lib/services/cart.service";
import { cookies } from "next/headers";
import Link from "next/link";
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { CartPageClient } from "./CartPageClient";
import { verifySessionToken } from "@/lib/auth";

export default async function CartPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  const userId = (await verifySessionToken(sessionCookie?.value))?.id;

  const sessionId = cookieStore.get("sudha_collections_cart_session")?.value;
  const cartData = await getOrCreateCart(userId, sessionId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-ivory-300 pb-4">
        <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">Shopping Bag</span>
        <h1 className="font-serif text-3xl font-bold text-wine-900 mt-0.5">Your Selected Items</h1>
      </div>

      <CartPageClient initialCart={cartData} />
    </div>
  );
}
