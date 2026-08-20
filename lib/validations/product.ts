import { z } from "zod";

export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(3, "SKU is required"),
  color: z.string().optional(),
  size: z.string().optional(),
  fabric: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  salePrice: z.number().optional(),
  stock: z.number().int().min(0, "Stock must be 0 or higher"),
  weight: z.number().optional(),
  barcode: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  sku: z.string().min(3, "Product SKU is required"),
  description: z.string().min(10, "Detailed description required"),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  mrp: z.number().min(0, "MRP must be non-negative"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative"),
  tax: z.number().min(0).default(5.0),
  fabric: z.string().optional(),
  occasion: z.string().optional(),
  pattern: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  newArrival: z.boolean().default(true),
  images: z.array(z.object({
    url: z.string().url("Valid image URL required"),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().default(0),
  })).min(1, "At least one product image is required"),
  variants: z.array(ProductVariantSchema).min(1, "At least one variant is required"),
});

export type ProductInput = z.infer<typeof ProductSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
