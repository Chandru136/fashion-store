import React from "react";
import Link from "next/link";
import { listUrl, value, type ListParams, type Option } from "@/lib/listing";

type Field = { key: string; label: string; options?: Option[]; type?: "text" | "number" };
export function ListControls({ path, params, search, sorts, defaultSort, filters = [], preserve = [] }: {
  path: string; params: ListParams; search?: string; sorts?: Option[]; defaultSort?: string; filters?: Field[]; preserve?: string[];
}) {
  const fields: Field[] = [...(search ? [{ key: "q", label: search }] : []), ...filters,
    ...(sorts ? [{ key: "sort", label: "Sort by", options: sorts }] : [])];
  const managed = new Set([...fields.map(field => field.key), "page"]);
  return <form key={JSON.stringify(params)} action={path} className="flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-ivory-50 p-4">
    {Object.entries(params).filter(([key]) => !managed.has(key)).map(([key, raw]) =>
      (Array.isArray(raw) ? raw : [raw]).map((entry, i) => entry ? <input key={`${key}-${i}`} type="hidden" name={key} value={entry} /> : null))}
    {fields.map(field => <label key={field.key} className="flex flex-col gap-1 text-xs font-semibold text-stone-700">
      {field.label}
      {field.options ? <select name={field.key} defaultValue={value(params, field.key) || (field.key === "sort" ? defaultSort || field.options[0]?.value : "")} className="rounded border border-stone-300 bg-white px-3 py-2">
        {field.key !== "sort" && <option value="">All</option>}
        {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select> : <input name={field.key} type={field.type || "search"} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? "any" : undefined} maxLength={200} defaultValue={value(params, field.key)} className="rounded border border-stone-300 px-3 py-2" />}
    </label>)}
    <button type="submit" className="wine-gradient-bg rounded px-4 py-2 text-xs font-bold text-gold-300">Apply</button>
    <Link href={listUrl(path, Object.fromEntries(preserve.map(key => [key, params[key]])), {})} className="py-2 text-xs text-wine-900 underline">Reset</Link>
  </form>;
}
export function Pagination({ path, params, totalCount, totalPages, currentPage, pageKey = "page", label = "Results" }: {
  path: string; params: ListParams; totalCount: number; totalPages: number; currentPage: number; pageKey?: string; label?: string;
}) {
  return <nav aria-label={`${label} pagination`} className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 py-4 text-sm">
    <p role="status">{totalCount} {label.toLowerCase()}{totalCount > 0 && ` · Page ${currentPage} of ${totalPages}`}</p>
    {totalCount === 0 && <p>No matching results. Try changing your search or filters.</p>}
    {totalPages > 1 && <div className="flex flex-wrap gap-4 text-wine-900 underline">
      {currentPage > 1 && <><Link href={listUrl(path, params, { [pageKey]: 1 })}>First</Link><Link href={listUrl(path, params, { [pageKey]: currentPage - 1 })}>Previous</Link></>}
      {currentPage < totalPages && <><Link href={listUrl(path, params, { [pageKey]: currentPage + 1 })}>Next</Link><Link href={listUrl(path, params, { [pageKey]: totalPages })}>Last</Link></>}
    </div>}
  </nav>;
}
