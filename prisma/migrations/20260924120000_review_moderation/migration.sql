-- Previously approved reviews were already public; preserve that visibility.
UPDATE "Review" SET "status" = 'PUBLISHED' WHERE "status" = 'APPROVED';
ALTER TABLE "Review" ALTER COLUMN "status" SET DEFAULT 'PENDING';
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");
