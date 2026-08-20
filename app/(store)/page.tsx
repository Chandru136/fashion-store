import React from "react";
import { getHomepageData } from "@/lib/services/homepage.service";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { BrowseCategories } from "@/components/home/BrowseCategories";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { Sparkles, ArrowRight, Star, Instagram, ShieldCheck } from "lucide-react";

export const revalidate = 60; // ISR Revalidation every 60 seconds

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <div className="space-y-12">
      {/* 1. Hero Carousel */}
      <HeroCarousel banners={data.banners} />

      {/* 2. Browse Categories */}
      <BrowseCategories categories={data.categories} />

      {/* 3. Featured Editorial Collections */}
      <FeaturedCollections collections={data.collections} />

      {/* 4. Bestsellers Section */}
      <section className="py-12 bg-white border-y border-ivory-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-ivory-200">
            <div>
              <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase">
                Customer Favorites
              </span>
              <h2 className="font-serif text-3xl font-bold text-wine-900 mt-1">
                Bestseller Royal Silks
              </h2>
            </div>
            <Link
              href="/products?sort=bestseller"
              className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-wine-800 hover:text-gold-600 uppercase tracking-wider transition-colors"
            >
              View All Bestsellers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.bestsellers.map((prod) => (
              <ProductCard key={prod.id} {...prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Full-Width Promotional Banner Card */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative rounded-2xl overflow-hidden wine-gradient-bg border-2 gold-border shadow-2xl p-8 md:p-14 text-ivory-50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-gold-300 bg-wine-800/80 gold-border">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Royal Bridal Trunk 2026
            </span>
            <h3 className="font-serif text-3xl md:text-5xl font-bold gold-gradient-text leading-tight">
              The Grand Kanchipuram Heritage Edition
            </h3>
            <p className="text-sm text-ivory-200 font-light leading-relaxed">
              Elevate your bridal wardrobe with certified pure mulberry silk woven with authentic gold & silver zari. Receive a complimentary silk care trunk with every bridal order.
            </p>
            <div className="pt-2">
              <Link
                href="/category/kanchipuram-bridal-silk"
                className="inline-flex items-center gap-2 px-8 py-3.5 gold-gradient-bg text-wine-900 font-bold text-xs rounded uppercase tracking-widest shadow-xl hover:brightness-110 transition-all"
              >
                Shop Bridal Trunk <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="w-full md:w-80 h-72 rounded-lg overflow-hidden border gold-border shadow-2xl relative">
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
              alt="Bridal Silk"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 6. New Arrivals Section */}
      <section className="py-12 bg-ivory-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-ivory-300">
            <div>
              <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase">
                Fresh From The Loom
              </span>
              <h2 className="font-serif text-3xl font-bold text-wine-900 mt-1">
                New Arrival Weaves
              </h2>
            </div>
            <Link
              href="/products?newArrival=true"
              className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-wine-800 hover:text-gold-600 uppercase tracking-wider transition-colors"
            >
              Explore New Arrivals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.newArrivals.map((prod) => (
              <ProductCard key={prod.id} {...prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Customer Reviews & Testimonials */}
      <section className="py-14 bg-white border-y border-ivory-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">
              Real Patron Stories
            </span>
            <h2 className="font-serif text-3xl font-bold text-wine-900">
              Loved By Connoisseurs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Dr. Samyuktha Reddy",
                city: "Bengaluru",
                rating: 5,
                comment: "The Kanchipuram silk saree I ordered for my daughter's wedding exceeded all expectations. The weight of the silk, rich zari luster, and royal packaging was absolute perfection!",
                date: "Verified Buyer • Feb 2026",
              },
              {
                name: "Kavya Subramanian",
                city: "Chennai",
                rating: 5,
                comment: "Authentic Silk Mark certified weaves. The soft silk saree is lightweight yet looks so opulent. Delivery was made in 48 hours to my doorstep!",
                date: "Verified Buyer • Jan 2026",
              },
              {
                name: "Meera Deshmukh",
                city: "Mumbai",
                rating: 5,
                comment: "Aarna Heritage has become my go-to for luxury Indian ethnic wear. Customer service guided me through video call to select my Banarasi brocade.",
                date: "Verified Buyer • Feb 2026",
              },
            ].map((rev, i) => (
              <div key={i} className="p-6 bg-ivory-50 rounded-xl border gold-border space-y-3 shadow-md hover:border-gold-500 transition-colors">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(rev.rating)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
                <div className="pt-2 border-t border-ivory-300 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-serif font-bold text-wine-900">{rev.name}</p>
                    <p className="text-[10px] text-stone-500">{rev.city}</p>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Instagram / Social Gallery Section */}
      <section className="py-12 bg-ivory-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gold-600 tracking-widest uppercase">
              <Instagram className="w-4 h-4 text-wine-800" /> @AarnaHeritageSilks
            </div>
            <h2 className="font-serif text-2xl font-bold text-wine-900">
              Follow Us On Instagram
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
              "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400",
              "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400",
              "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=400",
              "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=400",
              "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400",
            ].map((imgUrl, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group shadow-md">
                <img src={imgUrl} alt="Instagram post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-wine-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gold-300">
                  <Instagram className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
