"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Award, Truck, RefreshCw, Mail, Phone, MapPin, Instagram, Facebook, Youtube } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="wine-gradient-bg text-ivory-100 border-t-2 border-gold-500 pt-14 pb-8">
      {/* Trust Badges Bar */}
      <div className="max-w-7xl mx-auto px-4 pb-12 border-b border-wine-700/60 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-xs">
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-wine-900/40 border gold-border">
          <Award className="w-6 h-6 text-gold-400" />
          <h4 className="font-serif font-bold text-gold-300">100% Certified Silk</h4>
          <p className="text-[11px] text-ivory-300 font-light">Silk Mark certified pure mulberry weaves.</p>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-wine-900/40 border gold-border">
          <Truck className="w-6 h-6 text-gold-400" />
          <h4 className="font-serif font-bold text-gold-300">Express Worldwide Shipping</h4>
          <p className="text-[11px] text-ivory-300 font-light">Free delivery across India above ₹2,000.</p>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-wine-900/40 border gold-border">
          <RefreshCw className="w-6 h-6 text-gold-400" />
          <h4 className="font-serif font-bold text-gold-300">Easy 7-Day Returns</h4>
          <p className="text-[11px] text-ivory-300 font-light">Hassle-free doorstep pickup & exchange.</p>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-wine-900/40 border gold-border">
          <ShieldCheck className="w-6 h-6 text-gold-400" />
          <h4 className="font-serif font-bold text-gold-300">100% Secure Checkout</h4>
          <p className="text-[11px] text-ivory-300 font-light">256-Bit SSL encryption & verified payments.</p>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center text-wine-900 font-bold text-lg font-brand-title">
              SC
            </div>
            <div>
              <span className="font-brand-title text-xl font-bold text-gold-300 tracking-tight block leading-none">
                SUDHA COLLECTIONS
              </span>
              <span className="text-[9px] font-semibold text-gold-400 tracking-[0.2em] uppercase">
                FINE SILKS & COUTURE
              </span>
            </div>
          </div>
          <p className="text-ivory-300 font-light leading-relaxed max-w-sm">
            Sudha Collections celebrates India’s timeless textile legacy. From authentic Kanchipuram bridal silks to regal Banarasi brocades and handcrafted groom Sherwanis, every creation is a masterwork of gold zari and royal craftsmanship.
          </p>

          <div className="pt-2 flex items-center gap-3 text-gold-400">
            <a href="#" className="w-8 h-8 rounded-full bg-wine-900 flex items-center justify-center hover:bg-gold-500 hover:text-wine-900 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-wine-900 flex items-center justify-center hover:bg-gold-500 hover:text-wine-900 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-wine-900 flex items-center justify-center hover:bg-gold-500 hover:text-wine-900 transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif font-bold text-gold-300 text-sm mb-4 uppercase tracking-wider">Store Categories</h4>
          <ul className="space-y-2.5 text-ivory-300">
            <li><Link href="/category/kanchipuram-bridal-silk" className="hover:text-gold-400 transition-colors">Kanchipuram Silk Sarees</Link></li>
            <li><Link href="/category/banarasi-brocade-silk" className="hover:text-gold-400 transition-colors">Banarasi Brocade Silks</Link></li>
            <li><Link href="/category/soft-silk-heritage" className="hover:text-gold-400 transition-colors">Soft Silk Heritage</Link></li>
            <li><Link href="/category/bridal-lehengas" className="hover:text-gold-400 transition-colors">Bridal Lehengas</Link></li>
            <li><Link href="/category/mens-ethnic-wear" className="hover:text-gold-400 transition-colors">Mens Groom Sherwanis</Link></li>
            <li><Link href="/category/cotton-handloom" className="hover:text-gold-400 transition-colors">Chettinad Cotton Handlooms</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="font-serif font-bold text-gold-300 text-sm mb-4 uppercase tracking-wider">Customer Care</h4>
          <ul className="space-y-2.5 text-ivory-300">
            <li><Link href="/orders" className="hover:text-gold-400 transition-colors">Track Order Status</Link></li>
            <li><Link href="/profile" className="hover:text-gold-400 transition-colors">My Account</Link></li>
            <li><Link href="/wishlist" className="hover:text-gold-400 transition-colors">My Wishlist</Link></li>
            <li><span className="hover:text-gold-400 cursor-pointer">Shipping & Delivery Policy</span></li>
            <li><span className="hover:text-gold-400 cursor-pointer">Return & Exchange Policy</span></li>
            <li><span className="hover:text-gold-400 cursor-pointer">Silk Care Instructions</span></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h4 className="font-serif font-bold text-gold-300 text-sm mb-4 uppercase tracking-wider">Heritage Club</h4>
          <p className="text-ivory-300 font-light mb-3">Subscribe for exclusive preview access to new loom launches and festive discounts.</p>
          {subscribed ? (
            <div className="bg-wine-900/80 p-3 rounded text-gold-300 font-semibold border gold-border text-center">
              ✓ Thank you for subscribing!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 bg-wine-900/60 border gold-border rounded text-ivory-50 placeholder-stone-400 text-xs focus:outline-none focus:border-gold-400"
              />
              <button
                type="submit"
                className="w-full py-2 bg-gold-500 text-wine-900 font-bold uppercase tracking-wider rounded hover:bg-gold-400 transition-colors shadow"
              >
                Join Privilege Club
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-wine-800 text-center text-[11px] text-ivory-300 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© 2026 Sudha Collections. All Rights Reserved.</p>
        <div className="flex items-center gap-4 text-gold-400">
          <span>Terms of Service</span>
          <span>•</span>
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Authenticity Guarantee</span>
        </div>
      </div>
    </footer>
  );
}
