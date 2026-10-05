import type { HomepageContent } from "@/lib/homepage-content";
export const homepageSections = [
  { key: "navigation", slug: "navigation", title: "Navigation bar", description: "Edit desktop and mobile menus, dropdown links and promotional cards." },
  { key: "newArrivals", slug: "new-arrivals", title: "New arrivals link", description: "Update the label and destination of the new arrivals navigation link." },
  { key: "lookbook", slug: "lookbook", title: "Every drape tells a story", description: "Edit the heading, description and story cards immediately after the banner." },
  { key: "heritage", slug: "heritage", title: "Rooted in tradition", description: "Edit the heritage heading, description, button and collection cards." },
] as const satisfies ReadonlyArray<{ key: keyof HomepageContent; slug: string; title: string; description: string }>;
