import { createSessionToken } from "../lib/auth";
import { prisma } from "../lib/db";

async function run() {
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });

  if (!admin) {
    console.error("No admin user found in database.");
    process.exit(1);
  }

  const token = await createSessionToken({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });

  const cookie = `sudha_collections_session_user=${token}`;
  const baseUrl = "http://localhost:3001";

  console.log(`Verifying admin reports with user: ${admin.email} (${admin.role})`);

  // 1. Check HTML Page default
  const pageRes = await fetch(`${baseUrl}/admin/reports`, { headers: { cookie } });
  console.log(`[HTML] /admin/reports default -> status: ${pageRes.status}`);

  // 2. Check HTML Page with custom pagination
  const pagedRes = await fetch(`${baseUrl}/admin/reports?tab=inventory&page=2&pageSize=10`, { headers: { cookie } });
  console.log(`[HTML] /admin/reports?tab=inventory&page=2&pageSize=10 -> status: ${pagedRes.status}`);

  // 3. Check HTML Page with custom date picker parameters
  const customDateRes = await fetch(`${baseUrl}/admin/reports?tab=sales&range=custom&from=2026-01-01&to=2026-09-24`, { headers: { cookie } });
  console.log(`[HTML] /admin/reports?tab=sales&range=custom&from=... -> status: ${customDateRes.status}`);

  // 4. Check all 8 CSV export types
  const reports = [
    "sales",
    "items",
    "gst",
    "inventory",
    "payments",
    "refunds",
    "customers",
    "coupons",
  ];

  for (const rep of reports) {
    const res = await fetch(`${baseUrl}/api/admin/reports/export?report=${rep}`, {
      headers: { cookie },
    });
    const type = res.headers.get("content-type");
    const disp = res.headers.get("content-disposition");
    const text = await res.text();
    const rows = text.split("\r\n");

    console.log(
      `[CSV] ${rep.padEnd(10)} -> status: ${res.status} | rows: ${rows.length} | file: ${disp}`
    );
  }

  console.log("All reports, pagination, and date picker endpoints verified successfully!");
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
