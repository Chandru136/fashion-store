import { ListControls, Pagination } from "@/components/common/ListControls";
import { priceSorts, type ListPageProps } from "@/lib/listing";

import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import React from "react";
import { getUserWishlistAction } from "@/app/actions/wishlist.actions";
import { ProductCard } from "@/components/product/ProductCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import Link from "next/link";
import { verifySessionToken } from "@/lib/auth";

export default async function WishlistPage({ searchParams }: ListPageProps) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!(await verifySessionToken(sessionCookie?.value))) redirect("/login?callbackUrl=/wishlist");

  const { items, ...paging } = await getUserWishlistAction(sp);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-ivory-300 pb-4">
        <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">Saved Creations</span>
        <h1 className="font-serif text-3xl font-bold text-wine-900 mt-0.5">My Saved Wishlist ({paging.totalCount})</h1>
      </div>

      <ListControls path="/wishlist" params={sp} search="Saved product name" sorts={priceSorts} />
      <Pagination path="/wishlist" params={sp} {...paging} label="Saved products" />
      {items.length === 0 ? (
        <div className="text-center py-20 bg-ivory-50 rounded-xl border gold-border p-8 space-y-4 max-w-md mx-auto">
          <Heart className="w-16 h-16 text-gold-500 mx-auto opacity-40" />
          <h2 className="font-serif text-2xl font-bold text-wine-900">No matching saved products</h2>
          <p className="text-xs text-stone-500">Tap the heart icon on any product to save items for later.</p>
          <Link href="/products" className="inline-block px-8 py-3 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase gold-border shadow">
            Explore Handloom Silks
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((prod) => (
            <ProductCard key={prod.id} {...prod} id={prod.productId} initialWishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
