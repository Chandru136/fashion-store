import { PrismaClient } from "@prisma/client";
import { administratorProvisioningInput, provisionInitialAdministrator } from "../prisma/provision-admin";

async function main() {
  administratorProvisioningInput(process.env); // Refuse before constructing a database client.
  const prisma = new PrismaClient();
  try { await provisionInitialAdministrator(prisma, process.env); }
  finally { await prisma.$disconnect(); }
}
main().then(() => console.log("Sudha Collections initial administrator provisioned."))
  .catch(() => { console.error("Sudha Collections administrator provisioning refused or failed. No credentials are printed."); process.exitCode = 1; });
