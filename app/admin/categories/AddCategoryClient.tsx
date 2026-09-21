"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createCategoryAction } from "@/app/actions/admin.actions";

type CategoryOption = { id: string; name: string };
type ProductOption = { id: string; name: string; sku: string; category: { name: string } };

export function AddCategoryClient({ categories, products }: { categories: CategoryOption[]; products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const visibleProducts = products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.trim().toLowerCase()));

  function resetForm() {
    setName("");
    setParentId("");
    setDisplayOrder("0");
    setStatus("ACTIVE");
    setProductIds([]);
    setProductSearch("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await createCategoryAction(name, { parentId: parentId || null, displayOrder: Number(displayOrder), status, productIds });
      if (!result.success) {
        setError(result.error || "Failed to save category.");
        return;
      }
      resetForm();
      setOpen(false);
      setMessage(status === "ACTIVE" ? "Category saved and available for product creation." : "Inactive category saved.");
      router.push(`/admin/categories?category=${encodeURIComponent(result.categoryId!)}#category-products`, { scroll: false });
      router.refresh();
    } catch {
      setError("Failed to save category. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" aria-expanded={open} aria-controls="add-category-form" onClick={() => { setOpen(!open); setError(""); setMessage(""); }} disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-wine-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        <Plus className="h-4 w-4" /> Add category
      </button>
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
      {open && (
        <form id="add-category-form" onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-stone-200 bg-ivory-50 p-5 shadow-sm">
          <label htmlFor="category-name" className="block text-sm font-bold text-stone-700">Category name</label>
          <input id="category-name" autoFocus required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} disabled={pending} placeholder="New category name" aria-describedby={error ? "category-error" : undefined} aria-invalid={Boolean(error)} className="w-full rounded border border-stone-300 px-3 py-2 text-sm" />
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-sm font-bold text-stone-700">
              <span className="block">Parent category</span>
              <select value={parentId} onChange={(event) => setParentId(event.target.value)} disabled={pending} className="w-full rounded border border-stone-300 bg-white px-3 py-2 font-normal">
                <option value="">No parent (root category)</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-bold text-stone-700">
              <span className="block">Display order</span>
              <input type="number" required min={0} max={2147483647} step={1} value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} disabled={pending} className="w-full rounded border border-stone-300 px-3 py-2 font-normal" />
              <span className="block text-xs font-normal text-stone-500">Lower numbers appear first.</span>
            </label>
            <label className="space-y-1 text-sm font-bold text-stone-700">
              <span className="block">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")} disabled={pending} className="w-full rounded border border-stone-300 bg-white px-3 py-2 font-normal">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>
          <fieldset disabled={pending} className="space-y-2">
            <legend className="text-sm font-bold text-stone-700">Linked products ({productIds.length} selected)</legend>
            <p className="text-xs text-stone-500">Optional. Selected products will move from their current category to this category. The linked product count is calculated automatically.</p>
            <input type="search" aria-label="Search products to link" placeholder="Search by product name or SKU" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} className="w-full rounded border border-stone-300 px-3 py-2 text-sm" />
            <div className="max-h-52 space-y-2 overflow-y-auto rounded border border-stone-200 bg-white p-3">
              {visibleProducts.map((product) => (
                <label key={product.id} className="flex items-start gap-2 text-sm text-stone-700">
                  <input type="checkbox" className="mt-1" checked={productIds.includes(product.id)} onChange={(event) => setProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />
                  <span>{product.name} <span className="text-xs text-stone-500">({product.sku}) — Current category: {product.category.name}</span></span>
                </label>
              ))}
              {visibleProducts.length === 0 && <p className="text-sm text-stone-500">No matching products.</p>}
            </div>
          </fieldset>
          {error && <p id="category-error" role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="rounded-lg bg-wine-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Save category"}</button>
            <button type="button" disabled={pending} onClick={() => { setOpen(false); resetForm(); }} className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-50">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
