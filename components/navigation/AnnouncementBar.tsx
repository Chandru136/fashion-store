"use client";

import React, { useState } from "react";
import { Sparkles, Truck, RefreshCw, ShieldCheck, X } from "lucide-react";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="wine-gradient-bg text-ivory-50 text-xs py-2 px-4 border-b gold-border relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center gap-6 text-[11px] font-medium tracking-wider uppercase text-gold-300">
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-gold-400" /> Free Express Express Delivery Above ₹2,000
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" /> Certified 100% Pure Mulberry Silk & Gold Zari
          </span>
          <span className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-gold-400" /> Easy 7-Day Doorstep Returns
          </span>
        </div>

        <div className="flex-1 md:flex-none text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
          <span>FESTIVE GRAND SALE: Extra 15% OFF with code <strong className="text-gold-300 font-bold underline cursor-pointer">ROYALSILK15</strong></span>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-ivory-200 hover:text-gold-300 transition-colors p-1"
          aria-label="Close Announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
