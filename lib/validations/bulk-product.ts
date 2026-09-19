import { z } from "zod";

// Coerces common spreadsheet boolean representations (TRUE/FALSE, Yes/No,
// 1/0, or actual booleans if the sheet library already parsed them).
const sheetBoolean = z.union([z.boolean(), z.string(), z.number()]).transform((val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  const normalized = val.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
});

export const BulkProductRowSchema = z.object({
  title: z.string().min(2, "Product title is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional().default(""),
  mrp: z.coerce.number().positive("MRP must be a positive number"),
  sellingPrice: z.coerce.number().positive("Selling price must be a positive number"),
  tax: z.coerce.number().min(0).max(100).default(5),
  fabric: z.string().optional().default(""),
  occasion: z.string().optional().default(""),
  pattern: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "DRAFT"]).default("ACTIVE"),
  featured: sheetBoolean.optional().default(false),
  bestseller: sheetBoolean.optional().default(false),
  newArrival: sheetBoolean.optional().default(true),
  shortDescription: z.string().optional().default(""),
  description: z.string().min(1, "Description is required"),
  imageUrls: z.string().min(1, "At least one image URL is required"), // comma-separated in the sheet
  variantSku: z.string().min(1, "Variant SKU is required"),
  color: z.string().optional().default(""),
  size: z.string().optional().default(""),
  stock: z.coerce.number().int().min(0).default(0),
});

export type BulkProductRow = z.infer<typeof BulkProductRowSchema>;

// Column headers exactly as they'll appear in the downloadable template —
// keep these in sync with the keys above and with the parser that reads
// the uploaded file's header row.
export const BULK_UPLOAD_COLUMNS = [
  "title",
  "sku",
  "category",
  "brand",
  "mrp",
  "sellingPrice",
  "tax",
  "fabric",
  "occasion",
  "pattern",
  "status",
  "featured",
  "bestseller",
  "newArrival",
  "shortDescription",
  "description",
  "imageUrls",
  "variantSku",
  "color",
  "size",
  "stock",
] as const;
