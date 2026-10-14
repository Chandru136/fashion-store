import type { PrismaClient } from "@prisma/client";
import { seedReferenceData } from "./seed-reference";
import { requireDevelopmentSeed } from "./seed-policy";

export async function runSeed(env: NodeJS.ProcessEnv, createClient: (url?: string) => PrismaClient,
  loadDevelopment = () => import("./seed-development")) {
  const mode = env.SUDHA_COLLECTIONS_SEED_MODE || "reference";
  if (!["reference", "development"].includes(mode)) throw new Error("Unknown Sudha Collections seed mode.");
  const url = mode === "development" ? requireDevelopmentSeed(env) : undefined;
  const prisma = createClient(url);
  try {
    if (mode === "reference") await seedReferenceData(prisma);
    else await (await loadDevelopment()).seedDevelopmentData(prisma, env);
  } finally { await prisma.$disconnect(); }
}
