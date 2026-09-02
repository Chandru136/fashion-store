"use server";

import { prisma } from "@/lib/db";
import { ProductSchema, ProductInput } from "@/lib/validations/product";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

const categoryNamePattern = /^[\p{L}\p{N}][\p{L}\p{N} &'()\-/]{1,79}$/u;
const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function createProductAction(input: ProductInput, newCategoryName?: string) {
  try {
    let categoryId = input.categoryId;
    const name = newCategoryName?.trim();
    if (!categoryId) {
      if (!name || !categoryNamePattern.test(name)) return { success: false, error: "Enter a valid category name (2–80 characters)." };
      const slug = slugify(name);
      const category = await prisma.category.upsert({ where: { slug }, update: { status: "ACTIVE" }, create: { name, slug, status: "ACTIVE" }, select: { id: true } });
      categoryId = category.id;
    }
    const validated = ProductSchema.parse({ ...input, categoryId });

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
    revalidatePath(`/products/${product.slug}`);
    return { success: true, product };
  } catch (error: unknown) {
    if (error instanceof ZodError) return { success: false, error: error.issues[0]?.message || "Check the product details." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false, error: "That product slug or SKU is already in use." };
    return { success: false, error: error instanceof Error ? error.message : "Failed to create product" };
  }
}

export async function updateProductAction(id: string, input: ProductInput) {
  try {
    const validated = ProductSchema.parse(input);
    const existing = await prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: { take: 1 } } });
    if (!existing) return { success: false, error: "Product not found." };
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data: { name: validated.name, slug: validated.slug, sku: validated.sku, description: validated.description, shortDescription: validated.shortDescription || null, categoryId: validated.categoryId, brandId: validated.brandId || null, mrp: validated.mrp, sellingPrice: validated.sellingPrice, tax: validated.tax, fabric: validated.fabric || null, occasion: validated.occasion || null, pattern: validated.pattern || null, status: validated.status, featured: validated.featured, bestseller: validated.bestseller, newArrival: validated.newArrival } });
      const image = validated.images[0];
      if (existing.images[0]) await tx.productImage.update({ where: { id: existing.images[0].id }, data: { url: image.url, altText: image.altText || validated.name, isPrimary: true } });
      else await tx.productImage.create({ data: { productId: id, url: image.url, altText: image.altText || validated.name, isPrimary: true, sortOrder: 1 } });
      const variant = validated.variants[0];
      if (existing.variants[0]) { await tx.productVariant.update({ where: { id: existing.variants[0].id }, data: { sku: variant.sku, color: variant.color || null, size: variant.size || null, fabric: variant.fabric || validated.fabric || null, price: variant.price, stock: variant.stock } }); await tx.inventory.upsert({ where: { variantId: existing.variants[0].id }, update: { availableStock: variant.stock }, create: { variantId: existing.variants[0].id, availableStock: variant.stock, reservedStock: 0, lowStockThreshold: 5 } }); }
      return updated;
    });

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/products/${product.slug}`);
    return { success: true, product };
  } catch (error: unknown) {
    if (error instanceof ZodError) return { success: false, error: error.issues[0]?.message || "Check the product details." };
    return { success: false, error: error instanceof Error ? error.message : "Failed to update product" };
  }
}

export async function setProductStatusAction(id: string, status: "ACTIVE" | "ARCHIVED" | "INACTIVE") {
  try { const product = await prisma.product.update({ where: { id }, data: { status } }); revalidatePath("/"); revalidatePath("/products"); revalidatePath("/admin/products"); revalidatePath(`/products/${product.slug}`); return { success: true }; }
  catch (error: unknown) { return { success: false, error: error instanceof Error ? error.message : "Failed to update product status" }; }
}

export async function deleteProductAction(id: string) {
  try {
    const product = await prisma.product.update({ where: { id }, data: { status: "INACTIVE" } });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath(`/products/${product.slug}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to deactivate product" };
  }
}

export async function updateStockAction(variantId: string, stock: number) {
  try {
    if (!Number.isInteger(stock) || stock < 0) return { success: false, error: "Stock must be a whole number of 0 or more." };
    await prisma.$transaction(async (tx) => {
      await tx.productVariant.update({ where: { id: variantId }, data: { stock } });
      await tx.inventory.upsert({ where: { variantId }, update: { availableStock: stock }, create: { variantId, availableStock: stock, reservedStock: 0, lowStockThreshold: 5 } });
    });
    revalidatePath("/admin/inventory"); revalidatePath("/admin/products"); revalidatePath("/products");
    return { success: true };
  } catch (error: unknown) { return { success: false, error: error instanceof Error ? error.message : "Failed to update stock" }; }
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
