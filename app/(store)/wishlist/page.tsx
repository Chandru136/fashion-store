import React from "react";
import { getUserWishlistAction } from "@/app/actions/wishlist.actions";
import { ProductCard } from "@/components/product/ProductCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import Link from "next/link";

export default async function WishlistPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  if (!sessionCookie?.value) redirect("/login?callbackUrl=/wishlist");

  const items = await getUserWishlistAction();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-ivory-300 pb-4">
        <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">Saved Creations</span>
        <h1 className="font-serif text-3xl font-bold text-wine-900 mt-0.5">My Saved Wishlist ({items.length})</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border gold-border p-8 space-y-4 max-w-md mx-auto">
          <Heart className="w-16 h-16 text-gold-500 mx-auto opacity-40" />
          <h2 className="font-serif text-2xl font-bold text-wine-900">Your wishlist is empty</h2>
          <p className="text-xs text-stone-500">Tap the heart icon on any product to save items for later.</p>
          <Link href="/products" className="inline-block px-8 py-3 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase gold-border shadow">
            Explore Handloom Silks
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((prod: any) => (
            <ProductCard key={prod.id} id={prod.productId} {...prod} />
          ))}
        </div>
      )}
    </div>
  );
}
