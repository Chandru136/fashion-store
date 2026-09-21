import { ListControls } from "@/components/common/ListControls";
import { value, type ListPageProps } from "@/lib/listing";
import React from "react";
import { prisma } from "@/lib/db";
import { BrandsClient } from "./BrandsClient";

export default async function AdminBrandsPage({ searchParams }: ListPageProps) {
  const sp = await searchParams;
  const q = value(sp, "q");
  const brands = await prisma.brand.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {},
    select: { id: true, name: true, slug: true, description: true, logo: true, status: true, _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-bold text-wine-900">Master Brands & Weavers</h1>
        <p className="text-xs text-stone-500 mt-1">Manage partner weaving houses and designer labels.</p>
      </div>

      <ListControls path="/admin/brands" params={sp} search="Search brands" />
      <BrandsClient brands={brands} />
    </div>
  );
}
