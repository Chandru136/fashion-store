import { z } from "zod";
import { menuItems } from "@/components/navigation/navigation-data";

const text = z.string().trim().min(1, "This field is required").max(500);
const optionalText = z.string().trim().max(500);
export const cmsUrl = z.string().trim().max(2000).refine(value => {
  if (/[\s\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use a site path beginning with / or a full http(s) URL");
const namedLink = z.object({ name: text, href: cmsUrl });
export const navigationItemSchema = z.object({
  id: text, label: text, href: cmsUrl, featuredBadge: optionalText,
  categories: z.array(namedLink).max(30),
  priceRanges: z.array(z.object({ label: text, href: cmsUrl })).max(30),
  brands: z.array(namedLink).max(30),
  banner: z.object({ title: text, image: cmsUrl, href: cmsUrl }),
});
export const storyCardSchema = z.object({ name: text, subtitle: optionalText, image: cmsUrl, href: cmsUrl, detail: z.boolean() });
const section = z.object({ eyebrow: text, title: text, emphasis: optionalText, description: optionalText, cards: z.array(storyCardSchema).min(1).max(8) });
export const homepageContentSchema = z.object({
  navigation: z.array(navigationItemSchema).min(1).max(12).refine(items => new Set(items.map(item => item.id)).size === items.length, "Navigation IDs must be unique"),
  newArrivals: z.object({ label: text, href: cmsUrl }),
  lookbook: section,
  heritage: section.extend({ buttonText: text, buttonUrl: cmsUrl }),
});
export type HomepageContent = z.infer<typeof homepageContentSchema>;
export type NavigationItem = z.infer<typeof navigationItemSchema>;
export const defaultStoryCards = [
  { name: "The Silk Edit", subtitle: "Rich colour. Beautiful detail.", image: "/images/home/silk-story.jpg", href: "/products?q=silk", detail: false },
  { name: "Celebration in Colour", subtitle: "For moments that become memories.", image: "/images/home/festive-story.jpg", href: "/products?occasion=Wedding", detail: false },
  { name: "A Softer Statement", subtitle: "An effortless kind of elegance.", image: "/images/home/heritage-story.jpg", href: "/products?sort=newest", detail: false },
  { name: "The Golden Thread", subtitle: "Fall in love with the finer details.", image: "/images/home/silk-story.jpg", href: "/products?sort=featured", detail: true },
];
export const defaultHomepageContent: HomepageContent = {
  navigation: menuItems.map(item => navigationItemSchema.parse({ ...item, href: item.categories[0]?.href || "/products", featuredBadge: item.featuredBadge || "" })),
  newArrivals: { label: "New arrivals", href: "/products?sort=newest" },
  lookbook: { eyebrow: "A little tradition. A little you.", title: "Every drape tells", emphasis: "a story.", description: "Meet the colours, textures and details of your next favourite.", cards: defaultStoryCards },
  heritage: { eyebrow: "Rooted in tradition", title: "Inspired by heritage.", emphasis: "Made for your story.", description: "The graceful lines of a gopuram. The richness of a festive drape. Discover a celebration of South Indian colour and timeless style.", buttonText: "Find your celebration", buttonUrl: "/products?sort=featured", cards: [
    { ...defaultStoryCards[0], name: "The Heritage Edit", subtitle: "Collection" },
    { ...defaultStoryCards[1], name: "A Festive Reverie", subtitle: "Collection" },
    { ...defaultStoryCards[2], name: "Modern Heirlooms", subtitle: "Collection" },
  ] },
};
