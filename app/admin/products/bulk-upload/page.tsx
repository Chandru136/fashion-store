import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import BulkUploadClient from "./BulkUploadClient";

export default async function BulkUploadPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role === "CUSTOMER") {
    redirect("/login?callbackUrl=/admin/products/bulk-upload");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-wine-900">Bulk Product Upload</h1>
        <p className="text-sm text-stone-500 mt-1">
          Import multiple products at once from a spreadsheet.
        </p>
      </div>

      <BulkUploadClient />
    </div>
  );
}
