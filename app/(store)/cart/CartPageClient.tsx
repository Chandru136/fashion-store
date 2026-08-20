"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Tag, ShieldCheck } from "lucide-react";
import { updateCartQtyAction, removeCartItemAction, applyCouponAction } from "@/app/actions/cart.actions";

export function CartPageClient({ initialCart }: { initialCart: any }) {
  const [cart, setCart] = useState(initialCart);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleUpdateQty = async (id: string, qty: number) => {
    const res = await updateCartQtyAction(id, qty);
    if (res.success) setCart(res.cart);
  };

  const handleRemove = async (id: string) => {
    const res = await removeCartItemAction(id);
    if (res.success) setCart(res.cart);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const res = await applyCouponAction(couponCode, cart?.subtotal || 0);
    if (res.success) {
      setAppliedCoupon(res.coupon);
    } else {
      setCouponError(res.error);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border gold-border p-8 space-y-4 max-w-md mx-auto">
        <ShoppingBag className="w-16 h-16 text-gold-500 mx-auto opacity-40" />
        <h2 className="font-serif text-2xl font-bold text-wine-900">Your bag is empty</h2>
        <p className="text-xs text-stone-500">Discover our authentic Kanchipuram & Banarasi weaves.</p>
        <Link href="/products" className="inline-block px-8 py-3 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider gold-border shadow">
          Explore Catalog
        </Link>
      </div>
    );
  }

  const finalDiscount = appliedCoupon?.discountAmount || 0;
  const finalGrandTotal = Math.max(0, cart.grandTotal - finalDiscount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Cart Items */}
      <div className="lg:col-span-8 space-y-4">
        {cart.items.map((item: any) => (
          <div key={item.id} className="p-4 bg-white rounded-lg border gold-border flex gap-4 items-center shadow-sm">
            <img src={item.image} alt={item.productName} className="w-24 h-28 object-cover rounded bg-stone-100 flex-shrink-0" />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <Link href={`/products/${item.productSlug}`} className="font-serif font-bold text-sm text-wine-900 hover:text-gold-600">
                  {item.productName}
                </Link>
                <p className="text-xs text-stone-500 mt-0.5">
                  {item.color && <span>Color: {item.color}</span>} {item.size && <span className="ml-2">Size: {item.size}</span>}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-bold text-sm text-wine-900">₹{item.price.toLocaleString("en-IN")}</span>
                  {item.mrp > item.price && (
                    <span className="text-xs text-stone-400 line-through">₹{item.mrp.toLocaleString("en-IN")}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
                <div className="flex items-center border border-stone-300 rounded bg-white">
                  <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="p-1.5 hover:bg-stone-100 text-stone-600">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-wine-900">{item.quantity}</span>
                  <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="p-1.5 hover:bg-stone-100 text-stone-600">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button onClick={() => handleRemove(item.id)} className="text-stone-400 hover:text-red-600 p-1 transition-colors text-xs flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Summary & Coupon */}
      <div className="lg:col-span-4 space-y-6">
        {/* Coupon Form */}
        <div className="p-5 bg-white rounded-lg border gold-border space-y-3 shadow-sm">
          <h3 className="font-serif font-bold text-wine-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-gold-600" /> Apply Promo Coupon
          </h3>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. ROYALSILK15"
              className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded uppercase font-semibold focus:outline-none focus:border-gold-500"
            />
            <button type="submit" className="px-4 py-2 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase gold-border">
              Apply
            </button>
          </form>
          {appliedCoupon && (
            <p className="text-xs font-bold text-emerald-700">✓ Coupon {appliedCoupon.code} applied! Saved ₹{appliedCoupon.discountAmount}.</p>
          )}
          {couponError && <p className="text-xs text-red-600">{couponError}</p>}
        </div>

        {/* Order Summary Box */}
        <div className="p-5 bg-ivory-50 rounded-lg border gold-border space-y-4 shadow-md">
          <h3 className="font-serif font-bold text-wine-900 text-sm border-b border-ivory-300 pb-2">Order Price Summary</h3>
          <div className="space-y-2 text-xs text-stone-700">
            <div className="flex justify-between">
              <span>Bag Subtotal</span>
              <span className="font-bold text-wine-900">₹{cart.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {cart.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Product Discount</span>
                <span>-₹{cart.totalDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount ({appliedCoupon.code})</span>
                <span>-₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST Tax (5%)</span>
              <span>₹{cart.tax.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className={cart.shipping === 0 ? "text-emerald-700 font-bold" : ""}>
                {cart.shipping === 0 ? "FREE" : `₹${cart.shipping}`}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-ivory-300 text-sm font-bold text-wine-900">
              <span>Grand Total</span>
              <span className="text-base text-wine-800">₹{finalGrandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full py-3.5 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider flex items-center justify-center gap-2 gold-border shadow-lg hover:brightness-110 transition-all"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
