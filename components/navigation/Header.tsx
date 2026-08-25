"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, User, LogOut, ChevronDown, X } from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import { AnnouncementBar } from "./AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { logoutUser } from "@/app/actions/auth.actions";

interface HeaderProps {
  cartItemCount?: number;
  wishlistCount?: number;
  user?: { id: string; name: string; email: string; role: string } | null;
}

export function Header({ cartItemCount = 0, wishlistCount = 0, user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [cartData, setCartData] = useState<any>({ items: [], subtotal: 0, shipping: 0, tax: 0, grandTotal: 0 });
  const router = useRouter();

  useEffect(() => {
    // Fetch live cart state from server route / action
    async function loadCart() {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          if (data.cart) setCartData(data.cart);
        }
      } catch (e) {}
    }
    loadCart();
  }, [isCartOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.refresh();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ivory-300 shadow-sm">
      <AnnouncementBar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 wine-gradient-bg rounded-full flex items-center justify-center border gold-border shadow-md group-hover:scale-105 transition-transform">
            <span className="font-brand-title text-gold-300 font-bold text-lg sm:text-xl tracking-tighter">SC</span>
          </div>
          <div>
            <span className="font-brand-title text-xl sm:text-2xl font-bold tracking-tight text-wine-900 block leading-none">
              SUDHA
            </span>
            <span className="text-[9px] font-semibold tracking-[0.25em] text-gold-600 uppercase block mt-0.5">
              COLLECTIONS
            </span>
          </div>
        </Link>

        {/* Search Bar with Autocomplete */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for Kanchipuram Silks, Banarasi, Lehengas, Sherwanis..."
              className="w-full pl-10 pr-24 py-2.5 bg-ivory-100 border border-ivory-300 rounded-full text-xs text-wine-900 placeholder-stone-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 wine-gradient-bg text-gold-300 font-semibold text-xs rounded-full gold-border hover:brightness-110 transition-all shadow"
            >
              Search
            </button>
          </div>
        </form>

        {/* User Account / Wishlist / Cart Controls */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsMobileSearchOpen((open) => !open)}
            className="md:hidden grid h-9 w-9 place-items-center rounded-full text-wine-800 transition hover:bg-ivory-100"
            aria-label={isMobileSearchOpen ? "Close search" : "Search products"}
          >
            {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          {/* User Account Menu */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-wine-900 hover:text-gold-600 transition-colors p-1"
              >
                <div className="w-7 h-7 bg-ivory-200 border gold-border rounded-full flex items-center justify-center text-wine-800 font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 text-xs font-semibold text-wine-900 hover:text-gold-600 transition-colors">
                <User className="w-5 h-5 text-wine-800" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Dropdown Menu */}
            {isUserMenuOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border gold-border rounded-md shadow-xl py-2 z-50 text-xs animate-fade-in">
                <div className="px-3 py-2 border-b border-stone-100">
                  <p className="font-semibold text-wine-900">{user.name}</p>
                  <p className="text-[10px] text-stone-500">{user.email}</p>
                </div>
                <Link href="/profile" className="block px-3 py-2 text-stone-700 hover:bg-ivory-100 hover:text-wine-800">
                  My Profile
                </Link>
                <Link href="/orders" className="block px-3 py-2 text-stone-700 hover:bg-ivory-100 hover:text-wine-800">
                  Order History
                </Link>
                <Link href="/addresses" className="block px-3 py-2 text-stone-700 hover:bg-ivory-100 hover:text-wine-800">
                  Saved Addresses
                </Link>
                {user.role !== "CUSTOMER" && (
                  <Link href="/admin" className="block px-3 py-2 font-bold text-wine-800 bg-blush-100 hover:bg-blush-200">
                    👑 Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-1.5 border-t border-stone-100 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link href="/wishlist" className="relative p-1 text-wine-900 hover:text-gold-600 transition-colors" title="Wishlist">
            <Heart className="w-5 h-5 text-wine-800" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-wine-900 font-bold text-[9px] rounded-full flex items-center justify-center shadow">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 wine-gradient-bg text-gold-300 px-3.5 py-2 rounded-full gold-border shadow hover:brightness-110 transition-all text-xs font-semibold"
          >
            <ShoppingBag className="w-4 h-4 text-gold-400" />
            <span className="hidden sm:inline">Bag</span>
            <span className="w-5 h-5 bg-gold-400 text-wine-900 font-bold text-[10px] rounded-full flex items-center justify-center shadow">
              {cartData.items?.length || cartItemCount}
            </span>
          </button>
        </div>
      </div>

      {isMobileSearchOpen && (
        <form onSubmit={handleSearchSubmit} className="md:hidden border-t border-ivory-300 bg-white px-3 py-3">
          <div className="relative mx-auto max-w-7xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search silks, sarees, lehengas..."
              className="w-full rounded-full border border-ivory-300 bg-ivory-100 py-3 pl-10 pr-24 text-sm text-wine-900 placeholder-stone-400 outline-none focus:border-gold-500"
            />
            <button type="submit" className="absolute right-1 top-1 bottom-1 rounded-full wine-gradient-bg px-4 text-xs font-bold text-gold-300">Search</button>
          </div>
        </form>
      )}

      {/* Mega Navigation Bar */}
      <MegaMenu />

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartData.items || []}
        subtotal={cartData.subtotal || 0}
        shipping={cartData.shipping || 0}
        tax={cartData.tax || 0}
        grandTotal={cartData.grandTotal || 0}
        onUpdateQuantity={async (id, qty) => {
          // Re-fetch cart
          await fetch("/api/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cartItemId: id, quantity: qty }),
          });
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            setCartData(data.cart);
          }
        }}
        onRemoveItem={async (id) => {
          await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            setCartData(data.cart);
          }
        }}
      />
    </header>
  );
}
