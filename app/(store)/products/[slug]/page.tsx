import React from "react";
import { getProductBySlug } from "@/lib/services/product.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Truck, RefreshCw, Star, Heart, Share2, Check, MapPin } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailClient } from "./ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const product = await getProductBySlug(p.slug);
  if (!product) return { title: "Product Not Found | Sudha Collections" };

  return {
    title: `${product.name} | Sudha Collections`,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [product.images[0]?.url || ""],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const product = await getProductBySlug(p.slug);

  if (!product) notFound();

  // Generate Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img) => img.url),
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "Sudha Collections",
    },
    offers: {
      "@type": "Offer",
      url: `https://sudhacollections.com/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.sellingPrice,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link href="/" className="hover:text-wine-800">Home</Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <Link href="/products" className="hover:text-wine-800">Products</Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <Link href={`/category/${product.category.slug}`} className="hover:text-wine-800">{product.category.name}</Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span className="font-semibold text-wine-900 line-clamp-1">{product.name}</span>
      </nav>

      {/* Client Gallery & Variant Interaction */}
      <ProductDetailClient product={product} />

      {/* Related Products Section */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-ivory-300 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">You May Also Admire</span>
            <h2 className="font-serif text-2xl font-bold text-wine-900">Similar Masterpiece Weaves</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {product.relatedProducts.map((rel: any) => (
              <ProductCard key={rel.id} {...rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
