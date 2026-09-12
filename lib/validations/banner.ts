import { z } from "zod";

// Accepts either a full URL (https://...) or a relative path (/uploads/...),
// since uploaded images come back from the upload endpoint as relative paths
// while pasted images are typically full URLs.
const imagePathSchema = z
  .string()
  .min(1, "Image is required")
  .refine(
    (val) => /^https?:\/\//.test(val) || val.startsWith("/"),
    "Enter a valid image URL or upload a file"
  );

export const BannerSchema = z.object({
  title: z.string().optional().default(""),
  subtitle: z.string().optional(),
  desktopImage: imagePathSchema,
  mobileImage: imagePathSchema.optional().or(z.literal("")),
  buttonText: z.string().optional().nullable(),
  buttonUrl: z.string().optional().nullable(),
  placement: z.enum(["HERO", "PROMO"]).default("HERO"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  displayOrder: z.coerce.number().int().default(0),
});

export type BannerInput = z.infer<typeof BannerSchema>;