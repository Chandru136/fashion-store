# Sudha Collections seed safety

The default `npm run db:seed` entry now adds only missing category reference rows. It does not create users, products, collections, banners, coupons, orders or payments. Existing category fields and relationships are preserved, including merchant edits and inactive status. Repeating the reference seed makes no additional records.

No seed or provisioning command was executed during this change. Review the target database before any future execution.

## Development fixtures

The original sample catalog remains in `prisma/seed-development.ts`, separate from reference data. It creates no administrators. Sample customer passwords are individually generated, hashed, and never printed; these accounts have no supplied login credentials.

All of these must be supplied deliberately:

- `NODE_ENV=development`
- `SUDHA_COLLECTIONS_SEED_MODE=development`
- `SUDHA_COLLECTIONS_ALLOW_DEV_FIXTURES=true`
- `SUDHA_COLLECTIONS_DEV_DATABASE_URL` pointing to a separate PostgreSQL database named `sudha_collections_dev`, `sudha_collections_test`, or a suffixed variant such as `sudha_collections_test_local`.

The fixture database must differ from the configured application database, even when connection credentials or query parameters differ. The guard cannot detect two different hostnames referring to the same server: use dedicated restricted credentials and a disposable database. Production mode rejects fixtures before constructing a client. Unknown seed modes fail closed.

Development fixtures preserve collections instead of deleting them. The legacy sample product/order inserts are intended for a fresh disposable database; they are not an idempotent production seed and repeated execution may encounter unique-key conflicts or partial fixture creation. Do not reset a real database to resolve such errors.

## Initial administrator

Administrator provisioning is separate from every seed mode: `npm run db:provision-admin`.

Supply `SUDHA_COLLECTIONS_PROVISION_ADMIN=true`, `SUDHA_COLLECTIONS_ADMIN_EMAIL`, and `SUDHA_COLLECTIONS_ADMIN_PASSWORD` through a trusted process environment or secret manager. Use a newly generated unique random secret, at least 32 characters and at most 72 UTF-8 bytes. Do not commit it or place it in command-line arguments. The script has no fallback password and logs neither credentials nor raw database errors.

Provisioning uses a transaction and advisory lock. It refuses when an ADMIN/SUPER_ADMIN or the requested email already exists. It never upgrades an existing account, resets a password, or overwrites a user. Concurrent provisioning still requires disposable-database verification. Remove the supplied secret from the environment after use.

Existing demo accounts are not inspected, removed, or rotated by this change. If fixtures were previously deployed, review and remediate those accounts separately with explicit authorization.
