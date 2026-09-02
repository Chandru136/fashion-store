import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EditProductFormClient } from "./EditProductFormClient";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, variants: { include: { inventory: true } } } }),
    prisma.category.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
    prisma.brand.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  return <div className="mx-auto max-w-4xl space-y-6"><div className="border-b border-stone-200 pb-4"><h1 className="font-serif text-3xl font-bold text-wine-900">Edit Product</h1><p className="mt-1 text-xs text-stone-500">Update storefront details, pricing, availability and stock.</p></div><EditProductFormClient product={product} categories={categories} brands={brands} /></div>;
}
