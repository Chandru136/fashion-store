# Sudha Collections list features

The project uses Next.js server pages and Prisma. List controls submit GET forms; query parameters are the source of truth. Filtering and sorting happen in database queries before `skip`/`take`, so they apply to the entire matching dataset.

## Page audit and implementation

| Page | Search | Filters | Sort | Pagination |
| --- | --- | --- | --- | --- |
| `/products`, `/search`, `/category/[slug]` | Existing header search only; no listing search field | Category context, budget presets/custom range, multi-select fabric, occasion, colour | Featured, bestseller priority, newest, price | 12 products |
| `/admin/products` | Name, SKU | Product status | Date, price | 25 products |
| `/admin/orders` | Order number, shipping name, phone | Every order status in the schema | Date, total amount | 25 orders |
| `/admin/customers` | Name, email, account/address phone | Existing customer/admin role selection, account status | Date joined, name | 25 accounts |
| `/admin/inventory` | Product name, variant SKU | In stock, low stock, out of stock | Available stock ascending/descending | 25 variants |
| `/admin/categories` | Name, slug | — | Existing display order | — |
| `/admin/brands` | Name, slug | — | Existing newest-first order | — |
| `/admin/banners` | Title | Status, hero/promo placement | Existing display order or title | — |
| `/admin/payments` | — | Existing operational queue selection | Existing queue priorities, with deterministic tie breakers | Three independent queues, 25 records each |
| `/orders` | Order number, purchased product name | Order status | Date | 10 orders |
| `/wishlist` | Saved product name | — | Date saved, price | 12 saved products |

Categories, brands, and banners are small configuration lists. Keep their full display visible; the shared paginator can be added if those datasets grow. Payment queues retain their operational priorities and only need pagination to remove the old 50-record ceiling.

The header already provides a search entry point into `/search`. Home collections, related products, and dashboard recent orders are intentionally limited previews, not complete lists. Product detail currently shows a review count rather than a review list. Registration, login, profile, product/banner create and edit forms, order detail, order success, cart, checkout, and saved addresses do not need these list controls. Saved address and checkout choices remain visible together.

## Shared implementation

- `lib/listing.ts`: query text normalization, allowed-value validation, price parsing, pagination arithmetic, URL merging, and reusable sort options.
- `components/common/ListControls.tsx`: optional search, filter, and sort fields; independently usable `Pagination`.
- `components/product/ProductListing.tsx`: one catalog implementation used by all three storefront routes.
- Domain services/pages define their own Prisma predicates, allowed filters, and sort fields. Authentication and ownership predicates stay in their existing server code.

Search/filter/sort submissions omit the old `page`, preserve other query parameters, and use an explicit Apply button. Pagination retains the current query and route. Reset clears the controls; catalog reset preserves its category context. Unknown enum filters are ignored, unsafe page values fall back to page 1, and excessive page numbers clamp to the last page. First/Previous/Next/Last navigation stays bounded even for large datasets. Empty results display an explanation.

Inventory counts and status filters use each inventory record's `lowStockThreshold`; summary cards remain global. Payment queues use `refundPage`, `eventPage`, and `errorPage`, so navigating one queue preserves the other two. Customer lists retain the existing requirement to select an account role before displaying data.

## Reuse on another page

Search only:

```tsx
<ListControls path="/admin/brands" params={params} search="Search brands" />
```

Pagination only (after a server-side count and fetch):

```tsx
const paging = pagination(await prisma.brand.count({ where }), value(params, "page"));
const brands = await prisma.brand.findMany({
  where,
  orderBy: [{ name: "asc" }, { id: "asc" }],
  skip: paging.skip,
  take: paging.take,
});
// Render brands, then:
<Pagination path="/admin/brands" params={params} {...paging} />
```

Add filter and sort controls only when needed:

```tsx
<ListControls
  path="/admin/products"
  params={params}
  search="Product name or SKU"
  sorts={priceSorts}
  filters={[{ key: "status", label: "Status", options: options(["ACTIVE", "DRAFT"]) }]}
/>
```

The page must validate the selected values with `choice()` and implement the corresponding Prisma predicate/order. UI configuration alone does not query data. Use the same `where` for count and fetch and include `id` as a stable sort tie breaker. No schema migration or dependency installation is required.

## Validation

Run `npm run test:listing`, `npx tsc --noEmit`, and lint the changed files. The listing tests cover malformed parameters, query retention, independent payment pagination, search-only rendering, combined catalog query predicates, category misses, and inventory thresholds. Database-query tests mock Prisma; they do not validate a live PostgreSQL connection.

For a manual database smoke test, combine a search, filter, and sort in the catalog, navigate forward and back, reset within a category, try a page beyond the end, inspect an empty result, and verify each payment queue can be paged independently. Sign in as separate customers to verify order history and wishlist isolation. Check the controls on a narrow mobile viewport.

## Customer catalog update

The storefront now uses its own shopping controls in `CatalogFilters.tsx`, `CatalogPrice.tsx`, and `CatalogSort.tsx`. Admin pages continue using the existing shared controls without changes.

Customers select checkboxes populated from active products in the current category/search context. Several selections within one group match any selected value; different groups combine together. Budget presets fill the price inputs, then Apply filters submits all selections together. The sort dropdown updates immediately. Applied-filter tags can remove one choice, and Clear all preserves the category and existing header search context. Pagination retains repeated filter parameters.

Reference: [Flipkart saree catalog](https://www.flipkart.com/womens-sarees/pr?sid=9og) and [saree shopping guide](https://www.flipkart.com/sarees-store), whose indexed content groups discovery by price, colour, fabric and occasion. Direct Amazon and Flipkart listing access was restricted, so this implementation follows the available catalog information rather than claiming a pixel-for-pixel reproduction.
