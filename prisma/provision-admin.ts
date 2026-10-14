import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export function administratorProvisioningInput(env: NodeJS.ProcessEnv) {
  const email = env.SUDHA_COLLECTIONS_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SUDHA_COLLECTIONS_ADMIN_PASSWORD;
  if (env.SUDHA_COLLECTIONS_PROVISION_ADMIN !== "true" || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      /@example\.(com|invalid|test)$/.test(email) || !password || password.length < 32 ||
      Buffer.byteLength(password, "utf8") > 72 || /^(.)\1+$/.test(password)) {
    throw new Error("Explicit administrator provisioning requires a real email and a separately supplied unique secret (32 characters minimum, 72 UTF-8 bytes maximum).");
  }
  return { email, password };
}

export async function provisionInitialAdministrator(prisma: Pick<PrismaClient, "$transaction">, env: NodeJS.ProcessEnv) {
  const { email, password } = administratorProvisioningInput(env);
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('sudha_collections_initial_administrator'))`;
    const existing = await tx.user.findFirst({ where: { OR: [{ role: { in: ["ADMIN", "SUPER_ADMIN"] } }, { email }] }, select: { id: true } });
    if (existing) throw new Error("Administrator provisioning refused: an administrator or matching account already exists.");
    await tx.user.create({ data: { email, name: "Sudha Collections Administrator", passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" } });
  });
}
