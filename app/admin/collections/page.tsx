import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { canManageCollections } from "@/lib/collection-auth";
import { CollectionsManager } from "./CollectionsManager";

export const metadata: Metadata = { title: "Editorial Collections | Sudha Collections" };
export default async function CollectionsPage() {
  if (!await canManageCollections()) return <p role="alert">You don't have permission to manage Sudha Collections editorial collections.</p>;
  const [collections, categories] = await Promise.all([
    prisma.collection.findMany({ orderBy: [{ displayOrder: "asc" }, { id: "asc" }] }),
    prisma.category.findMany({ where: { status: "ACTIVE" }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);
  return <CollectionsManager collections={collections} categories={categories} />;
}
