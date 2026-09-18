import { getStorefrontCoupons } from "@/lib/services/storefront-coupon.service";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await getStorefrontCoupons(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Offers are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
