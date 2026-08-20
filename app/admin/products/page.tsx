import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Search, Filter, Edit, Trash2, Package } from "lucide-react";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const searchQuery = sp.q || "";

  const whereClause: any = {};
  if (searchQuery) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { sku: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      variants: { select: { stock: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-wine-900">Products Catalog Management</h1>
          <p className="text-xs text-stone-500 mt-1">Manage silk sarees, variants, prices, images, and inventory statuses.</p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase gold-border shadow-md hover:brightness-110"
        >
          <Plus className="w-4 h-4 text-gold-400" /> Create New Product
        </Link>
      </div>

      {/* Product List Table */}
      <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <form className="relative flex-1 max-w-md">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by Product Name or SKU..."
              className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-xs focus:outline-none focus:border-gold-500"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </form>
          <span className="text-xs font-semibold text-stone-600">Total Products: {products.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">MRP / Price</th>
                <th className="p-3">Total Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {products.map((p) => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);

                return (
                  <tr key={p.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]?.url || "/images/placeholder.jpg"} alt={p.name} className="w-10 h-12 object-cover rounded bg-stone-100 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-wine-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-gold-600 font-semibold">{p.brand?.name || "Aarna Heritage"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-semibold text-stone-700">{p.sku}</td>
                    <td className="p-3 text-stone-600">{p.category.name}</td>
                    <td className="p-3">
                      <div className="font-bold text-wine-900">₹{p.sellingPrice.toLocaleString("en-IN")}</div>
                      {p.mrp > p.sellingPrice && <div className="text-[10px] text-stone-400 line-through">₹{p.mrp.toLocaleString("en-IN")}</div>}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        totalStock > 5 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-wine-800 text-gold-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/products/${p.slug}`} className="text-wine-800 font-bold hover:underline">
                        Preview ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
