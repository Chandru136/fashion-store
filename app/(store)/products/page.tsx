import React from "react";
import { getProducts } from "@/lib/services/product.service";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { SlidersHorizontal, ChevronRight, X, Filter } from "lucide-react";

export interface ProductPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    fabric?: string;
    occasion?: string;
    color?: string;
    sort?: "featured" | "bestseller" | "newest" | "price_asc" | "price_desc" | "rating";
    page?: string;
  }>;
}

export default async function ProductListingPage({ searchParams }: ProductPageProps) {
  const params = await searchParams;
  const page = Number(params.page || "1");
  const categorySlug = params.category;
  const searchQuery = params.q;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const fabric = params.fabric;
  const occasion = params.occasion;
  const color = params.color;
  const sort = params.sort || "featured";

  const { products, totalCount, totalPages, currentPage } = await getProducts({
    categorySlug,
    searchQuery,
    minPrice,
    maxPrice,
    fabric,
    occasion,
    color,
    sort,
    page,
    limit: 12,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link href="/" className="hover:text-wine-800 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <Link href="/products" className="hover:text-wine-800 transition-colors">Catalog</Link>
        {categorySlug && (
          <>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <span className="font-semibold text-wine-900 capitalize">{categorySlug.replace(/-/g, " ")}</span>
          </>
        )}
      </nav>

      {/* Title & Count Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-ivory-300">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-wine-900 capitalize">
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : categorySlug
              ? categorySlug.replace(/-/g, " ")
              : "All Fine Indian Sarees & Apparel"}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Showing <strong className="text-wine-900">{products.length}</strong> of <strong className="text-wine-900">{totalCount}</strong> authentic handcrafted items
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-700">Sort By:</label>
          <form className="relative">
            <select
              defaultValue={sort}
              name="sort"
              className="px-3 py-2 bg-white border border-ivory-300 rounded text-xs text-wine-900 font-semibold focus:outline-none focus:border-gold-500 shadow-sm"
            >
              <option value="featured">Featured Collection</option>
              <option value="bestseller">Bestseller Priority</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </form>
        </div>
      </div>

      {/* Main Filter & Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="space-y-6 bg-white p-5 rounded-lg border gold-border shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h3 className="font-serif font-bold text-wine-900 text-sm flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-gold-600" /> Filter Selection
            </h3>
            <Link href="/products" className="text-[11px] text-wine-800 hover:underline">
              Reset All
            </Link>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-wine-900 uppercase tracking-wider">Price Range</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/products?minPrice=0&maxPrice=5000" className="p-2 border border-stone-200 rounded text-center hover:border-gold-500 hover:bg-ivory-50">
                Under ₹5,000
              </Link>
              <Link href="/products?minPrice=5000&maxPrice=10000" className="p-2 border border-stone-200 rounded text-center hover:border-gold-500 hover:bg-ivory-50">
                ₹5,000 – ₹10k
              </Link>
              <Link href="/products?minPrice=10000&maxPrice=20000" className="p-2 border border-stone-200 rounded text-center hover:border-gold-500 hover:bg-ivory-50">
                ₹10,000 – ₹20k
              </Link>
              <Link href="/products?minPrice=20000" className="p-2 border border-stone-200 rounded text-center hover:border-gold-500 hover:bg-ivory-50">
                ₹20,000+
              </Link>
            </div>
          </div>

          {/* Fabric */}
          <div className="space-y-2 pt-3 border-t border-stone-200">
            <h4 className="text-xs font-bold text-wine-900 uppercase tracking-wider">Fabric Type</h4>
            <div className="space-y-1 text-xs">
              {["Pure Mulberry Silk", "Soft Silk", "Katan Silk", "Chanderi Silk Cotton", "100% Handloom Cotton", "Micro Velvet"].map((f) => (
                <Link
                  key={f}
                  href={`/products?fabric=${encodeURIComponent(f)}`}
                  className="block py-1 px-2 hover:bg-ivory-100 rounded text-stone-700 hover:text-wine-800 transition-colors"
                >
                  {f}
                </Link>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div className="space-y-2 pt-3 border-t border-stone-200">
            <h4 className="text-xs font-bold text-wine-900 uppercase tracking-wider">Occasion</h4>
            <div className="space-y-1 text-xs">
              {["Wedding", "Bridal", "Festive", "Partywear", "Daily Classic"].map((o) => (
                <Link
                  key={o}
                  href={`/products?occasion=${encodeURIComponent(o)}`}
                  className="block py-1 px-2 hover:bg-ivory-100 rounded text-stone-700 hover:text-wine-800 transition-colors"
                >
                  {o}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="lg:col-span-3 space-y-8">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border gold-border p-8 space-y-4">
              <Filter className="w-12 h-12 text-gold-500 mx-auto opacity-50" />
              <h3 className="font-serif text-xl font-semibold text-wine-900">No matching items found</h3>
              <p className="text-xs text-stone-500">Try adjusting your filters or price range to explore more products.</p>
              <Link href="/products" className="inline-block px-6 py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider shadow">
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} {...prod} variantId={prod.variants[0]?.id} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-ivory-300">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/products?page=${p}${categorySlug ? `&category=${categorySlug}` : ""}`}
                  className={`w-9 h-9 rounded font-bold text-xs flex items-center justify-center transition-all ${
                    p === currentPage
                      ? "wine-gradient-bg text-gold-300 gold-border shadow"
                      : "bg-white border border-stone-200 text-stone-700 hover:border-gold-500"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
