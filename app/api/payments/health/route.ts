import { prisma } from "@/lib/db";
import { maintenanceAuthorized } from "@/lib/payments/maintenance-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!maintenanceAuthorized(request)) return new Response(null, { status: 401 });
  try {
    const [worker, failedWebhooks, failedRefunds, staleRefunds, paymentErrors, oldWebhook] = await Promise.all([
      prisma.paymentMaintenance.findUnique({ where: { id: "payments" } }),
      prisma.paymentWebhook.count({ where: { status: "FAILED" } }),
      prisma.paymentRefund.count({ where: { status: "FAILED" } }),
      prisma.paymentRefund.count({ where: { status: { in: ["REQUESTED", "SUBMITTED"] }, createdAt: { lt: new Date(Date.now() - 3600000) } } }),
      prisma.payment.count({ where: { lastError: { not: null } } }),
      prisma.paymentWebhook.count({ where: { status: "PENDING", createdAt: { lt: new Date(Date.now() - 600000) } } }),
    ]);
    const workerStale = !worker?.lastSucceededAt || Date.now() - worker.lastSucceededAt.getTime() > 600000;
    const healthy = !workerStale && !failedWebhooks && !failedRefunds && !staleRefunds && !paymentErrors && !oldWebhook;
    return Response.json({ healthy, workerStale, failedWebhooks, failedRefunds, staleRefunds, paymentErrors, oldWebhook, lastRun: worker?.lastSucceededAt }, { status: healthy ? 200 : 503 });
  } catch { return Response.json({ healthy: false, error: "Database unavailable" }, { status: 503 }); }
}
