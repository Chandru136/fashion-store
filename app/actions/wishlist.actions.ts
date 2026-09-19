"use server";

import { pagination, choice, value, priceSorts, type ListParams } from "@/lib/listing";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return (await verifySessionToken(sessionCookie?.value))?.id ?? null;
}

export async function toggleWishlistAction(productId: string) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return { success: false, error: "Please log in to save items to your wishlist" };
    }

    if (!productId || typeof productId !== "string") return { success: false, error: "Invalid product." };
    const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
    if (!product) return { success: false, error: "Product is not available." };

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (existingItem) {
      await prisma.wishlistItem.delete({ where: { id: existingItem.id } });
      revalidatePath("/wishlist");
      return { success: true, isWishlisted: false, message: "Removed from Wishlist" };
    } else {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
      revalidatePath("/wishlist");
      return { success: true, isWishlisted: true, message: "Added to Wishlist" };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update wishlist" };
  }
}

export async function getUserWishlistAction(params: ListParams = {}) {
  const userId = await getUserIdFromSession();
  if (!userId) return { items: [], ...pagination(0, 1, 12) };
  const q = value(params, "q");
  const sort = choice(params, "sort", priceSorts.map(o => o.value), "newest");
  const where = { wishlist: { userId }, ...(q ? { product: { name: { contains: q, mode: "insensitive" as const } } } : {}) };
  const paging = pagination(await prisma.wishlistItem.count({ where }), value(params, "page"), 12);
  const rows = await prisma.wishlistItem.findMany({
    where, skip: paging.skip, take: paging.take,
    orderBy: [sort === "price_asc" || sort === "price_desc" ? { product: { sellingPrice: sort === "price_asc" ? "asc" : "desc" } } : { createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }],
    include: { product: { include: {
      images: { orderBy: { sortOrder: "asc" } }, category: { select: { name: true } },
      variants: { where: { stock: { gt: 0 } }, orderBy: { price: "asc" }, take: 1 },
    } } },
  });
  return { ...paging, items: rows.map(item => {
    const p = item.product;
    return {
      id: item.id, productId: p.id, name: p.name, slug: p.slug, mrp: p.mrp, sellingPrice: p.sellingPrice,
      discountPercent: p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0,
      categoryName: p.category.name, primaryImage: p.images[0]?.url || "/images/placeholder.jpg",
      variantId: p.variants[0]?.id,
    };
  }) };
}
