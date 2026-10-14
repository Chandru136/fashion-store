import { z } from "zod";

export const collectionImage = z.string().trim().max(2000).refine(value => {
  if (/[\s\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "Use a local image path or an https image URL.");

export const collectionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
  description: z.string().trim().max(300),
  image: collectionImage,
  mobileImage: z.union([z.literal(""), collectionImage]),
  buttonText: z.string().trim().min(1).max(40),
  buttonUrl: z.string().trim().max(2000).refine(value => {
    if (/[\s\\#]/.test(value) || !value.startsWith("/") || value.startsWith("//")) return false;
    const path = value.split("?")[0];
    return path === "/products" || /^\/category\/[a-z0-9-]+$/.test(path);
  }, "Link to /products, a filtered /products?… URL, or /category/category-slug."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  displayOrder: z.number().int().min(0).max(2147483647),
});
export type CollectionInput = z.infer<typeof collectionSchema>;
export const collectionIdeas = [
  { name: "The Bridal Edit", slug: "bridal-edit", description: "Rich colours and graceful drapes for your most treasured celebrations.", image: "/images/home/festive-story.jpg", buttonUrl: "/products?occasion=Wedding" },
  { name: "Festive Favourites", slug: "festive-favourites", description: "Joyful colour and beautiful details for moments spent together.", image: "/images/home/festive-story.jpg", buttonUrl: "/products?occasion=Festive" },
  { name: "Everyday Cotton", slug: "everyday-cotton", description: "Easy, expressive weaves for an effortlessly elegant everyday wardrobe.", image: "/images/home/heritage-story.jpg", buttonUrl: "/products?q=cotton" },
  { name: "The Silk Heritage Edit", slug: "silk-heritage-edit", description: "Explore the colours and textures of timeless silk traditions.", image: "/images/home/silk-story.jpg", buttonUrl: "/products?q=silk" },
];
