"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  if (!sessionCookie?.value) return null;
  try {
    const userObj = JSON.parse(sessionCookie.value);
    return userObj.id;
  } catch (e) {
    return null;
  }
}

export async function toggleWishlistAction(productId: string) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return { success: false, error: "Please log in to save items to your wishlist" };
    }

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

export async function getUserWishlistAction() {
  const userId = await getUserIdFromSession();
  if (!userId) return [];

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!wishlist) return [];

  return wishlist.items.map((item) => {
    const p = item.product;
    const discountPercent = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
    return {
      id: item.id,
      productId: p.id,
      name: p.name,
      slug: p.slug,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      discountPercent,
      categoryName: p.category.name,
      primaryImage: p.images[0]?.url || "/images/placeholder.jpg",
    };
  });
}
