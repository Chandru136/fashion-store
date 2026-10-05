CREATE TABLE "HomepageContent" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomepageContent_pkey" PRIMARY KEY ("id")
);
