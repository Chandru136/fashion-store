-- Rename stored brand prefixes while preserving record IDs and relationships.
UPDATE "Order"
SET "orderNumber" = 'SC-' || substring("orderNumber" FROM 5)
WHERE "orderNumber" LIKE 'ARN-%';

UPDATE "Product"
SET "sku" = 'SC-' || substring("sku" FROM 5)
WHERE "sku" LIKE 'ARN-%';

UPDATE "ProductVariant"
SET "sku" = 'SC-' || substring("sku" FROM 5)
WHERE "sku" LIKE 'ARN-%';

UPDATE "OrderItem"
SET "sku" = 'SC-' || substring("sku" FROM 5)
WHERE "sku" LIKE 'ARN-%';
