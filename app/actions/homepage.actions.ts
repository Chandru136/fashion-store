"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import { defaultHomepageContent, homepageContentSchema } from "@/lib/homepage-content";
import { homepageSections } from "@/lib/homepage-sections";
import { prisma } from "@/lib/db";

export async function saveHomepageContent(sectionKey: string, input: unknown) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (!session || session.role === "CUSTOMER") return { success: false, error: "You don't have permission to update the homepage." };
  const section = homepageSections.find(item => item.key === sectionKey);
  if (!section) return { success: false, error: "Unknown homepage section." };
  const result = homepageContentSchema.shape[section.key].safeParse(input);
  if (!result.success) return { success: false, error: result.error.issues.map(issue => `${issue.path.join(" > ")}: ${issue.message}`).join("\n") };
  try {
    const patch = { [section.key]: result.data };
    // Merge only this section atomically, preserving edits saved from other pages.
    await prisma.$executeRaw`
      INSERT INTO "HomepageContent" ("id", "content", "updatedAt")
      VALUES (${"sudha-collections"}, ${JSON.stringify({ ...defaultHomepageContent, ...patch })}::jsonb, NOW())
      ON CONFLICT ("id") DO UPDATE
      SET "content" = "HomepageContent"."content" || ${JSON.stringify(patch)}::jsonb,
          "updatedAt" = NOW()
    `;
    revalidatePath("/", "layout");
    revalidatePath("/admin/homepage", "layout");
    return { success: true };
  } catch (error) {
    console.error("Sudha Collections homepage update failed", error);
    return { success: false, error: "Unable to save changes. Please try again." };
  }
}
