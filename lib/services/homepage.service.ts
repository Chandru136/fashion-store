import { prisma } from "@/lib/db";

export async function getHomepageData() {
  const [banners, collections, categories, bestsellers, newArrivals, featuredProducts] = await Promise.all([
    // Active Banners ordered by displayOrder
    prisma.banner.findMany({
      where: { status: "ACTIVE" },
      orderBy: { displayOrder: "asc" },
    }),
    // Editorial Collections
    prisma.collection.findMany({
      where: { status: "ACTIVE" },
      orderBy: { displayOrder: "asc" },
      take: 6,
    }),
    // Top Categories
    prisma.category.findMany({
      where: { status: "ACTIVE", parentId: null },
      orderBy: { displayOrder: "asc" },
      take: 8,
    }),
    // Bestsellers
    prisma.product.findMany({
      where: { status: "ACTIVE", bestseller: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { stock: { gt: 0 } }, orderBy: { price: "asc" }, take: 1 },
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
      take: 8,
    }),
    // New Arrivals
    prisma.product.findMany({
      where: { status: "ACTIVE", newArrival: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { stock: { gt: 0 } }, orderBy: { price: "asc" }, take: 1 },
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // Featured Products
    prisma.product.findMany({
      where: { status: "ACTIVE", featured: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { stock: { gt: 0 } }, orderBy: { price: "asc" }, take: 1 },
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
      take: 8,
    }),
  ]);

  const formatProducts = (products: any[]) =>
    products.map((p) => {
      const totalRating = p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
      const avgRating = p.reviews.length > 0 ? (totalRating / p.reviews.length).toFixed(1) : "5.0";
      const discountPercent = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
        discountPercent,
        categoryName: p.category.name,
        primaryImage: p.images[0]?.url || "/images/placeholder.jpg",
        hoverImage: p.images[1]?.url || p.images[0]?.url || "/images/placeholder.jpg",
        avgRating: Number(avgRating),
        reviewCount: p.reviews.length,
        bestseller: p.bestseller,
        newArrival: p.newArrival,
        variantId: p.variants[0]?.id,
        colors: [...new Set(p.variants.map((variant: { color: string | null }) => variant.color).filter((color): color is string => Boolean(color)))],
      };
    });

  return {
    banners,
    collections,
    categories,
    bestsellers: formatProducts(bestsellers),
    newArrivals: formatProducts(newArrivals),
    featuredProducts: formatProducts(featuredProducts),
  };
}
