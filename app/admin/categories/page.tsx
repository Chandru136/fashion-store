import { ListControls, Pagination } from "@/components/common/ListControls";
import { listUrl, pagination, value, type ListPageProps } from "@/lib/listing";
import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { FolderTree } from "lucide-react";
import { AddCategoryClient } from "./AddCategoryClient";

export default async function AdminCategoriesPage({ searchParams }: ListPageProps) {
  const sp = await searchParams;
  const q = value(sp, "q");
  const categoryId = value(sp, "category");
  const [categories, categoryOptions, productOptions, selectedCategory] = await Promise.all([
    prisma.category.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {},
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }, { id: "asc" }],
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true, sku: true, category: { select: { name: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }] }),
    categoryId ? prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true, _count: { select: { products: true } } } }) : null,
  ]);
  const paging = pagination(selectedCategory?._count.products || 0, value(sp, "page"));
  const selectedProducts = selectedCategory ? await prisma.product.findMany({
    where: { categoryId: selectedCategory.id },
    select: { id: true, name: true, sku: true, sellingPrice: true, status: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: paging.skip,
    take: paging.take,
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-wine-900">Categories Hierarchy</h1>
          <p className="text-xs text-stone-500 mt-1">Manage parent and nested subcategories for storefront Mega Menu.</p>
        </div>
      </div>

      <AddCategoryClient categories={categoryOptions} products={productOptions} />
      <p className="text-sm text-stone-600">Click a category name or product count to view its linked products below.</p>
      <ListControls path="/admin/categories" params={sp} search="Search categories" />
      {categories.length === 0 && <p>No matching categories.</p>}
      <div className="p-6 bg-ivory-50 rounded-xl border border-stone-200 shadow-sm">
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
                <tr key={c.id} className={c.id === selectedCategory?.id ? "bg-gold-50" : "hover:bg-stone-50 transition-colors"}>
                  <td className="p-3 font-bold text-wine-900 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-gold-600" />
                    <Link href={`${listUrl("/admin/categories", sp, { category: c.id, page: undefined })}#category-products`} aria-current={c.id === selectedCategory?.id ? "true" : undefined} className="underline underline-offset-4 hover:text-gold-700">{c.name}</Link>
                  </td>
                  <td className="p-3 font-mono text-stone-600">{c.slug}</td>
                  <td className="p-3 text-stone-700">{c.parent ? c.parent.name : "— Root Category —"}</td>
                  <td className="p-3 font-bold text-wine-800"><Link href={`${listUrl("/admin/categories", sp, { category: c.id, page: undefined })}#category-products`} aria-label={`View ${c._count.products} products in ${c.name}`} className="underline underline-offset-4">{c._count.products} products</Link></td>
                  <td className="p-3 font-mono">{c.displayOrder}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <section id="category-products" aria-labelledby="category-products-heading" className="scroll-mt-24 space-y-4 rounded-xl border border-stone-200 bg-ivory-50 p-6 shadow-sm">
        <h2 id="category-products-heading" className="font-serif text-xl font-bold text-wine-900">{selectedCategory ? `Products in ${selectedCategory.name}` : "Category products"}</h2>
        {!selectedCategory ? (
          <p className="text-sm text-stone-500">{categoryId ? "This category is no longer available. Select another category above." : "Select a category above to see its products."}</p>
        ) : selectedProducts.length === 0 ? (
          <p className="text-sm text-stone-500">No products are linked to this category yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-600">
                  <tr><th scope="col" className="p-3">Product</th><th scope="col" className="p-3">SKU</th><th scope="col" className="p-3">Price</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {selectedProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="p-3 font-semibold text-wine-900">{product.name}</td>
                      <td className="p-3 font-mono text-stone-600">{product.sku}</td>
                      <td className="p-3">{product.sellingPrice.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
                      <td className="p-3">{product.status}</td>
                      <td className="p-3"><Link href={`/admin/products/${product.id}/edit`} className="text-wine-900 underline" aria-label={`Edit ${product.name}`}>Edit product</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination path="/admin/categories" params={sp} {...paging} label="Products" />
          </>
        )}
      </section>
    </div>
  );
}
