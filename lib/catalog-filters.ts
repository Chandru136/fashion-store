import type { ListParams } from "./listing";

export const catalogFilterKeys = ["fabric", "color", "occasion"] as const;
export type CatalogFacets = Record<(typeof catalogFilterKeys)[number], string[]>;
export function selectedValues(params: ListParams, key: string): string[] {
  const raw = params[key];
  return [...new Set((Array.isArray(raw) ? raw : [raw || ""]).map(item => item.trim().slice(0, 200)).filter(Boolean))].slice(0, 30);
}
export function facetOptions(values: (string | null)[]) {
  return [...new Map(values.filter((item): item is string => Boolean(item?.trim())).map(item => [item.toLowerCase(), item])).values()]
    .sort((a, b) => a.localeCompare(b));
}
