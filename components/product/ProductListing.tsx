import React from "react";
import { getProducts, getProductFacets, type ProductFilterParams } from "@/lib/services/product.service";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/common/ListControls";
import { CatalogFilters, ActiveCatalogFilters } from "./CatalogFilters";
import { CatalogSort } from "./CatalogSort";
import { selectedValues } from "@/lib/catalog-filters";
import { value, choice, positiveInteger, nonnegativeNumber, productSorts, type ListParams } from "@/lib/listing";
import Link from "next/link";

export async function ProductListing({ params, path }: { params: ListParams; path: string }) {
  const category = value(params, "category");
  const q = value(params, "q");
  const sort = choice(params, "sort", productSorts.filter(o => o.value !== "oldest").map(o => o.value), "featured") as NonNullable<ProductFilterParams["sort"]>;
  const [result, facets] = await Promise.all([getProducts({ categorySlug: category, searchQuery: q,
    minPrice: nonnegativeNumber(value(params, "minPrice")), maxPrice: nonnegativeNumber(value(params, "maxPrice")),
    fabric: selectedValues(params, "fabric"), occasion: selectedValues(params, "occasion"), color: selectedValues(params, "color"),
    sort, page: positiveInteger(value(params, "page")), limit: 12 }), getProductFacets({ categorySlug: category, searchQuery: q })]);
  return <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
    <nav className="text-xs text-stone-500"><Link href="/">Home</Link> / <Link href="/products">Catalog</Link></nav>
    <h1 className="font-serif text-3xl font-bold text-wine-900">{q ? `Search results for "${q}"` : category ? category.replaceAll("-", " ") : "All Fine Indian Sarees & Apparel"}</h1>
    <p className="text-sm text-stone-500">Find your favourite weave by price, colour, fabric and occasion.</p>
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <CatalogFilters path={path} params={{ ...params, sort }} facets={facets} />
      <section aria-label="Product results" className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <p className="text-sm text-stone-600"><strong className="text-wine-900">{result.totalCount}</strong> products{result.products.length > 0 && ` · Showing ${(result.currentPage - 1) * 12 + 1}–${(result.currentPage - 1) * 12 + result.products.length}`}</p>
          <CatalogSort path={path} params={params} sort={sort} />
        </div>
        <ActiveCatalogFilters path={path} params={params} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {result.products.map(product => <ProductCard key={product.id} {...product} variantId={product.variants[0]?.id} />)}
        </div>
        <Pagination path={path} params={params} {...result} label="Products" />
      </section>
    </div>
  </div>;
}
