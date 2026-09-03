"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Eye, Star, Sparkles, Check } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart.actions";
import { toggleWishlistAction } from "@/app/actions/wishlist.actions";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  mrp: number;
  sellingPrice: number;
  discountPercent?: number;
  categoryName?: string;
  primaryImage: string;
  hoverImage?: string;
  avgRating?: number;
  reviewCount?: number;
  bestseller?: boolean;
  newArrival?: boolean;
  variantId?: string;
  colors?: string[];
  initialWishlisted?: boolean;
}

export function ProductCard({
  id,
  name,
  slug,
  mrp,
  sellingPrice,
  discountPercent = 0,
  categoryName,
  primaryImage,
  hoverImage,
  avgRating = 5.0,
  reviewCount = 12,
  bestseller = false,
  newArrival = false,
  variantId,
  colors = ["#8B0000", "#00008B", "#006400"],
  initialWishlisted = false,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleWishlistAction(id);
    if (res.success) setIsWishlisted(Boolean(res.isWishlisted));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variantId) return;
    setIsAdding(true);
    const res = await addToCartAction(variantId, 1);
    setIsAdding(false);
    if (res.success) {
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: res.cart }));
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  return (
    <div className="group luxury-card rounded-lg overflow-hidden flex flex-col justify-between relative">
      {/* Top Media Thumbnail Container */}
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
        {/* Primary & Hover Images */}
        <Link href={`/products/${slug}`} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {hoverImage && (
            <img
              src={hoverImage}
              alt={`${name} detail`}
              className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {bestseller && (
            <span className="gold-gradient-bg text-wine-900 text-[10px] font-bold px-2 py-0.5 rounded shadow tracking-wider uppercase">
              ★ BESTSELLER
            </span>
          )}
          {newArrival && (
            <span className="wine-gradient-bg text-gold-300 text-[10px] font-bold px-2 py-0.5 rounded shadow tracking-wider uppercase gold-border">
              ✦ NEW
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow tracking-wider">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-wine-900 hover:bg-white hover:text-red-600 transition-all shadow-md z-10"
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} />
        </button>

        {/* Quick View & Add to Bag Floating Action */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 z-10">
          <Link
            href={`/products/${slug}`}
            className="flex-1 py-2 bg-white/90 backdrop-blur-md text-wine-900 font-semibold text-[11px] rounded text-center shadow hover:bg-white transition-all uppercase tracking-wider"
          >
            Quick View
          </Link>
        </div>
      </div>

      {/* Product Information Footer */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {categoryName && (
            <span className="text-[10px] font-bold tracking-widest text-gold-600 uppercase block">
              {categoryName}
            </span>
          )}
          <Link href={`/products/${slug}`}>
            <h3 className="font-serif text-[11px] sm:text-xs font-semibold text-wine-900 line-clamp-2 sm:line-clamp-1 hover:text-gold-600 transition-colors mt-0.5 min-h-8 sm:min-h-0">
              {name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="hidden sm:flex items-center gap-1 mt-1 text-[11px] text-amber-600">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(avgRating) ? "fill-amber-500 text-amber-500" : "text-stone-300"}`} />
              ))}
            </div>
            <span className="font-medium text-stone-600 ml-1">({reviewCount})</span>
          </div>
        </div>

        {/* Price & Add to Bag */}
        <div className="pt-2 border-t border-ivory-200 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-wine-900">₹{sellingPrice.toLocaleString("en-IN")}</span>
              {mrp > sellingPrice && (
                <span className="text-[11px] text-stone-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`shrink-0 p-1.5 sm:p-2 rounded-full transition-all shadow-sm ${
              addedSuccess
                ? "bg-emerald-600 text-white"
                : "wine-gradient-bg text-gold-300 hover:brightness-110 gold-border"
            }`}
            title="Add to Bag"
          >
            {addedSuccess ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
