# Razorpay checkout

Online Payment is enabled on checkout. Orders use server-calculated prices, persist a unique checkout key, reserve stock, and remain PENDING until a captured payment has been verified. Checkout supports online payment only.

## Local dummy payments (no API account)

Add to `.env`, then restart `npm run dev`:

```dotenv
PAYMENT_PROVIDER="MOCK"
ALLOW_MOCK_PAYMENTS="true"
```

Select Online Payment, then Pay Securely. The development dialog offers success (OK) or failure (Cancel), with no charge. Failure keeps the order pending; retry on its order details page. Mock payments are rejected in production even if the opt-in is enabled. Fake Razorpay keys do not work with the actual gateway.

## Razorpay test mode

```dotenv
PAYMENT_PROVIDER="RAZORPAY"
ALLOW_MOCK_PAYMENTS="false"
RAZORPAY_KEY_ID="rzp_test_your_actual_key"
RAZORPAY_KEY_SECRET="your_actual_test_secret"
RAZORPAY_WEBHOOK_SECRET="your_separate_random_webhook_secret"
```

Generate actual test keys in the Razorpay Dashboard. Restart the app after changing credentials. Configure automatic capture. Use Razorpay's current test payment details, not real card details:
https://razorpay.com/docs/payments/payments/test-card-details/

Create a Dashboard webhook pointing to:

`https://YOUR_DOMAIN/api/payments/razorpay/webhook`

Subscribe to `payment.captured`, `order.paid`, and `payment.authorized`. Set the same webhook secret as the server environment. Local webhook delivery requires a public HTTPS tunnel. Browser verification works locally without a tunnel, but test webhook recovery before going live.

The integration verifies the exact raw-body HMAC and fetches payment state from Razorpay. Browser callbacks also require an authenticated order owner and a valid checkout signature. Order, currency and integer paise must match the database. Only capture confirms an order. Duplicate events and concurrent callbacks are safe; failed or delayed events cannot downgrade a paid order.

## Database and installation

For an environment with a consistent migration history:

```sh
npm ci
npx prisma migrate deploy
npx prisma generate
npm run dev
```

This workspace's local database has older unapplied migrations. Only the additive SQL in `prisma/migrations/20260908120000_razorpay_payments/migration.sql` was applied locally; do not reset the database to resolve history. Review/baseline its existing migration history before deployment. The payment SQL uses IF NOT EXISTS so it is safe to apply after that review. Stop the dev server before `prisma generate` on Windows if it reports that the engine DLL is locked, then restart it.

## Tests

```sh
npm run test:payments
```

Database lifecycle tests use temporary, uniquely named records and clean up only those fixtures. Use a development/test database. In PowerShell:

```powershell
$env:RUN_PAYMENT_DB_TESTS="true"
npm run test:payments:integration
```

The tests cover checkout duplication, stock decrement once, owner checks, gateway-order reuse, wrong amount/currency/order rejection, authorization remaining pending, reconciliation after lost callbacks, and repeated/concurrent capture notifications. Gateway HTTP calls are mocked; these tests do not prove the account's live gateway configuration.

Manually test actual Razorpay test checkout success, failure, dismissal, browser disconnect after payment, webhook redelivery, and retry from `/orders/:id`.

## Live deployment

Use the same code with actual `rzp_live_...` credentials, production HTTPS, a separately configured live webhook and its secret, and automatic capture. Keep all secrets server-only. No NEXT_PUBLIC secret is needed; only the public key ID is sent to Checkout. Complete Razorpay account activation and verify allowed payment methods in the Dashboard.

Pending orders keep their inventory and coupon reservations and are recoverable from order details. There is deliberately no time-based release while a gateway order might still accept payment. Monitor abandoned orders and reconcile them operationally; automatic expiry/cancellation and automated refunds are not implemented. Refunds must be handled in the Dashboard with corresponding store records reconciled separately. Do not treat an admin status change as a gateway refund. Confirmation email/SMS delivery is also outside this payment integration.

Reference integration: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
Webhook reference: https://razorpay.com/docs/webhooks/faqs/

## Windows startup / unknown checkoutKey

`Unknown argument checkoutKey` means an old generated Prisma client is loaded. An EPERM engine-DLL rename means a running Node process is holding that DLL. Stop this project's dev server before generating; do not terminate unrelated Node applications. `npm run dev` intentionally does not regenerate Prisma automatically.

With this project stopped, run:

```powershell
npm.cmd run db:generate
npm.cmd run dev
```

After schema changes, regenerate with the server stopped and restart it. If Next.js still loads an old client, remove only the project's generated `.next` cache while the server is stopped. Keep your database and migrations intact.

## Sudha Collections credential check

The Razorpay Checkout merchant display name is Sudha Collections. Run `npm run payment:check` after adding actual Dashboard credentials to `.env`. This performs a read-only API request, prints no secrets, and creates no orders or charges. Blank credentials or changes only to `.env.example` cannot open Razorpay Checkout.
