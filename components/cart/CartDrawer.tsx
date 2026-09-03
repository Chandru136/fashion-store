"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string;
  color?: string;
  size?: string;
  price: number;
  mrp: number;
  quantity: number;
  itemTotal: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  onUpdateQuantity: (cartItemId: string, qty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onApplyCoupon?: (code: string) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items = [],
  subtotal = 0,
  shipping = 0,
  tax = 0,
  grandTotal = 0,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState("");
  const [mounted, setMounted] = useState(false);
  const freeShippingThreshold = 2000;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping bag">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/25 transition-opacity" onClick={onClose} aria-hidden="true" />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
        <div className="flex h-dvh w-screen max-w-lg flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="wine-gradient-bg text-ivory-50 p-4 flex items-center justify-between gold-border border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold-400" />
              <h2 className="font-serif text-lg font-semibold text-gold-300">Your Shopping Bag ({itemCount})</h2>
            </div>
            <button onClick={onClose} className="p-1 text-ivory-200 hover:text-gold-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="bg-ivory-100 p-3 border-b gold-border text-xs">
            {subtotal >= freeShippingThreshold ? (
              <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> You qualify for FREE Express Delivery!
              </p>
            ) : (
              <div>
                <p className="text-wine-900 font-medium mb-1">
                  Add <span className="font-bold text-wine-800">₹{(freeShippingThreshold - subtotal).toLocaleString("en-IN")}</span> more for FREE Shipping!
                </p>
                <div className="w-full bg-ivory-300 h-1.5 rounded-full overflow-hidden">
                  <div className="gold-gradient-bg h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 text-muted-text space-y-4">
                <ShoppingBag className="w-16 h-16 mx-auto text-gold-500/40 stroke-1" />
                <h3 className="font-serif text-lg font-medium text-wine-900">Your bag is empty</h3>
                <p className="text-xs text-stone-500">Explore our pure silk collections and add your favorites.</p>
                <button onClick={onClose} className="mt-4 inline-block px-6 py-2.5 wine-gradient-bg text-gold-300 text-xs font-semibold rounded uppercase tracking-wider gold-border">
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-ivory-50 border border-ivory-300 rounded-lg relative hover:border-gold-500/50 transition-colors">
                  <div className="h-32 w-24 relative rounded overflow-hidden flex-shrink-0 bg-stone-100 sm:h-36 sm:w-28">
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.productSlug}`} onClick={onClose} className="text-sm font-semibold text-wine-900 line-clamp-2 hover:text-gold-600">{item.productName}</Link>
                      <p className="text-xs text-stone-500 mt-1">
                        {item.color && <span>Color: {item.color}</span>} {item.size && <span className="ml-2">Size: {item.size}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-wine-800">₹{item.price.toLocaleString("en-IN")}</span>
                        {item.mrp > item.price && (
                          <span className="text-[10px] text-stone-400 line-through">₹{item.mrp.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      <div className="flex items-center border border-stone-300 rounded bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-stone-100 text-stone-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-wine-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-stone-100 text-stone-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-4 bg-white border-t border-stone-200 space-y-3 shadow-lg">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-800">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (5% GST)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className={shipping === 0 ? "text-emerald-700 font-semibold" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-wine-900">
                  <span>Grand Total</span>
                  <span className="text-base text-wine-800">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full py-3 wine-gradient-bg text-gold-300 font-semibold text-xs rounded uppercase tracking-wider flex items-center justify-center gap-2 gold-border shadow-md hover:brightness-110 transition-all"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
