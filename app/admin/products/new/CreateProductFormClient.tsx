"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/app/actions/admin.actions";
import { Plus, ArrowRight, Check } from "lucide-react";

export function CreateProductFormClient({ categories, brands }: { categories: any[]; brands: any[] }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [mrp, setMrp] = useState(15000);
  const [sellingPrice, setSellingPrice] = useState(10999);
  const [fabric, setFabric] = useState("Pure Mulberry Silk");
  const [occasion, setOccasion] = useState("Wedding");
  const [pattern, setPattern] = useState("Traditional Zari Border");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800");
  const [color, setColor] = useState("Royal Red");
  const [stock, setStock] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSlug(autoSlug);
    setSku(`ARN-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createProductAction({
      name,
      slug,
      sku,
      description,
      categoryId,
      brandId,
      mrp: Number(mrp),
      sellingPrice: Number(sellingPrice),
      fabric,
      occasion,
      pattern,
      status: "ACTIVE",
      featured: true,
      bestseller: true,
      newArrival: true,
      images: [
        { url: imageUrl, altText: name, isPrimary: true, sortOrder: 1 },
      ],
      variants: [
        {
          sku: `${sku}-VAR`,
          color,
          size: "Free Size",
          fabric,
          price: Number(sellingPrice),
          stock: Number(stock),
        },
      ],
    });

    setIsSubmitting(false);

    if (res.success) {
      router.push("/admin/products");
    } else {
      setErrorMsg(res.error || "Failed to create product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl border border-stone-200 shadow-md space-y-6 text-xs">
      {errorMsg && <div className="p-3 bg-red-50 text-red-700 font-bold rounded border border-red-200">⚠ {errorMsg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-stone-700 block mb-1">Product Title</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Royal Swarna Kanchipuram Silk Saree"
            className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
          />
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">URL Slug</label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
          />
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">SKU</label>
          <input
            type="text"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
          />
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">MRP (₹)</label>
          <input
            type="number"
            required
            value={mrp}
            onChange={(e) => setMrp(Number(e.target.value))}
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">Selling Price (₹)</label>
          <input
            type="number"
            required
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">Fabric Type</label>
          <input
            type="text"
            value={fabric}
            onChange={(e) => setFabric(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">Initial Stock Count</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="font-bold text-stone-700 block mb-1">Image URL</label>
          <input
            type="url"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="font-bold text-stone-700 block mb-1">Detailed Description & Loom Specs</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Handcrafted pure silk saree with certified gold zari..."
            className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-widest rounded gold-border shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
      >
        {isSubmitting ? "Publishing to Catalog..." : "Publish Product Live"} <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
