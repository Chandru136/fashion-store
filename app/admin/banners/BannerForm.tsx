"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBanner, updateBanner } from "@/app/actions/banner.actions";
import { BannerInput } from "@/lib/validations/banner";

interface BannerFormProps {
  bannerId?: string; // present when editing
  initialData?: Partial<BannerInput>;
}

type FormState = {
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  buttonText: string;
  buttonUrl: string;
  placement: "HERO" | "PROMO";
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "INACTIVE";
  displayOrder: string;
};

function toDatetimeLocal(value?: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

async function uploadImage(file: File): Promise<string> {
  const uploadData = new FormData();
  uploadData.append("image", file);
  const res = await fetch("/api/admin/product-images", {
    method: "POST",
    body: uploadData,
  });
  const result = await res.json();
  if (!res.ok || !result.url) {
    throw new Error(result.error || "Failed to upload image.");
  }
  return result.url;
}

export default function BannerForm({ bannerId, initialData }: BannerFormProps) {
  const router = useRouter();
  const isEditing = !!bannerId;

  const [form, setForm] = useState<FormState>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    desktopImage: initialData?.desktopImage || "",
    mobileImage: initialData?.mobileImage || "",
    buttonText: initialData?.buttonText ?? "",
    buttonUrl: initialData?.buttonUrl ?? "",
    placement: (initialData?.placement as "HERO" | "PROMO") || "HERO",
    startDate: toDatetimeLocal(initialData?.startDate as any),
    endDate: toDatetimeLocal(initialData?.endDate as any),
    status: (initialData?.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    displayOrder: String(initialData?.displayOrder ?? 0),
  });

  // Separate source toggle + selected file per image field, same pattern as the product form.
  const [desktopImageSource, setDesktopImageSource] = useState<"url" | "file">("url");
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);
  const [mobileImageSource, setMobileImageSource] = useState<"url" | "file">("url");
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BannerInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let desktopImageUrl = form.desktopImage.trim();
      let mobileImageUrl = form.mobileImage.trim();

      if (desktopImageSource === "file") {
        if (!desktopImageFile) throw new Error("Choose a desktop image file to upload.");
        desktopImageUrl = await uploadImage(desktopImageFile);
      }

      if (mobileImageSource === "file" && mobileImageFile) {
        mobileImageUrl = await uploadImage(mobileImageFile);
      }

      const payload: BannerInput = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        desktopImage: desktopImageUrl,
        mobileImage: mobileImageUrl || undefined,
        buttonText: form.buttonText.trim() ? form.buttonText.trim() : null,
        buttonUrl: form.buttonUrl.trim() ? form.buttonUrl.trim() : null,
        placement: form.placement,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        status: form.status,
        displayOrder: Number(form.displayOrder) || 0,
      };

      const res = isEditing ? await updateBanner(bannerId!, payload) : await createBanner(payload);

      if (res.success) {
        router.push("/admin/banners");
        router.refresh();
      } else {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: keyof BannerInput) =>
    `w-full px-3 py-2.5 border rounded text-sm focus:outline-none ${
      fieldErrors[field] ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5 bg-ivory-50 p-6 rounded-xl border border-stone-200">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-stone-700 block mb-1">Title</label>
        <input
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          className={inputClass("title")}
          placeholder="The Grand Kanchipuram Heritage Edition"
        />
        {fieldErrors.title && <p className="text-red-600 text-xs mt-1">{fieldErrors.title}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-stone-700 block mb-1">Subtitle</label>
        <input
          value={form.subtitle}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          className={inputClass("subtitle")}
          placeholder="Royal Bridal Trunk 2026"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-stone-700 block mb-1">Placement</label>
        <select
          value={form.placement}
          onChange={(e) => handleChange("placement", e.target.value)}
          className={inputClass("placement")}
        >
          <option value="HERO">Hero Carousel (top of homepage)</option>
          <option value="PROMO">Promo Banner (below featured collections)</option>
        </select>
      </div>

      {/* Desktop Image — URL or file upload */}
      <div>
        <span className="text-sm font-semibold text-stone-700 block mb-2">Desktop Image *</span>
        <div className="mb-2 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="radio"
              name="desktopImageSource"
              checked={desktopImageSource === "url"}
              onChange={() => setDesktopImageSource("url")}
            />
            Paste image URL
          </label>
          <label className="flex items-center gap-2 font-medium">
            <input
              type="radio"
              name="desktopImageSource"
              checked={desktopImageSource === "file"}
              onChange={() => setDesktopImageSource("file")}
            />
            Upload from device
          </label>
        </div>

        {desktopImageSource === "url" ? (
          <>
            <input
              key="desktop-url-input"
              value={form.desktopImage}
              onChange={(e) => handleChange("desktopImage", e.target.value)}
              className={inputClass("desktopImage")}
              placeholder="https://..."
            />
            {fieldErrors.desktopImage && <p className="text-red-600 text-xs mt-1">{fieldErrors.desktopImage}</p>}
            {form.desktopImage && (
              <img
                src={form.desktopImage}
                alt="Preview"
                className="mt-2 w-full h-40 object-cover rounded border border-stone-200"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </>
        ) : (
          <>
            <input
              key="desktop-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={(e) => setDesktopImageFile(e.target.files?.[0] || null)}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-wine-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-gold-300"
            />
            <p className="mt-1 text-xs text-stone-500">JPEG, PNG, WebP, GIF or AVIF; maximum 5 MB.</p>
            {desktopImageFile && (
              <img
                src={URL.createObjectURL(desktopImageFile)}
                alt="Preview"
                className="mt-2 w-full h-40 object-cover rounded border border-stone-200"
              />
            )}
          </>
        )}
      </div>

      {/* Mobile Image — URL or file upload, optional */}
      <div>
        <span className="text-sm font-semibold text-stone-700 block mb-2">Mobile Image (optional)</span>
        <div className="mb-2 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="radio"
              name="mobileImageSource"
              checked={mobileImageSource === "url"}
              onChange={() => setMobileImageSource("url")}
            />
            Paste image URL
          </label>
          <label className="flex items-center gap-2 font-medium">
            <input
              type="radio"
              name="mobileImageSource"
              checked={mobileImageSource === "file"}
              onChange={() => setMobileImageSource("file")}
            />
            Upload from device
          </label>
        </div>

        {mobileImageSource === "url" ? (
          <>
            <input
              key="mobile-url-input"
              value={form.mobileImage}
              onChange={(e) => handleChange("mobileImage", e.target.value)}
              className={inputClass("mobileImage")}
              placeholder="https://... (falls back to desktop image if left blank)"
            />
            {fieldErrors.mobileImage && <p className="text-red-600 text-xs mt-1">{fieldErrors.mobileImage}</p>}
          </>
        ) : (
          <>
            <input
              key="mobile-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={(e) => setMobileImageFile(e.target.files?.[0] || null)}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-wine-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-gold-300"
            />
            <p className="mt-1 text-xs text-stone-500">Leave unselected to fall back to the desktop image on mobile.</p>
            {mobileImageFile && (
              <img
                src={URL.createObjectURL(mobileImageFile)}
                alt="Preview"
                className="mt-2 w-full h-40 object-cover rounded border border-stone-200"
              />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Button Text (optional)</label>
          <input
            value={form.buttonText}
            onChange={(e) => handleChange("buttonText", e.target.value)}
            className={inputClass("buttonText")}
            placeholder="e.g. Explore Collection (leave blank for no button)"
          />
          <p className="text-xs text-stone-400 mt-1">Leave blank to hide the button on the banner.</p>
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Button URL (optional)</label>
          <input
            value={form.buttonUrl}
            onChange={(e) => handleChange("buttonUrl", e.target.value)}
            className={inputClass("buttonUrl")}
            placeholder="/products"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Start Date (optional)</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            className={inputClass("startDate")}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">End Date (optional)</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            className={inputClass("endDate")}
          />
        </div>
      </div>
      <p className="text-xs text-stone-400 -mt-3">Leave both blank for a banner that's always shown while active.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className={inputClass("status")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Display Order</label>
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => handleChange("displayOrder", e.target.value)}
            className={inputClass("displayOrder")}
          />
          <p className="text-xs text-stone-400 mt-1">Lower numbers show first in the carousel.</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider gold-border shadow hover:brightness-110 disabled:opacity-60"
        >
          {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Banner"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/banners")}
          className="px-6 py-2.5 border border-stone-300 text-stone-700 font-bold text-xs rounded uppercase tracking-wider hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}