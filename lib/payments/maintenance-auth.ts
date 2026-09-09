import { timingSafeEqual } from "node:crypto";
export function maintenanceAuthorized(request: Request) {
  const secret = process.env.PAYMENT_CRON_SECRET || "";
  const actual = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return secret.length >= 32 && Buffer.byteLength(actual) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
