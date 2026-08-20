"use server";

import { prisma } from "@/lib/db";
import { ProductSchema, ProductInput } from "@/lib/validations/product";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createProductAction(input: ProductInput) {
  try {
    const validated = ProductSchema.parse(input);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        sku: validated.sku,
        description: validated.description,
        shortDescription: validated.shortDescription || null,
        categoryId: validated.categoryId,
        brandId: validated.brandId || null,
        mrp: validated.mrp,
        sellingPrice: validated.sellingPrice,
        tax: validated.tax,
        fabric: validated.fabric || null,
        occasion: validated.occasion || null,
        pattern: validated.pattern || null,
        status: validated.status,
        featured: validated.featured,
        bestseller: validated.bestseller,
        newArrival: validated.newArrival,
        images: {
          create: validated.images.map((img, idx) => ({
            url: img.url,
            altText: img.altText || validated.name,
            isPrimary: img.isPrimary || idx === 0,
            sortOrder: img.sortOrder || idx + 1,
          })),
        },
        variants: {
          create: validated.variants.map((v) => ({
            sku: v.sku,
            color: v.color || null,
            size: v.size || null,
            fabric: v.fabric || validated.fabric || null,
            price: v.price,
            salePrice: v.salePrice || null,
            stock: v.stock,
            weight: v.weight || 0.8,
            inventory: {
              create: {
                availableStock: v.stock,
                reservedStock: 0,
                lowStockThreshold: 5,
              },
            },
          })),
        },
      },
    });

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create product" };
  }
}

export async function updateProductAction(id: string, input: Partial<ProductInput>) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        mrp: input.mrp,
        sellingPrice: input.sellingPrice,
        status: input.status,
        featured: input.featured,
        bestseller: input.bestseller,
        newArrival: input.newArrival,
      },
    });

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update product" };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product" };
  }
}

export async function createBannerAction(data: {
  title: string;
  subtitle?: string;
  desktopImage: string;
  mobileImage?: string;
  buttonText?: string;
  buttonUrl?: string;
  displayOrder?: number;
}) {
  try {
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        desktopImage: data.desktopImage,
        mobileImage: data.mobileImage || data.desktopImage,
        buttonText: data.buttonText || "Shop Now",
        buttonUrl: data.buttonUrl || "/products",
        displayOrder: data.displayOrder || 1,
        status: "ACTIVE",
      },
    });
    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true, banner };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create banner" };
  }
}

export async function createCouponAction(data: {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  endDate: string;
}) {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumOrderAmount: data.minimumOrderAmount,
        maximumDiscount: data.maximumDiscount || null,
        endDate: new Date(data.endDate),
        status: "ACTIVE",
      },
    });
    revalidatePath("/admin/coupons");
    return { success: true, coupon };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create coupon" };
  }
}
