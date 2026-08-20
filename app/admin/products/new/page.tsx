import React from "react";
import { prisma } from "@/lib/db";
import { CreateProductFormClient } from "./CreateProductFormClient";

export default async function CreateProductPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-bold text-wine-900">Create New Fashion Product</h1>
        <p className="text-xs text-stone-500 mt-1">Add a new silk saree, Anarkali, or ethnic garment to the catalog.</p>
      </div>

      <CreateProductFormClient categories={categories} brands={brands} />
    </div>
  );
}
