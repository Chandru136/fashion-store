"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canManageCollections } from "@/lib/collection-auth";
import { collectionSchema } from "@/lib/validations/collection";

function refreshCollections() {
  revalidatePath("/admin/collections");
  revalidatePath("/");
}

export async function saveCollection(id: string | null, input: unknown) {
  if (!await canManageCollections()) return { success: false, error: "You don't have permission to manage collections." };
  const result = collectionSchema.safeParse(input);
  if (!result.success) return { success: false, error: result.error.issues.map(issue => `${issue.path[0]}: ${issue.message}`).join("\n") };
  try {
    if (id) await prisma.collection.update({ where: { id }, data: result.data });
    else await prisma.collection.create({ data: result.data });
    refreshCollections();
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false, error: "That slug already exists. Choose a unique slug." };
    console.error("Sudha Collections collection save failed", error);
    return { success: false, error: "Unable to save this collection. Please try again." };
  }
}

export async function deleteCollection(id: string) {
  if (!await canManageCollections()) return { success: false, error: "You don't have permission to manage collections." };
  try {
    await prisma.collection.delete({ where: { id } });
    refreshCollections();
    return { success: true };
  } catch {
    return { success: false, error: "Unable to delete this collection. Refresh and try again." };
  }
}
