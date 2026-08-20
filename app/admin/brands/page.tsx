import React from "react";
import { prisma } from "@/lib/db";
import { Award } from "lucide-react";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-bold text-wine-900">Master Brands & Weavers</h1>
        <p className="text-xs text-stone-500 mt-1">Manage partner weaving houses and designer labels.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((b) => (
          <div key={b.id} className="p-5 bg-white rounded-xl border gold-border space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 wine-gradient-bg rounded-full flex items-center justify-center text-gold-300 font-bold font-brand-title">
                {b.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-serif font-bold text-wine-900 text-sm">{b.name}</h3>
                <p className="text-[10px] text-stone-400 font-mono">{b.slug}</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 font-light">{b.description || "Authentic weaving brand."}</p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-wine-800">
              <span>{b._count.products} Products</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase">{b.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
