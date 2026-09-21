import { z } from "zod";

export const brandSlug = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const BrandSchema = z.object({
  name: z.string().trim().min(2, "Brand name must be at least 2 characters.").max(100, "Brand name must be 100 characters or fewer."),
  slug: z.string().trim().min(1, "Enter a brand slug.").max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens for the slug."),
  description: z.string().trim().max(2000, "Description must be 2,000 characters or fewer."),
  logo: z.string().trim().refine((value) => {
    if (!value) return true;
    try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
  }, "Enter a valid HTTP or HTTPS logo URL."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type BrandInput = z.infer<typeof BrandSchema>;
