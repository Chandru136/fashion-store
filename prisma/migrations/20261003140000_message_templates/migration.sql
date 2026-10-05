CREATE TABLE "MessageTemplate" (
 "id" TEXT NOT NULL, "name" TEXT NOT NULL, "subject" TEXT NOT NULL, "body" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CustomerMessageDelivery" (
 "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "customerId" TEXT NOT NULL, "templateId" TEXT NOT NULL,
 "actorId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'SENDING',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CustomerMessageDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerMessageDelivery_requestId_customerId_key" ON "CustomerMessageDelivery"("requestId", "customerId");
CREATE INDEX "CustomerMessageDelivery_templateId_createdAt_idx" ON "CustomerMessageDelivery"("templateId", "createdAt");
