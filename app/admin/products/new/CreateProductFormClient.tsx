"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/app/actions/admin.actions";
import { ArrowRight } from "lucide-react";

type CategoryOption = { id: string; name: string; parentId: string | null };
type BrandOption = { id: string; name: string };
const NEW_CATEGORY_VALUE = "__new_category__";

export function CreateProductFormClient({ categories, brands }: { categories: CategoryOption[]; brands: BrandOption[] }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || NEW_CATEGORY_VALUE);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [mrp, setMrp] = useState(15000);
  const [sellingPrice, setSellingPrice] = useState(10999);
  const [tax, setTax] = useState(5);
  const [fabric, setFabric] = useState("Pure Mulberry Silk");
  const [occasion, setOccasion] = useState("Wedding");
  const [pattern, setPattern] = useState("Traditional Zari Border");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800");
  const [imageSource, setImageSource] = useState<"url" | "file">("url");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [color, setColor] = useState("Royal Red");
  const [size, setSize] = useState("Free Size");
  const [variantSku, setVariantSku] = useState("");
  const [stock, setStock] = useState(25);
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("ACTIVE");
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSlug(autoSlug);
    if (!sku) {
      const generatedSku = `ARN-${Math.floor(1000 + Math.random() * 9000)}`;
      setSku(generatedSku);
      setVariantSku(`${generatedSku}-VAR`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let productImageUrl = imageUrl.trim();

      if (imageSource === "file") {
        if (!imageFile) throw new Error("Choose an image file to upload.");

        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploadResponse = await fetch("/api/admin/product-images", {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.url) {
          throw new Error(uploadResult.error || "Failed to upload the product image.");
        }
        productImageUrl = uploadResult.url;
      }

      const res = await createProductAction({
      name,
      slug,
      sku,
      description,
      shortDescription: shortDescription || undefined,
      categoryId: categoryId === NEW_CATEGORY_VALUE ? "" : categoryId,
      brandId: brandId || undefined,
      mrp: Number(mrp),
      sellingPrice: Number(sellingPrice),
      tax: Number(tax),
      fabric,
      occasion,
      pattern,
      status, featured, bestseller, newArrival,
      images: [
        { url: productImageUrl, altText: name, isPrimary: true, sortOrder: 1 },
      ],
      variants: [
        {
          sku: variantSku,
          color,
          size,
          fabric,
          price: Number(sellingPrice),
          stock: Number(stock),
        },
      ],
    }, categoryId === NEW_CATEGORY_VALUE ? newCategoryName : undefined);

      if (res.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to create product");
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setIsSubmitting(false);
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
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
          >
            {categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>)}
            <option value={NEW_CATEGORY_VALUE}>+ Create a new category</option>
          </select>
          {categoryId === NEW_CATEGORY_VALUE && <input type="text" required minLength={2} maxLength={80} value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="mt-2 w-full px-3 py-2 border border-stone-300 rounded" />}
        </div>
        <div><label className="font-bold text-stone-700 block mb-1">Brand</label><select value={brandId} onChange={(e)=>setBrandId(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded"><option value="">No brand / Store brand</option>{brands.map((b)=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
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
        <div><label className="font-bold text-stone-700 block mb-1">Tax (%)</label><input type="number" required min={0} max={100} step="0.01" value={tax} onChange={(e)=>setTax(Number(e.target.value))} className="w-full px-3 py-2 border border-stone-300 rounded" /></div>
        <div>
          <label className="font-bold text-stone-700 block mb-1">Initial Stock Count</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>
        <div><label className="font-bold text-stone-700 block mb-1">Variant SKU</label><input required value={variantSku} onChange={(e)=>setVariantSku(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded font-mono" /></div>
        <div><label className="font-bold text-stone-700 block mb-1">Color</label><input value={color} onChange={(e)=>setColor(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded" /></div>
        <div><label className="font-bold text-stone-700 block mb-1">Size</label><input value={size} onChange={(e)=>setSize(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded" /></div>
        <div><label className="font-bold text-stone-700 block mb-1">Occasion</label><input value={occasion} onChange={(e)=>setOccasion(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded" /></div>
        <div><label className="font-bold text-stone-700 block mb-1">Pattern</label><input value={pattern} onChange={(e)=>setPattern(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded" /></div>
        <div><label className="font-bold text-stone-700 block mb-1">Publishing Status</label><select value={status} onChange={(e)=>setStatus(e.target.value as "DRAFT"|"ACTIVE")} className="w-full px-3 py-2 border border-stone-300 rounded"><option value="ACTIVE">Active — visible in storefront</option><option value="DRAFT">Draft — hidden from storefront</option></select></div>
        <div className="sm:col-span-2">
          <label className="font-bold text-stone-700 block mb-1">Short Description</label><input value={shortDescription} onChange={(e)=>setShortDescription(e.target.value)} maxLength={250} className="w-full px-3 py-2 border border-stone-300 rounded" />
        </div>
        <div className="sm:col-span-2">
          <span className="font-bold text-stone-700 block mb-2">Product Image</span>
          <div className="mb-3 flex flex-wrap gap-5">
            <label className="flex items-center gap-2 font-semibold">
              <input type="radio" name="imageSource" checked={imageSource === "url"} onChange={() => setImageSource("url")} />
              Paste image URL
            </label>
            <label className="flex items-center gap-2 font-semibold">
              <input type="radio" name="imageSource" checked={imageSource === "file"} onChange={() => setImageSource("file")} />
              Upload from device
            </label>
          </div>
          {imageSource === "url" ? (
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/product-image.jpg"
              className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
            />
          ) : (
            <>
              <input
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded border border-stone-300 px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-wine-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-gold-300"
              />
              <p className="mt-1 text-stone-500">JPEG, PNG, WebP, GIF or AVIF; maximum 5 MB. Works with phone, tablet and computer file pickers.</p>
            </>
          )}
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

      <fieldset className="rounded-lg border border-stone-200 p-4"><legend className="px-2 font-bold text-wine-900">Storefront Placement</legend><div className="flex flex-wrap gap-6"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={featured} onChange={(e)=>setFeatured(e.target.checked)} /> Featured product</label><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={bestseller} onChange={(e)=>setBestseller(e.target.checked)} /> Bestseller</label><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={newArrival} onChange={(e)=>setNewArrival(e.target.checked)} /> New arrival</label></div></fieldset>

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
