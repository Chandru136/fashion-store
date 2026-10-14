import { NextResponse } from "next/server";
import { canManageCollections } from "@/lib/collection-auth";
import { POST as uploadImage } from "@/app/api/admin/product-images/route";

export async function POST(request: Request) {
  if (!await canManageCollections()) return NextResponse.json({ error: "You don't have permission to upload collection images." }, { status: 403 });
  return uploadImage(request);
}
