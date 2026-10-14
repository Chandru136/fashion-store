# Sudha Collections editorial collections

The admin menu at `/admin/collections` manages the homepage's **Our world of beautiful weaves** section. Categories organise the catalogue; editorial collections introduce a theme and link shoppers to a category or filtered catalogue. The Homepage CMS separately controls lookbook and heritage stories.

Start with **The Bridal Edit**, **Festive Favourites**, **Everyday Cotton**, or **The Silk Heritage Edit**. The page provides these as unsaved draft starters, with editable descriptions and inspiration images. Replace the covers with your own product photography and check each destination has relevant merchandise.

Each collection has a name, unique internal slug, short story, cover, optional mobile cover, button text, shopping destination, status and display order. Uploads support JPG, PNG, WebP, GIF and AVIF up to 5 MB. A mobile cover falls back to the main cover when omitted.

Save as Draft / hidden while preparing. Active collections appear immediately after saving; only the first six are shown, in ascending display order with ID as the tie-breaker. If there are no active collections, the homepage retains its existing inspiration cards. Deleting a collection never deletes products.

The shopping destination supports `/products`, filtered catalogue URLs such as `/products?occasion=Wedding`, and category URLs such as `/category/silk-sarees`. These are links to existing catalogue selections, not manually assigned product groups or separate collection landing pages. The slug is an internal identifier.

Access is restricted to roles with `MANAGE_COLLECTIONS`: super admin, admin, product manager and content manager. Server mutations and collection uploads check the same permission.

## Database setup

The additive migration `20261005120000_collection_destination` adds `Collection.buttonUrl`, defaulting existing collections to `/products`. Apply migrations and regenerate Prisma before starting or restarting the app:

```sh
npx prisma migrate deploy
npx prisma generate
```

Review the destination on existing collections after the upgrade. No existing content or products are removed. Uploaded images use the existing local product-image storage, so the deployment must retain `public/uploads/products`.

## Validation

```sh
node --import tsx --test tests/collections.test.ts
npx tsc --noEmit
```
