# Sudha Collections product reviews

Customers sign in and submit one review per active product, with an integer rating from 1 to 5 and 10–2,000 characters of feedback. A successful save opens `/reviews/thank-you`; that page verifies ownership of the submitted review. Reviews are not restricted to verified purchasers. Published reviews show a green Verified purchase badge only when the reviewer's account has a PAID order containing that product with status CONFIRMED, PROCESSING, PACKED, SHIPPED, OUT_FOR_DELIVERY or DELIVERED. Pending, cancelled, returned and refunded orders do not qualify. Verification is checked server-side when displaying the review; admin publication alone does not grant the badge.

Manage reviews at `/admin/reviews` (Patron Reviews). The existing `MANAGE_REVIEWS` permission controls access to both the page and moderation actions. Accounts are checked against the database on each request.

- Pending → Approve → Approved (still private).
- Approved → Publish → Published (public and included in ratings).
- Pending/Approved → Reject → Rejected (private).
- Published → Unpublish → Approved (private again).
- Rejected → Approve → Approved, ready for a separate publishing decision.

Moderation writes an audit record and invalidates storefront caches. Server validation ignores any customer-supplied status/user ID. A PostgreSQL transaction lock prevents duplicate submissions, and conditional status updates protect against concurrent moderation.

Apply the migration with `npx prisma migrate deploy` before deploying the application. Existing APPROVED reviews were already public and are migrated to PUBLISHED to preserve their visibility. New reviews default to PENDING. Existing seed reviews remain APPROVED and require explicit publication.

Run focused tests with `node --import tsx --test tests/reviews.test.ts`. Public product listings, homepage cards, related products and product detail ratings all use PUBLISHED reviews. Products without published reviews have no rating instead of a fabricated five-star default.

For the database lifecycle check, set `RUN_REVIEW_DB_TESTS=true` and run `node --env-file=.env --import tsx --test tests/reviews.integration.test.ts`. The test creates temporary records inside one transaction and rolls them all back, including moderation audit entries.
