"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image: string;
  buttonText?: string | null;
}

export function FeaturedCollections({ collections = [] }: { collections: Collection[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="py-16 bg-ivory-100 border-b border-ivory-300">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title Header */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase">
            Curated Curations
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-wine-900">
            Editorial Collections
          </h2>
          <div className="w-16 h-0.5 gold-gradient-bg mx-auto rounded-full mt-3" />
        </div>

        {/* Collection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((item) => (
            <Link
              key={item.id}
              href={`/products?collection=${item.slug}`}
              className="group relative h-[420px] rounded-lg overflow-hidden shadow-lg border gold-border group-hover:border-gold-500 transition-all block"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-wine-900/40 to-transparent p-6 flex flex-col justify-end text-ivory-50">
                <h3 className="font-serif text-2xl font-bold gold-gradient-text leading-snug">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-xs text-ivory-200 mt-1 line-clamp-2 font-light">
                    {item.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gold-300 group-hover:text-white transition-colors uppercase tracking-wider">
                  <span>{item.buttonText || "Explore Collection"}</span>
                  <ArrowUpRight className="w-4 h-4 text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
