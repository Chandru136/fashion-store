import { cache } from "react";
import { prisma } from "@/lib/db";
import { defaultHomepageContent, homepageContentSchema } from "@/lib/homepage-content";

export const getHomepageContent = cache(async () => {
  const record = await prisma.homepageContent.findUnique({ where: { id: "sudha-collections" } });
  return record ? homepageContentSchema.parse(record.content) : defaultHomepageContent;
});
