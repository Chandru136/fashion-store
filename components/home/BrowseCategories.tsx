"use client";

import React from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
}

export function BrowseCategories({ categories = [] }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-white border-b border-ivory-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-7 sm:mb-10 space-y-2">
          <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">
            Master Weaves
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-wine-900">
            Shop By Category
          </h2>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex w-[92px] shrink-0 snap-start flex-col items-center gap-2 text-center sm:w-auto"
            >
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 border-2 border-gold-400/40 group-hover:border-gold-500 transition-all shadow-md group-hover:shadow-xl bg-ivory-50 overflow-hidden">
                <img
                  src={cat.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300"}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <span className="font-serif text-xs font-semibold text-wine-900 group-hover:text-gold-600 transition-colors line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
