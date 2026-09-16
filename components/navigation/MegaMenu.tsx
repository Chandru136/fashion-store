"use client";

import React, { useState } from "react";
import Link from "next/link";
import { menuItems } from "./navigation-data";
import { ChevronDown, Sparkles, Tag, Award } from "lucide-react";

export function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);



  return (
    <nav className="relative hidden xl:block bg-wine-900 border-t border-b gold-border text-ivory-50 text-xs shadow-md">
      <div className="max-w-7xl mx-auto px-4 hidden md:flex items-center justify-between">
        <ul className="flex items-center space-x-1 lg:space-x-4">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className="py-3 group"
              onMouseEnter={() => setActiveMenu(item.id)}
              onMouseLeave={() => setActiveMenu(null)}
              onFocus={() => setActiveMenu(item.id)}
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveMenu(null); }}
              onKeyDown={(event) => { if (event.key === "Escape") setActiveMenu(null); }}
            >
              <Link
                href={item.categories[0]?.href || "/products"}
                className="px-2.5 py-1 font-semibold tracking-wider text-ivory-100 group-hover:text-gold-300 transition-colors flex items-center gap-1 uppercase"
              >
                {item.label}
                {item.featuredBadge && (
                  <span className="text-[9px] bg-gold-500 text-wine-900 font-bold px-1.5 py-0.5 rounded-full uppercase">
                    {item.featuredBadge}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform text-gold-400" />
              </Link>

              {/* Mega Dropdown Panel */}
              {activeMenu === item.id && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[min(1100px,96vw)] bg-ivory-50 text-stone-800 shadow-2xl rounded-b-lg border border-gold-400/40 p-6 grid grid-cols-4 gap-6 z-50 animate-fade-in">
                  {/* Column 1: Subcategories */}
                  <div>
                    <h4 className="font-serif font-bold text-wine-900 text-sm pb-2 border-b border-gold-300/40 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-gold-500" /> Categories
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {item.categories.map((cat) => (
                        <li key={cat.name}>
                          <Link
                            href={cat.href}
                            className="text-stone-700 hover:text-wine-800 hover:font-semibold transition-all block text-[12px]"
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Price Ranges */}
                  <div>
                    <h4 className="font-serif font-bold text-wine-900 text-sm pb-2 border-b border-gold-300/40 uppercase tracking-wide flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-gold-500" /> Shop By Price
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {item.priceRanges.map((price) => (
                        <li key={price.label}>
                          <Link
                            href={price.href}
                            className="text-stone-600 hover:text-gold-600 font-medium transition-colors text-[12px]"
                          >
                            {price.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Featured Brands */}
                  <div>
                    <h4 className="font-serif font-bold text-wine-900 text-sm pb-2 border-b border-gold-300/40 uppercase tracking-wide flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-gold-500" /> Master Brands
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {item.brands.map((b) => (
                        <li key={b.name}>
                          <Link
                            href={b.href}
                            className="text-stone-700 hover:text-wine-800 hover:underline transition-all text-[12px]"
                          >
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: Promotional Image Card */}
                  {item.banner && (
                    <div className="relative rounded-lg overflow-hidden group/card shadow-md">
                      <img
                        src={item.banner.image}
                        alt={item.banner.title}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-wine-900/30 to-transparent p-4 flex flex-col justify-end text-ivory-50">
                        <p className="font-serif text-xs font-semibold text-gold-300">{item.banner.title}</p>
                        <Link
                          href={item.banner.href}
                          className="mt-2 text-[10px] uppercase tracking-wider font-bold gold-gradient-bg text-wine-900 px-3 py-1 rounded inline-block text-center shadow"
                        >
                          Explore Collection
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}

          <li>
            <Link href="/products?newArrival=true" className="px-3 py-1 font-bold text-gold-300 hover:text-gold-200 transition-colors uppercase tracking-wider">
              NEW ARRIVALS ✦
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
