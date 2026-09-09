-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "inventoryCommittedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryReleasedAt" TIMESTAMP(3),
ALTER COLUMN "billingName" DROP DEFAULT,
ALTER COLUMN "billingPhone" DROP DEFAULT,
ALTER COLUMN "billingAddress" DROP DEFAULT,
ALTER COLUMN "billingCity" DROP DEFAULT,
ALTER COLUMN "billingState" DROP DEFAULT,
ALTER COLUMN "billingPincode" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "nextReconcileAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reconcileAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundedPaise" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "gatewayRefundId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhook" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "paymentId" TEXT,
    "refundId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMaintenance" (
    "id" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStartedAt" TIMESTAMP(3),
    "lastSucceededAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "PaymentMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_paymentId_key" ON "PaymentRefund"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_idempotencyKey_key" ON "PaymentRefund"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_gatewayRefundId_key" ON "PaymentRefund"("gatewayRefundId");

-- CreateIndex
CREATE INDEX "PaymentRefund_status_nextAttemptAt_idx" ON "PaymentRefund"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "PaymentWebhook_status_nextAttemptAt_idx" ON "PaymentWebhook"("status", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill the expiry of unpaid online checkouts. Late captures enter the refund outbox.
UPDATE "Order" SET "expiresAt" = "createdAt" + INTERVAL '30 minutes'
WHERE "paymentMethod" = 'ONLINE' AND "status" = 'PENDING' AND "paymentStatus" <> 'PAID';
