import { CatalogPrice } from "./CatalogPrice";
import React from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { catalogFilterKeys, selectedValues, facetOptions, type CatalogFacets } from "@/lib/catalog-filters";
import { listUrl, value, type ListParams } from "@/lib/listing";

const labels = { fabric: "Fabric", color: "Colour", occasion: "Occasion" };
const swatches: Record<string, string> = { red: "#b91c1c", blue: "#2563eb", green: "#15803d", yellow: "#eab308", pink: "#ec4899", purple: "#9333ea", black: "#171717", white: "#fff", orange: "#ea580c", gold: "#ca8a04", silver: "#cbd5e1", maroon: "#7f1d1d", beige: "#e8d6b5", brown: "#92400e", grey: "#78716c", gray: "#78716c" };

export function CatalogFilters({ params, path, facets }: { params: ListParams; path: string; facets: CatalogFacets }) {
  const clear = listUrl(path, params, { fabric: undefined, color: undefined, occasion: undefined, minPrice: undefined, maxPrice: undefined, page: undefined });
  return <aside className="min-w-0 rounded-xl border border-stone-200 bg-ivory-50 p-5 lg:sticky lg:top-6 lg:self-start">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-wine-900"><SlidersHorizontal className="h-4 w-4" /> Filters</h2>
      <Link href={clear} className="text-xs font-semibold text-wine-800 underline">Clear all</Link>
    </div>
    <details open className="group">
      <summary className="mb-4 cursor-pointer text-sm font-semibold text-stone-600">Choose price, colour & fabric</summary>
      <form key={JSON.stringify(params)} action={path} className="space-y-5">
        {["category", "q", "sort"].map(key => value(params, key) ? <input key={key} type="hidden" name={key} value={value(params, key)} /> : null)}
        <CatalogPrice minimum={value(params, "minPrice")} maximum={value(params, "maxPrice")} />
        {catalogFilterKeys.map(key => {
          const selected = selectedValues(params, key);
          const choices = facetOptions([...facets[key], ...selected]);
          return <fieldset key={key} className="border-b border-stone-200 pb-5">
            <legend className="mb-3 text-sm font-bold text-wine-900">{labels[key]}</legend>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {choices.map(option => <label key={option} className="flex cursor-pointer items-center gap-2 rounded py-1 text-sm text-stone-700">
                <input type="checkbox" name={key} value={option} defaultChecked={selected.some(item => item.toLowerCase() === option.toLowerCase())} className="h-4 w-4 shrink-0 accent-wine-800" />
                {key === "color" && swatches[option.toLowerCase()] && <span aria-hidden="true" style={{ backgroundColor: swatches[option.toLowerCase()] }} className="h-4 w-4 shrink-0 rounded-full border border-stone-300" />}
                {option}
              </label>)}
              {!choices.length && <p className="text-xs text-stone-500">No options available.</p>}
            </div>
          </fieldset>;
        })}
        <button type="submit" className="w-full rounded-lg wine-gradient-bg px-4 py-3 text-sm font-bold text-gold-300">Apply filters</button>
      </form>
    </details>
  </aside>;
}

export function ActiveCatalogFilters({ params, path }: { params: ListParams; path: string }) {
  const chips = catalogFilterKeys.flatMap(key => selectedValues(params, key).map(item => {
    const remaining = selectedValues(params, key).filter(entry => entry !== item);
    const next = { ...params, [key]: remaining };
    return { label: `${labels[key]}: ${item}`, href: listUrl(path, next, { page: undefined }) };
  }));
  if (value(params, "minPrice") || value(params, "maxPrice")) chips.push({ label: `Price: ₹${value(params, "minPrice") || "0"} – ${value(params, "maxPrice") ? `₹${value(params, "maxPrice")}` : "Any"}`, href: listUrl(path, params, { minPrice: undefined, maxPrice: undefined, page: undefined }) });
  if (!chips.length) return null;
  return <div aria-label="Applied filters" className="flex flex-wrap gap-2">{chips.map(chip => <Link key={chip.label} href={chip.href} aria-label={`Remove ${chip.label}`} className="inline-flex items-center gap-2 rounded-full border border-wine-200 bg-ivory-50 px-3 py-1.5 text-xs text-wine-900">{chip.label}<X aria-hidden="true" className="h-3 w-3" /></Link>)}</div>;
}
