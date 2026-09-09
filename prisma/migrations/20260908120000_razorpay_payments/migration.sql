ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "checkoutKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_checkoutKey_key" ON "Order"("checkoutKey");
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gatewayOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "amountPaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");
