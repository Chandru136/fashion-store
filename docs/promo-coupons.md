# Sudha Collections promo coupons

Open **Admin portal → Promo Coupons** (`/admin/coupons`).

## Included

- List, search by code, filter by effective status/discount type, sort and paginate.
- Global summary counts: total, active, scheduled and expired.
- Create percentage or fixed-amount discounts; generate an `SC-` code or enter a manual code.
- Minimum merchandise subtotal, optional percentage-discount cap, optional total redemption limit, and per-customer usage limit.
- Start/end dates entered and displayed in IST, independent of the administrator's device timezone.
- View full coupon details, current reservations/redemptions, and the number of historical orders.
- Edit rules or deactivate a coupon. Codes remain immutable so order history and customer limits stay associated with the original code.
- Delete an unused coupon through a confirmation dialog. Coupons with order history cannot be deleted; deactivate them instead.
- Authorization checks against the current database user's active status and `MANAGE_COUPONS` permission on every page and mutation. Only Admin/Super Admin currently have that permission.
- Audit records for creation, updates and deletion.

Dates and limits determine Active, Scheduled, Expired or Exhausted automatically; Inactive explicitly disables an offer. Enabling an expired coupon does not extend its end date. Existing order totals are never recalculated when coupon rules change.

## Checkout compatibility

The existing Coupon model supports all these settings, so no schema migration is required. Offers apply storewide to the merchandise subtotal; checkout currently accepts one coupon per order. Product/category-specific offers, free shipping and discount stacking are not exposed because the existing checkout does not implement them.

Admin edits/deletes share checkout's PostgreSQL coupon advisory lock, preventing changes from racing a redemption. Usage cannot be reset from the form or set below the current reservation count. Historical coupon codes cannot be recreated against old orders.

The coupon validator now uses the supplied transaction for per-customer counts and caps discounts to the subtotal while preserving two-decimal currency amounts.

## Reference

The form's discount rules, limits and schedule follow the management patterns documented by [WooCommerce](https://woocommerce.com/document/coupon-management/) and [Shopify](https://help.shopify.com/en/manual/discounts/discount-methods/discount-codes). The layout uses the existing Sudha Collections admin styles.

## Verification

Run `npm run test:coupons`, `npm run test:listing`, `npm run test:payments`, `npx tsc --noEmit`, and ESLint on the coupon files. Unit tests exercise validation, IST conversion, effective statuses, checkout eligibility/limits, decimal discounts and rejection without a request session. They use mocked checkout data; live database CRUD, concurrent redemption and browser interactions still require a connected test environment.

Manual smoke test: sign in as an administrator, create `SC-TEST10` inactive, view it, edit its dates and limits, enable it, apply it at checkout, then deactivate it. Separately create and delete an unused inactive coupon. Verify non-admin roles cannot access the page or invoke mutations, duplicates are rejected, and used coupons cannot be deleted.
