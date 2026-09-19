import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { choice, listUrl, nonnegativeNumber, pagination, value } from "../lib/listing";
import { ListControls, Pagination } from "../components/common/ListControls";
import { prisma } from "../lib/db";
import { getProducts, getProductFacets } from "../lib/services/product.service";
import { CatalogFilters, ActiveCatalogFilters } from "../components/product/CatalogFilters";
import { facetOptions, selectedValues } from "../lib/catalog-filters";
import { getInventoryOverview } from "../lib/services/inventory.service";

// Prisma delegates are proxies; mock a plain holder and install the function on the delegate.
function stub<T extends object, K extends keyof T>(t: TestContext, target: T, key: K, implementation: (...args: never[]) => unknown) {
  const original = target[key];
  const holder = { method: original as (args: { where?: Record<string, unknown>; skip?: number; take?: number; orderBy?: unknown }) => unknown };
  const mocked = t.mock.method(holder, "method", implementation);
  target[key] = mocked as T[K];
  t.after(() => { target[key] = original; });
  return mocked;
}

test("pagination validates malformed input and clamps to the last available page", () => {
  for (const input of ["bad", "Infinity", "-2", "0", "1.5", "9007199254740992"]) {
    assert.equal(pagination(60, input).currentPage, 1);
  }
  assert.deepEqual(pagination(60, "99"), { totalCount: 60, totalPages: 3, currentPage: 3, skip: 50, take: 25 });
  assert.equal(pagination(0, "3").skip, 0);
  assert.equal(pagination(1000, 1, 10000).take, 100);
});

test("URL updates preserve search, filters, sort and repeated parameters", () => {
  const url = new URL(listUrl("/category/silk", { q: "silk & cotton", fabric: "Soft Silk", sort: "price_asc", tag: ["one", "two"], page: "3" }, { page: 4 }), "https://example.test");
  assert.equal(url.pathname, "/category/silk");
  assert.equal(url.searchParams.get("q"), "silk & cotton");
  assert.equal(url.searchParams.get("fabric"), "Soft Silk");
  assert.equal(url.searchParams.get("sort"), "price_asc");
  assert.deepEqual(url.searchParams.getAll("tag"), ["one", "two"]);
  assert.equal(url.searchParams.get("page"), "4");
  assert.equal(listUrl("/products", { q: "silk", page: "2" }, { q: "", page: undefined }), "/products");
});

test("search and filter values are bounded and invalid choices cannot reach enum queries", () => {
  assert.equal(value({ q: [" silk ", "cotton"] }, "q"), "silk");
  assert.equal(value({ q: "a".repeat(300) }, "q").length, 200);
  assert.equal(choice({ status: "INVALID" }, "status", ["PENDING"]), "");
  for (const input of ["NaN", "Infinity", "-10", ""]) assert.equal(nonnegativeNumber(input), undefined);
  assert.equal(nonnegativeNumber("0"), 0);
});

test("search-only controls preserve context but discard the old page", () => {
  const html = renderToStaticMarkup(React.createElement(ListControls, {
    path: "/products", params: { page: "4", category: "silk", sort: "newest" }, search: "Search", preserve: ["category"],
  }));
  assert.match(html, /action="\/products"/);
  assert.match(html, /name="category" value="silk"/);
  assert.match(html, /name="sort" value="newest"/);
  assert.doesNotMatch(html, /name="page"|<select/);
  assert.match(html, /href="\/products\?category=silk"/);
});

test("pagination-only queues preserve the other queues and have bounded navigation", () => {
  const html = renderToStaticMarkup(React.createElement(Pagination, {
    path: "/admin/payments", params: { eventPage: "7" }, pageKey: "refundPage", label: "Refunds",
    ...pagination(100000, 2),
  }));
  assert.match(html, /eventPage=7&amp;refundPage=3/);
  assert.equal((html.match(/<a /g) || []).length, 4);
  const empty = renderToStaticMarkup(React.createElement(Pagination, { path: "/products", params: {}, ...pagination(0, 1) }));
  assert.doesNotMatch(empty, /<a /);
  assert.match(empty, /No matching results/);
});

test("catalog applies combined filters before counting and fetching the requested database page", async (t) => {
  const count = stub(t, prisma.product, "count", async () => 61);
  const find = stub(t, prisma.product, "findMany", async () => []);
  stub(t, prisma.category, "findUnique", async () => ({ id: "parent", children: [{ id: "child" }] }));
  const result = await getProducts({ categorySlug: "silk", searchQuery: "wedding", fabric: "silk", color: "red", minPrice: 100, maxPrice: 5000, sort: "price_asc", page: 3 });
  const args = find.mock.calls[0].arguments[0]!;
  assert.deepEqual(args.where, count.mock.calls[0].arguments[0]!.where);
  assert.deepEqual(args.where?.categoryId, { in: ["parent", "child"] });
  assert.deepEqual(args.where?.sellingPrice, { gte: 100, lte: 5000 });
  assert.equal(args.skip, 24);
  assert.equal(args.take, 12);
  assert.deepEqual(args.orderBy, [{ sellingPrice: "asc" }, { id: "asc" }]);
  assert.equal(result.totalPages, 6);
});

test("unknown categories cannot accidentally show the entire catalog", async (t) => {
  stub(t, prisma.category, "findUnique", async () => null);
  const count = stub(t, prisma.product, "count", async () => 0);
  stub(t, prisma.product, "findMany", async () => []);
  await getProducts({ categorySlug: "missing" });
  assert.deepEqual(count.mock.calls[0].arguments[0]!.where?.id, { in: [] });
});

test("inventory filters use per-variant thresholds and leave overview totals unfiltered", async (t) => {
  const counts = stub(t, prisma.inventory, "count", async () => 26);
  const aggregate = stub(t, prisma.inventory, "aggregate", async () => ({ _sum: { availableStock: 80, reservedStock: 4 } }));
  const find = stub(t, prisma.inventory, "findMany", async () => []);
  const result = await getInventoryOverview({ stock: "LOW_STOCK", q: "SC-", page: "2" });
  const args = find.mock.calls[0].arguments[0]!;
  assert.deepEqual(args.where, counts.mock.calls[0].arguments[0]!.where);
  assert.deepEqual(args.where?.availableStock, { gt: 0, lte: prisma.inventory.fields.lowStockThreshold });
  assert.equal(args.skip, 25);
  assert.equal(aggregate.mock.calls[0].arguments[0]!.where, undefined);
  assert.equal(result.totalAvailable, 80);
});

test("customer filters offer checkboxes from the catalog without a product-name input", () => {
  const html = renderToStaticMarkup(React.createElement(CatalogFilters, {
    path: "/category/silk", params: { color: ["Red", "Blue"], fabric: "Soft Silk", page: "4", q: "wedding" },
    facets: { color: ["Red", "Blue"], fabric: ["Soft Silk"], occasion: ["Wedding"] },
  }));
  assert.doesNotMatch(html, /type="search"|type="text"|name="page"/);
  assert.match(html, /type="hidden" name="q" value="wedding"/);
  assert.match(html, /type="checkbox"[^>]*name="color" checked="" value="Red"/);
  assert.match(html, /type="checkbox"[^>]*name="color" checked="" value="Blue"/);
  assert.match(html, /name="minPrice"/);
  assert.match(html, /Apply filters/);
});

test("removing one customer filter preserves other selections, sort and category", () => {
  const html = renderToStaticMarkup(React.createElement(ActiveCatalogFilters, {
    path: "/category/silk", params: { color: ["Red", "Blue"], fabric: "Soft Silk", sort: "price_asc", page: "3" },
  }));
  assert.match(html, /href="\/category\/silk\?color=Blue&amp;fabric=Soft\+Silk&amp;sort=price_asc"/);
  assert.doesNotMatch(html, /page=3/);
});

test("multiple selections use OR within a facet and AND across facets", async (t) => {
  const count = stub(t, prisma.product, "count", async () => 0);
  stub(t, prisma.product, "findMany", async () => []);
  await getProducts({ color: ["Red", "Blue"], fabric: ["Silk", "Cotton"], occasion: ["Wedding"], minPrice: 1000 });
  const where = count.mock.calls[0].arguments[0]!.where!;
  assert.deepEqual(where.fabric, { in: ["Silk", "Cotton"], mode: "insensitive" });
  assert.deepEqual(where.variants, { some: { color: { in: ["Red", "Blue"], mode: "insensitive" } } });
  assert.deepEqual(where.occasion, { in: ["Wedding"], mode: "insensitive" });
  assert.deepEqual(where.sellingPrice, { gte: 1000 });
});

test("facet options use active products in the category context and remove empty or duplicate labels", async (t) => {
  stub(t, prisma.category, "findUnique", async () => ({ id: "silk", children: [] }));
  const products = stub(t, prisma.product, "findMany", async () => [{ fabric: "Silk", occasion: "Wedding" }, { fabric: "silk", occasion: null }]);
  stub(t, prisma.productVariant, "findMany", async () => [{ color: "Red" }, { color: null }]);
  const facets = await getProductFacets({ categorySlug: "silk" });
  assert.deepEqual(products.mock.calls[0].arguments[0]!.where, { status: "ACTIVE", categoryId: { in: ["silk"] } });
  assert.equal(facets.fabric.length, 1);
  assert.deepEqual(facets.color, ["Red"]);
  assert.deepEqual(facetOptions([null, "", " ", "Red", "red"]), ["red"]);
  assert.deepEqual(selectedValues({ color: [" Red ", "Red", "Blue", ""] }, "color"), ["Red", "Blue"]);
});
