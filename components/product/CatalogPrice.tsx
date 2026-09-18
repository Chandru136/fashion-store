"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

const ranges = [
  { label: "Up to ₹2,000", min: "", max: "2000" },
  { label: "₹2,000 – ₹5,000", min: "2000", max: "5000" },
  { label: "₹5,000 – ₹10,000", min: "5000", max: "10000" },
  { label: "₹10,000 and above", min: "10000", max: "" },
];

export function CatalogPrice({ minimum, maximum }: { minimum: string; maximum: string }) {
  const [min, setMin] = useState(minimum);
  const [max, setMax] = useState(maximum);
  return <fieldset className="space-y-3 border-b border-stone-200 pb-5">
    <legend className="mb-3 text-sm font-bold text-wine-900">Price</legend>
    <div className="space-y-2">
      {ranges.map(range => {
        const active = min === range.min && max === range.max;
        return <button key={range.label} type="button" aria-pressed={active} onClick={() => { setMin(range.min); setMax(range.max); }} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${active ? "bg-wine-100 font-semibold text-wine-900" : "text-stone-600 hover:bg-stone-100"}`}>
          <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-wine-800 bg-wine-800 text-white" : "border-stone-400"}`}>{active && <Check className="h-3 w-3" />}</span>{range.label}
        </button>;
      })}
    </div>
    <p className="text-xs text-stone-500">Or set your budget</p>
    <div className="grid grid-cols-2 gap-2">
      <label className="space-y-1 text-xs text-stone-600">Min (₹)<input name="minPrice" aria-label="Minimum price in rupees" type="number" min="0" max={max || undefined} step="any" value={min} onChange={event => setMin(event.target.value)} placeholder="0" className="w-full rounded border border-stone-300 bg-white p-2" /></label>
      <label className="space-y-1 text-xs text-stone-600">Max (₹)<input name="maxPrice" aria-label="Maximum price in rupees" type="number" min={min || "0"} step="any" value={max} onChange={event => setMax(event.target.value)} placeholder="Any" className="w-full rounded border border-stone-300 bg-white p-2" /></label>
    </div>
  </fieldset>;
}
