import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Hot reload preserves the global client even after Prisma is regenerated.
// Replace clients created before the current CMS models were added.
const cachedPrisma = globalForPrisma.prisma?.homepageContent && globalForPrisma.prisma?.messageTemplate && globalForPrisma.prisma?.customerMessageDelivery
  ? globalForPrisma.prisma
  : undefined;

export const prisma =
  cachedPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
