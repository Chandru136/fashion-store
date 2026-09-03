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

export default function BannerForm({ bannerId, initialData }: BannerFormProps) {
  const router = useRouter();
  const isEditing = !!bannerId;

  const [form, setForm] = useState<FormState>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    desktopImage: initialData?.desktopImage || "",
    mobileImage: initialData?.mobileImage || "",
    buttonText: initialData?.buttonText || "Shop Collection",
    buttonUrl: initialData?.buttonUrl || "/products",
    startDate: toDatetimeLocal(initialData?.startDate as any),
    endDate: toDatetimeLocal(initialData?.endDate as any),
    status: (initialData?.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    displayOrder: String(initialData?.displayOrder ?? 0),
  });

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

    const payload: BannerInput = {
      title: form.title,
      subtitle: form.subtitle || undefined,
      desktopImage: form.desktopImage,
      mobileImage: form.mobileImage || undefined,
      buttonText: form.buttonText || undefined,
      buttonUrl: form.buttonUrl || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
      displayOrder: Number(form.displayOrder) || 0,
    };

    const res = isEditing ? await updateBanner(bannerId!, payload) : await createBanner(payload);
    setIsLoading(false);

    if (res.success) {
      router.push("/admin/banners");
      router.refresh();
    } else {
      setError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
    }
  };

  const inputClass = (field: keyof BannerInput) =>
    `w-full px-3 py-2.5 border rounded text-sm focus:outline-none ${
      fieldErrors[field] ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5 bg-white p-6 rounded-xl border border-stone-200">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-stone-700 block mb-1">Title *</label>
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
        <label className="text-sm font-semibold text-stone-700 block mb-1">Desktop Image URL *</label>
        <input
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
      </div>

      <div>
        <label className="text-sm font-semibold text-stone-700 block mb-1">Mobile Image URL (optional)</label>
        <input
          value={form.mobileImage}
          onChange={(e) => handleChange("mobileImage", e.target.value)}
          className={inputClass("mobileImage")}
          placeholder="https://... (falls back to desktop image if left blank)"
        />
        {fieldErrors.mobileImage && <p className="text-red-600 text-xs mt-1">{fieldErrors.mobileImage}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Button Text</label>
          <input
            value={form.buttonText}
            onChange={(e) => handleChange("buttonText", e.target.value)}
            className={inputClass("buttonText")}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Button URL</label>
          <input
            value={form.buttonUrl}
            onChange={(e) => handleChange("buttonUrl", e.target.value)}
            className={inputClass("buttonUrl")}
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