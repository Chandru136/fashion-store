import { PrismaClient } from "@prisma/client";
import { runSeed } from "./seed-runner";

// Default: non-destructive reference data only. No credentials or demo users.
runSeed(process.env, url => url ? new PrismaClient({ datasourceUrl: url }) : new PrismaClient())
  .then(() => console.log("Sudha Collections seed completed."))
  .catch(() => {
    // Database errors can contain URLs or record contents; never print them here.
    console.error("Sudha Collections seed failed. Check the selected mode and database configuration.");
    process.exitCode = 1;
  });
