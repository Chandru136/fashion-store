import React from "react";
import { prisma } from "@/lib/db";
import { FolderTree, Plus } from "lucide-react";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true } },
    },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-wine-900">Categories Hierarchy</h1>
          <p className="text-xs text-stone-500 mt-1">Manage parent and nested subcategories for storefront Mega Menu.</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                <th className="p-3">Category Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Parent Category</th>
                <th className="p-3">Linked Products</th>
                <th className="p-3">Display Order</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="p-3 font-bold text-wine-900 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-gold-600" /> {c.name}
                  </td>
                  <td className="p-3 font-mono text-stone-600">{c.slug}</td>
                  <td className="p-3 text-stone-700">{c.parent ? c.parent.name : "— Root Category —"}</td>
                  <td className="p-3 font-bold text-wine-800">{c._count.products} products</td>
                  <td className="p-3 font-mono">{c.displayOrder}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
