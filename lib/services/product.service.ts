import { facetOptions } from "@/lib/catalog-filters";
import type { Prisma } from "@prisma/client";
import { pagination, positiveInteger, nonnegativeNumber } from "@/lib/listing";
import { prisma } from "@/lib/db";
import { publicReviewWhere } from "@/lib/reviews";

export interface ProductFilterParams {
  categorySlug?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string | string[];
  occasion?: string | string[];
  color?: string | string[];
  discountMin?: number;
  ratingMin?: number;
  sort?: "featured" | "bestseller" | "newest" | "price_asc" | "price_desc" | "oldest";
  page?: number;
  limit?: number;
}

export async function getProducts(params: ProductFilterParams = {}) {
  const limit = positiveInteger(params.limit, 12, 100);
  params = { ...params, minPrice: nonnegativeNumber(params.minPrice), maxPrice: nonnegativeNumber(params.maxPrice) };

  const whereClause = await productContextWhere(params);

  // Price range
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    whereClause.sellingPrice = {};
    if (params.minPrice !== undefined) whereClause.sellingPrice.gte = params.minPrice;
    if (params.maxPrice !== undefined) whereClause.sellingPrice.lte = params.maxPrice;
  }

  // Fabric & Occasion
  if (params.fabric && params.fabric.length) {
    whereClause.fabric = Array.isArray(params.fabric) ? { in: params.fabric, mode: "insensitive" } : { contains: params.fabric, mode: "insensitive" };
  }
  if (params.occasion && params.occasion.length) {
    whereClause.occasion = Array.isArray(params.occasion) ? { in: params.occasion, mode: "insensitive" } : { contains: params.occasion, mode: "insensitive" };
  }

  // Color filter (via variants)
  if (params.color && params.color.length) {
    whereClause.variants = {
      some: {
        color: Array.isArray(params.color) ? { in: params.color, mode: "insensitive" } : { contains: params.color, mode: "insensitive" },
      },
    };
  }

  // Sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "bestseller") orderBy = { bestseller: "desc" };
  else if (params.sort === "featured") orderBy = { featured: "desc" };
  else if (params.sort === "price_asc") orderBy = { sellingPrice: "asc" };
  else if (params.sort === "price_desc") orderBy = { sellingPrice: "desc" };
  else if (params.sort === "newest") orderBy = { createdAt: "desc" };

  if (params.sort === "oldest") orderBy = { createdAt: "asc" };
  const totalCount = await prisma.product.count({ where: whereClause });
  const paging = pagination(totalCount, params.page, limit);
  const products = await
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: { include: { inventory: true } },
        reviews: { where: publicReviewWhere, select: { rating: true } },
      },
      orderBy: [orderBy, { id: "asc" }],
      skip: paging.skip,
      take: paging.take,
    });

  // Compute ratings & discount percentage
  const formattedProducts = products.map((p) => {
    const totalRating = p.reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = p.reviews.length > 0 ? (totalRating / p.reviews.length).toFixed(1) : "0";
    const discountPercent = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;

    return {
      ...p,
      avgRating: Number(avgRating),
      reviewCount: p.reviews.length,
      discountPercent,
      primaryImage: p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || "/images/placeholder.jpg",
      hoverImage: p.images[1]?.url || p.images[0]?.url || "/images/placeholder.jpg",
    };
  });

  return {
    products: formattedProducts,
    totalCount,
    totalPages: paging.totalPages,
    currentPage: paging.currentPage,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
      reviews: {
        where: publicReviewWhere,
        select: { rating: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) return null;

  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = product.reviews.length > 0 ? (totalRating / product.reviews.length).toFixed(1) : "0";
  const discountPercent = product.mrp > product.sellingPrice ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;

  // Fetch related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: "ACTIVE",
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: publicReviewWhere, select: { rating: true } },
    },
    take: 4,
  });

  return {
    ...product,
    avgRating: Number(avgRating),
    reviewCount: product.reviews.length,
    discountPercent,
    relatedProducts: relatedProducts.map((p) => ({
      ...p,
      reviewCount: p.reviews.length,
      avgRating: p.reviews.length ? Number((p.reviews.reduce((sum, review) => sum + review.rating, 0) / p.reviews.length).toFixed(1)) : 0,
      primaryImage: p.images[0]?.url || "/images/placeholder.jpg",
      discountPercent: p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0,
    })),
  };
}

async function productContextWhere(params: Pick<ProductFilterParams, "categorySlug" | "searchQuery">) {
  const whereClause: Prisma.ProductWhereInput = {
    status: "ACTIVE",
  };

  // Filter by Category or Subcategory slug
  if (params.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: params.categorySlug },
      include: { children: { select: { id: true } } },
    });

    if (category) {
      const categoryIds = [category.id, ...category.children.map((c) => c.id)];
      whereClause.categoryId = { in: categoryIds };
    } else {
      whereClause.id = { in: [] };
    }
  }

  // Search query (Name, SKU, Fabric, Occasion)
  if (params.searchQuery) {
    whereClause.OR = [
      { name: { contains: params.searchQuery, mode: "insensitive" } },
      { sku: { contains: params.searchQuery, mode: "insensitive" } },
      { description: { contains: params.searchQuery, mode: "insensitive" } },
      { fabric: { contains: params.searchQuery, mode: "insensitive" } },
      { occasion: { contains: params.searchQuery, mode: "insensitive" } },
    ];
  }

  return whereClause;
}

// Options come from the full active category/search context, not just the current page.
export async function getProductFacets(params: Pick<ProductFilterParams, "categorySlug" | "searchQuery"> = {}) {
  const where = await productContextWhere(params);
  const [fabrics, occasions, colors] = await Promise.all([
    prisma.product.findMany({ where, select: { fabric: true }, distinct: ["fabric"] }),
    prisma.product.findMany({ where, select: { occasion: true }, distinct: ["occasion"] }),
    prisma.productVariant.findMany({ where: { product: where }, select: { color: true }, distinct: ["color"] }),
  ]);
  return { fabric: facetOptions(fabrics.map(row => row.fabric)), occasion: facetOptions(occasions.map(row => row.occasion)), color: facetOptions(colors.map(row => row.color)) };
}
