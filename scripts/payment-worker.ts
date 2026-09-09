import { runPaymentMaintenance } from "../lib/payments/maintenance.service";
import { prisma } from "../lib/db";
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });
async function main() {
  do {
    try { console.log(JSON.stringify({ event: "payment_maintenance", time: new Date().toISOString(), result: await runPaymentMaintenance() })); }
    catch { console.error(JSON.stringify({ event: "payment_maintenance_failed", time: new Date().toISOString() })); if (process.argv.includes("--once")) process.exitCode = 1; }
    if (process.argv.includes("--once")) break;
    for (let second = 0; second < 60 && !stopping; second++) await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (!stopping);
}
main().finally(() => prisma.$disconnect());
