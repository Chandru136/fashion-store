import { prisma } from "@/lib/db";

export interface ProductFilterParams {
  categorySlug?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string;
  occasion?: string;
  color?: string;
  discountMin?: number;
  ratingMin?: number;
  sort?: "featured" | "bestseller" | "newest" | "price_asc" | "price_desc" | "rating";
  page?: number;
  limit?: number;
}

export async function getProducts(params: ProductFilterParams = {}) {
  const page = params.page || 1;
  const limit = params.limit || 12;
  const skip = (page - 1) * limit;

  const whereClause: any = {
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

  // Price range
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    whereClause.sellingPrice = {};
    if (params.minPrice !== undefined) whereClause.sellingPrice.gte = params.minPrice;
    if (params.maxPrice !== undefined) whereClause.sellingPrice.lte = params.maxPrice;
  }

  // Fabric & Occasion
  if (params.fabric) {
    whereClause.fabric = { contains: params.fabric, mode: "insensitive" };
  }
  if (params.occasion) {
    whereClause.occasion = { contains: params.occasion, mode: "insensitive" };
  }

  // Color filter (via variants)
  if (params.color) {
    whereClause.variants = {
      some: {
        color: { contains: params.color, mode: "insensitive" },
      },
    };
  }

  // Sorting
  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "bestseller") orderBy = { bestseller: "desc" };
  else if (params.sort === "featured") orderBy = { featured: "desc" };
  else if (params.sort === "price_asc") orderBy = { sellingPrice: "asc" };
  else if (params.sort === "price_desc") orderBy = { sellingPrice: "desc" };
  else if (params.sort === "newest") orderBy = { createdAt: "desc" };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: { include: { inventory: true } },
        reviews: { select: { rating: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  // Compute ratings & discount percentage
  const formattedProducts = products.map((p) => {
    const totalRating = p.reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = p.reviews.length > 0 ? (totalRating / p.reviews.length).toFixed(1) : "5.0";
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
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) return null;

  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = product.reviews.length > 0 ? (totalRating / product.reviews.length).toFixed(1) : "5.0";
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
      reviews: { select: { rating: true } },
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
      primaryImage: p.images[0]?.url || "/images/placeholder.jpg",
      discountPercent: p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0,
    })),
  };
}
