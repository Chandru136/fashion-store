-- New orders default to online payment; preserve historical payment records.
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'ONLINE';
