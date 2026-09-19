"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { listUrl, productSorts, type ListParams } from "@/lib/listing";

export function CatalogSort({ params, path, sort }: { params: ListParams; path: string; sort: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="flex items-center gap-2" aria-busy={pending}>
    <label htmlFor="catalog-sort" className="whitespace-nowrap text-sm text-stone-600">Sort by</label>
    <select id="catalog-sort" value={sort} disabled={pending} onChange={event => {
      const next = listUrl(path, params, { sort: event.target.value, page: undefined });
      startTransition(() => router.push(next, { scroll: false }));
    }} className="min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-wine-900 disabled:opacity-60">
      {productSorts.filter(option => option.value !== "oldest").map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {pending && <span role="status" className="text-xs text-stone-500">Updating…</span>}
  </div>;
}
