"use client";

import React, { useState } from "react";
import { Star, ShieldCheck, Truck, RefreshCw, Heart, ShoppingBag, ArrowRight, Check, MapPin, Sparkles } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart.actions";
import { toggleWishlistAction } from "@/app/actions/wishlist.actions";
import { useRouter } from "next/navigation";

export function ProductDetailClient({ product }: { product: any }) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [pincode, setPincode] = useState("");
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const activePrice = currentVariant.price || product.sellingPrice;
  const availableStock = currentVariant.inventory?.availableStock ?? currentVariant.stock;

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      setPincodeMessage(`✓ Express delivery available to Pincode ${pincode} in 2-3 business days.`);
    } else {
      setPincodeMessage("Please enter a valid 6-digit Indian Pincode.");
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant) return;
    setIsAdding(true);
    setActionError(null);
    const res = await addToCartAction(currentVariant.id, quantity);
    setIsAdding(false);
    if (res.success) {
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: res.cart }));
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2500);
    } else {
      setActionError(res.error || "Unable to add this item to your bag.");
    }
    return res.success;
  };

  const handleBuyNow = async () => {
    if (await handleAddToCart()) router.push("/checkout");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left Column: Image Gallery */}
      <div className="lg:col-span-7 space-y-4">
        {/* Main Display Image */}
        <div className="relative aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden border gold-border shadow-lg">
          <img
            src={product.images[selectedImageIndex]?.url || "/images/placeholder.jpg"}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300"
          />
          {product.discountPercent > 0 && (
            <span className="absolute top-4 left-4 bg-red-700 text-white font-bold text-xs px-3 py-1 rounded shadow uppercase tracking-wider">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Thumbnail Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {product.images.map((img: any, idx: number) => (
            <button
              key={img.id}
              onClick={() => setSelectedImageIndex(idx)}
              className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-stone-100 ${
                idx === selectedImageIndex ? "border-gold-500 shadow-md scale-105" : "border-stone-200 opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt={img.altText || product.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Product Information & Checkout Actions */}
      <div className="lg:col-span-5 space-y-6">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">
            {product.category.name} • {product.brand?.name || "Sudha Collections"}
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine-900 mt-1 leading-snug">
            {product.name}
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-mono">SKU: {currentVariant.sku}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.avgRating) ? "fill-amber-500 text-amber-500" : "text-stone-300"}`} />
              ))}
            </div>
            <span className="font-bold text-wine-900">{product.avgRating}</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-600">{product.reviewCount} Patron Reviews</span>
          </div>
        </div>

        {/* Price Box */}
        <div className="p-4 bg-ivory-50 rounded-lg border gold-border space-y-1">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-wine-900">₹{activePrice.toLocaleString("en-IN")}</span>
            {product.mrp > activePrice && (
              <span className="text-sm text-stone-400 line-through">MRP ₹{product.mrp.toLocaleString("en-IN")}</span>
            )}
            {product.discountPercent > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Save ₹{(product.mrp - activePrice).toLocaleString("en-IN")} ({product.discountPercent}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-500">Inclusive of all Taxes (5% GST). Free Shipping on orders above ₹2,000.</p>
        </div>

        {/* Variant Selector */}
        {product.variants.length > 0 && (
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-wine-900 uppercase tracking-wider block">
              Select Color & Option Variant
            </label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v: any, idx: number) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantIndex(idx)}
                  className={`px-3 py-2 rounded text-xs font-semibold border transition-all ${
                    idx === selectedVariantIndex
                      ? "wine-gradient-bg text-gold-300 gold-border shadow-md"
                      : "bg-white border-stone-300 text-stone-700 hover:border-gold-500"
                  }`}
                >
                  {v.color} {v.size ? `(${v.size})` : ""}
                </button>
              ))}
            </div>
            {/* Stock Level Alert */}
            <div className="text-xs">
              {availableStock > 0 ? (
                <p className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> In Stock ({availableStock} units ready to dispatch)
                </p>
              ) : (
                <p className="text-red-600 font-semibold">Out of Stock</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between rounded border border-stone-200 bg-white p-3">
            <span className="text-xs font-bold text-wine-900">Quantity</span>
            <div className="flex items-center rounded border border-stone-300">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="px-3 py-1.5" aria-label="Decrease quantity">−</button>
              <span className="min-w-8 text-center text-xs font-bold">{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => Math.min(Math.min(availableStock, 99), value + 1))} className="px-3 py-1.5" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || availableStock === 0}
              className={`py-3 px-4 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                addSuccess
                  ? "bg-emerald-700 text-white"
                  : "wine-gradient-bg text-gold-300 gold-border hover:brightness-110"
              }`}
            >
              {addSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Added to Bag
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to Bag
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isAdding || availableStock === 0}
              className="py-3 px-4 gold-gradient-bg text-wine-900 font-bold text-xs uppercase tracking-wider rounded shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              Buy Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {actionError && <p role="alert" className="rounded bg-red-50 p-2 text-xs font-semibold text-red-700">{actionError}</p>}

          <button
            onClick={async () => {
              const res = await toggleWishlistAction(product.id);
              if (res.success) setIsWishlisted(Boolean(res.isWishlisted));
              else setActionError(res.error || "Unable to update your wishlist.");
            }}
            className="w-full py-2.5 bg-white border border-stone-300 text-wine-900 rounded font-semibold text-xs flex items-center justify-center gap-2 hover:border-gold-500 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} />
            {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
          </button>
        </div>

        {/* Pincode Deliverability Checker */}
        <div className="p-4 bg-white rounded-lg border border-stone-200 space-y-2">
          <h4 className="text-xs font-bold text-wine-900 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gold-600" /> Delivery & Serviceability
          </h4>
          <form onSubmit={handlePincodeCheck} className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter 6-digit Pincode"
              className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded focus:outline-none focus:border-gold-500"
            />
            <button type="submit" className="px-4 py-1.5 bg-stone-800 text-white font-semibold text-xs rounded hover:bg-wine-900">
              Check
            </button>
          </form>
          {pincodeMessage && (
            <p className={`text-xs ${pincodeMessage.startsWith("✓") ? "text-emerald-700 font-medium" : "text-red-600"}`}>
              {pincodeMessage}
            </p>
          )}
        </div>

        {/* Product Details Accordion */}
        <div className="space-y-3 pt-4 border-t border-stone-200 text-xs">
          <div>
            <h4 className="font-serif font-bold text-wine-900 text-sm mb-1">Description & Artisan Story</h4>
            <p className="text-stone-600 leading-relaxed font-light">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-stone-700">
            <div><strong className="text-wine-900">Fabric:</strong> {product.fabric || "Pure Silk"}</div>
            <div><strong className="text-wine-900">Occasion:</strong> {product.occasion || "Bridal / Festive"}</div>
            <div><strong className="text-wine-900">Pattern:</strong> {product.pattern || "Zari Motif"}</div>
            <div><strong className="text-wine-900">Certification:</strong> 100% Pure Silk Mark</div>
          </div>
        </div>
      </div>
    </div>
  );
}
