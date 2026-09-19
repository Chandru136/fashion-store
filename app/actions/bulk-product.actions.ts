"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { BulkProductRowSchema, BulkProductRow } from "@/lib/validations/bulk-product";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;
  const session = await verifySessionToken(token);
  if (!session || session.role === "CUSTOMER") {
    throw new Error("Not authorized");
  }
  return session;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resolveCategoryId(categoryName: string): Promise<string> {
  const slug = slugify(categoryName);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name: { equals: categoryName, mode: "insensitive" } }] },
  });
  if (existing) return existing.id;

  const created = await prisma.category.create({
    data: { name: categoryName, slug, status: "ACTIVE" },
  });
  return created.id;
}

async function resolveBrandId(brandName: string): Promise<string | undefined> {
  if (!brandName.trim()) return undefined;
  const slug = slugify(brandName);
  const existing = await prisma.brand.findFirst({
    where: { OR: [{ slug }, { name: { equals: brandName, mode: "insensitive" } }] },
  });
  if (existing) return existing.id;

  const created = await prisma.brand.create({
    data: { name: brandName, slug, status: "ACTIVE" },
  });
  return created.id;
}

export interface BulkUploadRowResult {
  rowNumber: number; // 1-indexed, matches the spreadsheet row (excluding header)
  success: boolean;
  productName?: string;
  error?: string;
}

export interface BulkUploadSummary {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: BulkUploadRowResult[];
}

/**
 * Accepts raw parsed spreadsheet rows (already turned into plain objects
 * client-side via SheetJS) and creates one product + one variant per row.
 * Each row is validated and processed independently — one bad row doesn't
 * stop the rest of the batch from importing.
 */
export async function bulkCreateProductsAction(rawRows: Record<string, any>[]): Promise<BulkUploadSummary> {
  await requireAdmin();

  const results: BulkUploadRowResult[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 1;
    const raw = rawRows[i];

    try {
      const row: BulkProductRow = BulkProductRowSchema.parse(raw);

      const slug = slugify(row.title);
      const categoryId = await resolveCategoryId(row.category);
      const brandId = await resolveBrandId(row.brand);

      const imageUrls = row.imageUrls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      if (imageUrls.length === 0) {
        throw new Error("No valid image URLs found");
      }

      // Guard against duplicate SKU/slug before attempting the create —
      // gives a clear error instead of a raw Prisma unique-constraint failure.
      const existingProduct = await prisma.product.findFirst({
        where: { OR: [{ sku: row.sku }, { slug }] },
      });
      if (existingProduct) {
        throw new Error(`A product with SKU "${row.sku}" or slug "${slug}" already exists`);
      }

      const existingVariantSku = await prisma.productVariant.findUnique({
        where: { sku: row.variantSku },
      });
      if (existingVariantSku) {
        throw new Error(`Variant SKU "${row.variantSku}" already exists`);
      }

      await prisma.product.create({
        data: {
          name: row.title,
          slug,
          sku: row.sku,
          description: row.description,
          shortDescription: row.shortDescription || undefined,
          categoryId,
          brandId,
          mrp: row.mrp,
          sellingPrice: row.sellingPrice,
          tax: row.tax,
          fabric: row.fabric || undefined,
          occasion: row.occasion || undefined,
          pattern: row.pattern || undefined,
          status: row.status,
          featured: row.featured,
          bestseller: row.bestseller,
          newArrival: row.newArrival,
          images: {
            create: imageUrls.map((url, idx) => ({
              url,
              altText: row.title,
              isPrimary: idx === 0,
              sortOrder: idx + 1,
            })),
          },
          variants: {
            create: [
              {
                sku: row.variantSku,
                color: row.color || undefined,
                size: row.size || undefined,
                fabric: row.fabric || undefined,
                price: row.sellingPrice,
                stock: row.stock,
                inventory: {
                  create: {
                    availableStock: row.stock,
                    reservedStock: 0,
                    lowStockThreshold: 5,
                  },
                },
              },
            ],
          },
        },
      });

      results.push({ rowNumber, success: true, productName: row.title });
    } catch (error) {
      let message = "Failed to create product";
      if (error instanceof ZodError) {
        message = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      } else if (error instanceof Error) {
        message = error.message;
      }
      results.push({ rowNumber, success: false, error: message });
    }
  }

  revalidatePath("/admin/products");

  return {
    totalRows: rawRows.length,
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
    results,
  };
}
