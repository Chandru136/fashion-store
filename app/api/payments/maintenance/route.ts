import { runPaymentMaintenance } from "@/lib/payments/maintenance.service";
import { maintenanceAuthorized } from "@/lib/payments/maintenance-auth";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  if (!maintenanceAuthorized(request)) return new Response(null, { status: 401 });
  try { return Response.json(await runPaymentMaintenance()); }
  catch { return Response.json({ error: "Maintenance failed" }, { status: 503 }); }
}
