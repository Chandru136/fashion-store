import { z } from "zod";

export const BannerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  subtitle: z.string().optional(),
  desktopImage: z.string().url("Enter a valid image URL"),
  mobileImage: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
  startDate: z.string().optional(), // datetime-local input value, parsed to Date in the action
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  displayOrder: z.coerce.number().int().default(0),
});

export type BannerInput = z.infer<typeof BannerSchema>;