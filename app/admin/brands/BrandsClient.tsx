"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createBrandAction, updateBrandAction, deleteBrandAction } from "@/app/actions/brand.actions";
import { brandSlug, type BrandInput } from "@/lib/validations/brand";

type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  status: string;
  _count: { products: number };
};

function BrandForm({ brand, pending, setPending, onSaved, onCancel }: {
  brand: Brand | null;
  pending: boolean;
  setPending: (pending: boolean) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const nameInput = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState<BrandInput>({ name: brand?.name || "", slug: brand?.slug || "", description: brand?.description || "", logo: brand?.logo || "", status: brand?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE" });
  const [customSlug, setCustomSlug] = useState(Boolean(brand));
  const [error, setError] = useState("");
  useEffect(() => { nameInput.current?.focus(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = brand ? await updateBrandAction(brand.id, input) : await createBrandAction(input);
      if (!result.success) setError(result.error);
      else onSaved();
    } catch {
      setError("Unable to save this brand. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const fieldClass = "w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm font-normal";
  return (
    <form onSubmit={submit} aria-labelledby="brand-form-heading" className="space-y-4 rounded-xl border border-stone-200 bg-ivory-50 p-5 shadow-sm">
      <h2 id="brand-form-heading" className="font-serif text-xl font-bold text-wine-900">{brand ? `Edit ${brand.name}` : "Add brand"}</h2>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
        <label className="space-y-1 text-sm font-bold text-stone-700">
          <span className="block">Brand name</span>
          <input ref={nameInput} required minLength={2} maxLength={100} value={input.name} onChange={(event) => { const name = event.target.value; setInput((current) => ({ ...current, name, slug: customSlug ? current.slug : brandSlug(name) })); }} className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm font-bold text-stone-700">
          <span className="block">Slug</span>
          <input required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Lowercase letters, numbers, and single hyphens" value={input.slug} onChange={(event) => { setCustomSlug(true); setInput({ ...input, slug: event.target.value }); }} className={fieldClass} />
          <span className="block text-xs font-normal text-stone-500">Generated from the name for new brands. Must be unique.</span>
        </label>
        <label className="space-y-1 text-sm font-bold text-stone-700 sm:col-span-2">
          <span className="block">Description (optional)</span>
          <textarea rows={3} maxLength={2000} value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm font-bold text-stone-700">
          <span className="block">Logo URL (optional)</span>
          <input type="url" placeholder="https://…" value={input.logo} onChange={(event) => setInput({ ...input, logo: event.target.value })} className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm font-bold text-stone-700">
          <span className="block">Status</span>
          <select value={input.status} onChange={(event) => setInput({ ...input, status: event.target.value as BrandInput["status"] })} className={fieldClass}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button disabled={pending} type="submit" className="rounded bg-wine-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Save brand"}</button>
        <button disabled={pending} type="button" onClick={onCancel} className="rounded border border-stone-300 px-4 py-2 text-sm disabled:opacity-50">Cancel</button>
      </div>
    </form>
  );
}

export function BrandsClient({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Brand | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function openForm(brand: Brand | null) {
    setEditing(brand);
    setDeleting(null);
    setError("");
    setMessage("");
  }

  async function deleteBrand(brand: Brand) {
    if (pending) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await deleteBrandAction(brand.id);
      if (!result.success) { setError(result.error); return; }
      setDeleting(null);
      setMessage(`${brand.name} deleted. Its products have been kept.`);
      router.refresh();
    } catch {
      setError("Unable to delete this brand. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <button type="button" disabled={pending} onClick={() => openForm(null)} className="inline-flex items-center gap-2 rounded bg-wine-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Add brand</button>
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
      {editing !== undefined && <BrandForm key={editing?.id || "new-brand"} brand={editing} pending={pending} setPending={setPending} onCancel={() => setEditing(undefined)} onSaved={() => {
        const created = editing === null;
        setEditing(undefined);
        setMessage(created ? "Brand created." : "Brand updated.");
        if (created) router.push("/admin/brands");
        router.refresh();
      }} />}
      {brands.length === 0 && <p className="text-sm text-stone-500">No matching brands.</p>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <article key={brand.id} className="space-y-3 rounded-xl border gold-border bg-ivory-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full wine-gradient-bg font-brand-title font-bold text-gold-300">{brand.name.charAt(0)}</div>
              <div className="min-w-0">
                <h3 className="break-words font-serif text-sm font-bold text-wine-900">{brand.name}</h3>
                <p className="break-all font-mono text-[10px] text-stone-400">{brand.slug}</p>
              </div>
            </div>
            <p className="break-words text-xs font-light text-stone-600">{brand.description || "Authentic weaving brand."}</p>
            <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-xs font-bold text-wine-800">
              <span>{brand._count.products} Products</span>
              <span className={`rounded px-2 py-0.5 text-[10px] uppercase ${brand.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-stone-200 text-stone-700"}`}>{brand.status}</span>
            </div>
            <div className="flex gap-3 border-t border-stone-100 pt-3">
              <button type="button" disabled={pending} onClick={() => openForm(brand)} aria-label={`Edit ${brand.name}`} className="inline-flex items-center gap-1 rounded border border-stone-300 px-3 py-1.5 text-xs font-bold text-wine-900 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button type="button" disabled={pending} onClick={() => { setDeleting(brand.id); setEditing(undefined); setError(""); setMessage(""); }} aria-label={`Delete ${brand.name}`} className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
            {deleting === brand.id && <div className="space-y-3 rounded border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-900">Delete <strong>{brand.name}</strong>? This permanently removes the brand. Its {brand._count.products} linked products will remain, with no brand assigned.</p>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => deleteBrand(brand)} className="rounded bg-red-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{pending ? "Deleting…" : "Delete brand"}</button>
                <button type="button" disabled={pending} onClick={() => { setDeleting(null); setError(""); }} className="rounded border border-stone-300 px-3 py-2 text-xs disabled:opacity-50">Cancel</button>
              </div>
            </div>}
          </article>
        ))}
      </div>
    </div>
  );
}
