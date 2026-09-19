export type ListParams = Record<string, string | string[] | undefined>;
export type ListPageProps = { searchParams: Promise<ListParams> };
export type Option = { value: string; label: string };
export const options = (values: readonly string[]): Option[] => values.map(value => ({ value, label: value.replaceAll("_", " ") }));
export const dateSorts = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }];
export const nameSorts = [...dateSorts, { value: "name", label: "Name: A–Z" }];
export const priceSorts = [...dateSorts, { value: "price_asc", label: "Price: low to high" }, { value: "price_desc", label: "Price: high to low" }];
export const productSorts = [{ value: "featured", label: "Featured" }, { value: "bestseller", label: "Bestsellers" }, ...priceSorts];
export function value(params: ListParams, key: string) {
  const raw = params[key];
  return (typeof raw === "string" ? raw : raw?.[0] || "").trim().slice(0, 200);
}
export function choice(params: ListParams, key: string, allowed: readonly string[], fallback = "") {
  const candidate = value(params, key);
  return allowed.includes(candidate) ? candidate : fallback;
}
export function positiveInteger(raw: unknown, fallback = 1, max = 2147483647) {
  const number = Number(raw);
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number, max) : fallback;
}
export function pagination(total: number, requested: unknown, size = 25) {
  const take = positiveInteger(size, 25, 100);
  const totalPages = Math.max(1, Math.ceil(total / take));
  const currentPage = Math.min(totalPages, positiveInteger(requested));
  return { totalCount: total, totalPages, currentPage, skip: (currentPage - 1) * take, take };
}
export function listUrl(path: string, params: ListParams, updates: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, raw]) => {
    if (Array.isArray(raw)) raw.forEach(item => query.append(key, item));
    else if (raw) query.set(key, raw);
  });
  Object.entries(updates).forEach(([key, raw]) => {
    query.delete(key);
    if (raw !== undefined && raw !== "") query.set(key, String(raw));
  });
  return `${path}${query.size ? `?${query}` : ""}`;
}
export function nonnegativeNumber(raw: unknown) {
  if (raw === undefined || raw === "") return undefined;
  const number = Number(raw);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}
